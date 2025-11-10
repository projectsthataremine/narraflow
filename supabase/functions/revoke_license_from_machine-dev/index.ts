import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Client 1: Auth client to verify user identity
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // DEV FUNCTION: Restrict to authorized dev users only
    const allowedDevUsers = (Deno.env.get('ALLOWED_DEV_USER_IDS') ?? '').split(',');
    if (!allowedDevUsers.includes(user.id)) {
      console.error(`Unauthorized dev function access attempt by user: ${user.id}`);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    console.log("Authenticated user:", user.id, user.email);

    // Parse request body
    const { license_key } = await req.json();

    // Validate required fields
    if (!license_key) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: license_key"
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    console.log("Revoking license:", license_key);

    // Client 2: Admin client with service role for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the license to verify ownership
    const { data: license, error: fetchError } = await adminClient
      .from("licenses")
      .select("*")
      .eq("key", license_key)
      .single();

    if (fetchError || !license) {
      console.error("License not found:", fetchError);
      return new Response(
        JSON.stringify({ error: "License not found" }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Verify user owns this license
    if (license.user_id !== user.id) {
      console.error("User does not own license:", user.id, "vs", license.user_id);
      return new Response(
        JSON.stringify({ error: "Unauthorized - you do not own this license" }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    // Clear machine info from metadata
    const updatedMetadata = {
      ...(license.metadata || {}),
    };
    // Remove machine-specific fields
    delete updatedMetadata.machine_id;
    delete updatedMetadata.machine_name;
    delete updatedMetadata.machine_os;

    // Update license to revoke machine binding
    // Reset status to pending and clear activated_at
    const { data: updatedLicense, error: updateError } = await adminClient
      .from("licenses")
      .update({
        metadata: updatedMetadata,
        status: "pending",
        activated_at: null,
      })
      .eq("key", license_key)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to revoke license:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to revoke license: " + updateError.message }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    }

    console.log("License revoked successfully:", license_key);

    return new Response(
      JSON.stringify({
        success: true,
        license: updatedLicense
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );
  }
});
