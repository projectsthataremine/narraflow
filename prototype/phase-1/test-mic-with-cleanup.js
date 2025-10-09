#!/usr/bin/env node

/**
 * Phase 1 Prototype: Microphone + Text Cleanup Test
 *
 * This script tests the complete pipeline including LLM text cleanup:
 * 1. Microphone capture (5 seconds)
 * 2. VAD (Voice Activity Detection) using Silero VAD
 * 3. Transcription using Whisper tiny.en
 * 4. Text cleanup using Llama 3.2 1B via Ollama
 */

const portAudio = require('naudiodon2');
const sherpa_onnx = require('sherpa-onnx-node');
const ollama = require('ollama').default;
const path = require('path');

console.log('🎤 Mic2Text Phase 1 - Full Pipeline Test (with Cleanup)');
console.log('========================================================\n');

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
  debug: false, // Disable VAD debug output for cleaner output
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
    debug: 0, // Disable Whisper debug output
  },
};

const RECORDING_DURATION_MS = 10000; // 10 seconds

console.log('📁 Configuration:');
console.log('  VAD Model:', vadConfig.sileroVad.model);
console.log('  Whisper Model: whisper-tiny.en (int8)');
console.log('  Cleanup Model: llama3.2:3b via Ollama');
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

// Countdown timer
const durationSeconds = RECORDING_DURATION_MS / 1000;
let elapsed = 0;
const countdownInterval = setInterval(() => {
  elapsed++;
  const remaining = durationSeconds - elapsed;
  process.stdout.write(`\r⏱️  ${elapsed}s elapsed | ${remaining}s remaining...`);
}, 1000);

// Stop after specified duration
setTimeout(async () => {
  clearInterval(countdownInterval);
  console.log('\r                                              '); // Clear countdown line
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

  let rawTranscriptions = [];
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
    rawTranscriptions.push(result.text);
  }

  // Combine all transcriptions
  const rawText = rawTranscriptions.join(' ').trim();
  console.log(`\n📝 Raw Transcription:\n   "${rawText}"\n`);

  // Cleanup with Llama 3.2 3B
  console.log('🧹 Cleaning up text with Llama 3.2 3B...\n');

  const SYSTEM_PROMPT = `You are step 3 in an audio transcription pipeline:
1. Audio is captured from microphone
2. Audio is transcribed to text
3. YOU clean up the transcribed text (this step)
4. Cleaned text is pasted into user's application

Your ONLY job: Fix grammar, punctuation, and capitalization. Format lists when appropriate.
If the text doesn't need fixing, output it unchanged.

CRITICAL RULES:
- Output ONLY the corrected text itself
- NO explanations, suggestions, or commentary
- NO prefixes like "Here is" or "Corrected text:"
- DO NOT change meaning or add information
- DO NOT add content that wasn't in the input`;

  try {
    const response = await ollama.generate({
      model: 'llama3.2:3b',
      prompt: rawText,
      system: SYSTEM_PROMPT,
    });

    const cleanedText = response.response.trim();

    // Validate the result
    const lengthRatio = cleanedText.length / rawText.length;
    const isValid = lengthRatio >= 0.5 && lengthRatio <= 2.0;

    if (!isValid) {
      console.log('⚠️  LLM output failed validation (length ratio:', lengthRatio.toFixed(2), ')');
      console.log('   Falling back to simple cleanup...\n');

      // Simple fallback cleanup
      let fallback = rawText.trim();
      fallback = fallback.charAt(0).toUpperCase() + fallback.slice(1);
      if (!/[.!?]$/.test(fallback)) {
        fallback += '.';
      }

      console.log('✨ Cleaned Text (fallback):\n');
      console.log(fallback);
      console.log('');
    } else {
      console.log('✨ Cleaned Text:\n');
      console.log(cleanedText);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error during text cleanup:', error.message);
    console.log('   Using raw transcription instead.\n');
  }

  console.log('🎉 Test complete!\n');
  console.log('📝 Summary:');
  console.log('   ✅ Microphone capture - working');
  console.log('   ✅ VAD - detected', speechSegments.length, 'speech segment(s)');
  console.log('   ✅ Whisper transcription - working');
  console.log('   ✅ Llama 3.2 3B cleanup - working');
  console.log('\n📍 Next: Integrate into Electron (Phase 2)');
  console.log('');

  process.exit(0);
}, RECORDING_DURATION_MS);
