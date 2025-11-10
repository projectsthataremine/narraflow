# Supabase Edge Functions

This directory contains all Supabase Edge Functions for the Clipp application.

## Quick Start

**Deploy dev changes to production:**
```bash
./supabase/deploy-prod.sh
```

**Or do it manually:**
```bash
# 1. Sync dev to prod
./supabase/sync-dev-to-prod.sh

# 2. Review changes
git diff

# 3. Deploy
npx supabase functions deploy
```

## Architecture Overview

We maintain **separate dev and production edge functions** for security and environment isolation:

- **Dev functions** (e.g., `create-checkout-session-dev`): Use Stripe test mode, test webhooks, and dev environment variables
- **Production functions** (e.g., `create-checkout-session`): Use Stripe live mode, production webhooks, and prod environment variables

### Why Separate Functions?

Using separate functions instead of environment flags provides:
- ✅ **Security**: No risk of flag manipulation to access dev/test modes in production
- ✅ **Environment Isolation**: Clear separation between test and live Stripe data
- ✅ **Safe Testing**: Can test in dev without affecting production
- ✅ **No Cross-Contamination**: Dev webhooks call dev functions, prod webhooks call prod functions

## Edge Function Pairs

| Dev Function | Production Function | Purpose |
|-------------|---------------------|---------|
| `create-checkout-session-dev` | `create-checkout-session` | Create Stripe checkout sessions |
| `create-customer-portal-dev` | `create-customer-portal` | Create Stripe customer portal sessions |
| `create_stripe_trial-dev` | `create_stripe_trial` | Create trial subscriptions |
| `stripe-webhook-dev` | `stripe-webhook` | Handle Stripe webhook events |
| `assign_license_to_machine-dev` | `assign_license_to_machine` | Assign license to machine |
| `revoke_license_from_machine-dev` | `revoke_license_from_machine` | Revoke license from machine |
| `validate_license-dev` | `validate_license` | Validate license keys |

## Development Workflow

### 1. Work on Dev Functions

Make all your changes to the `-dev` versions of functions:

```bash
# Example: Edit the dev version
code supabase/functions/create-checkout-session-dev/index.ts
```

### 2. Test Locally

```bash
# Start Supabase locally
npx supabase start

# Serve a specific function
npx supabase functions serve create-checkout-session-dev

# Test with curl or your app
```

### 3. Deploy Dev Functions

```bash
# Deploy a specific dev function
npx supabase functions deploy create-checkout-session-dev

# Or deploy all functions
npx supabase functions deploy
```

### 4. Sync Dev to Production (Option A: Manual)

When your dev functions are tested and ready for production:

```bash
# Run the sync script
./supabase/sync-dev-to-prod.sh
```

This script will:
- Copy all dev function code to production versions
- Automatically replace environment variable names:
  - `STRIPE_SECRET_KEY_DEV` → `STRIPE_SECRET_KEY_PROD`
  - `STRIPE_PRICE_ID_DEV` → `STRIPE_PRICE_ID_PROD`
  - `STRIPE_WEBHOOK_SECRET_DEV` → `STRIPE_WEBHOOK_SECRET_PROD`
- Preserve all business logic

### 5. Review and Deploy to Production

```bash
# Review the changes
git diff

# Deploy to production
npx supabase functions deploy

# Or deploy specific functions
npx supabase functions deploy create-checkout-session
npx supabase functions deploy stripe-webhook
```

### Option B: One-Command Deployment

For a streamlined workflow, use the all-in-one deployment script:

```bash
# Sync and deploy in one command
./supabase/deploy-prod.sh
```

This script will:
1. Run the sync script
2. Show you a git diff of changes
3. Ask for confirmation
4. Deploy all functions to production

## Environment Variables

Set these in the Supabase Dashboard under Project Settings → Edge Functions → Secrets:

### Development Environment Variables
```
STRIPE_SECRET_KEY_DEV=sk_test_...
STRIPE_PRICE_ID_DEV=price_test_...
STRIPE_WEBHOOK_SECRET_DEV=whsec_test_...
```

### Production Environment Variables
```
STRIPE_SECRET_KEY_PROD=sk_live_...
STRIPE_PRICE_ID_PROD=price_live_...
STRIPE_WEBHOOK_SECRET_PROD=whsec_live_...
```

### Shared Environment Variables
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

## Quick Reference

### Deploy Individual Function
```bash
npx supabase functions deploy <function-name>
```

### Deploy All Functions
```bash
npx supabase functions deploy
```

### View Function Logs
```bash
npx supabase functions logs <function-name>
```

### Delete a Function
```bash
npx supabase functions delete <function-name>
```

## Adding a New Function

When adding a new function that needs dev/prod separation:

1. **Create the dev version first**:
   ```bash
   npx supabase functions new my-new-function-dev
   ```

2. **Implement your logic** in the dev version using `_DEV` environment variables

3. **Test thoroughly** in development

4. **Run the sync script** to create the production version:
   ```bash
   ./supabase/sync-dev-to-prod.sh
   ```

5. **Update the sync script** if needed by adding your new function pair to the `FUNCTION_PAIRS` array

## Troubleshooting

### Sync script shows "Dev function not found"
- Ensure the dev function directory exists
- Check the function name in the `FUNCTION_PAIRS` array in `sync-dev-to-prod.sh`

### Environment variables not working
- Verify they're set in Supabase Dashboard (Project Settings → Edge Functions → Secrets)
- Variables are not local - they must be set in the Supabase cloud project

### Function deployment fails
- Check function logs: `npx supabase functions logs <function-name>`
- Ensure all imports are valid (use JSR or ESM imports)
- Verify Deno compatibility

## Security Notes

- **Never commit** Stripe secret keys or webhook secrets to git
- **Always use** environment variables for sensitive data
- **Test in dev** before deploying to production
- **Review changes** with `git diff` before deploying production functions
- **Dev and prod** functions should only differ in environment variable names

## Further Reading

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Runtime Documentation](https://deno.land/manual)
- [Stripe API Documentation](https://stripe.com/docs/api)
