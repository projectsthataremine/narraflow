/**
 * FnKeyListener.swift
 * Native Swift implementation for detecting macOS Fn/Globe key presses using NSEvent
 *
 * Based on solution from: https://kodejava.org/how-to-detect-fn-key-press-in-swift/
 * Uses NSEvent.flagsChanged to monitor modifier key state changes.
 *
 * IMPORTANT: This detects when Fn is in the modifier flags, but will also trigger
 * if Fn is held and other modifiers change. It's not a pure Fn-only detector but
 * works well for push-to-talk use cases.
 */

import Cocoa

@objc public class FnKeyListener: NSObject {
    private var eventMonitor: Any?
    private var callback: ((Bool) -> Void)?
    private var isFnCurrentlyPressed = false

    /**
     * Check if the app has Accessibility permissions
     */
    @objc public func checkAccessibilityPermissions() -> Bool {
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: false]
        let hasPermissions = AXIsProcessTrustedWithOptions(options as CFDictionary)

        if hasPermissions {
            print("[FnKeyListener] Accessibility permissions granted")
        } else {
            print("[FnKeyListener] Accessibility permissions NOT granted")
        }

        return hasPermissions
    }

    /**
     * Request Accessibility permissions from the user
     */
    @objc public func requestAccessibilityPermissions() {
        print("[FnKeyListener] Requesting Accessibility permissions...")
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
        _ = AXIsProcessTrustedWithOptions(options as CFDictionary)
    }

    /**
     * Open System Settings to Accessibility preferences
     */
    @objc public func openAccessibilityPreferences() {
        print("[FnKeyListener] Opening System Settings > Privacy & Security > Accessibility")
        let url = URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!
        NSWorkspace.shared.open(url)
    }

    /**
     * Start listening for Fn key events using NSEvent.flagsChanged
     */
    @objc public func startListening(_ callback: @escaping (Bool) -> Void) -> Bool {
        self.callback = callback

        print("[FnKeyListener] Starting NSEvent.flagsChanged listener for Fn key...")

        // Check for Accessibility permissions first
        if !checkAccessibilityPermissions() {
            print("[FnKeyListener] Cannot start - Accessibility permissions required")
            requestAccessibilityPermissions()
            return false
        }

        // Monitor global flag change events
        eventMonitor = NSEvent.addGlobalMonitorForEvents(matching: .flagsChanged) { [weak self] event in
            self?.handleFlagsChanged(event: event)
        }

        // Also monitor local events (within our app)
        NSEvent.addLocalMonitorForEvents(matching: .flagsChanged) { [weak self] event in
            self?.handleFlagsChanged(event: event)
            return event
        }

        print("[FnKeyListener] NSEvent.flagsChanged listener started successfully")
        return true
    }

    /**
     * Handle flag change events
     */
    private func handleFlagsChanged(event: NSEvent) {
        // Check if Fn key is in the modifier flags
        let isFnPressed = event.modifierFlags.intersection(.deviceIndependentFlagsMask).contains(.function)

        // Only trigger callback if state changed
        if isFnPressed != self.isFnCurrentlyPressed {
            self.isFnCurrentlyPressed = isFnPressed
            print("[FnKeyListener] Fn key \(isFnPressed ? "pressed" : "released")")
            self.callback?(isFnPressed)
        }
    }

    /**
     * Stop listening for Fn key events
     */
    @objc public func stopListening() {
        print("[FnKeyListener] Stopping NSEvent.flagsChanged listener...")

        if let monitor = eventMonitor {
            NSEvent.removeMonitor(monitor)
            eventMonitor = nil
        }

        callback = nil
        isFnCurrentlyPressed = false

        print("[FnKeyListener] NSEvent.flagsChanged listener stopped")
    }

    /**
     * Check if Fn key is currently pressed
     */
    @objc public func isPressed() -> Bool {
        return isFnCurrentlyPressed
    }
}
