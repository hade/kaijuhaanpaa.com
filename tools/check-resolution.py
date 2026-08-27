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


def display_sizes():
    """Which display size each picture is used at."""
    sizes = {}
    for group in load('gallery.json'):
        for item in group['items']:
            sizes[item['file']] = item.get('size', 'large')
    for item in load('books.json'):
        sizes[item['file']] = item.get('size', 'medium')

    # Pictures written straight into a page carry data-image="..." there.
    for page in ('index.html', 'books/index.html', 'cv/index.html', 'contact/index.html'):
        path = os.path.join(ROOT, page)
        if not os.path.exists(path):
            continue
        html = open(path, encoding='utf-8').read()
        for name in re.findall(r'data-image="([^"]+)"', html):
            sizes.setdefault(name, 'medium')
    return sizes


def main():
    manifest = load('images.json')
    sizes = display_sizes()

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
    print('Resolution check'.center(78))
    print('=' * 78)

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
