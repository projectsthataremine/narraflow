"use strict";
/**
 * Audio session manager
 * Manages the lifecycle of an AudioSession entity
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioSessionManager = void 0;
const ipc_contracts_1 = require("../types/ipc-contracts");
const mic_1 = require("./mic");
class AudioSessionManager {
    currentSession = null;
    recorder;
    constructor() {
        this.recorder = new mic_1.MicRecorder();
    }
    /**
     * Start a new recording session
     */
    startSession() {
        if (this.currentSession) {
            return false; // Session already active
        }
        const success = this.recorder.start();
        if (!success) {
            return false;
        }
        this.currentSession = {
            startTime: Date.now(),
            rmsPeak: -Infinity,
        };
        return true;
    }
    /**
     * Stop the current session and finalize the AudioSession
     */
    stopSession() {
        if (!this.currentSession) {
            return null;
        }
        const audioBuffer = this.recorder.stop();
        if (!audioBuffer) {
            this.currentSession = null;
            return null;
        }
        const endTime = Date.now();
        const duration = (endTime - this.currentSession.startTime) / 1000;
        // Calculate RMS peak
        const rmsPeak = mic_1.MicRecorder.calculateRMS(audioBuffer);
        const session = {
            startTime: this.currentSession.startTime,
            endTime,
            rmsPeak,
            audioBuffer,
            duration,
        };
        this.currentSession = null;
        // Validate session before returning
        const error = (0, ipc_contracts_1.validateAudioSession)(session);
        if (error) {
            console.warn('Invalid audio session:', error);
            // Still return the session, let caller decide what to do
        }
        return session;
    }
    /**
     * Check if a session is currently active
     */
    isSessionActive() {
        return this.currentSession !== null;
    }
    /**
     * Get current session duration in seconds
     */
    getCurrentDuration() {
        if (!this.currentSession) {
            return 0;
        }
        return (Date.now() - this.currentSession.startTime) / 1000;
    }
    /**
     * Update RMS peak for current session
     * Called periodically during recording
     */
    updateRMSPeak(buffer) {
        if (!this.currentSession) {
            return;
        }
        const rms = mic_1.MicRecorder.calculateRMS(buffer);
        if (rms > (this.currentSession.rmsPeak ?? -Infinity)) {
            this.currentSession.rmsPeak = rms;
        }
    }
    /**
     * Cancel current session without finalizing
     */
    cancelSession() {
        if (this.currentSession) {
            this.recorder.stop();
            this.currentSession = null;
        }
    }
}
exports.AudioSessionManager = AudioSessionManager;
