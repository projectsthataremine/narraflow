# Licensing

**Last Updated:** 2025-11-09
**Project:** Clipp

---

## 📋 Overview

This document explains how licenses and subscription renewals/cancellations work in Clipp, particularly focusing on the `expires_at` and `renews_at` logic.

---

## 🔑 Key Database Fields

### licenses Table Schema

```sql
CREATE TABLE licenses (
  id BIGSERIAL PRIMARY KEY,

  -- License identification
  key TEXT NOT NULL UNIQUE,

  -- Stripe integration
  stripe_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_subscription_status TEXT,

  -- User tracking
  user_id UUID REFERENCES auth.users(id),
  customer_email TEXT NOT NULL,

  -- Machine binding (stored in JSONB metadata)
  metadata JSONB DEFAULT '{}',
  -- metadata.machine_id - Machine identifier
  -- metadata.machine_name - User-friendly machine name
  -- metadata.machine_os - Operating system

  -- License lifecycle
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'canceled', 'revoked', 'expired', 'trialing')),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,     -- Only set when status='canceled' (end of paid period)
  renews_at TIMESTAMPTZ,       -- Set from Stripe current_period_end (stays set during cancellation!)
  activated_at TIMESTAMPTZ,    -- When user first activated
  canceled_at TIMESTAMPTZ,     -- When subscription was canceled
  last_validated_at TIMESTAMPTZ
);
```

---

## 🎯 Important Field Distinctions

### `expires_at` vs `renews_at`

| Field | Purpose | When Set | Example |
|-------|---------|----------|---------|
| `expires_at` | Final expiration date when subscription is canceled | Only when `status='canceled'` | User cancels on Nov 1, but paid until Nov 30 → `expires_at = Nov 30` |
| `renews_at` | The current billing period end date | Set from Stripe's `current_period_end` and **NEVER CLEARED** | All subscriptions → `renews_at = Dec 1` |

**Key Concept:**
- **Active subscription:** `expires_at = null`, `renews_at = <period end date>`
- **Canceled subscription:** `expires_at = <end of paid period>`, `renews_at = <SAME period end date>`

**CRITICAL: `renews_at` is NEVER cleared during cancellation or reactivation. It always represents the current billing period end, regardless of subscription status.**

---

## 📊 License Status Lifecycle

```
trialing → pending → active → canceled → expired
   ↓          ↓        ↓         ↓
   └──────────┴────────┴─────────┴──→ revoked (admin action)
```

### Status Definitions

1. **`trialing`** - Trial subscription created, not yet activated on a machine (has `expires_at` set to trial_end)
2. **`pending`** - License created from paid subscription, not yet activated on a machine
3. **`active`** - License activated on a machine and subscription is active
4. **`canceled`** - User canceled but still has access until `expires_at`
5. **`expired`** - The `expires_at` date has passed
6. **`revoked`** - Manually revoked by admin (chargeback, fraud, etc.)

---

## 🔄 Subscription Webhook Logic

### 0. Trial Subscription Created (`customer.subscription.created`)

**Triggered when:** User starts a trial subscription (status='trialing')

```typescript
// When user starts trial (e.g., from marketing site)
if (subscription.status === 'trialing') {
  await supabaseClient
    .from('licenses')
    .insert({
      key: generateLicenseKey(),
      user_id: subscription.metadata?.user_id || null,
      customer_email: customerEmail,
      expires_at: new Date(subscription.trial_end * 1000).toISOString(),  // Trial end date
      renews_at: new Date(subscription.current_period_end * 1000).toISOString(),
      stripe_customer_id: subscription.customer,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      status: 'pending'  // Not yet activated on a machine
    });
}
```

**Result in Database:**
```json
{
  "key": "uuid-xxxx",
  "customer_email": "user@example.com",
  "expires_at": "2025-11-16T00:00:00Z",  // Trial ends in 7 days
  "renews_at": "2025-11-16T00:00:00Z",    // Would renew here if not canceled
  "status": "pending",
  "stripe_subscription_status": "trialing"
}
```

---

### 1. Paid Subscription Created (`checkout.session.completed`)

**Triggered when:** User completes Stripe checkout (monthly or annual subscription)

