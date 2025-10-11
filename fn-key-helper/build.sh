#!/bin/bash
set -e

echo "🔨 Building Fn Key Helper..."

# Configuration
APP_NAME="Mic2TextFnHelper"
BUNDLE_ID="com.mic2text.fn-helper"
BUILD_DIR="./build"
APP_BUNDLE="${BUILD_DIR}/${APP_NAME}.app"

# Clean previous build
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Compile Swift code
echo "📦 Compiling Swift code..."
swiftc main.swift -o "${BUILD_DIR}/${APP_NAME}" \
    -target arm64-apple-macos11.0 \
    -target x86_64-apple-macos11.0 \
    -O

# Create app bundle structure
echo "📁 Creating app bundle..."
mkdir -p "${APP_BUNDLE}/Contents/MacOS"
mkdir -p "${APP_BUNDLE}/Contents/Resources"

# Copy executable
cp "${BUILD_DIR}/${APP_NAME}" "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"
chmod +x "${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"

# Copy Info.plist
cp Info.plist "${APP_BUNDLE}/Contents/Info.plist"

# Generate PkgInfo
echo "APPL????" > "${APP_BUNDLE}/Contents/PkgInfo"

echo "✅ Build complete: ${APP_BUNDLE}"
echo ""
echo "To test:"
echo "  ${APP_BUNDLE}/Contents/MacOS/${APP_NAME}"
