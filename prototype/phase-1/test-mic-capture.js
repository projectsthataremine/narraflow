#!/usr/bin/env node

/**
 * Phase 1 Prototype: Microphone Capture Test
 *
 * This script tests the complete audio pipeline with real microphone input:
 * 1. Microphone capture (5 seconds)
 * 2. VAD (Voice Activity Detection) using Silero VAD
 * 3. Transcription using Whisper tiny.en
 *
 * Based on sherpa-onnx example: test_vad_asr_non_streaming_whisper_microphone.js
 */

const portAudio = require('naudiodon2');
const sherpa_onnx = require('sherpa-onnx-node');
const path = require('path');

console.log('🎤 Mic2Text Phase 1 - Microphone Capture Test');
console.log('==============================================\n');

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

const RECORDING_DURATION_MS = 5000; // 5 seconds

console.log('📁 Configuration:');
console.log('  VAD Model:', vadConfig.sileroVad.model);
console.log('  Whisper Encoder:', recognizerConfig.modelConfig.whisper.encoder);
console.log('  Whisper Decoder:', recognizerConfig.modelConfig.whisper.decoder);
console.log('  Recording Duration:', RECORDING_DURATION_MS / 1000, 'seconds');
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

// Create circular buffer for streaming audio
const circularBufferSize = 30; // 30 seconds buffer
const buffer = new sherpa_onnx.CircularBuffer(circularBufferSize * vadConfig.sampleRate);

// Set up microphone
console.log('🎙️  Setting up microphone...');
const ai = new portAudio.AudioIO({
  inOptions: {
    channelCount: 1,
    closeOnError: true,
    deviceId: -1, // -1 = default device
    sampleFormat: portAudio.SampleFormatFloat32,
    sampleRate: vadConfig.sampleRate,
  }
});

let printed = false;
const windowSize = vadConfig.sileroVad.windowSize;

// Process audio data
ai.on('data', data => {
  // Convert buffer to Float32Array and push to circular buffer
  const samples = new Float32Array(data.buffer);
  buffer.push(samples);

  // Process VAD in windows
  while (buffer.size() > windowSize) {
    const chunk = buffer.get(buffer.head(), windowSize);
    buffer.pop(windowSize);
    vad.acceptWaveform(chunk);
  }

  if (!printed) {
    console.log('🎙️  Recording... (speak now!)');
    printed = true;
  }
});

// Start recording
console.log('▶️  Starting microphone...\n');
ai.start();

// Stop after specified duration
setTimeout(() => {
  console.log('\n⏹️  Stopping recording...');
  ai.quit();

  // Flush VAD to get final segments
  vad.flush();

  // Extract all speech segments
  const speechSegments = [];
  while (!vad.isEmpty()) {
    const segment = vad.front();
    vad.pop();
    speechSegments.push(segment);
  }

  console.log(`\n✅ Found ${speechSegments.length} speech segment(s)\n`);

  if (speechSegments.length === 0) {
    console.log('⚠️  No speech detected. Try speaking louder or closer to the microphone.\n');
    process.exit(0);
  }

  // Transcribe each speech segment
  console.log('✍️  Transcribing speech segments...\n');

  for (let i = 0; i < speechSegments.length; i++) {
    const segment = speechSegments[i];
    const stream = recognizer.createStream();

    stream.acceptWaveform({
      sampleRate: vadConfig.sampleRate,
      samples: segment.samples,
    });

    recognizer.decode(stream);
    const result = recognizer.getResult(stream);

    const duration = segment.samples.length / vadConfig.sampleRate;
    console.log(`   Segment ${i + 1} (${duration.toFixed(2)}s): "${result.text}"`);
  }

  console.log('\n🎉 Test complete!\n');
  console.log('📝 Summary:');
  console.log('   ✅ Microphone capture - working');
  console.log('   ✅ VAD - detected', speechSegments.length, 'speech segment(s)');
  console.log('   ✅ Whisper transcription - working');
  console.log('\n📍 Next: Integrate into Electron (Phase 2)');
  console.log('');

  process.exit(0);
}, RECORDING_DURATION_MS);
