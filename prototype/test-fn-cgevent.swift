import Cocoa
import Carbon

print("Testing Fn key detection with CGEventTap...")
print("Press Fn key (or any key) - Ctrl+C to exit")
print("")

// Create event tap callback
let eventMask = (1 << CGEventType.keyDown.rawValue) |
                (1 << CGEventType.keyUp.rawValue) |
                (1 << CGEventType.flagsChanged.rawValue)

func eventTapCallback(proxy: CGEventTapProxy, type: CGEventType, event: CGEvent, refcon: UnsafeMutableRawPointer?) -> Unmanaged<CGEvent>? {
    let keyCode = event.getIntegerValueField(.keyboardEventKeycode)
    let flags = event.flags

    if type == .flagsChanged {
        print("🔄 FlagsChanged - keyCode: \(keyCode) (0x\(String(keyCode, radix: 16))) flags: \(flags.rawValue)")

        // Check specifically for Fn key (keyCode 63 / 0x3F)
        if keyCode == 63 {
            let isFnPressed = flags.contains(.maskSecondaryFn)
            print("   ✨ FN KEY DETECTED! pressed: \(isFnPressed)")
        }
    } else if type == .keyDown {
        print("⬇️  KeyDown - keyCode: \(keyCode) (0x\(String(keyCode, radix: 16)))")
    } else if type == .keyUp {
        print("⬆️  KeyUp - keyCode: \(keyCode) (0x\(String(keyCode, radix: 16)))")
    }

    return Unmanaged.passRetained(event)
}

// Create the event tap
guard let eventTap = CGEvent.tapCreate(
    tap: .cgSessionEventTap,
    place: .headInsertEventTap,
    options: .defaultTap,
    eventsOfInterest: CGEventMask(eventMask),
    callback: eventTapCallback,
    userInfo: nil
) else {
    print("❌ ERROR: Failed to create event tap!")
    print("   Make sure you've granted Accessibility permissions:")
    print("   System Settings > Privacy & Security > Accessibility")
    exit(1)
}

// Create run loop source and add to current run loop
let runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, eventTap, 0)
CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, .commonModes)
CGEvent.tapEnable(tap: eventTap, enable: true)

print("✅ Event tap created successfully!")
print("   Listening for keyboard events...")
print("")

// Run the event loop
CFRunLoopRun()
