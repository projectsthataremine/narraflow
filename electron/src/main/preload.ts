/**
 * Preload script
 * Exposes safe IPC methods to renderer process
 *
 * Following Clipp's pattern - explicit method exposure without whitelist validation
 */

import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Script starting...');

// Expose electron API to renderer
contextBridge.exposeInMainWorld('electron', {
  // Recording methods
  send: (channel: string, data: any) => ipcRenderer.send(channel, data),
  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_event, data) => callback(data));
  },
  invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),

  // Auth methods
  getAuthStatus: () => ipcRenderer.invoke('GET_AUTH_STATUS'),
  startOAuth: (provider: string) => ipcRenderer.invoke('START_OAUTH', { provider }),
  signUpWithEmail: (email: string, password: string) => ipcRenderer.invoke('SIGN_UP_EMAIL', { email, password }),
  signInWithEmail: (email: string, password: string) => ipcRenderer.invoke('SIGN_IN_EMAIL', { email, password }),
  signOut: () => ipcRenderer.invoke('SIGN_OUT'),
  deleteAccount: () => ipcRenderer.invoke('DELETE_ACCOUNT'),
  onAuthStateChanged: (callback: () => void) => {
    ipcRenderer.on('AUTH_STATE_CHANGED', callback);
  },

  // License methods
  getLicenses: (userId: string) => ipcRenderer.invoke('GET_LICENSES', { userId }),
  activateLicense: (licenseKey: string) => ipcRenderer.invoke('ACTIVATE_LICENSE', { licenseKey }),
  revokeLicense: (licenseKey: string) => ipcRenderer.invoke('REVOKE_LICENSE', { licenseKey }),
  renameMachine: (licenseId: string, newName: string) => ipcRenderer.invoke('RENAME_MACHINE', { licenseId, newName }),
  getMachineId: () => ipcRenderer.invoke('GET_MACHINE_ID'),

  // Preset methods
  savePreset: (name: string, config: any) => ipcRenderer.invoke('PRESET_SAVE', { name, config }),
  loadPreset: (id: string) => ipcRenderer.invoke('PRESET_LOAD', { id }),
  deletePreset: (id: string) => ipcRenderer.invoke('PRESET_DELETE', { id }),
  getAllPresets: () => ipcRenderer.invoke('PRESET_GET_ALL'),

  // Stripe/Checkout methods
  createCheckoutSession: (billingInterval?: string) => ipcRenderer.invoke('ipc:subscription-create-checkout', { billingInterval }),
  openCustomerPortal: (stripeCustomerId: string) => ipcRenderer.invoke('OPEN_CUSTOMER_PORTAL', { stripeCustomerId }),

  // Access control
  getAccessStatus: () => ipcRenderer.invoke('GET_ACCESS_STATUS'),
  onAccessStatusChanged: (callback: (data: any) => void) => {
    ipcRenderer.on('ACCESS_STATUS_CHANGED', (_event, data) => callback(data));
  },

  // External URL
  openExternalUrl: (url: string) => ipcRenderer.invoke('OPEN_EXTERNAL_URL', { url }),

  // Auto-updater methods
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
  },
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
});

console.log('[Preload] window.electron exposed successfully');
