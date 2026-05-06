// crm-purge-trash — daily job that hard-deletes CRM rows trashed > 30 days ago.
// Invoked by pg_cron via net.http_post.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const svc = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const tables = ["crm_leads", "crm_brokerages", "crm_developer_registry"];
  const result: Record<string, number> = {};

  for (const t of tables) {
    const { data, error, count } = await svc
      .from(t)
      .delete({ count: "exact" })
      .lt("deleted_at", cutoff)
      .select("id", { head: true });
    if (error) {
      console.warn(`[purge] ${t} failed:`, error.message);
      result[t] = -1;
    } else {
      result[t] = count ?? 0;
    }
  }

  return new Response(JSON.stringify({ ok: true, cutoff, result }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
