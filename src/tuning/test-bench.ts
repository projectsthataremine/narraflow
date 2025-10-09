#!/usr/bin/env ts-node
/**
 * Whisper Test Bench
 *
 * Standalone tool to test transcription without running the full app.
 *
 * Usage:
 *   npm run test-bench -- --help
 *   npm run test-bench -- --duration 5
 */

import { WhisperTranscriber } from '../worker/whisper';
import { MicRecorder } from '../audio/mic';

interface TestResult {
  preset: string;
  transcription: string;
  processingTime: number;
  pipelineMetadata: any;
}

class TestBench {
  /**
   * Test transcription with live microphone recording
   */
  async testTranscription(durationSeconds: number = 8, iterations: number = 1): Promise<TestResult[]> {
    console.log(`\n📊 Whisper Transcription Test`);
    console.log(`Recording ${durationSeconds} seconds...`);
    console.log(`Speak clearly into your microphone now!`);

    // Record audio
    const recorder = new MicRecorder();
    recorder.start();

    // Countdown timer with elapsed and remaining time
    const startTime = Date.now();
    for (let i = durationSeconds; i > 0; i--) {
      const elapsed = durationSeconds - i;
      await this.sleep(1000);
      process.stdout.write(`\r⏱️  ${elapsed}s elapsed | ${i}s remaining...`);
    }
    console.log('\r✓ Recording complete!                        ');

    const audio = recorder.stop();
    if (!audio) {
      throw new Error('Failed to record audio');
    }

    const audioLengthSec = (audio.length / 16000).toFixed(1);
    console.log(`✓ Recorded ${audio.length} samples (${audioLengthSec}s at 16kHz)`);

    // Audio diagnostics
    const rmsDb = this.calculateRMS(audio);
    const maxAmplitude = Math.max(...Array.from(audio).map(Math.abs));
    const hasSignal = maxAmplitude > 0.001;

    console.log(`\n🔍 Audio Diagnostics:`);
    console.log(`  RMS Level: ${rmsDb.toFixed(1)} dB`);
    console.log(`  Max Amplitude: ${maxAmplitude.toFixed(4)}`);
    console.log(`  Has Signal: ${hasSignal ? '✅ Yes' : '❌ No (silence or no mic input)'}`);

    if (!hasSignal) {
      console.log(`\n⚠️  WARNING: No audio signal detected!`);
      console.log(`  Possible issues:`);
      console.log(`  - Microphone not selected or muted`);
      console.log(`  - No permission granted to Terminal/Node`);
      console.log(`  - SoX not installed (run: brew install sox)`);
      console.log(`  - Wrong input device`);
    }

    // Initialize once
    console.log('\n🔄 Loading Whisper model...');
    const whisper = new WhisperTranscriber();
    await whisper.initialize();
    console.log('✓ Model loaded');

    // Run transcription iterations
    const results: TestResult[] = [];
    console.log(`\n🎯 Running ${iterations} iteration(s)...`);

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      const transcription = await whisper.transcribe(audio);
      const processingTime = Date.now() - startTime;

      results.push({
        preset: 'default',
        transcription,
        processingTime,
        pipelineMetadata: { inputLength: audio.length, stftFrames: 0, melFrames: 0, downsampledFrames: 0, finalFrames: 0 },
      });

      if (iterations > 1) {
        console.log(`  Iteration ${i + 1}: ${processingTime}ms`);
      }
    }

    return results;
  }

  /**
   * Print detailed benchmark report
   */
  printBenchmarkReport(results: TestResult[]) {
    console.log('\n\n📊 BENCHMARK RESULTS');
    console.log('='.repeat(80));

    // Calculate stats
    const times = results.map(r => r.processingTime);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    const audioLength = results[0].pipelineMetadata.inputLength;
    const audioSeconds = audioLength / 16000;
    const rtf = avgTime / (audioSeconds * 1000); // Real-time factor

    // Show transcription
    console.log(`\n📝 Transcription: "${results[0].transcription || '(empty)'}"`);

    // Show performance metrics
    console.log(`\n⚡ Performance:`);
    console.log(`  Audio duration: ${audioSeconds.toFixed(2)}s (${audioLength} samples @ 16kHz)`);
    console.log(`  Iterations: ${results.length}`);

    if (results.length > 1) {
      console.log(`  Processing time: ${avgTime.toFixed(0)}ms avg (min: ${minTime}ms, max: ${maxTime}ms)`);
    } else {
      console.log(`  Processing time: ${avgTime.toFixed(0)}ms`);
    }

    console.log(`  Real-time factor: ${rtf.toFixed(2)}x ${rtf < 1 ? '✅ (faster than real-time)' : '⚠️  (slower than real-time)'}`);
    console.log(`  Throughput: ${(audioSeconds / (avgTime / 1000)).toFixed(1)}x real-time`);

    // Quality indicators
    console.log(`\n✅ Quality Checks:`);
    console.log(`  Transcription length: ${results[0].transcription.length} characters`);
    console.log(`  Empty result: ${results[0].transcription.length === 0 ? '❌ Yes (no speech detected)' : '✅ No'}`);

    console.log('\n' + '='.repeat(80) + '\n');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculate RMS (Root Mean Square) level in dB
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);
    const dB = 20 * Math.log10(rms);
    return dB;
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  const bench = new TestBench();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🎤 MIC2TEXT WHISPER TEST BENCH

Isolated testing tool for Whisper transcription with benchmarks.

Usage:
  npm run test-bench                           # Quick test (8 seconds)
  npm run test-bench -- --duration 5           # Test with 5 second recording
  npm run test-bench -- --benchmark            # Run 5 iterations for average
  npm run test-bench -- --duration 5 --iter 10 # Custom duration + iterations

Options:
  --duration SECONDS    Recording duration (default: 8)
  --iter COUNT          Number of iterations for benchmarking (default: 1)
  --benchmark           Shorthand for --iter 5
  --help, -h            Show this help

Examples:
  # Quick test - speak for 8 seconds
  npm run test-bench

  # Shorter recording for testing
  npm run test-bench -- --duration 5

  # Benchmark performance (runs 5 times on same audio)
  npm run test-bench -- --benchmark

  # Detailed benchmark with custom settings
  npm run test-bench -- --duration 10 --iter 10
    `);
    return;
  }

  const durationArg = args.indexOf('--duration');
  const duration = durationArg >= 0 ? parseInt(args[durationArg + 1]) : 8;

  let iterations = 1;
  if (args.includes('--benchmark')) {
    iterations = 5;
  } else {
    const iterArg = args.indexOf('--iter');
    if (iterArg >= 0) {
      iterations = parseInt(args[iterArg + 1]);
    }
  }

  const results = await bench.testTranscription(duration, iterations);
  bench.printBenchmarkReport(results);
}

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}

export { TestBench };
