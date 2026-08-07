#!/bin/bash
# Launch the Ghostty Theme Changer web app (builds the UI once if needed, then serves it).
cd "$(dirname "$0")" || exit 1
[ -d dist ] || npm run build
exec node server/index.cjs "$@"
