# Supabase Setup Guide for Clipp

## Project Information
- **Project ID**: `jijhacdgtccfftlangjq`
- **Project URL**: `https://jijhacdgtccfftlangjq.supabase.co`
- **Anon Key**: Already configured in `.env` files

---

## Database Tables

### `licenses` Table

Stores all license keys and subscription information for users.

```sql
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,

  -- License key (UUID format)
  key TEXT NOT NULL UNIQUE,

  -- Stripe integration
  stripe_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,

  -- User information
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,

  -- License status
  status license_status NOT NULL DEFAULT 'active',
  -- Enum values: 'pending', 'active', 'canceled', 'expired'

  -- Machine binding (stored in metadata JSONB)
  metadata JSONB DEFAULT '{}',
  -- metadata.machine_id: Machine identifier
  -- metadata.machine_name: User-friendly machine name
  -- metadata.machine_os: Operating system

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,    -- When license was first activated on a machine
  expires_at TIMESTAMPTZ,       -- Only set when status='canceled' (end of paid period)
  renews_at TIMESTAMPTZ,        -- Billing period end from Stripe (never cleared)
  canceled_at TIMESTAMPTZ       -- When subscription was canceled
);

-- RLS enabled
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
```

**Key Points:**
- `expires_at` only set when subscription is canceled
- `renews_at` always represents the billing period end, never cleared
- Machine info stored in `metadata` JSONB, not separate columns
- Status transitions: `pending` → `active` → `canceled` → `expired`

---

### `edge_function_logs` Table

Logs all edge function calls for debugging and monitoring.

```sql
CREATE TABLE edge_function_logs (
  id BIGSERIAL PRIMARY KEY,

  -- Function identification
  function_name TEXT NOT NULL,
  event_type TEXT NOT NULL,

  -- Related entities
  license_key TEXT,
  machine_id TEXT,
  stripe_session_id TEXT,

  -- Request/response data
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,

  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  duration_ms INTEGER,
  success BOOLEAN NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS enabled
ALTER TABLE edge_function_logs ENABLE ROW LEVEL SECURITY;
```

**Purpose:** Track all edge function calls for debugging subscription webhooks, license validation, and activation.

---

### `contact_submissions` Table

Stores user feedback submitted from the Electron app.

```sql
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Submission type
  type TEXT NOT NULL CHECK (
    type IN ('bug', 'testimonial', 'feature', 'feedback', 'help', 'other')
  ),

  -- Content
  message TEXT NOT NULL,

  -- Additional data (email, user info, etc.)
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS enabled
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
```

**Purpose:** Collect user feedback, bug reports, and feature requests from within the app.

---

### `config` Table

Stores application configuration (pricing, trial duration, etc.).

```sql
CREATE TABLE config (
  id BIGSERIAL PRIMARY KEY,

  -- Config key (unique identifier)
  key TEXT NOT NULL UNIQUE,

  -- Config value (flexible JSONB)
  value JSONB NOT NULL,

  -- Description for documentation
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS enabled
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
```

**Current Config Values:**
- `pricing`: `{ "monthly_price": 2, "annual_price": 18 }`
- `trial_duration_days`: `{ "days": 7 }`
- `app_version`: `{ "version": "1.0.0" }`
- `breaking_version`: `{ "version": "1.0.0" }`

---

## Setup Steps

### 1. Database Migrations

All migrations are in `/supabase/migrations/`. To apply them:

```bash
# From project root
cd /Users/joshuaarnold/Dev/clipp

# Link to your Supabase project
npx supabase link --project-ref jijhacdgtccfftlangjq

# Apply all migrations
npx supabase db push
```

**Or manually via Supabase Dashboard:**
1. Go to https://supabase.com/dashboard/project/jijhacdgtccfftlangjq/editor
2. Open SQL Editor
3. Run each migration file in order

---

### 2. Configure Edge Function Environment Variables

See `EDGE_FUNCTIONS.md` for the complete list of environment variables and how to set them.

**Quick reference:**

```bash
# Stripe (Production)
STRIPE_SECRET_KEY_PROD
STRIPE_PRICE_ID_PROD
STRIPE_WEBHOOK_SECRET_PROD

# Stripe (Sandbox/Test Mode)
STRIPE_SECRET_KEY_SANDBOX
STRIPE_PRICE_ID_SANDBOX
STRIPE_WEBHOOK_SECRET_SANDBOX

# Licensing (shared between dev and prod)
LICENSE_PRIVATE_KEY
LICENSE_PUBLIC_KEY
EDGE_FUNCTION_SECRET

# Supabase (auto-provided)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

---

### 3. Deploy Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy specific functions:
npx supabase functions deploy stripe-webhook
npx supabase functions deploy stripe-webhook-dev
npx supabase functions deploy create-checkout-session
npx supabase functions deploy create-checkout-session-dev
npx supabase functions deploy create-customer-portal
npx supabase functions deploy create-customer-portal-dev
npx supabase functions deploy validate_license
npx supabase functions deploy validate_license-dev
npx supabase functions deploy assign_license_to_machine
npx supabase functions deploy assign_license_to_machine-dev
npx supabase functions deploy revoke_license_from_machine
npx supabase functions deploy revoke_license_from_machine-dev
npx supabase functions deploy activate_license
npx supabase functions deploy create_stripe_trial
npx supabase functions deploy create_stripe_trial-dev
```

---

### 4. Verify Setup

```sql
-- Check tables exist
SELECT table_name,
       row_security
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY table_name;

-- Should show:
-- config (rls: on)
-- contact_submissions (rls: on)
-- edge_function_logs (rls: on)
-- licenses (rls: on)

-- Check config values
SELECT key, value, description
FROM config
ORDER BY key;

-- Check license enum
SELECT enumlabel
FROM pg_enum
JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
WHERE pg_type.typname = 'license_status';
```

---

## Troubleshooting

### Check Migration Status

```bash
npx supabase migration list
```

### View Edge Function Logs

```bash
npx supabase functions logs stripe-webhook-dev
npx supabase functions logs stripe-webhook
```

### Common Issues

1. **Migration conflicts**: Run migrations in order, check `supabase/migrations/` directory
2. **Edge function 401 errors**: Check JWT verification settings in `supabase/config.toml`
3. **Stripe webhook failures**: Verify `verify_jwt = false` for webhook functions
4. **License activation fails**: Check `EDGE_FUNCTION_SECRET` matches between Supabase and Electron app

---

## Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/jijhacdgtccfftlangjq)
- [Edge Functions Documentation](EDGE_FUNCTIONS.md)
- [Licensing Documentation](LICENSING.md)
- [Supabase Docs](https://supabase.com/docs)