```typescript
// Retrieve subscription from checkout session
const subscription = await stripe.subscriptions.retrieve(session.subscription);

await supabaseClient
  .from('licenses')
  .insert({
    key: generateLicenseKey(),
    user_id: session.metadata?.user_id || null,
    customer_email: customerEmail,
    expires_at: null,  // No expiration - active subscription
    renews_at: new Date(subscription.current_period_end * 1000).toISOString(),
    stripe_session_id: session.id,
    stripe_customer_id: session.customer,
    stripe_subscription_id: session.subscription,
    status: 'pending'  // Not yet activated on a machine
  });
```

**Result in Database:**
```json
{
  "key": "uuid-xxxx",
  "customer_email": "user@example.com",
  "expires_at": null,                      // ✅ No expiration
  "renews_at": "2025-12-09T00:00:00Z",     // ✅ Next billing date
  "status": "pending",
  "stripe_subscription_status": "active"
}
```

---

### 2. User Cancels Mid-Period (`customer.subscription.updated` or `customer.subscription.deleted`)

**Triggered when:** User cancels their subscription via Stripe Customer Portal or immediate deletion

**Example Timeline:**
- User pays for November on Nov 1
- User cancels on Nov 15
- Stripe sets `cancel_at = Nov 30 23:59:59` (end of paid period)
- License should work until Nov 30, then expire

**Webhook Logic:**

```typescript
// Determine if should cancel
const shouldCancel =
  subscription.status === 'canceled' ||
  subscription.status === 'unpaid' ||
  subscription.cancel_at !== null;

if (shouldCancel) {
  // Calculate expiration date
  let expirationDate;
  if (event.type === 'customer.subscription.deleted') {
    // Immediate cancellation
    expirationDate = subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : new Date().toISOString();
  } else {
    // Scheduled cancellation
    expirationDate = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000).toISOString()
      : subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : new Date().toISOString();
  }

  // Update license
  await supabaseClient
    .from('licenses')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      expires_at: expirationDate,
      stripe_subscription_status: subscription.status
      // ⚠️ DO NOT TOUCH renews_at - it stays the same!
    })
    .eq('stripe_customer_id', subscription.customer);
}
```

**Result in Database:**
```json
{
  "status": "canceled",
  "canceled_at": "2025-11-15T10:30:00Z",
  "expires_at": "2025-11-30T23:59:59Z",  // ✅ Can use until this date
  "renews_at": "2025-11-30T23:59:59Z",   // ✅ UNCHANGED from original value
  "stripe_subscription_status": "canceled"
}
```

**CRITICAL:** `renews_at` is NOT cleared during cancellation. It represents the billing period end and stays set.

---

### 3. User Reactivates Subscription (`customer.subscription.updated`)

**Triggered when:** User reactivates a previously canceled subscription via Stripe Customer Portal. Stripe clears `cancel_at` when this happens.

**Webhook Logic:**

```typescript
// First, get current license state
const { data: currentLicenses } = await supabaseClient
  .from('licenses')
  .select('status, metadata')
  .eq('stripe_customer_id', subscription.customer)
  .limit(1);

const currentLicense = currentLicenses?.[0];
const isCurrentlyCanceled = currentLicense?.status === 'canceled';

// Detect reactivation: was canceled in DB, but Stripe now shows active
const shouldCancel =
  subscription.status === 'canceled' ||
  subscription.status === 'unpaid' ||
  subscription.cancel_at !== null;

const shouldReactivate = isCurrentlyCanceled && !shouldCancel;

if (shouldReactivate) {
  // Check if license was ever activated on a machine (check metadata.machine_id)
  const hasBeenActivated =
    currentLicense?.metadata?.machine_id !== undefined &&
    currentLicense?.metadata?.machine_id !== null;
  const newStatus = hasBeenActivated ? 'active' : 'pending';

  await supabaseClient
    .from('licenses')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      status: newStatus,
      expires_at: null,   // ✅ Clear expiration
      canceled_at: null   // ✅ Clear cancel timestamp
      // ⚠️ DO NOT TOUCH renews_at - it stays the same!
    })
    .eq('stripe_customer_id', subscription.customer);
}
```

**Result in Database:**
```json
{
  "status": "active",
  "canceled_at": null,
  "expires_at": null,                    // ✅ Cleared - no longer expiring
  "renews_at": "2025-11-30T23:59:59Z",   // ✅ UNCHANGED from original value
  "stripe_subscription_status": "active"
}
```

