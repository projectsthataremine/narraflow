# Payment and Licensing Integration Guide

**Last Updated:** 2025-10-11

This document describes the **complete payment and licensing system** for Mic2Text. It uses Stripe for payments, Supabase for backend infrastructure, and Ed25519 cryptographic signatures for secure, machine-locked license validation.

---

## 🎯 IMPLEMENTATION STATUS

Track your progress through each phase:

### Phase 1: Database & Keys Setup 🔄 IN PROGRESS
- [x] Create Supabase project (ID: `buqkvxtxjwyohzsogfbz`)
- [x] Create API keys (publishable + secret)
- [x] Set up environment variables
- [ ] Run database migration (create `licenses` table)
- [ ] Generate Ed25519 key pair
- [ ] Store private key in Supabase secrets
- [ ] Store public key in Electron constants

### Phase 2: Supabase Edge Functions ⬜ NOT STARTED
- [ ] Copy edge function files from copy-paste-app
- [ ] Deploy `activate_license` function
- [ ] Deploy `validate_license` function
- [ ] Deploy `create_stripe_user` function
- [ ] Deploy `create_payment_session` function
- [ ] Set all environment secrets

### Phase 3: Electron App Integration ⬜ NOT STARTED
- [ ] Install `node-machine-id` dependency
- [ ] Create `src/main/AppStore.ts` (license validation logic)
- [ ] Create `src/main/constants.ts` (public key + secrets)
- [ ] Add IPC handlers for license management
- [ ] Update main.ts to initialize AppStore
- [ ] Test local license validation

### Phase 4: Payment Flow (Next.js) ⬜ NOT STARTED
- [ ] Set up Stripe account and get API keys
- [ ] Create product and subscription in Stripe
- [ ] Add Stripe webhook handler (`/api/webhooks/stripe`)
- [ ] Implement `generateLicenseKey()` function
- [ ] Set up Resend for email delivery
- [ ] Implement `sendLicenseEmail()` function
- [ ] Add "Subscribe" button to marketing site
- [ ] Wire up Stripe checkout flow

### Phase 5: Testing & Deployment ⬜ NOT STARTED
- [ ] Test full payment → license creation flow
- [ ] Test license activation in Electron app
- [ ] Test machine binding (try on multiple machines)
- [ ] Test signature verification
- [ ] Test offline validation
- [ ] Test license expiration
- [ ] Set up Stripe webhook in production

---

## 📖 SYSTEM OVERVIEW

### How It Works (High-Level)

```
1. User pays via Stripe
   ↓
2. Stripe webhook fires → generates license key
   ↓
3. License stored in Supabase (key, user_id, expires_at, machine_id=null)
   ↓
4. Email sent to user with license key
   ↓
5. User enters license key in Electron app
   ↓
6. App validates license + binds to machine ID
   ↓
7. Server signs license with Ed25519 private key
   ↓
8. App saves signed license.json locally
   ↓
9. App validates license on each launch (local + online check)
```

### Key Features

- **Stripe Integration** - Subscription-based payments
- **Machine Binding** - License keys only work on one machine
- **Ed25519 Signatures** - Cryptographically signed licenses prevent tampering
- **Offline Support** - Works without internet after initial activation
- **Automatic Re-validation** - Checks license validity every 5 hours

---

## 🔐 SECURITY MODEL

### Machine Binding

Uses `node-machine-id` to generate a persistent hardware ID:

```typescript
import { machineIdSync } from 'node-machine-id';
const machineId = machineIdSync(); // e.g., "9c0f7c5e8a4d3b2c1a0f9e8d7c6b5a4"
```

**How it works:**
1. User enters license key
2. App gets machine ID
3. Server checks: is this license already bound?
   - **First activation:** Bind license to this machine_id
   - **Already bound:** Check if machine_id matches
   - **Mismatch:** Reject (prevents sharing)

### Ed25519 Cryptographic Signatures

**Purpose:** Prevents users from faking their license.json file

