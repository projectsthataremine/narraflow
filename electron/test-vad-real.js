/**
 * VAD Testing Script - Real Audio File
 * Tests Voice Activity Detection with a real recorded audio file
 */

const { VAD } = require('./dist/main/worker/vad.js');
const fs = require('fs');
const path = require('path');

// Simple WAV file parser
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

      console.log('WAV file info:');
      console.log(`  - Format: ${audioFormat === 1 ? 'PCM' : 'Other'}`);
      console.log(`  - Channels: ${numChannels}`);
      console.log(`  - Sample rate: ${sampleRate} Hz`);
      console.log(`  - Bits per sample: ${bitsPerSample}`);
      console.log('');

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
            // 16-bit PCM
            const numSamples = Math.floor(audioData.length / 2);
            samples = new Float32Array(numSamples);
            for (let i = 0; i < numSamples; i++) {
              const int16 = audioData.readInt16LE(i * 2);
              samples[i] = int16 / 32768.0; // Normalize to [-1, 1]
            }
          } else if (bitsPerSample === 24) {
            // 24-bit PCM
            const numSamples = Math.floor(audioData.length / 3);
            samples = new Float32Array(numSamples);
            for (let i = 0; i < numSamples; i++) {
              const byte1 = audioData[i * 3];
              const byte2 = audioData[i * 3 + 1];
              const byte3 = audioData[i * 3 + 2];
              const int24 = (byte3 << 24) | (byte2 << 16) | (byte1 << 8);
              samples[i] = int24 / 2147483648.0; // Normalize to [-1, 1]
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

    // Linear interpolation
    output[i] = inputSamples[srcIndexFloor] * (1 - fraction) +
                inputSamples[srcIndexCeil] * fraction;
  }

  return output;
}

