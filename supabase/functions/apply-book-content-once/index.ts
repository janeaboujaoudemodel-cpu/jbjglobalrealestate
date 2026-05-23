// One-shot backfill: applies AI-generated module content to broker_education_modules.
// Safe to call multiple times (idempotent UPDATEs). Delete after use.
import { createClient } from "npm:@supabase/supabase-js@2";
import { MODULES } from "./modules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supa = createClient(url, key);

  let ok = 0;
  const errors: string[] = [];
  for (const m of MODULES as Array<{ book_id: string; module_number: number; content: string }>) {
    const { error } = await supa
      .from("broker_education_modules")
      .update({ content: m.content, updated_at: new Date().toISOString() })
      .eq("book_id", m.book_id)
      .eq("module_number", m.module_number);
    if (error) errors.push(`${m.book_id}/${m.module_number}: ${error.message}`);
    else ok++;
  }
  return new Response(JSON.stringify({ updated: ok, total: MODULES.length, errors }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
