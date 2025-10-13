# NarraFlow Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-12

## Active Technologies
- Node 20 with TypeScript in Electron 30 + `onnxruntime-node`, `node-record-lpcm16`, `@nut-tree/nut-js` or `robotjs`

## Project Structure
```
src/
tests/
```

## Commands
npm test [ONLY COMMANDS FOR ACTIVE TECHNOLOGIES][ONLY COMMANDS FOR ACTIVE TECHNOLOGIES] npm run lint

## Code Style
Node 20 with TypeScript in Electron 30: Follow standard conventions

## Recent Changes
- 2025-10-12: Renamed project from Mic2Text to NarraFlow
- Added Node 20 with TypeScript in Electron 30 + `onnxruntime-node`, `node-record-lpcm16`, `@nut-tree/nut-js` or `robotjs`

<!-- MANUAL ADDITIONS START -->

## Current Implementation Status
✅ UI overlay with dots (loading, silence, talking, processing)
✅ Command+B hotkey for start/stop recording
✅ Multi-monitor support (300ms tracking interval)
✅ Transparent window with no border
✅ Worker thread infrastructure
🔄 **NEXT**: Implement audio pipeline (mic → VAD → transcription)

<!-- MANUAL ADDITIONS END -->