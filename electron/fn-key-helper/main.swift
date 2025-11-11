import Cocoa
import Foundation

// MARK: - IPC Message Types

struct IPCRequest: Codable {
    let type: String
}

struct IPCResponse: Codable {
    let type: String
    let success: Bool
    let error: String?
}

struct KeyEvent: Codable {
    let type: String
    let keyCode: Int
    let pressed: Bool
    let timestamp: Double
}

// MARK: - Keyboard Monitor

class KeyboardMonitor {
    private var eventTap: CFMachPort?
    private var runLoopSource: CFRunLoopSource?
    private var isRunning = false

    func start() -> Bool {
        // Check for accessibility permissions
        let options = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true]
        let hasPermission = AXIsProcessTrustedWithOptions(options as CFDictionary)

        if !hasPermission {
            logError("Accessibility permissions not granted")
            return false
        }

        // Create event mask for the events we want to monitor
        let eventMask = (1 << CGEventType.flagsChanged.rawValue)

        // Create event tap
        guard let tap = CGEvent.tapCreate(
            tap: .cgSessionEventTap,
            place: .headInsertEventTap,
            options: .defaultTap,
            eventsOfInterest: CGEventMask(eventMask),
            callback: { (proxy, type, event, refcon) -> Unmanaged<CGEvent>? in
                // Get the monitor instance
                let monitor = Unmanaged<KeyboardMonitor>.fromOpaque(refcon!).takeUnretainedValue()
                monitor.handleEvent(type: type, event: event)
                return Unmanaged.passRetained(event)
            },
            userInfo: Unmanaged.passUnretained(self).toOpaque()
        ) else {
            logError("Failed to create event tap")
            return false
        }

        self.eventTap = tap

        // Create run loop source
        runLoopSource = CFMachPortCreateRunLoopSource(kCFAllocatorDefault, tap, 0)
        CFRunLoopAddSource(CFRunLoopGetCurrent(), runLoopSource, .commonModes)
        CGEvent.tapEnable(tap: tap, enable: true)

        isRunning = true
        logInfo("Keyboard monitor started successfully")
        return true
    }

    func stop() {
        if let tap = eventTap {
            CGEvent.tapEnable(tap: tap, enable: false)
            CFRunLoopRemoveSource(CFRunLoopGetCurrent(), runLoopSource, .commonModes)
            eventTap = nil
            runLoopSource = nil
        }
        isRunning = false
        logInfo("Keyboard monitor stopped")
    }

    private func handleEvent(type: CGEventType, event: CGEvent) {
        guard type == .flagsChanged else { return }

        let keyCode = event.getIntegerValueField(.keyboardEventKeycode)

        // Check if it's the Fn key (keyCode 63 / 0x3F)
        if keyCode == 63 {
            let flags = event.flags
            let isFnPressed = flags.contains(.maskSecondaryFn)

            // Send key event to Electron via stdout
            sendKeyEvent(keyCode: Int(keyCode), pressed: isFnPressed)
        }
    }

    private func sendKeyEvent(keyCode: Int, pressed: Bool) {
        let event = KeyEvent(
            type: "KeyEvent",
            keyCode: keyCode,
            pressed: pressed,
            timestamp: Date().timeIntervalSince1970
        )

        sendIPCMessage(event)
    }
}

// MARK: - IPC Communication

func sendIPCMessage<T: Codable>(_ message: T) {
    let encoder = JSONEncoder()
    encoder.outputFormatting = .sortedKeys

    do {
        let jsonData = try encoder.encode(message)
        if let jsonString = String(data: jsonData, encoding: .utf8) {
            print(jsonString, terminator: "\n")
            fflush(stdout)
        }
    } catch {
        logError("Failed to encode IPC message: \(error)")
    }
}

func sendResponse(type: String, success: Bool, error: String? = nil) {
    let response = IPCResponse(type: type, success: success, error: error)
    sendIPCMessage(response)
}

func logInfo(_ message: String) {
    fputs("[INFO] \(message)\n", stderr)
    fflush(stderr)
}

func logError(_ message: String) {
    fputs("[ERROR] \(message)\n", stderr)
    fflush(stderr)
}

// MARK: - Message Handler

class MessageHandler {
    let monitor = KeyboardMonitor()

    func handleMessage(_ json: String) {
        let decoder = JSONDecoder()

        do {
            guard let data = json.data(using: .utf8) else {
                logError("Invalid JSON string")
                return
            }

            let request = try decoder.decode(IPCRequest.self, from: data)

            switch request.type {
            case "StartMonitoring":
                // MUST run on main thread where the run loop is
                DispatchQueue.main.async {
                    let success = self.monitor.start()
                    sendResponse(type: "StartMonitoringResponse", success: success,
                               error: success ? nil : "Failed to start keyboard monitoring")
                }

            case "StopMonitoring":
                DispatchQueue.main.async {
                    self.monitor.stop()
                    sendResponse(type: "StopMonitoringResponse", success: true)
                }

            case "Ping":
                sendResponse(type: "PongResponse", success: true)

            default:
                logError("Unknown message type: \(request.type)")
                sendResponse(type: "ErrorResponse", success: false, error: "Unknown message type")
            }

        } catch {
            logError("Failed to parse IPC message: \(error)")
            sendResponse(type: "ErrorResponse", success: false, error: "Parse error")
        }
    }
}

// MARK: - Main

// Initialize NSApplication (required for event taps in bundled apps)
let app = NSApplication.shared
app.setActivationPolicy(.accessory)

let handler = MessageHandler()

logInfo("Fn Key Helper started")

// Send ready message
sendResponse(type: "ReadyResponse", success: true)

// Read from stdin on a background thread
DispatchQueue.global(qos: .userInteractive).async {
    while let line = readLine(strippingNewline: true) {
        if !line.isEmpty {
            handler.handleMessage(line)
        }
    }
    exit(0)
}

// Run the main run loop to process events
CFRunLoopRun()
