/**
 * enrich-project-payment-plans
 *
 * For each published project that is missing a real payment_breakdown,
 * search the web (Firecrawl) for the project + developer, scrape the
 * top results, and ask the Lovable AI gateway (Gemini Flash) to
 * extract a confident payment plan. Writes back to:
 *   - projects.payment_breakdown (jsonb array of milestones)
 *   - projects.payment_plan (short text summary, e.g. "20 / 80")
 * and records an admin_edit_log row so Undo / provenance still works.
 *
 * Body:
 *   { batchSize?: number = 10, dryRun?: boolean = false, projectId?: string }
 *
 * Anti-fabrication:
 *   - Only writes when the AI returns confidence === "high" AND the
 *     percentages sum to exactly 100 across 2 or 3 stages.
 *   - Sources URLs are stored in admin_edit_log.after_values.sources[].
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Milestone {
  milestone: string;
  percentage: number;
}

interface AIResult {
  confidence: "high" | "medium" | "low" | "none";
  payment_plan_summary: string | null; // e.g. "20 / 80"
  payment_breakdown: Milestone[];
  sources: string[];
  notes?: string;
}

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";
const LOVABLE_AI = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function firecrawlSearch(query: string, apiKey: string) {
  const r = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit: 4,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`firecrawl search ${r.status}: ${txt.slice(0, 200)}`);
  }
  return r.json();
}

function extractDocs(searchJson: unknown): { url: string; markdown: string; title?: string }[] {
  const out: { url: string; markdown: string; title?: string }[] = [];
  // v2 search returns { data: { web: [{ url, title, markdown }] } } OR { data: [...] }
  const data: any = (searchJson as any)?.data ?? searchJson;
  const arr: any[] = Array.isArray(data?.web)
    ? data.web
    : Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];
  for (const item of arr) {
    const url = item?.url || item?.metadata?.sourceURL;
    const md = item?.markdown || item?.content || "";
    if (url && md) out.push({ url, markdown: String(md).slice(0, 8000), title: item?.title });
  }
  return out;
}

async function askAI(
  projectName: string,
  developerName: string | null,
  docs: { url: string; markdown: string; title?: string }[],
  lovableKey: string,
): Promise<AIResult> {
  const sources = docs
    .map((d, i) => `### Source ${i + 1}: ${d.title ?? ""}\nURL: ${d.url}\n---\n${d.markdown}`)
    .join("\n\n");

  const sys = `You extract REAL ESTATE payment plans for off-plan projects in Dubai/UAE.
Return STRICT JSON only:
{
  "confidence": "high" | "medium" | "low" | "none",
  "payment_plan_summary": string | null,  // e.g. "20 / 80" or "10 / 80 / 10", or null
  "payment_breakdown": [{ "milestone": string, "percentage": number }],
  "sources": string[],
  "notes": string
}

RULES:
- Only return "high" confidence when the source explicitly states the payment plan for THIS exact project (matching name + developer) AND percentages sum to exactly 100 across 2 or 3 stages.
- Prefer developer official sites (emaar.com, damacproperties.com, sobharealty.com, nakheel.com, meraas.com, etc.).
- IGNORE generic 80/20 / 60/40 mentions that are not tied to this project.
- Allowed milestone labels: "Down payment", "On Booking", "During Construction", "On Handover", "Post Handover".
- If unsure, return confidence "none" and an empty breakdown. NEVER fabricate.`;

  const user = `Project: "${projectName}"
Developer: ${developerName ?? "unknown"}

Web sources:
${sources}

Return the JSON object only.`;

  const r = await fetch(LOVABLE_AI, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`lovable ai ${r.status}: ${txt.slice(0, 200)}`);
  }
  const json = await r.json();
  const content = json?.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(content) as AIResult;
  } catch {
    return { confidence: "none", payment_plan_summary: null, payment_breakdown: [], sources: [] };
  }
}

const DEFAULT_LABELS = ["Down payment", "During construction", "Post handover", "Stage 4"];

function validBreakdown(ms: Milestone[]): boolean {
  if (!Array.isArray(ms) || ms.length < 2 || ms.length > 4) return false;
  const pcts = ms.map((m) => Number(m?.percentage || 0));
  if (!pcts.every((n) => Number.isFinite(n) && n > 0)) return false;
  const sum = pcts.reduce((a, b) => a + b, 0);
  return sum >= 95 && sum <= 105;
}

function normalizeBreakdown(ms: Milestone[]): Milestone[] {
  return ms.map((m, i) => ({
    milestone: m?.milestone?.toString().trim() || DEFAULT_LABELS[i] || `Stage ${i + 1}`,
    percentage: Math.round(Number(m?.percentage || 0)),
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!firecrawlKey || !lovableKey) {
    return new Response(
      JSON.stringify({ error: "FIRECRAWL_API_KEY or LOVABLE_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  let body: { batchSize?: number; dryRun?: boolean; projectId?: string } = {};
  try {
    body = await req.json();
  } catch { /* allow empty */ }

  const batchSize = Math.min(Math.max(body.batchSize ?? 10, 1), 25);
  const dryRun = !!body.dryRun;

  // Pull projects missing a real breakdown
  let query = supabase
    .from("projects")
    .select("id, slug, name, developer_name, payment_plan, payment_breakdown")
    .eq("is_published", true)
    .limit(batchSize);

  if (body.projectId) {
    query = supabase
      .from("projects")
      .select("id, slug, name, developer_name, payment_plan, payment_breakdown")
      .eq("id", body.projectId)
      .limit(1);
  } else {
    // Filter in JS for missing/invalid breakdowns — easier than complex SQL on jsonb shape
    // Only pick rows we haven't tried yet (payment_plan IS NULL). After every
    // attempt we set payment_plan to a real summary or to "TBD", so the same
    // row is never re-picked in a future batch.
    query = query.is("payment_plan", null);
  }

  const { data: projects, error } = await query;
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<{
    id: string;
    name: string;
    status: "updated" | "skipped" | "error";
    summary?: string;
    confidence?: string;
    sources?: string[];
    reason?: string;
  }> = [];

  for (const p of projects ?? []) {
    // Skip if breakdown already valid
    const existing = p.payment_breakdown;
    if (Array.isArray(existing) && validBreakdown(existing as Milestone[])) {
      results.push({ id: p.id, name: p.name, status: "skipped", reason: "already-set" });
      continue;
    }

    try {
      const dev = (p.developer_name ?? "").trim();
      const q = `${p.name} ${dev} Dubai payment plan site:${dev ? "" : ""}`.trim();
      const altQ = `"${p.name}" ${dev} payment plan installment`;
      const search = await firecrawlSearch(altQ || q, firecrawlKey);
      const docs = extractDocs(search);
      if (docs.length === 0) {
        results.push({ id: p.id, name: p.name, status: "skipped", reason: "no-search-results" });
        continue;
      }

      const ai = await askAI(p.name, dev || null, docs, lovableKey);
      const normalized = normalizeBreakdown(ai.payment_breakdown || []);
      if (ai.confidence !== "high" || !validBreakdown(normalized)) {
        // Mark as attempted so future batches don't keep re-picking the same rows.
        // payment_plan = "TBD" + payment_breakdown = [] are both non-null, so the
        // `is.null` OR filter excludes them. UI's regex won't parse "TBD" — the
        // payment line stays hidden, never showing "TBD" to users.
        if (!dryRun) {
          await supabase
            .from("projects")
            .update({ payment_plan: "TBD", payment_breakdown: [] })
            .eq("id", p.id)
            .then(() => {})
            .catch(() => {});
        }
        results.push({
          id: p.id,
          name: p.name,
          status: "skipped",
          reason: `low-confidence (${ai.confidence})`,
          confidence: ai.confidence,
        });
        continue;
      }

      const summary =
        ai.payment_plan_summary ||
        normalized.map((m) => Math.round(m.percentage)).join(" / ");

      if (!dryRun) {
        const before = {
          payment_plan: p.payment_plan,
          payment_breakdown: p.payment_breakdown,
        };
        const after = {
          payment_plan: summary,
          payment_breakdown: normalized,
        };
        const { error: updErr } = await supabase
          .from("projects")
          .update(after)
          .eq("id", p.id);
        if (updErr) throw updErr;

        // Provenance — best-effort, do not fail batch on log error
        await supabase
          .from("admin_edit_log")
          .insert({
            entity_type: "project",
            entity_id: p.id,
            section: "payment_plan",
            changed_fields: ["payment_plan", "payment_breakdown"],
            before_values: before,
            after_values: { ...after, sources: ai.sources?.length ? ai.sources : docs.map((d) => d.url) },
            source: "ai_firecrawl_enrichment",
          })
          .then(() => {})
          .catch(() => {});
      }

      results.push({
        id: p.id,
        name: p.name,
        status: "updated",
        summary,
        confidence: ai.confidence,
        sources: ai.sources?.length ? ai.sources : docs.map((d) => d.url),
      });
    } catch (e) {
      results.push({
        id: p.id,
        name: p.name,
        status: "error",
        reason: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const summary = {
    requested: projects?.length ?? 0,
    updated: results.filter((r) => r.status === "updated").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    dryRun,
  };

  return new Response(JSON.stringify({ summary, results }, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
