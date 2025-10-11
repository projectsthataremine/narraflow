# Fn Key Detection via hidutil Remapping

## The Problem
The Fn key on macOS doesn't generate detectable events when pressed alone. It's hardware-intercepted and invisible to:
- NSEvent.flagsChanged (only detects Fn + another key)
- IOKit HID (generates no events for Fn alone)

## The Solution: hidutil Remapping

`hidutil` is a macOS command-line tool that can remap HID keyboard keys at the system level. By remapping Fn to another detectable key, we can work around the hardware limitation.

## How It Works

1. Use `hidutil` to remap Fn key to a detectable key (e.g., F13, F14, or Right Command)
2. App detects the remapped key instead
3. User presses Fn, system sends the remapped key event, app receives it

## Finding Your Fn Key Code

```bash
# Install hidutil-generator (optional GUI tool)
# https://hidutil-generator.netlify.app/

# Or use IOKit to find your keyboard's Fn key usage code
# Common codes:
# - 0xFF (255) - Fn key on most keyboards
# - 0x65 (101) - Application key (alternative)
```

## Example Remapping Commands

### Remap Fn to F13 (recommended)
```bash
hidutil property --set '{"UserKeyMapping":[
    {
        "HIDKeyboardModifierMappingSrc": 0xFF,
        "HIDKeyboardModifierMappingDst": 0x68
    }
]}'
```

### Remap Fn to Right Command
```bash
hidutil property --set '{"UserKeyMapping":[
    {
        "HIDKeyboardModifierMappingSrc": 0xFF,
        "HIDKeyboardModifierMappingDst": 0xE7
    }
]}'
```

### Check Current Mappings
```bash
hidutil property --get "UserKeyMapping"
```

### Clear All Mappings
```bash
hidutil property --set '{"UserKeyMapping":[]}'
```

## Key Codes Reference

Common HID Usage Codes (Page 0x07 - Keyboard):
- `0x68` - F13
- `0x69` - F14
- `0x6A` - F15
- `0x6B` - F16
- `0xE3` - Left GUI (Command)
- `0xE7` - Right GUI (Command)
- `0xFF` - Fn key (source)

## Implementation Strategy

### Option 1: User-Managed Remapping
1. Provide instructions for users to run hidutil command
2. Make mapping persistent with LaunchAgent
3. App detects F13/F14 instead of Fn

### Option 2: App-Managed Remapping (Advanced)
1. App requests admin privileges
2. App sets up hidutil remapping automatically
3. App cleans up on uninstall

## Making Remapping Persistent

Create a LaunchAgent to apply remapping at login:

```bash
# Create plist file
cat > ~/Library/LaunchAgents/com.mic2text.fnkey-remap.plist <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mic2text.fnkey-remap</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/hidutil</string>
        <string>property</string>
        <string>--set</string>
        <string>{"UserKeyMapping":[{"HIDKeyboardModifierMappingSrc":0xFF,"HIDKeyboardModifierMappingDst":0x68}]}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF

# Load the agent
launchctl load ~/Library/LaunchAgents/com.mic2text.fnkey-remap.plist
```

## Pros & Cons

### Pros
- ✅ Actually works - Fn key becomes detectable
- ✅ System-level remapping (works everywhere)
- ✅ No kernel extensions needed
- ✅ Works on modern macOS (including Apple Silicon)

### Cons
- ❌ Requires user setup (or admin privileges)
- ❌ Changes system-wide key behavior
- ❌ User loses original Fn key functionality (unless app restores it)
- ❌ Not ideal UX (extra setup step)

## Recommended Approach

**Use F13 as default, offer Fn via remapping as optional feature:**

1. Ship with F13 as the default hotkey (works out of the box)
2. Provide optional "Enable Fn key" feature in settings
3. When enabled:
   - Show instructions for hidutil remapping
   - Provide copy-paste commands
   - Include LaunchAgent setup for persistence
4. App detects F13 (whether from real F13 key or remapped Fn)

This gives users who want Fn key the option, while maintaining a simple default experience.

## References
- [hidutil man page](x-man-page://hidutil)
- [hidutil-generator](https://hidutil-generator.netlify.app/)
- [USB HID Usage Tables](https://www.usb.org/sites/default/files/documents/hut1_12v2.pdf)
