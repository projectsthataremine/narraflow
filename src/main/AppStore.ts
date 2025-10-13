import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';
import { machineIdSync } from 'node-machine-id';
import { subtle } from 'crypto';
import { getCurrentPublicKey, EDGE_FUNCTION_SECRET, SUPABASE_URL } from './constants';

interface LicenseData {
  license_key: string;
  machine_id: string;
  machine_name?: string;
  machine_os?: string;
  expires_at: string;
  status: string;
  signature: string;
  user_id?: string;
  user_email?: string;
}

class AppStore {
  private isLicenseValid = false;
  private validationInterval: NodeJS.Timeout | null = null;
  private win: Electron.BrowserWindow | null = null;

  constructor() {
    // Don't validate on construction (wait for window to be set)
  }

  setWindow(win: Electron.BrowserWindow) {
    this.win = win;
  }

  getLicenseValid(): boolean {
    return this.isLicenseValid;
  }

  private updateLicenseStatus(isValid: boolean) {
    this.isLicenseValid = isValid;
    if (this.win) {
      this.win.webContents.send('license-check-complete', { valid: isValid });
    }
  }

  /**
   * Validates license (REQUIRES INTERNET)
   * Unlike WisprFlow, we enforce online validation
   */
  async validateLicense(): Promise<void> {
    try {
      const licensePath = path.join(app.getPath('userData'), 'license.json');
      let data: LicenseData;

      // Check if license file exists
      try {
        data = JSON.parse(fs.readFileSync(licensePath, 'utf-8'));
      } catch (readError: any) {
        if (readError.code === 'ENOENT') {
          console.log('No license file found');
          this.updateLicenseStatus(false);
          return;
        }
        throw readError;
      }

      const { license_key, machine_id, expires_at, status, signature } = data;

      if (!license_key || !machine_id || !expires_at || !signature) {
        console.error('Missing required fields in license data');
        this.updateLicenseStatus(false);
        return;
      }

      // 1. Local validation: Machine ID
      const currentMachineId = machineIdSync();
      if (currentMachineId !== machine_id) {
        console.error('Machine ID mismatch');
        this.updateLicenseStatus(false);
        return;
      }

      // 2. Local validation: Expiration
      const now = new Date();
      const expiresAt = new Date(expires_at);
      if (now >= expiresAt) {
        console.error('License has expired');
        this.updateLicenseStatus(false);
        return;
      }

      // 3. Local validation: Signature
      const payload = { license_key, machine_id, expires_at, status };
      const signatureValid = await this.verifySignature(payload, signature);
      if (!signatureValid) {
        console.error('Signature verification failed');
        this.updateLicenseStatus(false);
        return;
      }

      // 4. ✅ REQUIRED: Remote validation (online check)
      // This is where we differ from typical offline-capable systems
      // Like WisprFlow, we require internet connection
      const { valid, error } = await this.pingValidateLicense({
        license_key,
        machine_id,
      });

      if (!valid) {
        console.error('Remote validation failed:', error);

        // If revoked, delete license file
        if (error?.includes('revoked')) {
          console.log('License revoked, deleting license file');
          fs.unlinkSync(licensePath);
        }

        this.updateLicenseStatus(false);
        return;
      }

      console.log('✅ License is valid');
      this.updateLicenseStatus(true);
      this.startValidationTimer();

    } catch (error) {
      console.error('License validation failed:', error);
      this.updateLicenseStatus(false);
    }
  }

  private startValidationTimer() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }

    // Re-validate every app launch (could also be periodic like every hour)
    // For now, validation happens on each app start
  }

  private async verifySignature(payload: any, signatureBase64: string): Promise<boolean> {
    try {
      const publicKey = getCurrentPublicKey();
      if (!publicKey) throw new Error('Public key is missing');

      const publicKeyBytes = Uint8Array.from(Buffer.from(publicKey, 'base64'));

      const cryptoKey = await subtle.importKey(
        'spki',
        publicKeyBytes.buffer,
        { name: 'Ed25519' },
        false,
        ['verify']
      );

      const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
      const signatureBytes = Uint8Array.from(Buffer.from(signatureBase64, 'base64'));

      return await subtle.verify(
        'Ed25519',
        cryptoKey,
        signatureBytes,
        encodedPayload
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  async addLicenseKey(license_key: string): Promise<void> {
    const { valid, payload, signature, error } = await this.pingValidateLicense({
      license_key,
      machine_id: machineIdSync(),
      return_signed_license: true,
    });

    if (!valid) {
      throw new Error(error || 'Invalid license key');
    }

    if (!payload || !signature) {
      throw new Error('Missing license payload or signature from server');
    }

    const licensePath = path.join(app.getPath('userData'), 'license.json');
    const licenseData = {
      ...payload,
      signature,
    };

    fs.writeFileSync(
      licensePath,
      JSON.stringify(licenseData, null, 2),
      'utf-8'
    );

    await this.validateLicense();
  }

  /**
   * Activate license for authenticated user (OAuth flow)
   * Includes machine info (name and OS)
   */
  async activateLicenseForUser(
    license_key: string,
    machine_name: string,
    machine_os: string,
    user_id?: string,
    user_email?: string
  ): Promise<void> {
    const machine_id = machineIdSync();

    const { valid, payload, signature, error } = await this.pingValidateLicense({
      license_key,
      machine_id,
      return_signed_license: true,
    });

    if (!valid) {
      throw new Error(error || 'Invalid license key');
    }

    if (!payload || !signature) {
      throw new Error('Missing license payload or signature from server');
    }

    const licensePath = path.join(app.getPath('userData'), 'license.json');
    const licenseData: LicenseData = {
      ...payload,
      signature,
      machine_name,
      machine_os,
      user_id,
      user_email,
    };

    fs.writeFileSync(
      licensePath,
      JSON.stringify(licenseData, null, 2),
      'utf-8'
    );

    console.log('[AppStore] License activated with machine info:', {
      machine_name,
      machine_os,
      user_email,
    });

    await this.validateLicense();
  }

  private async pingValidateLicense({
    license_key,
    machine_id,
    return_signed_license = false,
  }: {
    license_key: string;
    machine_id: string;
    return_signed_license?: boolean;
  }): Promise<any> {
    if (!license_key || !machine_id) {
      console.error('❌ Missing required fields for license validation');
      return { valid: false, error: 'Missing required fields' };
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/validate_license`,
        {
          method: 'POST',
          headers: {
            'Authorization': EDGE_FUNCTION_SECRET,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: license_key,
            machine_id,
            return_signed_license,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as any;
        return {
          valid: false,
          error: errorData.error || `HTTP ${response.status}`,
        };
      }

      return await response.json();
    } catch (err: any) {
      // ✅ Unlike other implementations, we DON'T fallback to local validation
      // Internet is REQUIRED (like WisprFlow)
      console.error('Network validation failed (internet required):', err);
      return {
        valid: false,
        error: 'Internet connection required. Please check your connection and try again.',
      };
    }
  }
}

export const appStore = new AppStore();
