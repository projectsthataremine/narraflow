#!/usr/bin/env node

/**
 * Phase 1 Prototype: Standalone Audio Pipeline Test
 *
 * This script tests the 3-phase audio pipeline:
 * 1. Microphone capture
 * 2. VAD (Voice Activity Detection) using Silero VAD
 * 3. Transcription using Whisper tiny.en
 *
 * Based on sherpa-onnx example: test_vad_with_non_streaming_asr_whisper.js
 */

const sherpa_onnx = require('sherpa-onnx-node');
const path = require('path');

console.log('🎤 Mic2Text Phase 1 Prototype');
console.log('==============================\n');

// Configuration
const vadConfig = {
  sileroVad: {
    model: path.join(__dirname, 'models', 'silero_vad.onnx'),
    threshold: 0.5,
    minSilenceDuration: 0.5,
    minSpeechDuration: 0.25,
    maxSpeechDuration: 5,
    windowSize: 512,
  },
  sampleRate: 16000,
  numThreads: 1,
  debug: true,
};

const recognizerConfig = {
  featConfig: {
    sampleRate: 16000,
    featureDim: 80,
  },
  modelConfig: {
    whisper: {
      encoder: path.join(__dirname, 'models', 'sherpa-onnx-whisper-tiny.en', 'tiny.en-encoder.int8.onnx'),
      decoder: path.join(__dirname, 'models', 'sherpa-onnx-whisper-tiny.en', 'tiny.en-decoder.int8.onnx'),
    },
    tokens: path.join(__dirname, 'models', 'sherpa-onnx-whisper-tiny.en', 'tiny.en-tokens.txt'),
    numThreads: 2,
    provider: 'cpu',
    debug: 1,
  },
};

const testAudioFile = path.join(__dirname, 'models', 'sherpa-onnx-whisper-tiny.en', 'test_wavs', '0.wav');

console.log('📁 Configuration:');
console.log('  VAD Model:', vadConfig.sileroVad.model);
console.log('  Whisper Encoder:', recognizerConfig.modelConfig.whisper.encoder);
console.log('  Whisper Decoder:', recognizerConfig.modelConfig.whisper.decoder);
console.log('  Test Audio:', testAudioFile);
console.log('');

// Initialize VAD
console.log('🔧 Initializing VAD...');
const bufferSizeInSeconds = 60;
const vad = new sherpa_onnx.Vad(vadConfig, bufferSizeInSeconds);
console.log('✅ VAD initialized\n');

// Initialize Whisper recognizer
console.log('🔧 Initializing Whisper recognizer...');
const recognizer = new sherpa_onnx.OfflineRecognizer(recognizerConfig);
console.log('✅ Whisper recognizer initialized\n');

// Test with audio file
console.log('🎵 Testing with audio file:', testAudioFile);
const wave = sherpa_onnx.readWave(testAudioFile);

if (wave.sampleRate !== vadConfig.sampleRate) {
  throw new Error(`Expected sample rate: ${vadConfig.sampleRate}, got: ${wave.sampleRate}`);
}

console.log(`   Sample rate: ${wave.sampleRate} Hz`);
console.log(`   Duration: ${(wave.samples.length / wave.sampleRate).toFixed(2)}s`);
console.log('');

// Process audio with VAD
console.log('🔍 Running VAD to detect speech segments...');
const windowSize = vadConfig.sileroVad.windowSize;
let speechSegments = [];

for (let i = 0; i < wave.samples.length; i += windowSize) {
  const start = i;
  const end = Math.min(i + windowSize, wave.samples.length);
  vad.acceptWaveform(wave.samples.subarray(start, end));
}

vad.flush();

while (!vad.isEmpty()) {
  const segment = vad.front();
  vad.pop();

  const start = segment.start / wave.sampleRate;
  const duration = segment.samples.length / wave.sampleRate;

  console.log(`   Speech detected: ${start.toFixed(2)}s - ${(start + duration).toFixed(2)}s (${duration.toFixed(2)}s)`);
  speechSegments.push(segment);
}

console.log(`\n✅ Found ${speechSegments.length} speech segment(s)\n`);

// Transcribe each speech segment
console.log('✍️  Transcribing speech segments...\n');

for (let i = 0; i < speechSegments.length; i++) {
  const segment = speechSegments[i];
  const stream = recognizer.createStream();

  stream.acceptWaveform({
    sampleRate: wave.sampleRate,
    samples: segment.samples,
  });

  recognizer.decode(stream);
  const result = recognizer.getResult(stream);

  console.log(`   Segment ${i + 1}: "${result.text}"`);
}

console.log('\n🎉 Test complete!\n');
console.log('📝 Next steps:');
console.log('   1. ✅ VAD working - detects speech segments');
console.log('   2. ✅ Whisper working - transcribes audio');
console.log('   3. ⏭️  Next: Add microphone capture');
console.log('');
