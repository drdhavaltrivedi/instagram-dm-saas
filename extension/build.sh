#!/bin/bash

# Build script for BulkDM Chrome Extension
# Creates separate ZIP files for LOCAL and PRODUCTION versions

echo "🚀 Building BulkDM Chrome Extension..."

# Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)

# Clean previous builds
rm -rf build-local build-prod
rm -f bulkdm-extension-local-v*.zip bulkdm-extension-prod-v*.zip

echo ""
echo "📦 Building LOCAL version..."
echo "================================"

# Create local build directory
mkdir -p build-local

# Copy common files
cp popup.html build-local/
cp -r icons build-local/

# Copy local-specific files
cp manifest.local.json build-local/manifest.json
cp popup.local.js build-local/popup.js
cp background.local.js build-local/background.js

# Copy config.js if it exists
[ -f config.js ] && cp config.js build-local/

# Create local ZIP
cd build-local
ZIP_NAME_LOCAL="bulkdm-extension-local-v${VERSION}.zip"
zip -r "../$ZIP_NAME_LOCAL" . -x "*.DS_Store" "*.git*"
cd ..

# Clean up local build
rm -rf build-local

echo "✅ Local build complete: $ZIP_NAME_LOCAL"
echo ""

echo "📦 Building PRODUCTION version..."
echo "================================"

# Create production build directory
mkdir -p build-prod

# Copy common files
cp popup.html build-prod/
cp -r icons build-prod/

# Copy production-specific files
cp manifest.prod.json build-prod/manifest.json
cp popup.prod.js build-prod/popup.js
cp background.prod.js build-prod/background.js

# Copy config.js if it exists
[ -f config.js ] && cp config.js build-prod/

# Create production ZIP
cd build-prod
ZIP_NAME_PROD="bulkdm-extension-prod-v${VERSION}.zip"
zip -r "../$ZIP_NAME_PROD" . -x "*.DS_Store" "*.git*"
cd ..

# Clean up production build
rm -rf build-prod

echo "✅ Production build complete: $ZIP_NAME_PROD"
echo ""

echo "🎉 Build Summary:"
echo "================================"
echo "📦 Local version:    $ZIP_NAME_LOCAL"
echo "📦 Production version: $ZIP_NAME_PROD"
echo ""
echo "📝 Next steps:"
echo "  LOCAL:"
echo "  1. Extract $ZIP_NAME_LOCAL"
echo "  2. Load unpacked extension in Chrome"
echo "  3. Use for development with localhost:3000/3001"
echo ""
echo "  PRODUCTION:"
echo "  1. Review $ZIP_NAME_PROD"
echo "  2. Go to https://chrome.google.com/webstore/devconsole"
echo "  3. Upload $ZIP_NAME_PROD"
echo "  4. Fill in store listing details"
echo "  5. Submit for review"
