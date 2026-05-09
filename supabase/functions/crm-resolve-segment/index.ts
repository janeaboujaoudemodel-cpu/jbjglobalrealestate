// crm-resolve-segment
// Resolves a segment filter (or segment_id) to leads from public.crm_leads.
// Owner/admin only. Used for both preview (count + sample) and full export.
//
// Body:
//   { filter?: SegmentFilter, segment_id?: uuid, mode?: "count"|"sample"|"all", limit?: number }
//
// SegmentFilter shape (all optional, ANDed; arrays are OR within field):
//   {
//     contact_type?: string[],
//     pipeline_stage?: string[],
//     lead_intent?: string[],
//     source?: string[],
//     tags_any?: string[],
//     company_name?: string[],
//     preferred_language?: string[],
//     vip?: boolean,
//     has_email?: boolean,           // default true
//     exclude_suppressed?: boolean,  // default true
//     search?: string,
//   }
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

interface SegmentFilter {
  contact_type?: string[];
  pipeline_stage?: string[];
  lead_intent?: string[];
  source?: string[];
  tags_any?: string[];
  company_name?: string[];
  preferred_language?: string[];
  vip?: boolean;
  has_email?: boolean;
  exclude_suppressed?: boolean;
  search?: string;
}

function buildQuery(client: ReturnType<typeof createClient>, f: SegmentFilter) {
  let q = client.from("crm_leads").select(
    "id, full_name, email_lower, phone_e164, company_name, contact_type, pipeline_stage, lead_intent, source, tags, vip, preferred_language, current_location_city, current_location_country",
    { count: "exact" },
  );

  if (f.has_email !== false) q = q.not("email_lower", "is", null);
  if (f.contact_type?.length) q = q.in("contact_type", f.contact_type as any);
  if (f.pipeline_stage?.length) q = q.in("pipeline_stage", f.pipeline_stage);
  if (f.lead_intent?.length) q = q.in("lead_intent", f.lead_intent);
  if (f.source?.length) q = q.in("source", f.source);
  if (f.preferred_language?.length) q = q.in("preferred_language", f.preferred_language);
  if (f.company_name?.length) q = q.in("company_name", f.company_name);
  if (typeof f.vip === "boolean") q = q.eq("vip", f.vip);
  if (f.tags_any?.length) q = q.overlaps("tags", f.tags_any);
  if (f.search?.trim()) {
    const s = f.search.trim().replace(/[%_]/g, "");
    q = q.or(
      `full_name.ilike.%${s}%,email_lower.ilike.%${s}%,company_name.ilike.%${s}%`,
    );
  }
  return q;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const auth = await requireOwnerAuth(req, cors);
  if (auth.response) return auth.response;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  let filter: SegmentFilter = body.filter ?? {};
  if (body.segment_id) {
    const { data: seg, error } = await supabase
      .from("crm_segments").select("filter").eq("id", body.segment_id).maybeSingle();
    if (error || !seg) return json(404, { error: "Segment not found" });
    filter = { ...(seg.filter ?? {}), ...filter };
  }

  const mode: "count" | "sample" | "all" = body.mode ?? "sample";
  const limit = mode === "all" ? Math.min(body.limit ?? 5000, 10000)
                : mode === "sample" ? Math.min(body.limit ?? 25, 100)
                : 0;

  // Suppressions
  let suppressed = new Set<string>();
  if (filter.exclude_suppressed !== false) {
    const { data: supp } = await supabase
      .from("email_suppressions").select("email_lower");
    suppressed = new Set((supp ?? []).map((r: any) => (r.email_lower || "").toLowerCase()));
  }

  // Run query
  let allRows: any[] = [];
  if (mode === "count") {
    const q = buildQuery(supabase, filter).range(0, 0);
    const { count, error } = await q;
    if (error) return json(500, { error: error.message });
    return json(200, {
      total: count ?? 0,
      filter,
      suppressed_count: suppressed.size,
    });
  } else {
    // Page through to honour limit but also so we can compute deliverable_count accurately.
    const PAGE = 1000;
    let from = 0;
    let total = 0;
    while (allRows.length < limit) {
      const to = from + PAGE - 1;
      const q = buildQuery(supabase, filter).range(from, to);
      const { data, error, count } = await q;
      if (error) return json(500, { error: error.message });
      total = count ?? total;
      if (!data?.length) break;
      allRows.push(...data);
      from += PAGE;
      if (data.length < PAGE) break;
    }
    allRows = allRows.slice(0, limit);
  }

  // Filter suppressed + dedupe
  const seen = new Set<string>();
  const deliverable: any[] = [];
  const skipped_suppressed: string[] = [];
  for (const r of allRows) {
    const e = (r.email_lower || "").toLowerCase();
    if (!e) continue;
    if (suppressed.has(e)) {
      skipped_suppressed.push(e);
      continue;
    }
    if (seen.has(e)) continue;
    seen.add(e);
    deliverable.push(r);
  }

  // Brokerage / company analysis (single-agency rule preview)
  const companyMap = new Map<string, number>();
  for (const r of deliverable) {
    const c = (r.company_name || "—").trim();
    companyMap.set(c, (companyMap.get(c) ?? 0) + 1);
  }
  const companies = Array.from(companyMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return json(200, {
    filter,
    deliverable_count: deliverable.length,
    skipped_suppressed_count: skipped_suppressed.length,
    companies,
    distinct_companies: companies.length,
    recipients: deliverable,
  });
});
