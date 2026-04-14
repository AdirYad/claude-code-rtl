#!/usr/bin/env bash
# Deploy claude-rtl-code to VS Code Marketplace + Open VSX in one shot.
# Usage:
#   ./deploy.sh                  # publish current package.json version
#   ./deploy.sh patch            # bump patch, then publish
#   ./deploy.sh minor            # bump minor, then publish
#   ./deploy.sh major            # bump major, then publish
#
# Requires env vars:
#   VSCE_PAT  — Azure DevOps PAT with Marketplace:Manage scope
#   OVSX_PAT  — Open VSX token from https://open-vsx.org/user-settings/tokens

set -euo pipefail

cd "$(dirname "$0")"

BUMP="${1:-}"

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
blue()  { printf "\033[34m%s\033[0m\n" "$*"; }

# --- 1. Pre-flight checks ---
[[ -z "${OVSX_PAT:-}" ]] && { red "OVSX_PAT not set (required)"; exit 1; }
command -v vsce >/dev/null || { red "vsce not installed. Run: npm i -g @vscode/vsce"; exit 1; }
command -v ovsx >/dev/null || { red "ovsx not installed. Run: npm i -g ovsx"; exit 1; }

SKIP_VSCE=0
if [[ -z "${VSCE_PAT:-}" ]]; then
  SKIP_VSCE=1
  blue "VSCE_PAT not set — skipping VS Code Marketplace, publishing to Open VSX only."
fi

# Block publish with uncommitted changes (catches half-finished work)
if [[ -n "$(git status --porcelain)" ]]; then
  red "Uncommitted changes. Commit or stash before releasing."
  git status --short
  exit 1
fi

# --- 2. Version bump (optional) ---
if [[ -n "$BUMP" ]]; then
  case "$BUMP" in
    patch|minor|major) ;;
    *) red "Invalid bump: $BUMP (use patch|minor|major)"; exit 1 ;;
  esac
  blue "Bumping $BUMP version..."
  npm version "$BUMP" --no-git-tag-version >/dev/null
  VERSION=$(node -p "require('./package.json').version")
  git add package.json package-lock.json 2>/dev/null || git add package.json
  git commit -m "Release v$VERSION"
  git tag "v$VERSION"
else
  VERSION=$(node -p "require('./package.json').version")
fi

green "Deploying v$VERSION"

# --- 3. Build + package ---
blue "Building..."
npm run build

blue "Packaging .vsix..."
vsce package --out "claude-rtl-code-$VERSION.vsix"
VSIX="claude-rtl-code-$VERSION.vsix"

# --- 4. Publish to VS Code Marketplace ---
if [[ $SKIP_VSCE -eq 0 ]]; then
  blue "Publishing to VS Code Marketplace..."
  vsce publish --packagePath "$VSIX" -p "$VSCE_PAT"
  green "✓ VS Code Marketplace"
else
  blue "Skipped VS Code Marketplace (no VSCE_PAT)"
fi

# --- 5. Publish to Open VSX ---
blue "Publishing to Open VSX..."
ovsx publish "$VSIX" -p "$OVSX_PAT"
green "✓ Open VSX"

# --- 6. Warm Open VSX CDN so first install doesn't 403 on cold edges ---
blue "Warming Open VSX CDN..."
FILE_URL="https://open-vsx.org/api/AdirYad/claude-rtl-code/$VERSION/file/AdirYad.claude-rtl-code-$VERSION.vsix"
ASSET_URL="https://open-vsx.org/vscode/asset/AdirYad/claude-rtl-code/$VERSION/Microsoft.VisualStudio.Services.VSIXPackage"
for i in 1 2 3 4 5; do
  code=$(curl -sSL -k -o /dev/null -w "%{http_code}" "$FILE_URL" || echo "fail")
  if [[ "$code" == "200" ]]; then
    curl -sSL -k -o /dev/null "$ASSET_URL" || true
    green "✓ CDN warm (attempt $i)"
    break
  fi
  [[ $i -lt 5 ]] && { echo "  CDN attempt $i: $code, retrying in 15s..."; sleep 15; }
done

# --- 7. Push tag if we bumped ---
if [[ -n "$BUMP" ]]; then
  blue "Pushing commit + tag..."
  git push --follow-tags
fi

green ""
green "Done. v$VERSION live on:"
[[ $SKIP_VSCE -eq 0 ]] && green "  • https://marketplace.visualstudio.com/items?itemName=AdirYad.claude-rtl-code"
green "  • https://open-vsx.org/extension/AdirYad/claude-rtl-code"
