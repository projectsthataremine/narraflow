#!/bin/bash

# Setup Fn Key Remapping to F13
# Based on: https://gist.github.com/paultheman/808be117d447c490a29d6405975d41bd

echo "=== Fn Key to F13 Remapping Setup ==="
echo ""

# Step 1: List HID devices
echo "Step 1: Finding your keyboard..."
hidutil list

echo ""
echo "Step 2: Checking current key mappings..."
hidutil property --get 'UserKeyMapping'

echo ""
echo "Step 3: Setting up Fn -> F13 remapping..."
echo ""

# Try to remap Fn (0x700000065) to F13 (0x700000068)
# Note: Fn key usage code might vary by keyboard
# Common codes: 0x700000065, 0x7000000FF

echo "Attempting to remap Fn to F13..."
hidutil property --set '{"UserKeyMapping":[
    {
        "HIDKeyboardModifierMappingSrc": 0x7000000FF,
        "HIDKeyboardModifierMappingDst": 0x700000068
    }
]}'

echo ""
echo "✓ Remapping applied!"
echo ""
echo "Test it now:"
echo "1. Press Fn key - it should act like F13"
echo "2. Run the test script: ./test-fn-key.swift"
echo ""
echo "To undo this remapping, run:"
echo "  hidutil property --set '{\"UserKeyMapping\":[]}'"
echo ""
echo "To make this permanent, create a LaunchAgent:"
echo "  See prototype/FN-KEY-REMAPPING.md for instructions"
echo ""

# Check if remapping was successful
echo "Current mappings:"
hidutil property --get 'UserKeyMapping'
