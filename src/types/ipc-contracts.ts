/**
 * IPC Contracts for Mic2Text MVP
 * Type-safe message contracts for Electron IPC and Worker threads
 */

// ============================================================================
// Data Types
// ============================================================================

export interface AudioSession {
  startTime: number;
  endTime: number;
  rmsPeak: number;
  audioBuffer: Float32Array;
  duration: number;
}

export interface TranscriptionResult {
  raw: string;
  cleaned?: string;
  fallbackUsed: boolean;
  processingTime: number;
}

export type UIMode = 'hidden' | 'loading' | 'silent' | 'talking' | 'processing';

export interface UIState {
  mode: UIMode;
  message?: string;
  vadProbability?: number;
}

export interface PillConfig {
  numBars: number;
  barWidth: number;
  barGap: number;
  maxHeight: number;
  borderRadius: number;
  glowIntensity: number;
  color1: string;
  color2: string;
  useGradient: boolean;
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

export interface AudioDataEvent {
  type: 'AudioData';
  chunk: Float32Array;
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
  success: boolean;
}

// ============================================================================
// IPC Events
// ============================================================================

export interface VADUpdateEvent {
  type: 'VADUpdate';
  probability: number;
}

export interface ErrorNotificationEvent {
  type: 'ErrorNotification';
  message: string;
}

export interface UIStateUpdateEvent {
  type: 'UIStateUpdate';
  state: UIState;
}

// ============================================================================
// Channel Names
// ============================================================================

export const IPC_CHANNELS = {
  START_RECORDING: 'ipc:start-recording',
  STOP_RECORDING: 'ipc:stop-recording',
  AUDIO_DATA: 'ipc:audio-data',
  PASTE_TEXT: 'ipc:paste-text',
  VAD_UPDATE: 'ipc:vad-update',
  ERROR_NOTIFICATION: 'ipc:error-notification',
  UI_STATE_UPDATE: 'ipc:ui-state-update',
  PILL_CONFIG_UPDATE: 'ipc:pill-config-update',
  TRANSCRIBE: 'worker:transcribe',
  REWRITE_TEXT: 'worker:rewrite-text',
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

export function validateAudioSession(session: AudioSession): string | undefined {
  if (session.duration <= 0) {
    return 'Duration must be > 0';
  }
  // Temporarily disabled to debug mic issues
  // if (session.rmsPeak < -40) {
  //   return 'Recording is silence only (RMS < -40dB)';
  // }
  return undefined;
}

export function isEmptyTranscription(result: TranscriptionResult): boolean {
  return result.raw.trim().length === 0;
}

export function getFinalText(result: TranscriptionResult): string {
  return result.cleaned ?? result.raw;
}

export function validateVADProbability(prob: number): boolean {
  return prob >= 0 && prob <= 1;
}
