import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // DISABLED: Provident ingestion has been permanently disabled.
  // All project data should come from Reelly or manual uploads via Listing Admin.
  console.log("[daily-provident-auto-sync] DISABLED — Provident ingestion is turned off.");

  return new Response(
    JSON.stringify({
      success: true,
      disabled: true,
      message: "Provident ingestion has been permanently disabled. Use Reelly or manual uploads.",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    }
  );
});