**Server (Private Key):**
- Signs license payload: `{license_key, machine_id, expires_at}`
- Returns: `{payload, signature}`

**Client (Public Key):**
- Receives signed payload
- Verifies signature using public key
- If valid: trusts the license

**Why this works:**
- User cannot create valid signatures without private key
- Even if they know the format, signature won't match
- Public key verification is fast and secure

---

## 🏗️ ARCHITECTURE

### Data Flow Diagram

```
┌─────────────────┐
│   Next.js Site  │  User clicks "Subscribe"
│   (Marketing)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Stripe API     │  Payment processing
└────────┬────────┘
         │
         ▼  (webhook: checkout.session.completed)
┌─────────────────┐
│  Next.js API    │  /api/webhooks/stripe
│  Webhook        │  - Generate license key
│                 │  - Call activate_license
│                 │  - Send email
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  Supabase Edge Functions    │
│  • activate_license         │  Create license in DB
│  • validate_license         │  Validate + bind to machine
│  • create_stripe_user       │  Manage Stripe customers
│  • create_payment_session   │  Create checkout
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB    │  licenses table
│  (PostgreSQL)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Electron App   │  Local license validation
│  (Desktop)      │  + Remote verification
└─────────────────┘
```

### Components

1. **Next.js Website** - Payment UI, Stripe checkout, webhook handler
2. **Stripe** - Payment processing, subscription management
3. **Supabase Edge Functions** - Server-side business logic (Deno)
4. **Supabase Database** - PostgreSQL database for licenses
5. **Electron App** - Desktop app with license validation
6. **Resend** - Email service for license delivery

---

## 💾 DATABASE SCHEMA

### licenses Table

```sql
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  machine_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_machine_id ON licenses(machine_id);
```

**Fields:**
- `id` - Auto-incrementing ID
- `key` - License key (any string/number, must be unique)
- `user_id` - Supabase auth user (optional, if you have auth)
- `machine_id` - Hardware ID (null until first activation)
- `expires_at` - License expiration timestamp
- `created_at` - When license was created

---

## 🔄 ACTIVATION FLOW (DETAILED)

### First Time Activation

```
1. User opens Electron app
   → No license.json exists
   → Show: "Enter your license key"

2. User enters license key: "12345"

3. App calls validate_license edge function
   → Sends: {
       key: "12345",
       machine_id: "abc123def456...",
       return_signed_license: true
     }

4. Server checks database:
   ✓ License exists?
   ✓ machine_id is null? (not yet bound)
   → UPDATE licenses SET machine_id = "abc123..." WHERE key = "12345"

5. Server creates signed payload:
   → Payload: {
       license_key: "12345",
       machine_id: "abc123...",
       expires_at: "2025-12-31T23:59:59Z"
     }
   → Signature: Sign with LICENSE_PRIVATE_KEY (Ed25519)

6. Server returns:
   → {
       valid: true,
       payload: {...},
       signature: "hY8fG3kL2mN9..."
     }

7. Client verifies signature using PUBLIC_LICENSE_KEY
   ✓ Signature valid?
   → Save license.json with payload + signature

8. App is now activated! ✅
```

### Subsequent Launches

```
1. App starts

2. Read license.json

3. Local validation:
   ✓ Machine ID matches current machine?
   ✓ License not expired?
   ✓ Signature valid (using public key)?

4. Remote validation (optional, can fail):
   → Ping validate_license edge function
   → If network fails: trust local validation

5. Start 5-hour re-validation timer

6. App runs normally
```

---

## 📁 FILE STRUCTURE

