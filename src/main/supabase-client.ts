/**
 * Supabase client for Electron main process
 * Used for authentication and license management
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://buqkvxtxjwyohzsogfbz.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K';

// Custom storage for Electron (file-based)
class ElectronStorage {
  private sessionPath: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.sessionPath = path.join(userDataPath, 'supabase-session.json');
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (fs.existsSync(this.sessionPath)) {
        const data = fs.readFileSync(this.sessionPath, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed[key] || null;
      }
    } catch (error) {
      console.error('[Supabase] Error reading session:', error);
    }
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      let data: Record<string, string> = {};

      if (fs.existsSync(this.sessionPath)) {
        const existing = fs.readFileSync(this.sessionPath, 'utf-8');
        data = JSON.parse(existing);
      }

      data[key] = value;
      fs.writeFileSync(this.sessionPath, JSON.stringify(data, null, 2), 'utf-8');
      console.log('[Supabase] Session saved to disk');
    } catch (error) {
      console.error('[Supabase] Error saving session:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (fs.existsSync(this.sessionPath)) {
        const data = fs.readFileSync(this.sessionPath, 'utf-8');
        const parsed = JSON.parse(data);
        delete parsed[key];
        fs.writeFileSync(this.sessionPath, JSON.stringify(parsed, null, 2), 'utf-8');
        console.log('[Supabase] Session removed from disk');
      }
    } catch (error) {
      console.error('[Supabase] Error removing session:', error);
    }
  }
}

const storage = new ElectronStorage();

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: storage as any,
      detectSessionInUrl: false,
    }
  });
};

export const supabase = createClient();
