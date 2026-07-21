// supabase/functions/dld-review-conflict/index.ts
// -------------------------------------------------------------
// Owner-only endpoint to approve/reject a flagged DLD conflict.
//   POST { conflict_id, decision: "approved" | "rejected", notes? }
//
// APPROVED → update the corresponding live row with the DLD values that differ
//            (only email/phone fields — never touches identity/name).
// REJECTED → mark the conflict resolved, live row untouched.
// -------------------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const jwt = authHeader.slice("Bearer ".length);
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await anonClient.auth.getUser(jwt);
    if (!userRes?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const uid = userRes.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", uid);
    const isOwner = (roles ?? []).some((r: any) =>
      r.role === "owner" || r.role === "admin"
    );
    if (!isOwner) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conflict_id, decision, notes } = await req.json();
    if (!conflict_id || !["approved", "rejected"].includes(decision)) {
      return new Response(JSON.stringify({ error: "conflict_id + decision required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: conflict, error: cErr } = await admin
      .from("dld_scrape_conflicts")
      .select("*")
      .eq("id", conflict_id)
      .single();
    if (cErr || !conflict) throw cErr ?? new Error("conflict not found");

    if (decision === "approved") {
      const dld = conflict.dld_snapshot ?? {};
      const patch: Record<string, any> = {};
      if (conflict.segment === "developer") {
        if (dld.email) patch.email = dld.email;
        if (dld.phone) patch.phone_number = dld.phone;
      } else if (conflict.segment === "brokerage") {
        if (dld.email) patch.email = dld.email;
        if (dld.phone) patch.phone_number = dld.phone;
      } else if (conflict.segment === "broker") {
        if (dld.email) patch.email_lower = String(dld.email).toLowerCase();
        if (dld.mobile) patch.phone_e164 = String(dld.mobile);
      }
      if (Object.keys(patch).length > 0) {
        await admin.from(conflict.live_table).update(patch).eq("id", conflict.live_row_id);
      }
    }

    await admin
      .from("dld_scrape_conflicts")
      .update({
        resolution: decision,
        resolved_by: uid,
        resolved_at: new Date().toISOString(),
        notes: notes ?? null,
      })
      .eq("id", conflict_id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err instanceof Error ? err.message : err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
