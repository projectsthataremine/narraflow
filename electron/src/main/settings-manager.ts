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

export interface PillPreset {
  id: string;
  name: string;
  config: PillConfig;
  createdAt: number;
}

interface AppSettings {
  pillConfig: PillConfig;
  hotkey: HotkeyConfig;
  showInDock: boolean;
  enableLlamaFormatting: boolean;
  whisperKitModel?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  pillConfig: {
    numBars: 11,
    barWidth: 3,
    barGap: 2,
    maxHeight: 11,
    borderRadius: 40,
    glowIntensity: 0,
    color1: '#0090ff',
    color2: '#0090ff',
    useGradient: false,
    hasBackground: false,
    backgroundShape: 'pill',
    backgroundColor: '#18191b',
    backgroundPaddingX: 12,
    backgroundPaddingY: 12,
    borderWidth: 0,
    borderColor: '#0090ff',
  },
  hotkey: {
    modifiers: [],
    key: 'Fn',
    keycode: 63, // Fn key keycode
  },
  showInDock: true, // Default to visible
  enableLlamaFormatting: false, // Default to OFF to save costs
  whisperKitModel: 'small', // Default to small model for faster downloads
};

export class SettingsManager {
  private settingsPath: string;
  private historyPath: string;
  private presetsPath: string;
  private settings: AppSettings;
  private history: HistoryItem[] = [];
  private presets: PillPreset[] = [];

  constructor() {
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'settings.json');
    this.historyPath = path.join(userDataPath, 'history.json');
    this.presetsPath = path.join(userDataPath, 'presets.json');
    this.settings = this.loadSettings();
    this.history = this.loadHistory();
    this.presets = this.loadPresets();
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
      // console.log('[SettingsManager] Settings saved to:', this.settingsPath);
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
   * Get dock visibility setting
   */
  getShowInDock(): boolean {
    return this.settings.showInDock ?? true; // Default to true if not set
  }

  /**
   * Update dock visibility setting
   */
  setShowInDock(visible: boolean): void {
    this.settings.showInDock = visible;
    this.saveSettings();
  }

  /**
   * Get Llama formatting setting
   */
  getEnableLlamaFormatting(): boolean {
    return this.settings.enableLlamaFormatting ?? false; // Default to false to save costs
  }

  /**
   * Update Llama formatting setting
   */
  setEnableLlamaFormatting(enabled: boolean): void {
    this.settings.enableLlamaFormatting = enabled;
    this.saveSettings();
  }

  /**
   * Get WhisperKit model setting
   */
  getWhisperKitModel(): string {
    return this.settings.whisperKitModel ?? 'small'; // Default to small model
  }

  /**
   * Update WhisperKit model setting
   */
  setWhisperKitModel(model: string): void {
    this.settings.whisperKitModel = model;
    this.saveSettings();
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

    // Keep only last 25 items
    if (this.history.length > 25) {
      this.history = this.history.slice(0, 25);
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

  /**
   * Load presets from disk
   */
  private loadPresets(): PillPreset[] {
    try {
      if (fs.existsSync(this.presetsPath)) {
        const data = fs.readFileSync(this.presetsPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[SettingsManager] Error loading presets:', error);
    }
    return [];
  }

  /**
   * Save presets to disk
   */
  private savePresets(): void {
    try {
      const userDataPath = app.getPath('userData');
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      fs.writeFileSync(this.presetsPath, JSON.stringify(this.presets, null, 2), 'utf-8');
      console.log('[SettingsManager] Presets saved to:', this.presetsPath);
    } catch (error) {
      console.error('[SettingsManager] Error saving presets:', error);
    }
  }

  /**
   * Get all presets
   */
  getPresets(): PillPreset[] {
    return [...this.presets];
  }

  /**
   * Save a new preset (or overwrite existing preset with same name)
   */
  savePreset(name: string, config: PillConfig): PillPreset {
    // Check if preset with this name already exists
    const existingIndex = this.presets.findIndex(p => p.name === name);

    if (existingIndex !== -1) {
      // Overwrite existing preset, keep the same ID
      this.presets[existingIndex] = {
        ...this.presets[existingIndex],
        config: { ...config },
        createdAt: Date.now(), // Update timestamp
      };
      this.savePresets();
      console.log('[SettingsManager] Preset updated:', name);
      return this.presets[existingIndex];
    }

    // Create new preset
    const preset: PillPreset = {
      id: Date.now().toString(),
      name,
      config: { ...config },
      createdAt: Date.now(),
    };

    this.presets.push(preset);
    this.savePresets();
    console.log('[SettingsManager] Preset saved:', name);
    return preset;
  }

  /**
   * Delete a preset
   */
  deletePreset(id: string): boolean {
    const initialLength = this.presets.length;
    this.presets = this.presets.filter((preset) => preset.id !== id);

    if (this.presets.length !== initialLength) {
      this.savePresets();
      console.log('[SettingsManager] Preset deleted:', id);
      return true;
    }
    return false;
  }

  /**
   * Load a preset (apply it to current config)
   */
  loadPreset(id: string): PillConfig | null {
    const preset = this.presets.find((p) => p.id === id);
    if (preset) {
      this.setPillConfig(preset.config);
      console.log('[SettingsManager] Preset loaded:', preset.name);
      return { ...preset.config };
    }
    return null;
  }
}
