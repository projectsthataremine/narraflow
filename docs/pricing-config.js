/**
 * Pricing Configuration - Single Source of Truth
 * Update these values and all calculations update automatically
 */

const PRICING_CONFIG = {
  // Groq API Pricing (verified from official docs: console.groq.com/docs)
  groq: {
    whisperTurbo: {
      name: 'Groq Whisper Large v3 Turbo',
      model: 'whisper-large-v3-turbo',
      pricePerHour: 0.04, // $0.04/hour of audio (official Groq pricing)
      speedMultiplier: 216, // times real-time
      rateLimits: {
        rpm: 400,
        rpd: null,
        audioSecondsPerHour: 400000,
      }
    },
    whisperLarge: {
      name: 'Groq Whisper Large v3',
      model: 'whisper-large-v3',
      pricePerHour: 0.111, // $0.111/hour of audio (official Groq pricing)
      speedMultiplier: 180,
      rateLimits: {
        rpm: 300,
        rpd: null,
        audioSecondsPerHour: 200000,
      }
    },
    llama: {
      name: 'Llama 3.1 8B Instant',
      model: 'llama-3.1-8b-instant',
      pricePerMInputTokens: 0.05,
      pricePerMOutputTokens: 0.08,
      rateLimits: {
        rpm: 30,
        rpd: 1000,
        tokensPerMinute: 6000,
      }
    }
  },

  // Application Settings
  app: {
    subscriptionPrice: 6, // monthly price in USD
    conversionRate: 0.19, // 19% free to paid conversion

    // User segment distribution
    userSegments: [
      { name: 'Light User', hoursPerMonth: 5, percentage: 40 },
      { name: 'Average User', hoursPerMonth: 10, percentage: 50 },
      { name: 'Heavy User', hoursPerMonth: 22, percentage: 10 },
    ],

    // Market targets
    market: {
      totalUsers: 12350, // 10% of Wispr Flow's 123,500
      wisprFlowUsers: 123500,
      targetPercentage: 10,
    }
  },

  // Competitor/Alternative Pricing (for comparison)
  competitors: {
    baseten: {
      t4: { name: 'Baseten T4', pricePerGpuHour: 0.6312, speedMultiplier: 60 },
      a10g: { name: 'Baseten A10G', pricePerGpuHour: 0.8484, speedMultiplier: 100 },
    },
    modal: {
      t4: { name: 'Modal T4', pricePerGpuHour: 0.59, speedMultiplier: 60 },
      a10g: { name: 'Modal A10G', pricePerGpuHour: 1.10, speedMultiplier: 100 },
    },
    runpod: {
      serverless: { name: 'RunPod Serverless', pricePerGpuHour: 0.90, speedMultiplier: 60 },
    },
    openai: {
      whisper: { name: 'OpenAI Whisper API', pricePerHour: 0.36, speedMultiplier: 10 },
    }
  }
};

// Export for use in Node.js and browsers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PRICING_CONFIG;
}
