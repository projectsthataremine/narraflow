"use strict";
/**
 * Audio capture module
 * Uses node-record-lpcm16 for real microphone recording
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicRecorder = void 0;
const recorder = require("node-record-lpcm16");
class MicRecorder {
    constructor(config = {}) {
        this.isRecording = false;
        this.audioChunks = [];
        this.startTime = 0;
        this.recordingStream = null;
        this.config = {
            recordSampleRate: config.recordSampleRate ?? 44100, // Mac native rate
            targetSampleRate: config.targetSampleRate ?? 16000, // Whisper rate
            channels: config.channels ?? 1,
            bitDepth: config.bitDepth ?? 16,
        };
    }
    /**
     * Start recording audio from microphone
     */
    start() {
        if (this.isRecording) {
            return false;
        }
        this.isRecording = true;
        this.audioChunks = [];
        this.startTime = Date.now();
        try {
            // Start recording with node-record-lpcm16 at native sample rate
            // We'll downsample to target rate (16kHz) in stop()
            this.recordingStream = recorder.record({
                sampleRate: this.config.recordSampleRate, // Use native 44.1kHz
                channels: this.config.channels,
                recorder: 'sox', // Use SoX for macOS
                device: null, // Use default device
            });
            // Process incoming audio chunks
            this.recordingStream.stream().on('data', (chunk) => {
                if (!this.isRecording)
                    return;
                // Convert Int16 PCM to Float32 [-1.0, 1.0]
                const float32Array = this.bufferToFloat32(chunk);
                this.audioChunks.push(float32Array);
            });
            this.recordingStream.stream().on('error', (err) => {
                console.error('[MicRecorder] Error:', err);
                this.isRecording = false;
            });
            console.log(`[MicRecorder] Started recording at ${this.config.recordSampleRate}Hz mono (will downsample to ${this.config.targetSampleRate}Hz)`);
            return true;
        }
        catch (error) {
            console.error('[MicRecorder] Failed to start recording:', error);
            this.isRecording = false;
            return false;
        }
    }
    /**
     * Stop recording and return accumulated audio buffer
     */
    stop() {
        if (!this.isRecording) {
            return null;
        }
        this.isRecording = false;
        // Stop recording stream
        if (this.recordingStream) {
            this.recordingStream.stop();
            this.recordingStream = null;
        }
        // Concatenate all chunks into single buffer
        const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const audioBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of this.audioChunks) {
            audioBuffer.set(chunk, offset);
            offset += chunk.length;
        }
        const durationAtRecordRate = audioBuffer.length / this.config.recordSampleRate;
        console.log(`[MicRecorder] Stopped recording, captured ${audioBuffer.length} samples (${durationAtRecordRate.toFixed(1)}s at ${this.config.recordSampleRate}Hz)`);
        // Downsample to target rate for Whisper
        if (this.config.recordSampleRate !== this.config.targetSampleRate) {
            console.log(`[MicRecorder] Downsampling from ${this.config.recordSampleRate}Hz to ${this.config.targetSampleRate}Hz...`);
            const resampled = MicRecorder.resample(audioBuffer, this.config.recordSampleRate, this.config.targetSampleRate);
            console.log(`[MicRecorder] Resampled to ${resampled.length} samples (${(resampled.length / this.config.targetSampleRate).toFixed(1)}s at ${this.config.targetSampleRate}Hz)`);
            return resampled;
        }
        return audioBuffer;
    }
    /**
     * Check if currently recording
     */
    isActive() {
        return this.isRecording;
    }
    /**
     * Get recording duration in seconds
     */
    getDuration() {
        if (!this.isRecording) {
            return 0;
        }
        return (Date.now() - this.startTime) / 1000;
    }
    /**
     * Convert Int16 PCM buffer to Float32 array [-1.0, 1.0]
     */
    bufferToFloat32(buffer) {
        const int16Array = new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            // Normalize Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
            float32Array[i] = int16Array[i] / 32768.0;
        }
        return float32Array;
    }
    /**
     * Calculate RMS (Root Mean Square) level in dB
     * Used for silence detection
     */
    static calculateRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sum / buffer.length);
        // Convert to dB
        const dB = 20 * Math.log10(rms);
        return dB;
    }
    /**
     * Resample audio to target sample rate
     * MVP: Placeholder - assumes already at correct rate
     */
    static resample(buffer, fromRate, toRate) {
        if (fromRate === toRate) {
            return buffer;
        }
        // Simple linear interpolation resampling
        const ratio = fromRate / toRate;
        const newLength = Math.floor(buffer.length / ratio);
        const resampled = new Float32Array(newLength);
        for (let i = 0; i < newLength; i++) {
            const srcIndex = i * ratio;
            const srcIndexFloor = Math.floor(srcIndex);
            const frac = srcIndex - srcIndexFloor;
            if (srcIndexFloor + 1 < buffer.length) {
                resampled[i] = buffer[srcIndexFloor] * (1 - frac) + buffer[srcIndexFloor + 1] * frac;
            }
            else {
                resampled[i] = buffer[srcIndexFloor];
            }
        }
        return resampled;
    }
}
exports.MicRecorder = MicRecorder;
