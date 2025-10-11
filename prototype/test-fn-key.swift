#!/usr/bin/env swift

/**
 * Standalone Fn Key Detection Test
 * Quick script to test different approaches for detecting Fn key
 */

import Cocoa
import IOKit.hid

print("=== Fn Key Detection Test ===")
print("Press Fn key to test detection...")
print("Press Ctrl+C to exit\n")

// MARK: - Approach 1: NSEvent.flagsChanged

class FlagChangeMonitor {
    private var eventMonitor: Any?

    func start() {
        print("[NSEvent] Starting flagsChanged monitor...")

        // Global monitor
        eventMonitor = NSEvent.addGlobalMonitorForEvents(matching: .flagsChanged) { event in
            self.handleFlagsChanged(event: event)
        }

        // Local monitor
        NSEvent.addLocalMonitorForEvents(matching: .flagsChanged) { event in
            self.handleFlagsChanged(event: event)
            return event
        }
    }

    private func handleFlagsChanged(event: NSEvent) {
        // Always print debug info
        print("[DEBUG] KeyCode: \(event.keyCode), Flags: \(event.modifierFlags.rawValue)")

        // Test the keyCode 63 approach from Stack Overflow
        if event.keyCode == 63 &&
           event.modifierFlags.intersection(.deviceIndependentFlagsMask).contains(.function) {
            print("[NSEvent] ✓ fn key PRESSED (keyCode 63 + .function flag)")
        }

        if event.keyCode == 63 &&
           event.modifierFlags.intersection(.deviceIndependentFlagsMask) == [] {
            print("[NSEvent] ✓ fn key RELEASED (keyCode 63 + no flags)")
        }
    }
}

// MARK: - Approach 2: IOKit HID

class HIDMonitor {
    private var hidManager: IOHIDManager?

    func start() {
        print("[IOKit HID] Starting HID manager...")

        let manager = IOHIDManagerCreate(kCFAllocatorDefault, IOOptionBits(kIOHIDOptionsTypeNone))
        self.hidManager = manager

        // Match keyboards
        let deviceMatch: [String: Any] = [
            kIOHIDDeviceUsagePageKey as String: kHIDPage_GenericDesktop,
            kIOHIDDeviceUsageKey as String: kHIDUsage_GD_Keyboard
        ]

        IOHIDManagerSetDeviceMatching(manager, deviceMatch as CFDictionary)

        // Register callbacks
        let context = Unmanaged.passUnretained(self).toOpaque()

        IOHIDManagerRegisterDeviceMatchingCallback(manager, { context, result, sender, device in
            print("[IOKit HID] ✓ Device matched")
        }, context)

        IOHIDManagerRegisterInputValueCallback(manager, { context, result, sender, value in
            guard let context = context else { return }
            let monitor = Unmanaged<HIDMonitor>.fromOpaque(context).takeUnretainedValue()
            monitor.handleHIDInput(value: value)
        }, context)

        // Schedule with run loop
        IOHIDManagerScheduleWithRunLoop(manager, CFRunLoopGetMain(), CFRunLoopMode.defaultMode.rawValue as CFString)

        // Open manager
        let openResult = IOHIDManagerOpen(manager, IOOptionBits(kIOHIDOptionsTypeNone))
        if openResult != kIOReturnSuccess {
            print("[IOKit HID] ✗ Failed to open manager: \(openResult)")
        } else {
            print("[IOKit HID] ✓ Manager opened successfully")
        }
    }

    private func handleHIDInput(value: IOHIDValue) {
        let element = IOHIDValueGetElement(value)
        let usagePage = IOHIDElementGetUsagePage(element)
        let usage = IOHIDElementGetUsage(element)
        let intValue = IOHIDValueGetIntegerValue(value)

        // Check for Fn key patterns
        let isFnKey = (usagePage == 0xFF && usage == 0x03) ||  // Apple vendor Fn
                      (usagePage == 0x07 && usage == 0xFF) ||  // Standard Fn
                      (usagePage == 0x07 && usage == 0x65)     // Alternative Fn

        if isFnKey {
            let state = intValue != 0 ? "PRESSED" : "RELEASED"
            print("[IOKit HID] ✓ Fn key \(state) - Page: \(usagePage), Usage: \(usage), Value: \(intValue)")
        }
    }
}

// MARK: - Main

// Check for accessibility permissions
func checkAccessibilityPermissions() -> Bool {
    let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
    return AXIsProcessTrustedWithOptions(options as CFDictionary)
}

if !checkAccessibilityPermissions() {
    print("⚠️  Accessibility permissions required!")
    print("Please grant permissions and restart the script.\n")
} else {
    print("✓ Accessibility permissions granted\n")
}

// Start monitors
let flagMonitor = FlagChangeMonitor()
flagMonitor.start()

let hidMonitor = HIDMonitor()
hidMonitor.start()

print("\n=== Ready for testing ===")
print("Try these tests:")
print("1. Press Fn key alone")
print("2. Press Fn + another key (e.g., Fn + Space)")
print("3. Press other modifier keys (Command, Option, etc.)\n")

// Run the app
NSApplication.shared.run()
