/**
 * Supabase Edge Function: stripe-webhook
 *
 * Purpose: Handle Stripe webhook events for subscription lifecycle
 * Events handled:
 * - customer.subscription.created (trial subscriptions)
 * - customer.subscription.updated (renewals, cancellations)
 * - customer.subscription.deleted (immediate cancellations)
 * - checkout.session.completed (one-time purchases)
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_PROD') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

// Create crypto provider for webhook signature verification in Deno
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature'
};

// Helper: Generate UUID license key
function generateLicenseKey(): string {
  return crypto.randomUUID();
}

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

// Helper: Log events to edge_function_logs table
async function logEvent(
  supabaseClient: any,
  data: {
    function_name: string;
    event_type: string;
    license_key?: string;
    machine_id?: string;
    stripe_session_id?: string;
    request_data?: any;
    response_data?: any;
    error_message?: string;
    success: boolean;
    duration_ms?: number;
  }
) {
  try {
    await supabaseClient.from('edge_function_logs').insert({
      ...data,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    // Don't let logging errors break the webhook
    console.error('Failed to log event:', err);
  }
}

Deno.serve(async (req) => {
  console.log('=== WEBHOOK RECEIVED (PROD) ===', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request - returning 204');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  console.log('Processing POST request...');
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify webhook signature
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    console.log('Webhook received - signature present:', !!sig);
    console.log('STRIPE_WEBHOOK_SECRET present:', !!Deno.env.get('STRIPE_WEBHOOK_SECRET_PROD'));
    console.log('STRIPE_WEBHOOK_SECRET length:', Deno.env.get('STRIPE_WEBHOOK_SECRET_PROD')?.length || 0);

    if (!sig) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let event: Stripe.Event;

    // Verify webhook signature using Deno's Web Crypto API
    try {
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_PROD') ?? '';
      event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        webhookSecret,
        undefined,
        cryptoProvider
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle subscription updates and cancellation
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;

      console.log('Processing subscription event:', event.type, subscription.id);
      console.log('Subscription status:', subscription.status);
      console.log('Cancel at period end:', subscription.cancel_at_period_end);
      console.log('Canceled at:', subscription.canceled_at);

      // First, get the current license status to determine what action to take
      const { data: currentLicenses } = await supabaseClient
        .from('licenses')
        .select('key, status, metadata, renews_at, expires_at, stripe_subscription_status')
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

        // Check if license was ever activated on a machine (check metadata.machine_id)
        const hasBeenActivated = currentLicense?.metadata?.machine_id !== undefined && currentLicense?.metadata?.machine_id !== null;
        const newStatus = hasBeenActivated ? 'active' : 'pending';

        console.log('Reactivation details:', { hasBeenActivated, newStatus, metadata: currentLicense?.metadata });

        // Log before reactivation
        await logEvent(supabaseClient, {
          function_name: 'stripe-webhook',
          event_type: 'subscription_reactivated',
          license_key: currentLicense?.key,
          stripe_session_id: event.id,
          request_data: {
            stripe_event_id: event.id,
            subscription_id: subscription.id,
            before_renews_at: currentLicense?.renews_at,
            before_expires_at: currentLicense?.expires_at,
            before_status: currentLicense?.status
          },
          response_data: {
            new_status: newStatus,
            note: 'renews_at intentionally not modified during reactivation'
          },
          success: true
        });

        // Reactivate subscription - clear expires_at and canceled_at, restore status
        const { error } = await supabaseClient
          .from('licenses')
          .update({
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            status: newStatus,
            expires_at: null,  // Clear expiration date when reactivating
            canceled_at: null  // Clear canceled timestamp
            // Keep renews_at as is - don't touch it
          })
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to reactivate licenses:', error);
          await logEvent(supabaseClient, {
            function_name: 'stripe-webhook',
            event_type: 'subscription_reactivation_error',
            license_key: currentLicense?.key,
            error_message: error.message,
            success: false
          });
          return new Response(
            JSON.stringify({ error: 'Failed to reactivate licenses' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Successfully reactivated licenses for customer:', subscription.customer);
      } else if (shouldCancel) {
        console.log('Canceling licenses for customer:', subscription.customer);

        // Calculate the actual expiration date
        let expirationDate: string;

        if (event.type === 'customer.subscription.deleted') {
          // Immediate cancellation - set expiration to when it was canceled
          expirationDate = subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : new Date().toISOString();
          console.log('Immediate cancellation - expires_at set to:', expirationDate);
        } else {
          // Scheduled cancellation - use cancel_at or current_period_end
          expirationDate = subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : new Date().toISOString();
          console.log('Scheduled cancellation - expires_at set to:', expirationDate);
        }

        // Log before cancellation
        await logEvent(supabaseClient, {
          function_name: 'stripe-webhook',
          event_type: 'subscription_canceled',
          license_key: currentLicense?.key,
          stripe_session_id: event.id,
          request_data: {
            stripe_event_id: event.id,
            subscription_status: subscription.status,
            canceled_at: subscription.canceled_at,
            cancel_at: subscription.cancel_at,
            before_renews_at: currentLicense?.renews_at,
            before_expires_at: currentLicense?.expires_at
          },
          response_data: {
            calculated_expires_at: expirationDate,
            note: 'renews_at intentionally not modified during cancellation'
          },
          success: true
        });

        // Cancel all licenses for this customer
        const { error } = await supabaseClient
          .from('licenses')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            stripe_subscription_status: subscription.status,
            expires_at: expirationDate
            // Keep renews_at - it stays the same, we just add expires_at
          })
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to cancel licenses:', error);
          await logEvent(supabaseClient, {
            function_name: 'stripe-webhook',
            event_type: 'subscription_cancellation_error',
            license_key: currentLicense?.key,
            error_message: error.message,
            success: false
          });
          return new Response(
            JSON.stringify({ error: 'Failed to cancel licenses' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Successfully canceled licenses for customer:', subscription.customer);
      } else {
        // Neither canceling nor reactivating - just update Stripe metadata and renewal date
        console.log('Updating subscription metadata for customer:', subscription.customer);

        const currentPeriodEnd = subscription.current_period_end;
        const calculatedRenewsAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

        // Log before state and Stripe data
        await logEvent(supabaseClient, {
          function_name: 'stripe-webhook',
          event_type: 'subscription_updated',
          license_key: currentLicense?.key,
          stripe_session_id: event.id,
          request_data: {
            stripe_event_id: event.id,
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_end: currentPeriodEnd,
            current_period_end_type: typeof currentPeriodEnd,
            before_renews_at: currentLicense?.renews_at,
            before_expires_at: currentLicense?.expires_at,
            before_status: currentLicense?.status,
            before_stripe_subscription_status: currentLicense?.stripe_subscription_status
          },
          response_data: {
            calculated_renews_at: calculatedRenewsAt,
            calculated_renews_at_raw: currentPeriodEnd,
            warning: currentPeriodEnd === null || currentPeriodEnd === undefined ? 'current_period_end was null or undefined!' : null
          },
          success: true
        });

        // DEFENSIVE CHECK: Only update renews_at if the new value is not null
        // This prevents overwriting a valid renews_at with null
        const updateData: any = {
          stripe_subscription_id: subscription.id,
          stripe_subscription_status: subscription.status,
        };

        if (calculatedRenewsAt !== null) {
          updateData.renews_at = calculatedRenewsAt;
        } else {
          console.warn('⚠️ WARNING: current_period_end is null, NOT updating renews_at to prevent data loss');
        }

        const { error } = await supabaseClient
          .from('licenses')
          .update(updateData)
          .eq('stripe_customer_id', subscription.customer as string);

        if (error) {
          console.error('Failed to update subscription info:', error);
          await logEvent(supabaseClient, {
            function_name: 'stripe-webhook',
            event_type: 'subscription_updated_error',
            license_key: currentLicense?.key,
            error_message: error.message,
            success: false
          });
          return new Response(
            JSON.stringify({ error: 'Failed to update subscription info' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Query the license after update to verify what was written
        const { data: updatedLicenses } = await supabaseClient
          .from('licenses')
          .select('renews_at, expires_at, status')
          .eq('stripe_customer_id', subscription.customer as string)
          .limit(1);

        const updatedLicense = updatedLicenses?.[0];

        // Log after state
        await logEvent(supabaseClient, {
          function_name: 'stripe-webhook',
          event_type: 'subscription_updated_complete',
          license_key: currentLicense?.key,
          response_data: {
            after_renews_at: updatedLicense?.renews_at,
            after_expires_at: updatedLicense?.expires_at,
            after_status: updatedLicense?.status,
            renews_at_changed: currentLicense?.renews_at !== updatedLicense?.renews_at
          },
          success: true
        });

        console.log('Updated subscription metadata for customer:', subscription.customer);
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle successful checkout
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('Processing checkout session:', session.id);

      // Generate UUID license key with retry
      const licenseKey = await retryWithBackoff(() => {
        const key = generateLicenseKey();
        // Check uniqueness
        return supabaseClient
          .from('licenses')
          .select('key')
          .eq('key', key)
          .maybeSingle()
          .then(({ data }) => {
            if (data) throw new Error('UUID collision');
            return key;
          });
      });

      console.log('Generated license key:', licenseKey);

      // Get customer email
      const customerEmail = session.customer_email || session.customer_details?.email || 'test@example.com';

      // Fetch subscription to get current_period_end
      let renewsAt = null;
      let subscriptionData = null;
      console.log('Session subscription ID:', session.subscription);
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        console.log('Subscription current_period_end:', subscription.current_period_end);
        const currentPeriodEnd = subscription.current_period_end;
        renewsAt = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
        console.log('Calculated renewsAt:', renewsAt);
        subscriptionData = {
          current_period_end: currentPeriodEnd,
          status: subscription.status
        };
      } else {
        console.warn('No subscription ID in checkout session');
      }

      // Log checkout data before creating license
      await logEvent(supabaseClient, {
        function_name: 'stripe-webhook',
        event_type: 'checkout_completed',
        license_key: licenseKey,
        stripe_session_id: session.id,
        request_data: {
          stripe_event_id: event.id,
          session_id: session.id,
          subscription_id: session.subscription,
          has_subscription: !!session.subscription,
          subscription_data: subscriptionData
        },
        response_data: {
          calculated_renews_at: renewsAt,
          renews_at_source: session.subscription ? 'from_subscription' : 'null_no_subscription',
          warning: !renewsAt ? 'renews_at is null!' : null
        },
        success: true
      });

      // Create license in database with retry
      const { error } = await supabaseClient
        .from('licenses')
        .insert({
          key: licenseKey,
          user_id: session.metadata?.user_id || null,
          customer_email: customerEmail,
          expires_at: null,
          renews_at: renewsAt,
          stripe_session_id: session.id,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: 'pending'
        });

      if (error) {
        console.error('Failed to create license:', error);

        await logEvent(supabaseClient, {
          function_name: 'stripe-webhook',
          event_type: 'checkout_completed_error',
          license_key: licenseKey,
          stripe_session_id: session.id,
          error_message: error.message,
          success: false
        });

        if (error.code === 'PGRST116') { // Duplicate key error
          console.log('License already created for this session (idempotent)');
          return new Response(JSON.stringify({ received: true, duplicate: true }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(
          JSON.stringify({ error: 'Database error, Stripe will retry' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the license was created with correct renews_at
      const { data: createdLicense } = await supabaseClient
        .from('licenses')
        .select('key, renews_at, expires_at, status')
        .eq('key', licenseKey)
        .single();

      await logEvent(supabaseClient, {
        function_name: 'stripe-webhook',
        event_type: 'checkout_completed_success',
        license_key: licenseKey,
        stripe_session_id: session.id,
        response_data: {
          license_created: true,
          verified_renews_at: createdLicense?.renews_at,
          verified_expires_at: createdLicense?.expires_at,
          verified_status: createdLicense?.status
        },
        success: true
      });

      console.log('License created successfully:', licenseKey);

      return new Response(JSON.stringify({ received: true, license_key: licenseKey }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
