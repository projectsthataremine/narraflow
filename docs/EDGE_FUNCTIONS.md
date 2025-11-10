# Edge Functions - Dev vs Production

## Overview
All edge functions now have separate dev and production versions that use different environment variables. Dev functions use Stripe test mode (SANDBOX), and production functions use Stripe live mode (PROD).

## Edge Functions List

### Stripe-Related (PRODUCTION)
- `stripe-webhook` - Uses `STRIPE_SECRET_KEY_PROD`, `STRIPE_WEBHOOK_SECRET_PROD`
  - Handles subscription lifecycle events
  - Creates licenses on trial start and checkout completion
  - Manages subscription cancellation and reactivation
  - Updates renews_at field for active subscriptions
- `create-checkout-session` - Uses `STRIPE_SECRET_KEY_PROD`, `STRIPE_PRICE_ID_PROD`
  - Creates Stripe checkout sessions for monthly/annual subscriptions
- `create-customer-portal` - Uses `STRIPE_SECRET_KEY_PROD`
  - Opens Stripe customer portal for managing subscriptions
- `create_stripe_trial` - Uses `STRIPE_SECRET_KEY_PROD`, `STRIPE_PRICE_ID_PROD`
  - Creates trial subscriptions

### Stripe-Related (DEVELOPMENT/SANDBOX)
- `stripe-webhook-dev` - Uses `STRIPE_SECRET_KEY_SANDBOX`, `STRIPE_WEBHOOK_SECRET_SANDBOX`
  - Same functionality as production webhook, uses Stripe test mode
- `create-checkout-session-dev` - Uses `STRIPE_SECRET_KEY_SANDBOX`, `STRIPE_PRICE_ID_SANDBOX`
  - Same functionality as production, uses Stripe test mode
- `create-customer-portal-dev` - Uses `STRIPE_SECRET_KEY_SANDBOX`
  - Same functionality as production, uses Stripe test mode
- `create_stripe_trial-dev` - Uses `STRIPE_SECRET_KEY_SANDBOX`, `STRIPE_PRICE_ID_SANDBOX`
  - Same functionality as production, uses Stripe test mode

### License-Related
**Note**: License functions share the same environment variables between dev and prod versions.

- `validate_license` / `validate_license-dev` - Uses `LICENSE_PRIVATE_KEY`, `EDGE_FUNCTION_SECRET`
  - Validates license keys and checks machine activation status
- `assign_license_to_machine` / `assign_license_to_machine-dev` - Uses `LICENSE_PRIVATE_KEY`
  - Assigns a license to a specific machine (stores machine_id in metadata)
- `revoke_license_from_machine` / `revoke_license_from_machine-dev` - Uses `LICENSE_PRIVATE_KEY`
  - Removes license from a machine (clears machine_id from metadata)
- `activate_license` - Uses `LICENSE_PRIVATE_KEY`
  - Activates a license key for a user

## Environment Variables Required

All these must be set in Supabase:

```bash
# Development/Sandbox (Stripe Test Mode)
STRIPE_SECRET_KEY_SANDBOX
STRIPE_PRICE_ID_SANDBOX
STRIPE_WEBHOOK_SECRET_SANDBOX

# Production (Stripe Live Mode)
STRIPE_SECRET_KEY_PROD
STRIPE_PRICE_ID_PROD
STRIPE_WEBHOOK_SECRET_PROD

# License-related (shared between dev and prod)
LICENSE_PRIVATE_KEY
LICENSE_PUBLIC_KEY
EDGE_FUNCTION_SECRET

# Supabase (automatically provided)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Stripe Webhook Configuration

### Important: Webhook Authentication
Stripe webhooks authenticate via signature verification, NOT JWT. In `supabase/config.toml`, both webhook functions must have:

```toml
[functions.stripe-webhook]
verify_jwt = false

[functions.stripe-webhook-dev]
verify_jwt = false
```

### Test Webhook (Stripe Test Mode)
- URL: `https://jijhacdgtccfftlangjq.supabase.co/functions/v1/stripe-webhook-dev`
- Events to listen for:
  - `customer.subscription.created` - Creates license for trial subscriptions
  - `customer.subscription.updated` - Handles renewals, cancellations, reactivations
  - `customer.subscription.deleted` - Handles immediate cancellations
  - `checkout.session.completed` - Creates license after successful checkout
- Get signing secret → Set as `STRIPE_WEBHOOK_SECRET_SANDBOX`

### Production Webhook (Stripe Live Mode)
- URL: `https://jijhacdgtccfftlangjq.supabase.co/functions/v1/stripe-webhook`
- Events: Same as above
- Get signing secret → Set as `STRIPE_WEBHOOK_SECRET_PROD`

## Webhook Behavior Details

### License Creation
- **Trial subscriptions**: License created on `customer.subscription.created` with status='trialing'
  - Sets `expires_at` to trial_end date
  - Sets `renews_at` to current_period_end
  - Status='pending' (not yet activated on a machine)

