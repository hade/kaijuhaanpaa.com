/* Entry point. Every page loads this one file:
 *
 *     <script type="module" src="/js/site.js"></script>
 *
 * It puts the shared header and footer in place, then fills in whatever the
 * page asked for with a data-render attribute:
 *
 *     <div data-render="gallery"></div>
 *
 * Plain JavaScript, no libraries, no build step.
 */

import { mountShell } from './shell.js';
import { renderGallery, renderBooks, renderCv } from './content.js';
import { loadImageSizes, renderStandaloneImages } from './images.js';
import { initLightbox } from './lightbox.js';

const RENDERERS = {
	gallery: renderGallery,
	books: renderBooks,
	cv: renderCv,
	// "year-index" is filled in by renderGallery, so it needs no renderer here.
	'year-index': null,
};

/** The page is otherwise blank if something fails, so say so rather than
 *  leaving the visitor staring at nothing. */
function showFailure(element, error) {
	console.error(error);
	element.innerHTML =
		'<p class="load-error">Sorry — this content could not be loaded. ' +
		'Please refresh the page.</p>';
}

/** The browser scrolls to #1996 while loading, but our sections do not exist
 *  yet at that point. Once they do, go there. */
function scrollToHash() {
	if (!location.hash) return;
	const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
	if (target) target.scrollIntoView();
}

async function start() {
	mountShell();

	const jobs = [];
	for (const element of document.querySelectorAll('[data-render]')) {
		const renderer = RENDERERS[element.dataset.render];
		if (renderer) {
			jobs.push(renderer(element).catch(error => showFailure(element, error)));
		}
	}

	// One-off pictures written directly into a page, e.g. on the Contact page.
	if (document.querySelector('[data-image]')) {
		jobs.push(
			loadImageSizes()
				.then(manifest => renderStandaloneImages(manifest))
				.catch(error => console.error(error))
		);
	}

	await Promise.all(jobs);

	scrollToHash();
}

initLightbox();   // delegated, so it works no matter when pictures appear
start();
