import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe?target=deno";

const SITE_URL = Deno.env.get("SITE_URL");

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = new Stripe(stripeSecretKey);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, x-client-info, apikey, Authorization",
      },
    });
  }

  try {
    const supabase = createClient(req);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user.id) {
      throw new Error("User not found");
    }

    const { stripeCustomerId } = await req.json();

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: "price_1OaJIgDOHn5DqTwQ9FdCVSIB",
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${SITE_URL}/pricing/success`,
      cancel_url: `${SITE_URL}/pricing/cancel`,
    });

    return new Response(JSON.stringify({ id: session.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (error) {
    console.error(error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 400,
    });
  }
});
