# App Packaging, Distribution, and Auto-Updates Guide

This document describes the complete packaging, distribution, and automatic update system for this Electron application. It covers electron-builder configuration, GitHub Releases integration, and the electron-updater implementation.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Electron Builder Configuration](#electron-builder-configuration)
4. [Build Process](#build-process)
5. [Publishing to GitHub Releases](#publishing-to-github-releases)
6. [Auto-Update System](#auto-update-system)
7. [Native Binary Compilation](#native-binary-compilation)
8. [Development vs Production](#development-vs-production)
9. [Implementation Steps](#implementation-steps)
10. [Troubleshooting](#troubleshooting)

---

## System Overview

This application uses:

- **electron-builder** - Package and build the app for multiple architectures
- **GitHub Releases** - Host and distribute app binaries
- **electron-updater** - Automatic update checking and installation
- **Supabase Edge Function** - API endpoint to fetch latest release info

### Key Features

- Multi-architecture support (ARM64 and x64 for macOS)
- Automatic updates via GitHub Releases
- Code signing with self-signed certificates
- Native binary embedding (Swift-based clipboard utility)
- Separate builds for each architecture
- Frontend (Vite/React) bundled with Electron

---

## Architecture

### Build and Distribution Flow

```
┌─────────────────────┐
│  Developer Machine  │
│  • Build frontend   │
│  • Compile natives  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  electron-builder   │
│  • Package app      │
│  • Sign binaries    │
│  • Create DMG/ZIP   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  GitHub Releases    │
│  • Host binaries    │
│  • Version tags     │
│  • Release notes    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Electron App       │
│  (electron-updater) │
│  • Check for update │
│  • Download & apply │
└─────────────────────┘
```

### Update Check Flow

```
┌──────────────────┐
│  Electron App    │
│  Checks for      │
│  updates every   │
│  30 minutes      │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│  electron-updater                │
│  • Queries GitHub Releases API   │
│  • Compares versions             │
└────────┬─────────────────────────┘
         │
         ▼
     New version?
         │
    ┌────┴────┐
    │   YES   │   NO
    ▼         │
Download      │
DMG/ZIP       │
    │         │
    ▼         ▼
Notify    Continue
User      running
```

---

## Electron Builder Configuration

### File: `electron/electron-builder.config.js`

```javascript
const path = require("path");
const { execSync } = require("child_process");

const arch = process.env.ARCH;

module.exports = {
  appId: "com.yourdomain.clipp",
  productName: "Clipp",
  mac: {
    icon: "build/icons/icon.icns",
    gatekeeperAssess: false,
  },
  // Code signing after build
  afterSign: async (context) => {
    const appPath = context.appOutDir;
    const appName = context.packager.appInfo.productFilename;
    const fullAppPath = path.join(appPath, `${appName}.app`);

    // Self-sign to avoid Gatekeeper issues
    execSync(`codesign --deep --force --sign - "${fullAppPath}"`);
  },
  // Files to include in the app bundle
  files: ["backend/**", "frontend/dist/**/*", "package.json"],
  // Files that should NOT be packed into asar archive
  asarUnpack: ["**/get_clipboard_image.*"],
  // Extra files to copy into the app
  extraFiles: [
    {
      from: `backend/native/get_clipboard_image.${arch}`,
      to: `get_clipboard_image.${arch}`,
    },
  ],
  // GitHub Releases configuration
  publish: [
    {
      provider: "github",
      owner: "joshmarnold",
      repo: "clipp",
    },
  ],
};
```

### Configuration Breakdown

#### 1. App Identity

```javascript
appId: "com.yourdomain.clipp",
productName: "Clipp",
```

- **appId**: Unique bundle identifier for macOS
- **productName**: Display name of the application

#### 2. macOS Settings

```javascript
mac: {
  icon: "build/icons/icon.icns",
  gatekeeperAssess: false,
}
```

- **icon**: Path to .icns icon file
- **gatekeeperAssess**: Disable Gatekeeper assessment (useful for development)

#### 3. Code Signing Hook

```javascript
afterSign: async (context) => {
  const fullAppPath = path.join(appPath, `${appName}.app`);
  execSync(`codesign --deep --force --sign - "${fullAppPath}"`);
}
```

- Runs after the app is built
- Self-signs with ad-hoc signature (`-`)
- Prevents Gatekeeper warnings on first launch
- For production, use a real Apple Developer certificate

#### 4. File Inclusion

```javascript
files: ["backend/**", "frontend/dist/**/*", "package.json"],
```

Includes:
- All backend JavaScript files
- Built frontend (from Vite)
- package.json for dependencies

#### 5. ASAR Unpacking

```javascript
asarUnpack: ["**/get_clipboard_image.*"],
```

- electron-builder packs files into `app.asar` by default
- Some files (like native binaries) need to be unpacked
- This keeps the Swift binary accessible at runtime

#### 6. Extra Files

```javascript
extraFiles: [
  {
    from: `backend/native/get_clipboard_image.${arch}`,
    to: `get_clipboard_image.${arch}`,
  },
]
```

- Copies native binaries based on architecture
- `ARCH` environment variable determines which binary to include

#### 7. GitHub Releases Publishing

```javascript
publish: [
  {
    provider: "github",
    owner: "joshmarnold",
    repo: "clipp",
  },
]
```

- Automatically publishes to GitHub Releases
- Requires `GH_TOKEN` environment variable

---

## Build Process

### Package.json Scripts

**File: `electron/package.json`**

```json
{
  "scripts": {
    "dev": "cd frontend && npm run dev",
    "electron": "NODE_ENV=development electron ./backend/main.js",
    "build:frontend": "cd frontend && npm run build",
    "clean": "node backend/scripts/clearClipboardData.js",
    "create-binaries": "swiftc -target arm64-apple-macos10.13 scripts/get_clipboard_image.swift -o backend/native/get_clipboard_image.arm64 && swiftc -target x86_64-apple-macos10.13 scripts/get_clipboard_image.swift -o backend/native/get_clipboard_image.x64",
    "build:mac:arm64": "ARCH=arm64 electron-builder --config electron-builder.config.js --mac --arm64",
    "build:mac:x64": "ARCH=x64 electron-builder --config electron-builder.config.js --mac --x64",
    "build": "npm run clean && npm run build:frontend && npm run build:mac:arm64 && npm run build:mac:x64",
    "publish:mac:arm64": "ARCH=arm64 electron-builder --config electron-builder.config.js --mac --arm64 --publish always",
    "publish:mac:x64": "ARCH=x64 electron-builder --config electron-builder.config.js --mac --x64 --publish always",
    "publish": "npm run clean && npm run build:frontend && npm run publish:mac:arm64 && npm run publish:mac:x64"
  }
}
```

### Build Steps

#### 1. Local Build (No Publishing)

```bash
cd electron
npm run build
```

This will:
1. Clean clipboard data
2. Build frontend (Vite → static files)
3. Build ARM64 version of the app
4. Build x64 version of the app

Output:
- `electron/dist/Clipp-0.1.0-arm64.dmg`
- `electron/dist/Clipp-0.1.0-x64.dmg`
- `electron/dist/Clipp-0.1.0-arm64-mac.zip`
- `electron/dist/Clipp-0.1.0-x64-mac.zip`

#### 2. Publish to GitHub Releases

```bash
cd electron

# Set GitHub token
export GH_TOKEN=your_github_personal_access_token

# Bump version in package.json first
npm version patch  # or minor, or major

# Publish
npm run publish
```

This will:
1. Clean clipboard data
2. Build frontend
3. Build ARM64 version and upload to GitHub
4. Build x64 version and upload to GitHub

**GitHub Release will be created automatically with:**
- Tag: `v0.1.0` (from package.json version)
- Title: `v0.1.0`
- Assets:
  - `Clipp-0.1.0-arm64.dmg`
  - `Clipp-0.1.0-x64.dmg`
  - `Clipp-0.1.0-arm64-mac.zip`
  - `Clipp-0.1.0-x64-mac.zip`
  - `latest-mac.yml` (update metadata)

---

## Publishing to GitHub Releases

### Prerequisites

1. **GitHub Personal Access Token**

Create a token at: https://github.com/settings/tokens

Required scopes:
- `repo` (Full control of private repositories)

```bash
export GH_TOKEN=ghp_your_token_here
```

2. **GitHub Repository**

Make sure your repository exists and matches the config:

```javascript
publish: [
  {
    provider: "github",
    owner: "joshmarnold",
    repo: "clipp",
  },
]
```

### dev-app-update.yml (Development)

**File: `electron/dev-app-update.yml`**

```yaml
provider: github
owner: joshmarnold
repo: copy-paste-app
token: ghp_your_token_here  # optional; for private repos
```

This file is used **during development** to test auto-updates locally without publishing.

### Publishing Workflow

```bash
# 1. Make sure frontend is up to date
cd electron/frontend
npm run build
cd ..

# 2. Bump version
npm version patch  # 0.1.0 → 0.1.1

# 3. Set GitHub token
export GH_TOKEN=ghp_...

# 4. Publish
npm run publish
```

### What Happens During Publish

1. **electron-builder** packages the app for ARM64
2. Creates DMG and ZIP files
3. Uploads to GitHub Releases (draft by default)
4. Repeats for x64 architecture
5. Creates a release tag (e.g., `v0.1.1`)
6. Uploads `latest-mac.yml` metadata file

### Manual Release Steps

After publishing, go to GitHub:

1. Navigate to **Releases** tab
2. Find the draft release
3. Add release notes
4. Click **Publish release**

---

## Auto-Update System

### Dependencies

```json
{
  "dependencies": {
    "electron-updater": "^6.6.2"
  }
}
```

### Implementation

#### 1. Main Process Setup

**File: `electron/backend/main.js`**

```javascript
const { app } = require("electron");
const { autoUpdater } = require("electron-updater");
const appStore = require("./AppStore");

function setupAutoUpdater() {
  // Check for updates immediately on startup
  autoUpdater.checkForUpdates();

  // Check for updates every 30 minutes
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 1000 * 60 * 30);

  // When update is available, notify the renderer
  autoUpdater.on("update-available", () => {
    appStore.setUpdateAvailable(true);
  });
}

app.whenReady().then(() => {
  // ... other setup
  setupAutoUpdater();
});
```

#### 2. AppStore (State Management)

**File: `electron/backend/AppStore.js`**

```javascript
class AppStore {
  constructor() {
    this.updateAvailable = false;
  }

  setUpdateAvailable(isAvailable) {
    this.updateAvailable = isAvailable;
    if (this.win) {
      this.win.webContents.send("update-available", { isAvailable });
    }
  }

  getUpdateAvailable() {
    return this.updateAvailable;
  }
}

module.exports = new AppStore();
```

#### 3. IPC Handlers

**File: `electron/backend/ipc.js`**

```javascript
const { ipcMain } = require("electron");
const appStore = require("./AppStore");

function registerIpcHandlers(win) {
  ipcMain.handle("get-update-available", () => {
    return appStore.getUpdateAvailable();
  });
}
```

#### 4. Preload Script

**File: `electron/backend/preload.js`**

```javascript
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onUpdateAvailable: (callback) => {
    ipcRenderer.on("update-available", callback);
  },
  getUpdateAvailable: () => {
    return ipcRenderer.invoke("get-update-available");
  },
});
```

#### 5. Renderer Process (React)

```javascript
import { useEffect, useState } from "react";

function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check initial state
    window.electronAPI.getUpdateAvailable().then(setUpdateAvailable);

    // Listen for updates
    window.electronAPI.onUpdateAvailable((event, data) => {
      setUpdateAvailable(data.isAvailable);
    });
  }, []);

  return (
    <div>
      {updateAvailable && (
        <div className="update-banner">
          A new update is available! Please restart the app.
        </div>
      )}
      {/* rest of your app */}
    </div>
  );
}
```

### electron-updater Behavior

#### How It Works

1. **Check for Updates**: `autoUpdater.checkForUpdates()`
   - Queries GitHub API: `https://api.github.com/repos/owner/repo/releases/latest`
   - Compares latest release version with current app version

2. **Download Update**: (Automatic)
   - If newer version found, downloads `.zip` file silently in background
   - No user interaction required

3. **Install on Quit**: (Default behavior)
   - Update is applied when user quits the app
   - Next launch will use new version

#### Events

```javascript
autoUpdater.on("checking-for-update", () => {
  console.log("Checking for updates...");
});

autoUpdater.on("update-available", (info) => {
  console.log("Update available:", info.version);
});

autoUpdater.on("update-not-available", (info) => {
  console.log("No updates available");
});

autoUpdater.on("error", (err) => {
  console.error("Update error:", err);
});

autoUpdater.on("download-progress", (progress) => {
  console.log(`Downloaded ${progress.percent}%`);
});

autoUpdater.on("update-downloaded", (info) => {
  console.log("Update downloaded, will install on quit");
  // Optionally prompt user to restart
  // autoUpdater.quitAndInstall();
});
```

### Update Metadata

**File: `latest-mac.yml` (Auto-generated)**

This file is automatically created by electron-builder and uploaded to GitHub Releases. It contains:

```yaml
version: 0.1.1
files:
  - url: Clipp-0.1.1-arm64-mac.zip
    sha512: abc123...
    size: 12345678
  - url: Clipp-0.1.1-x64-mac.zip
    sha512: def456...
    size: 12345678
path: Clipp-0.1.1-arm64-mac.zip
sha512: abc123...
releaseDate: '2024-06-12T10:30:00.000Z'
```

electron-updater reads this file to:
- Determine if update is available
- Download the correct architecture
- Verify file integrity (SHA512)

---

## Native Binary Compilation

This app uses a Swift-based native binary to capture clipboard images.

### Swift Source Code

**File: `electron/scripts/get_clipboard_image.swift`**

```swift
import AppKit

// Get the image from the clipboard
guard let image = NSPasteboard.general.readObjects(forClasses: [NSImage.self], options: nil)?.first as? NSImage else {
    exit(1) // No image found
}

// Convert image to PNG data
guard let tiffData = image.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiffData),
      let pngData = bitmap.representation(using: .png, properties: [:]) else {
    exit(1) // Failed to convert
}

// Encode to base64 and print as data URL
let base64 = pngData.base64EncodedString()
print("data:image/png;base64,\(base64)")
```

### Compile Script

**File: `electron/package.json`**

```json
{
  "scripts": {
    "create-binaries": "swiftc -target arm64-apple-macos10.13 scripts/get_clipboard_image.swift -o backend/native/get_clipboard_image.arm64 && swiftc -target x86_64-apple-macos10.13 scripts/get_clipboard_image.swift -o backend/native/get_clipboard_image.x64"
  }
}
```

This compiles two separate binaries:
- `backend/native/get_clipboard_image.arm64` (Apple Silicon)
- `backend/native/get_clipboard_image.x64` (Intel)

### Usage in Electron

```javascript
const { execFileSync } = require("child_process");
const path = require("path");
const os = require("os");

function getClipboardImage() {
  const arch = os.arch() === "arm64" ? "arm64" : "x64";
  const binaryPath = path.join(
    process.resourcesPath,
    `get_clipboard_image.${arch}`
  );

  try {
    const result = execFileSync(binaryPath, { encoding: "utf-8" });
    return result.trim(); // Returns data:image/png;base64,...
  } catch (error) {
    console.error("Failed to get clipboard image:", error);
    return null;
  }
}
```

### Why Separate Binaries?

- Swift binaries are architecture-specific
- macOS has two architectures: ARM64 (M1/M2/M3) and x64 (Intel)
- Each build includes only the binary for its target architecture
- electron-builder's `extraFiles` config handles this automatically

---

## Development vs Production

### Development Mode

**File: `electron/backend/main.js`**

```javascript
if (process.env.NODE_ENV === "development") {
  console.log("Running in development mode");

  const customUserDataPath = path.join(
    process.platform === "darwin"
      ? path.join(process.env.HOME, "Library", "Application Support")
      : app.getPath("appData"),
    "Clipp"
  );

  app.setPath("userData", customUserDataPath);
}
```

In development:
- Uses custom user data path
- Skips auto-update checks (can be enabled with `dev-app-update.yml`)
- Loads frontend from Vite dev server (http://localhost:4000)

### Production Mode

In production:
- Uses default user data path
- Auto-update checks run every 30 minutes
- Loads frontend from bundled files (`frontend/dist`)

---

## Supabase Edge Function for Updates

### File: `electron/backend/supabase/functions/get_latest_release/index.ts`

```typescript
Deno.serve(async (req) => {
  try {
    const res = await fetch(
      "https://api.github.com/repos/joshmarnold/clipp/releases/latest",
      {
        headers: {
          Authorization: `token ${Deno.env.get("GITHUB_API_KEY")}`,
        },
      }
    );

    const data = await res.json();
    const dmgAsset = data.assets.find((asset: any) =>
      asset.name.endsWith(".dmg")
    );

    if (!dmgAsset.browser_download_url) {
      throw new Error("No .dmg asset found in latest release");
    }

    const returnData = JSON.stringify({
      version: data.tag_name,
      downloadUrl: dmgAsset.browser_download_url,
    });

    return new Response(returnData, {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify(err), { status: 500 });
  }
});
```

This edge function:
- Queries GitHub API for latest release
- Finds the DMG asset
- Returns version and download URL
- Used by your website to show download link

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
cd electron
npm install electron-builder electron-updater --save-dev
```

### Step 2: Create Icon File

1. Create a 1024x1024 PNG icon
2. Use `iconutil` to convert to .icns:

```bash
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

iconutil -c icns icon.iconset
mv icon.icns electron/build/icons/
```

### Step 3: Create electron-builder Config

Create `electron/electron-builder.config.js` (see example above)

### Step 4: Add Build Scripts

Add to `electron/package.json` (see scripts above)

### Step 5: Compile Native Binaries (if needed)

```bash
cd electron
npm run create-binaries
```

### Step 6: Test Local Build

```bash
cd electron
npm run build
```

Check output in `electron/dist/`

### Step 7: Setup GitHub

1. Create repository on GitHub
2. Generate personal access token
3. Set environment variable:

```bash
export GH_TOKEN=ghp_your_token_here
```

### Step 8: Implement Auto-Updater

Add auto-update logic to `main.js` (see example above)

### Step 9: Publish First Release

```bash
cd electron

# Bump version
npm version 1.0.0

# Publish
npm run publish
```

### Step 10: Test Updates

1. Install app from release
2. Bump version and publish again
3. Open installed app
4. Wait for update notification
5. Restart app to apply update

---

## Troubleshooting

### Issue: "GH_TOKEN is not set"

**Solution:**

```bash
export GH_TOKEN=ghp_your_token_here
npm run publish
```

Or add to `~/.zshrc` / `~/.bashrc`:

```bash
export GH_TOKEN=ghp_your_token_here
```

### Issue: "Code signing failed"

**Solution:**

For development, use ad-hoc signing:

```javascript
afterSign: async (context) => {
  execSync(`codesign --deep --force --sign - "${fullAppPath}"`);
}
```

For production, get an Apple Developer certificate:

```javascript
mac: {
  identity: "Developer ID Application: Your Name (TEAM_ID)",
}
```

### Issue: "Update not detected"

**Solutions:**

1. Check version in `package.json` is higher than installed version
2. Verify `latest-mac.yml` exists in GitHub Release
3. Check console for errors: `autoUpdater.logger.transports.file.level = 'debug'`
4. Make sure app was installed from a release (not development build)

### Issue: "Native binary not found"

**Solutions:**

1. Make sure binaries are compiled:

```bash
npm run create-binaries
```

2. Verify `asarUnpack` in electron-builder config:

```javascript
asarUnpack: ["**/get_clipboard_image.*"]
```

3. Check `extraFiles` includes correct architecture:

```javascript
extraFiles: [
  {
    from: `backend/native/get_clipboard_image.${arch}`,
    to: `get_clipboard_image.${arch}`,
  },
]
```

### Issue: "App won't open on macOS"

**Solution:**

Disable Gatekeeper check:

```bash
xattr -cr /Applications/Clipp.app
```

Or in electron-builder config:

```javascript
mac: {
  gatekeeperAssess: false,
}
```

---

## File Structure

```
electron/
├── backend/
│   ├── main.js                 # Main process entry
│   ├── ipc.js                  # IPC handlers
│   ├── preload.js              # Preload script
│   ├── AppStore.js             # App state management
│   └── native/
│       ├── get_clipboard_image.arm64
│       └── get_clipboard_image.x64
├── frontend/
│   ├── src/                    # React source
│   └── dist/                   # Built frontend (Vite output)
├── scripts/
│   ├── get_clipboard_image.swift
│   └── makeUniversalApp.js
├── build/
│   └── icons/
│       └── icon.icns
├── electron-builder.config.js  # Build configuration
├── dev-app-update.yml          # Dev update config
└── package.json                # Dependencies & scripts
```

---

## Environment Variables

```bash
# Required for publishing
export GH_TOKEN=ghp_your_github_token

# Optional: Set architecture during build
export ARCH=arm64  # or x64

# Optional: Node environment
export NODE_ENV=development  # or production
```

---

## Summary

This system provides:

- **Multi-architecture builds** - Separate binaries for ARM64 and x64
- **GitHub Releases integration** - Automatic publishing with electron-builder
- **Automatic updates** - Silent background downloads via electron-updater
- **Native binary support** - Swift-based clipboard utilities
- **Code signing** - Ad-hoc signing for development, ready for production certificates
- **Frontend bundling** - Vite-built React app packaged with Electron

The pattern can be adapted to any Electron application requiring professional packaging and distribution.

---

## Quick Reference

### Build Commands

```bash
# Local build (no publish)
npm run build

# Publish to GitHub
npm run publish

# Build specific architecture
npm run build:mac:arm64
npm run build:mac:x64

# Compile native binaries
npm run create-binaries
```

### Version Management

```bash
# Bump patch version (0.1.0 → 0.1.1)
npm version patch

# Bump minor version (0.1.0 → 0.2.0)
npm version minor

# Bump major version (0.1.0 → 1.0.0)
npm version major
```

### electron-updater API

```javascript
// Check for updates manually
autoUpdater.checkForUpdates();

// Download update manually
autoUpdater.downloadUpdate();

// Install and restart
autoUpdater.quitAndInstall();

// Events
autoUpdater.on("update-available", (info) => {});
autoUpdater.on("update-downloaded", (info) => {});
autoUpdater.on("error", (err) => {});
```
