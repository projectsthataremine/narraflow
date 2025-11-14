/**
 * Groq Llama API integration
 * Handles text cleanup and formatting using Groq's Llama 3.1 8B model
 * NOTE: Currently disabled - using edge functions instead
 */

// import Groq from 'groq-sdk';
import { CLEANUP_SYSTEM_PROMPT } from '../rewrite/prompts';

export interface GroqLlamaConfig {
  apiKey: string;
  model: 'llama-3.1-8b-instant' | 'llama-3.3-70b-versatile';
  maxTokens: number;
  temperature: number;
  maxRetries: number;
  retryDelayMs: number;
}

const defaultConfig: Partial<GroqLlamaConfig> = {
  model: 'llama-3.1-8b-instant',
  maxTokens: 500,
  temperature: 0.3,
  maxRetries: 3,
  retryDelayMs: 1000,
};

/**
 * Retry helper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Groq Llama] Attempt ${attempt}/${maxAttempts} failed:`, error);

      if (attempt < maxAttempts) {
        const delay = baseDelayMs * attempt; // Linear backoff
        console.log(`[Groq Llama] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

export class GroqLlamaFormatter {
  private config: GroqLlamaConfig;
  // private client: Groq; // Commented out - not using direct SDK anymore

  constructor(config: Partial<GroqLlamaConfig>) {
    if (!config.apiKey) {
      throw new Error('[Groq Llama] API key is required');
    }

    this.config = { ...defaultConfig, ...config } as GroqLlamaConfig;
    // this.client = new Groq({ apiKey: this.config.apiKey }); // Commented out - not using direct SDK anymore
  }

  /**
   * Format and clean up transcribed text using Llama
   */
  async format(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text;
    }

    const startTime = Date.now();

    try {
      console.log(`[Groq Llama] Starting text formatting (${text.length} chars)`);

      // TODO: Call Groq Llama API via edge function instead of direct SDK
      // For now, just return the original text
      const result = text;

      // OLD CODE (commented out - not using direct SDK anymore):
      // const result = await withRetry(
      //   async () => {
      //     const completion = await this.client.chat.completions.create({
      //       model: this.config.model,
      //       messages: [
      //         {
      //           role: 'system',
      //           content: CLEANUP_SYSTEM_PROMPT,
      //         },
      //         {
      //           role: 'user',
      //           content: text,
      //         },
      //       ],
      //       max_tokens: this.config.maxTokens,
      //       temperature: this.config.temperature,
      //     });
      //     return completion.choices[0]?.message?.content || '';
      //   },
      //   this.config.maxRetries,
      //   this.config.retryDelayMs
      // );

      const duration = Date.now() - startTime;
      console.log(`[Groq Llama] Formatting completed in ${duration}ms`);
      console.log(`[Groq Llama] Input: "${text}"`);
      console.log(`[Groq Llama] Output: "${result}"`);

      // Validate result
      const formatted = result.trim();
      if (this.validateResult(text, formatted)) {
        return formatted;
      } else {
        console.warn('[Groq Llama] Validation failed, returning original text');
        return text;
      }
    } catch (error) {
      console.error('[Groq Llama] Formatting failed after all retries:', error);
      // Return original text on error
      return text;
    }
  }

  /**
   * Validate that formatting didn't corrupt the text
   */
  private validateResult(original: string, formatted: string): boolean {
    // Check if result is not empty
    if (!formatted || formatted.trim().length === 0) {
      return false;
    }

    // Check that numbers are preserved
    const originalNumbers = original.match(/\d+/g) || [];
    const formattedNumbers = formatted.match(/\d+/g) || [];

    if (originalNumbers.length !== formattedNumbers.length) {
      console.warn('[Groq Llama] Number count mismatch');
      return false;
    }

    for (let i = 0; i < originalNumbers.length; i++) {
      if (originalNumbers[i] !== formattedNumbers[i]) {
        console.warn('[Groq Llama] Number value mismatch');
        return false;
      }
    }

    // Check that length hasn't changed drastically (formatting should be minor)
    const lengthRatio = formatted.length / original.length;
    if (lengthRatio < 0.5 || lengthRatio > 2.0) {
      console.warn('[Groq Llama] Length ratio out of bounds:', lengthRatio);
      return false;
    }

    return true;
  }

  /**
   * Check if the formatter is ready
   */
  isReady(): boolean {
    return !!this.config; // Changed from this.client since we're not using the SDK
  }
}

// Singleton instance
let instance: GroqLlamaFormatter | null = null;

export function getGroqLlamaInstance(apiKey?: string): GroqLlamaFormatter {
  if (!instance) {
    if (!apiKey) {
      throw new Error('[Groq Llama] API key required for initialization');
    }
    instance = new GroqLlamaFormatter({ apiKey });
  }
  return instance;
}
