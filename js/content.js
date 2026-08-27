/* Turning the data files into page content.
 *
 * Each renderer takes the parsed JSON and fills an element. The class names
 * produced here are the ones css/style.css already styles -- markup and styling
 * stay in their own places.
 *
 * Plain JavaScript, no libraries.
 */

import { figureHTML, escapeHtml, loadImageSizes } from './images.js';

/** Fetch and parse one of the files in content/. */
async function loadData(name) {
	const response = await fetch(`/content/${name}`);
	if (!response.ok) throw new Error(`${name}: ${response.status}`);
	return response.json();
}

/** An id for a year heading, so /#1996 works. Matches the old build script. */
function slug(text) {
	return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/* -------------------------------------------------------------------------
 * Gallery
 * ---------------------------------------------------------------------- */

export async function renderGallery(target) {
	const [groups, manifest] = await Promise.all([loadData('gallery.json'), loadImageSizes()]);
	const years = groups.filter(group => group.items.length);

	target.innerHTML = years.map(group => {
		const heading = group.year
			? `\n<h2 class="year__title">${escapeHtml(group.year)}</h2>`
			: '';
		const figures = group.items.map(item => figureHTML(item, manifest)).join('\n');
		return `<section class="year" id="${slug(group.year)}">${heading}\n${figures}\n</section>`;
	}).join('\n');

	// The list of years at the top of the page, if this page has one.
	const index = document.querySelector('[data-render="year-index"]');
	if (index) {
		const links = years.filter(group => group.year).map(group =>
			`<li><a href="#${slug(group.year)}">${escapeHtml(group.year)}</a></li>`);
		index.innerHTML = `<ul>\n${links.join('\n')}\n</ul>`;
	}
}

/* -------------------------------------------------------------------------
 * Books
 * ---------------------------------------------------------------------- */

export async function renderBooks(target) {
	const [books, manifest] = await Promise.all([loadData('books.json'), loadImageSizes()]);
	target.innerHTML = books.map(item => figureHTML(item, manifest)).join('\n');
}

/* -------------------------------------------------------------------------
 * CV
 *
 * A section holds either "text" (one paragraph) or "entries". An entry is
 * {year?, title?, detail}: the year is printed once above the entries that
 * share it, the title is set in italics, the detail follows.
 * ---------------------------------------------------------------------- */

function cvSection(section) {
	const heading =
		`<h2 class="cv__heading" id="${slug(section.heading)}">${escapeHtml(section.heading)}</h2>`;

	if (section.text) {
		return `${heading}\n<p class="cv__prose">${escapeHtml(section.text)}</p>`;
	}

	const lines = [];
	let previousYear = null;

	for (const entry of section.entries || []) {
		const year = entry.year || '';
		if (year && year !== previousYear) {
			lines.push(`<li class="cv__year">${escapeHtml(year)}</li>`);
		}
		previousYear = year;

		const pieces = [];
		if (entry.title) pieces.push(`<em class="cv__title">${escapeHtml(entry.title)}</em>`);
		if (entry.detail) pieces.push(escapeHtml(entry.detail));
		lines.push(`<li>${pieces.join(', ')}</li>`);
	}

	return `${heading}\n<ul class="cv__list">\n${lines.join('\n')}\n</ul>`;
}

export async function renderCv(target) {
	const cv = await loadData('cv.json');

	const intro = `<p class="cv__intro">${cv.intro.map(escapeHtml).join('<br>')}</p>`;
	const sections = cv.sections.map(cvSection).join('\n\n');

	target.innerHTML = `${intro}\n\n${sections}`;
}
