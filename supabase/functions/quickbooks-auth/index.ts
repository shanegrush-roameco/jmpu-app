// supabase/functions/quickbooks-auth/index.ts
// Sprint 15: QuickBooks OAuth 2.0 Authentication Edge Function
// Handles: authorize (generate QB login URL) and callback (exchange code for tokens)
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// QuickBooks OAuth endpoints
const QB_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QB_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";
const QB_SCOPES = "com.intuit.quickbooks.accounting com.intuit.quickbooks.payment";

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const { action, code, state, realmId } = await req.json().catch(() => ({
      action: url.searchParams.get("action"),
      code: url.searchParams.get("code"),
      state: url.searchParams.get("state"),
      realmId: url.searchParams.get("realmId"),
    }));

    // Get secrets
    const QB_CLIENT_ID = Deno.env.get("QB_CLIENT_ID");
    const QB_CLIENT_SECRET = Deno.env.get("QB_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!QB_CLIENT_ID || !QB_CLIENT_SECRET) {
      throw new Error("QuickBooks credentials not configured");
    }

    // Create Supabase admin client (bypasses RLS)
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify the user's JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      SUPABASE_URL!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user's profile to find their company
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only admins/owners can connect
    if (!["admin", "owner"].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: "Only admins can connect accounting software" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ======================================================================
    // ACTION: authorize - Generate the QuickBooks OAuth URL
    // ======================================================================
    if (action === "authorize") {
      const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/quickbooks-callback`;

      // State parameter encodes user/company info for the callback
      const statePayload = btoa(
        JSON.stringify({
          userId: user.id,
          companyId: profile.company_id,
        })
      );

      const authUrl =
        `${QB_AUTH_URL}?` +
        `client_id=${encodeURIComponent(QB_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(QB_SCOPES)}` +
        `&response_type=code` +
        `&state=${statePayload}`;

      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ======================================================================
    // ACTION: callback - Exchange authorization code for tokens
    // ======================================================================
    if (action === "callback") {
      if (!code || !realmId) {
        return new Response(
          JSON.stringify({ error: "Missing code or realmId" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Decode state to get user/company info
      let stateData;
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid state parameter" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/quickbooks-callback`;

      // Exchange code for tokens
      const tokenResponse = await fetch(QB_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization:
            "Basic " + btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`),
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorBody = await tokenResponse.text();
        console.error("Token exchange failed:", errorBody);
        return new Response(
          JSON.stringify({ error: "Failed to exchange authorization code" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const tokens = await tokenResponse.json();

      // Calculate token expiry (QB access tokens last ~1 hour, refresh tokens ~100 days)
      const expiresAt = new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString();

      // Upsert the connection record
      const { data: connection, error: upsertError } = await supabaseAdmin
        .from("financial_connections")
        .upsert(
          {
            company_id: stateData.companyId,
            provider: "quickbooks",
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            token_expires_at: expiresAt,
            realm_id: realmId,
            status: "connected",
            connected_by: stateData.userId,
            connected_at: new Date().toISOString(),
          },
          {
            onConflict: "company_id,provider",
          }
        )
        .select()
        .single();

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to save connection" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          connection: {
            id: connection.id,
            status: connection.status,
            connected_at: connection.connected_at,
            realm_id: connection.realm_id,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ======================================================================
    // ACTION: disconnect - Remove the connection
    // ======================================================================
    if (action === "disconnect") {
      const { error: disconnectError } = await supabaseAdmin
        .from("financial_connections")
        .update({
          status: "disconnected",
          access_token: null,
          refresh_token: null,
          token_expires_at: null,
        })
        .eq("company_id", profile.company_id)
        .eq("provider", "quickbooks");

      if (disconnectError) {
        throw disconnectError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ======================================================================
    // ACTION: status - Check connection status
    // ======================================================================
    if (action === "status") {
      const { data: connection } = await supabaseAdmin
        .from("financial_connections")
        .select(
          "id, status, connected_at, last_sync_at, last_sync_status, last_sync_error, realm_id"
        )
        .eq("company_id", profile.company_id)
        .eq("provider", "quickbooks")
        .single();

      return new Response(
        JSON.stringify({
          connected: connection?.status === "connected",
          connection: connection || null,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ======================================================================
    // ACTION: refresh - Refresh expired access token
    // ======================================================================
    if (action === "refresh") {
      const { data: connection } = await supabaseAdmin
        .from("financial_connections")
        .select("*")
        .eq("company_id", profile.company_id)
        .eq("provider", "quickbooks")
        .single();

      if (!connection?.refresh_token) {
        return new Response(
          JSON.stringify({ error: "No connection to refresh" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const tokenResponse = await fetch(QB_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          Authorization:
            "Basic " + btoa(`${QB_CLIENT_ID}:${QB_CLIENT_SECRET}`),
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: connection.refresh_token,
        }),
      });

      if (!tokenResponse.ok) {
        await supabaseAdmin
          .from("financial_connections")
          .update({ status: "error", last_sync_error: "Token refresh failed" })
          .eq("id", connection.id);

        return new Response(
          JSON.stringify({ error: "Token refresh failed" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const tokens = await tokenResponse.json();
      const expiresAt = new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString();

      await supabaseAdmin
        .from("financial_connections")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          status: "connected",
        })
        .eq("id", connection.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("quickbooks-auth error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
