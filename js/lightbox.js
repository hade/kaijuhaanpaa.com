/* Lightbox for the artwork images.
 *
 * Every artwork is a plain link to its large image. This intercepts the click
 * and shows the picture in an overlay instead, with arrow-key navigation.
 *
 * Clicks are handled on the document rather than bound to each link, so this
 * works no matter when the pictures are added to the page.
 *
 * Each picture has its own web address — /work/<name>/ — and opening one puts
 * that in the address bar. So the address bar, the copy button and a shared
 * link are all the same thing, and any of them can be pasted with the right
 * preview. The Back button closes the overlay rather than leaving the page.
 *
 * Plain JavaScript, no libraries.
 */

let overlay, image, caption, prevButton, nextButton, closeButton, copyButton;
let links = [];
let current = -1;
let lastFocused = null;

// True when opening the overlay added an entry to the browser history, so we
// know whether closing it should step back or just tidy the address bar.
let pushedState = false;

/* -------------------------------------------------------------------------
 * the overlay, built once on first use
 * ---------------------------------------------------------------------- */

function build() {
	if (overlay) return;

	overlay = document.createElement('div');
	overlay.className = 'lightbox';
	overlay.hidden = true;
	overlay.setAttribute('role', 'dialog');
	overlay.setAttribute('aria-modal', 'true');
	overlay.setAttribute('aria-label', 'Artwork viewer');

	overlay.innerHTML =
		'<button class="lightbox__button lightbox__close" type="button" aria-label="Close">×</button>' +
		'<button class="lightbox__button lightbox__button--prev" type="button" aria-label="Previous artwork">‹</button>' +
		'<img class="lightbox__image" alt="">' +
		'<div class="lightbox__footer">' +
			'<p class="lightbox__caption"></p>' +
			'<button class="lightbox__copy" type="button">Copy link to this work</button>' +
		'</div>' +
		'<button class="lightbox__button lightbox__button--next" type="button" aria-label="Next artwork">›</button>';

	document.body.appendChild(overlay);

	image = overlay.querySelector('.lightbox__image');
	caption = overlay.querySelector('.lightbox__caption');
	prevButton = overlay.querySelector('.lightbox__button--prev');
	nextButton = overlay.querySelector('.lightbox__button--next');
	closeButton = overlay.querySelector('.lightbox__close');
	copyButton = overlay.querySelector('.lightbox__copy');

	prevButton.addEventListener('click', event => { event.stopPropagation(); show(current - 1); });
	nextButton.addEventListener('click', event => { event.stopPropagation(); show(current + 1); });
	closeButton.addEventListener('click', event => { event.stopPropagation(); close(); });
	copyButton.addEventListener('click', event => { event.stopPropagation(); copyLink(); });

	// Clicking the backdrop closes; clicking the picture or the caption does not.
	overlay.addEventListener('click', event => {
		if (!event.target.closest('.lightbox__image, .lightbox__footer')) close();
	});
}

/* -------------------------------------------------------------------------
 * addresses
 * ---------------------------------------------------------------------- */

/* One address per picture, used everywhere: while browsing, in the address bar,
 * and by the copy button. It is the picture's own page under work/, which is
 * also the only form that previews correctly when pasted into a message.
 *
 * The older form -- the gallery address with #name on the end -- still opens
 * the right picture, so links already shared keep working; they are simply not
 * produced any more.
 */
const workUrl = id => `/work/${id}/`;

// The page the viewer is sitting over: the gallery, or the books page. A share
// page under work/ is not itself that page, so it names it in data-home.
// Captured before any address is rewritten.
let homePath = '/';

function idFor(link) {
	const figure = link.closest('figure');
	return figure && figure.id ? figure.id : '';
}

/** The address to hand out for the picture on show — the same one the address
 *  bar is already displaying. */
function shareableLink() {
	const link = links[current];
	const id = link ? idFor(link) : '';
	return id ? location.origin + workUrl(id) : location.href;
}

async function copyLink() {
	const original = copyButton.textContent;
	try {
		await navigator.clipboard.writeText(shareableLink());
		copyButton.textContent = 'Link copied';
	} catch {
		// Clipboard access can be refused; select the address bar instead.
		copyButton.textContent = 'Press ⌘C to copy the address';
	}
	setTimeout(() => { copyButton.textContent = original; }, 2000);
}

