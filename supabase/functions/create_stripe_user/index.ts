import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe?target=deno";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const stripe = new Stripe(stripeSecretKey);

const userExists = async (userEmail) => {
  try {
    const response = await stripe.customers.search({
      query: `email:'${userEmail}'`,
    });

    if (response.data.length > 0) {
      return {
        exists: true,
        id: response.data[0].id,
      };
    }

    return {
      exists: false,
    };
  } catch (error) {
    console.error("Error checking Stripe customer:", error);
    throw error;
  }
};

// if were here, its because we the user does not have a stripe customer id
// in the db. So we need to create one for them or fetch if they already have one
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
    const supabaseClient = createClient(req);
    const { email } = await req.json();

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user.id) {
      throw new Error("User not found");
    }

    let customer = await userExists(email);

    if (!customer.exists) {
      customer = await stripe.customers.create({ email });
    }

    const { error } = await supabaseClient.auth.updateUser({
      data: { stripe_customer_id: customer.id },
    });

    if (error) {
      throw new Error(error.message);
    }

    return new Response(JSON.stringify({ stripeCustomerId: customer.id }), {
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
      status: 500,
    });
  }
});
