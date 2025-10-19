#!/bin/bash
# This script controls when Vercel should build
# Exit 0 = Don't build
# Exit 1 = Build

# Check if commit message contains [deploy] or [build]
if git log -1 --pretty=%B | grep -qE "\[(deploy|build)\]"; then
  echo "✅ Deploy tag found - Building..."
  exit 1
fi

# Check if we're on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⏭️  Not on main branch - Skipping build"
  exit 0
fi

# Check if only docs were changed
if git diff HEAD^ HEAD --quiet -- '*.md' ':!app/*' ':!components/*' ':!lib/*'; then
  echo "📄 Only documentation changed - Skipping build"
  exit 0
fi

# Default: Build
echo "🚀 Changes detected - Building..."
exit 1
