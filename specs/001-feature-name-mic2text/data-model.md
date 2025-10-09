# Data Model: Mic2Text MVP

**Feature**: Mic2Text MVP
**Date**: 2025-10-04
**Phase**: 1 - Design

## Overview

This document defines the runtime data structures used in Mic2Text. Since the app is stateless and stores nothing persistently, all entities exist only in memory during the recording → transcription → paste flow.

---

## Entities

### AudioSession

Represents a single recording session from hotkey press to release.

**Fields**:
```typescript
interface AudioSession {
  startTime: number;        // Unix timestamp (ms) when recording started
  endTime: number;          // Unix timestamp (ms) when recording stopped
  rmsPeak: number;          // Peak RMS value during recording (dB)
  audioBuffer: Float32Array; // Raw 16kHz mono PCM audio data
  duration: number;         // Calculated duration in seconds (endTime - startTime)
}
```

**Lifecycle**:
1. Created when user presses Command+B
2. Populated during recording (RMS tracked, buffer accumulated)
3. Finalized when user releases Command+B
4. Passed to transcription pipeline
5. Discarded after transcription completes (no persistence)

**Validation Rules**:
- `duration` must be > 0 (reject if only instantaneous press)
- `rmsPeak` used to detect silence-only recordings (threshold TBD)
- `audioBuffer` may be trimmed to remove leading/trailing silence (implementation TBD)

---

### TranscriptionResult

Represents the output of the transcription and cleanup pipeline.

**Fields**:
```typescript
interface TranscriptionResult {
  raw: string;              // Raw Whisper transcription output
  cleaned?: string;         // LLM-cleaned text (undefined if cleanup failed/skipped)
  fallbackUsed: boolean;    // True if cleanup failed and raw text used
  processingTime: number;   // Total time (ms) from audio input to final text
}
```

**Lifecycle**:
1. Created after transcription completes
2. `raw` field populated with transcription output
3. Cleanup attempted (optional, post-MVP):
   - On success: `cleaned` populated, `fallbackUsed = false`
   - On failure/timeout: `cleaned = undefined`, `fallbackUsed = true`
4. Final text determined: `cleaned ?? raw`
5. Passed to clipboard/paste handler
6. Discarded after paste completes

**Business Rules**:
- If `raw` is empty string, treat as silence → no clipboard/paste
- Cleanup timeout and implementation TBD
- `processingTime` tracked for performance monitoring

---

### UIState

Represents the current state of the pill UI element.

**Fields**:
```typescript
type UIMode = 'hidden' | 'loading' | 'silent' | 'talking' | 'processing';

interface UIState {
  mode: UIMode;             // Current visual state of the pill
  message?: string;         // Optional status message (for error popup)
  vadProbability?: number;  // Current VAD probability [0,1] for animation intensity
}
```

**State Transitions**:
```
hidden
  ↓ (hotkey press)
loading
  ↓ (VAD initialized)
silent ←→ talking  (VAD-driven real-time transitions)
  ↓ (hotkey release)
processing
  ↓ (transcription + cleanup complete)
hidden
```

**Error State**:
```
(any state)
  ↓ (error occurs)
hidden + error popup (mode='hidden', message='Error, please try again')
```

**Lifecycle**:
1. Starts as `hidden` when app launches
2. Transitions to `loading` on hotkey press
3. Rapid transitions between `silent` ↔ `talking` driven by VAD output
4. Transitions to `processing` on hotkey release
5. Returns to `hidden` after paste completes or error occurs
6. If error: `message` set, error popup shown for 2s, then cleared

**UI Mapping**:
- `hidden`: Pill not rendered
- `loading`: Display `pill_loading.png` visual
- `silent`: Display `pill_silent.png` visual
- `talking`: Display `pill_talking.png` visual (animate based on `vadProbability`)
- `processing`: Display `pill_processing.png` visual

---

## IPC Message Contracts

