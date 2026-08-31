#!/usr/bin/env python3
"""Write one small page per artwork, under work/<name>/.

    python3 tools/make-work-pages.py

Why these exist
---------------
A link like kaijuhaanpaa.com/#2023-runotar-the-muse-90-x-97 opens the right
picture in a browser, but it cannot produce a correct preview in WhatsApp or
Facebook. The part of an address after "#" is never sent to the server, so a
preview crawler asking for that link receives the plain gallery page and shows
whatever picture it finds there -- the same one every time.

A page at its own address solves that: work/<name>/ is a real address, so the
crawler receives that page and reads the preview picture named in its head.

What they contain
-----------------
The gallery (or the books page), with the viewer already open on that one work
-- exactly what a visitor would see had they clicked the picture themselves.
The arrow keys step through every work, and closing the viewer leaves them
among the rest rather than on a page holding a single picture.

Each page differs from the gallery only in its head, which names that work for
the preview, and in the data-open attribute on <body>, which tells js/site.js
which picture to show.

These pages are generated. Do not edit them by hand -- edit content/gallery.json
or content/books.json and run this again (or just run tools/update.sh).
"""
import html
import json
import os
import re
import shutil
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT = os.path.join(ROOT, 'work')

SITE = 'https://kaijuhaanpaa.com'
SITE_TITLE = 'Kaiju Haanpää'

# Preview crawlers refuse very large images, and several stop around 600 KB.
# The 700px copies average 146 KB, so they are the right ones to advertise.
PREVIEW_WIDTH = '700'
WIDTHS = ('500', '700', '1400')

esc = lambda text: html.escape(str(text), quote=True)


def load(name):
    with open(os.path.join(ROOT, 'content', name), encoding='utf-8') as fh:
        return json.load(fh)


def slug_for(filename):
    """Matches slugFor() in js/images.js -- the two must agree."""
    stem = re.sub(r'\.(jpe?g|png)$', '', filename, flags=re.I)
    stem = unicodedata.normalize('NFD', stem)
    stem = ''.join(c for c in stem if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', stem.lower()).strip('-')


def typographic(text):
    return re.sub(r'(?<=\d)\s*[xX]\s*(?=\d)', ' × ', str(text))


def page(item, record, home):
    """One work page. `home` is the page it belongs to: "/" or "/books/"."""
    name = item['file']
    slug = slug_for(name)
    caption = [typographic(line) for line in item.get('caption') or []]

    heading = caption[0] if caption else typographic(item.get('alt') or name)
    rest = ' · '.join(caption[1:]) if len(caption) > 1 else ''
    description = f'{heading}. {rest}'.strip().rstrip('.') if rest else heading
    description = f'{description} — textile collage by {SITE_TITLE}.'

    address = f'{SITE}/work/{slug}/'
    preview = f'{SITE}/images/{PREVIEW_WIDTH}/{name}'
    width, height = record[PREVIEW_WIDTH]

    # The page behind the viewer is the one this work belongs to, so closing
    # the viewer leaves the visitor among all the other works.
    if home == '/':
        render, page_title = 'gallery', 'Gallery'
        index_markup = ('\t\t<nav class="year-index" aria-label="Jump to year" '
                        'data-render="year-index"></nav>\n')
    else:
        render, page_title = 'books', 'Books'
        index_markup = ''

    return f'''<!DOCTYPE html>
<!--
	GENERATED FILE — do not edit.

	Written by tools/make-work-pages.py from content/gallery.json and
	content/books.json. Change the caption there and run tools/update.sh.
-->
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">

	<title>{esc(heading)} — {esc(SITE_TITLE)}</title>
	<meta name="description" content="{esc(description)}">
	<link rel="canonical" href="{esc(address)}">

	<meta property="og:type" content="article">
	<meta property="og:site_name" content="{esc(SITE_TITLE)}">
	<meta property="og:title" content="{esc(heading)}">
	<meta property="og:description" content="{esc(description)}">
	<meta property="og:url" content="{esc(address)}">
	<meta property="og:image" content="{esc(preview)}">
	<meta property="og:image:width" content="{width}">
	<meta property="og:image:height" content="{height}">
	<meta property="og:image:alt" content="{esc(heading)}">
	<meta name="twitter:card" content="summary_large_image">

	<link rel="stylesheet" href="/css/style.css">
</head>
<body data-open="{esc(slug)}" data-home="{esc(home)}">
	<main id="main" class="page">
		<header class="page-header">
			<h1 class="page-title">{esc(page_title)}</h1>
		</header>
{index_markup}
		<div data-render="{esc(render)}"></div>
	</main>

	<script type="module" src="/js/site.js"></script>
</body>
</html>
'''


def main():
    manifest = load('images.json')

    works = []
    for group in load('gallery.json'):
        for item in group['items']:
            works.append((item, '/'))
    for item in load('books.json'):
        works.append((item, '/books/'))

    os.makedirs(OUTPUT, exist_ok=True)

    written, missing = 0, []
    wanted = set()

    for item, home in works:
        record = manifest.get(item['file'])
        if not record:
            missing.append(item['file'])
            continue

        slug = slug_for(item['file'])
        wanted.add(slug)
        folder = os.path.join(OUTPUT, slug)
        os.makedirs(folder, exist_ok=True)

        contents = page(item, record, home)
        path = os.path.join(folder, 'index.html')

        # Only touch the file if it would actually differ, so re-running does
        # not fill the repository's history with identical rewrites.
        if not os.path.exists(path) or open(path, encoding='utf-8').read() != contents:
            with open(path, 'w', encoding='utf-8') as fh:
                fh.write(contents)
            written += 1

    # Remove pages for artworks that are no longer on the site.
    removed = 0
    for entry in sorted(os.listdir(OUTPUT)):
        if entry.startswith('.'):
            continue
        if entry not in wanted and os.path.isdir(os.path.join(OUTPUT, entry)):
            shutil.rmtree(os.path.join(OUTPUT, entry))
            removed += 1

    print(f'work pages: {len(wanted)} in total, {written} written, {removed} removed')
    for name in missing:
        print(f'  SKIPPED (no generated sizes): {name}')
    return 1 if missing else 0


if __name__ == '__main__':
    sys.exit(main())
