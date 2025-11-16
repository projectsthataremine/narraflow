#!/bin/bash
set -e

echo "🔨 Building SpeechAnalyzer Helper..."

# Check macOS version
MACOS_VERSION=$(sw_vers -productVersion | cut -d. -f1)
if [ "$MACOS_VERSION" -lt 26 ]; then
    echo "⚠️  Warning: Building SpeechAnalyzer requires macOS 26+"
    echo "   Current version: $(sw_vers -productVersion)"
    echo "   Build may fail if SDK not available"
fi

# Configuration
APP_NAME="NarraFlowSpeechAnalyzer"
BUNDLE_ID="com.narraflow.speechanalyzer-helper"
BUILD_DIR="./build"
APP_BUNDLE="${BUILD_DIR}/${APP_NAME}.app"

# Clean previous build
rm -rf "${BUILD_DIR}"
mkdir -p "${BUILD_DIR}"

# Compile Swift code
echo "📦 Compiling Swift code for Apple Silicon (macOS 26+)..."
if ! swiftc main.swift -o "${BUILD_DIR}/${APP_NAME}" \
    -target arm64-apple-macos26.0 \
    -O \
    -framework Foundation \
    -framework Speech; then
    echo "❌ Compilation failed!"
    echo "   Make sure you have Xcode 26+ installed with macOS 26 SDK"
    exit 1
fi

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
