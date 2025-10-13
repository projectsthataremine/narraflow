# NarraFlow: App Packaging & Auto-Updates

**Last Updated**: 2025-10-12

This document describes the complete architecture for packaging and distributing NarraFlow, including auto-update functionality. This implementation follows the proven pattern from Clipp (copy-paste-app).

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Support](#architecture-support)
3. [Packaging Configuration](#packaging-configuration)
4. [Build & Publish Scripts](#build--publish-scripts)
5. [Auto-Update System](#auto-update-system)
6. [GitHub Releases Distribution](#github-releases-distribution)
7. [Marketing Site Downloads Window](#marketing-site-downloads-window)
8. [Settings Window Update UI](#settings-window-update-ui)
9. [Publishing Workflow](#publishing-workflow)

---

## Overview

NarraFlow uses:
- **electron-builder** for packaging DMG files
- **electron-updater** for auto-update functionality
- **GitHub Releases** for distribution
- **Ad-hoc code signing** for macOS apps (development)
- **Separate builds** for Intel (x64) and Apple Silicon (arm64)

### Why This Approach?

- **Simple**: No complex CI/CD pipeline needed
- **Proven**: Same pattern used successfully in Clipp
- **Cost-effective**: GitHub Releases are free
- **User-friendly**: Auto-update keeps users on latest version

---

## Architecture Support

### Target Architectures

NarraFlow builds TWO separate DMG files:

1. **arm64** - Apple Silicon (M1, M2, M3, M4)
2. **x64** - Intel processors

### Why Not Universal Binary?

- **File size**: Universal binaries are 2x larger
- **Complexity**: Separate builds are simpler to manage
- **Optimization**: Each build is optimized for its architecture
- **User clarity**: Users download the right version for their Mac

### Minimum macOS Version

- **macOS Big Sur 11.0** or later (released November 2020)
- Both Intel and Apple Silicon Macs from this era are supported

---

## Packaging Configuration

### electron-builder.config.js

Located at project root: `/electron-builder.config.js`

```javascript
const path = require("path");
const { execSync } = require("child_process");

const arch = process.env.ARCH;

module.exports = {
  appId: "com.narraflow.app",
  productName: "NarraFlow",
  mac: {
    icon: "build/icons/icon.icns",
    gatekeeperAssess: false,
    minimumSystemVersion: "11.0.0",
    category: "public.app-category.productivity",
  },
  // Ad-hoc code signing after build
  afterSign: async (context) => {
    const appPath = context.appOutDir;
    const appName = context.packager.appInfo.productFilename;
    const fullAppPath = path.join(appPath, `${appName}.app`);

    console.log(`Signing app at: ${fullAppPath}`);
    execSync(`codesign --deep --force --sign - "${fullAppPath}"`);
  },
  files: [
    "dist/main/**/*",
    "dist/renderer/**/*",
    "dist/fn-key-helper/**/*",
    "package.json"
  ],
  extraFiles: [
    {
      from: `dist/fn-key-helper/build/NarraFlowFnHelper.app`,
      to: `NarraFlowFnHelper.app`,
      filter: ["**/*"]
    }
  ],
  publish: [
    {
      provider: "github",
      owner: "projectsthataremine",
      repo: "narraflow",
    },
  ],
};
```

### Key Configuration Details

- **appId**: `com.narraflow.app` - unique bundle identifier
- **productName**: `NarraFlow` - displayed name in macOS
- **icon**: Located at `build/icons/icon.icns` (1024x1024 source)
- **afterSign**: Ad-hoc signing with `codesign --deep --force --sign -`
- **extraFiles**: Includes Fn key helper app
- **publish**: GitHub releases for `projectsthataremine/narraflow`

---

## Build & Publish Scripts

### package.json Scripts

```json
{
  "scripts": {
    "build": "tsc && vite build && npm run copy:helper",
    "build:mac:arm64": "ARCH=arm64 electron-builder --config electron-builder.config.js --mac --arm64",
    "build:mac:x64": "ARCH=x64 electron-builder --config electron-builder.config.js --mac --x64",
    "build:all": "npm run build && npm run build:mac:arm64 && npm run build:mac:x64",
    "publish:mac:arm64": "ARCH=arm64 electron-builder --config electron-builder.config.js --mac --arm64 --publish always",
    "publish:mac:x64": "ARCH=x64 electron-builder --config electron-builder.config.js --mac --x64 --publish always",
    "publish": "npm run build && npm run publish:mac:arm64 && npm run publish:mac:x64"
  }
}
```

### Script Descriptions

- **`build`** - Build TypeScript + Vite + copy Fn helper
- **`build:mac:arm64`** - Build arm64 DMG only (no publish)
- **`build:mac:x64`** - Build x64 DMG only (no publish)
- **`build:all`** - Build both architectures locally
- **`publish:mac:arm64`** - Build + publish arm64 to GitHub Releases
- **`publish:mac:x64`** - Build + publish x64 to GitHub Releases
- **`publish`** - **Main publish command** - builds and publishes both architectures

---

## Auto-Update System

### Dependencies

```json
{
  "dependencies": {
    "electron-updater": "^6.6.2",
    "electron-log": "^5.4.3"
  }
}
```

### Implementation in Main Process

Located in `src/main/index.ts`:

```typescript
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

// Configure logging
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

function setupAutoUpdater() {
  // Check for updates on launch
  autoUpdater.checkForUpdates();

  // Check every 6 hours
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 1000 * 60 * 60 * 6); // 6 hours

  // Event: Update available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);

    // Notify settings window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  // Event: Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);

    // Notify settings window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  // Event: Error
  autoUpdater.on('error', (err) => {
    log.error('Auto-updater error:', err);
  });
}

// Call during app initialization
app.whenReady().then(() => {
  // ... other setup
  setupAutoUpdater();
});
```

### IPC Handlers for Update Actions

```typescript
// Allow user to trigger download
ipcMain.handle('download-update', async () => {
  await autoUpdater.downloadUpdate();
});

// Allow user to install and restart
ipcMain.handle('install-update', async () => {
  autoUpdater.quitAndInstall();
});
```

### Update Check Interval

- **Every 6 hours** (not 30 minutes like Clipp)
- Checks on app launch
- Non-intrusive: user decides when to install

---

## GitHub Releases Distribution

### How It Works

1. **Developer runs**: `npm run publish`
2. **electron-builder**:
   - Builds arm64 DMG
   - Uploads to GitHub Releases
   - Builds x64 DMG
   - Uploads to GitHub Releases
   - Creates `latest-mac.yml` metadata file
3. **electron-updater** in user's app:
   - Fetches `latest-mac.yml` from GitHub
   - Compares version numbers
   - Downloads DMG if newer version available

### latest-mac.yml

Example metadata file created by electron-builder:

```yaml
version: 0.1.0
files:
  - url: NarraFlow-0.1.0-arm64.dmg
    sha512: <hash>
    size: 123456789
  - url: NarraFlow-0.1.0-x64.dmg
    sha512: <hash>
    size: 123456789
path: NarraFlow-0.1.0-arm64.dmg
sha512: <hash>
releaseDate: '2025-10-12T00:00:00.000Z'
```

### GitHub Personal Access Token

Required for publishing:

```bash
export GH_TOKEN=your_github_token
npm run publish
```

Token needs `repo` scope (read/write access to releases).

---

## Marketing Site Downloads Window

### User Experience

The marketing site has a "Downloads" folder icon on the desktop. When double-clicked, it opens a window showing:

1. **Two DMG files**:
   - `NarraFlow-{version}-arm64.dmg` (Apple Silicon icon)
   - `NarraFlow-{version}-x64.dmg` (Intel icon)

2. **README file**:
   - How to determine your Mac architecture
   - Which file to download
   - Installation instructions

### Implementation

Located in `marketing-site/components/desktop/DownloadsWindow.tsx`:

```typescript
// Fetch latest release from GitHub API
useEffect(() => {
  fetch('https://api.github.com/repos/projectsthataremine/narraflow/releases/latest')
    .then(res => res.json())
    .then(data => {
      const arm64Asset = data.assets.find(a => a.name.includes('arm64'));
      const x64Asset = data.assets.find(a => a.name.includes('x64'));

      setDownloads({
        arm64: arm64Asset.browser_download_url,
        x64: x64Asset.browser_download_url,
        version: data.tag_name
      });
    });
}, []);
```

### README Content

```markdown
# How to Download NarraFlow

## Determine Your Mac Type

1. Click the Apple menu () → "About This Mac"
2. Look at the "Chip" or "Processor" line:
   - **Apple M1/M2/M3/M4** → Download arm64 version
   - **Intel Core i5/i7/i9** → Download x64 version

## Installation

1. Download the correct DMG file
2. Open the DMG
3. Drag NarraFlow to Applications folder
4. Launch from Applications

## System Requirements

- macOS Big Sur 11.0 or later
- Active internet connection for license validation
```

---

## Settings Window Update UI

### Location

Bottom-left corner of the NarraFlow settings window.

### Components

1. **Version Display**: Shows current version (e.g., "v0.1.0")
2. **Cloud Icon**: Indicates update status
   - **Gray** (default): No update available
   - **Red**: Update available
3. **Hover Tooltip**: "New version available - click to download and restart"
4. **Click Handler**: Triggers download and installation

### Implementation

Located in `src/renderer/settings/index.tsx`:

```typescript
const [updateAvailable, setUpdateAvailable] = useState(false);
const [updateInfo, setUpdateInfo] = useState(null);

useEffect(() => {
  // Listen for update notifications
  window.electron.onUpdateAvailable((info) => {
    setUpdateAvailable(true);
    setUpdateInfo(info);
  });
}, []);

const handleUpdateClick = async () => {
  if (updateAvailable) {
    await window.electron.downloadUpdate();
    // Once downloaded, electron-updater triggers 'update-downloaded'
    // Then we can show "Restart to install" button
  }
};

return (
  <div className="settings-footer">
    <span className="version">v{appVersion}</span>
    <button
      className={`cloud-icon ${updateAvailable ? 'red' : ''}`}
      onClick={handleUpdateClick}
      title={updateAvailable ? "New version available - click to download and restart" : "Up to date"}
    >
      ☁️
    </button>
  </div>
);
```

### CSS Styling

```css
.settings-footer {
  position: absolute;
  bottom: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cloud-icon {
  cursor: pointer;
  font-size: 20px;
  filter: grayscale(100%);
  transition: filter 0.3s;
}

.cloud-icon.red {
  filter: grayscale(0%) hue-rotate(0deg) saturate(200%) brightness(0.8);
}
```

---

## Publishing Workflow

### Step-by-Step Release Process

1. **Update version** in `package.json`:
   ```json
   {
     "version": "0.2.0"
   }
   ```

2. **Commit changes**:
   ```bash
   git add .
   git commit -m "Release v0.2.0"
   git tag v0.2.0
   git push origin main --tags
   ```

3. **Set GitHub token**:
   ```bash
   export GH_TOKEN=your_github_personal_access_token
   ```

4. **Publish**:
   ```bash
   npm run publish
   ```

5. **Wait for builds**:
   - arm64 DMG builds and uploads
   - x64 DMG builds and uploads
   - `latest-mac.yml` created

6. **Verify GitHub Release**:
   - Go to https://github.com/projectsthataremine/narraflow/releases
   - Confirm both DMG files are present
   - Confirm `latest-mac.yml` exists

7. **Test auto-update**:
   - Launch older version of NarraFlow
   - Wait 6 hours OR trigger manual check
   - Verify update notification appears

### GitHub Token Setup

Create token at: https://github.com/settings/tokens

Required scopes:
- `repo` (full control of private repositories)

Save token securely (use environment variable or `.env` file):

```bash
# Add to ~/.zshrc or ~/.bashrc
export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### First Release (v0.1.0)

For the very first release:

```bash
npm run build:all  # Test local builds first
npm run publish    # Publish to GitHub
```

This creates the initial release that all future auto-updates will compare against.

---

## Icon Assets

### Required Files

- **Source**: 1024x1024 PNG or SVG
- **Output**: `build/icons/icon.icns` (macOS icon format)

### Creating icon.icns

Use `png2icns` or similar tool:

```bash
npm install -g png2icns
png2icns icon-1024.png build/icons/icon.icns
```

Or use macOS built-in tools:

```bash
mkdir icon.iconset
sips -z 16 16     icon-1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon-1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon-1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset -o build/icons/icon.icns
```

---

## Troubleshooting

### Build Fails: "Cannot find icon.icns"

**Solution**: Create placeholder icon or add real icon to `build/icons/icon.icns`.

### Publish Fails: "GitHub token not set"

**Solution**: Set `GH_TOKEN` environment variable:
```bash
export GH_TOKEN=your_token
npm run publish
```

### Auto-updater Not Working

**Checklist**:
1. Is app version in `package.json` older than GitHub release?
2. Does GitHub release have `latest-mac.yml`?
3. Is internet connection active?
4. Check logs: `~/Library/Logs/NarraFlow/main.log`

### Wrong Architecture Downloaded

**Solution**: electron-updater automatically detects architecture. Ensure GitHub release has both DMG files.

---

## Future Improvements

### Code Signing & Notarization

For production release:

1. **Apple Developer Account** ($99/year)
2. **Developer ID Certificate**
3. **Notarization**: Submit app to Apple for scanning
4. **Stapling**: Attach notarization ticket to DMG

Update `electron-builder.config.js`:

```javascript
mac: {
  hardenedRuntime: true,
  entitlements: "build/entitlements.mac.plist",
  entitlementsInherit: "build/entitlements.mac.plist",
  gatekeeperAssess: false,
  notarize: {
    teamId: "YOUR_TEAM_ID"
  }
}
```

### CI/CD Pipeline

Automate builds with GitHub Actions:

```yaml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Summary

NarraFlow's packaging and update system:

✅ **Simple**: Single `npm run publish` command
✅ **Reliable**: Proven electron-builder + electron-updater stack
✅ **User-friendly**: Auto-updates with user control
✅ **Cost-effective**: Free GitHub Releases hosting
✅ **Multi-architecture**: Separate optimized builds for Intel and Apple Silicon

**Next Steps**: Implement auto-updater in main process, add update UI to settings window, create Downloads window on marketing site.
