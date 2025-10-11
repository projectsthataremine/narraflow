# Environment Setup Quick Reference

**Last Updated:** 2025-10-11

This is your quick reference for all environment variables and secrets across the Mic2Text project.

---

## 🎯 Current Status

### ✅ Completed
- [x] Supabase project created (`buqkvxtxjwyohzsogfbz`)
- [x] Publishable API key created
- [x] Secret API key created
- [x] Environment files created

### ⏳ To Do
- [ ] Generate Ed25519 key pair (for license signing)
- [ ] Create Stripe account and get API keys
- [ ] Set up Resend account and get API key
- [ ] Generate edge function secret
- [ ] Set Supabase secrets for edge functions

---

## 📋 Environment Variables by Component

### Next.js Marketing Site (`marketing-site/.env.local`)

```bash
# ✅ CONFIGURED
NEXT_PUBLIC_SUPABASE_URL=https://buqkvxtxjwyohzsogfbz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K
SUPABASE_SECRET_KEY=sb_secret_4cq3MdbcoyxxsCUHuf_hTw_yXL-hFPq
SUPABASE_PROJECT_ID=buqkvxtxjwyohzsogfbz

# ⏳ TODO: Get from Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# ⏳ TODO: Generate random secret (see below)
EDGE_FUNCTION_SECRET=...

# ⏳ TODO: Get from Resend
RESEND_API_KEY=re_...
```

**File Location:** `/Users/joshuaarnold/Dev/Mic2Text/marketing-site/.env.local`

**Security:** ✅ Already in `.gitignore` - safe from commits

---

### Electron App (`src/main/constants.ts`)

```typescript
// ✅ CONFIGURED
export const SUPABASE_URL = 'https://buqkvxtxjwyohzsogfbz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K';

// ⏳ TODO: Generate random secret (see below)
export const EDGE_FUNCTION_SECRET = '...';

// ⏳ TODO: Generate Ed25519 public key (see Phase 1)
export const PUBLIC_LICENSE_KEY = '...';
```

**File Location:** `/Users/joshuaarnold/Dev/Mic2Text/src/main/constants.ts`

**Security:** ⚠️ Publishable key is safe to commit, but edge function secret should be in environment variable

---

### Supabase Edge Functions (Secrets)

Set via Supabase CLI:

```bash
# ✅ AVAILABLE NOW
supabase secrets set SUPABASE_URL=https://buqkvxtxjwyohzsogfbz.supabase.co
supabase secrets set SUPABASE_SECRET_KEY=sb_secret_4cq3MdbcoyxxsCUHuf_hTw_yXL-hFPq
supabase secrets set SUPABASE_PROJECT_ID=buqkvxtxjwyohzsogfbz

# ⏳ TODO: Generate and set these
supabase secrets set EDGE_FUNCTION_SECRET=...
supabase secrets set LICENSE_PRIVATE_KEY=...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set SITE_URL=https://yoursite.com
```

**Set After:** You create each service account/key

---

## 🔨 How to Generate Missing Values

### 1. Generate Edge Function Secret

**What:** Random secret for authenticating edge function calls

**How:**
```bash
openssl rand -hex 32
```

**Where to Put:**
- `marketing-site/.env.local` → `EDGE_FUNCTION_SECRET=...`
- `src/main/constants.ts` → `export const EDGE_FUNCTION_SECRET = '...';`
- Supabase secrets → `supabase secrets set EDGE_FUNCTION_SECRET=...`

---

### 2. Generate Ed25519 Key Pair (License Signing)

**What:** Cryptographic keys for signing/verifying licenses

**How:**

Create `scripts/generate-license-keys.js`:
```javascript
const { subtle } = require("crypto").webcrypto;

async function generateKeys() {
  const keyPair = await subtle.generateKey("Ed25519", true, ["sign", "verify"]);

  const privateKey = await subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKey = await subtle.exportKey("spki", keyPair.publicKey);

  const privateKeyBase64 = Buffer.from(privateKey).toString("base64");
  const publicKeyBase64 = Buffer.from(publicKey).toString("base64");

  console.log("\n🔐 PRIVATE KEY (Supabase secrets):");
  console.log(privateKeyBase64);

  console.log("\n🔓 PUBLIC KEY (Electron constants.ts):");
  console.log(publicKeyBase64);
}

generateKeys();
```

Run: `node scripts/generate-license-keys.js`

**Where to Put:**
- Private key → Supabase secrets: `supabase secrets set LICENSE_PRIVATE_KEY=...`
- Public key → `src/main/constants.ts`: `export const PUBLIC_LICENSE_KEY = '...';`

---

### 3. Get Stripe API Keys

**What:** Keys for payment processing

**How:**
1. Sign up at https://stripe.com
2. Go to Dashboard → Developers → API keys
3. Copy:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`)
4. After creating webhook, get webhook secret (`whsec_...`)

**Where to Put:**
- `marketing-site/.env.local`
- Supabase secrets (secret key only)

---

### 4. Get Resend API Key

**What:** Email delivery service for license keys

**How:**
1. Sign up at https://resend.com
2. Create API key
3. Copy key (starts with `re_...`)

**Where to Put:**
- `marketing-site/.env.local` → `RESEND_API_KEY=...`

---

## 🚀 Quick Start Checklist

When starting development:

### First Time Setup
- [ ] Run `cd marketing-site && npm install`
- [ ] Verify `.env.local` exists in marketing-site
- [ ] Generate edge function secret
- [ ] Generate Ed25519 key pair
- [ ] Update `src/main/constants.ts` with keys
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Link to project: `supabase link --project-ref buqkvxtxjwyohzsogfbz`

### When Adding Payments
- [ ] Create Stripe account
- [ ] Add Stripe keys to `.env.local`
- [ ] Create Resend account
- [ ] Add Resend key to `.env.local`
- [ ] Set all Supabase secrets

### Before Deployment
- [ ] Double-check all secrets are set
- [ ] Verify `.env.local` is in `.gitignore`
- [ ] Never commit secret keys
- [ ] Use production keys (not test keys)

---

## 🔒 Security Checklist

- ✅ `.env.local` is in `.gitignore`
- ✅ Publishable keys are safe to commit (but we don't)
- ❌ Never commit secret keys
- ❌ Never commit private keys
- ❌ Never use `NEXT_PUBLIC_` for secrets
- ✅ Use environment variables for all secrets
- ✅ Different keys for development vs production

---

## 📞 Need Help?

- **Supabase Docs:** https://supabase.com/docs
- **Stripe Docs:** https://stripe.com/docs
- **Resend Docs:** https://resend.com/docs
- **Payment Integration Guide:** See `docs/PAYMENT_AND_LICENSING_INTEGRATION.md`
- **Supabase Setup:** See `docs/SUPABASE_SETUP.md`

---

## 🎯 Next Steps

**You are here:** ✅ Supabase configured with API keys

**Next:** Generate Ed25519 key pair for license signing

**Then:** Continue with Phase 1 of payment integration (see `PAYMENT_AND_LICENSING_INTEGRATION.md`)
