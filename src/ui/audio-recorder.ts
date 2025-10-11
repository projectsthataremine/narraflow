/**
 * Audio Recorder for Transcription Pipeline
 * Uses AudioWorkletNode for efficient PCM audio capture
 * Focused ONLY on recording audio data - does NOT do visualization
 */

export interface AudioRecorderConfig {
  sampleRate: number;
  onError?: (error: Error) => void;
}

export class AudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private audioWorklet: AudioWorkletNode | null = null;
  private isRecording = false;
  private config: AudioRecorderConfig;
  private audioChunks: Float32Array[] = [];

  constructor(config: Partial<AudioRecorderConfig> = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 16000,
      onError: config.onError,
    };
  }

  /**
   * Start recording with microphone access
   */
  async start(existingStream?: MediaStream): Promise<boolean> {
    if (this.isRecording) {
      return false;
    }

    try {
      // Use existing stream if provided, otherwise request microphone
      if (existingStream) {
        this.mediaStream = existingStream;
      } else {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: this.config.sampleRate,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      }

      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // Create audio source
      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Load AudioWorklet module for efficient audio capture
      await this.audioContext.audioWorklet.addModule('/ui/audio-recorder-worklet.js');

      // Create AudioWorkletNode
      this.audioWorklet = new AudioWorkletNode(this.audioContext, 'audio-recorder-processor');

      // Listen for audio data from worklet
      this.audioWorklet.port.onmessage = (event) => {
        if (event.data.type === 'audiodata') {
          const chunk = event.data.chunk;
          this.audioChunks.push(chunk);
        }
      };

      // Connect: source -> audioWorklet -> destination
      this.audioSource.connect(this.audioWorklet);
      this.audioWorklet.connect(this.audioContext.destination);

      // Start recording
      this.audioWorklet.port.postMessage({ command: 'start' });

      this.isRecording = true;

      console.log(`[AudioRecorder] Started recording at ${this.config.sampleRate}Hz`);
      return true;
    } catch (error) {
      console.error('[AudioRecorder] Failed to start:', error);
      if (this.config.onError && error instanceof Error) {
        this.config.onError(error);
      }
      this.cleanup();
      return false;
    }
  }

  /**
   * Stop recording
   */
  async stop(closeStream: boolean = true): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;

    // Stop recording in worklet
    if (this.audioWorklet) {
      this.audioWorklet.port.postMessage({ command: 'stop' });
    }

    // Disconnect worklet
    if (this.audioWorklet) {
      this.audioWorklet.disconnect();
      this.audioWorklet.port.onmessage = null;
    }

    if (this.audioSource) {
      this.audioSource.disconnect();
    }

    // Stop media stream if requested
    if (closeStream && this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`[AudioRecorder] Stopped track: ${track.kind}`);
      });
    }

    // Close audio context
    if (this.audioContext) {
      try {
        await this.audioContext.close();
        console.log('[AudioRecorder] AudioContext closed');
      } catch (error) {
        console.error('[AudioRecorder] Error closing AudioContext:', error);
      }
    }

    this.cleanup();
  }

  /**
   * Get all collected audio data and clear buffer
   */
  getAudioData(): Float32Array {
    if (this.audioChunks.length === 0) {
      return new Float32Array(0);
    }

    // Calculate total length
    const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);

    // Concatenate all chunks
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    // Clear buffer
    this.audioChunks = [];

    const duration = (result.length / this.config.sampleRate).toFixed(2);
    console.log(`[AudioRecorder] Collected ${result.length} samples (${duration}s)`);

    return result;
  }

  /**
   * Check if currently recording
   */
  isActive(): boolean {
    return this.isRecording;
  }

  /**
   * Get MediaStream (for sharing with other modules)
   */
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.audioContext = null;
    this.audioSource = null;
    this.audioWorklet = null;
    this.audioChunks = [];
    // Don't null mediaStream here - might be shared
  }
}
