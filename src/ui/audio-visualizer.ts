/**
 * Audio Visualizer for Pill Animation
 * Uses AnalyserNode for hardware-accelerated amplitude detection
 * Focused ONLY on real-time visualization - does NOT record audio
 */

export interface AudioVisualizerConfig {
  sampleRate: number;
  onAmplitude?: (amplitude: number, rms?: number) => void;
  onError?: (error: Error) => void;
}

export class AudioVisualizer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isActive = false;
  private config: AudioVisualizerConfig;
  private animationFrameId: number | null = null;
  private dataArray: Uint8Array | null = null;
  private frameCount = 0;

  constructor(config: Partial<AudioVisualizerConfig> = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 16000,
      onAmplitude: config.onAmplitude,
      onError: config.onError,
    };
  }

  /**
   * Start visualizer with microphone access
   */
  async start(existingStream?: MediaStream): Promise<boolean> {
    if (this.isActive) {
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

      // Create AnalyserNode for hardware-accelerated amplitude detection
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256; // Small FFT for fast updates
      this.analyser.smoothingTimeConstant = 0.3; // Built-in smoothing

      // Connect: source -> analyser
      this.audioSource.connect(this.analyser);

      // Prepare data array for amplitude readings
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.isActive = true;

      // Start monitoring loop
      this.monitorAmplitude();

      console.log(`[AudioVisualizer] Started at ${this.config.sampleRate}Hz`);
      return true;
    } catch (error) {
      console.error('[AudioVisualizer] Failed to start:', error);
      if (this.config.onError && error instanceof Error) {
        this.config.onError(error);
      }
      this.cleanup();
      return false;
    }
  }

  /**
   * Monitor amplitude using AnalyserNode (runs at ~60fps)
   */
  private monitorAmplitude(): void {
    if (!this.isActive || !this.analyser || !this.dataArray) {
      return;
    }

    // Get time-domain data (waveform)
    this.analyser.getByteTimeDomainData(this.dataArray);

    // Calculate RMS amplitude
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128; // Convert 0-255 to -1 to 1
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);

    // Aggressive normalization for pill visualization
    const NOISE_FLOOR = 0.0065;
    const TALKING_START = 0.015;

    let amplitude;
    let zone = '';

    if (rms < NOISE_FLOOR) {
      // Background noise
      amplitude = rms * 5;
      zone = 'quiet';
    } else if (rms < TALKING_START) {
      // Ramp from noise to talking
      const range = (rms - NOISE_FLOOR) / (TALKING_START - NOISE_FLOOR);
      amplitude = 0.5 + range * 0.4; // 50% → 90%
      zone = 'ramp';
    } else {
      // Talking: compress to 90-100%
      const normalized = Math.min(1.0, (rms - TALKING_START) / 0.025);
      amplitude = 0.9 + normalized * 0.1;
      zone = 'talking';
    }

    amplitude = Math.min(1.0, Math.max(0.05, amplitude));

    // Debug logging every 30 frames (~0.5s)
    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      console.log(
        `[AudioVisualizer] RMS: ${rms.toFixed(4)} | Zone: ${zone} | Amplitude: ${amplitude.toFixed(3)}`
      );
    }

    // Send to callback
    if (this.config.onAmplitude) {
      this.config.onAmplitude(amplitude, rms);
    }

    // Continue loop
    this.animationFrameId = requestAnimationFrame(() => this.monitorAmplitude());
  }

  /**
   * Stop visualizer
   */
  async stop(closeStream: boolean = true): Promise<void> {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    // Stop animation loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Disconnect analyser
    if (this.analyser) {
      this.analyser.disconnect();
    }

    if (this.audioSource) {
      this.audioSource.disconnect();
    }

    // Stop media stream if requested
    if (closeStream && this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`[AudioVisualizer] Stopped track: ${track.kind}`);
      });
    }

    // Close audio context
    if (this.audioContext) {
      try {
        await this.audioContext.close();
        console.log('[AudioVisualizer] AudioContext closed');
      } catch (error) {
        console.error('[AudioVisualizer] Error closing AudioContext:', error);
      }
    }

    this.cleanup();
  }

  /**
   * Check if visualizer is active
   */
  isRunning(): boolean {
    return this.isActive;
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
    this.analyser = null;
    this.dataArray = null;
    this.animationFrameId = null;
    this.frameCount = 0;
    // Don't null mediaStream here - might be shared
  }
}