```
Mic2Text/
├── marketing-site/                    # Next.js website
│   ├── app/
│   │   └── api/
│   │       └── webhooks/
│   │           └── stripe/
│   │               └── route.ts       # Stripe webhook handler
│   └── lib/
│       ├── stripe.ts                  # Stripe utilities
│       ├── license-generator.ts       # generateLicenseKey()
│       └── email.ts                   # sendLicenseEmail()
│
├── src/
│   └── main/
│       ├── AppStore.ts                # License validation logic
│       ├── constants.ts               # PUBLIC_LICENSE_KEY, secrets
│       ├── ipc-handlers.ts            # IPC: submit-license-key
│       └── license.json               # Saved license (after activation)
│
└── supabase/                          # Supabase backend
    └── functions/
        ├── activate_license/
        │   └── index.ts
        ├── validate_license/
        │   └── index.ts
        ├── create_stripe_user/
        │   └── index.ts
        └── create_payment_session/
            └── index.ts
```

---

## 🛠️ IMPLEMENTATION GUIDE

### Phase 1: Database & Keys Setup

#### Step 1.1: Create Supabase Project ✅ DONE

**Project ID:** `buqkvxtxjwyohzsogfbz`
**Project URL:** `https://buqkvxtxjwyohzsogfbz.supabase.co`

**API Keys:**
- Publishable: `sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K`
- Secret: `sb_secret_4cq3MdbcoyxxsCUHuf_hTw_yXL-hFPq`

**Environment files created:**
- ✅ `marketing-site/.env.local`
- ✅ `src/main/constants.ts`

#### Step 1.2: Create Database Table

In Supabase SQL Editor, run:

```sql
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  machine_id TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licenses_key ON licenses(key);
CREATE INDEX idx_licenses_machine_id ON licenses(machine_id);
```

#### Step 1.3: Generate Ed25519 Key Pair

Create `scripts/generate-keys.js`:

```javascript
const { subtle } = require("crypto").webcrypto;

async function generateKeys() {
  const keyPair = await subtle.generateKey("Ed25519", true, ["sign", "verify"]);

  const privateKey = await subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKey = await subtle.exportKey("spki", keyPair.publicKey);

  const privateKeyBase64 = Buffer.from(privateKey).toString("base64");
  const publicKeyBase64 = Buffer.from(publicKey).toString("base64");

  console.log("\n🔐 PRIVATE KEY (store in Supabase secrets):");
  console.log(privateKeyBase64);

  console.log("\n🔓 PUBLIC KEY (store in Electron constants.ts):");
  console.log(publicKeyBase64);
}

generateKeys();
```

Run: `node scripts/generate-keys.js`

#### Step 1.4: Store Keys

**Private Key (Supabase):**
```bash
supabase secrets set LICENSE_PRIVATE_KEY=MC4CAQAwBQYDK2VwBCIEI...
```

**Public Key (Electron):**
Add to `src/main/constants.ts`:
```typescript
export const PUBLIC_LICENSE_KEY = "MCowBQYDK2VwAyEAjy7TatpO...";
```

---

### Phase 2: Supabase Edge Functions

#### Step 2.1: Copy Edge Functions

Copy from `/Users/joshuaarnold/Dev/copy-paste-app/electron/backend/supabase/functions/` to your project.

#### Step 2.2: Deploy Functions

```bash
cd supabase
supabase functions deploy activate_license
supabase functions deploy validate_license
supabase functions deploy create_stripe_user
supabase functions deploy create_payment_session
```

#### Step 2.3: Set Environment Secrets

```bash
# Generate a random secret for edge function auth
supabase secrets set EDGE_FUNCTION_SECRET=$(openssl rand -hex 32)

# Add Stripe keys (get from Stripe dashboard)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# Add your website URL
supabase secrets set SITE_URL=https://yoursite.com

# Add Supabase credentials
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

### Phase 3: Electron App Integration

#### Step 3.1: Install Dependencies

```bash
npm install node-machine-id
```

#### Step 3.2: Create AppStore.ts

Copy from `/Users/joshuaarnold/Dev/copy-paste-app/electron/backend/AppStore.js` and convert to TypeScript.

Key changes:
- Update Supabase URL to your project
- Import PUBLIC_LICENSE_KEY from constants

#### Step 3.3: Create constants.ts

```typescript
export const PUBLIC_LICENSE_KEY = "MCowBQYDK2VwAyEA..."; // From Phase 1
export const EDGE_FUNCTION_SECRET = "abc123..."; // From Phase 2
export const SUPABASE_URL = "https://xxxxx.supabase.co";
```

#### Step 3.4: Add IPC Handlers

In `src/main/ipc-handlers.ts`:

```typescript
import { ipcMain } from 'electron';
import { appStore } from './AppStore';

