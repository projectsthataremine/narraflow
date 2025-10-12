import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

/**
 * Generates a unique UUID license key
 * Includes paranoid uniqueness check (UUID collisions are astronomically unlikely)
 */
export async function generateLicenseKey(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const key = randomUUID();  // e.g., "550e8400-e29b-41d4-a716-446655440000"

    // Paranoid check: ensure UUID doesn't already exist
    const { data } = await supabase
      .from('licenses')
      .select('key')
      .eq('key', key)
      .maybeSingle();

    if (!data) {
      return key;  // Unique!
    }

    console.warn(`UUID collision detected (attempt ${attempts + 1}): ${key}`);
    attempts++;
  }

  throw new Error('Failed to generate unique license key after 3 attempts');
}
