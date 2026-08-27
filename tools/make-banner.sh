#!/bin/sh
# Cut the wide banner picture that runs across the top of every page.
#
#   sh tools/make-banner.sh <master> <crop>
#
# <master> is a file in images/original/, <crop> is an ImageMagick geometry
# WIDTHxHEIGHT+LEFT+TOP describing the band to take out of it.
#
# Example — the current banner:
#
#   sh tools/make-banner.sh \
#      "images/original/1999-päiväperho-belle-de-jour-152-x-212.jpg" \
#      1556x540+22+165
#
# Two files are written into images/header/: the full-size band and a small
# copy for phones. Afterwards, point BANNER in js/shell.js at them and set its
# width/height to the size printed at the end.
#
# Notes on choosing a crop:
#   * Crop INTO the artwork. The photographs include the wall behind the piece
#     and the collage's own irregular edge; a band taken from inside the work
#     avoids both and reads as a detail rather than a snapshot.
#   * The banner runs the full width of the window, so the wider the band, the
#     sharper it stays on a large monitor. Take as much width as the master
#     cleanly allows.
#   * Roughly 3:1 suits the header's proportions.
set -eu

if [ $# -ne 2 ]; then
	sed -n '2,27p' "$0" | sed 's/^# \{0,1\}//'
	exit 1
fi

master=$1
crop=$2
cd "$(dirname "$0")/.."

[ -f "$master" ] || { echo "no such file: $master" >&2; exit 1; }

mkdir -p images/header
srgb="/System/Library/ColorSync/Profiles/sRGB Profile.icc"

# The masters are mostly tagged Adobe RGB; convert to sRGB so the colours are
# right in a browser, exactly as tools/generate-sizes.py does.
# The profile path contains a space, so it has to stay quoted — hence the two
# branches rather than building up a string of arguments.
if [ -f "$srgb" ]; then
	magick "$master" -profile "$srgb" -crop "$crop" +repage \
		-filter Lanczos -quality 84 -strip -interlace Plane \
		images/header/banner-full.jpg
else
	magick "$master" -crop "$crop" +repage \
		-filter Lanczos -quality 84 -strip -interlace Plane \
		images/header/banner-full.jpg
fi

width=$(magick identify -quiet -format '%w' images/header/banner-full.jpg)
height=$(magick identify -quiet -format '%h' images/header/banner-full.jpg)

mv images/header/banner-full.jpg "images/header/banner-$width.jpg"

# A ladder of smaller copies. The banner spans the whole window, so a phone
# with a high-resolution screen would otherwise download the full-width file;
# the middle step keeps that download reasonable.
rm -f images/header/banner-780.jpg images/header/banner-1100.jpg
for w in 780 1100; do
	if [ "$w" -lt "$width" ]; then
		magick "images/header/banner-$width.jpg" -filter Lanczos -resize "${w}x" \
			-quality 82 -strip -interlace Plane "images/header/banner-$w.jpg"
	fi
done

echo
for f in images/header/banner-*.jpg; do
	echo "wrote $f  ($(magick identify -quiet -format '%wx%h' "$f"), $(($(wc -c < "$f") / 1024)) KB)"
done

echo
echo "Now set this in js/shell.js:"
echo "    sources: ["
for f in images/header/banner-780.jpg images/header/banner-1100.jpg "images/header/banner-$width.jpg"; do
	[ -f "$f" ] || continue
	echo "        ['/$f', $(magick identify -quiet -format '%w' "$f")],"
done
echo "    ],"
echo "    width:  $width,"
echo "    height: $height,"
