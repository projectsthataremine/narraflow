/**
 * Supabase Edge Function: create_stripe_trial
 *
 * Purpose: Creates a Stripe Customer and Subscription with 7-day trial
 * Called when: User signs in for the first time
 *
 * Flow:
 * 1. Check if user already has a Stripe customer ID
 * 2. If not, create Stripe Customer with user's email
 * 3. Create Stripe Subscription with 7-day trial
 * 4. Return subscription info to frontend
 *
 * Note: Stripe webhook will handle license creation when subscription.created fires
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_SANDBOX') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SECRET_KEY') ?? ''
    );

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DEV FUNCTION: Restrict to authorized dev users only
    const allowedDevUsers = (Deno.env.get('ALLOWED_DEV_USER_IDS') ?? '').split(',');
    if (!allowedDevUsers.includes(user.id)) {
      console.error(`Unauthorized dev function access attempt by user: ${user.id}`);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user already has an active trial or subscription
    const { data: existingLicenses } = await supabaseClient
      .from('licenses')
      .select('id, stripe_subscription_id, status, expires_at')
      .eq('user_id', user.id)
      .in('status', ['pending', 'active'])
      .limit(1);

    if (existingLicenses && existingLicenses.length > 0) {
      const existingLicense = existingLicenses[0];

      // If license exists but expires_at is null, we need to fix it
      if (existingLicense.expires_at === null && existingLicense.stripe_subscription_id) {
        console.log('Found existing license without expiration date, fetching from Stripe...');

        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(existingLicense.stripe_subscription_id);

          if (stripeSubscription.trial_end) {
            const trialEndDate = new Date(stripeSubscription.trial_end * 1000);

            // Update the license with the correct expiration date
            await supabaseClient
              .from('licenses')
              .update({ expires_at: trialEndDate.toISOString() })
              .eq('id', existingLicense.id);

            console.log('Updated existing license with expiration date:', trialEndDate.toISOString());

            return new Response(
              JSON.stringify({
                success: true,
                subscription_id: existingLicense.stripe_subscription_id,
                trial_end: stripeSubscription.trial_end,
                status: stripeSubscription.status,
                updated: true
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (stripeError) {
          console.error('Failed to fetch Stripe subscription:', stripeError);
        }
      }

      return new Response(
        JSON.stringify({
          error: 'User already has an active trial or subscription',
          subscription_id: existingLicense.stripe_subscription_id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has a Stripe customer ID
    let customerId: string;
    const { data: existingCustomer } = await supabaseClient
      .from('licenses')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .not('stripe_customer_id', 'is', null)
      .limit(1);

    if (existingCustomer && existingCustomer.length > 0 && existingCustomer[0].stripe_customer_id) {
      customerId = existingCustomer[0].stripe_customer_id;
      console.log('Using existing Stripe customer:', customerId);
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log('Created new Stripe customer:', customerId);
    }

    // Get price ID from environment (use monthly for trials)
    const priceId = Deno.env.get('STRIPE_PRICE_ID_MONTHLY_SANDBOX');
    if (!priceId) {
      throw new Error('STRIPE_PRICE_ID_MONTHLY_SANDBOX environment variable not set');
    }

    // Create subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: 7,
      trial_settings: {
        end_behavior: {
          missing_payment_method: 'cancel', // Cancel if no payment method added by end of trial
        },
      },
      metadata: {
        user_id: user.id,
      },
    });

    console.log('Created subscription with trial:', subscription.id);

    // Create license record with trial expiration date
    const trialEndDate = new Date(subscription.trial_end! * 1000); // Convert Unix timestamp to Date

    const { error: licenseError } = await supabaseClient
      .from('licenses')
      .insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        status: 'pending',
        expires_at: trialEndDate.toISOString(),
      });

    if (licenseError) {
      console.error('Failed to create license record:', licenseError);
      // Don't fail the request, just log the error
      // The webhook will handle license creation if this fails
    }

    // Return subscription info
    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        customer_id: customerId,
        trial_end: subscription.trial_end,
        status: subscription.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error creating trial:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create trial subscription' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
