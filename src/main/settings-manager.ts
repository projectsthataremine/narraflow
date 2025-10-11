/**
 * Settings Manager - Persistent storage for app settings
 * Stores pill configuration and other settings in userData directory
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { PillConfig, HistoryItem } from '../types/ipc-contracts';
import { UiohookKey } from 'uiohook-napi';

export interface HotkeyConfig {
  modifiers: string[]; // e.g., ['Meta', 'Shift']
  key: string; // e.g., 'B', 'CapsLock'
  keycode: number; // UiohookKey enum value
}

interface AppSettings {
  pillConfig: PillConfig;
  hotkey: HotkeyConfig;
}

const DEFAULT_SETTINGS: AppSettings = {
  pillConfig: {
    numBars: 10,
    barWidth: 4,
    barGap: 6,
    maxHeight: 40,
    borderRadius: 2,
    glowIntensity: 2,
    color1: '#3b82f6',
    color2: '#8b5cf6',
    useGradient: true,
  },
  hotkey: {
    modifiers: [],
    key: 'Fn',
    keycode: 63, // Fn key keycode
  },
};

export class SettingsManager {
  private settingsPath: string;
  private historyPath: string;
  private settings: AppSettings;
  private history: HistoryItem[] = [];

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.historyPath = path.join(userDataPath, 'history.json');
    this.settings = this.loadSettings();
    this.history = this.loadHistory();
  }

  /**
   * Load settings from disk, or return defaults if file doesn't exist
   */
  private loadSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf-8');
        const loaded = JSON.parse(data);
        // Merge with defaults to handle missing fields
        return {
          ...DEFAULT_SETTINGS,
          ...loaded,
          pillConfig: {
            ...DEFAULT_SETTINGS.pillConfig,
            ...loaded.pillConfig,
          },
          hotkey: {
            ...DEFAULT_SETTINGS.hotkey,
            ...loaded.hotkey,
          },
        };
      }
    } catch (error) {
      console.error('[SettingsManager] Error loading settings:', error);
    }

    // Return defaults if loading failed or file doesn't exist
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings to disk
   */
  private saveSettings(): void {
    try {
      const userDataPath = app.getPath('userData');
      // Ensure directory exists
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }

      fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf-8');
      console.log('[SettingsManager] Settings saved to:', this.settingsPath);
    } catch (error) {
      console.error('[SettingsManager] Error saving settings:', error);
    }
  }

  /**
   * Get pill configuration
   */
  getPillConfig(): PillConfig {
    return { ...this.settings.pillConfig };
  }

  /**
   * Update pill configuration
   */
  setPillConfig(config: PillConfig): void {
    this.settings.pillConfig = { ...config };
    this.saveSettings();
  }

  /**
   * Get hotkey configuration
   */
  getHotkeyConfig(): HotkeyConfig {
    return { ...this.settings.hotkey };
  }

  /**
   * Update hotkey configuration
   */
  setHotkeyConfig(config: HotkeyConfig): void {
    this.settings.hotkey = { ...config };
    this.saveSettings();
  }

  /**
   * Get all settings
   */
  getAllSettings(): AppSettings {
    return { ...this.settings };
  }

  /**
   * Load history from disk
   */
  private loadHistory(): HistoryItem[] {
    try {
      if (fs.existsSync(this.historyPath)) {
        const data = fs.readFileSync(this.historyPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[SettingsManager] Error loading history:', error);
    }
    return [];
  }

  /**
   * Save history to disk
   */
  private saveHistory(): void {
    try {
      const userDataPath = app.getPath('userData');
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      fs.writeFileSync(this.historyPath, JSON.stringify(this.history, null, 2), 'utf-8');
      console.log('[SettingsManager] History saved to:', this.historyPath);
    } catch (error) {
      console.error('[SettingsManager] Error saving history:', error);
    }
  }

  /**
   * Get history (last 10 items)
   */
  getHistory(): HistoryItem[] {
    return [...this.history];
  }

  /**
   * Add item to history (keep only last 10)
   */
  addHistoryItem(text: string): HistoryItem {
    const item: HistoryItem = {
      id: Date.now().toString(),
      text,
      timestamp: Date.now(),
    };

    // Add to beginning of array
    this.history.unshift(item);

    // Keep only last 10 items
    if (this.history.length > 10) {
      this.history = this.history.slice(0, 10);
    }

    this.saveHistory();
    return item;
  }

  /**
   * Delete specific history item
   */
  deleteHistoryItem(id: string): boolean {
    const initialLength = this.history.length;
    this.history = this.history.filter((item) => item.id !== id);

    if (this.history.length !== initialLength) {
      this.saveHistory();
      return true;
    }
    return false;
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  /**
   * Reset all settings to defaults
   */
  resetToDefaults(): void {
    console.log('[SettingsManager] Resetting all settings to defaults');
    this.settings = { ...DEFAULT_SETTINGS };
    this.history = [];
    this.saveSettings();
    this.saveHistory();
    console.log('[SettingsManager] Reset complete');
  }
}
