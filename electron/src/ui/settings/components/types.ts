/**
 * Shared types and interfaces for settings components
 */

import type { PillConfig, HistoryItem } from '../../../types/ipc-contracts';

export type { PillConfig, HistoryItem };

// Hotkey config type (matching settings-manager.ts)
export interface HotkeyConfig {
  modifiers: string[];
  key: string;
  keycode: number;
}

// Account Management Types
export interface UserAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePicUrl?: string;
  provider: 'google' | 'github' | 'email';
  createdAt?: string;
}

export interface License {
  id: string;
  key: string;
  status: 'pending' | 'active' | 'canceled';
  metadata?: {
    machine_id?: string;
    machine_name?: string;
    machine_os?: string;
    activated_at?: string;
    [key: string]: any;
  };
  machine_id?: string;
  machine_name?: string;
  expires_at: string | null;
  renews_at: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}

export type SubscriptionStatus =
  | { type: 'none' } // Not logged in
  | { type: 'trial', startDate: number, daysRemaining: number } // 7-day trial
  | { type: 'trial_expired', expiredDate: number } // Trial ended
  | { type: 'active', startDate: number, nextBillingDate: number, plan: string }; // Active subscription

// Toast state type
export type ToastState = {
  visible: boolean;
  message: string;
};

// Electron IPC renderer (will be available via preload)
declare global {
  interface Window {
    electron?: {
      on: (channel: string, callback: (data: any) => void) => void;
      send: (channel: string, data: any) => void;
    };
  }
}

// Available hotkey options
export const HOTKEY_OPTIONS = [
  { label: 'Fn (Globe)', key: 'Fn', keycode: 63, modifiers: [] },
  { label: 'Shift + Option', key: 'Shift', keycode: 42, modifiers: ['Shift', 'Alt'] },
  { label: 'Shift + Control', key: 'Shift', keycode: 42, modifiers: ['Shift', 'Ctrl'] },
  { label: 'Control + Option', key: 'Ctrl', keycode: 29, modifiers: ['Ctrl', 'Alt'] },
];
