# BulkDM Extension Build Guide

This guide explains how to build separate LOCAL and PRODUCTION versions of the BulkDM Chrome Extension.

## Overview

The extension is now separated into two distinct versions:

1. **LOCAL Version** - For development, uses `localhost:3000` and `localhost:3001`
2. **PRODUCTION Version** - For production, uses `https://bulkdm-saas.netlify.app`

## Building Both Versions

Run the build script to create both ZIP files:

```bash
cd extension
./build.sh
```

This will create:
- `bulkdm-extension-local-v1.0.1.zip` - For local development
- `bulkdm-extension-prod-v1.0.1.zip` - For production/Chrome Web Store

## Local Version

**Use for:**
- Local development
- Testing with `localhost:3000` and `localhost:3001`
- Development team members

**Installation:**
1. Extract `bulkdm-extension-local-v1.0.1.zip`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extracted folder

**Features:**
- Hardcoded to use `http://localhost:3000` (frontend)
- Hardcoded to use `http://localhost:3001` (backend)
- Shows "💻 LOCAL" indicator in extension popup
- No auto-detection or switching

## Production Version

**Use for:**
- Chrome Web Store distribution
- End users
- Production environment

**Installation:**
1. Extract `bulkdm-extension-prod-v1.0.1.zip`
2. Review the contents
3. Upload to Chrome Web Store (see `CHROME_STORE_GUIDE.md`)

**Features:**
- Hardcoded to use `https://bulkdm-saas.netlify.app`
- Shows "🌐 PRODUCTION" indicator in extension popup
- No auto-detection or switching
- Optimized for production use

## File Structure

```
extension/
├── popup.local.js          # Local version popup script
├── popup.prod.js           # Production version popup script
├── background.local.js     # Local version background script
├── background.prod.js      # Production version background script
├── manifest.local.json      # Local version manifest
├── manifest.prod.json      # Production version manifest
├── popup.html              # Shared popup HTML
├── icons/                  # Shared icons
├── build.sh                # Build script
└── BUILD_GUIDE.md          # This file
```

## Updating URLs

### Local Version
Edit `popup.local.js` and `background.local.js`:
```javascript
const APP_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:3001';
```

### Production Version
Edit `popup.prod.js` and `background.prod.js`:
```javascript
const APP_URL = 'https://bulkdm-saas.netlify.app';
const BACKEND_URL = 'https://bulkdm-saas.netlify.app';
```

Then rebuild:
```bash
./build.sh
```

## Version Management

To update the version number:
1. Edit `manifest.local.json` and `manifest.prod.json`
2. Update the `version` field
3. Run `./build.sh`
4. New ZIP files will be created with the new version number

## Notes

- The original `popup.js` and `background.js` files are kept for reference but not used in builds
- Each version is completely independent - no shared code that switches between environments
- Local version only works with localhost (no production fallback)
- Production version only works with production URLs (no localhost fallback)

