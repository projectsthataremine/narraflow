/**
 * Web Audio API-based microphone capture for renderer process
 * Uses AnalyserNode for hardware-accelerated amplitude detection
 */

export interface AudioCaptureConfig {
  sampleRate: number; // Target sample rate (16000 for Whisper)
  onAmplitude?: (amplitude: number, rms?: number) => void; // 0-1 normalized amplitude, raw RMS
  onError?: (error: Error) => void;
}

export class WebAudioCapture {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording = false;
  private config: AudioCaptureConfig;
  private animationFrameId: number | null = null;
  private dataArray: Uint8Array | null = null;

  constructor(config: Partial<AudioCaptureConfig> = {}) {
    this.config = {
      sampleRate: config.sampleRate ?? 16000,
      onAmplitude: config.onAmplitude,
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
      // NOTE: In Chrome/Electron, echoCancellation: false disables ALL audio processing
      // including autoGainControl, regardless of the autoGainControl setting
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: this.config.sampleRate,
          echoCancellation: false, // Disables all audio processing including AGC
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create audio context at target sample rate
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate,
      });

      // Create audio source from microphone
      this.audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create AnalyserNode for amplitude detection (hardware-accelerated)
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256; // Small FFT for fast amplitude updates
      this.analyser.smoothingTimeConstant = 0.3; // Built-in smoothing

      // Connect audio graph
      this.audioSource.connect(this.analyser);
      // Note: No need to connect to destination for visualization-only

      // Prepare data array for amplitude readings
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

      this.isRecording = true;

      // Start amplitude monitoring loop
      this.monitorAmplitude();

      console.log(`[WebAudioCapture] Started amplitude monitoring at ${this.config.sampleRate}Hz`);
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
   * Monitor amplitude using AnalyserNode (runs at ~60fps via requestAnimationFrame)
   */
  private frameCount = 0;

  private monitorAmplitude(): void {
    if (!this.isRecording || !this.analyser || !this.dataArray) {
      return;
    }

    // Get time-domain data (waveform) for amplitude
    this.analyser.getByteTimeDomainData(this.dataArray);

    // Calculate RMS amplitude from time-domain data
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128; // Convert from 0-255 to -1 to 1
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);

    // Aggressive normalization/limiting - compress all talking to 90-100%
    const NOISE_FLOOR = 0.0065;      // Below this = background noise
    const TALKING_START = 0.015;     // Any sound above this = talking

    let amplitude;
    let zone = '';

    if (rms < NOISE_FLOOR) {
      // Background noise - keep minimal
      amplitude = rms * 5; // Just enough to barely show
      zone = 'quiet';
    } else if (rms < TALKING_START) {
      // Quick ramp from noise floor to talking level (0.0065-0.015)
      const range = (rms - NOISE_FLOOR) / (TALKING_START - NOISE_FLOOR);
      amplitude = 0.5 + (range * 0.4); // Quick ramp: 50% → 90%
      zone = 'ramp';
    } else {
      // ANY talking/sound above 0.015 = normalized to 90-100% (tight range)
      // Use logarithmic scaling to compress variance
      const normalized = Math.min(1.0, (rms - TALKING_START) / 0.025); // Normalize to 0-1
      amplitude = 0.9 + (normalized * 0.1); // Map to 90-100% (very tight!)
      zone = 'talking';
    }

    amplitude = Math.min(1.0, Math.max(0.05, amplitude));

    // Debug logging every 30 frames (~0.5 seconds)
    this.frameCount++;
    if (this.frameCount % 30 === 0) {
      console.log(`[Audio] RMS: ${rms.toFixed(4)} | Zone: ${zone} | Amplitude: ${amplitude.toFixed(3)}`);
    }

    // Send amplitude to callback
    if (this.config.onAmplitude) {
      this.config.onAmplitude(amplitude, rms);
    }

    // Continue monitoring
    this.animationFrameId = requestAnimationFrame(() => this.monitorAmplitude());
  }

  /**
   * Stop amplitude monitoring and release microphone
   * CRITICAL: Must stop MediaStream tracks BEFORE closing AudioContext
   */
  async stop(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;

    // Stop animation frame loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Disconnect audio graph
    if (this.analyser) {
      this.analyser.disconnect();
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

    this.cleanup();
  }

  /**
   * Check if currently recording
   */
  isActive(): boolean {
    return this.isRecording;
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.audioContext = null;
    this.mediaStream = null;
    this.audioSource = null;
    this.analyser = null;
    this.dataArray = null;
    this.animationFrameId = null;
  }
}
