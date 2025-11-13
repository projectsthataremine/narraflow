/**
 * Authentication handler for Electron main process
 * Handles Google OAuth flow and license management
 */

import { BrowserWindow, ipcMain, shell } from 'electron';
import { supabase } from './supabase-client';
import { getMachineInfo } from './machine-info';
import { machineIdSync } from 'node-machine-id';
import { SUPABASE_URL } from './constants';
import { getAccessManager } from './access-manager';
import { broadcastAccessStatusChanged } from './ipc-handlers';

// Store auth session in memory
let currentSession: any = null;
let settingsWindowRef: BrowserWindow | null = null;

/**
 * Initialize auth IPC handlers
 */
export function initAuthHandlers(settingsWindow?: BrowserWindow | null) {
  console.log('[Auth] ========== INITIALIZING AUTH HANDLERS ==========');
  settingsWindowRef = settingsWindow || null;
  // Get current auth status
  console.log('[Auth] Registering GET_AUTH_STATUS handler');
  ipcMain.handle('GET_AUTH_STATUS', async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[Auth] Failed to get session:', error);
        // Clear user ID from access manager
        getAccessManager().setUserId(null);
        return { user: null };
      }

      currentSession = session;

      // Update access manager with current user ID
      if (session?.user) {
        getAccessManager().setUserId(session.user.id);
      } else {
        getAccessManager().setUserId(null);
      }

      return { user: session?.user || null };
    } catch (error) {
      console.error('[Auth] GET_AUTH_STATUS error:', error);
      getAccessManager().setUserId(null);
      return { user: null };
    }
  });

  // Sign up with email and password
  console.log('[Auth] Registering SIGN_UP_EMAIL handler');
  ipcMain.handle('SIGN_UP_EMAIL', async (event, { email, password }) => {
    try {
      console.log('[Auth] Signing up with email:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Failed to sign up:', error);
        throw error;
      }

      currentSession = data.session;
      console.log('[Auth] Sign up successful, user:', data.user?.email);

      // Update access manager with current user ID
      if (data.user) {
        getAccessManager().setUserId(data.user.id);

        // Check if user has a trial - if not, create one
        await ensureUserHasTrial(data.user.id);
      }

      // Notify settings window to refresh auth state
      if (settingsWindowRef && !settingsWindowRef.isDestroyed()) {
        console.log('[Auth] Notifying settings window of auth success');
        settingsWindowRef.webContents.send('AUTH_STATE_CHANGED');
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('[Auth] SIGN_UP_EMAIL error:', error);
      throw error;
    }
  });

  // Sign in with email and password
  console.log('[Auth] Registering SIGN_IN_EMAIL handler');
  ipcMain.handle('SIGN_IN_EMAIL', async (event, { email, password }) => {
    try {
      console.log('[Auth] Signing in with email:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[Auth] Failed to sign in:', error);
        throw error;
      }

      currentSession = data.session;
      console.log('[Auth] Sign in successful, user:', data.user?.email);

      // Update access manager with current user ID
      if (data.user) {
        getAccessManager().setUserId(data.user.id);
      }

      // Notify settings window to refresh auth state
      if (settingsWindowRef && !settingsWindowRef.isDestroyed()) {
        console.log('[Auth] Notifying settings window of auth success');
        settingsWindowRef.webContents.send('AUTH_STATE_CHANGED');
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('[Auth] SIGN_IN_EMAIL error:', error);
      throw error;
    }
  });

  // Start OAuth flow - using system browser with marketing site redirect
  ipcMain.handle('START_OAUTH', async (event, { provider }) => {
    try {
      console.log('[Auth] Starting OAuth flow for provider:', provider);

      // Determine redirect URL based on environment
      const isDev = process.env.APP_ENV === 'dev';
      const redirectUrl = isDev
        ? 'http://localhost:3000/auth-success'
        : 'https://trynarraflow.com/auth-success';

      console.log('[Auth] Using redirect URL:', redirectUrl);

      // Get OAuth URL from Supabase with marketing site redirect
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        console.error('[Auth] Failed to get OAuth URL:', error);
        throw error;
      }

      if (!data.url) {
        throw new Error('No OAuth URL returned');
      }

      // Open the URL in the system's default browser
      console.log('[Auth] Opening browser for OAuth...');
      await shell.openExternal(data.url);

      // Poll for session in the background
      return new Promise((resolve, reject) => {
        let pollCount = 0;
        const maxPolls = 100; // 5 minutes (100 * 3 seconds)

        const pollInterval = setInterval(async () => {
          pollCount++;

          try {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (session?.user) {
              clearInterval(pollInterval);
              currentSession = session;
              console.log('[Auth] OAuth successful, user:', session.user.email);

              // Update access manager with current user ID
              getAccessManager().setUserId(session.user.id);

              // Check if user has a trial - if not, create one
              await ensureUserHasTrial(session.user.id);

              // Notify settings window to refresh auth state
              if (settingsWindowRef && !settingsWindowRef.isDestroyed()) {
                console.log('[Auth] Notifying settings window of auth success');
                settingsWindowRef.webContents.send('AUTH_STATE_CHANGED');
              }

              resolve({ success: true, user: session.user });
            } else if (pollCount >= maxPolls) {
              clearInterval(pollInterval);
              reject(new Error('OAuth timeout - no session detected after 5 minutes'));
            }
          } catch (error) {
            console.error('[Auth] Error polling for session:', error);
          }
        }, 3000); // Poll every 3 seconds
      });
    } catch (error) {
      console.error('[Auth] START_OAUTH error:', error);
      throw error;
    }
  });

  // Get user's licenses
  ipcMain.handle('GET_LICENSES', async (event, { userId }) => {
    try {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Auth] Failed to fetch licenses:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[Auth] GET_LICENSES error:', error);
      throw error;
    }
  });

  // Activate license on this machine
  ipcMain.handle('ACTIVATE_LICENSE', async (event, { licenseKey }) => {
    try {
      console.log('[Auth] Activating license:', licenseKey);

      // Get machine info
      const machineId = machineIdSync();
      const { name: machineName, os: machineOS } = await getMachineInfo();

      console.log('[Auth] Machine info:', { machineId, machineName, machineOS });

      // Refresh session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Not authenticated - please sign in first');
      }
      currentSession = session;

      // Call Edge Function to securely activate license
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/assign_license_to_machine`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            license_key: licenseKey,
            machine_id: machineId,
            machine_name: machineName,
            machine_os: machineOS,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Auth] License activation failed with status:', response.status);
        console.error('[Auth] Response body:', errorText);

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `HTTP ${response.status}`);
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json() as { success: boolean; license: any };
      console.log('[Auth] License activated successfully:', result);

      // Note: For OAuth users, we don't save to local license.json
      // The license is managed in the database and validated via the API
      // Local license.json is only used for standalone license key activation

      // Broadcast access status change
      await broadcastAccessStatusChanged();

      return { success: true, license: result.license };
    } catch (error) {
      console.error('[Auth] ACTIVATE_LICENSE error:', error);
      throw error;
    }
  });

  // Sign out
  ipcMain.handle('SIGN_OUT', async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[Auth] Sign out error:', error);
        throw error;
      }

      currentSession = null;
      console.log('[Auth] User signed out');

      // Clear user ID from access manager
      getAccessManager().setUserId(null);

      // Broadcast access status change
      await broadcastAccessStatusChanged();

      return { success: true };
    } catch (error) {
      console.error('[Auth] SIGN_OUT error:', error);
      throw error;
    }
  });

  // Delete account
  ipcMain.handle('DELETE_ACCOUNT', async () => {
    try {
      // Refresh session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Not authenticated - please sign in first');
      }
      currentSession = session;

      console.log('[Auth] Deleting account for user:', session.user.id);

      // Call Edge Function to delete account (requires service_role key)
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/delete_user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Auth] Account deletion failed:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `HTTP ${response.status}`);
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      const result = await response.json();
      console.log('[Auth] Account deleted successfully:', result);

      // Sign out locally
      await supabase.auth.signOut();
      currentSession = null;

      // Clear user ID from access manager
      getAccessManager().setUserId(null);

      // Broadcast access status change
      await broadcastAccessStatusChanged();

      return { success: true };
    } catch (error) {
      console.error('[Auth] DELETE_ACCOUNT error:', error);
      throw error;
    }
  });

  // Rename machine
  ipcMain.handle('RENAME_MACHINE', async (event, { licenseId, newName }) => {
    try {
      console.log('[Auth] Renaming machine for license:', licenseId, 'to:', newName);

      // First fetch the license to get existing metadata
      const { data: license, error: fetchError } = await supabase
        .from('licenses')
        .select('metadata')
        .eq('id', licenseId)
        .single();

      if (fetchError || !license) {
        console.error('[Auth] Failed to fetch license:', fetchError);
        throw fetchError || new Error('License not found');
      }

      // Update metadata with new machine name
      const updatedMetadata = {
        ...(license.metadata || {}),
        machine_name: newName,
      };

      // Update license with new metadata
      const { data, error } = await supabase
        .from('licenses')
        .update({ metadata: updatedMetadata })
        .eq('id', licenseId)
        .select()
        .single();

      if (error) {
        console.error('[Auth] Failed to rename machine:', error);
        throw error;
      }

      console.log('[Auth] Machine renamed successfully:', data);

      return { success: true, license: data };
    } catch (error) {
      console.error('[Auth] RENAME_MACHINE error:', error);
      throw error;
    }
  });

  // Get current machine ID
  ipcMain.handle('GET_MACHINE_ID', async () => {
    try {
      const machineId = machineIdSync();
      return { machineId };
    } catch (error) {
      console.error('[Auth] GET_MACHINE_ID error:', error);
      throw error;
    }
  });

  // Revoke license from this machine
  ipcMain.handle('REVOKE_LICENSE', async (event, { licenseKey }) => {
    try {
      console.log('[Auth] Revoking license:', licenseKey);

      // Refresh session to ensure we have a valid token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error('Not authenticated - please sign in first');
      }
      currentSession = session;

      // Call Edge Function to securely revoke license
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/revoke_license_from_machine`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            license_key: licenseKey,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        console.error('[Auth] License revocation failed:', errorData);
        throw new Error(errorData.error || 'Failed to revoke license');
      }

      const result = await response.json() as { success: boolean; license: any };
      console.log('[Auth] License revoked successfully:', result);

      // Broadcast access status change
      await broadcastAccessStatusChanged();

      return { success: true, license: result.license };
    } catch (error) {
      console.error('[Auth] REVOKE_LICENSE error:', error);
      throw error;
    }
  });
}

/**
 * Ensure user has a trial subscription
 * If user doesn't have any licenses, create a trial via Edge Function
 */
async function ensureUserHasTrial(userId: string | undefined) {
  if (!userId) return;

  try {
    // Check if user already has licenses
    const { data: existingLicenses, error: fetchError } = await supabase
      .from('licenses')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (fetchError) {
      console.error('[Auth] Failed to check existing licenses:', fetchError);
      return;
    }

    if (existingLicenses && existingLicenses.length > 0) {
      console.log('[Auth] User already has licenses, skipping trial creation');
      return;
    }

    // Create trial via Edge Function
    console.log('[Auth] Creating trial for new user...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create_stripe_trial`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentSession?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        email: currentSession?.user?.email,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Auth] Trial creation failed:', errorText);
      return;
    }

    const result = await response.json();
    console.log('[Auth] Trial created successfully:', result);
  } catch (error) {
    console.error('[Auth] ensureUserHasTrial error:', error);
  }
}

/**
 * Get current auth session
 */
export function getCurrentSession() {
  return currentSession;
}
