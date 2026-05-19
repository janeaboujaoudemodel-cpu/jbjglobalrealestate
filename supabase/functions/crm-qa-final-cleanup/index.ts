// TEMPORARY one-shot: deletes QA auth users for infoo.jane+qa-*. Owner-only.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const deleted: string[] = [];
  for (let page = 1; page <= 5; page++) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    if (!users.length) break;
    for (const u of users) {
      const e = (u.email ?? "").toLowerCase();
      if (e.startsWith("infoo.jane+qa-")) {
        await admin.auth.admin.deleteUser(u.id);
        deleted.push(e);
      }
    }
    if (users.length < 200) break;
  }
  return new Response(JSON.stringify({ ok: true, deleted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
