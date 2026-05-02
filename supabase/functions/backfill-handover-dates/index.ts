import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---- Validation: only accept verifiable formats ----
const ALLOW_RE = /^(Q[1-4] 20\d{2}|20\d{2}|Ready)$/;

const normalize = (raw: unknown): string | null => {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  // Reject placeholders
  if (/^(tba|to be announced|soon|coming soon|n\/?a|unknown|null)$/i.test(s)) return null;
  // Normalize "Q3/2026", "q3-2026", "Q 3 2026" -> "Q3 2026"
  const q = s.match(/Q\s?([1-4])\s*[\/\-\s]?\s*(20\d{2})/i);
  if (q) s = `Q${q[1]} ${q[2]}`;
  // Normalize ready/completed
  if (/^(ready|completed|handed.?over)$/i.test(s)) s = "Ready";
  // Bare year: extract first future year
  if (!ALLOW_RE.test(s)) {
    const yMatch = s.match(/(20\d{2})/);
    if (yMatch) {
      const y = parseInt(yMatch[1], 10);
      if (y >= new Date().getFullYear()) s = String(y);
    }
  }
  return ALLOW_RE.test(s) ? s : null;
};

// =========================================================================
// STAGE 2 — Firecrawl scrape against project's source_url
// =========================================================================
async function stage2Firecrawl(supabase: any, batchSize: number, dryRun: boolean) {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    return { skipped: true, reason: "FIRECRAWL_API_KEY missing", updated: 0, failed: 0, details: [] };
  }

  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, name, source_url")
    .is("handover_date", null)
    .not("source_url", "is", null)
    .limit(batchSize);
  if (error) throw error;
  if (!rows?.length) return { skipped: false, updated: 0, failed: 0, details: [], remaining: 0 };

  const stats = { updated: 0, failed: 0, details: [] as string[] };

  for (const row of rows) {
    try {
      const fcResp = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: row.source_url,
          formats: [
            {
              type: "json",
              prompt:
                "Extract the project's expected handover or completion date. Return ONLY one of: 'Q1 YYYY' / 'Q2 YYYY' / 'Q3 YYYY' / 'Q4 YYYY' / a 4-digit year (YYYY) / 'Ready' (if already handed over) / null. If unclear or unverifiable, return null. Do NOT guess.",
              schema: {
                type: "object",
                properties: {
                  handover_date: { type: ["string", "null"] },
                },
                required: ["handover_date"],
              },
            },
          ],
          onlyMainContent: true,
        }),
      });

      if (!fcResp.ok) {
        stats.failed++;
        stats.details.push(`${row.name}: firecrawl ${fcResp.status}`);
        continue;
      }
      const fcData = await fcResp.json();
      const raw =
        fcData?.data?.json?.handover_date ??
        fcData?.json?.handover_date ??
        null;
      const value = normalize(raw);
      if (!value) {
        stats.failed++;
        stats.details.push(`${row.name}: no verifiable date`);
        continue;
      }

      if (!dryRun) {
        const { error: upErr } = await supabase
          .from("projects")
          .update({ handover_date: value, expected_completion: value })
          .eq("id", row.id)
          .is("handover_date", null);
        if (upErr) {
          stats.failed++;
          stats.details.push(`${row.name}: db ${upErr.message}`);
          continue;
        }
      }
      stats.updated++;
      stats.details.push(`${row.name}: ${value}`);
    } catch (e: any) {
      stats.failed++;
      stats.details.push(`${row.name}: ${e.message}`);
    }
  }

  // count remaining
  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .is("handover_date", null)
    .not("source_url", "is", null);

  return { skipped: false, ...stats, remaining: count ?? 0 };
}

// =========================================================================
// STAGE 3 — Lovable AI inference (developer + project name)
// =========================================================================
async function stage3AI(supabase: any, batchSize: number, dryRun: boolean) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) {
    return { skipped: true, reason: "LOVABLE_API_KEY missing", updated: 0, failed: 0, details: [] };
  }

  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, name, developer_name, emirate, area_name")
    .is("handover_date", null)
    .not("developer_name", "is", null)
    .limit(batchSize);
  if (error) throw error;
  if (!rows?.length) return { skipped: false, updated: 0, failed: 0, details: [], remaining: 0 };

  const projectList = rows
    .map(
      (p: any, i: number) =>
        `${i + 1}. "${p.name}" by ${p.developer_name} in ${p.area_name || p.emirate || "UAE"}`
    )
    .join("\n");

  const prompt = `You are a Dubai/UAE real estate data verifier. For each project below, return its REAL, VERIFIED expected handover/completion.

Return a JSON array (same order, same length) with objects:
{ "handover_date": "Q1 YYYY" | "Q2 YYYY" | "Q3 YYYY" | "Q4 YYYY" | "YYYY" | "Ready" | null }

CRITICAL:
- Return null if you are not confident. Do NOT invent dates.
- "Ready" means already handed over.
- Use ONLY the listed formats.

Projects:
${projectList}

Respond with ONLY the JSON array.`;

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 4000,
    }),
  });

  if (!aiResp.ok) {
    const t = await aiResp.text();
    throw new Error(`AI gateway ${aiResp.status}: ${t.slice(0, 300)}`);
  }
  const aiData = await aiResp.json();
  const content = aiData.choices?.[0]?.message?.content || "";
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("AI returned no JSON array");
  let parsed: any[];
  try {
    parsed = JSON.parse(match[0]);
  } catch (e: any) {
    throw new Error(`AI JSON parse: ${e.message}`);
  }

  const stats = { updated: 0, failed: 0, details: [] as string[] };

  for (let i = 0; i < rows.length && i < parsed.length; i++) {
    const row = rows[i];
    const value = normalize(parsed[i]?.handover_date);
    if (!value) {
      stats.failed++;
      continue;
    }
    if (!dryRun) {
      const { error: upErr } = await supabase
        .from("projects")
        .update({ handover_date: value, expected_completion: value })
        .eq("id", row.id)
        .is("handover_date", null);
      if (upErr) {
        stats.failed++;
        stats.details.push(`${row.name}: db ${upErr.message}`);
        continue;
      }
    }
    stats.updated++;
    stats.details.push(`${row.name}: ${value}`);
  }

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .is("handover_date", null)
    .not("developer_name", "is", null);

  return { skipped: false, ...stats, remaining: count ?? 0 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Owner-only
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const stage = Number(body.stage) || 0; // 0 = totals only
    const batchSize = Math.min(Math.max(Number(body.batch_size) || 20, 1), 50);
    const dryRun = !!body.dry_run;

    // Always return current totals
    const { count: totalMissing } = await supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .is("handover_date", null);

    let stageResult: any = null;

    if (stage === 2) {
      stageResult = await stage2Firecrawl(supabase, batchSize, dryRun);
    } else if (stage === 3) {
      stageResult = await stage3AI(supabase, batchSize, dryRun);
    }

    return new Response(
      JSON.stringify({
        success: true,
        stage,
        batch_size: batchSize,
        dry_run: dryRun,
        total_missing: totalMissing ?? 0,
        result: stageResult,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
