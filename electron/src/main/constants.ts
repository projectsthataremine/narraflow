import * as fs from 'fs';
import * as path from 'path';

// Supabase Configuration (New API Key System - 2025)
export const SUPABASE_URL = 'https://buqkvxtxjwyohzsogfbz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K';

// Marketing Site URL
// Note: Use default production URL for renderer process (process.env not available there)
export const MARKETING_SITE_URL = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ? 'http://localhost:3000' : 'https://trynarraflow.com';

// Pricing
export const MONTHLY_PRICE = 5; // Price in dollars

/**
 * Get the current app environment (dev or prod)
 * Reads from process.env.APP_ENV (set in dev mode) or from bundled .env file (in production)
 */
export function getAppEnv(): 'dev' | 'prod' {
  // Try process.env first (for dev mode)
  if (process.env.APP_ENV === 'dev' || process.env.APP_ENV === 'prod') {
    return process.env.APP_ENV;
  }

  // Try reading from bundled .env file
  try {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/^APP_ENV=(dev|prod)/m);
      if (match) {
        return match[1] as 'dev' | 'prod';
      }
    }
  } catch (error) {
    console.error('[Constants] Failed to read APP_ENV from .env file:', error);
  }

  // Default to prod for safety
  return 'prod';
}
