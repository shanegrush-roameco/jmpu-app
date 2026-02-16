// supabase/functions/quickbooks-callback/index.ts
// Sprint 15: QuickBooks OAuth 2.0 Callback Handler
// This is the redirect URI that QuickBooks sends the user back to after authorization.
// It exchanges the auth code for tokens and redirects back to the JMPU app.
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const QB_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

// The JMPU app URL to redirect back to after successful connection
const APP_URL = "https://jmpu.roame.co";

serve(async (req: Request) => {
  try {
    const url = new URL(req.url);

    // QuickBooks sends these as query parameters on the redirect
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const realmId = url.searchParams.get("realmId");
    const error = url.searchParams.get("error");

    // If user denied access
    if (error) {
      return Response.redirect(
        `${APP_URL}/settings?tab=integrations&qb_error=${encodeURIComponent(error)}`,
        302
      );
    }

    if (!code || !state || !realmId) {
      return Response.redirect(
        `${APP_URL}/settings?tab=integrations&qb_error=missing_params`,
        302
      );
    }

    // Decode state to get user/company info
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return Response.redirect(
        `${APP_URL}/settings?tab=integrations&qb_error=invalid_state`,
        302
      );
    }

    // Get secrets
    const QB_CLIENT_ID = Deno.env.get("QB_CLIENT_ID");
    const QB_CLIENT_SECRET = Deno.env.get("QB_CLIENT_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!QB_CLIENT_ID || !QB_CLIENT_SECRET) {
      return Response.redirect(
        `${APP_URL}/settings?tab=integrations&qb_error=server_config`,
        302
      );
    }

    const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/quickbooks-callback`;

    // Exchange authorization code for tokens
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
      return Response.redirect(
        `${APP_URL}/settings?tab=integrations&qb_error=token_exchange`,
        302
      );
    }

    const tokens = await tokenResponse.json();

    // Calculate token expiry
    const expiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    // Save to database using service role (bypasses RLS)
    const supabaseAdmin = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error: upsertError } = await supabaseAdmin
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
      );

    if (upsertError) {
      console.error("Failed to save connection:", upsertError);
      return Response.redirect(
        `${APP_URL}/settings?tab=integrations&qb_error=save_failed`,
        302
      );
    }

    // Redirect back to the app with success
    return Response.redirect(
      `${APP_URL}/settings?tab=integrations&qb_connected=true`,
      302
    );
  } catch (error) {
    console.error("quickbooks-callback error:", error);
    return Response.redirect(
      `${APP_URL}/settings?tab=integrations&qb_error=unknown`,
      302
    );
  }
});