/* -------------------------------------------------------------------------
 * showing pictures
 * ---------------------------------------------------------------------- */

/** Copy the caption from under the picture into the viewer.
 *
 *  The nodes are cloned rather than the text read out, because a caption can
 *  run to several lines -- a book gives its title, ISBN and genre on separate
 *  ones -- and those breaks are <br> elements that contribute no text at all.
 *  Reading textContent would run the lines together with nothing between them.
 */
function showCaptionOf(link) {
	caption.replaceChildren();
	const source = link.closest('figure')?.querySelector('.artwork__caption');
	if (!source) return;
	for (const node of source.childNodes) {
		caption.appendChild(node.cloneNode(true));
	}
}

function show(index) {
	if (index < 0 || index >= links.length) return;
	current = index;

	const link = links[index];
	const thumbnail = link.querySelector('img');

	image.src = link.getAttribute('href');
	image.alt = thumbnail ? thumbnail.alt : '';
	showCaptionOf(link);

	prevButton.hidden = index === 0;
	nextButton.hidden = index === links.length - 1;

	// Keep the address in step while arrowing along, without filling the
	// history with one entry per picture.
	const id = idFor(link);
	if (id) history.replaceState({ lightbox: id }, '', workUrl(id));
}

function collect() {
	links = [...document.querySelectorAll('.artwork__link')];
}

function reveal(index) {
	build();
	lastFocused = document.activeElement;
	show(index);
	overlay.hidden = false;
	document.body.style.overflow = 'hidden';   // stop the page behind scrolling
	closeButton.focus();
}

function open(link) {
	build();
	collect();
	const index = links.indexOf(link);
	if (index === -1) return;

	// A new history entry, so Back closes the overlay instead of leaving.
	const id = idFor(link);
	if (id) {
		history.pushState({ lightbox: id }, '', workUrl(id));
		pushedState = true;
	}
	reveal(index);
}

/** Open the picture named in the address, if there is one. Called once the
 *  page's pictures have been rendered. */
export function openFromHash() {
	return openWork(decodeURIComponent(location.hash.slice(1)));
}

/** Open one particular picture, by the id on its <figure>. */
export function openWork(id) {
	if (!id) return false;

	// Only an artwork opens the viewer. Year headings share the same address
	// space (#1996), and those should just scroll.
	const figure = document.getElementById(id);
	if (!figure || !figure.matches('figure.artwork')) return false;

	const link = figure.querySelector('.artwork__link');
	if (!link) return false;

	collect();
	const index = links.indexOf(link);
	if (index === -1) return false;

	figure.scrollIntoView();
	// Arrived on this address, so there is nothing to step back to.
	pushedState = false;
	reveal(index);
	return true;
}

function hide() {
	if (!overlay || overlay.hidden) return;
	overlay.hidden = true;
	image.removeAttribute('src');
	document.body.style.overflow = '';
	if (lastFocused) lastFocused.focus();
	current = -1;
}

function close() {
	hide();
	if (pushedState) {
		pushedState = false;
		history.back();             // undo the entry that opening added
	} else {
		// Arrived straight on a share page, so there is nothing to go back to;
		// put the address back to the page now on screen.
		history.replaceState(null, '', homePath);
	}
}

/* -------------------------------------------------------------------------
 * events
 * ---------------------------------------------------------------------- */

export function initLightbox() {
	// Before anything rewrites the address.
	homePath = document.body.dataset.home || location.pathname + location.search;

	document.addEventListener('click', event => {
		// Leave modified clicks alone so "open in new tab" keeps working.
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
			return;
		}
		const link = event.target.closest?.('.artwork__link');
		if (!link) return;

		event.preventDefault();
		open(link);
	});

	// Back closes the overlay; forward, or a pasted link, reopens it.
	window.addEventListener('popstate', () => {
		if (overlay && !overlay.hidden) {
			hide();
		} else {
			openFromHash();
		}
	});

	document.addEventListener('keydown', event => {
		if (!overlay || overlay.hidden) return;

		if (event.key === 'Escape') {
			close();
		} else if (event.key === 'ArrowLeft') {
			show(current - 1);
		} else if (event.key === 'ArrowRight') {
			show(current + 1);
		} else if (event.key === 'Tab') {
			// Keep focus inside the overlay while it is open.
			const focusable = [...overlay.querySelectorAll('button')].filter(button => !button.hidden);
			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}
	});
}
