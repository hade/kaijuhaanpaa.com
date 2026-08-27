#!/bin/sh
# Preview the site locally at http://localhost:8000
# The pages use absolute paths (/css/style.css), so they need to be served from
# the site root rather than opened straight off the disk with file://
set -eu
cd "$(dirname "$0")/.."
echo "Serving http://localhost:8000  (Ctrl-C to stop)"
exec python3 -m http.server 8000
