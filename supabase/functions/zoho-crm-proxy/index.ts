// Zoho CRM proxy — routes owner requests to the Lovable connector gateway.
// Keeps LOVABLE_API_KEY and ZOHO_CRM_API_KEY server-side.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://connector-gateway.lovable.dev/zoho_crm";

const MODULES: Record<string, string> = {
  Leads: "Last_Name,First_Name,Full_Name,Email,Phone,Mobile,Company,Title,Lead_Status,Lead_Source,Industry,Annual_Revenue,City,Country,Description,Created_Time,Modified_Time",
  Contacts: "Last_Name,First_Name,Full_Name,Email,Phone,Mobile,Account_Name,Title,Department,Mailing_City,Mailing_Country,Description,Created_Time,Modified_Time",
  Accounts: "Account_Name,Phone,Website,Industry,Account_Type,Annual_Revenue,Employees,Billing_City,Billing_Country,Description,Created_Time,Modified_Time",
  Deals: "Deal_Name,Amount,Stage,Closing_Date,Account_Name,Contact_Name,Probability,Expected_Revenue,Type,Lead_Source,Description,Created_Time,Modified_Time",
  Tasks: "Subject,Status,Priority,Due_Date,Description,Created_Time,Modified_Time",
  Cases: "Subject,Status,Priority,Case_Origin,Type,Account_Name,Description,Created_Time,Modified_Time",
  Products: "Product_Name,Product_Code,Product_Category,Unit_Price,Qty_in_Stock,Product_Active,Description,Created_Time,Modified_Time",
  Quotes: "Subject,Quote_Stage,Grand_Total,Valid_Till,Account_Name,Contact_Name,Created_Time,Modified_Time",
  Invoices: "Subject,Status,Grand_Total,Due_Date,Account_Name,Contact_Name,Created_Time,Modified_Time",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const moduleName = (body.module as string) ?? "Leads";
    const perPage = Math.min(Math.max(parseInt(body.per_page ?? "20", 10) || 20, 1), 100);
    const page = Math.max(parseInt(body.page ?? "1", 10) || 1, 1);

    if (!MODULES[moduleName]) {
      return new Response(JSON.stringify({ error: `unknown module: ${moduleName}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const zohoKey = Deno.env.get("ZOHO_CRM_API_KEY");
    if (!lovableKey || !zohoKey) {
      return new Response(JSON.stringify({ error: "zoho_not_configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fields = MODULES[moduleName];
    const url = `${GATEWAY}/${moduleName}?fields=${encodeURIComponent(fields)}&per_page=${perPage}&page=${page}`;

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": zohoKey,
      },
    });

    if (upstream.status === 204) {
      return new Response(JSON.stringify({ data: [], info: { count: 0, page, per_page: perPage, more_records: false } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
