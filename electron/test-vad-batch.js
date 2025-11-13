/**
 * Batch VAD Testing Script
 * Tests multiple audio files and outputs trimmed versions
 */

const { VAD } = require('./dist/main/worker/vad.js');
const fs = require('fs');
const path = require('path');

// Simple WAV file parser
function parseWavFile(filePath) {
  const buffer = fs.readFileSync(filePath);

  const riff = buffer.toString('ascii', 0, 4);
  if (riff !== 'RIFF') {
    throw new Error('Not a valid WAV file (missing RIFF header)');
  }

  const wave = buffer.toString('ascii', 8, 12);
  if (wave !== 'WAVE') {
    throw new Error('Not a valid WAV file (missing WAVE format)');
  }

  let offset = 12;
  while (offset < buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      const audioFormat = buffer.readUInt16LE(offset + 8);
      const numChannels = buffer.readUInt16LE(offset + 10);
      const sampleRate = buffer.readUInt32LE(offset + 12);
      const bitsPerSample = buffer.readUInt16LE(offset + 22);

      let dataOffset = offset + 8 + chunkSize;
      while (dataOffset < buffer.length) {
        const dataChunkId = buffer.toString('ascii', dataOffset, dataOffset + 4);
        const dataChunkSize = buffer.readUInt32LE(dataOffset + 4);

        if (dataChunkId === 'data') {
          const audioData = buffer.slice(dataOffset + 8, dataOffset + 8 + dataChunkSize);

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

// Simple resampling
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

// WAV conversion
function float32ToWav(float32Array, sampleRate) {
  const buffer = Buffer.alloc(44 + float32Array.length * 2);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + float32Array.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(float32Array.length * 2, 40);

  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return buffer;
}

async function testVADForDirectory(testDir) {
  const testName = path.basename(testDir);
  console.log(`\n=== Testing ${testName} ===`);

  try {
    const audioPath = path.join(testDir, 'test-audio.wav');
    if (!fs.existsSync(audioPath)) {
      console.log(`⚠️  No test-audio.wav found in ${testName}, skipping`);
      return null;
    }

    // Load audio
    const { sampleRate, samples, duration } = parseWavFile(audioPath);

    // Resample if needed
    let processedSamples = samples;
    if (sampleRate !== 16000) {
      processedSamples = resample(samples, sampleRate, 16000);
    }

    // Initialize VAD
    const vad = new VAD();
    await vad.initialize();

    // Find speech segments
    const segments = await vad.findSpeechSegments(processedSamples);

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

    // Save trimmed audio
    const trimmedWavBuffer = float32ToWav(trimmedAudio, 16000);
    fs.writeFileSync(path.join(testDir, 'test-audio-vad-trimmed.wav'), trimmedWavBuffer);

    // Results
    console.log(`Original: ${originalDuration.toFixed(2)}s`);
    console.log(`Trimmed:  ${trimmedDuration.toFixed(2)}s`);
    console.log(`Savings:  ${savings}%`);
    console.log(`Segments: ${segments.length}`);
    console.log(`✓ Saved to ${testName}/test-audio-vad-trimmed.wav`);

    vad.dispose();

    return {
      testName,
      originalDuration,
      trimmedDuration,
      savings: parseFloat(savings),
      segments: segments.length,
    };

  } catch (error) {
    console.error(`✗ Failed:`, error.message);
    return null;
  }
}

async function runBatchTest() {
  console.log('=== Batch VAD Testing ===');

  const audioDir = path.join(__dirname, '../audio');
  const testDirs = fs.readdirSync(audioDir)
    .filter(name => name.startsWith('test-'))
    .sort()
    .map(name => path.join(audioDir, name));

  const results = [];
  for (const testDir of testDirs) {
    const result = await testVADForDirectory(testDir);
    if (result) {
      results.push(result);
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log('Test      | Original | Trimmed | Savings | Segments');
  console.log('----------|----------|---------|---------|----------');
  for (const r of results) {
    console.log(
      `${r.testName.padEnd(9)} | ${r.originalDuration.toFixed(2).padStart(8)}s | ${r.trimmedDuration.toFixed(2).padStart(7)}s | ${r.savings.toFixed(1).padStart(6)}% | ${r.segments.toString().padStart(8)}`
    );
  }

  console.log('\n✓ Batch test complete!');
}

// Run batch test
runBatchTest();
