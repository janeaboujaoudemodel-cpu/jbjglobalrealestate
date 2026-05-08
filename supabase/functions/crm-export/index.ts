// Unified CRM export — streams CSV/XLSX/PDF scoped by inline filter, segment, brokerage,
// developer, source, event, label, country, city, language, nationality, etc.
// Uses the canonical `vw_crm_contacts` view + `crm_segment_resolve` RPC.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Scope =
  | "brokerage"
  | "developer"
  | "source"
  | "event"
  | "label"
  | "country"
  | "city"
  | "team"
  | "campaign"
  | "segment"
  | "filter"
  | "all";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = Array.isArray(v) ? v.join("|") : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const scope: Scope = (body.scope as Scope) || "all";
    const value: string | null = (body.value as string) || null;
    const format = (body.format as string) || "csv";
    const filter = (body.filter as Record<string, unknown>) || null;
    const segmentId = (body.segment_id as string) || null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve effective filter
    let effectiveFilter: Record<string, unknown> | null = filter;
    if (scope === "segment" && segmentId) {
      const { data: seg } = await admin
        .from("crm_segments")
        .select("filter")
        .eq("id", segmentId)
        .maybeSingle();
      effectiveFilter = (seg?.filter as Record<string, unknown>) || {};
    }

    let data: any[] = [];

    if (effectiveFilter || scope === "filter" || scope === "segment") {
      const { data: resolved, error } = await admin.rpc("crm_segment_resolve", {
        filter: effectiveFilter || {},
      });
      if (error) throw error;
      data = (resolved as any[]) || [];
      // ownership scoping
      data = data.filter((r) => !r.owner_id || r.owner_id === auth.userId);
    } else {
      let q = admin
        .from("vw_crm_contacts")
        .select(
          "id, kind, name, email, phone, company_id, company_kind, company_name, source, labels, last_interaction_at, created_at, department, seniority, role_title, languages, nationality, country, city, region, is_global_broker"
        )
        .eq("owner_id", auth.userId);

      switch (scope) {
        case "brokerage":
          q = q.eq("company_kind", "brokerage").eq("company_id", value);
          break;
        case "developer":
          q = q.eq("company_kind", "developer").eq("company_id", value);
          break;
        case "source":
          if (value) q = q.eq("source", value);
          break;
        case "event":
          if (value) q = q.ilike("source", `%${value}%`);
          break;
        case "label":
          if (value) q = q.contains("labels", [value]);
          break;
        case "country":
          if (value) q = q.eq("country", value);
          break;
        case "city":
          if (value) q = q.eq("city", value);
          break;
        case "team":
        case "campaign":
        case "all":
        default:
          break;
      }

      const { data: rows, error } = await q.limit(50000);
      if (error) throw error;
      data = rows || [];
    }

    if (format === "json") {
      return new Response(JSON.stringify({ rows: data, count: data.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = [
      "kind", "name", "email", "phone", "company_kind", "company_name",
      "department", "seniority", "role_title", "languages",
      "nationality", "country", "city", "region",
      "source", "labels", "last_interaction_at", "created_at",
    ];
    const lines = [headers.join(",")];
    for (const r of data) {
      lines.push(headers.map((h) => csvEscape((r as Record<string, unknown>)[h])).join(","));
    }
    const csv = lines.join("\n");
    const filename = `crm-export-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("crm-export error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Export failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