ipcMain.handle('get-license-valid', () => {
  return appStore.getLicenseValid();
});

ipcMain.handle('submit-license-key', async (event, licenseKey: string) => {
  try {
    await appStore.addLicenseKey(licenseKey);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
});
```

#### Step 3.5: Initialize AppStore

In `src/main/index.ts`:

```typescript
import { appStore } from './AppStore';

app.on('ready', () => {
  // ... existing code
  appStore.setWindow(mainWindow);
  appStore.validateLicense(); // Check license on startup
});
```

---

### Phase 4: Payment Flow (Next.js)

#### Step 4.1: Set Up Stripe

1. Create Stripe account: https://stripe.com
2. Create product: "Mic2Text Subscription"
3. Create price: $5/month (or your price)
4. Note down price ID: `price_1ABC...`
5. Get API keys from dashboard

#### Step 4.2: Install Dependencies

```bash
cd marketing-site
npm install stripe @stripe/stripe-js resend
```

#### Step 4.3: Create License Generator

Create `marketing-site/lib/license-generator.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function generateLicenseKey(): Promise<string> {
  // Get the highest existing license key
  const { data } = await supabase
    .from('licenses')
    .select('key')
    .order('key', { ascending: false })
    .limit(1);

  // Start at 10000, increment from highest
  const lastKey = data?.[0]?.key ? parseInt(data[0].key) : 9999;
  return String(lastKey + 1);
}
```

#### Step 4.4: Create Email Service

Create `marketing-site/lib/email.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendLicenseEmail(email: string, licenseKey: string) {
  await resend.emails.send({
    from: 'Mic2Text <noreply@yoursite.com>',
    to: email,
    subject: 'Your Mic2Text License Key',
    html: `
      <h1>Welcome to Mic2Text!</h1>
      <p>Your license key is:</p>
      <h2 style="background: #f4f4f4; padding: 16px; font-family: monospace;">
        ${licenseKey}
      </h2>
      <p>Enter this key in the Mic2Text app to activate your subscription.</p>
    `,
  });
}
```

#### Step 4.5: Create Stripe Webhook Handler

Create `marketing-site/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateLicenseKey } from '@/lib/license-generator';
import { sendLicenseEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Generate license key
    const licenseKey = await generateLicenseKey();

    // Calculate expiration (1 year from now)
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    // Create license in database
    await fetch(`${process.env.SUPABASE_URL}/functions/v1/activate_license`, {
      method: 'POST',
      headers: {
        'Authorization': process.env.EDGE_FUNCTION_SECRET!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: licenseKey,
        user_id: session.metadata?.user_id || null,
        expires_at: expiresAt.toISOString(),
      }),
    });

    // Email license key to customer
    await sendLicenseEmail(session.customer_email!, licenseKey);
  }

  return NextResponse.json({ received: true });
}
```

#### Step 4.6: Add Subscribe Button

In your marketing site, add a button that triggers Stripe checkout:

```typescript
'use client';

