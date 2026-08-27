/* The parts every page shares: the header with the navigation, and the footer.
 *
 * They live here rather than being copied into all four HTML files, so a change
 * to the navigation is a change in one place.
 *
 * Plain JavaScript, no libraries.
 */

const SITE_TITLE = 'Kaiju Haanpää';
const SITE_TAGLINE = 'Textile collages';

// Every page in the site, in the order they appear in the navigation.
// Add a page here and it appears in the menu everywhere.
const NAV = [
	{ href: '/', label: 'Gallery' },
	{ href: '/books/', label: 'Books' },
	{ href: '/cv/', label: 'CV' },
	{ href: '/contact/', label: 'Contact' },
];

// The banner across the top of every page: a detail from one of the collages.
// Change these four values to use a different picture -- the files live in
// images/header/ and are cut from a master with tools/make-banner.sh.
const BANNER = {
	// [file, its real width]. The browser picks whichever suits the screen.
	sources: [
		['/images/header/banner-780.jpg', 780],
		['/images/header/banner-1100.jpg', 1100],
		['/images/header/banner-1556.jpg', 1556],
	],
	width: 1556,
	height: 700,
	alt: 'Päiväperho (Belle de Jour), 1999 — detail',
};

const HEADER = `
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
	<div class="site-banner">
		<img class="site-banner__image"
		     src="${BANNER.sources[0][0]}"
		     srcset="${BANNER.sources.map(([file, width]) => `${file} ${width}w`).join(', ')}"
		     sizes="100vw"
		     width="${BANNER.width}" height="${BANNER.height}"
		     alt="${BANNER.alt}">
		<div class="site-banner__caption">
			<a class="site-header__title" href="/">${SITE_TITLE}</a>
			<p class="site-header__tagline">${SITE_TAGLINE}</p>
		</div>
	</div>

	<nav class="site-nav" aria-label="Main">
		<ul>
${NAV.map(item => `\t\t\t<li><a href="${item.href}">${item.label}</a></li>`).join('\n')}
		</ul>
	</nav>
</header>`;

const FOOTER = `
<footer class="site-footer">
	<p>© ${SITE_TITLE}. All works and images are the property of the artist.</p>
</footer>`;

/** Which nav entry does this URL belong to? Longest matching href wins, so
 *  /books/ beats the "/" entry. */
function currentPage(pathname) {
	let best = null;
	for (const item of NAV) {
		const matches = item.href === '/'
			? pathname === '/' || pathname.endsWith('/index.html') && pathname.split('/').length === 2
			: pathname.startsWith(item.href);
		if (matches && (!best || item.href.length > best.href.length)) {
			best = item;
		}
	}
	return best;
}

/** Put the header and footer on the page and mark the current section. */
export function mountShell() {
	document.body.insertAdjacentHTML('afterbegin', HEADER);
	document.body.insertAdjacentHTML('beforeend', FOOTER);

	const here = currentPage(location.pathname);
	if (!here) return;

	const link = document.querySelector(`.site-nav a[href="${here.href}"]`);
	if (link) {
		link.classList.add('is-current');
		link.setAttribute('aria-current', 'page');
	}
}