**CRITICAL:** `renews_at` is NOT modified during reactivation. It stays at its original value.

---

## 🖥️ How to Display on Account Page

### Current Implementation Issues

The current account page needs updating to properly show:
1. **Active subscriptions:** Show "Renews on {renews_at}"
2. **Canceled subscriptions:** Show "Expires on {expires_at}"

### Correct Display Logic

```typescript
{license.status === 'canceled' && license.expires_at ? (
  <RadixUI.Flex align="center" gap="2">
    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <RadixUI.Text size="2" color="gray">
      Expires {new Date(license.expires_at).toLocaleDateString()}
    </RadixUI.Text>
  </RadixUI.Flex>
) : license.renews_at ? (
  <RadixUI.Flex align="center" gap="2">
    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    <RadixUI.Text size="2" color="gray">
      Renews {new Date(license.renews_at).toLocaleDateString()}
    </RadixUI.Text>
  </RadixUI.Flex>
) : (
  <span></span>
)}
```

---

## 📝 Database Schema Changes

The `licenses` table has evolved:

```sql
-- Machine binding is now stored in JSONB metadata
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Remove old machine columns (migrated to metadata)
ALTER TABLE licenses DROP COLUMN IF EXISTS machine_id;
ALTER TABLE licenses DROP COLUMN IF EXISTS machine_name;

-- Add subscription tracking fields
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS renews_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_subscription_status TEXT;

-- Update expires_at to be nullable (only set when canceled)
ALTER TABLE licenses ALTER COLUMN expires_at DROP NOT NULL;

-- Add 'trialing' to status check constraint
ALTER TABLE licenses DROP CONSTRAINT IF EXISTS licenses_status_check;
ALTER TABLE licenses ADD CONSTRAINT licenses_status_check
  CHECK (status IN ('pending', 'active', 'canceled', 'revoked', 'expired', 'trialing'));
```

---

## ✅ Summary Checklist

When implementing license/subscription management:

- [ ] **`expires_at`** - Only set when `status='canceled'` (end of paid period)
- [ ] **`renews_at`** - Set from `subscription.current_period_end` and **NEVER CLEARED**
- [ ] **`canceled_at`** - Timestamp when user canceled (not when access ends)
- [ ] **Handle Cancellation** - Set `expires_at`, set `status='canceled'`, **DO NOT touch `renews_at`**
- [ ] **Handle Reactivation** - Clear `expires_at` and `canceled_at`, restore `status`, **DO NOT touch `renews_at`**
- [ ] **Display Logic** - Show "Expires" for canceled, "Renews" for active
- [ ] **Webhook Idempotency** - Use `stripe_session_id` and `stripe_subscription_id` to prevent duplicates
- [ ] **Machine Tracking** - Store `machine_id`, `machine_name` in `metadata` JSONB, not separate columns
- [ ] **Status Determination** - Check `metadata.machine_id` to determine if license was activated

---

## 🔗 References

- **Webhook Implementation:** `supabase/functions/stripe-webhook/index.ts` and `supabase/functions/stripe-webhook-dev/index.ts`
- **Edge Functions Documentation:** `EDGE_FUNCTIONS.md`
- **Stripe Webhook Events:** https://stripe.com/docs/api/events/types
- **Stripe Subscriptions API:** https://stripe.com/docs/api/subscriptions

---

## 🚨 Common Pitfalls

1. **❌ NEVER set `expires_at` on active subscriptions** - It should be `null`
2. **❌ NEVER clear `renews_at` during cancellation** - It stays set to billing period end
3. **❌ NEVER set `renews_at` during reactivation** - It's already set correctly
4. **❌ Don't confuse `canceled_at` with `expires_at`** - User cancels on Nov 15, but expires on Nov 30
5. **❌ Don't check only `status`** - Stripe can have `status='active'` with future `cancel_at` (scheduled cancellation)
6. **❌ Don't access `license.machine_id` directly** - It's stored in `license.metadata.machine_id`
7. **✅ DO handle trial subscriptions** - Listen for `customer.subscription.created` with `status='trialing'`
8. **✅ DO implement idempotency** - Check for existing licenses by `stripe_subscription_id`
9. **✅ DO check both conditions for reactivation** - License was canceled AND Stripe subscription is now active

---

