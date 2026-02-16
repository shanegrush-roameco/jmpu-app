// supabase/functions/quickbooks-sync/index.ts
// Sprint 15: QuickBooks Data Sync Edge Function
// Pulls invoices, payments, and expenses from QuickBooks and saves to Supabase
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const QB_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

// Use sandbox for development, production for live
const QB_API_BASE_SANDBOX =
  "https://sandbox-quickbooks.api.intuit.com/v3/company";
const QB_API_BASE_PRODUCTION =
  "https://quickbooks.api.intuit.com/v3/company";

// Use sandbox in development
const QB_API_BASE = QB_API_BASE_SANDBOX;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const QB_CLIENT_ID = Deno.env.get("QB_CLIENT_ID")!;
  const QB_CLIENT_SECRET = Deno.env.get("QB_CLIENT_SECRET")!;

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Verify user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's company
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(
        JSON.stringify({ error: "No company associated" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the QB connection
    const { data: connection, error: connError } = await supabaseAdmin
      .from("financial_connections")
      .select("*")
      .eq("company_id", profile.company_id)
      .eq("provider", "quickbooks")
      .eq("status", "connected")
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "QuickBooks not connected" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark sync as in progress
    await supabaseAdmin
      .from("financial_connections")
      .update({ last_sync_status: "in_progress" })
      .eq("id", connection.id);

    // Check if token needs refresh (refresh if expires within 5 minutes)
    let accessToken = connection.access_token;
    const tokenExpiry = new Date(connection.token_expires_at);
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    if (tokenExpiry < fiveMinutesFromNow) {
      console.log("Refreshing expired token...");
      const refreshResponse = await fetch(QB_TOKEN_URL, {
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

      if (!refreshResponse.ok) {
        await supabaseAdmin
          .from("financial_connections")
          .update({
            status: "error",
            last_sync_status: "error",
            last_sync_error: "Token refresh failed. Please reconnect.",
          })
          .eq("id", connection.id);

        return new Response(
          JSON.stringify({
            error: "Token refresh failed. Please reconnect QuickBooks.",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;

      await supabaseAdmin
        .from("financial_connections")
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: new Date(
            Date.now() + tokens.expires_in * 1000
          ).toISOString(),
        })
        .eq("id", connection.id);
    }

    const realmId = connection.realm_id;
    const baseUrl = `${QB_API_BASE}/${realmId}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // ======================================================================
    // Sync Invoices
    // ======================================================================
    const invoicesResponse = await fetch(
      `${baseUrl}/query?query=${encodeURIComponent(
        "SELECT * FROM Invoice MAXRESULTS 100"
      )}&minorversion=73`,
      { headers }
    );

    let invoiceCount = 0;
    if (invoicesResponse.ok) {
      const invoicesData = await invoicesResponse.json();
      const invoices =
        invoicesData?.QueryResponse?.Invoice || [];

      for (const inv of invoices) {
        const lineItems = (inv.Line || [])
          .filter((l: any) => l.DetailType === "SalesItemLineDetail")
          .map((l: any) => ({
            description: l.Description || "",
            amount: l.Amount || 0,
            quantity: l.SalesItemLineDetail?.Qty || 1,
            rate: l.SalesItemLineDetail?.UnitPrice || 0,
          }));

        // Determine status
        let status = "Open";
        if (inv.Balance === 0 && inv.TotalAmt > 0) status = "Paid";
        else if (
          inv.DueDate &&
          new Date(inv.DueDate) < new Date()
        )
          status = "Overdue";

        await supabaseAdmin.from("synced_invoices").upsert(
          {
            connection_id: connection.id,
            external_id: String(inv.Id),
            external_doc_number: inv.DocNumber || null,
            customer_name:
              inv.CustomerRef?.name || null,
            customer_id: inv.CustomerRef?.value || null,
            due_date: inv.DueDate || null,
            txn_date: inv.TxnDate || null,
            total_amount: inv.TotalAmt || 0,
            balance: inv.Balance || 0,
            status: status,
            line_items: lineItems,
            raw_data: inv,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "connection_id,external_id" }
        );
        invoiceCount++;
      }
    } else {
      console.error(
        "Invoice fetch failed:",
        invoicesResponse.status,
        await invoicesResponse.text()
      );
    }

    // ======================================================================
    // Sync Payments
    // ======================================================================
    const paymentsResponse = await fetch(
      `${baseUrl}/query?query=${encodeURIComponent(
        "SELECT * FROM Payment MAXRESULTS 100"
      )}&minorversion=73`,
      { headers }
    );

    let paymentCount = 0;
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      const payments =
        paymentsData?.QueryResponse?.Payment || [];

      for (const pmt of payments) {
        // Try to match to a synced invoice
        let invoiceId = null;
        const linkedInvoiceIds = (pmt.Line || [])
          .filter(
            (l: any) =>
              l.LinkedTxn?.some((t: any) => t.TxnType === "Invoice")
          )
          .flatMap((l: any) =>
            l.LinkedTxn.filter((t: any) => t.TxnType === "Invoice").map(
              (t: any) => String(t.TxnId)
            )
          );

        if (linkedInvoiceIds.length > 0) {
          const { data: matchedInvoice } = await supabaseAdmin
            .from("synced_invoices")
            .select("id")
            .eq("connection_id", connection.id)
            .eq("external_id", linkedInvoiceIds[0])
            .single();
          if (matchedInvoice) invoiceId = matchedInvoice.id;
        }

        await supabaseAdmin.from("synced_payments").upsert(
          {
            connection_id: connection.id,
            external_id: String(pmt.Id),
            customer_name:
              pmt.CustomerRef?.name || null,
            customer_id: pmt.CustomerRef?.value || null,
            txn_date: pmt.TxnDate || null,
            total_amount: pmt.TotalAmt || 0,
            payment_method:
              pmt.PaymentMethodRef?.name || null,
            reference_number: pmt.PaymentRefNum || null,
            invoice_id: invoiceId,
            raw_data: pmt,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "connection_id,external_id" }
        );
        paymentCount++;
      }
    } else {
      console.error(
        "Payment fetch failed:",
        paymentsResponse.status,
        await paymentsResponse.text()
      );
    }

    // ======================================================================
    // Sync Expenses (Purchases/Bills)
    // ======================================================================
    const billsResponse = await fetch(
      `${baseUrl}/query?query=${encodeURIComponent(
        "SELECT * FROM Bill MAXRESULTS 100"
      )}&minorversion=73`,
      { headers }
    );

    let expenseCount = 0;
    if (billsResponse.ok) {
      const billsData = await billsResponse.json();
      const bills = billsData?.QueryResponse?.Bill || [];

      for (const bill of bills) {
        const lineItems = (bill.Line || []).map((l: any) => ({
          description: l.Description || "",
          amount: l.Amount || 0,
          account:
            l.AccountBasedExpenseLineDetail?.AccountRef?.name || "",
        }));

        let status = "Unpaid";
        if (bill.Balance === 0 && bill.TotalAmt > 0) status = "Paid";
        else if (
          bill.DueDate &&
          new Date(bill.DueDate) < new Date()
        )
          status = "Overdue";

        await supabaseAdmin.from("synced_expenses").upsert(
          {
            connection_id: connection.id,
            external_id: String(bill.Id),
            expense_type: "bill",
            vendor_name:
              bill.VendorRef?.name || null,
            vendor_id: bill.VendorRef?.value || null,
            txn_date: bill.TxnDate || null,
            due_date: bill.DueDate || null,
            total_amount: bill.TotalAmt || 0,
            balance: bill.Balance || 0,
            status: status,
            line_items: lineItems,
            raw_data: bill,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "connection_id,external_id" }
        );
        expenseCount++;
      }
    }

    // Also sync Purchase entries (direct expenses)
    const purchasesResponse = await fetch(
      `${baseUrl}/query?query=${encodeURIComponent(
        "SELECT * FROM Purchase MAXRESULTS 100"
      )}&minorversion=73`,
      { headers }
    );

    if (purchasesResponse.ok) {
      const purchasesData = await purchasesResponse.json();
      const purchases =
        purchasesData?.QueryResponse?.Purchase || [];

      for (const purchase of purchases) {
        const lineItems = (purchase.Line || []).map((l: any) => ({
          description: l.Description || "",
          amount: l.Amount || 0,
          account:
            l.AccountBasedExpenseLineDetail?.AccountRef?.name || "",
        }));

        await supabaseAdmin.from("synced_expenses").upsert(
          {
            connection_id: connection.id,
            external_id: `purchase_${purchase.Id}`,
            expense_type: "purchase",
            vendor_name:
              purchase.EntityRef?.name || null,
            vendor_id: purchase.EntityRef?.value || null,
            txn_date: purchase.TxnDate || null,
            total_amount: purchase.TotalAmt || 0,
            balance: 0,
            status: "Paid",
            line_items: lineItems,
            raw_data: purchase,
            last_synced_at: new Date().toISOString(),
          },
          { onConflict: "connection_id,external_id" }
        );
        expenseCount++;
      }
    }

    // ======================================================================
    // Update sync status
    // ======================================================================
    await supabaseAdmin
      .from("financial_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "success",
        last_sync_error: null,
      })
      .eq("id", connection.id);

    return new Response(
      JSON.stringify({
        success: true,
        synced: {
          invoices: invoiceCount,
          payments: paymentCount,
          expenses: expenseCount,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("quickbooks-sync error:", error);

    // Try to update the connection status
    try {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("company_id")
        .eq("id", (await supabaseAdmin.auth.getUser()).data.user?.id)
        .single();

      if (profile?.company_id) {
        await supabaseAdmin
          .from("financial_connections")
          .update({
            last_sync_status: "error",
            last_sync_error: error.message,
          })
          .eq("company_id", profile.company_id)
          .eq("provider", "quickbooks");
      }
    } catch {
      // Ignore cleanup errors
    }

    return new Response(
      JSON.stringify({ error: error.message || "Sync failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
