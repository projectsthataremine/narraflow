#!/usr/bin/env node

/**
 * Usage Cost Calculator
 *
 * Calculates realistic user costs across different cloud providers
 * Run: node calculate-usage-costs.js
 */

// ============================================================================
// CONFIGURATION - Adjust these values
// ============================================================================

const USER_SEGMENTS = [
  { name: 'Light User', hoursPerMonth: 5, percentage: 40 },
  { name: 'Average User', hoursPerMonth: 10, percentage: 50 },
  { name: 'Heavy User', hoursPerMonth: 22, percentage: 10 },
];

const PROVIDERS = [
  // Groq Cloud (direct pricing per audio hour)
  { name: 'Groq Distil-Whisper', pricePerHour: 0.02, speedMultiplier: null },
  { name: 'Groq Large v3 Turbo', pricePerHour: 0.04, speedMultiplier: null },

  // Baseten (serverless GPU pricing)
  { name: 'Baseten T4', pricePerGpuHour: 0.6312, speedMultiplier: 60 },      // small.en @ 60x real-time
  { name: 'Baseten A10G', pricePerGpuHour: 0.8484, speedMultiplier: 100 },   // small.en @ 100x real-time

  // Modal (serverless GPU pricing)
  { name: 'Modal T4', pricePerGpuHour: 0.59, speedMultiplier: 60 },          // small.en @ 60x real-time
  { name: 'Modal A10G', pricePerGpuHour: 1.10, speedMultiplier: 100 },       // small.en @ 100x real-time

  // RunPod Serverless (auto-scaled)
  { name: 'RunPod Serverless', pricePerGpuHour: 0.90, speedMultiplier: 60 }, // small.en @ 60x real-time
];

const PRICING = 6; // Monthly subscription price
const TOTAL_USERS = 12350; // 10% of Wispr Flow's 123,500
const CONVERSION_RATE = 0.19; // 19% free to paid

// ============================================================================
// CALCULATIONS
// ============================================================================

function calculateProviderCost(provider, hoursPerMonth) {
  if (provider.pricePerHour) {
    // Direct pricing per audio hour (like Groq)
    return hoursPerMonth * provider.pricePerHour;
  } else {
    // GPU pricing with speed multiplier
    const gpuHoursNeeded = hoursPerMonth / provider.speedMultiplier;
    return gpuHoursNeeded * provider.pricePerGpuHour;
  }
}

function calculateBlendedAverage() {
  let totalHours = 0;
  for (const segment of USER_SEGMENTS) {
    totalHours += (segment.hoursPerMonth * segment.percentage) / 100;
  }
  return totalHours;
}

function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`;
}

function formatPercent(decimal) {
  return `${(decimal * 100).toFixed(0)}%`;
}

// ============================================================================
// OUTPUT GENERATION
// ============================================================================

console.log('# User Cost Analysis\n');
console.log('## User Segment Distribution\n');
console.log('| Segment | Hours/Month | % of Users |');
console.log('|---------|-------------|------------|');
for (const segment of USER_SEGMENTS) {
  console.log(`| **${segment.name}** | ${segment.hoursPerMonth} | ${segment.percentage}% |`);
}

const blendedAvg = calculateBlendedAverage();
console.log(`\n**Blended Average:** ${blendedAvg.toFixed(1)} hours/month\n`);
console.log('## Cost Analysis by User Segment\n');

// Cost by segment
for (const segment of USER_SEGMENTS) {
  console.log(`### ${segment.name} (${segment.hoursPerMonth} hours/month)\n`);
  console.log('| Provider | Cost/Month | Profit @ $6 | Margin |');
  console.log('|----------|-----------|-------------|---------|');

  for (const provider of PROVIDERS) {
    const cost = calculateProviderCost(provider, segment.hoursPerMonth);
    const profit = PRICING - cost;
    const margin = profit / PRICING;

    console.log(`| **${provider.name}** | ${formatCurrency(cost)} | ${formatCurrency(profit)} | **${formatPercent(margin)}** |`);
  }
  console.log('');
}

console.log('## Blended Cost (Weighted Average)\n');
console.log('**User Mix:**');
for (const segment of USER_SEGMENTS) {
  const weightedHours = (segment.hoursPerMonth * segment.percentage) / 100;
  console.log(`- ${segment.percentage}% ${segment.name} (${segment.hoursPerMonth}h) = ${weightedHours.toFixed(2)} hours`);
}
console.log(`- **Blended Total: ${blendedAvg.toFixed(1)} hours/month**\n`);

console.log('### Blended Costs Per User\n');
console.log('| Provider | Blended Cost | Profit @ $6 | Margin |');
console.log('|----------|-------------|-------------|---------|');

const blendedCosts = {};
for (const provider of PROVIDERS) {
  const cost = calculateProviderCost(provider, blendedAvg);
  const profit = PRICING - cost;
  const margin = profit / PRICING;
  blendedCosts[provider.name] = cost;

  console.log(`| **${provider.name}** | **${formatCurrency(cost)}** | **${formatCurrency(profit)}** | **${formatPercent(margin)}** |`);
}
console.log('');

const payingUsers = Math.round(TOTAL_USERS * CONVERSION_RATE);
const monthlyRevenue = payingUsers * PRICING;

console.log('## Business Implications\n');
console.log('### Year 1 Target: 10% of Wispr Flow\'s Market\n');
console.log('**Target Users:**');
console.log(`- Total users: ${TOTAL_USERS.toLocaleString()} (10% of 123,500)`);
console.log(`- Paying users: ${payingUsers.toLocaleString()} (${formatPercent(CONVERSION_RATE)} conversion rate)`);
console.log(`- Pricing: $${PRICING}/month\n`);

console.log(`### At ${payingUsers.toLocaleString()} Paying Users ($${PRICING}/month)\n`);
console.log('| Provider | Monthly Revenue | Monthly Costs | Monthly Profit | Annual Profit | Margin |');
console.log('|----------|----------------|---------------|----------------|---------------|--------|');

for (const provider of PROVIDERS) {
  const monthlyCosts = Math.round(payingUsers * blendedCosts[provider.name]);
  const monthlyProfit = monthlyRevenue - monthlyCosts;
  const annualProfit = monthlyProfit * 12;
  const margin = monthlyProfit / monthlyRevenue;

  console.log(`| **${provider.name}** | ${formatCurrency(monthlyRevenue)} | ${formatCurrency(monthlyCosts)} | **${formatCurrency(monthlyProfit)}** | **${formatCurrency(annualProfit)}** | **${formatPercent(margin)}** |`);
}