async function testVADWithRealAudio() {
  console.log('=== VAD Test with Real Audio ===\n');

  try {
    // Load audio file
    console.log('[1/6] Loading audio file...');
    const audioPath = path.join(__dirname, '../test-audio.wav');
    const { sampleRate, samples, duration } = parseWavFile(audioPath);
    console.log('✓ Audio file loaded');
    console.log(`  - Duration: ${duration.toFixed(2)}s`);
    console.log(`  - Samples: ${samples.length}`);
    console.log('');

    // Resample to 16kHz if needed
    let processedSamples = samples;
    if (sampleRate !== 16000) {
      console.log(`[2/6] Resampling from ${sampleRate}Hz to 16000Hz...`);
      processedSamples = resample(samples, sampleRate, 16000);
      console.log('✓ Resampling complete');
      console.log(`  - New sample count: ${processedSamples.length}`);
      console.log(`  - New duration: ${(processedSamples.length / 16000).toFixed(2)}s`);
      console.log('');
    } else {
      console.log('[2/6] No resampling needed (already 16kHz)\n');
    }

    // Initialize VAD
    console.log('[3/6] Initializing VAD...');
    const vad = new VAD();
    await vad.initialize();
    console.log('✓ VAD initialized\n');

    // Save AGC-boosted audio for inspection
    console.log('[4/5] Applying AGC and saving boosted audio...');
    const VADClass = vad.constructor;
    const tempVAD = new VADClass();

    // Access the private applyAGC method via prototype
    const agcMethod = Object.getPrototypeOf(vad).applyAGC.bind(vad);
    const boostedAudio = agcMethod(processedSamples);

    const boostedWavBuffer = float32ToWav(boostedAudio, 16000);
    fs.writeFileSync(path.join(__dirname, '../test-audio-agc-boosted.wav'), boostedWavBuffer);
    console.log('✓ AGC boosted audio saved to: ../test-audio-agc-boosted.wav');
    console.log('  - Listen to this to verify AGC amplification\n');

    // Run VAD analysis
    console.log('[5/5] Running VAD analysis...');
    const frameSize = vad.getFrameSize();
    const probabilities = await vad.processBuffer(processedSamples);
    console.log('✓ VAD analysis complete');
    console.log(`  - Frame size: ${frameSize} samples (32ms)`);
    console.log(`  - Total frames: ${probabilities.length}\n`);

    // Display frame-by-frame results (sample every 30 frames = ~1 second)
    console.log('Frame-by-frame probabilities (sampled every ~1s):');
    console.log('Time (s) | Probability | Status');
    console.log('---------|-------------|--------');
    for (let i = 0; i < probabilities.length; i += 30) {
      const timeSeconds = ((i * frameSize) / 16000).toFixed(2);
      const prob = probabilities[i].toFixed(3);
      const status = vad.isSpeech(probabilities[i]) ? 'SPEECH' : 'SILENCE';
      console.log(`${timeSeconds.padStart(8)} | ${prob.padStart(11)} | ${status}`);
    }
    console.log('');

    // Find speech segments
    console.log('[6/6] Finding speech segments...');
    const segments = await vad.findSpeechSegments(processedSamples);
    console.log('✓ Speech segments found\n');

    if (segments.length === 0) {
      console.log('⚠️  No speech segments detected!');
      console.log('');
      console.log('Possible reasons:');
      console.log('  1. Audio is too quiet (check recording level)');
      console.log('  2. Audio is actually silence');
      console.log('  3. Audio format issue');
      console.log('');
      console.log('Try recording louder or checking the audio file plays correctly.');
    } else {
      console.log('Speech segments detected:');
      segments.forEach((segment, index) => {
        const [start, end] = segment;
        const startTime = (start / 16000).toFixed(2);
        const endTime = (end / 16000).toFixed(2);
        const segmentDuration = ((end - start) / 16000).toFixed(2);
        console.log(`  Segment ${index + 1}: ${startTime}s - ${endTime}s (${segmentDuration}s)`);
      });
      console.log('');

      // Calculate statistics
      const totalSpeechSamples = segments.reduce((sum, [start, end]) => sum + (end - start), 0);
      const totalSpeechSeconds = (totalSpeechSamples / 16000).toFixed(2);
      const audioLength = processedSamples.length / 16000;
      const speechPercentage = ((totalSpeechSamples / processedSamples.length) * 100).toFixed(1);

      console.log('Statistics:');
      console.log(`  - Total audio: ${audioLength.toFixed(2)}s`);
      console.log(`  - Speech detected: ${totalSpeechSeconds}s (${speechPercentage}%)`);
      console.log(`  - Silence: ${(audioLength - totalSpeechSeconds).toFixed(2)}s (${(100 - speechPercentage).toFixed(1)}%)`);
      console.log(`  - Speech segments: ${segments.length}`);
      console.log('');

      // Show what would be sent to Groq
      console.log('Savings from VAD trimming:');
      console.log(`  - Original: ${audioLength.toFixed(2)}s`);
      console.log(`  - After VAD: ${totalSpeechSeconds}s`);
      console.log(`  - Savings: ${((1 - totalSpeechSeconds / audioLength) * 100).toFixed(1)}% less to transcribe`);
      console.log(`  - Cost savings: ${((1 - totalSpeechSeconds / audioLength) * 100).toFixed(1)}% on Groq API calls`);

      // Save the trimmed audio to a file
      console.log('\n[BONUS] Saving VAD-trimmed audio...');
      const trimmedAudio = new Float32Array(totalSpeechSamples);
    let writeOffset = 0;
    for (const [start, end] of segments) {
      const segment = processedSamples.slice(start, end);
      trimmedAudio.set(segment, writeOffset);
      writeOffset += segment.length;
    }

      // Convert to WAV and save
      const trimmedWavBuffer = float32ToWav(trimmedAudio, 16000);
      fs.writeFileSync(path.join(__dirname, '../test-audio-vad-trimmed.wav'), trimmedWavBuffer);
      console.log('✓ Saved trimmed audio to: ../test-audio-vad-trimmed.wav');
      console.log(`  - This file contains only the detected speech segments`);
      console.log(`  - Upload this to Groq's website to test transcription\n`);
    }

    // Cleanup
    vad.dispose();
    console.log('✓ VAD test complete!');

  } catch (error) {
    console.error('\n✗ VAD test failed:', error);
    process.exit(1);
  }
}

// WAV conversion function (reused from above)
function float32ToWav(float32Array, sampleRate) {
  const buffer = Buffer.alloc(44 + float32Array.length * 2);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + float32Array.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM format
  buffer.writeUInt16LE(1, 20); // Linear PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // Byte rate
  buffer.writeUInt16LE(2, 32); // Block align
  buffer.writeUInt16LE(16, 34); // Bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(float32Array.length * 2, 40);

  // Convert float32 [-1, 1] to int16 [-32768, 32767]
  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return buffer;
}

// Run test
testVADWithRealAudio();
