// supabase/functions/dld-daily-sync/index.ts
// -------------------------------------------------------------
// DLD Daily Sync — scrapes DLD's public lists via Firecrawl and
// stages results for dedup-safe ingestion. Never overwrites live rows.
//
// Sources (all JS-rendered SPAs — require Firecrawl JS render):
//   • Developers   → dubailand.gov.ae/en/eservices/approved-real-estate-developers/approved-developers/#/
//   • Brokerages   → dubailand.gov.ae/en/eservices/licensed-real-estate-brokers-offices/licensed-real-estate-brokers-offices-list/#/
//   • Brokers      → dubailand.gov.ae/en/eservices/licensed-real-estate-brokers/licensed-real-estate-brokers-list/#/
//
// Flow per segment:
//   1. Firecrawl /scrape with { formats:['markdown','html','screenshot'], waitFor: 8000 }
//   2. Parse HTML table into rows.
//   3. Insert raw rows into dld_scrape_staging_<segment>.
//   4. Call dld-ingest-and-dedupe to move eligible rows into live tables.
//
// Screenshot is stored as base64 preview URL in dld_daily_sync_runs.
// -------------------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Segment = "developer" | "brokerage" | "broker";

const SOURCES: Record<Segment, string> = {
  developer:
    "https://dubailand.gov.ae/en/eservices/approved-real-estate-developers/approved-developers/#/",
  brokerage:
    "https://dubailand.gov.ae/en/eservices/licensed-real-estate-brokers-offices/licensed-real-estate-brokers-offices-list/#/",
  broker:
    "https://dubailand.gov.ae/en/eservices/licensed-real-estate-brokers/licensed-real-estate-brokers-list/#/",
};

const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

async function firecrawlScrape(url: string, apiKey: string) {
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "html", "screenshot"],
      onlyMainContent: false,
      waitFor: 8000,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl [${res.status}]: ${body}`);
  }
  return await res.json();
}

/** Very tolerant HTML table extractor — DLD's list pages render one main
 *  <table> with header + body rows. If Firecrawl returns rendered HTML we
 *  can pull rows deterministically. Fallback: markdown pipe-table parse. */
function extractRows(html: string, markdown: string): string[][] {
  const rows: string[][] = [];
  if (html) {
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let m: RegExpExecArray | null;
    while ((m = trRe.exec(html))) {
      const cells: string[] = [];
      let c: RegExpExecArray | null;
      while ((c = cellRe.exec(m[1]))) {
        const txt = c[1]
          .replace(/<[^>]*>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim();
        cells.push(txt);
      }
      if (cells.length >= 2) rows.push(cells);
    }
    if (rows.length > 1) return rows;
  }
  // Markdown fallback (pipe tables)
  if (markdown) {
    for (const line of markdown.split("\n")) {
      const l = line.trim();
      if (!l.startsWith("|") || !l.endsWith("|")) continue;
      if (/^\|\s*-+/.test(l)) continue;
      const cells = l.slice(1, -1).split("|").map((s) => s.trim());
      if (cells.length >= 2) rows.push(cells);
    }
  }
  return rows;
}

function stageDeveloper(row: string[]) {
  const [c0, c1, c2, c3, c4, c5, c6] = row;
  return {
    developer_no: c0 || null,
    name_en: c1 || null,
    name_ar: c2 || null,
    license_no: c3 || null,
    phone: c4 || null,
    email: c5 || null,
    status: c6 || null,
    raw_row: { cells: row },
  };
}
function stageBrokerage(row: string[]) {
  const [c0, c1, c2, c3, c4, c5, c6, c7] = row;
  return {
    office_no: c0 || null,
    name_en: c1 || null,
    name_ar: c2 || null,
    manager: c3 || null,
    phone: c4 || null,
    email: c5 || null,
    area: c6 || null,
    license_expiry: null,
    raw_row: { cells: row, license_expiry_text: c7 ?? null },
  };
}
function stageBroker(row: string[]) {
  const [c0, c1, c2, c3, c4, c5, c6, c7] = row;
  return {
    broker_no: c0 || null,
    name_en: c1 || null,
    name_ar: c2 || null,
    office_name: c3 || null,
    mobile: c4 || null,
    email: c5 || null,
    license_category: c6 || null,
    area: c7 || null,
    license_expiry: null,
    raw_row: { cells: row },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const requested: Segment[] =
      Array.isArray(body?.segments) && body.segments.length
        ? body.segments
        : ["developer", "brokerage", "broker"];

    const run_id = crypto.randomUUID();
    const started_at = new Date().toISOString();
    const perSegment: Record<string, any> = {};

    for (const seg of requested) {
      const t0 = Date.now();
      try {
        const scr = await firecrawlScrape(SOURCES[seg], FIRECRAWL_API_KEY);
        const html: string = scr?.data?.html ?? scr?.html ?? "";
        const markdown: string = scr?.data?.markdown ?? scr?.markdown ?? "";
        const screenshot: string | null =
          scr?.data?.screenshot ?? scr?.screenshot ?? null;

        const rawRows = extractRows(html, markdown);
        // Drop header row if it looks like column titles
        const rows = rawRows.slice(rawRows.length > 0 ? 1 : 0);

        let inserted = 0;
        if (rows.length) {
          const table =
            seg === "developer"
              ? "dld_scrape_staging_developers"
              : seg === "brokerage"
              ? "dld_scrape_staging_brokerages"
              : "dld_scrape_staging_brokers";
          const mapper =
            seg === "developer"
              ? stageDeveloper
              : seg === "brokerage"
              ? stageBrokerage
              : stageBroker;

          const payload = rows.map((r) => ({ ...mapper(r), run_id }));
          // Insert in chunks of 500
          for (let i = 0; i < payload.length; i += 500) {
            const chunk = payload.slice(i, i + 500);
            const { error } = await admin.from(table).insert(chunk);
            if (error) throw error;
            inserted += chunk.length;
          }
        }

        perSegment[seg] = {
          ok: true,
          scanned: rows.length,
          staged: inserted,
          screenshot_present: !!screenshot,
          elapsed_ms: Date.now() - t0,
        };
      } catch (err) {
        perSegment[seg] = {
          ok: false,
          error: String(err instanceof Error ? err.message : err),
          elapsed_ms: Date.now() - t0,
        };
      }
    }

    // Log run summary — schema uses run_started_at / run_finished_at / raw_summary.
    const allOk = Object.values(perSegment).every((s: any) => s.ok);
    const anyOk = Object.values(perSegment).some((s: any) => s.ok);
    const status = allOk ? "completed" : anyOk ? "partial" : "failed";
    const firstError = Object.values(perSegment).find((s: any) => !s.ok) as any;

    const { error: logErr } = await admin.from("dld_daily_sync_runs").insert({
      status,
      run_started_at: started_at,
      run_finished_at: new Date().toISOString(),
      raw_summary: { run_id, segments: perSegment },
      source_urls: SOURCES,
      error_message: firstError?.error ?? null,
      brokers_secondary_new: 0,
      brokers_offplan_new: 0,
      brokerages_new: 0,
      developers_new: 0,
    } as any);
    if (logErr) console.error("dld-daily-sync log insert failed:", logErr.message);

    // Fire ingest+dedupe (non-blocking)
    const ingestUrl = `${SUPABASE_URL}/functions/v1/dld-ingest-and-dedupe`;
    fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ run_id }),
    }).catch(() => {});

    return new Response(
      JSON.stringify({ ok: true, run_id, segments: perSegment }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err instanceof Error ? err.message : err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
