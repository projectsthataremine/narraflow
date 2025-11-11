/**
 * Audio session manager
 * Manages the lifecycle of an AudioSession entity
 * Now receives audio chunks via IPC from renderer's Web Audio API
 */

import type { AudioSession } from '../types/ipc-contracts';
import { validateAudioSession } from '../types/ipc-contracts';

export class AudioSessionManager {
  private currentSession: Partial<AudioSession> | null = null;
  private audioChunks: Float32Array[] = [];
  private targetSampleRate = 16000;

  constructor() {
    // No MicRecorder needed - audio comes via IPC
  }

  /**
   * Start a new recording session
   * Audio will be received via addAudioChunk()
   */
  startSession(): boolean {
    if (this.currentSession) {
      return false; // Session already active
    }

    this.currentSession = {
      startTime: Date.now(),
      rmsPeak: -Infinity,
    };

    this.audioChunks = [];
    console.log('[AudioSessionManager] Session started, waiting for audio chunks via IPC');

    return true;
  }

  /**
   * Add audio chunk received from renderer
   */
  addAudioChunk(chunk: Float32Array): void {
    if (!this.currentSession) {
      console.warn('[AudioSessionManager] Received audio chunk but no active session');
      return;
    }

    this.audioChunks.push(chunk);

    // Update RMS peak
    const chunkRMS = this.calculateRMS(chunk);
    if (chunkRMS > (this.currentSession.rmsPeak ?? -Infinity)) {
      this.currentSession.rmsPeak = chunkRMS;
    }
  }

  /**
   * Stop the current session and finalize the AudioSession
   */
  stopSession(): AudioSession | null {
    if (!this.currentSession) {
      return null;
    }

    // Concatenate all chunks into single buffer
    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const audioBuffer = new Float32Array(totalLength);

    let offset = 0;
    for (const chunk of this.audioChunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    console.log(`[AudioSessionManager] Stopped, accumulated ${audioBuffer.length} samples from ${this.audioChunks.length} chunks`);

    const endTime = Date.now();
    const duration = (endTime - this.currentSession.startTime!) / 1000;

    // Calculate RMS peak if not already calculated
    const rmsPeak = this.currentSession.rmsPeak ?? this.calculateRMS(audioBuffer);

    const session: AudioSession = {
      startTime: this.currentSession.startTime!,
      endTime,
      rmsPeak,
      audioBuffer,
      duration,
    };

    this.currentSession = null;
    this.audioChunks = [];

    // Validate session before returning
    const error = validateAudioSession(session);
    if (error) {
      console.warn('Invalid audio session:', error);
      // Still return the session, let caller decide what to do
    }

    return session;
  }

  /**
   * Check if a session is currently active
   */
  isSessionActive(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get current session duration in seconds
   */
  getCurrentDuration(): number {
    if (!this.currentSession) {
      return 0;
    }
    return (Date.now() - this.currentSession.startTime!) / 1000;
  }

  /**
   * Cancel current session without finalizing
   */
  cancelSession(): void {
    if (this.currentSession) {
      this.currentSession = null;
      this.audioChunks = [];
    }
  }

  /**
   * Calculate RMS (Root Mean Square) level in dB
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);

    // Convert to dB
    const dB = 20 * Math.log10(rms);
    return dB;
  }
}