These messages are exchanged between Electron main process and renderer/worker threads.

### StartRecording

**Direction**: Renderer → Main
**Trigger**: User presses Command+B
**Request**:
```typescript
{
  type: 'StartRecording';
}
```
**Response**:
```typescript
{
  ok: boolean;              // true if recording started, false if mic unavailable
  error?: string;           // Error message if ok=false
}
```

**Side Effects**:
- Initializes mic capture
- Creates new `AudioSession`
- Sends `UIState` update: `loading` → `silent`

---

### StopRecording

**Direction**: Renderer → Main
**Trigger**: User releases Command+B
**Request**:
```typescript
{
  type: 'StopRecording';
}
```
**Response**:
```typescript
{
  ok: boolean;              // true if recording stopped successfully
  audioSession?: AudioSession; // Audio data if ok=true
}
```

**Side Effects**:
- Stops mic capture
- Finalizes `AudioSession`
- Sends `UIState` update: `talking`/`silent` → `processing`

---

### Transcribe

**Direction**: Main → Worker
**Trigger**: After `StopRecording` succeeds
**Request**:
```typescript
{
  type: 'Transcribe';
  audio: Float32Array;      // Trimmed 16kHz mono PCM
}
```
**Response**:
```typescript
{
  raw: string;              // Whisper transcription
  cleaned?: string;         // LLM-cleaned text (if cleanup succeeded)
  fallbackUsed: boolean;    // True if cleanup failed
}
```

**Side Effects**:
- Runs transcription in worker thread
- May attempt text cleanup (optional, implementation TBD)
- Returns `TranscriptionResult`

---

### PasteText

**Direction**: Main → Renderer
**Trigger**: After `Transcribe` completes
**Request**:
```typescript
{
  type: 'PasteText';
  text: string;             // Final text to paste (cleaned ?? raw)
}
```
**Response**:
```typescript
{
  success: boolean;         // true if pasted, false if clipboard-only
}
```

**Side Effects**:
- Copies `text` to clipboard
- Attempts paste via Cmd+V simulation
- If no focused text field: `success = false` (clipboard-only)
- Sends `UIState` update: `processing` → `hidden`

---

### VADUpdate (Event)

**Direction**: Worker → Renderer
**Trigger**: Real-time during recording (every 100ms)
**Payload**:
```typescript
{
  type: 'VADUpdate';
  probability: number;      // VAD speech probability [0,1]
}
```

**Side Effects**:
- Updates `UIState.vadProbability`
- Triggers UI transition: `silent` ↔ `talking` based on threshold (TBD)

---

### ErrorNotification (Event)

**Direction**: Main/Worker → Renderer
**Trigger**: Any error during recording/transcription/paste
**Payload**:
```typescript
{
  type: 'ErrorNotification';
  message: string;          // Always "Error, please try again" per spec
}
```

**Side Effects**:
- Sets `UIState.message`
- Shows error popup for 2s
- Resets to `hidden` state

---

## Relationships

```
AudioSession (1) → (1) TranscriptionResult
  - One recording session produces one transcription result

TranscriptionResult (1) → (0..1) PasteText
  - Empty/silence transcriptions do not trigger paste

UIState (1) ↔ (0..many) VADUpdate
  - UI state updated continuously by VAD events during recording

ErrorNotification (0..1) → UIState
  - Errors reset UI state and show popup
```

---

## Validation Summary

| Entity | Field | Validation Rule |
|--------|-------|-----------------|
| AudioSession | duration | Must be > 0 |
| AudioSession | rmsPeak | Silence threshold TBD |
| TranscriptionResult | raw | If empty string, skip clipboard/paste |
| TranscriptionResult | processingTime | Target < 3000ms for short phrases |
| UIState | mode | Must be valid UIMode enum value |
| UIState | vadProbability | Must be [0,1] or undefined |

---

**Phase 1 Status**: Data model complete ✅
