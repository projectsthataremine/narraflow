/**
 * VAD Testing Script
 * Tests Voice Activity Detection with sample audio
 */

const { VAD } = require('./dist/main/worker/vad.js');
const fs = require('fs');

async function testVAD() {
  console.log('=== VAD Test ===\n');

  try {
    // Initialize VAD
    console.log('[1/4] Initializing VAD...');
    const vad = new VAD();
    await vad.initialize();
    console.log('✓ VAD initialized\n');

    // Create test audio: 3 seconds of samples
    // First 1s: silence (0.0)
    // Next 1s: speech (random values)
    // Last 1s: silence (0.0)
    console.log('[2/4] Creating test audio (3 seconds)...');
    const sampleRate = 16000;
    const duration = 3;
    const totalSamples = sampleRate * duration;
    const audioBuffer = new Float32Array(totalSamples);

    // Silence: 0-1s
    for (let i = 0; i < sampleRate; i++) {
      audioBuffer[i] = 0.0;
    }

    // Speech: 1-2s (random noise to simulate speech)
    for (let i = sampleRate; i < sampleRate * 2; i++) {
      audioBuffer[i] = (Math.random() - 0.5) * 0.5; // Range: -0.25 to 0.25
    }

    // Silence: 2-3s
    for (let i = sampleRate * 2; i < totalSamples; i++) {
      audioBuffer[i] = 0.0;
    }

    console.log('✓ Test audio created');
    console.log(`  - Total samples: ${totalSamples}`);
    console.log(`  - Duration: ${duration}s`);
    console.log(`  - Pattern: 1s silence → 1s speech → 1s silence\n`);

    // Process buffer and get probabilities
    console.log('[3/4] Running VAD analysis...');
    const frameSize = vad.getFrameSize();
    const probabilities = await vad.processBuffer(audioBuffer);
    console.log('✓ VAD analysis complete');
    console.log(`  - Frame size: ${frameSize} samples (32ms)`);
    console.log(`  - Total frames: ${probabilities.length}\n`);

    // Display frame-by-frame results (sample every 10th frame)
    console.log('Frame-by-frame probabilities (sampled):');
    console.log('Time (s) | Probability | Status');
    console.log('---------|-------------|--------');
    for (let i = 0; i < probabilities.length; i += 10) {
      const timeSeconds = ((i * frameSize) / sampleRate).toFixed(2);
      const prob = probabilities[i].toFixed(3);
      const status = vad.isSpeech(probabilities[i]) ? 'SPEECH' : 'SILENCE';
      console.log(`${timeSeconds.padStart(8)} | ${prob.padStart(11)} | ${status}`);
    }
    console.log('');

    // Find speech segments
    console.log('[4/4] Finding speech segments...');
    const segments = await vad.findSpeechSegments(audioBuffer);
    console.log('✓ Speech segments found\n');

    console.log('Speech segments:');
    segments.forEach((segment, index) => {
      const [start, end] = segment;
      const startTime = (start / sampleRate).toFixed(2);
      const endTime = (end / sampleRate).toFixed(2);
      const duration = ((end - start) / sampleRate).toFixed(2);
      console.log(`  Segment ${index + 1}: ${startTime}s - ${endTime}s (${duration}s duration)`);
    });

    // Calculate statistics
    const totalSpeechSamples = segments.reduce((sum, [start, end]) => sum + (end - start), 0);
    const totalSpeechSeconds = (totalSpeechSamples / sampleRate).toFixed(2);
    const speechPercentage = ((totalSpeechSamples / totalSamples) * 100).toFixed(1);

    console.log('\nStatistics:');
    console.log(`  - Total audio: ${duration}s`);
    console.log(`  - Speech detected: ${totalSpeechSeconds}s (${speechPercentage}%)`);
    console.log(`  - Silence: ${(duration - totalSpeechSeconds).toFixed(2)}s (${(100 - speechPercentage).toFixed(1)}%)`);
    console.log(`  - Speech segments: ${segments.length}`);

    // Cleanup
    vad.dispose();
    console.log('\n✓ VAD test complete!');

  } catch (error) {
    console.error('\n✗ VAD test failed:', error);
    console.error('\nPossible issues:');
    console.error('  1. Model file not found at resources/models/silero_vad.onnx');
    console.error('  2. ONNX Runtime not properly installed');
    console.error('  3. Model file is corrupted or wrong version');
    process.exit(1);
  }
}

// Run test
testVAD();
