/**
 * Audio trimming module
 * Removes leading and trailing silence from audio recordings
 * Uses simple energy-based silence detection
 */

export interface TrimConfig {
  silenceThreshold: number; // Energy threshold for silence (RMS dB)
  silenceDurationMs: number; // Duration of silence required to trim (ms)
  sampleRate: number; // Audio sample rate
  frameSize: number; // Frame size in samples
}

export class AudioTrimmer {
  private config: TrimConfig;

  constructor(config: Partial<TrimConfig> = {}) {
    this.config = {
      silenceThreshold: config.silenceThreshold ?? -40, // -40 dB threshold
      silenceDurationMs: config.silenceDurationMs ?? 300,
      sampleRate: config.sampleRate ?? 16000,
      frameSize: config.frameSize ?? 512, // 32ms at 16kHz
    };
  }

  /**
   * Calculate RMS energy in dB for an audio frame
   */
  private calculateEnergy(frame: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) {
      sum += frame[i] * frame[i];
    }
    const rms = Math.sqrt(sum / frame.length);
    const dB = 20 * Math.log10(rms + 1e-10); // Add small value to avoid log(0)
    return dB;
  }

  /**
   * Check if a frame is silence based on energy threshold
   */
  private isSilenceFrame(frame: Float32Array): boolean {
    const energy = this.calculateEnergy(frame);
    return energy < this.config.silenceThreshold;
  }

  /**
   * Trim silence from beginning and end of audio
   */
  trim(audio: Float32Array): Float32Array {
    if (audio.length === 0) {
      return audio;
    }

    const frameSize = this.config.frameSize;
    const numFrames = Math.floor(audio.length / frameSize);

    // Find first non-silence frame
    let startFrame = 0;
    for (let i = 0; i < numFrames; i++) {
      const frame = audio.slice(i * frameSize, (i + 1) * frameSize);
      if (!this.isSilenceFrame(frame)) {
        startFrame = i;
        break;
      }
    }

    // Find last non-silence frame
    let endFrame = numFrames - 1;
    for (let i = numFrames - 1; i >= 0; i--) {
      const frame = audio.slice(i * frameSize, (i + 1) * frameSize);
      if (!this.isSilenceFrame(frame)) {
        endFrame = i;
        break;
      }
    }

    // If all silence, return empty
    if (startFrame > endFrame) {
      return new Float32Array(0);
    }

    // Convert frame indices to sample indices
    const startSample = Math.max(0, startFrame * frameSize);
    const endSample = Math.min(audio.length, (endFrame + 1) * frameSize);

    // Extract trimmed audio
    return audio.slice(startSample, endSample);
  }

  /**
   * Trim with minimum duration requirement
   * Only trims if silence exceeds minimum duration
   */
  trimWithMinDuration(audio: Float32Array): Float32Array {
    const minSilenceSamples = (this.config.silenceDurationMs / 1000) * this.config.sampleRate;
    const frameSize = this.config.frameSize;
    const numFrames = Math.floor(audio.length / frameSize);

    // Count leading silence frames
    let leadingSilenceFrames = 0;
    for (let i = 0; i < numFrames; i++) {
      const frame = audio.slice(i * frameSize, (i + 1) * frameSize);
      if (!this.isSilenceFrame(frame)) {
        break;
      }
      leadingSilenceFrames++;
    }

    // Count trailing silence frames
    let trailingSilenceFrames = 0;
    for (let i = numFrames - 1; i >= 0; i--) {
      const frame = audio.slice(i * frameSize, (i + 1) * frameSize);
      if (!this.isSilenceFrame(frame)) {
        break;
      }
      trailingSilenceFrames++;
    }

    // Only trim if silence exceeds minimum duration
    const leadingSilenceSamples = leadingSilenceFrames * frameSize;
    const trailingSilenceSamples = trailingSilenceFrames * frameSize;

    let startSample = 0;
    if (leadingSilenceSamples >= minSilenceSamples) {
      startSample = leadingSilenceFrames * frameSize;
    }

    let endSample = audio.length;
    if (trailingSilenceSamples >= minSilenceSamples) {
      endSample = audio.length - trailingSilenceFrames * frameSize;
    }

    return audio.slice(startSample, endSample);
  }

  /**
   * Check if audio is mostly silence
   */
  isMostlySilence(audio: Float32Array): boolean {
    const frameSize = this.config.frameSize;
    const numFrames = Math.floor(audio.length / frameSize);

    let silenceFrames = 0;
    for (let i = 0; i < numFrames; i++) {
      const frame = audio.slice(i * frameSize, (i + 1) * frameSize);
      if (this.isSilenceFrame(frame)) {
        silenceFrames++;
      }
    }

    const silenceRatio = silenceFrames / numFrames;
    return silenceRatio > 0.8; // 80% silence
  }
}
