/**
 * Supabase Edge Function: create-checkout-session
 *
 * Purpose: Create a Stripe Checkout session for subscription purchase
 * Called when: User clicks "Subscribe" or "Buy Now" button
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@14.10.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY_PROD') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient()
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid authorization token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get request body (optional - for custom success/cancel URLs and billing interval)
    const { success_url, cancel_url, billing_interval } = await req.json().catch(() => ({}));

    // Choose monthly or annual price based on billing_interval
    const isAnnual = billing_interval === 'annual';
    const priceId = isAnnual
      ? Deno.env.get('STRIPE_PRICE_ID_ANNUAL_PROD')
      : Deno.env.get('STRIPE_PRICE_ID_MONTHLY_PROD');

    if (!priceId) {
      throw new Error('STRIPE_PRICE_ID environment variable not set');
    }

    // Get origin from request headers
    const origin = req.headers.get('origin') || 'https://clipp.app';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${origin}/account?success=true`,
      cancel_url: cancel_url || `${origin}/account`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create checkout session' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
