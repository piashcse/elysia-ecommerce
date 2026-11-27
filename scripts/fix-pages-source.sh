#!/usr/bin/env bash
# Point GitHub Pages at the gh-pages branch and queue a build.
#
# Usage:
#   ./scripts/fix-pages-source.sh [owner/repo]
#   bun run docs:fix-pages
#
# Requires the GitHub CLI (https://cli.github.com/) to be authenticated with
# admin (or "manage GitHub Pages settings") access to the repository.
set -euo pipefail

REPO="${1:-${GITHUB_REPOSITORY:-}}"

if [[ -z "$REPO" ]]; then
  if ! command -v gh >/dev/null 2>&1; then
    echo "error: the GitHub CLI (gh) is required: https://cli.github.com/" >&2
    exit 1
  fi
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "error: the GitHub CLI (gh) is required: https://cli.github.com/" >&2
  exit 1
fi

echo "Setting GitHub Pages source for ${REPO} to gh-pages / (root)…"
if gh api "repos/${REPO}/pages" >/dev/null 2>&1; then
  gh api -X PUT "repos/${REPO}/pages" \
    -f build_type=legacy \
    -f 'source[branch]=gh-pages' \
    -f 'source[path]=/' >/dev/null
else
  echo "GitHub Pages is not enabled yet; creating it…"
  gh api -X POST "repos/${REPO}/pages" \
    -f build_type=legacy \
    -f 'source[branch]=gh-pages' \
    -f 'source[path]=/' >/dev/null
fi

echo "Queueing a GitHub Pages build…"
gh api -X POST "repos/${REPO}/pages/builds" >/dev/null

echo "Done. GitHub Pages now builds the MkDocs site from gh-pages."
echo "Site: https://${REPO%%/*}.github.io/${REPO##*/}/"
