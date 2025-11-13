#!/usr/bin/env node

/**
 * Speed Benchmark Calculator
 * Calculates processing times for different audio lengths
 */

// ============================================================================
// SPEED MULTIPLIERS (times faster than real-time)
// ============================================================================

// whisper.cpp with CoreML (best for Mac M1/M2/M3)
// Based on benchmarks: M1 Mac Mini transcribed 2.5hr podcast in 10min = 15x real-time
const WHISPER_CPP_SPEEDS = {
  'base.en': {
    cpu: 2,      // ~2x real-time (CPU only)
    coreml: 12,  // ~12x real-time (CoreML/ANE)
  },
  'small.en': {
    cpu: 1.5,    // ~1.5x real-time
    coreml: 10,  // ~10x real-time (verified: 2.5hr in 10min = 15x, using conservative 10x)
  },
  'medium.en': {
    cpu: 0.8,    // ~0.8x real-time
    coreml: 5,   // ~5x real-time
  },
};

// Faster-Whisper (CPU only on Mac - NO Metal support, CUDA only)
const FASTER_WHISPER_SPEEDS = {
  'base.en': {
    cpu: 3,      // 3x real-time (CPU only)
  },
  'small.en': {
    cpu: 2.5,    // 2.5x real-time (CPU only)
  },
  'medium.en': {
    cpu: 1.5,    // 1.5x real-time (CPU only)
  },
};

// OpenAI Whisper with MPS (Metal Performance Shaders)
// Based on benchmarks: M2 Mac small = 15.588s for 40s audio = 2.56x real-time
const OPENAI_WHISPER_SPEEDS = {
  'base.en': {
    cpu: 0.8,    // ~0.8x real-time
    mps: 3,      // ~3x real-time with Metal/MPS
  },
  'small.en': {
    cpu: 0.6,    // ~0.6x real-time
    mps: 2.5,    // ~2.5x real-time (verified: 40s in 15.6s)
  },
  'medium.en': {
    cpu: 0.4,    // ~0.4x real-time
    mps: 1.5,    // ~1.5x real-time
  },
};

const REMOTE_SPEEDS = {
  // Model -> GPU Type -> Speed multiplier (times faster than real-time)
  // Based on Faster-Whisper benchmarks:
  // - Baseten achieves 1000x+ with heavy optimization
  // - Standard Faster-Whisper on cloud GPUs: 40-150x
  // - Smaller models = faster processing
  'small.en': {
    'T4': 60,      // ~60x real-time
    'L4': 80,      // ~80x real-time
    'A10': 100,    // ~100x real-time (A10G)
    'A100': 150,   // ~150x real-time
    'H100': 200,   // ~200x real-time
  },
  'medium.en': {
    'T4': 40,      // ~40x real-time
    'L4': 55,      // ~55x real-time
    'A10': 70,     // ~70x real-time (A10G)
    'A100': 100,   // ~100x real-time
    'H100': 140,   // ~140x real-time
  },
  'large-v3': {
    'T4': 25,      // ~25x real-time
    'L4': 35,      // ~35x real-time
    'A10': 50,     // ~50x real-time (A10G)
    'A100': 75,    // ~75x real-time
    'H100': 100,   // ~100x real-time
  },
};

// Cloud APIs (no GPU needed, direct speeds)
const CLOUD_APIS = {
  'Groq Cloud (Large v3 Turbo)': 216,  // 216x real-time (benchmarked)
  'Groq Cloud (Large v3)': 180,        // ~180x real-time (estimated, slightly slower than turbo)
  'OpenAI API': 10,                    // ~10x real-time
};

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateProcessingTime(audioLengthSeconds, speedMultiplier) {
  return audioLengthSeconds / speedMultiplier;
}

