"use strict";
/**
 * IPC Contracts for Mic2Text MVP
 * Type-safe message contracts for Electron IPC and Worker threads
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
exports.validateAudioSession = validateAudioSession;
exports.isEmptyTranscription = isEmptyTranscription;
exports.getFinalText = getFinalText;
exports.validateVADProbability = validateVADProbability;
// ============================================================================
// Channel Names
// ============================================================================
exports.IPC_CHANNELS = {
    START_RECORDING: 'ipc:start-recording',
    STOP_RECORDING: 'ipc:stop-recording',
    PASTE_TEXT: 'ipc:paste-text',
    VAD_UPDATE: 'ipc:vad-update',
    ERROR_NOTIFICATION: 'ipc:error-notification',
    UI_STATE_UPDATE: 'ipc:ui-state-update',
    TRANSCRIBE: 'worker:transcribe',
    REWRITE_TEXT: 'worker:rewrite-text',
};
// ============================================================================
// Validation Helpers
// ============================================================================
function validateAudioSession(session) {
    if (session.duration <= 0) {
        return 'Duration must be > 0';
    }
    if (session.rmsPeak < -40) {
        return 'Recording is silence only (RMS < -40dB)';
    }
    return undefined;
}
function isEmptyTranscription(result) {
    return result.raw.trim().length === 0;
}
function getFinalText(result) {
    return result.cleaned ?? result.raw;
}
function validateVADProbability(prob) {
    return prob >= 0 && prob <= 1;
}
