import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Avoid unused import being tree-shaken oddly; just reference it.
  const hasCreateClient = typeof createClient === "function";

  return new Response(JSON.stringify({ ok: true, source: "esm.sh", hasCreateClient }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
