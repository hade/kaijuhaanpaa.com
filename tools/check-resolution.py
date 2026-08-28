#!/usr/bin/env python3
"""Report which masters in images/original/ are too small to look sharp.

    python3 tools/check-resolution.py

A picture is shown at one of two widths on the site, and a modern phone or
laptop packs two screen pixels into every one of those, so a master needs to be
twice the width it is displayed at to look truly crisp:

    shown "medium" (500px wide)  ->  wants a master 1000px wide or more
    shown "large"  (700px wide)  ->  wants a master 1400px wide or more

Anything narrower still works -- nothing is ever upscaled -- but it will look
slightly soft on a good screen. Below the display width itself, the picture
cannot even be shown at its intended size and is the most worth rescanning.

Re-run this after dropping better scans into images/original/ and running
tools/generate-sizes.py.
"""
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Keep these in step with --width-large / --width-medium in css/style.css.
DISPLAY_WIDTH = {'large': 700, 'medium': 500, 'full': 500}
RETINA = 2

# Anything within this much of the ideal is indistinguishable in practice, so
# it is not worth listing.
CLOSE_ENOUGH = 0.9


def load(name):
    with open(os.path.join(ROOT, 'content', name), encoding='utf-8') as fh:
        return json.load(fh)


def nfc(text):
    """macOS reports filenames decomposed; compare everything composed."""
    return unicodedata.normalize('NFC', text)


def display_sizes():
    """Which display size each picture is used at, and where it is asked for."""
    sizes, sources = {}, {}

    for group in load('gallery.json'):
        for item in group['items']:
            name = nfc(item['file'])
            sizes[name] = item.get('size', 'large')
            sources[name] = f"gallery.json, {group['year'] or 'no year'}"

    for item in load('books.json'):
        name = nfc(item['file'])
        sizes[name] = item.get('size', 'medium')
        sources[name] = 'books.json'

    # Pictures written straight into a page carry data-image="..." there.
    for page in ('index.html', 'books/index.html', 'cv/index.html', 'contact/index.html'):
        path = os.path.join(ROOT, page)
        if not os.path.exists(path):
            continue
        html = open(path, encoding='utf-8').read()
        html = re.sub(r'(?s)<!--.*?-->', '', html)      # ignore comments
        for name in re.findall(r'data-image="([^"]+)"', html):
            sizes.setdefault(nfc(name), 'medium')
            sources.setdefault(nfc(name), page)

    return sizes, sources


def main():
    manifest = {nfc(k): v for k, v in load('images.json').items()}
    sizes, sources = display_sizes()

    too_small, soft, unused = [], [], []

    for name, record in manifest.items():
        master = record['original'][0]
        size = sizes.get(name)
        if size is None:
            unused.append((name, master))
            continue

        shown = DISPLAY_WIDTH.get(size, 700)
        wanted = shown * RETINA

        if master < shown:
            too_small.append((name, master, shown, wanted, size))
        elif master < wanted * CLOSE_ENOUGH:
            soft.append((name, master, shown, wanted, size))

    def report(title, rows, note):
        print(f'\n{title}  ({len(rows)})')
        print(f'  {note}\n')
        if not rows:
            print('  none\n')
            return
        # Worst shortfall first, so the top of the list is where rescanning pays.
        for name, master, shown, wanted, size in sorted(rows, key=lambda r: r[1] / r[3]):
            share = round(100 * master / wanted)
            print(f'  {share:>3}% of ideal   {master:>5}px  (shown {size} at {shown}px, '
                  f'wants {wanted}px)   {name}')

    print('=' * 78)
    print('Image check'.center(78))
    print('=' * 78)

    # ---- references that do not resolve --------------------------------
    #
    # Renaming a master without re-running tools/generate-sizes.py leaves the
    # page pointing at a file that no longer exists, and the picture simply
    # vanishes from the site with no visible error. This catches that.
    broken = sorted((name, sources.get(name, '?')) for name in sizes if name not in manifest)
    print(f'\nBROKEN LINKS — a page asks for a picture that does not exist  ({len(broken)})\n')
    if not broken:
        print('  none\n')
    else:
        stem = lambda s: re.sub(r'[^a-z0-9]', '', os.path.splitext(s)[0].lower())
        for name, where in broken:
            print(f'  {where}')
            print(f'    asks for : {name}')
            close = [k for k in manifest if stem(k)[:24] == stem(name)[:24]]
            for k in close:
                print(f'    did you mean: {k}')
            if not close:
                print('    no similar file found')
            print()

    # ---- links from the CV to a picture elsewhere on the site ----------
    #
    # A "link" in content/cv.json points at a picture by its id, and that id
    # comes from the picture's filename -- so renaming a file quietly breaks
    # the link. This catches that too.
    def slug(filename):
        stem = re.sub(r'\.(jpe?g|png)$', '', filename, flags=re.I)
        stem = unicodedata.normalize('NFD', stem)
        stem = ''.join(c for c in stem if not unicodedata.combining(c))
        return re.sub(r'[^a-z0-9]+', '-', stem.lower()).strip('-')

    known = {slug(name) for name in manifest}
    bad_links = []
    for section in load('cv.json').get('sections', []):
        for entry in section.get('entries', []):
            target = entry.get('link')
            if not target or '#' not in target:
                continue
            fragment = target.split('#', 1)[1]
            if fragment not in known:
                bad_links.append((entry.get('title', '?'), target))

    print(f'BROKEN INTERNAL LINKS — a CV entry points at a picture that is gone  ({len(bad_links)})\n')
    if not bad_links:
        print('  none\n')
    else:
        for title, target in bad_links:
            print(f'  cv.json: {title}')
            print(f'    links to : {target}')
            wanted = target.split("#", 1)[1]
            close = [s for s in sorted(known) if s[:20] == wanted[:20]]
            for s in close:
                print(f'    did you mean: #{s}')
            print()

    # ---- generated files with no master --------------------------------
    orphans = []
    for tier in ('500', '700', '1400'):
        folder = os.path.join(ROOT, 'images', tier)
        if not os.path.isdir(folder):
            continue
        for f in os.listdir(folder):
            if not f.startswith('.') and nfc(f) not in manifest:
                orphans.append(os.path.join('images', tier, f))

    print(f'LEFT-OVER FILES — sizes whose master was renamed or removed  ({len(orphans)})\n')
    if not orphans:
        print('  none\n')
    else:
        names = sorted({os.path.basename(p) for p in orphans})
        for f in names:
            print(f'  {f}')
        print(f'\n  {len(orphans)} files in total. They are not used by any page; delete them with:')
        print('    python3 tools/generate-sizes.py --prune\n')

    report('CANNOT FILL THEIR SLOT — rescan these first', too_small,
           'Narrower than the size they are shown at.')

    report('SOFT ON RETINA SCREENS — worst first', soft,
           'Fine on an ordinary screen, soft on a modern phone or laptop.')

    good = len(manifest) - len(too_small) - len(soft) - len(unused)
    print(f'\nSharp at every size: {good} of {len(manifest)}')

    # The single biggest group is usually old 700px-wide uploads.
    stuck_at_700 = [r for r in soft if r[1] <= 700]
    if stuck_at_700:
        print(f'\n{len(stuck_at_700)} of the {len(soft)} are 700px or narrower — these are the')
        print('old low-resolution uploads from the WordPress site, and rescanning')
        print('any one of them is a visible improvement.')

    if unused:
        print(f'\nIn images/original/ but not used on any page ({len(unused)}):')
        for name, master in sorted(unused):
            print(f'  {master:>5}px   {name}')

    return 0


if __name__ == '__main__':
    sys.exit(main())