import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function SubscribeButton() {
  const handleSubscribe = async () => {
    const stripe = await stripePromise;

    // Call your create_payment_session edge function
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
    });

    const { sessionId } = await response.json();

    // Redirect to Stripe checkout
    await stripe?.redirectToCheckout({ sessionId });
  };

  return (
    <button onClick={handleSubscribe}>
      Subscribe - $5/month
    </button>
  );
}
```

---

### Phase 5: Testing & Deployment

#### Test Checklist

- [ ] **Payment Flow**
  - [ ] User can click Subscribe button
  - [ ] Redirects to Stripe checkout
  - [ ] Can complete test payment (use test card: 4242 4242 4242 4242)
  - [ ] Webhook receives event
  - [ ] License created in database
  - [ ] Email received with license key

- [ ] **License Activation**
  - [ ] Enter license key in Electron app
  - [ ] License validates successfully
  - [ ] Machine ID bound correctly
  - [ ] license.json file created

- [ ] **Machine Binding**
  - [ ] Try same license on another machine → should fail
  - [ ] Original machine still works

- [ ] **Signature Verification**
  - [ ] Manually edit license.json → should fail validation
  - [ ] Invalid signature rejected

- [ ] **Offline Mode**
  - [ ] Disconnect internet
  - [ ] App still validates license locally
  - [ ] Reconnect → online validation works

- [ ] **Expiration**
  - [ ] Create test license with past expiration
  - [ ] Should be rejected

#### Production Deployment

1. **Stripe Webhook Setup**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://yoursite.com/api/webhooks/stripe`
   - Select event: `checkout.session.completed`
   - Copy webhook secret to environment variables

2. **Environment Variables**
   - Set all production secrets
   - Update SUPABASE_URL to production
   - Use production Stripe keys

3. **Test with Real Payment**
   - Use real credit card (charge yourself $1)
   - Verify full flow works end-to-end

---

## 📋 ENVIRONMENT VARIABLES REFERENCE

### Next.js (marketing-site/.env.local)

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# Edge Functions
EDGE_FUNCTION_SECRET=abc123...

# Email
RESEND_API_KEY=re_...
```

### Supabase Secrets

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set LICENSE_PRIVATE_KEY=MC4CAQAwBQYDK2VwBCIEI...
supabase secrets set EDGE_FUNCTION_SECRET=abc123...
supabase secrets set SUPABASE_URL=https://xxxxx.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
supabase secrets set SITE_URL=https://yoursite.com
```

### Electron (src/main/constants.ts)

```typescript
// ✅ Current configuration
export const SUPABASE_URL = 'https://buqkvxtxjwyohzsogfbz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K';

// TODO: Generate these (see Phase 1)
export const PUBLIC_LICENSE_KEY = "...";
export const EDGE_FUNCTION_SECRET = "...";
```

---

## 🔍 TROUBLESHOOTING

### License Validation Fails

**Check:**
1. Is license.json in correct location?
2. Does machine_id match current machine?
3. Is license expired?
4. Is signature valid?
5. Can app reach Supabase edge function?

**Debug:**
```typescript
// Add logging in AppStore.ts
console.log('License path:', licensePath);
console.log('Current machine ID:', currentMachineId);
console.log('License machine ID:', machine_id);
console.log('Signature valid:', signatureValid);
```

### Webhook Not Firing

**Check:**
1. Webhook URL correct in Stripe dashboard?
2. Webhook secret matches environment variable?
3. Event type is `checkout.session.completed`?

**Debug:**
- Check Stripe dashboard → Webhooks → Logs
- Add logging in webhook handler
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Email Not Sending

**Check:**
1. Resend API key valid?
2. Domain verified in Resend?
3. Email address format correct?

**Debug:**
- Test email manually: https://resend.com/docs/send-with-nextjs
- Check Resend dashboard for delivery logs

---

## 📚 RESOURCES

- **Stripe Docs:** https://stripe.com/docs
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **Ed25519 Signatures:** https://ed25519.cr.yp.to/
- **node-machine-id:** https://www.npmjs.com/package/node-machine-id
- **Resend:** https://resend.com/docs

---

## ✅ SUMMARY

This system provides:

✅ **Secure payment processing** via Stripe
✅ **Machine-locked licenses** prevent sharing
✅ **Ed25519 signatures** prevent tampering
✅ **Offline validation** with online fallback
✅ **Automatic re-validation** every 5 hours
✅ **Simple license key format** (incrementing numbers)
✅ **Email delivery** via Resend

**Proven, production-ready pattern** - Used successfully in real-world apps.
