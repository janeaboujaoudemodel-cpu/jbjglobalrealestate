// Unified CRM export — streams CSV scoped by brokerage / developer / source / event / label / country / city / team / campaign.
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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let q = admin
      .from("vw_crm_contacts")
      .select("id, kind, name, email, phone, company_id, company_kind, company_name, source, labels, last_interaction_at, created_at")
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
        // event_source lives on underlying tables; for view we filter by source LIKE event:value
        if (value) q = q.ilike("source", `%${value}%`);
        break;
      case "label":
        if (value) q = q.contains("labels", [value]);
        break;
      case "country":
      case "city":
      case "team":
      case "campaign":
        // Reserved scopes; underlying tables vary. Future expansion.
        break;
      case "all":
      default:
        break;
    }

    const { data, error } = await q.limit(50000);
    if (error) throw error;

    if (format === "json") {
      return new Response(JSON.stringify({ rows: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = [
      "kind", "name", "email", "phone", "company_kind", "company_name",
      "source", "labels", "last_interaction_at", "created_at",
    ];
    const lines = [headers.join(",")];
    for (const r of data || []) {
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
