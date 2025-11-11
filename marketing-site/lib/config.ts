import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AppConfig {
  monthly_price: number;
  annual_price: number;
  trial_days: number;
  app_name: string;
}

// Cache for config values
let configCache: AppConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getConfig(): Promise<AppConfig> {
  // Return cached config if still valid
  if (configCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return configCache;
  }

  try {
    const { data, error } = await supabase
      .from('config')
      .select('key, value')
      .in('key', ['monthly_price', 'annual_price', 'trial_days', 'app_name']);

    if (error) {
      console.error('Error fetching config:', error);
      return getDefaultConfig();
    }

    if (!data || data.length === 0) {
      return getDefaultConfig();
    }

    // Convert array to object
    const config: any = {};
    data.forEach((item) => {
      config[item.key] = item.value;
    });

    configCache = {
      monthly_price: typeof config.monthly_price === 'string' ? parseInt(config.monthly_price, 10) : 5,
      annual_price: typeof config.annual_price === 'string' ? parseInt(config.annual_price, 10) : 50,
      trial_days: typeof config.trial_days === 'string' ? parseInt(config.trial_days, 10) : 7,
      app_name: config.app_name || 'NarraFlow',
    };

    cacheTimestamp = Date.now();
    return configCache;
  } catch (error) {
    console.error('Error fetching config:', error);
    return getDefaultConfig();
  }
}

function getDefaultConfig(): AppConfig {
  return {
    monthly_price: 5,
    annual_price: 50,
    trial_days: 7,
    app_name: 'NarraFlow',
  };
}

export async function getMonthlyPrice(): Promise<number> {
  const config = await getConfig();
  return config.monthly_price;
}

export async function getAnnualPrice(): Promise<number> {
  const config = await getConfig();
  return config.annual_price;
}

export async function getTrialDays(): Promise<number> {
  const config = await getConfig();
  return config.trial_days;
}

// Helper to format price for display
export function formatPrice(price: number): string {
  return `$${price}`;
}
