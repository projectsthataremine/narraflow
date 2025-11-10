# Clipp Environments

This document describes the two environments used for developing and testing Clipp.

## Overview

Clipp uses two distinct environments to ensure safe testing and deployment:

1. **DEV** - Development and testing with Stripe Sandbox
2. **PROD** - Production with Stripe Live mode

## Environment Details

### 1. DEV (Development & Testing)

**Purpose:** Local development and testing without any real money

**Build:**
- Can be running from source (`npm run dev`) OR
- Full production build (packaged app) for testing
- Both use the same DEV environment

**Stripe:**
- **Stripe Sandbox mode** (Stripe's new testing environment)
- Webhook in Stripe Sandbox dashboard → `stripe-webhook-dev` edge function
- Test cards like `4242 4242 4242 4242`
- No real money involved

**Edge Functions:**
- Uses `-dev` edge functions (deployed to Supabase)
- Reads `STRIPE_SECRET_KEY_SANDBOX` (Stripe Sandbox credentials)
- Reads `STRIPE_PRICE_ID_MONTHLY_SANDBOX` and `STRIPE_PRICE_ID_ANNUAL_SANDBOX`
- Reads `STRIPE_WEBHOOK_SECRET_SANDBOX` for webhook verification

**Environment Variable:**
- Set `CLIPP_ENV=dev` in Electron app `backend/.env` file
- Or build with `npm run build:dev` which calls `set-env.js dev`

---

### 2. PROD (Production)

**Purpose:** Actual production environment with real customers

**Build:**
- Production build downloaded from the internet
- No dev flags enabled

**Stripe:**
- **Stripe Live mode**
- Webhook in Stripe Live Mode dashboard → `stripe-webhook` edge function
- Real pricing ($5/month or $24/year)

**Edge Functions:**
- Uses production edge functions (no `-dev` suffix)
- Reads `STRIPE_SECRET_KEY_PROD` (Stripe Live Mode credentials)
- Reads `STRIPE_PRICE_ID_MONTHLY_PROD` and `STRIPE_PRICE_ID_ANNUAL_PROD`
- Reads `STRIPE_WEBHOOK_SECRET_PROD` for webhook verification

**Environment Variable:**
- Built with `npm run build:prod` which calls `set-env.js prod`

---

## Environment Variable Summary

| Environment | `CLIPP_ENV` | Edge Functions | Stripe Mode | Webhooks |
|-------------|-------------|----------------|-------------|----------|
| DEV | `dev` | `-dev` | Sandbox | Dashboard webhook → `-dev` |
| PROD | `prod` | production | Live | Dashboard webhook → production |

---

## How It Works

### 1. Electron App Determines Environment

The Electron app reads `CLIPP_ENV` and:
- If `CLIPP_ENV=dev` → Calls `-dev` edge functions
- If `CLIPP_ENV=prod` → Calls production edge functions (no suffix)

### 2. Edge Functions Use Credentials

**Development Edge Functions (`-dev` suffix):**
- Always use `STRIPE_SECRET_KEY_SANDBOX` (Stripe Sandbox credentials)
- Always use `STRIPE_PRICE_ID_MONTHLY_SANDBOX` and `STRIPE_PRICE_ID_ANNUAL_SANDBOX`
- Always use `STRIPE_WEBHOOK_SECRET_SANDBOX` for webhook verification
- No environment parameters needed - it's always Sandbox

**Production Edge Functions (no suffix):**
- Always use `STRIPE_SECRET_KEY_PROD` (Stripe Live Mode credentials)
- Always use `STRIPE_PRICE_ID_MONTHLY_PROD` and `STRIPE_PRICE_ID_ANNUAL_PROD`
- Always use `STRIPE_WEBHOOK_SECRET_PROD` for webhook verification
- Hardcoded to production credentials for security

**Security Note:** Production edge functions are intentionally separate and cannot be manipulated to use test credentials.

### 3. Stripe Processes Payments

Stripe uses the credentials provided:
- **Sandbox (DEV):** No real money, test cards only
- **Live mode (PROD):** Real money, real customers

---

## Quick Reference

**Local development:**
```bash
# In Electron app backend/.env (already set by default)
CLIPP_ENV=dev

# Or run with environment variable (package.json does this):
npm start  # Sets CLIPP_ENV=dev automatically

# No stripe listen needed - webhook is in Stripe Sandbox dashboard
```

**Build for testing:**
```bash
# Build with dev environment (automatically sets CLIPP_ENV=dev in backend/.env)
npm run build:dev
```

**Build for production:**
```bash
# Build with production environment (automatically sets CLIPP_ENV=prod in backend/.env)
npm run build:prod
# or
npm run build  # Defaults to prod
```

---

## Webhooks Setup

### DEV Environment
1. Go to Stripe Sandbox dashboard → Developers → Webhooks
2. Create webhook endpoint: `https://[your-project].supabase.co/functions/v1/stripe-webhook-dev`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### PROD Environment
1. Go to Stripe Live Mode dashboard → Developers → Webhooks
2. Create webhook endpoint: `https://[your-project].supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## Secrets Management

All Stripe secrets are stored in Supabase and managed via `.env.secrets` file (not committed to git).

**Required secrets:**
```bash
# SANDBOX Environment (used by DEV - Stripe Sandbox)
STRIPE_SECRET_KEY_SANDBOX="sk_test_..." # From Stripe Sandbox
STRIPE_PRICE_ID_MONTHLY_SANDBOX="price_..." # Monthly subscription in Sandbox
STRIPE_PRICE_ID_ANNUAL_SANDBOX="price_..." # Annual subscription in Sandbox
STRIPE_WEBHOOK_SECRET_SANDBOX="whsec_..." # Webhook signing secret from Sandbox

# PROD Environment (Stripe Live)
STRIPE_SECRET_KEY_PROD="sk_live_..." # From Stripe Live Mode
STRIPE_PRICE_ID_MONTHLY_PROD="price_..." # Monthly subscription in Live
STRIPE_PRICE_ID_ANNUAL_PROD="price_..." # Annual subscription in Live
STRIPE_WEBHOOK_SECRET_PROD="whsec_..." # Webhook signing secret from Live
```

To upload secrets:
```bash
npx supabase secrets set \
  STRIPE_SECRET_KEY_SANDBOX="sk_test_..." \
  STRIPE_PRICE_ID_MONTHLY_SANDBOX="price_..." \
  STRIPE_PRICE_ID_ANNUAL_SANDBOX="price_..." \
  STRIPE_WEBHOOK_SECRET_SANDBOX="whsec_..." \
  STRIPE_SECRET_KEY_PROD="sk_live_..." \
  STRIPE_PRICE_ID_MONTHLY_PROD="price_..." \
  STRIPE_PRICE_ID_ANNUAL_PROD="price_..." \
  STRIPE_WEBHOOK_SECRET_PROD="whsec_..."
```

To view current secrets:
```bash
npx supabase secrets list
```
