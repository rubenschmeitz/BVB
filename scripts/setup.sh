#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
npm ci
node node_modules/playwright/cli.js install chromium
# On a minimal Linux image, install browser system libraries first with:
# npx playwright install-deps chromium
python3 scripts/check_site.py
