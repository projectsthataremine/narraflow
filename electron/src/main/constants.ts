// Supabase Configuration (New API Key System - 2025)
export const SUPABASE_URL = 'https://buqkvxtxjwyohzsogfbz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K';

// Marketing Site URL
// Note: Use default production URL for renderer process (process.env not available there)
export const MARKETING_SITE_URL = (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') ? 'http://localhost:3000' : 'https://trynarraflow.com';

// Pricing
export const MONTHLY_PRICE = 5; // Price in dollars
