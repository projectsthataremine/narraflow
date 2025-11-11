/**
 * Audio test utilities
 * Generate synthetic test audio for testing the pipeline
 */

/**
 * Generate a sine wave test audio signal
 * Simulates speech-like audio for testing
 */
export function generateTestAudio(
  durationSeconds: number,
  sampleRate: number = 16000,
  frequency: number = 440
): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const audio = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    // Generate sine wave
    const t = i / sampleRate;
    const value = Math.sin(2 * Math.PI * frequency * t);

    // Add some amplitude modulation to make it more speech-like
    const envelope = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t);

    audio[i] = value * envelope * 0.3; // Scale to -0.3 to 0.3 range
  }

  return audio;
}

/**
 * Generate speech-like audio with varying frequencies
 * Better simulates actual speech patterns
 */
export function generateSpeechLikeAudio(
  durationSeconds: number,
  sampleRate: number = 16000
): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const audio = new Float32Array(numSamples);

  // Fundamental frequency varies between 100-300 Hz (typical speech range)
  const baseFreq = 150;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Varying fundamental frequency
    const freqMod = baseFreq + 50 * Math.sin(2 * Math.PI * 3 * t);

    // Multiple harmonics
    let value = 0;
    value += Math.sin(2 * Math.PI * freqMod * t) * 1.0; // Fundamental
    value += Math.sin(2 * Math.PI * freqMod * 2 * t) * 0.5; // 2nd harmonic
    value += Math.sin(2 * Math.PI * freqMod * 3 * t) * 0.25; // 3rd harmonic

    // Amplitude envelope (syllable-like)
    const envelope = Math.max(0, Math.sin(2 * Math.PI * 5 * t));

    audio[i] = value * envelope * 0.2;
  }

  return audio;
}

/**
 * Generate silence (all zeros)
 */
export function generateSilence(
  durationSeconds: number,
  sampleRate: number = 16000
): Float32Array {
  const numSamples = Math.floor(durationSeconds * sampleRate);
  return new Float32Array(numSamples); // All zeros
}

/**
 * Concatenate multiple audio buffers
 */
export function concatenateAudio(...buffers: Float32Array[]): Float32Array {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.length, 0);
  const result = new Float32Array(totalLength);

  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }

  return result;
}

/**
 * Save audio to WAV file (for debugging)
 */
export function saveToWav(
  audio: Float32Array,
  filePath: string,
  sampleRate: number = 16000
): void {
  const fs = require('fs');

  // Convert Float32 to Int16
  const int16Audio = new Int16Array(audio.length);
  for (let i = 0; i < audio.length; i++) {
    const s = Math.max(-1, Math.min(1, audio[i])); // Clamp
    int16Audio[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  // Create WAV header
  const headerSize = 44;
  const dataSize = int16Audio.length * 2;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Chunk size
  buffer.writeUInt16LE(1, 20); // Audio format (PCM)
  buffer.writeUInt16LE(1, 22); // Num channels
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write audio data
  for (let i = 0; i < int16Audio.length; i++) {
    buffer.writeInt16LE(int16Audio[i], headerSize + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`[Test] Saved audio to ${filePath}`);
}
