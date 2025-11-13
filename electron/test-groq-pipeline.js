/**
 * Groq Pipeline Test
 * Tests the full transcription pipeline: VAD → Groq Whisper Large V3 Turbo
 */

const { VAD } = require('./dist/main/worker/vad.js');
const { GroqWhisperTranscriber } = require('./dist/main/worker/groq-whisper.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Simple WAV file parser (reused from test-vad-real.js)
function parseWavFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  // Check for RIFF header
  const riff = buffer.toString('ascii', 0, 4);
  if (riff !== 'RIFF') {
    throw new Error('Not a valid WAV file (missing RIFF header)');
  }

  // Check for WAVE format
  const wave = buffer.toString('ascii', 8, 12);
  if (wave !== 'WAVE') {
    throw new Error('Not a valid WAV file (missing WAVE format)');
  }

  // Find fmt chunk
  let offset = 12;
  while (offset < buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      const audioFormat = buffer.readUInt16LE(offset + 8);
      const numChannels = buffer.readUInt16LE(offset + 10);
      const sampleRate = buffer.readUInt32LE(offset + 12);
      const bitsPerSample = buffer.readUInt16LE(offset + 22);

      // Find data chunk
      let dataOffset = offset + 8 + chunkSize;
      while (dataOffset < buffer.length) {
        const dataChunkId = buffer.toString('ascii', dataOffset, dataOffset + 4);
        const dataChunkSize = buffer.readUInt32LE(dataOffset + 4);

        if (dataChunkId === 'data') {
          // Read audio samples
          const audioData = buffer.slice(dataOffset + 8, dataOffset + 8 + dataChunkSize);

          // Convert to Float32Array
          let samples;
          if (bitsPerSample === 16) {
            const numSamples = Math.floor(audioData.length / 2);
            samples = new Float32Array(numSamples);
            for (let i = 0; i < numSamples; i++) {
              const int16 = audioData.readInt16LE(i * 2);
              samples[i] = int16 / 32768.0;
            }
          } else if (bitsPerSample === 24) {
            const numSamples = Math.floor(audioData.length / 3);
            samples = new Float32Array(numSamples);
            for (let i = 0; i < numSamples; i++) {
              const byte1 = audioData[i * 3];
              const byte2 = audioData[i * 3 + 1];
              const byte3 = audioData[i * 3 + 2];
              const int24 = (byte3 << 24) | (byte2 << 16) | (byte1 << 8);
              samples[i] = int24 / 2147483648.0;
            }
          } else {
            throw new Error(`Unsupported bit depth: ${bitsPerSample}`);
          }

          // Handle stereo -> mono conversion
          if (numChannels === 2) {
            const monoSamples = new Float32Array(samples.length / 2);
            for (let i = 0; i < monoSamples.length; i++) {
              monoSamples[i] = (samples[i * 2] + samples[i * 2 + 1]) / 2;
            }
            samples = monoSamples;
          }

          return {
            sampleRate,
            samples,
            duration: samples.length / sampleRate,
          };
        }

        dataOffset += 8 + dataChunkSize;
      }

      throw new Error('Could not find data chunk in WAV file');
    }

    offset += 8 + chunkSize;
  }

  throw new Error('Could not find fmt chunk in WAV file');
}

// Simple resampling (linear interpolation)
function resample(inputSamples, inputRate, outputRate) {
  const ratio = inputRate / outputRate;
  const outputLength = Math.floor(inputSamples.length / ratio);
  const output = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, inputSamples.length - 1);
    const fraction = srcIndex - srcIndexFloor;

    output[i] = inputSamples[srcIndexFloor] * (1 - fraction) +
                inputSamples[srcIndexCeil] * fraction;
  }

  return output;
}

async function testGroqPipeline() {
  console.log('=== Groq Transcription Pipeline Test ===\n');

  try {
    // Check for API key
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY not found in .env file');
    }

    // Load audio file
    console.log('[1/5] Loading audio file...');
    const audioPath = path.join(__dirname, '../test-audio.wav');
    const { sampleRate, samples, duration } = parseWavFile(audioPath);
    console.log('✓ Audio file loaded');
    console.log(`  - Duration: ${duration.toFixed(2)}s`);
    console.log(`  - Sample rate: ${sampleRate}Hz\n`);

    // Resample to 16kHz if needed
    let processedSamples = samples;
    if (sampleRate !== 16000) {
      console.log('[2/5] Resampling to 16kHz...');
      processedSamples = resample(samples, sampleRate, 16000);
      console.log('✓ Resampling complete\n');
    } else {
      console.log('[2/5] No resampling needed (already 16kHz)\n');
    }

    // Initialize VAD
    console.log('[3/5] Initializing VAD...');
    const vad = new VAD();
    await vad.initialize();
    console.log('✓ VAD initialized\n');

    // Run VAD to find speech segments
    console.log('[4/5] Running VAD to trim silence...');
    const segments = await vad.findSpeechSegments(processedSamples);
    console.log('✓ VAD complete');
    console.log(`  - Speech segments found: ${segments.length}`);

    // Concatenate speech segments
    const totalSpeechSamples = segments.reduce((sum, [start, end]) => sum + (end - start), 0);
    const trimmedAudio = new Float32Array(totalSpeechSamples);
    let writeOffset = 0;
    for (const [start, end] of segments) {
      const segment = processedSamples.slice(start, end);
      trimmedAudio.set(segment, writeOffset);
      writeOffset += segment.length;
    }

    const originalDuration = processedSamples.length / 16000;
    const trimmedDuration = trimmedAudio.length / 16000;
    const savings = ((1 - trimmedDuration / originalDuration) * 100).toFixed(1);

    console.log(`  - Original: ${originalDuration.toFixed(2)}s`);
    console.log(`  - After VAD: ${trimmedDuration.toFixed(2)}s`);
    console.log(`  - Savings: ${savings}%\n`);

    // Transcribe with Groq Whisper
    console.log('[5/5] Transcribing with Groq Whisper...');
    const groq = new GroqWhisperTranscriber({ apiKey: process.env.GROQ_API_KEY });
    const transcription = await groq.transcribe(trimmedAudio);
    console.log('✓ Transcription complete\n');

    // Display results
    console.log('=== RESULTS ===\n');
    console.log('Transcription:');
    console.log(`"${transcription}"\n`);

    console.log('Cost estimate:');
    const cost = (trimmedDuration / 3600) * 0.04; // $0.04/hour (whisper-large-v3-turbo)
    console.log(`  - Audio duration: ${trimmedDuration.toFixed(2)}s`);
    console.log(`  - Cost: $${cost.toFixed(6)}`);
    console.log(`  - Savings from VAD: ${savings}%\n`);

    // Cleanup
    vad.dispose();
    console.log('✓ Pipeline test complete!');

  } catch (error) {
    console.error('\n✗ Pipeline test failed:', error);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Run test
testGroqPipeline();
