#!/usr/bin/env swift

import Cocoa

print("=== Testing Fn Key Detection (KeyCode 63 Method) ===")
print("Press Fn key to test...")
print("Press Ctrl+C to exit\n")

// Check for accessibility permissions
let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
let hasPermissions = AXIsProcessTrustedWithOptions(options as CFDictionary)

if !hasPermissions {
    print("⚠️  Accessibility permissions required!")
    print("Please grant permissions and restart.\n")
}

// Monitor flag changes
NSEvent.addGlobalMonitorForEvents(matching: .flagsChanged) { event in
    print("[DEBUG] KeyCode: \(event.keyCode), Flags: \(event.modifierFlags.rawValue)")

    if event.keyCode == 63 &&
       event.modifierFlags.intersection(.deviceIndependentFlagsMask).contains(.function) {
        print("✓ fn key pressed")
    }

    if event.keyCode == 63 &&
       event.modifierFlags.intersection(.deviceIndependentFlagsMask) == [] {
        print("✓ fn key released")
    }
}

print("✓ Monitor started\n")

// Run the app
NSApplication.shared.run()
