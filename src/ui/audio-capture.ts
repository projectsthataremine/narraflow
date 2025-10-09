/**
 * Web Audio API-based microphone capture for renderer process
 * This properly handles Electron microphone permissions on macOS
 */

export interface AudioCaptureConfig {
  sampleRate: number; // Target sample rate (16000 for Whisper)
  onAudioData?: (chunk: Float32Array) => void;
  onError?: (error: Error) => void;
}

export class WebAudioCapture {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private isRecording = false;
  private config: AudioCaptureConfig;
  private audioChunks: Float32Array[] = [];
  private startTime = 0;

  constructor(config: Partial<AudioCaptureConfig> = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 16000,
      onAudioData: config.onAudioData,
      onError: config.onError,
    };
  }

  /**
   * Request microphone permission and start recording
   */
  async start(): Promise<boolean> {
    if (this.isRecording) {
      return false;
    }

    try {
      // Request microphone access - this will trigger macOS permission prompt
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.config.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context at target sample rate
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // Create audio source from microphone
      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create script processor for audio chunks
      // Buffer size: 4096 samples (~256ms at 16kHz)
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0); // Mono

        // Copy to avoid reference issues
        const chunk = new Float32Array(channelData.length);
        chunk.set(channelData);

        // Store chunk
        this.audioChunks.push(chunk);

        // Callback if provided
        if (this.config.onAudioData) {
          this.config.onAudioData(chunk);
        }
      };

      // Connect the audio graph
      this.audioSource.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.isRecording = true;
      this.audioChunks = [];
      this.startTime = Date.now();

      console.log(`[WebAudioCapture] Started recording at ${this.config.sampleRate}Hz`);
      return true;
    } catch (error) {
      console.error('[WebAudioCapture] Failed to start:', error);
      if (this.config.onError && error instanceof Error) {
        this.config.onError(error);
      }
      this.cleanup();
      return false;
    }
  }

  /**
   * Stop recording and return accumulated audio buffer
   * CRITICAL: Must stop MediaStream tracks BEFORE closing AudioContext
   */
  async stop(): Promise<Float32Array | null> {
    if (!this.isRecording) {
      return null;
    }

    this.isRecording = false;

    const duration = (Date.now() - this.startTime) / 1000;
    console.log(`[WebAudioCapture] Stopping, recorded ${duration.toFixed(1)}s`);

    // Disconnect audio graph
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
    }

    if (this.audioSource) {
      this.audioSource.disconnect();
    }

    // CRITICAL: Stop media stream tracks FIRST to release microphone immediately
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`[WebAudioCapture] Stopped track: ${track.kind}`);
      });
    }

    // THEN close audio context (this is async)
    if (this.audioContext) {
      try {
        await this.audioContext.close();
        console.log('[WebAudioCapture] AudioContext closed');
      } catch (error) {
        console.error('[WebAudioCapture] Error closing AudioContext:', error);
      }
    }

    // Concatenate all chunks into single buffer
    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const audioBuffer = new Float32Array(totalLength);

    let offset = 0;
    for (const chunk of this.audioChunks) {
      audioBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const recordedDuration = audioBuffer.length / this.config.sampleRate;
    console.log(
      `[WebAudioCapture] Captured ${audioBuffer.length} samples (${recordedDuration.toFixed(1)}s at ${this.config.sampleRate}Hz)`
    );

    this.cleanup();

    return audioBuffer;
  }

  /**
   * Check if currently recording
   */
  isActive(): boolean {
    return this.isRecording;
  }

  /**
   * Get recording duration in seconds
   */
  getDuration(): number {
    if (!this.isRecording) {
      return 0;
    }
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.audioContext = null;
    this.mediaStream = null;
    this.audioSource = null;
    this.scriptProcessor = null;
    this.audioChunks = [];
  }

  /**
   * Calculate RMS (Root Mean Square) level in dB
   * Used for silence detection
   */
  static calculateRMS(buffer: Float32Array): number {
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
