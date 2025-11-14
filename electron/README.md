# NarraFlow

Voice-to-text transcription app with a floating recording pill UI.

## Architecture Overview

### Core Components

- **Electron Main Process** (`src/main/`)
  - `index.ts` - App entry point, creates overlay + settings windows
  - `ipc-handlers.ts` - IPC communication, handles recording, transcription, access control
  - `auth-handler.ts` - OAuth flow management (dual-mode: dev/prod)
  - `access-manager.ts` - Trial/license validation via Supabase
  - `shortcuts.ts` - Global keyboard shortcut registration
  - `settings-manager.ts` - Persistent settings storage

- **Renderer Processes**
  - **Overlay Window** (`src/ui/overlay/`) - Floating recording pill that appears on hotkey press
  - **Settings Window** (`src/ui/settings/`) - Full settings UI with tabs (General, Recording Pill, History, Account, Feedback)

- **Worker Thread** (`src/worker/`)
  - Handles audio transcription via Groq API (called through Supabase Edge Function)

- **Fn Key Helper** (`fn-key-helper/`)
  - Native Swift app that captures Fn key presses (system-wide global shortcut)

### Key Technical Decisions

- **Transcription**: Uses Groq API via Supabase Edge Functions (not local Whisper model)
- **Authentication**: Supabase Auth with Google OAuth
- **Access Control**: Trial/license system stored in Supabase `licenses` table
  - Trials: `status='pending'`, expires_at timestamp
  - Active licenses: `status='active'`, linked to machine_id

## Authentication Flow

### Development Mode
1. User clicks "Sign in with Google"
2. Opens OAuth URL in system browser
3. After auth, Supabase redirects to `http://localhost:54321`
4. Local HTTP server extracts OAuth tokens from hash fragment
5. Sets session in Supabase client

### Production Mode
1. User clicks "Sign in with Google"
2. Opens OAuth URL in system browser
3. After auth, redirects to `https://trynarraflow.com/auth-success`
4. Marketing site redirects to `narraflow://auth-callback#access_token=...`
5. Deep link handler in main process sets session

**Important**: Supabase uses hash fragments (`#access_token=...`) not query params, so an intermediate HTML page extracts the hash and converts to query params in dev mode.

### Supabase Configuration Required
Add these redirect URLs in Supabase Dashboard → Authentication → URL Configuration:
- Development: `http://localhost:54321`
- Production: `https://trynarraflow.com/auth-success`

## Access Control System

Access is checked in two places:

1. **Recording Start** (`ipc-handlers.ts:192-206`)
   - Blocks recording if `!accessStatus.hasValidAccess`
   - Returns error message to UI

2. **UI Level** (`src/ui/settings/`)
   - Greys out restricted tabs/controls when no access
   - Recording Pill tab: disabled
   - History tab: disabled
   - General tab controls: keyboard shortcuts, microphone, enhanced formatting greyed out

Access status is broadcast via `ACCESS_STATUS_CHANGED` IPC event whenever:
- User signs in
- User activates/revokes license
- Access manager checks trial/license status

## Development

```bash
npm install
npm run dev
```

This runs 3 concurrent processes:
- Vite dev server (renderer UI)
- TypeScript compiler in watch mode
- Electron app

### Environment Variables

Required in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
APP_ENV=dev  # or 'prod'
```

## Key Files Reference

- `src/main/index.ts:237` - App initialization, window creation
- `src/main/auth-handler.ts:133` - OAuth flow (START_OAUTH handler)
- `src/main/access-manager.ts:193` - Access validation logic
- `src/main/ipc-handlers.ts:192` - Recording start with access check
- `src/ui/settings/index.tsx:83` - Settings app, listens for ACCESS_STATUS_CHANGED
- `src/ui/settings/components/Sidebar.tsx` - Navigation with disabled state
- `fn-key-helper/NarraFlowFnHelper/FnKeyMonitor.swift` - Fn key capture

## Common Issues

### OAuth Not Working
- Ensure redirect URL is added in Supabase dashboard
- Check browser console for redirect URL
- In dev mode, verify localhost:54321 server starts

### Access Control Not Working
- Check console logs for `[AccessManager] Access status:` output
- Verify user ID is set: `[AccessManager] setUserId` should be called after sign-in
- Query Supabase `licenses` table to verify trial/license exists

### Recording Not Working
- Check microphone permissions in System Settings
- Verify Fn key helper is running: `ps aux | grep NarraFlowFnHelper`
- Check console for `[Shortcuts] Fn key listener registered`
