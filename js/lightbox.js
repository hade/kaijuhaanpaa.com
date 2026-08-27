/* Lightbox for the artwork images.
 *
 * Every artwork is a plain link to its large image. This intercepts the click
 * and shows the picture in an overlay instead, with arrow-key navigation.
 *
 * Clicks are handled on the document rather than bound to each link, so this
 * works no matter when the pictures are added to the page.
 *
 * Plain JavaScript, no libraries.
 */

let overlay, image, caption, prevButton, nextButton, closeButton;
let links = [];
let current = -1;
let lastFocused = null;

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
		'<p class="lightbox__caption"></p>' +
		'<button class="lightbox__button lightbox__button--next" type="button" aria-label="Next artwork">›</button>';

	document.body.appendChild(overlay);

	image = overlay.querySelector('.lightbox__image');
	caption = overlay.querySelector('.lightbox__caption');
	prevButton = overlay.querySelector('.lightbox__button--prev');
	nextButton = overlay.querySelector('.lightbox__button--next');
	closeButton = overlay.querySelector('.lightbox__close');

	prevButton.addEventListener('click', event => { event.stopPropagation(); show(current - 1); });
	nextButton.addEventListener('click', event => { event.stopPropagation(); show(current + 1); });
	closeButton.addEventListener('click', event => { event.stopPropagation(); close(); });

	// Clicking the backdrop closes; clicking the picture itself does not.
	overlay.addEventListener('click', event => {
		if (event.target !== image) close();
	});
}

/* -------------------------------------------------------------------------
 * showing pictures
 * ---------------------------------------------------------------------- */

function captionFor(link) {
	const text = link.closest('figure')?.querySelector('.artwork__caption');
	return text ? text.textContent.trim().replace(/\s+/g, ' ') : '';
}

function show(index) {
	if (index < 0 || index >= links.length) return;
	current = index;

	const link = links[index];
	const thumbnail = link.querySelector('img');

	image.src = link.getAttribute('href');
	image.alt = thumbnail ? thumbnail.alt : '';
	caption.textContent = captionFor(link);

	prevButton.hidden = index === 0;
	nextButton.hidden = index === links.length - 1;
}

function open(link) {
	build();
	// Collect the pictures as they are right now, so the arrow keys walk
	// through whatever the page currently holds.
	links = [...document.querySelectorAll('.artwork__link')];

	const index = links.indexOf(link);
	if (index === -1) return;

	lastFocused = document.activeElement;
	show(index);
	overlay.hidden = false;
	document.body.style.overflow = 'hidden';   // stop the page behind scrolling
	closeButton.focus();
}

function close() {
	overlay.hidden = true;
	image.removeAttribute('src');
	document.body.style.overflow = '';
	if (lastFocused) lastFocused.focus();
	current = -1;
}

/* -------------------------------------------------------------------------
 * events
 * ---------------------------------------------------------------------- */

export function initLightbox() {
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
