// Batch: enrich every developer that has a google_drive_url set.
// Owner/admin or service-role only. Invokes enrich-developer-from-drive per developer.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token !== SERVICE_KEY) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (!user) return json({ error: "unauthorized" }, 401);
      const { data: roles } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["owner", "admin"]);
      if (!roles?.length) return json({ error: "forbidden" }, 403);
    }

    const { data: devs, error } = await admin
      .from("developers")
      .select("id,name,google_drive_url")
      .like("google_drive_url", "https://drive.google.com/%");
    if (error) throw new Error(error.message);

    const results: Array<Record<string, unknown>> = [];
    let ok = 0, fail = 0;

    for (const dev of devs ?? []) {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/enrich-developer-from-drive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ developer_id: dev.id }),
        });
        const body = await r.json().catch(() => ({}));
        if (r.ok && body.ok) {
          ok++;
          results.push({ id: dev.id, name: dev.name, status: "ok", ...body });
        } else {
          fail++;
          results.push({ id: dev.id, name: dev.name, status: "failed", http: r.status, body });
        }
      } catch (e) {
        fail++;
        results.push({ id: dev.id, name: dev.name, status: "error", error: (e as Error).message });
      }
    }

    return json({ ok: true, total: devs?.length ?? 0, succeeded: ok, failed: fail, results });
  } catch (e) {
    console.error("enrich-all-drives", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
