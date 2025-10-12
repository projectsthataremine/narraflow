import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
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

    // Authentication
    const edgeFunctionSecret = req.headers.get("x-edge-function-secret");
    const secret = Deno.env.get("EDGE_FUNCTION_SECRET");
    if (secret && edgeFunctionSecret !== secret) {
      return new Response(
        JSON.stringify({ error: { message: "Unauthorized - Invalid edge function secret" } }),
        { status: 401, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    const { key, user_id, customer_email, expires_at, renews_at, stripe_session_id, stripe_customer_id, stripe_subscription_id } = payload;

    // Debug logging
    console.log('Received payload:', JSON.stringify(payload, null, 2));
    console.log('renews_at value:', renews_at);
    console.log('renews_at type:', typeof renews_at);

    // Validation
    if (!key || !customer_email) {
      return new Response(
        JSON.stringify({ error: { message: "Missing required fields: key, customer_email" } }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check if license already exists (idempotency)
    if (stripe_session_id) {
      const { data: existing } = await supabaseClient
        .from("licenses")
        .select("key")
        .eq("stripe_session_id", stripe_session_id)
        .maybeSingle();

      if (existing) {
        console.log("License already exists for session:", stripe_session_id);
        return new Response(
          JSON.stringify({ success: true, key: existing.key, duplicate: true }),
          { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }
    }

    // Double-check UUID uniqueness (paranoid check)
    const { data: existingKey } = await supabaseClient
      .from("licenses")
      .select("key")
      .eq("key", key)
      .maybeSingle();

    if (existingKey) {
      return new Response(
        JSON.stringify({ error: { message: "License key already exists (UUID collision)" } }),
        { status: 409, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Create license
    const renewsAtValue = renews_at ? new Date(renews_at).toISOString() : null;
    console.log('Converted renews_at for insert:', renewsAtValue);

    const insertData = {
      key,
      user_id,
      customer_email,
      expires_at: expires_at ? new Date(expires_at).toISOString() : null,
      renews_at: renewsAtValue,
      stripe_session_id,
      stripe_customer_id,
      stripe_subscription_id,
      machine_id: null,
      status: 'pending',  // Will become 'active' on first activation
      created_at: new Date().toISOString(),
    };

    console.log('Insert data:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabaseClient.from("licenses").insert(insertData);

    if (error) {
      return new Response(
        JSON.stringify({ error: { message: error.message } }),
        { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, key }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: { message: error.message || "Unknown error" } }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});
