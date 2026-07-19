// Bulk import developers from 2027-6 sheet payload.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { rows } = await req.json();
    if (!Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: "rows array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    // Upsert in chunks of 200
    let inserted = 0, failed = 0;
    const errors: any[] = [];
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200).map((r: any) => ({
        ...r,
        excel_imported_at: new Date().toISOString(),
      }));
      const { error, count } = await supa
        .from("developers")
        .upsert(batch, { onConflict: "slug", ignoreDuplicates: true, count: "exact" });
      if (error) { failed += batch.length; errors.push(error.message); }
      else { inserted += count ?? batch.length; }
    }
    return new Response(JSON.stringify({ ok: true, inserted, failed, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
