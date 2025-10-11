# Mic2Text MVP

Offline speech-to-text with hotkey activation for macOS.

## Features

- 🎤 **Hotkey Activation**: Press Command+B to record, release to transcribe
- 🔒 **Offline-First**: All processing happens locally, no cloud required
- ⚡ **Fast**: <3 second response time for short phrases
- 🎯 **Smart Paste**: Automatically pastes into focused text field
- 🎨 **Visual Feedback**: Pill UI shows recording state
- 🔇 **Silence Detection**: Automatically trims silence and detects speech

## MVP Status

This is an MVP (Minimum Viable Product) implementation with stubbed ML models:

- ✅ **Implemented**: Full Electron app structure, UI, IPC, audio capture, clipboard/paste
- 🚧 **Stubbed**: Whisper transcription (returns mock text), Silero VAD (basic energy detection), LLaMA cleanup (regex-based)

## Quick Start

### Prerequisites

- macOS 13 (Ventura) or later
- Node.js 20+
- Homebrew (for SoX audio library)

### Installation

```bash
# Install dependencies
npm install

# Install SoX (for audio capture)
brew install sox
```

### Development

```bash
# Run in development mode
npm run dev
```

The app will:
1. Start Vite dev server for renderer
2. Launch Electron with hot reload
3. Request Microphone and Accessibility permissions

### Testing

```bash
# Run unit and integration tests
npm test

# Run end-to-end tests (Playwright)
npm run test:e2e
```

### Build

```bash
# Build for production
npm run build

# Create distributable
npm run build
```

## Usage

1. **Grant Permissions**:
   - Microphone: Allow when prompted
   - Accessibility: System Settings → Privacy & Security → Accessibility

2. **Record**:
   - Press `Command+B` to start recording
   - Speak your text
   - Release `Command+B` to transcribe

3. **Result**:
   - Text is copied to clipboard
   - Text is automatically pasted into focused field
   - If no text field focused, clipboard-only mode

## MVP Limitations

- **Mock transcription**: Returns placeholder text based on audio duration
- **Basic VAD**: Uses simple energy detection instead of Silero model
- **Regex cleanup**: Simple capitalization instead of LLaMA
- **Auto-stop**: Records for 5 seconds max (simulates key release)

## Post-MVP Enhancements

To add real ML models:

1. **Whisper ONNX**: Download model to `resources/models/whisper-tiny.onnx`
2. **Silero VAD**: Download to `resources/models/silero_vad.onnx`
3. **LLaMA**: Download to `resources/models/llm/*.gguf`
4. Update model loaders in `src/worker/` to use real models

## Architecture

### Two Windows

Mic2Text uses two separate Electron windows:

1. **Home App** (Settings Window)
   - Configuration and settings interface
   - Shows on startup in development mode
   - In production: hidden by default, only shown when user explicitly opens it
   - **Never appears during recording/transcription/paste** - remains hidden during active use
   - Located at: `src/settings/`

2. **Visualization** (Overlay Window)
   - Animated pill showing recording status (loading → silent → talking → processing)
   - Appears at bottom-center of screen when Command+B is pressed
   - **Non-intrusive**: Shows WITHOUT stealing focus - cursor stays in your active app (Notes, Slack, etc.)
   - Transparent, frameless, always-on-top
   - Located at: `src/ui/`

### Recording Flow

1. **Start**: Press `Command+B` in any app (e.g., Notes)
   - Visualization appears showing animated pill
   - Focus remains in your app (cursor doesn't move)
   - Audio recording starts

2. **Recording**: Speak while holding Command+B
   - Pill animates based on voice amplitude
   - All processing happens in background

3. **Transcription**: Release Command+B
   - Visualization shows "processing" state
   - Audio sent to Whisper model in worker thread
   - Focus still remains in your app

4. **Paste**: Text automatically appears
   - Text copied to clipboard
   - Cmd+V automatically simulated
   - Text pastes at cursor position in your app
   - Visualization disappears

**Key Feature**: Your cursor never leaves your active application. The entire process is non-intrusive.

## Project Structure

```
src/
  main/         # Electron main process (IPC, hotkeys, window management)
  worker/       # Transcription worker (VAD, Whisper, pipeline)
  rewrite/      # Text cleanup (LLaMA stub)
  paste/        # Clipboard and paste simulation
  audio/        # Audio capture and session management
  ui/           # React UI - Visualization overlay (Pill, ErrorPopup)
  settings/     # React UI - Home App (configuration)
  types/        # TypeScript contracts

tests/
  unit/         # Unit tests (Vitest)
  integration/  # Integration tests
```

## Performance

**MVP Targets** (with stubs):
- Transcription: <2s (mock delay)
- Cleanup: <100ms (regex)
- End-to-end: <3s

**Production Targets** (with real models):
- Transcription: <2s (Whisper Tiny on M1/M2)
- Cleanup: <300ms (Phi-3 Mini)
- End-to-end: <3s

## License

MIT

## Acknowledgments

- Inspired by Wispr Flow
- Built with Electron, React, and TypeScript
