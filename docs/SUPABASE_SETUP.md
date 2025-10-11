# Supabase Configuration Guide

**Project ID:** `buqkvxtxjwyohzsogfbz`
**Project URL:** `https://buqkvxtxjwyohzsogfbz.supabase.co`

**Last Updated:** 2025-10-11

**Status:** ✅ API Keys Created

This document explains how to configure Supabase API keys for Mic2Text using the **new API key system** (recommended as of 2025).

---

## ✅ Your Configuration

**Publishable Key:** `sb_publishable_Sv-CJRRoKcvmhTyXuD9j6Q_8HXoZt0K`
**Secret Key:** `sb_secret_4cq3MdbcoyxxsCUHuf_hTw_yXL-hFPq`

These keys have been added to:
- ✅ `marketing-site/.env.local` (Next.js)
- ✅ `src/main/constants.ts` (Electron)

**Next Steps:** Continue with Phase 1 of payment integration (generate Ed25519 keys).

---

## 🔑 API Key System (2025)

Supabase is transitioning from legacy JWT-based keys to a new system. Since you're starting fresh, **use the new keys from the beginning**.

### Key Types

#### 1. Publishable Key (`sb_publishable_...`)

**Purpose:** Client-side applications
- ✅ Safe to expose in code, GitHub, apps
- ✅ Respects Row Level Security (RLS)
- ✅ Low privileges

**Use in:**
- Electron app (client-side)
- Next.js frontend pages
- Mobile/desktop apps
- CLIs

#### 2. Secret Key (`sb_secret_...`)

**Purpose:** Backend/server-side only
- ❌ NEVER expose publicly
- ⚠️ Bypasses Row Level Security
- ⚠️ Full data access

**Use in:**
- Supabase Edge Functions
- Next.js API routes (webhooks)
- Backend servers
- Admin tools

---

## 🛠️ Setup Instructions

### Step 1: Create API Keys in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/buqkvxtxjwyohzsogfbz/settings/api
2. Click **"Create API Key"** under the new "API Keys" section
3. Create two keys:
   - **Publishable key** (for client-side)
   - **Secret key** (for backend)

### Step 2: Store Keys in Environment Variables

#### For Next.js (marketing-site/.env.local)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://buqkvxtxjwyohzsogfbz.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

# Backend only (NEVER use NEXT_PUBLIC_ prefix for secrets!)
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_PROJECT_ID=buqkvxtxjwyohzsogfbz

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Edge Functions
EDGE_FUNCTION_SECRET=abc123...

# Email
RESEND_API_KEY=re_...
```

#### For Electron App (src/main/constants.ts)

```typescript
// Supabase Configuration
export const SUPABASE_URL = 'https://buqkvxtxjwyohzsogfbz.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_...'; // Safe to hardcode

// License validation
export const PUBLIC_LICENSE_KEY = 'MCowBQYDK2VwAyEA...'; // From key generation
export const EDGE_FUNCTION_SECRET = 'abc123...';
```

#### For Supabase Edge Functions (Secrets)

```bash
# Set these via Supabase CLI
supabase secrets set SUPABASE_URL=https://buqkvxtxjwyohzsogfbz.supabase.co
supabase secrets set SUPABASE_SECRET_KEY=sb_secret_...
supabase secrets set EDGE_FUNCTION_SECRET=abc123...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set LICENSE_PRIVATE_KEY=MC4CAQAwBQYDK2VwBCIEI...
supabase secrets set SITE_URL=https://yoursite.com
```

### Step 3: Update Code to Use New Keys

#### Next.js Client (Frontend)

```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
```

#### Next.js Server (API Routes/Webhooks)

```typescript
// lib/supabase/server.ts
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!, // Backend only!
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
```

#### Electron App

```typescript
// src/main/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './constants';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
```

#### Edge Functions

```typescript
// supabase/functions/_shared/supabase.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SECRET_KEY')!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 🔒 Security Best Practices

### ✅ DO:

