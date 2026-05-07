// crm-broker-match: given normalized rows + owner_id (from JWT), find best
// existing broker match for each row. Returns confidence 0..1 and reasons.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { normalizePhone, normalizeEmail, nameSimilarity } from "../_shared/brokerNormalize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IncomingRow {
  index: number;
  name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  brokerage_id?: string | null;
  agency_name?: string | null;
  license_number?: string | null;
  rera_number?: string | null;
}

interface MatchResult {
  index: number;
  match_agent_id: string | null;
  confidence: number;
  reasons: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user }, error: uErr } = await createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    ).auth.getUser();
    if (uErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rows: IncomingRow[] = Array.isArray(body?.rows) ? body.rows : [];
    if (rows.length === 0) {
      return new Response(JSON.stringify({ matches: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rows.length > 1000) {
      return new Response(JSON.stringify({ error: "Max 1000 rows per batch" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build candidate lookup keys
    const phones = new Set<string>();
    const emails = new Set<string>();
    const licenses = new Set<string>();
    for (const r of rows) {
      const p = normalizePhone(r.phone); if (p) phones.add(p);
      const w = normalizePhone(r.whatsapp); if (w) phones.add(w);
      const e = normalizeEmail(r.email); if (e) emails.add(e);
      if (r.license_number) licenses.add(String(r.license_number).trim());
      if (r.rera_number) licenses.add(String(r.rera_number).trim());
    }

    // Pull all candidate agents in 1-2 round trips. For very large registries
    // we still cap to avoid pathological reads.
    const { data: agents } = await supabase
      .from("crm_brokerage_agents")
      .select("id, name, brokerage_id, phone_normalized, whatsapp_normalized, email_normalized, license_number, rera_number")
      .eq("owner_id", user.id)
      .or([
        phones.size ? `phone_normalized.in.(${[...phones].map((p) => `"${p}"`).join(",")})` : "",
        phones.size ? `whatsapp_normalized.in.(${[...phones].map((p) => `"${p}"`).join(",")})` : "",
        emails.size ? `email_normalized.in.(${[...emails].map((e) => `"${e}"`).join(",")})` : "",
        licenses.size ? `license_number.in.(${[...licenses].map((l) => `"${l}"`).join(",")})` : "",
      ].filter(Boolean).join(","))
      .limit(5000);

    const byPhone = new Map<string, any>();
    const byEmail = new Map<string, any>();
    const byLicense = new Map<string, any>();
    for (const a of agents ?? []) {
      if (a.phone_normalized) byPhone.set(a.phone_normalized, a);
      if (a.whatsapp_normalized) byPhone.set(a.whatsapp_normalized, a);
      if (a.email_normalized) byEmail.set(a.email_normalized, a);
      if (a.license_number) byLicense.set(a.license_number, a);
      if (a.rera_number) byLicense.set(a.rera_number, a);
    }

    // Also pull a slim list for fuzzy-name fallback (same agency)
    const agencyIds = Array.from(new Set(rows.map((r) => r.brokerage_id).filter(Boolean) as string[]));
    let agencyAgents: any[] = [];
    if (agencyIds.length) {
      const { data } = await supabase
        .from("crm_brokerage_agents")
        .select("id, name, brokerage_id")
        .eq("owner_id", user.id)
        .in("brokerage_id", agencyIds)
        .limit(5000);
      agencyAgents = data ?? [];
    }

    const matches: MatchResult[] = rows.map((r) => {
      const reasons: string[] = [];
      let best: { id: string; conf: number } | null = null;

      const p = normalizePhone(r.phone);
      const w = normalizePhone(r.whatsapp);
      const e = normalizeEmail(r.email);
      const lic = r.license_number?.trim() || r.rera_number?.trim();

      const tryHit = (a: any, conf: number, reason: string) => {
        if (!a) return;
        reasons.push(reason);
        if (!best || conf > best.conf) best = { id: a.id, conf };
      };

      if (p) tryHit(byPhone.get(p), 1.0, "phone match");
      if (w) tryHit(byPhone.get(w), 1.0, "whatsapp match");
      if (e) tryHit(byEmail.get(e), 1.0, "email match");
      if (lic) tryHit(byLicense.get(lic), 1.0, "license match");

      if (!best && r.name && r.brokerage_id) {
        for (const a of agencyAgents) {
          if (a.brokerage_id !== r.brokerage_id) continue;
          const sim = nameSimilarity(r.name, a.name || "");
          if (sim >= 0.85) {
            reasons.push(`name ${(sim * 100).toFixed(0)}% + same agency`);
            if (!best || sim > best.conf) best = { id: a.id, conf: Math.max(0.75, sim) };
          }
        }
      }

      return {
        index: r.index,
        match_agent_id: best?.id ?? null,
        confidence: best?.conf ?? 0,
        reasons,
      };
    });

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
