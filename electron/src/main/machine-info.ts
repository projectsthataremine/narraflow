/**
 * Machine info detection for macOS
 * Detects machine model name, macOS version, and chip architecture
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface SystemCapabilities {
  isAppleSilicon: boolean;
  isIntel: boolean;
  macOSVersion: number;
  macOSVersionString: string;
  isTahoe: boolean;
  canUseSpeechAnalyzer: boolean;
  canUseWhisperKit: boolean;
}

/**
 * Get machine name (e.g., "MacBook Pro 2024")
 * Falls back to "My Mac" if detection fails
 */
export async function getMachineName(): Promise<string> {
  try {
    // Get Mac model name
    const { stdout: model } = await execAsync(
      "system_profiler SPHardwareDataType | grep 'Model Name' | awk -F': ' '{print $2}'"
    );

    const modelName = model.trim();

    if (!modelName) {
      return 'My Mac';
    }

    // Try to get year from model identifier
    try {
      const { stdout: identifier } = await execAsync(
        "system_profiler SPHardwareDataType | grep 'Model Identifier' | awk -F': ' '{print $2}'"
      );

      // Extract number from identifier (e.g., "MacBookPro18,3" → 18)
      const match = identifier.match(/(\d+),/);
      if (match) {
        const modelNum = parseInt(match[1]);
        // Rough estimate: Higher numbers = newer models
        // MacBookPro18,x ≈ 2021, MacBookPro19,x ≈ 2023, etc.
        const estimatedYear = 2003 + modelNum;
        return `${modelName} (${estimatedYear})`;
      }
    } catch (yearError) {
      console.log('Could not detect year, using model name only');
    }

    return modelName;
  } catch (error) {
    console.error('Failed to get machine name:', error);
    return 'My Mac';
  }
}

/**
 * Get macOS version (e.g., "macOS 15.0 Sequoia")
 */
export async function getMacOSVersion(): Promise<string> {
  try {
    const { stdout: version } = await execAsync('sw_vers -productVersion');
    const { stdout: buildVersion } = await execAsync('sw_vers -buildVersion');

    const versionNumber = version.trim();
    const majorVersion = versionNumber.split('.')[0];

    // Map major versions to names
    const versionNames: { [key: string]: string } = {
      '15': 'Sequoia',
      '14': 'Sonoma',
      '13': 'Ventura',
      '12': 'Monterey',
      '11': 'Big Sur',
      '10': 'Catalina or earlier',
    };

    const versionName = versionNames[majorVersion] || '';
    return `macOS ${versionNumber}${versionName ? ' ' + versionName : ''}`;
  } catch (error) {
    console.error('Failed to get macOS version:', error);
    return 'macOS';
  }
}

/**
 * Get both machine name and OS version
 */
export async function getMachineInfo(): Promise<{ name: string; os: string }> {
  const [name, os] = await Promise.all([getMachineName(), getMacOSVersion()]);

  return { name, os };
}

/**
 * Detect if running on Apple Silicon or Intel
 */
export function isAppleSilicon(): boolean {
  const cpuModel = os.cpus()[0]?.model || '';
  return cpuModel.includes('Apple');
}

/**
 * Get numeric macOS version (e.g., 26 for macOS Tahoe)
 */
export async function getMacOSVersionNumber(): Promise<number> {
  try {
    const { stdout } = await execAsync('sw_vers -productVersion');
    const versionString = stdout.trim();
    const majorVersion = parseInt(versionString.split('.')[0]);
    return majorVersion;
  } catch (error) {
    console.error('Failed to get macOS version number:', error);
    return 0;
  }
}

/**
 * Get system capabilities for transcription engine selection
 */
export async function getSystemCapabilities(): Promise<SystemCapabilities> {
  const appleSilicon = isAppleSilicon();
  const macOSVersionNumber = await getMacOSVersionNumber();
  const macOSVersionString = await getMacOSVersion();

  const isTahoe = macOSVersionNumber >= 26;
  const canUseSpeechAnalyzer = isTahoe && appleSilicon;
  const canUseWhisperKit = appleSilicon || true; // WhisperKit works on both, slower on Intel

  return {
    isAppleSilicon: appleSilicon,
    isIntel: !appleSilicon,
    macOSVersion: macOSVersionNumber,
    macOSVersionString,
    isTahoe,
    canUseSpeechAnalyzer,
    canUseWhisperKit,
  };
}
