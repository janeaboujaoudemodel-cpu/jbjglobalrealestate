// Owner-only utility: nulls out the bulk "Q4 2026" placeholder that was
// stamped onto non-Reelly projects. Real values from Reelly are preserved.
// After this runs, the existing `backfill-handover-dates` Stage 2 (Firecrawl)
// and Stage 3 (Lovable AI) can re-derive verified handover dates.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const placeholder: string = typeof body.placeholder === "string" ? body.placeholder : "Q4 2026";
    const dryRun: boolean = !!body.dry_run;

    // Count first so we always return a "would affect" number.
    const { count: affected } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("handover_date", placeholder)
      .is("reelly_id", null);

    let updated = 0;
    if (!dryRun) {
      const { data, error } = await supabase
        .from("projects")
        .update({ handover_date: null, expected_completion: null })
        .eq("handover_date", placeholder)
        .is("reelly_id", null)
        .select("id");
      if (error) throw error;
      updated = data?.length ?? 0;
    }

    return new Response(
      JSON.stringify({
        success: true,
        placeholder,
        dry_run: dryRun,
        affected: affected ?? 0,
        updated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
