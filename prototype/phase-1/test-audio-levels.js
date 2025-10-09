#!/usr/bin/env node

/**
 * Audio Levels Test - Real-time amplitude visualization
 *
 * This script captures microphone audio and displays real-time
 * amplitude levels in the terminal as visual bars.
 *
 * Purpose: Test RMS amplitude calculation before integrating into Electron UI
 */

const portAudio = require('naudiodon2');

console.log('🎤 Audio Levels Test');
console.log('==================\n');
console.log('Speak into your microphone to see the audio levels...');
console.log('Press Ctrl+C to stop\n');

const SAMPLE_RATE = 16000;
const CHUNK_SIZE = 512; // ~32ms chunks at 16kHz
const MAX_BAR_WIDTH = 50;
const GAIN_MULTIPLIER = 10; // Boost amplitude for better visualization

// Initialize audio input
const ai = new portAudio.AudioIO({
  inOptions: {
    channelCount: 1,
    closeOnError: true,
    deviceId: -1, // default device
    sampleFormat: portAudio.SampleFormatFloat32,
    sampleRate: SAMPLE_RATE,
  }
});

/**
 * Calculate RMS (Root Mean Square) amplitude
 * Returns value between 0.0 and 1.0
 */
function calculateRMS(samples) {
  const sumSquares = samples.reduce((sum, sample) => sum + sample * sample, 0);
  return Math.sqrt(sumSquares / samples.length);
}

/**
 * Create visual bar representation
 */
function createBar(amplitude, width = MAX_BAR_WIDTH) {
  const filledLength = Math.round(amplitude * width);
  const bar = '█'.repeat(filledLength) + '░'.repeat(width - filledLength);
  return bar;
}

/**
 * Format amplitude with color coding
 */
function formatAmplitude(amplitude) {
  const percentage = (amplitude * 100).toFixed(1);

  // Color coding based on level
  if (amplitude < 0.1) return `\x1b[90m${percentage}%\x1b[0m`; // Gray - very quiet
  if (amplitude < 0.3) return `\x1b[32m${percentage}%\x1b[0m`; // Green - quiet
  if (amplitude < 0.6) return `\x1b[33m${percentage}%\x1b[0m`; // Yellow - moderate
  return `\x1b[31m${percentage}%\x1b[0m`; // Red - loud
}

// Process audio data
let sampleCount = 0;
ai.on('data', (data) => {
  const samples = new Float32Array(data.buffer);
  const rawAmplitude = calculateRMS(samples);
  const amplitude = Math.min(1.0, rawAmplitude * GAIN_MULTIPLIER); // Apply gain and cap at 1.0

  // Print as new line with timestamp
  const timestamp = (sampleCount * CHUNK_SIZE / SAMPLE_RATE).toFixed(2);
  console.log(`[${timestamp}s] ${createBar(amplitude)} ${formatAmplitude(amplitude)}`);
  sampleCount++;
});

// Handle errors
ai.on('error', (err) => {
  console.error('\n❌ Audio error:', err);
  process.exit(1);
});

// Start capturing
console.log('🎧 Starting audio capture...\n');
ai.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n✅ Stopping audio capture...');
  ai.quit();
  process.exit(0);
});
