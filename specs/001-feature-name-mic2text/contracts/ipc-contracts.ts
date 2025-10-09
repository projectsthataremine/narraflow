/**
 * IPC Contracts for Mic2Text MVP
 *
 * This file defines the message contracts exchanged between:
 * - Renderer <-> Main process (Electron IPC)
 * - Main <-> Worker thread (for ML inference)
 *
 * All contracts are type-safe and match the data-model.md specification.
 */

// ============================================================================
// Data Types
// ============================================================================

/**
 * Audio session representing a single recording from press to release
 */
export interface AudioSession {
  startTime: number;        // Unix timestamp (ms)
  endTime: number;          // Unix timestamp (ms)
  rmsPeak: number;          // Peak RMS in dB
  audioBuffer: Float32Array; // 16kHz mono PCM
  duration: number;         // Seconds
}

/**
 * Transcription result with optional cleanup
 */
export interface TranscriptionResult {
  raw: string;              // Raw Whisper output
  cleaned?: string;         // LLM-cleaned text (optional)
  fallbackUsed: boolean;    // True if cleanup failed
  processingTime: number;   // Total ms
}

/**
 * UI state modes
 */
export type UIMode = 'hidden' | 'loading' | 'silent' | 'talking' | 'processing';

/**
 * UI state with optional VAD feedback
 */
export interface UIState {
  mode: UIMode;
  message?: string;         // For error popup
  vadProbability?: number;  // [0,1] for animation
}

// ============================================================================
// IPC Messages: Renderer → Main
// ============================================================================

export interface StartRecordingRequest {
  type: 'StartRecording';
}

export interface StartRecordingResponse {
  ok: boolean;
  error?: string;
}

export interface StopRecordingRequest {
  type: 'StopRecording';
}

export interface StopRecordingResponse {
  ok: boolean;
  audioSession?: AudioSession;
}

// ============================================================================
// IPC Messages: Main → Worker
// ============================================================================

export interface TranscribeRequest {
  type: 'Transcribe';
  audio: Float32Array;
}

export interface TranscribeResponse {
  raw: string;
  cleaned?: string;
  fallbackUsed: boolean;
}

export interface RewriteTextRequest {
  type: 'RewriteText';
  text: string;
}

export interface RewriteTextResponse {
  cleaned: string;
  usedFallback: boolean;
}

// ============================================================================
// IPC Messages: Main → Renderer
// ============================================================================

export interface PasteTextRequest {
  type: 'PasteText';
  text: string;
}

export interface PasteTextResponse {
  success: boolean;         // true if pasted, false if clipboard-only
}

// ============================================================================
// IPC Events (Worker/Main → Renderer)
// ============================================================================

export interface VADUpdateEvent {
  type: 'VADUpdate';
  probability: number;      // [0,1]
}

export interface ErrorNotificationEvent {
  type: 'ErrorNotification';
  message: string;          // Always "Error, please try again"
}

export interface UIStateUpdateEvent {
  type: 'UIStateUpdate';
  state: UIState;
}

// ============================================================================
// Message Union Types
// ============================================================================

export type IPCRequest =
  | StartRecordingRequest
  | StopRecordingRequest
  | TranscribeRequest
  | RewriteTextRequest
  | PasteTextRequest;

export type IPCResponse =
  | StartRecordingResponse
  | StopRecordingResponse
  | TranscribeResponse
  | RewriteTextResponse
  | PasteTextResponse;

export type IPCEvent =
  | VADUpdateEvent
  | ErrorNotificationEvent
  | UIStateUpdateEvent;

// ============================================================================
// Channel Names (for Electron IPC)
// ============================================================================

export const IPC_CHANNELS = {
  // Renderer → Main
  START_RECORDING: 'ipc:start-recording',
  STOP_RECORDING: 'ipc:stop-recording',
  PASTE_TEXT: 'ipc:paste-text',

  // Main → Renderer (events)
  VAD_UPDATE: 'ipc:vad-update',
  ERROR_NOTIFICATION: 'ipc:error-notification',
  UI_STATE_UPDATE: 'ipc:ui-state-update',

  // Main ↔ Worker
  TRANSCRIBE: 'worker:transcribe',
  REWRITE_TEXT: 'worker:rewrite-text',
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate AudioSession
 * Returns error message if invalid, undefined if valid
 */
export function validateAudioSession(session: AudioSession): string | undefined {
  if (session.duration <= 0) {
    return 'Duration must be > 0';
  }
  if (session.rmsPeak < -40) {
    return 'Recording is silence only (RMS < -40dB)';
  }
  return undefined;
}

/**
 * Check if transcription result is empty/silence
 */
export function isEmptyTranscription(result: TranscriptionResult): boolean {
  return result.raw.trim().length === 0;
}

/**
 * Get final text from transcription result
 */
export function getFinalText(result: TranscriptionResult): string {
  return result.cleaned ?? result.raw;
}

/**
 * Validate VAD probability
 */
export function validateVADProbability(prob: number): boolean {
  return prob >= 0 && prob <= 1;
}
