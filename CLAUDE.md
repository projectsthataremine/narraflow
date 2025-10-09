# Mic2Text Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-10-04

## Active Technologies
- Node 20 with TypeScript in Electron 30 + `onnxruntime-node`, `node-record-lpcm16`, `@nut-tree/nut-js` or `robotjs` (001-feature-name-mic2text)

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
- 001-feature-name-mic2text: Added Node 20 with TypeScript in Electron 30 + `onnxruntime-node`, `node-record-lpcm16`, `@nut-tree/nut-js` or `robotjs`

<!-- MANUAL ADDITIONS START -->

## Current Implementation Status
✅ UI overlay with dots (loading, silence, talking, processing)
✅ Command+B hotkey for start/stop recording
✅ Multi-monitor support (300ms tracking interval)
✅ Transparent window with no border
✅ Worker thread infrastructure
🔄 **NEXT**: Implement audio pipeline (mic → VAD → transcription)

<!-- MANUAL ADDITIONS END -->