function formatTime(seconds) {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  } else if (seconds < 60) {
    return `~${Math.round(seconds)}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `~${minutes}m${secs}s`;
  }
}

// ============================================================================
// OUTPUT GENERATION
// ============================================================================

console.log('## Local Processing\n');
console.log('| Implementation | Model | Hardware | 30s Audio | 60s Audio | 2min Audio | 3min Audio |');
console.log('|----------------|-------|----------|-----------|-----------|------------|------------|');

// whisper.cpp with CoreML (best for Mac)
for (const [model, speeds] of Object.entries(WHISPER_CPP_SPEEDS)) {
  // CPU row
  const cpu30 = calculateProcessingTime(30, speeds.cpu);
  const cpu60 = calculateProcessingTime(60, speeds.cpu);
  const cpu120 = calculateProcessingTime(120, speeds.cpu);
  const cpu180 = calculateProcessingTime(180, speeds.cpu);

  console.log(`| whisper.cpp | ${model} | CPU | ${formatTime(cpu30)} | ${formatTime(cpu60)} | ${formatTime(cpu120)} | ${formatTime(cpu180)} |`);

  // CoreML/ANE row
  const coreml30 = calculateProcessingTime(30, speeds.coreml);
  const coreml60 = calculateProcessingTime(60, speeds.coreml);
  const coreml120 = calculateProcessingTime(120, speeds.coreml);
  const coreml180 = calculateProcessingTime(180, speeds.coreml);

  console.log(`| whisper.cpp | ${model} | CoreML (ANE) | ${formatTime(coreml30)} | ${formatTime(coreml60)} | ${formatTime(coreml120)} | ${formatTime(coreml180)} |`);
}

// Faster-Whisper (CPU only on Mac)
for (const [model, speeds] of Object.entries(FASTER_WHISPER_SPEEDS)) {
  const cpu30 = calculateProcessingTime(30, speeds.cpu);
  const cpu60 = calculateProcessingTime(60, speeds.cpu);
  const cpu120 = calculateProcessingTime(120, speeds.cpu);
  const cpu180 = calculateProcessingTime(180, speeds.cpu);

  console.log(`| Faster-Whisper | ${model} | CPU | ${formatTime(cpu30)} | ${formatTime(cpu60)} | ${formatTime(cpu120)} | ${formatTime(cpu180)} |`);
}

// OpenAI Whisper with MPS
for (const [model, speeds] of Object.entries(OPENAI_WHISPER_SPEEDS)) {
  // CPU row
  const cpu30 = calculateProcessingTime(30, speeds.cpu);
  const cpu60 = calculateProcessingTime(60, speeds.cpu);
  const cpu120 = calculateProcessingTime(120, speeds.cpu);
  const cpu180 = calculateProcessingTime(180, speeds.cpu);

  console.log(`| OpenAI Whisper | ${model} | CPU | ${formatTime(cpu30)} | ${formatTime(cpu60)} | ${formatTime(cpu120)} | ${formatTime(cpu180)} |`);

  // MPS (Metal) row
  const mps30 = calculateProcessingTime(30, speeds.mps);
  const mps60 = calculateProcessingTime(60, speeds.mps);
  const mps120 = calculateProcessingTime(120, speeds.mps);
  const mps180 = calculateProcessingTime(180, speeds.mps);

  console.log(`| OpenAI Whisper | ${model} | MPS (Metal) | ${formatTime(mps30)} | ${formatTime(mps60)} | ${formatTime(mps120)} | ${formatTime(mps180)} |`);
}

console.log('');

console.log('## Remote Processing (Cloud/GPU Servers)\n');

// Serverless Platforms (Recommended)
console.log('### Serverless Platforms (Recommended for Variable Workloads) ⭐\n');
console.log('| Implementation | Model | Provider | 30s Audio | 60s Audio | 2min Audio | 3min Audio |');
console.log('|----------------|-------|----------|-----------|-----------|------------|------------|');

// Cloud APIs first
for (const [name, speed] of Object.entries(CLOUD_APIS)) {
  const t30 = calculateProcessingTime(30, speed);
  const t60 = calculateProcessingTime(60, speed);
  const t120 = calculateProcessingTime(120, speed);
  const t180 = calculateProcessingTime(180, speed);

  const [impl, model] = name.includes('Groq')
    ? ['<span style="color: #22c55e">**Groq Cloud**</span>', name.includes('Turbo') ? 'Large v3 Turbo' : 'Large v3']
    : ['**OpenAI API**', 'Large v3'];

  const provider = name.includes('Groq') ? 'Groq LPU' : 'OpenAI';

  const format30 = name.includes('Groq') ? `<span style="color: #22c55e">${formatTime(t30)}</span>` : formatTime(t30);
  const format60 = name.includes('Groq') ? `<span style="color: #22c55e">${formatTime(t60)}</span>` : formatTime(t60);
  const format120 = name.includes('Groq') ? `<span style="color: #22c55e">${formatTime(t120)}</span>` : formatTime(t120);
  const format180 = name.includes('Groq') ? `<span style="color: #22c55e">${formatTime(t180)}</span>` : formatTime(t180);

  console.log(`| ${impl} | ${model} | ${provider} | ${format30} | ${format60} | ${format120} | ${format180} |`);
}

// Baseten (what Wispr Flow uses)
const BASETEN_SPEEDS = {
  'small.en': {
    'T4 GPU': 60,      // ~60x real-time
    'A10G GPU': 100,   // ~100x real-time
  },
  'medium.en': {
    'T4 GPU': 40,      // ~40x real-time
    'A10G GPU': 70,    // ~70x real-time
  },
  'large-v3': {
    'T4 GPU': 25,      // ~25x real-time
    'A10G GPU': 50,    // ~50x real-time
  },
};

for (const [model, gpuSpeeds] of Object.entries(BASETEN_SPEEDS)) {
  for (const [gpu, speed] of Object.entries(gpuSpeeds)) {
    const t30 = calculateProcessingTime(30, speed);
    const t60 = calculateProcessingTime(60, speed);
    const t120 = calculateProcessingTime(120, speed);
    const t180 = calculateProcessingTime(180, speed);

    console.log(`| **Baseten** ⭐ | ${model} | ${gpu} | ${formatTime(t30)} | ${formatTime(t60)} | ${formatTime(t120)} | ${formatTime(t180)} |`);
  }
}

// Modal
const MODAL_SPEEDS = {
  'small.en': {
    'T4 GPU': 60,      // ~60x real-time
    'A10G GPU': 100,   // ~100x real-time
  },
  'medium.en': {
    'T4 GPU': 40,      // ~40x real-time
    'A10G GPU': 70,    // ~70x real-time
  },
};

for (const [model, gpuSpeeds] of Object.entries(MODAL_SPEEDS)) {
  for (const [gpu, speed] of Object.entries(gpuSpeeds)) {
    const t30 = calculateProcessingTime(30, speed);
    const t60 = calculateProcessingTime(60, speed);
    const t120 = calculateProcessingTime(120, speed);
    const t180 = calculateProcessingTime(180, speed);

    console.log(`| **Modal** | ${model} | ${gpu} | ${formatTime(t30)} | ${formatTime(t60)} | ${formatTime(t120)} | ${formatTime(t180)} |`);
  }
}

// RunPod Serverless
const RUNPOD_SERVERLESS_SPEEDS = {
  'small.en': 60,    // ~60x real-time
  'medium.en': 40,   // ~40x real-time
};

for (const [model, speed] of Object.entries(RUNPOD_SERVERLESS_SPEEDS)) {
  const t30 = calculateProcessingTime(30, speed);
  const t60 = calculateProcessingTime(60, speed);
  const t120 = calculateProcessingTime(120, speed);
  const t180 = calculateProcessingTime(180, speed);

  console.log(`| **RunPod Serverless** | ${model} | Auto-scaled GPU | ${formatTime(t30)} | ${formatTime(t60)} | ${formatTime(t120)} | ${formatTime(t180)} |`);
}

console.log('\n**Serverless Platform Notes:**');
console.log('- **Baseten** ⭐ - Used by Wispr Flow for production');
console.log('- Only pay for actual processing time (seconds), not idle time');
console.log('- Auto-scales to handle traffic spikes');
console.log('- Cold start: 200ms-4s depending on platform');
console.log('- Best for variable/spiky workloads (dictation apps)');
console.log('- **Cost example**: 10 hours of audio/month → ~$0.10-0.20 total\n');

// Traditional GPU Infrastructure (Reference Only)
console.log('### Traditional GPU Infrastructure (Reference Only)\n');
console.log('| Implementation | Model | Provider | 30s Audio | 60s Audio | 2min Audio | 3min Audio |');
console.log('|----------------|-------|----------|-----------|-----------|------------|------------|');

const AWS_SPEEDS = {
  'small.en': {
    'g4dn.xlarge (T4)': 60,     // ~60x real-time
    'g5.xlarge (A10G)': 100,    // ~100x real-time
  },
  'medium.en': {
    'g4dn.xlarge (T4)': 40,     // ~40x real-time
    'g5.xlarge (A10G)': 70,     // ~70x real-time
  },
};

for (const [model, instances] of Object.entries(AWS_SPEEDS)) {
  for (const [instance, speed] of Object.entries(instances)) {
    const t30 = calculateProcessingTime(30, speed);
    const t60 = calculateProcessingTime(60, speed);
    const t120 = calculateProcessingTime(120, speed);
    const t180 = calculateProcessingTime(180, speed);

    console.log(`| Faster-Whisper | ${model} | AWS ${instance} | ${formatTime(t30)} | ${formatTime(t60)} | ${formatTime(t120)} | ${formatTime(t180)} |`);
  }
}

console.log('\n**Traditional GPU Notes:**');
console.log('- Requires 24/7 server running = $379-724/month');
console.log('- Only cost-effective for constant, high-volume workloads');
console.log('- Not recommended for dictation apps with sporadic usage');
