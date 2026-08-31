#!/bin/sh
# Bring everything into step after changing pictures or text.
#
#   sh tools/update.sh
#
# Safe to run at any time. When nothing has changed it does nothing — it works
# out what is needed from the contents of the files, not their dates, so an
# unnecessary run leaves the repository untouched.
#
# It runs three steps, in the order they depend on each other:
#
#   1. the web-sized copies of any new or replaced picture
#   2. the small share page for each artwork, under work/
#   3. a check for anything broken
#
# The order matters. The share pages need the picture sizes to exist and the
# captions to be written, so they are made last.
set -eu
cd "$(dirname "$0")/.."

echo "1/3  picture sizes"
python3 tools/generate-sizes.py "$@"

echo
echo "2/3  share pages"
python3 tools/make-work-pages.py

echo
echo "3/3  checking"
python3 tools/check-resolution.py | sed -n '/^BROKEN /,/^$/p;/^MISSING /,/^$/p;/^SHARE PAGES /,/^$/p;/^LEFT-OVER /,/^$/p;/^CANNOT FILL/,/^$/p'

echo "Done. Run 'python3 tools/check-resolution.py' in full to see which"
echo "pictures would benefit from a better scan."
