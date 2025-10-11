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
  // Auth & Subscription
  AUTH_SIGNIN_GOOGLE: 'ipc:auth-signin-google',
  AUTH_SIGNOUT: 'ipc:auth-signout',
  AUTH_DELETE_ACCOUNT: 'ipc:auth-delete-account',
  AUTH_GET_USER: 'ipc:auth-get-user',
  SUBSCRIPTION_GET_STATUS: 'ipc:subscription-get-status',
  SUBSCRIPTION_CREATE_CHECKOUT: 'ipc:subscription-create-checkout',
  SUBSCRIPTION_OPEN_PORTAL: 'ipc:subscription-open-portal',
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
});

console.log('[Preload] window.electron exposed successfully');
