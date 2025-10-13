/**
 * Preload script
 * Exposes safe IPC methods to renderer process
 */

import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Script starting...');

// IPC channel constants (inlined to avoid import issues in preload context)
const IPC_CHANNELS = {
  START_RECORDING: 'ipc:start-recording',
  STOP_RECORDING: 'ipc:stop-recording',
  AUDIO_DATA: 'ipc:audio-data',
  PASTE_TEXT: 'ipc:paste-text',
  VAD_UPDATE: 'ipc:vad-update',
  ERROR_NOTIFICATION: 'ipc:error-notification',
  UI_STATE_UPDATE: 'ipc:ui-state-update',
  PILL_CONFIG_UPDATE: 'ipc:pill-config-update',
  HOTKEY_CONFIG_UPDATE: 'HOTKEY_CONFIG_UPDATE',
  HISTORY_GET: 'ipc:history-get',
  HISTORY_ADD: 'ipc:history-add',
  HISTORY_DELETE: 'ipc:history-delete',
  HISTORY_CLEAR: 'ipc:history-clear',
  HISTORY_UPDATE: 'ipc:history-update',
  TRANSCRIBE: 'worker:transcribe',
  REWRITE_TEXT: 'worker:rewrite-text',
  SET_DOCK_VISIBILITY: 'ipc:set-dock-visibility',
  GET_DOCK_VISIBILITY: 'ipc:get-dock-visibility',
  RESET_APP: 'ipc:reset-app',
  // Auth & Subscription (matching auth-handler.ts)
  GET_AUTH_STATUS: 'GET_AUTH_STATUS',
  START_OAUTH: 'START_OAUTH',
  GET_LICENSES: 'GET_LICENSES',
  ACTIVATE_LICENSE: 'ACTIVATE_LICENSE',
  SIGN_OUT: 'SIGN_OUT',
  DELETE_ACCOUNT: 'DELETE_ACCOUNT',
  RENAME_MACHINE: 'RENAME_MACHINE',
  GET_MACHINE_ID: 'GET_MACHINE_ID',
  REVOKE_LICENSE: 'REVOKE_LICENSE',
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  OPEN_EXTERNAL_URL: 'OPEN_EXTERNAL_URL',
} as const;

// Expose electron API to renderer
contextBridge.exposeInMainWorld('electron', {
  // Send messages to main process
  send: (channel: string, data: any) => {
    const validChannels = Object.values(IPC_CHANNELS);
    if (validChannels.includes(channel as any)) {
      ipcRenderer.send(channel, data);
    }
  },

  // Receive messages from main process
  on: (channel: string, callback: (data: any) => void) => {
    const validChannels = Object.values(IPC_CHANNELS);
    if (validChannels.includes(channel as any)) {
      ipcRenderer.on(channel, (_event, data) => callback(data));
    }
  },

  // Invoke (request-response)
  invoke: async (channel: string, data: any) => {
    const validChannels = Object.values(IPC_CHANNELS);
    if (validChannels.includes(channel as any)) {
      return await ipcRenderer.invoke(channel, data);
    }
  },

  // Auto-updater methods
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update-available', (_event, info) => callback(info));
  },
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update-downloaded', (_event, info) => callback(info));
  },
  downloadUpdate: async () => {
    return await ipcRenderer.invoke('download-update');
  },
  installUpdate: async () => {
    return await ipcRenderer.invoke('install-update');
  },
});

console.log('[Preload] window.electron exposed successfully');
