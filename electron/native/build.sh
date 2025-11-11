#!/bin/bash
# Build script for Fn key native addon

set -e

echo "Building Swift FnKeyListener..."
swiftc -emit-objc-header-path build/Mic2Text-Swift.h \
       -emit-object -o build/FnKeyListener.o \
       src/FnKeyListener.swift \
       -import-objc-header include/SwiftBridge.h \
       -framework AppKit \
       -framework Carbon \
       -framework Foundation

echo "Copying Swift header to include directory..."
cp build/Mic2Text-Swift.h include/

echo "Building Node.js addon for Electron..."
npx node-gyp build --target=30.5.1 --dist-url=https://electronjs.org/headers

echo "Build complete! Addon location: build/Release/fn_key_addon.node"
