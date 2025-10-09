/**
 * Settings Manager - Persistent storage for app settings
 * Stores pill configuration and other settings in userData directory
 */

import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import type { PillConfig } from '../types/ipc-contracts';

interface AppSettings {
  pillConfig: PillConfig;
}

const DEFAULT_SETTINGS: AppSettings = {
  pillConfig: {
    numBars: 10,
    barWidth: 4,
    barGap: 6,
    maxHeight: 60,
    borderRadius: 12,
    glowIntensity: 0.6,
    color1: '#3b82f6',
    color2: '#8b5cf6',
    useGradient: true,
  },
};

export class SettingsManager {
  private settingsPath: string;
  private settings: AppSettings;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.settings = this.loadSettings();
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
   * Get all settings
   */
  getAllSettings(): AppSettings {
    return { ...this.settings };
  }
}
