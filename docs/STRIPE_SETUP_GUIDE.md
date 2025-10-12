# Stripe Setup Guide for Mic2Text

**Date:** 2025-01-15
**Status:** Test Mode (Sandbox)

---

## ✅ COMPLETED SETUP

### 1. Stripe Account Created
- **Mode:** Test Mode (Sandbox)
- **Test Keys Configured:**
  - Publishable Key: `pk_test_51SHBFrHpI1gAFVtQWB662peTnSqZ5dfYw1qHAp6lvfNjLXnXTNXHRus9GrYUrW6LPTpoUd7V1zf3WBuiF8z67r7g00bZyMKWt1`
  - Secret Key: `sk_test_51SHBFrHpI1gAFVtQQ2lyWK9ffqrzh1QQtXtC7EmQqI1DjbBPaUcgMA3Ja8xJGDNzyW4rZJ6fMb6kJp4Awt8nmZXH008voFdqgG`

### 2. Code Implementation Complete
- ✅ Stripe SDK installed (`npm install stripe`)
- ✅ UUID license generator created (`lib/license-generator.ts`)
- ✅ Webhook handler implemented (`app/api/webhooks/stripe/route.ts`)
- ✅ Environment variables configured (`.env.local`)

---

## 🔄 NEXT STEPS

### Step 1: Create Product in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/products
2. Click "Add product"
3. Configure:
   - **Name:** Mic2Text Pro License
   - **Description:** 1-year license for Mic2Text desktop app
   - **Pricing:**
     - Type: One-time payment (or Recurring if subscription)
     - Price: $XX.XX (your choice)
     - Currency: USD
4. Click "Save product"
5. **Copy the Price ID** (looks like `price_xxxxxxxxxxxxx`)

### Step 2: Start Development Server

```bash
cd marketing-site
npm run dev
```

Your webhook will be available at: `http://localhost:3000/api/webhooks/stripe`

### Step 3: Set Up Stripe CLI for Local Testing

Install Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
```

Login to Stripe:
```bash
stripe login
```

Forward webhooks to your local server:
```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

This command will output a webhook signing secret that looks like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copy this secret** and update your `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 4: Test the Webhook

In a new terminal, trigger a test checkout session:
```bash
stripe trigger checkout.session.completed
```

**Expected behavior:**
1. Webhook fires
2. UUID license key generated
3. License created in Supabase `licenses` table
4. Console shows: `License created successfully: <uuid>`

### Step 5: Verify License Creation

Check Supabase dashboard:
1. Go to https://supabase.com/dashboard/project/buqkvxtxjwyohzsogfbz/editor
2. Open `licenses` table
3. Verify new license exists with:
   - `key`: UUID format
   - `status`: 'pending'
   - `stripe_session_id`: session ID from test
   - `customer_email`: test email
   - `expires_at`: ~1 year from now

---

## 🚀 PRODUCTION DEPLOYMENT

### When Ready to Go Live:

1. **Switch to Live Mode in Stripe:**
   - Get live API keys from https://dashboard.stripe.com/apikeys
   - Update `.env.local` with live keys (remove `_test_` prefix)

2. **Deploy Marketing Site:**
   ```bash
   # Deploy to Vercel/Netlify/etc.
   # Your webhook URL will be: https://yourdomain.com/api/webhooks/stripe
   ```

3. **Create Production Webhook in Stripe:**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to listen for: `checkout.session.completed`
   - Copy the webhook signing secret
   - Update production environment with: `STRIPE_WEBHOOK_SECRET=whsec_...`

4. **Test Live Payment:**
   - Use real credit card
   - Complete checkout
   - Verify license created in production database

---

## 🧪 TESTING CHECKLIST

- [ ] Local webhook receives test events
- [ ] UUID license key generated successfully
- [ ] License saved to Supabase with correct data
- [ ] Idempotency works (same webhook twice = only one license)
- [ ] Error handling logs properly
- [ ] Edge function authentication works

---

## 📊 WEBHOOK PAYLOAD EXAMPLE

When a customer completes checkout, Stripe sends this payload:

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_xxxxx",
      "customer": "cus_xxxxx",
      "customer_email": "user@example.com",
      "metadata": {
        "user_id": "optional-uuid"
      },
      "payment_status": "paid"
    }
  }
}
```

Our webhook handler:
1. Verifies signature
2. Generates UUID license key
3. Calls `activate_license` edge function
4. Returns 200 to Stripe

---

## 🔍 DEBUGGING

### Check Webhook Logs

Stripe Dashboard:
https://dashboard.stripe.com/test/webhooks

Local logs:
```bash
# In webhook handler
console.log('Processing checkout session:', session.id);
console.log('Generated license key:', licenseKey);
```

Supabase logs:
```bash
# Check edge_function_logs table
SELECT * FROM edge_function_logs
WHERE function_name = 'activate_license'
ORDER BY created_at DESC;
```

### Common Issues

**Issue:** Webhook signature verification fails
- **Fix:** Make sure `STRIPE_WEBHOOK_SECRET` matches the one from Stripe CLI

**Issue:** License not created
- **Fix:** Check edge function logs for errors
- Verify `EDGE_FUNCTION_SECRET` is set correctly
- Ensure Supabase secrets are configured

**Issue:** Duplicate licenses created
- **Fix:** Should not happen - idempotency check prevents this
- If it does, check `stripe_session_id` unique constraint

---

## 📚 NEXT: Create Account Page

After webhook is working, create an account page where users can:
1. See their license key after payment
2. Copy license key to clipboard
3. Instructions for activating in Electron app

See: `docs/PAYMENT_AND_LICENSING_INTEGRATION_V2.md` for account page design.
