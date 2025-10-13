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

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
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

    // Check if user already has an active trial or subscription
    const { data: existingLicenses } = await supabaseClient
      .from('licenses')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'active'])
      .limit(1);

    if (existingLicenses && existingLicenses.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'User already has an active trial or subscription',
          subscription_id: existingLicenses[0].stripe_subscription_id
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

    // Get price ID from environment
    const priceId = Deno.env.get('STRIPE_PRICE_ID');
    if (!priceId) {
      throw new Error('STRIPE_PRICE_ID environment variable not set');
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
