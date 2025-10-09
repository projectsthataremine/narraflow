#!/bin/bash

# Helper script to run tests with correct library path
# Works on both Intel and Apple Silicon Macs

if [[ $(uname -m) == 'arm64' ]]; then
    export DYLD_LIBRARY_PATH=$PWD/node_modules/sherpa-onnx-darwin-arm64:$DYLD_LIBRARY_PATH
    echo "🍎 Apple Silicon detected - using sherpa-onnx-darwin-arm64"
else
    export DYLD_LIBRARY_PATH=$PWD/node_modules/sherpa-onnx-darwin-x64:$DYLD_LIBRARY_PATH
    echo "💻 Intel Mac detected - using sherpa-onnx-darwin-x64"
fi

# Check if argument provided
if [ "$1" == "mic" ]; then
    echo "Running microphone capture test..."
    node test-mic-capture.js
elif [ "$1" == "cleanup" ]; then
    echo "Running full pipeline test (with LLM cleanup)..."
    node test-mic-with-cleanup.js
elif [ "$1" == "levels" ]; then
    echo "Running audio levels visualization test..."
    node test-audio-levels.js
else
    echo "Running file-based audio pipeline test..."
    node test-audio-pipeline.js
fi
