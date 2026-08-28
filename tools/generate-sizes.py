#!/usr/bin/env python3
"""Derive the web-sized images in images/500, images/700 and images/1400
from the masters in images/original.

Every artwork gets all three widths regardless of the size it is currently
displayed at, so switching a picture between .medium (500) and .large (700) in
the HTML never means a blurry upscale -- the file is already there. The 1400px
copy is what high-resolution screens and the lightbox use.

Images are never enlarged: if a master is narrower than a target width, that
width is written out at the master's own size instead. The manifest records the
real dimensions so the generated srcset advertises honest widths.

Most masters are tagged Adobe RGB (1998). They are converted to sRGB here so
colours stay faithful in the browser; metadata is then stripped, which is safe
because untagged images are treated as sRGB everywhere.

    python3 tools/generate-sizes.py [--force]
"""
import concurrent.futures
import hashlib
import json
import os
import subprocess
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINALS = os.path.join(ROOT, 'images', 'original')
WIDTHS = (500, 700, 1400)
SRGB = '/System/Library/ColorSync/Profiles/sRGB Profile.icc'
QUALITY = '82'


def identify(path):
    out = subprocess.run(['magick', 'identify', '-quiet', '-format', '%w %h', path[:] + '[0]'],
                         capture_output=True, text=True, check=True).stdout.split()
    return int(out[0]), int(out[1])


def convert(src, dst, width):
    cmd = ['magick', src + '[0]']
    if os.path.exists(SRGB):
        # Transform from the embedded profile (often Adobe RGB) into sRGB.
        cmd += ['-profile', SRGB]
    cmd += ['-filter', 'Lanczos', '-resize', f'{width}x>', '-strip']
    if not dst.lower().endswith('.png'):
        cmd += ['-quality', QUALITY, '-interlace', 'Plane', '-sampling-factor', '4:2:0']
    cmd.append(dst)
    subprocess.run(cmd, check=True, capture_output=True)


def fingerprint(path):
    """A short digest of the master's contents."""
    digest = hashlib.sha256()
    with open(path, 'rb') as fh:
        for block in iter(lambda: fh.read(1 << 20), b''):
            digest.update(block)
    return digest.hexdigest()[:16]


def process(name, force, previous):
    """Make the three web copies of one master, unless they are already right.

    Whether the work is needed is decided from the master's contents, not its
    timestamp. Timestamps are no guide here: cloning the repository gives every
    file a fresh one, and renaming a file keeps its old one, so going by dates
    would redo everything after a clone and miss real changes after a rename.

    Re-encoding is deterministic -- the same master and settings always produce
    byte-identical output -- so a needless run would not actually change any
    file. Skipping simply keeps it quick.
    """
    src = os.path.join(ORIGINALS, name)
    source_hash = fingerprint(src)
    record = {'original': list(identify(src)), 'source': source_hash}

    was = previous.get(name, {})
    unchanged = was.get('source') == source_hash

    for width in WIDTHS:
        dst = os.path.join(ROOT, 'images', str(width), name)
        if force or not unchanged or not os.path.exists(dst):
            convert(src, dst, width)
            record[str(width)] = list(identify(dst))
        else:
            # Nothing about the master changed, so the recorded size still holds.
            record[str(width)] = was.get(str(width)) or list(identify(dst))

    return name, record


def main():
    force = '--force' in sys.argv
    for width in WIDTHS:
        os.makedirs(os.path.join(ROOT, 'images', str(width)), exist_ok=True)

    # macOS hands back filenames in decomposed form, so "ä" arrives as a plain
    # "a" followed by a separate accent character. Git stores the composed form,
    # which is what a Linux web server serves, so the manifest is written
    # composed -- otherwise an accented filename works locally and 404s once
    # deployed. (Plain ASCII filenames avoid the problem entirely.)
    names = sorted(unicodedata.normalize('NFC', f)
                   for f in os.listdir(ORIGINALS) if not f.startswith('.'))

    # What was made last time, so unchanged masters can be left alone.
    previous = {}
    manifest_path = os.path.join(ROOT, 'content', 'images.json')
    if os.path.exists(manifest_path) and not force:
        try:
            with open(manifest_path, encoding='utf-8') as fh:
                previous = json.load(fh)
        except (OSError, ValueError):
            previous = {}

    manifest, failures = {}, []

    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(process, name, force, previous): name for name in names}
        for done, future in enumerate(concurrent.futures.as_completed(futures), 1):
            name = futures[future]
            try:
                name, record = future.result()
                manifest[name] = record
            except Exception as exc:                                  # noqa: BLE001
                failures.append((name, exc))
            if done % 25 == 0 or done == len(names):
                print(f'  {done}/{len(names)}', flush=True)

    with open(os.path.join(ROOT, 'content', 'images.json'), 'w', encoding='utf-8') as fh:
        json.dump(manifest, fh, indent=1, sort_keys=True)
        fh.write('\n')

    print(f'generated {len(manifest)} images x {len(WIDTHS)} widths')

    # Renaming a master leaves the copies made under its old name behind. They
    # are not used by anything, so --prune clears them out.
    if '--prune' in sys.argv:
        removed = 0
        for width in WIDTHS:
            folder = os.path.join(ROOT, 'images', str(width))
            for f in os.listdir(folder):
                if not f.startswith('.') and unicodedata.normalize('NFC', f) not in manifest:
                    os.remove(os.path.join(folder, f))
                    removed += 1
        print(f'pruned {removed} left-over files from renamed masters')
    else:
        stale = 0
        for width in WIDTHS:
            folder = os.path.join(ROOT, 'images', str(width))
            stale += sum(1 for f in os.listdir(folder)
                         if not f.startswith('.')
                         and unicodedata.normalize('NFC', f) not in manifest)
        if stale:
            print(f'note: {stale} left-over files from renamed masters — '
                  f're-run with --prune to remove them')

    for name, exc in failures:
        print(f'FAILED {name}: {exc}')
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
