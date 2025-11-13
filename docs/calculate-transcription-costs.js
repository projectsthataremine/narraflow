#!/usr/bin/env node

/**
 * Transcription Cost Calculator
 * Calculates cost per hour of audio transcribed
 */

// ============================================================================
// Serverless Platform Pricing (Recommended)
// ============================================================================

const SERVERLESS_PRICING = {
  // Baseten - Used by Wispr Flow
  'Baseten T4': 0.6312,         // $0.6312/hour
  'Baseten A10G': 0.8484,       // $0.8484/hour

  // Modal
  'Modal T4': 0.59,             // $0.59/hour
  'Modal A10G': 1.10,           // $1.10/hour

  // RunPod Serverless
  'RunPod Serverless': 0.90,    // $0.90/hour (all GPUs)
};

// ============================================================================
// Traditional GPU Infrastructure (Reference Only)
// ============================================================================

const TRADITIONAL_GPU_PRICING = {
  'AWS g4dn.xlarge (T4)': 0.526,    // $0.526/hour (24/7)
  'AWS g5.xlarge (A10G)': 1.006,    // $1.006/hour (24/7)
};

// ============================================================================
// Speed Multipliers (how many times faster than real-time)
// Higher = faster processing
// Based on Faster-Whisper benchmarks on cloud GPUs
// ============================================================================

const SPEED_MULTIPLIERS = {
  // Model -> GPU Type -> Speed multiplier
  'small.en': {
    'T4': 60,       // ~60x real-time
    'L4': 80,       // ~80x real-time
    'A10': 100,     // ~100x real-time
    'A10G': 100,    // ~100x real-time (AWS A10G)
    'V100': 80,     // ~80x real-time (AWS V100)
    'A100': 150,    // ~150x real-time
    'H100': 200,    // ~200x real-time
  },
  'medium.en': {
    'T4': 40,       // ~40x real-time
    'L4': 55,       // ~55x real-time
    'A10': 70,      // ~70x real-time
    'A10G': 70,     // ~70x real-time (AWS A10G)
    'V100': 60,     // ~60x real-time (AWS V100)
    'A100': 100,    // ~100x real-time
    'H100': 140,    // ~140x real-time
  },
  'large-v3': {
    'T4': 25,       // ~25x real-time
    'L4': 35,       // ~35x real-time
    'A10': 50,      // ~50x real-time
    'A10G': 50,     // ~50x real-time (AWS A10G)
    'V100': 40,     // ~40x real-time (AWS V100)
    'A100': 75,     // ~75x real-time
    'H100': 100,    // ~100x real-time
  },
};

// ============================================================================
// Cloud API Pricing (direct cost per audio hour)
// ============================================================================

const CLOUD_APIS = [
  { implementation: 'Groq Cloud', model: 'Large v3 Turbo', provider: 'Groq LPU', costPerHour: 0.04 },
  { implementation: 'Groq Cloud', model: 'Large v3', provider: 'Groq LPU', costPerHour: 0.111 },
  { implementation: 'OpenAI API', model: 'Large v3', provider: 'OpenAI', costPerHour: 0.36 },
];

// ============================================================================
// Calculations
// ============================================================================

function calculateCostPerHour(gpuPricePerHour, speedMultiplier) {
  // GPU hours needed to process 1 hour of audio
  const gpuHoursNeeded = 1 / speedMultiplier;
  return gpuHoursNeeded * gpuPricePerHour;
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

// ============================================================================
// Generate Table
// ============================================================================

console.log('## Cost Per Hour of Audio Transcribed\n');
console.log('| Implementation | Model | Provider | Cost/Hour |');
console.log('|----------------|-------|----------|-----------|');

// Cloud APIs first (simplest)
for (const api of CLOUD_APIS) {
  const impl = api.implementation === 'Groq Cloud'
    ? `<span style="color: #22c55e">**${api.implementation}**</span>`
    : `**${api.implementation}**`;
  const cost = api.implementation === 'Groq Cloud'
    ? `<span style="color: #22c55e">${formatCurrency(api.costPerHour)}</span>`
    : formatCurrency(api.costPerHour);

  console.log(`| ${impl} | ${api.model} | ${api.provider} | ${cost} |`);
}

// Serverless platforms (recommended)
console.log('\n### Serverless Platforms (Recommended) ⭐\n');
console.log('| Implementation | Model | Provider | Cost/Hour Audio |');
console.log('|----------------|-------|----------|-----------------|');

const models = ['small.en', 'medium.en', 'large-v3'];

for (const model of models) {
  for (const [provider, gpuPrice] of Object.entries(SERVERLESS_PRICING)) {
    // Extract GPU type
    let gpuType;
    if (provider.includes('A10G')) gpuType = 'A10G';
    else if (provider.includes('T4')) gpuType = 'T4';
    else if (provider === 'RunPod Serverless') gpuType = 'T4'; // Use T4 speeds for RunPod Serverless
    else continue;

    const speedMultiplier = SPEED_MULTIPLIERS[model][gpuType];
    if (!speedMultiplier) continue;

    const gpuHoursNeeded = 1 / speedMultiplier;
    const costPerHour = gpuHoursNeeded * gpuPrice;

    const providerName = provider.includes('Baseten')
      ? `**${provider}** ⭐`
      : `**${provider.split(' ')[0]}**`;
    const gpuName = provider === 'RunPod Serverless' ? 'Auto-scaled' : provider.split(' ')[1];

    console.log(`| ${providerName} | ${model} | ${gpuName} GPU | ${formatCurrency(costPerHour)} |`);
  }
}

console.log('\n**Notes:**');
console.log('- **Baseten** ⭐ - Used by Wispr Flow in production');
console.log('- Serverless pricing = only pay for processing time');
console.log('- Cost calculated: (1 hour audio ÷ speed multiplier) × GPU price/hour');
console.log('- Example: 10 hours audio/month = ~$0.10-0.20 total cost');
console.log('- Far more cost-effective than 24/7 servers for variable workloads');

// Traditional GPU infrastructure (reference only)
console.log('\n### Traditional GPU Infrastructure (Reference Only)\n');
console.log('| Implementation | Model | Provider | Monthly Cost* |');
console.log('|----------------|-------|----------|---------------|');

for (const [provider, gpuPrice] of Object.entries(TRADITIONAL_GPU_PRICING)) {
  const monthlyCost = gpuPrice * 720; // 24/7 for 30 days
  console.log(`| Faster-Whisper | small.en | ${provider} | ${formatCurrency(monthlyCost)} |`);
}
for (const [provider, gpuPrice] of Object.entries(TRADITIONAL_GPU_PRICING)) {
  const monthlyCost = gpuPrice * 720;
  console.log(`| Faster-Whisper | medium.en | ${provider} | ${formatCurrency(monthlyCost)} |`);
}

console.log('\n**Notes:**');
console.log('- *Monthly cost assumes 24/7 operation (720 hours)');
console.log('- Only cost-effective for constant, high-volume workloads');
console.log('- Not recommended for dictation apps with sporadic usage');
