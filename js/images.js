/* Everything to do with putting a picture on the page.
 *
 * Each artwork exists at three widths on disk (images/500, images/700,
 * images/1400). This module decides which one an <img> should load, builds the
 * srcset so the browser can pick a sharper file on a retina screen, and states
 * the width and height so the page does not jump about while pictures load.
 *
 * Plain JavaScript, no libraries.
 */

// The generated widths under images/, smallest first.
const WIDTHS = ['500', '700', '1400'];

// Clicking a picture opens this width.
const LIGHTBOX_WIDTH = '1400';

/* -------------------------------------------------------------------------
 * the image manifest
 * ---------------------------------------------------------------------- */

let manifestRequest = null;

/** Load content/images.json once, however many times this is called. */
export function loadImageSizes() {
	if (!manifestRequest) {
		manifestRequest = fetch('/content/images.json').then(response => {
			if (!response.ok) throw new Error(`images.json: ${response.status}`);
			return response.json();
		});
	}
	return manifestRequest;
}

/* -------------------------------------------------------------------------
 * how wide a picture is shown
 *
 * css/style.css is the single source of truth. --width-large and
 * --width-medium are read straight from it, so changing a size there is all
 * that is needed -- the number is never written down twice.
 * ---------------------------------------------------------------------- */

/** Read a CSS custom property as a number of pixels. Custom properties come
 *  back unresolved, so "1.25rem" has to be converted by hand. */
function cssLength(name, fallback) {
	const root = document.documentElement;
	const raw = getComputedStyle(root).getPropertyValue(name).trim();
	if (!raw) return fallback;

	const value = parseFloat(raw);
	if (Number.isNaN(value)) return fallback;

	if (raw.endsWith('rem')) {
		return value * parseFloat(getComputedStyle(root).fontSize);
	}
	return value;
}

let displaySizes = null;

/** {large: {width, sizes}, medium: {...}, full: {...}} */
function sizesForClasses() {
	if (displaySizes) return displaySizes;

	const gutter = cssLength('--page-gutter', 20);
	const large = cssLength('--width-large', 700);
	const medium = cssLength('--width-medium', 500);

	// Below (width + both gutters) the picture runs gutter to gutter instead.
	const hint = width =>
		`(max-width: ${width + 2 * gutter}px) calc(100vw - ${(2 * gutter) / 16}rem), ${width}px`;

	displaySizes = {
		large: { width: large, sizes: hint(large) },
		medium: { width: medium, sizes: hint(medium) },
		full: { width: medium, sizes: hint(medium) },
	};
	return displaySizes;
}

/** The smallest generated width that still covers the displayed size. Uses each
 *  file's real width, so a master narrower than its tier is judged on what it
 *  actually is -- pictures are never scaled up. */
function baseTier(displayWidth, record) {
	for (const tier of WIDTHS) {
		if (record[tier][0] >= displayWidth) return tier;
	}
	return WIDTHS[WIDTHS.length - 1];
}

/* -------------------------------------------------------------------------
 * markup
 * ---------------------------------------------------------------------- */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(text) {
	return String(text).replace(/[&<>"']/g, character => ESCAPES[character]);
}

/** Use a proper multiplication sign in dimensions like "103 x 97". */
export function typographic(text) {
	return String(text).replace(/(?<=\d)\s*[xX]\s*(?=\d)/g, ' × ');
}

/**
 * One artwork: a responsive <img> wrapped in a link the lightbox picks up.
 *
 * item     {file, size, caption[], alt}
 * manifest the parsed images.json
 */
export function figureHTML(item, manifest, inner = false) {
	const name = item.file;
	const record = manifest[name];
	if (!record) {
		console.warn(`No generated sizes for ${name} — run tools/generate-sizes.py`);
		return '';
	}

	const size = item.size || 'large';
	const display = sizesForClasses()[size] || sizesForClasses().large;

	// One candidate per distinct real width, so an image is never advertised as
	// bigger than it is.
	const candidates = new Map();
	for (const tier of WIDTHS) {
		const width = record[tier][0];
		if (!candidates.has(width)) candidates.set(width, `/images/${tier}/${name} ${width}w`);
	}
	const srcset = [...candidates.keys()].sort((a, b) => a - b)
		.map(width => candidates.get(width)).join(', ');

	const tier = baseTier(display.width, record);
	const [width, height] = record[tier];

	const caption = (item.caption || []).map(typographic);

	// The caption is the master: it is both what is printed under the picture
	// and what a screen reader announces, so the wording is only written once.
	// `alt` is only consulted for a picture that has no caption -- the two art
	// book spreads, and one-off <figure data-image> pictures written into a page.
	const alt = typographic(caption.join(' ') || item.alt || '');

	const figcaption = caption.length
		? `\n\t<figcaption class="artwork__caption">${caption.map(escapeHtml).join('<br>')}</figcaption>`
		: '';

	const picture = `<a class="artwork__link" href="/images/${LIGHTBOX_WIDTH}/${encodeURIComponent(name)}">
		<img src="/images/${tier}/${encodeURIComponent(name)}"
		     srcset="${escapeHtml(srcset)}"
		     sizes="${escapeHtml(display.sizes)}"
		     width="${width}" height="${height}"
		     alt="${escapeHtml(alt)}"
		     loading="lazy" decoding="async">
	</a>`;

	// `inner` asks for just the linked picture, for callers that supply their
	// own wrapper; otherwise it comes wrapped in a captioned <figure>.
	if (inner) return picture;

	return `<figure class="artwork artwork--${escapeHtml(size)}">
	${picture}${figcaption}
</figure>`;
}

/**
 * Fill in any one-off picture written straight into a page, e.g.
 *
 *   <figure class="artwork artwork--medium" data-image="business-card.png"
 *           data-alt="…"></figure>
 *
 * The element keeps its own classes and only its contents are filled in, so a
 * picture can be dropped into any design without inheriting the gallery's
 * figure styling. `data-size` ("large" or "medium") sets which width is asked
 * for; it defaults to medium.
 */
export function renderStandaloneImages(manifest, root = document) {
	for (const element of root.querySelectorAll('[data-image]')) {
		const size = element.dataset.size
			|| (element.classList.contains('artwork--large') ? 'large' : 'medium');

		const html = figureHTML({
			file: element.dataset.image,
			size,
			caption: element.dataset.caption ? [element.dataset.caption] : [],
			alt: element.dataset.alt || '',
		}, manifest, true);

		if (html) {
			element.innerHTML = html;
			element.removeAttribute('data-image');
		}
	}
}
