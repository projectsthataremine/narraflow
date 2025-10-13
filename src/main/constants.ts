// Supabase Configuration (New API Key System - 2025)
export const SUPABASE_URL = 'https://buqkvxtxjwyohzsogfbz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K';

// Marketing Site URL
export const MARKETING_SITE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://narraflow.com';

// Edge Function Authentication
export const EDGE_FUNCTION_SECRET = process.env.EDGE_FUNCTION_SECRET || '3e78d77f2cdd92185f45378072835b1a1b32af0146610a47b23003cf917229d7';

// License Validation Keys - Ed25519 public keys (supports key rotation)
export const PUBLIC_LICENSE_KEYS = [
  {
    version: 1,
    key: "MCowBQYDK2VwAyEAIWD8tx4zF9WxVFYjvOg411nOuWKvzKcRjeric9wQico=",
    created_at: "2025-01-15"
  }
  // When rotating keys, add new key here and keep old one
  // { version: 2, key: "MCowBQYDK2VwAyEA...", created_at: "2026-01-15" }
];

// Helper to get the latest public key
export const getCurrentPublicKey = () => PUBLIC_LICENSE_KEYS[PUBLIC_LICENSE_KEYS.length - 1].key;

// Pricing
export const MONTHLY_PRICE = 5; // Price in dollars