- **Use publishable keys in client-side code** (Electron, frontend)
- **Use secret keys only in secure backends** (API routes, Edge Functions)
- **Enable Row Level Security (RLS) on all tables**
- **Store secret keys in environment variables**
- **Use `.env.local` for local development** (add to `.gitignore`)
- **Use Supabase secrets for Edge Functions**

### ❌ DON'T:

- ❌ **Never commit secret keys to Git**
- ❌ **Never use secret keys in browser/client-side code**
- ❌ **Never hardcode secret keys in source code**
- ❌ **Never use `NEXT_PUBLIC_` prefix for secret keys**
- ❌ **Never disable RLS without a very good reason**

---

## 🧪 Testing Your Setup

### Test Publishable Key (Client-Side)

```typescript
import { supabase } from './lib/supabase/client';

// This should work with publishable key (respects RLS)
const { data, error } = await supabase
  .from('licenses')
  .select('*')
  .eq('key', '12345');

console.log('Client query result:', data);
```

### Test Secret Key (Server-Side)

```typescript
import { supabaseAdmin } from './lib/supabase/server';

// This should work with secret key (bypasses RLS)
const { data, error } = await supabaseAdmin
  .from('licenses')
  .select('*');

console.log('Admin query result:', data);
```

### Verify Keys are Correct Type

```bash
# Publishable key should start with:
sb_publishable_...

# Secret key should start with:
sb_secret_...

# If yours start with "eyJ..." they're legacy JWT keys
# (still work, but migrate when possible)
```

---

## 🔄 Migration from Legacy Keys (If Needed)

If you started with legacy keys (`anon`, `service_role`), here's how to migrate:

### 1. Create New Keys
- Go to Supabase dashboard → API Keys
- Create publishable and secret keys

### 2. Update Environment Variables
- Replace `SUPABASE_ANON_KEY` → `SUPABASE_PUBLISHABLE_KEY`
- Replace `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY`

### 3. Update Code
- No changes needed! `createClient()` API is the same
- Just pass the new key values

### 4. Test Thoroughly
- Verify client-side queries work
- Verify backend operations work
- Check Edge Functions still work

### 5. Delete Legacy Keys (Optional)
- After migration is complete and tested
- Remove old keys from dashboard

---

## 📋 Quick Reference

### Project Info
```
Project ID:    buqkvxtxjwyohzsogfbz
Project URL:   https://buqkvxtxjwyohzsogfbz.supabase.co
API Endpoint:  https://buqkvxtxjwyohzsogfbz.supabase.co/rest/v1
```

### Key Locations

| Key | Location | Environment Variable |
|-----|----------|---------------------|
| **Publishable** | Client-side | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| **Secret** | Server-side | `SUPABASE_SECRET_KEY` |
| **URL** | Everywhere | `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` |

### Common Issues

**Issue:** "401 Unauthorized" when using secret key in browser
**Solution:** Secret keys don't work in browsers. Use publishable key instead.

**Issue:** "Row Level Security policy violation"
**Solution:** Ensure RLS policies are set up correctly, or use secret key in backend.

**Issue:** Edge Functions can't access data
**Solution:** Check that `SUPABASE_SECRET_KEY` is set in Supabase secrets.

---

## 📚 Resources

- **API Keys Docs:** https://supabase.com/docs/guides/api/api-keys
- **Row Level Security:** https://supabase.com/docs/guides/database/postgres/row-level-security
- **Edge Functions:** https://supabase.com/docs/guides/functions
- **Migration Discussion:** https://github.com/orgs/supabase/discussions/29260

---

## ✅ Next Steps

After setting up keys:

1. [ ] Create publishable key in Supabase dashboard
2. [ ] Create secret key in Supabase dashboard
3. [ ] Add keys to `.env.local` (Next.js)
4. [ ] Add keys to `constants.ts` (Electron)
5. [ ] Set secrets for Edge Functions
6. [ ] Test client-side queries
7. [ ] Test server-side queries
8. [ ] Verify Edge Functions work
9. [ ] Continue with Phase 1 of payment integration

---

**Remember:** This is a fresh start, so use the **new key system** from the beginning. You're future-proofed! 🚀
