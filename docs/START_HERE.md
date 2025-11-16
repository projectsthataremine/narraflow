# NarraFlow: Start Here

**Last Updated**: 2025-10-12
**Project Renamed**: Formerly known as Mic2Text

This document provides a comprehensive introduction to NarraFlow (formerly Mic2Text) for AI assistants and developers joining the project. Read this FIRST to understand the project's unique aspects before diving into implementation details.

**💰 IMPORTANT**: Before making any pricing or cost-related decisions, read the **[Realistic User Costs Analysis](./realistic-user-costs.html)** for detailed information about actual user costs, pricing strategies, and cost breakdowns.

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [The Marketing Site: Not a Traditional Website](#the-marketing-site-not-a-traditional-website)
3. [Payment & Licensing System](#payment--licensing-system)
4. [Environment Setup & Services](#environment-setup--services)
5. [Project Structure](#project-structure)
6. [Key Technical Decisions](#key-technical-decisions)
7. [Development Workflow](#development-workflow)
8. [Detailed Documentation References](#detailed-documentation-references)

---

## Product Overview

**NarraFlow** is a macOS desktop application for offline speech-to-text transcription with hotkey activation.

### Key Features:
- **Hotkey-activated recording** (Command+B by default)
- **Offline transcription** using Whisper model via ONNX Runtime
- **Recording pill overlay** with visual state indicators (loading, silence, talking, processing)
- **Multi-monitor support** with 300ms position tracking
- **Transparent, always-on-top overlay** with no window border
- **$3/month subscription** with online license validation

### Target Platform:
- **macOS only** (Big Sur 11.0 or later)
- **Separate builds** for Intel (x64) and Apple Silicon (arm64)

### GitHub Repository:
- **Owner**: `projectsthataremine`
- **Repo**: `narraflow`
- **URL**: https://github.com/projectsthataremine/narraflow

---

## The Marketing Site: Not a Traditional Website

**⚠️ CRITICAL UNDERSTANDING**: The marketing site is NOT a traditional website with pages and navigation. It's a **fully interactive retro desktop OS simulation**.

### What This Means:

The marketing site looks and behaves like a complete desktop operating system interface:

- **Desktop Icons**: Users can double-click icons (Demo, Pricing, Account, Docs, Showcase, About)
- **Draggable Windows**: Every interaction opens a window that can be dragged, resized, minimized, and closed
- **Taskbar**: Live clock, animated battery indicator, network status (like a real OS)
- **Window Management**: Z-index management, multiple windows open simultaneously, fullscreen toggle
- **Desktop-Only**: Mobile users see "Coming Soon" - this is intentionally a desktop experience

### Technology:
- **Next.js 14** (App Router)
- **Zustand** for state management
- **Custom window system** with drag, resize, boundary checking
- **Theme system** with 4 retro color schemes (CSS variables)

### Implementation Location:
- **Main component**: `marketing-site/components/desktop/Desktop.tsx`
- **README**: `marketing-site/README.md`
- **Design doc**: `docs/MARKETING_SITE_DESIGN.md`

### Why This Matters:
When working on the marketing site, you're not building a traditional web page. You're building windows, desktop icons, and OS-like interactions. Think "simulated operating system" not "website".

**Current Status**: Phase 1 complete (core desktop UI, window system, theme system). Next up: Demo window with voice transcription.

---

## Payment & Licensing System

NarraFlow uses a **Google OAuth + Stripe + Supabase** licensing system with automatic trial and machine binding.

### Authentication & License Flow:

**Google OAuth Login**:
- Users sign in with Google (both in Electron app and marketing site)
- No manual license key entry required
- Automatic 7-day trial on first sign-in

**Trial System**:
- Stripe manages 7-day trial period
- Trial auto-cancels if no payment method added
- Trial license created automatically via webhook

**Machine Binding**:
- Uses `node-machine-id` to get unique machine identifier
- Each license can be activated on ONE machine
- Machine name and OS automatically detected (e.g., "MacBook Pro (2024)", "macOS 15.0 Sequoia")
- Users can rename machines for easier identification

**Online-Required Validation**:
- License validation requires internet connection
- Real-time checks against Supabase database
- Revocation support (instant license invalidation)

### Complete Flow:

1. **User signs in with Google** (Electron app or marketing site)
2. **First sign-in**: Stripe trial subscription created automatically
3. **Trial license generated** via webhook (status: 'pending')
4. **User clicks "Use on this machine"** in Account tab
5. **License activated** with machine info (name, OS, machine ID)
6. **App validates** license on every launch
7. **After trial**: User subscribes via Stripe Checkout ($3/month)

### Key Files:
- `src/main/AppStore.ts` - License validation and activation logic
- `src/main/auth-handler.ts` - OAuth and license IPC handlers
- `src/main/machine-info.ts` - Machine name/OS detection
- `src/main/supabase-client.ts` - Supabase client for auth
- `src/settings/settings.tsx` - Account management UI (Electron)
- `marketing-site/components/desktop/Desktop.tsx` - Account window (web)
- Database schema in `docs/PAYMENT_AND_LICENSING_INTEGRATION_V2.md`

### Supabase Tables:
- `licenses` - License keys, status, machine IDs, machine names/OS
- `subscriptions` - Stripe subscription data (managed by webhooks)

### Edge Functions:
- `create_stripe_trial` - Creates 7-day trial subscription on first sign-in
- `validate_license` - Validates license keys with signature

**Detailed documentation**: `docs/AUTH_REDESIGN_IMPLEMENTATION.md`

---

## Environment Setup & Services

### Supabase (Backend)
- **URL**: `https://buqkvxtxjwyohzsogfbz.supabase.co`
- **Project ID**: `buqkvxtxjwyohzsogfbz`
- **Publishable Key**: `sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K`
- **Secret Key**: `sb_secret_4cq3MdbcoyxxsCUHuf_hTw_yXL-hFPq`

### Stripe (Payments)
- **Status**: ⚠️ NOT YET CONFIGURED
- **Plan**: $3/month subscription
- **Webhook**: Will trigger license generation

### Ed25519 Key Pair (License Signing)
- **Status**: ✅ CONFIGURED
- **Public Key**: Stored in app for verification
- **Private Key**: Stored in Supabase secrets for signing

### Environment Files:
- **Electron app**: `.env` (Supabase URL, publishable key)
- **Marketing site**: `.env.local` (Supabase + Stripe keys)

**Detailed setup**: `docs/ENVIRONMENT_SETUP.md`

---

## Project Structure

```
narraflow/
├── src/                          # Electron app source
│   ├── main/                     # Main process
│   │   ├── index.ts             # Entry point (windows, IPC, shortcuts)
│   │   ├── ipc-handlers.ts      # IPC communication
│   │   ├── shortcuts.ts         # Global hotkey registration
│   │   ├── AppStore.ts          # License validation
│   │   └── LicenseManager.ts    # Key signing/verification
│   ├── renderer/                 # Renderer processes
│   │   ├── ui/                  # Recording pill overlay
│   │   └── settings/            # Settings window
│   ├── workers/                  # Worker threads
│   │   └── transcription.worker.ts
│   └── types/                    # TypeScript types
│
├── marketing-site/               # Next.js marketing site
│   ├── app/                     # Next.js 14 App Router
│   │   ├── page.tsx            # Main desktop page
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   └── desktop/
│   │       ├── Desktop.tsx      # Main desktop layout
│   │       ├── DesktopIcon.tsx  # Draggable icons
│   │       ├── Window.tsx       # Draggable/resizable windows
│   │       └── Taskbar.tsx      # Clock, battery, network
│   └── stores/
│       └── windowStore.ts       # Zustand state management
│
├── fn-key-helper/                # Fn key detection helper
│   └── (Swift app for Fn key support)
│
└── docs/                         # Documentation
    ├── START_HERE.md            # THIS FILE
    ├── APP_PACKAGING_AND_UPDATES.md
    ├── PAYMENT_AND_LICENSING_INTEGRATION_V2.md
    ├── MARKETING_SITE_DESIGN.md
    └── ENVIRONMENT_SETUP.md
```

---

## Key Technical Decisions

### Why Online-Required License Validation?

**Decision**: License validation requires internet connection on every app launch.

**Reasoning**:
- Instant license revocation (fraud protection)
- Real-time subscription status checks
- Simpler than offline + periodic online checks
- User expectation: subscription model = online service

**Reference**: `docs/PAYMENT_AND_LICENSING_INTEGRATION_V2.md` (Section: "Online-Required Validation")

### Why Separate arm64 and x64 Builds?

**Decision**: Build separate DMG files for Apple Silicon and Intel Macs.

**Reasoning**:
- Minimum supported OS: macOS Big Sur 11.0 (November 2020)
- Big Sur supports BOTH Intel Macs (2013-2020) and M1 Macs (2020+)
- Universal binaries are larger and more complex
- Separate builds provide better optimization per architecture

**Implementation**: See `docs/APP_PACKAGING_AND_UPDATES.md` (Section: "Architecture Support")

### Why Retro Desktop OS for Marketing Site?

**Decision**: Build marketing site as simulated desktop OS instead of traditional website.

**Reasoning**:
- Unique, memorable user experience
- Interactive demo is the hero feature (fits naturally in a "desktop" environment)
- Showcases the app's desktop nature before download
- Differentiates from competitors

**Reference**: `docs/MARKETING_SITE_DESIGN.md` (Section: "Design Philosophy")

### Why Worker Threads for Transcription?

**Decision**: Run Whisper model in worker thread, not main process.

**Reasoning**:
- Prevents UI blocking during heavy computation
- Better CPU utilization on multi-core systems
- Keeps overlay responsive during transcription

**Implementation**: `src/workers/transcription.worker.ts`

---

## Development Workflow

### Running the Electron App:

```bash
npm run dev
```

This runs 3 concurrent processes:
1. **Vite dev server** (renderer UI at `http://localhost:5173`)
2. **TypeScript compiler** (watch mode for main process)
3. **Electron** (launches app with hot reload)

### Running the Marketing Site:

```bash
cd marketing-site
npm run dev
```

Opens at `http://localhost:3000`

### Building for Production:

```bash
# Electron app
npm run build

# Marketing site
cd marketing-site
npm run build
```

### Testing:

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e
```

---

## Detailed Documentation References

### For App Packaging & Distribution:
📄 **`docs/APP_PACKAGING_AND_UPDATES.md`**
- electron-builder configuration
- Auto-update system with electron-updater
- GitHub Releases workflow
- Code signing
- Architecture support (arm64 vs x64)

### For Payment & Licensing:
📄 **`docs/PAYMENT_AND_LICENSING_INTEGRATION_V2.md`**
- Complete Stripe + Supabase integration
- License key generation and validation
- Database schema
- Edge Functions
- Machine binding implementation
- Ed25519 cryptographic signing

### For Marketing Site:
📄 **`docs/MARKETING_SITE_DESIGN.md`**
- Design philosophy and inspiration
- Window system specifications
- Color scheme options
- Interaction patterns
- Phase-by-phase implementation plan

📄 **`marketing-site/README.md`**
- Current implementation status
- Component structure
- Theme customization
- Development setup

### For Environment Setup:
📄 **`docs/ENVIRONMENT_SETUP.md`**
- Supabase configuration
- Stripe integration steps
- Environment variables
- Ed25519 key pair setup

### For Fn Key Helper:
📄 **`fn-key-helper/README.md`**
- Swift helper app for Fn key detection
- Accessibility permissions
- Build and integration instructions

---

## Common Pitfalls for AI Assistants

### ❌ DON'T assume the marketing site is a traditional website
**✅ DO** remember it's a simulated desktop OS with windows and icons

### ❌ DON'T suggest standard web page patterns (navbar, footer, hero section)
**✅ DO** think in terms of desktop windows, taskbar, and OS interactions

### ❌ DON'T propose single universal binary for macOS
**✅ DO** build separate arm64 and x64 DMG files

### ❌ DON'T suggest offline-first license validation
**✅ DO** remember license validation is online-required by design

### ❌ DON'T assume the app has a traditional menu bar
**✅ DO** remember the app runs as a background process with overlay window

---

## Quick Start Checklist

When starting a new task:

- [ ] Read this START_HERE.md document
- [ ] Understand the marketing site is a simulated desktop OS
- [ ] Check if task involves licensing (read PAYMENT_AND_LICENSING_INTEGRATION_V2.md)
- [ ] Check if task involves packaging/updates (read APP_PACKAGING_AND_UPDATES.md)
- [ ] Check if task involves marketing site UI (read MARKETING_SITE_DESIGN.md)
- [ ] Verify environment setup status in ENVIRONMENT_SETUP.md
- [ ] Ask user for clarification if anything is unclear

---

## Need Help?

If you encounter something not covered in this document:

1. Check the **Detailed Documentation References** section above
2. Search the codebase for related implementations
3. Ask the user for clarification with specific context

---

**Welcome to NarraFlow! You're now ready to contribute effectively to this unique project.**