- **Paid subscriptions**: License created on `checkout.session.completed`
  - No `expires_at` (active subscription)
  - Sets `renews_at` to current_period_end
  - Status='pending' (not yet activated on a machine)

### Subscription Lifecycle
- **Cancellation** (`customer.subscription.updated` or `customer.subscription.deleted`):
  - Status → 'canceled'
  - `expires_at` → end of paid period (cancel_at or current_period_end)
  - `canceled_at` → now
  - `renews_at` → UNCHANGED (keeps original renewal date)

- **Reactivation** (`customer.subscription.updated` when previously canceled):
  - Status → 'active' or 'pending' (depending on if machine_id exists in metadata)
  - `expires_at` → null (cleared)
  - `canceled_at` → null (cleared)
  - `renews_at` → UNCHANGED (keeps original renewal date)

- **Renewal** (`customer.subscription.updated`):
  - Updates `renews_at` to new current_period_end
  - Status unchanged if active

## Managing Secrets

### Local Development with .env.secrets

Create a `.env.secrets` file in the project root to store all edge function secrets locally. This file is gitignored.

```bash
# .env.secrets
# DO NOT COMMIT THIS FILE

# Stripe (Production)
STRIPE_SECRET_KEY_PROD=sk_live_xxxxx
STRIPE_PRICE_ID_PROD=price_xxxxx
STRIPE_WEBHOOK_SECRET_PROD=whsec_xxxxx

# Stripe (Sandbox/Test Mode)
STRIPE_SECRET_KEY_SANDBOX=sk_test_xxxxx
STRIPE_PRICE_ID_SANDBOX=price_xxxxx
STRIPE_WEBHOOK_SECRET_SANDBOX=whsec_xxxxx

# Licensing (shared between dev and prod)
LICENSE_PRIVATE_KEY=base64_encoded_private_key
LICENSE_PUBLIC_KEY=base64_encoded_public_key
EDGE_FUNCTION_SECRET=random_secret_string
```

### Upload Secrets to Supabase

Use this script to upload all secrets from `.env.secrets` to Supabase:

```bash
#!/bin/bash
# scripts/upload-secrets.sh

# Load .env.secrets
if [ ! -f .env.secrets ]; then
  echo "Error: .env.secrets file not found"
  exit 1
fi

source .env.secrets

echo "Uploading secrets to Supabase..."

# Stripe Production
npx supabase secrets set STRIPE_SECRET_KEY_PROD="$STRIPE_SECRET_KEY_PROD"
npx supabase secrets set STRIPE_PRICE_ID_PROD="$STRIPE_PRICE_ID_PROD"
npx supabase secrets set STRIPE_WEBHOOK_SECRET_PROD="$STRIPE_WEBHOOK_SECRET_PROD"

# Stripe Sandbox
npx supabase secrets set STRIPE_SECRET_KEY_SANDBOX="$STRIPE_SECRET_KEY_SANDBOX"
npx supabase secrets set STRIPE_PRICE_ID_SANDBOX="$STRIPE_PRICE_ID_SANDBOX"
npx supabase secrets set STRIPE_WEBHOOK_SECRET_SANDBOX="$STRIPE_WEBHOOK_SECRET_SANDBOX"

# Licensing
npx supabase secrets set LICENSE_PRIVATE_KEY="$LICENSE_PRIVATE_KEY"
npx supabase secrets set LICENSE_PUBLIC_KEY="$LICENSE_PUBLIC_KEY"
npx supabase secrets set EDGE_FUNCTION_SECRET="$EDGE_FUNCTION_SECRET"

echo "✅ All secrets uploaded successfully!"
```

Make the script executable and run it:

```bash
chmod +x scripts/upload-secrets.sh
./scripts/upload-secrets.sh
```

### Verify Secrets

List all secrets currently set in Supabase:

```bash
npx supabase secrets list
```

### View Current Secrets

The actual secret values are not shown for security. To see which secrets are set:

```bash
npx supabase secrets list

# Output:
# EDGE_FUNCTION_SECRET
# LICENSE_PRIVATE_KEY
# LICENSE_PUBLIC_KEY
# STRIPE_PRICE_ID_PROD
# STRIPE_PRICE_ID_SANDBOX
# STRIPE_SECRET_KEY_PROD
# STRIPE_SECRET_KEY_SANDBOX
# STRIPE_WEBHOOK_SECRET_PROD
# STRIPE_WEBHOOK_SECRET_SANDBOX
# SUPABASE_SERVICE_ROLE_KEY (auto-provided)
# SUPABASE_URL (auto-provided)
```

### Unset a Secret

If you need to remove a secret:

```bash
npx supabase secrets unset SECRET_NAME
```

---

## Deployment

To deploy all functions:
```bash
npx supabase functions deploy
```

To deploy specific function:
```bash
npx supabase functions deploy stripe-webhook-dev
npx supabase functions deploy stripe-webhook
```
