import { createClient } from "jsr:@supabase/supabase-js@2";

// Helper: Log to edge_function_logs table (makes debugging MUCH easier!)
async function logEvent(
  supabaseClient: any,
  data: {
    function_name: string;
    event_type: string;
    license_key?: string;
    machine_id?: string;
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
    // Don't let logging errors break the function
    console.error('Failed to log event:', err);
  }
}

async function signLicensePayload(payload: any) {
  const LICENSE_PRIVATE_KEY = Deno.env.get("LICENSE_PRIVATE_KEY") ?? "";
  if (!LICENSE_PRIVATE_KEY) throw new Error("Private key is missing");

  const privateKeyBytes = Uint8Array.from(atob(LICENSE_PRIVATE_KEY), (c) =>
    c.charCodeAt(0)
  );

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBytes.buffer,
    { name: "Ed25519" },
    false,
    ["sign"]
  );

  const encodedPayload = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    "Ed25519",
    cryptoKey,
    encodedPayload
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

Deno.serve(async (req: Request) => {
  const startTime = Date.now();
  let supabaseClient: any;
  let requestData: any;

  try {
    // Handle CORS preflight
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

    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    requestData = await req.json();
    const { key, machine_id, return_signed_license } = requestData;

    // Log incoming request
    await logEvent(supabaseClient, {
      function_name: 'validate_license',
      event_type: 'request',
      license_key: key,
      machine_id: machine_id,
      request_data: { return_signed_license },
      success: true,
    });

    // CRITICAL FIX: Enable authentication (was disabled in original!)
    const authHeader = req.headers.get("Authorization");
    const secret = Deno.env.get("EDGE_FUNCTION_SECRET");
    if (secret && authHeader !== secret) {
      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'auth_failed',
        license_key: key,
        error_message: 'Unauthorized - missing or invalid auth header',
        success: false,
        duration_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ error: { message: "Unauthorized" } }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Validation
    if (!key || !machine_id) {
      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'validation_failed',
        error_message: 'Missing key or machine_id',
        request_data: requestData,
        success: false,
        duration_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ error: { message: "Missing key or machine_id" } }),
        { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Fetch license
    const { data: license, error: fetchError } = await supabaseClient
      .from("licenses")
      .select("*")
      .eq("key", key)
      .maybeSingle();

    if (fetchError || !license) {
      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'license_not_found',
        license_key: key,
        machine_id,
        error_message: fetchError?.message || 'License not found',
        success: false,
        duration_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({ valid: false, error: "License not found" }),
        { status: 404, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check if revoked
    if (license.revoked || license.status === 'revoked') {
      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'license_revoked',
        license_key: key,
        machine_id,
        response_data: { revoked_at: license.revoked_at, reason: license.revoked_reason },
        success: false,
        duration_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: "License has been revoked",
          revoked_at: license.revoked_at,
          reason: license.revoked_reason
        }),
        { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Check if expired
    if (license.status === 'expired' || new Date(license.expires_at) < new Date()) {
      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'license_expired',
        license_key: key,
        machine_id,
        response_data: { expires_at: license.expires_at },
        success: false,
        duration_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: "License has expired",
          expires_at: license.expires_at
        }),
        { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Get machine_id from metadata (new location)
    const licenseMachineId = license.metadata?.machine_id || license.machine_id;

    // First activation - bind to machine
    if (!licenseMachineId) {
      // Update metadata with machine info (not activated_at - that's a column)
      const updatedMetadata = {
        ...(license.metadata || {}),
        machine_id,
      };

      const { error: updateError } = await supabaseClient
        .from("licenses")
        .update({
          metadata: updatedMetadata,
          activated_at: new Date().toISOString(),
          last_validated_at: new Date().toISOString(),
          status: 'active'
        })
        .eq("key", key);

      if (updateError) {
        await logEvent(supabaseClient, {
          function_name: 'validate_license',
          event_type: 'activation_failed',
          license_key: key,
          machine_id,
          error_message: updateError.message,
          success: false,
          duration_ms: Date.now() - startTime
        });

        return new Response(
          JSON.stringify({ error: { message: updateError.message } }),
          { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
        );
      }

      const licensePayload = {
        license_key: license.key,
        machine_id,
        expires_at: license.expires_at,
        status: 'active'
      };

      const signature = await signLicensePayload(licensePayload);

      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'first_activation_success',
        license_key: key,
        machine_id,
        response_data: { status: 'active', return_signed_license },
        success: true,
        duration_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({
          valid: true,
          payload: licensePayload,
          signature,
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Already activated - check machine ID
    if (licenseMachineId !== machine_id) {
      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'machine_mismatch',
        license_key: key,
        machine_id,
        response_data: { expected_machine_id: license.machine_id },
        error_message: 'License bound to different machine',
        success: false,
        duration_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({
          valid: false,
          error: "License bound to different machine"
        }),
        { status: 403, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    // Update last validated timestamp
    await supabaseClient
      .from("licenses")
      .update({ last_validated_at: new Date().toISOString() })
      .eq("key", key);

    // Return signed license if requested
    if (return_signed_license) {
      const licensePayload = {
        license_key: license.key,
        machine_id,
        expires_at: license.expires_at,
        status: license.status
      };

      const signature = await signLicensePayload(licensePayload);

      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'validation_success_with_signature',
        license_key: key,
        machine_id,
        success: true,
        duration_ms: Date.now() - startTime
      });

      return new Response(
        JSON.stringify({
          valid: true,
          payload: licensePayload,
          signature,
        }),
        { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
      );
    }

    await logEvent(supabaseClient, {
      function_name: 'validate_license',
      event_type: 'validation_success',
      license_key: key,
      machine_id,
      success: true,
      duration_ms: Date.now() - startTime
    });

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );

  } catch (error) {
    // Log unexpected errors
    if (supabaseClient) {
      await logEvent(supabaseClient, {
        function_name: 'validate_license',
        event_type: 'error',
        license_key: requestData?.key,
        machine_id: requestData?.machine_id,
        error_message: error.message || 'Unknown error',
        success: false,
        duration_ms: Date.now() - startTime
      });
    }

    return new Response(
      JSON.stringify({ error: { message: error.message || "Unknown error" } }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});
