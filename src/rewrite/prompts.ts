/**
 * Cleanup prompts and fallback logic
 * Defines prompts for LLaMA and fallback strategies
 */

/**
 * System prompt for text cleanup
 * Used when real LLaMA model is available
 */
export const CLEANUP_SYSTEM_PROMPT = `You are step 3 in an audio transcription pipeline:
1. Audio is captured from microphone
2. Audio is transcribed to text
3. YOU clean up the transcribed text (this step)
4. Cleaned text is pasted into user's application

Your ONLY job: Fix grammar, punctuation, and capitalization. Format lists when appropriate.
If the text doesn't need fixing, output it unchanged.

CRITICAL RULES:
- Output ONLY the corrected text itself
- NO explanations, suggestions, or commentary
- NO prefixes like "Here is" or "Corrected text:"
- DO NOT change meaning or add information
- DO NOT add content that wasn't in the input`;

/**
 * Generate cleanup prompt for user text
 * Simply returns the raw text since CLEANUP_SYSTEM_PROMPT already has all instructions
 */
export function generateCleanupPrompt(rawText: string): string {
  return rawText;
}

/**
 * Validate cleanup result
 * Ensures the cleanup didn't change meaning or numbers
 */
export function validateCleanupResult(original: string, cleaned: string): boolean {
  // Basic validation: check that numbers are preserved
  const originalNumbers = original.match(/\d+/g) || [];
  const cleanedNumbers = cleaned.match(/\d+/g) || [];

  if (originalNumbers.length !== cleanedNumbers.length) {
    return false;
  }

  for (let i = 0; i < originalNumbers.length; i++) {
    if (originalNumbers[i] !== cleanedNumbers[i]) {
      return false;
    }
  }

  // Check that cleaned text isn't drastically different in length
  // Allow reasonable formatting changes but catch major hallucinations
  const lengthRatio = cleaned.length / original.length;
  if (lengthRatio < 0.5 || lengthRatio > 2.0) {
    return false;
  }

  return true;
}

/**
 * Fallback cleanup using simple rules
 * Used when LLaMA is unavailable or times out
 */
export function fallbackCleanup(text: string): string {
  let cleaned = text.trim();

  // Basic capitalization
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  // Add period if missing
  if (!/[.!?]$/.test(cleaned)) {
    cleaned += '.';
  }

  // Fix spacing
  cleaned = cleaned.replace(/\s+([,.!?])/g, '$1');
  cleaned = cleaned.replace(/([.!?])([A-Z])/g, '$1 $2');

  // Capitalize after sentence endings
  cleaned = cleaned.replace(/([.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  // Fix common transcription issues
  cleaned = cleaned.replace(/\bi\b/g, 'I'); // Capitalize "I"
  cleaned = cleaned.replace(/^i /i, 'I '); // Capitalize "I" at start

  return cleaned;
}
