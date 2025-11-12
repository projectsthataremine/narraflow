/**
 * Access Manager
 * Handles trial and license validation to determine if user can use the app
 */

import { supabase } from './supabase-client';
import { machineIdSync } from 'node-machine-id';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

const TRIAL_DURATION_DAYS = 7;

interface AccessStatus {
  hasValidAccess: boolean;
  trialExpired: boolean;
  trialDaysRemaining?: number;
  hasActiveLicense: boolean;
  reason?: string;
}

interface TrialData {
  firstUsedAt: string; // ISO timestamp
}

export class AccessManager {
  private trialDataPath: string;
  private machineId: string;
  private currentUserId: string | null = null;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.trialDataPath = path.join(userDataPath, 'trial-data.json');
    this.machineId = machineIdSync();
  }

  /**
   * Set the current authenticated user ID
   */
  setUserId(userId: string | null) {
    this.currentUserId = userId;
  }

  /**
   * Get the trial data from disk
   */
  private getTrialData(): TrialData | null {
    try {
      if (fs.existsSync(this.trialDataPath)) {
        const data = fs.readFileSync(this.trialDataPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[AccessManager] Error reading trial data:', error);
    }
    return null;
  }

  /**
   * Initialize trial tracking (call on first use)
   */
  private initializeTrial(): TrialData {
    const trialData: TrialData = {
      firstUsedAt: new Date().toISOString(),
    };

    try {
      fs.writeFileSync(this.trialDataPath, JSON.stringify(trialData, null, 2), 'utf-8');
      console.log('[AccessManager] Trial initialized:', trialData);
    } catch (error) {
      console.error('[AccessManager] Error writing trial data:', error);
    }

    return trialData;
  }

  /**
   * Check if trial has expired
   */
  private checkTrialStatus(): { expired: boolean; daysRemaining: number } {
    let trialData = this.getTrialData();

    // First time using app - initialize trial
    if (!trialData) {
      trialData = this.initializeTrial();
    }

    const firstUsed = new Date(trialData.firstUsedAt);
    const now = new Date();
    const daysSinceFirstUse = (now.getTime() - firstUsed.getTime()) / (1000 * 60 * 60 * 24);
    const daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysSinceFirstUse);

    return {
      expired: daysSinceFirstUse >= TRIAL_DURATION_DAYS,
      daysRemaining: Math.ceil(daysRemaining),
    };
  }

  /**
   * Check if user has a valid license on this machine
   */
  private async checkLicenseStatus(): Promise<boolean> {
    if (!this.currentUserId) {
      console.log('[AccessManager] No user ID set, cannot check license');
      return false;
    }

    try {
      // Query licenses table for active licenses for this user
      const { data: licenses, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', this.currentUserId)
        .in('status', ['active', 'canceled']) // Canceled still works until expires_at
        .is('expires_at', null) // Active subscriptions have no expires_at
        .or(`expires_at.gt.${new Date().toISOString()}`); // Or not yet expired

      if (error) {
        console.error('[AccessManager] Error checking licenses:', error);
        return false;
      }

      if (!licenses || licenses.length === 0) {
        console.log('[AccessManager] No active licenses found for user');
        return false;
      }

      // Check if any license is assigned to this machine
      for (const license of licenses) {
        const metadata = license.metadata || {};
        if (metadata.machine_id === this.machineId) {
          console.log('[AccessManager] Found valid license on this machine:', license.key);
          return true;
        }
      }

      console.log('[AccessManager] User has licenses but none on this machine');
      return false;
    } catch (error) {
      console.error('[AccessManager] Error checking license:', error);
      return false;
    }
  }

  /**
   * Get the current access status for the user
   * Returns whether they can use the app (trial or license)
   */
  async getAccessStatus(): Promise<AccessStatus> {
    const trial = this.checkTrialStatus();
    const hasLicense = await this.checkLicenseStatus();

    // User has access if:
    // 1. Trial is not expired, OR
    // 2. They have a valid license on this machine
    const hasValidAccess = !trial.expired || hasLicense;

    const status: AccessStatus = {
      hasValidAccess,
      trialExpired: trial.expired,
      trialDaysRemaining: trial.daysRemaining,
      hasActiveLicense: hasLicense,
    };

    // Add helpful reason for debugging
    if (!hasValidAccess) {
      status.reason = 'Trial expired and no valid license on this machine';
    } else if (hasLicense) {
      status.reason = 'Valid license on this machine';
    } else {
      status.reason = `Trial active (${trial.daysRemaining} days remaining)`;
    }

    console.log('[AccessManager] Access status:', status);
    return status;
  }

  /**
   * Get machine ID for this device
   */
  getMachineId(): string {
    return this.machineId;
  }
}

// Singleton instance
let accessManager: AccessManager | null = null;

export function getAccessManager(): AccessManager {
  if (!accessManager) {
    accessManager = new AccessManager();
  }
  return accessManager;
}
