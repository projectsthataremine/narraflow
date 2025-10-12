import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateLicenseKey } from '@/lib/license-generator';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper: Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Should not reach here');
}

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
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle subscription updates and cancellation
  if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;

    try {
      console.log('Processing subscription event:', event.type, subscription.id);
      console.log('Subscription status:', subscription.status);
      console.log('Cancel at period end:', subscription.cancel_at_period_end);
      console.log('Canceled at:', subscription.canceled_at);
      console.log('Full subscription object:', JSON.stringify(subscription, null, 2));

      const supabaseClient = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // First, get the current license status to determine what action to take
      const { data: currentLicenses } = await supabaseClient
        .from('licenses')
        .select('status, machine_id')
        .eq('stripe_customer_id', subscription.customer as string)
        .limit(1);

      const currentLicense = currentLicenses?.[0];
      const isCurrentlyCanceled = currentLicense?.status === 'canceled';

      // Check if subscription is cancelled or scheduled for cancellation in Stripe
      const shouldCancel =
        subscription.status === 'canceled' ||
        subscription.status === 'unpaid' ||
        subscription.cancel_at !== null;

      // Detect reactivation: was canceled in our DB, but Stripe now shows active (cancel_at is null)
      const shouldReactivate = isCurrentlyCanceled && !shouldCancel;

      console.log('License state:', {
        isCurrentlyCanceled,
        shouldCancel,
        shouldReactivate,
        stripeCancelAt: subscription.cancel_at,
        stripeStatus: subscription.status
      });

      if (shouldReactivate) {
        console.log('Reactivating previously canceled license for customer:', subscription.customer);

        // Determine the correct status based on whether it's been activated
        const hasBeenActivated = currentLicense?.machine_id !== null;
        const newStatus = hasBeenActivated ? 'active' : 'pending';

        console.log('Reactivation details:', { hasBeenActivated, newStatus });

        // Get current_period_end from subscription (check top level first, then items)
        let currentPeriodEnd = (subscription as any).current_period_end;
        if (!currentPeriodEnd) {
          currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
        }

        console.log('Reactivation - current_period_end value:', currentPeriodEnd);
        const renewsAtValue = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
        console.log('Reactivation - renews_at will be set to:', renewsAtValue);

        // Reactivate subscription - clear expires_at and set status based on activation state
        const updateData = {
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
          status: newStatus,
          expires_at: null,  // Clear expiration date when reactivating
          canceled_at: null,  // Clear canceled timestamp
          renews_at: renewsAtValue
        };

        console.log('Reactivation - update data:', JSON.stringify(updateData, null, 2));

        const { data, error } = await supabaseClient
          .from('licenses')
          .update(updateData)
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to reactivate licenses:', error);
          return NextResponse.json(
            { error: 'Failed to reactivate licenses' },
            { status: 500 }
          );
        }

        console.log('Successfully reactivated licenses for customer:', subscription.customer);
        console.log('Reactivation result:', data);
      } else if (shouldCancel) {
        console.log('Canceling licenses for customer:', subscription.customer);

        // Calculate the actual expiration date
        // Use cancel_at if available, otherwise use current_period_end
        const expirationDate = subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

        // Cancel all licenses for this customer
        const updateData: any = {
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          stripe_subscription_status: subscription.status
        };

        // Only update expires_at if we have an expiration date
        if (expirationDate) {
          updateData.expires_at = expirationDate;
        }

        const { data, error } = await supabaseClient
          .from('licenses')
          .update(updateData)
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to cancel licenses:', error);
          return NextResponse.json(
            { error: 'Failed to cancel licenses' },
            { status: 500 }
          );
        }

        console.log('Successfully canceled licenses for customer:', subscription.customer);
        console.log('Update result:', data);
      } else {
        // Neither canceling nor reactivating - just update Stripe metadata and renewal date
        console.log('Updating subscription metadata for customer:', subscription.customer);

        // Get current_period_end from subscription (check top level first, then items)
        let currentPeriodEnd = (subscription as any).current_period_end;
        if (!currentPeriodEnd) {
          currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
        }

        const { data, error } = await supabaseClient
          .from('licenses')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            renews_at: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null
          })
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to update subscription info:', error);
          return NextResponse.json(
            { error: 'Failed to update subscription info' },
            { status: 500 }
          );
        }

        console.log('Updated subscription metadata for customer:', subscription.customer);
      }

      return NextResponse.json({ received: true });
    } catch (error: any) {
      console.error('Error processing subscription event:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
  }

  // Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      console.log('Processing checkout session:', session.id);
      console.log('Full checkout session object:', JSON.stringify(session, null, 2));

      // Generate UUID license key with retry
      const licenseKey = await retryWithBackoff(() => generateLicenseKey());
      console.log('Generated license key:', licenseKey);

      // Get customer email (use test email for test events)
      const customerEmail = session.customer_email || session.customer_details?.email || 'test@example.com';
      console.log('Customer email:', customerEmail);

      // Fetch subscription to get current_period_end
      let renewsAt = null;
      if (session.subscription) {
        console.log('Fetching subscription:', session.subscription);
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log('Full subscription object:', JSON.stringify(subscription, null, 2));

        // Try to get current_period_end from multiple possible locations
        let currentPeriodEnd = (subscription as any).current_period_end;  // Top level (should be here)
        if (!currentPeriodEnd) {
          currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;  // Fallback to items
        }

        renewsAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
        console.log('Current period end value:', currentPeriodEnd);
        console.log('Subscription renews at:', renewsAt);
      } else {
        console.log('No subscription in session object');
      }

      // Create license in database with retry
      const activateResponse = await retryWithBackoff(async () => {
        return fetch(`${process.env.SUPABASE_URL}/functions/v1/activate_license`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
            'x-edge-function-secret': process.env.EDGE_FUNCTION_SECRET!,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: licenseKey,
            user_id: session.metadata?.user_id || null,
            customer_email: customerEmail,
            expires_at: null,  // Only set when subscription is canceled
            renews_at: renewsAt,  // Set from subscription current_period_end
            stripe_session_id: session.id,  // For idempotency
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription
          }),
        });
      });

      if (!activateResponse.ok) {
        const errorText = await activateResponse.text();
        console.error('activate_license failed:', {
          status: activateResponse.status,
          statusText: activateResponse.statusText,
          body: errorText
        });

        // Return 500 for server/database errors so Stripe retries
        // Return 200 for validation errors (no point retrying)
        if (activateResponse.status >= 500) {
          return NextResponse.json(
            { error: 'Database error, Stripe will retry' },
            { status: 500 }
          );
        }

        throw new Error(`activate_license failed (${activateResponse.status}): ${errorText}`);
      }

      const activateData = await activateResponse.json();

      if (activateData.duplicate) {
        console.log('License already created for this session (idempotent)');
      } else {
        console.log('License created successfully:', licenseKey);
      }

      // Success - user can see license in account page
      return NextResponse.json({ received: true, license_key: licenseKey });

    } catch (error: any) {
      console.error('Error processing webhook:', error);

      // Check if it's a network/timeout error (Stripe should retry)
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('fetch failed')) {
        console.error('Network error - returning 500 so Stripe retries');
        return NextResponse.json(
          { error: 'Network error, Stripe will retry' },
          { status: 500 }
        );
      }

      // For other errors (like validation), return 200 to prevent infinite retries
      // But log for manual review
      return NextResponse.json({
        received: true,
        error: error.message,
        manual_review_required: true
      });
    }
  }

  return NextResponse.json({ received: true });
}
