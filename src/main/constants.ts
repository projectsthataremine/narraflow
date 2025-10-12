// Supabase Configuration (New API Key System - 2025)
export const SUPABASE_URL = 'https://buqkvxtxjwyohzsogfbz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K';

// Edge Function Authentication
// TODO: Generate a secure random secret for production and store in environment
export const EDGE_FUNCTION_SECRET = process.env.EDGE_FUNCTION_SECRET || 'PLACEHOLDER_REPLACE_WITH_ACTUAL_SECRET';

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
