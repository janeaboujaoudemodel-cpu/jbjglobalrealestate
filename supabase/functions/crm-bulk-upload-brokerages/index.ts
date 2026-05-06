/**
 * crm-bulk-upload-brokerages
 *
 * Owner-only. Accepts a parsed file payload (XLSX/CSV/HTML text), extracts
 * company rows, classifies each one (real-estate brokerage / developer /
 * mortgage / other) using Lovable AI, then:
 *   - Inserts real-estate brokerages into crm_brokerages (with strict de-dup)
 *   - Reroutes developers into crm_developer_registry (with de-dup)
 *   - Rejects mortgage / consulting / other firms (returned in report)
 *
 * Returns: { inserted, rerouted, rejected_non_real_estate, duplicates_skipped, total, sample_inserted, sample_rejected }
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "janeaboujaoudemodel@gmail.com",
  "infoo.jane@gmail.com",
];

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .replace(/\(branch\)/g, "")
    .replace(/\b(llc|l\.l\.c|fz-llc|fz llc|fzco|dmcc|ltd|limited|co\.|company|trading|real estate|properties|brokerage|broker|brokers)\b/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

/** Parse plain text/CSV/HTML to row objects. Excel binary is detected client-side. */
function parseRows(filename: string, content: string): Array<Record<string, string>> {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".html") || lower.endsWith(".htm") || /<table[\s>]/i.test(content)) {
    return parseHtmlTable(content);
  }
  if (lower.endsWith(".tsv")) return parseDelimited(content, "\t");
  return parseDelimited(content, detectDelim(content));
}

function detectDelim(text: string): string {
  const head = text.split(/\r?\n/, 5).join("\n");
  const c = (head.match(/,/g) || []).length;
  const t = (head.match(/\t/g) || []).length;
  const s = (head.match(/;/g) || []).length;
  return Math.max(c, t, s) === t ? "\t" : Math.max(c, s) === s ? ";" : ",";
}

function parseDelimited(text: string, delim: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const splitLine = (line: string) => {
    const cells: string[] = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { q = !q; continue; }
      if (ch === delim && !q) { cells.push(cur); cur = ""; continue; }
      cur += ch;
    }
    cells.push(cur);
    return cells.map((c) => c.trim());
  };
  const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
  const out: Array<Record<string, string>> = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ""; });
    out.push(row);
  }
  return out;
}

function parseHtmlTable(html: string): Array<Record<string, string>> {
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  const inner = tableMatch ? tableMatch[1] : html;
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const stripTags = (s: string) =>
    s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  const rows: string[][] = [];
  let m: RegExpExecArray | null;
  while ((m = rowRe.exec(inner)) !== null) {
    const cells: string[] = [];
    let cm: RegExpExecArray | null;
    const cellSrc = m[1];
    while ((cm = cellRe.exec(cellSrc)) !== null) cells.push(stripTags(cm[1]));
    if (cells.length) rows.push(cells);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.toLowerCase());
  return rows.slice(1).map((cells) => {
    const r: Record<string, string> = {};
    headers.forEach((h, i) => { r[h] = cells[i] ?? ""; });
    return r;
  });
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k] ?? row[k.toLowerCase()];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

interface CompanyRow {
  name: string;
  arabic?: string;
  dld?: string;
  emirate?: string;
  phone?: string;
  email?: string;
  website?: string;
}

function extractCompany(r: Record<string, string>): CompanyRow | null {
  const name = pick(r, ["company_name", "company name", "office name", "office_name", "name", "agency", "developer", "brokerage", "company"]);
  if (!name || name.length < 2) return null;
  return {
    name,
    arabic: pick(r, ["name (arabic)", "arabic", "name_arabic"]),
    dld: pick(r, ["office number", "office_number", "dld", "license", "license_no", "license number", "rera"]),
    emirate: pick(r, ["emirate", "city"]),
    phone: pick(r, ["phone", "telephone", "tel", "mobile"]),
    email: pick(r, ["email", "e-mail"]),
    website: pick(r, ["website", "url"]),
  };
}

/** Classify a batch of company names via Lovable AI Gateway. */
async function classifyBatch(names: string[]): Promise<Record<string, "brokerage" | "developer" | "mortgage" | "other">> {
  if (!names.length) return {};
  if (!LOVABLE_API_KEY) {
    const out: Record<string, any> = {};
    for (const n of names) {
      const l = n.toLowerCase();
      if (/(mortgage|finance|consult|loan|advisor)/.test(l)) out[n] = "mortgage";
      else if (/(develop|properties developer|holding)/.test(l) && !/broker/.test(l)) out[n] = "developer";
      else out[n] = "brokerage";
    }
    return out;
  }
  const prompt = `Classify each UAE real-estate company by name. For each entry return one of: "brokerage" (real-estate brokerage / agency that sells or rents property), "developer" (master/sub developer that builds property), "mortgage" (mortgage broker, finance/loan advisor, banking consultancy — NOT real estate), or "other" (consulting, holding, hotel, retail, etc).

Return strict JSON: {"results":[{"name":"...","kind":"brokerage|developer|mortgage|other"}]}.

Companies:
${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    const json = await res.json();
    const txt = json?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(txt);
    const out: Record<string, any> = {};
    for (const r of parsed.results || []) {
      if (r?.name && r?.kind) out[r.name] = r.kind;
    }
    for (const n of names) if (!out[n]) out[n] = "brokerage";
    return out;
  } catch (e) {
    console.warn("Classify failed, defaulting all to brokerage:", e);
    const out: Record<string, any> = {};
    for (const n of names) out[n] = "brokerage";
    return out;
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("NO_AUTH");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { filename, content } = await req.json() as { filename: string; content: string };
    if (!content) throw new Error("Empty file");

    const rows = parseRows(filename || "", content);
    const companies = rows.map(extractCompany).filter(Boolean) as CompanyRow[];
    if (!companies.length) {
      return new Response(JSON.stringify({
        inserted: 0, rerouted: 0, rejected_non_real_estate: 0,
        duplicates_skipped: 0, total: 0, error: "No company rows detected. Use a header row with column 'Company Name'.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: existingBrk } = await service
      .from("crm_brokerages")
      .select("company_name, dld_office_number");
    const existingBrkNorms = new Set((existingBrk || []).map((r: any) => norm(r.company_name)));
    const existingDld = new Set((existingBrk || []).filter((r: any) => r.dld_office_number).map((r: any) => r.dld_office_number));

    const { data: existingDev } = await service
      .from("crm_developer_registry")
      .select("developer_name, developer_slug");
    const existingDevNorms = new Set((existingDev || []).map((r: any) => norm(r.developer_name)));

    const classifyMap: Record<string, "brokerage" | "developer" | "mortgage" | "other"> = {};
    for (let i = 0; i < companies.length; i += 30) {
      const chunk = companies.slice(i, i + 30).map((c) => c.name);
      const m = await classifyBatch(chunk);
      Object.assign(classifyMap, m);
    }

    let inserted = 0, rerouted = 0, rejected = 0, dupes = 0;
    const sampleInserted: string[] = [];
    const sampleRejected: string[] = [];

    const brkInserts: any[] = [];
    const devInserts: any[] = [];

    for (const c of companies) {
      const kind = classifyMap[c.name] || "brokerage";
      const n = norm(c.name);
      if (kind === "mortgage" || kind === "other") {
        rejected++;
        if (sampleRejected.length < 10) sampleRejected.push(c.name);
        continue;
      }
      if (kind === "developer") {
        if (existingDevNorms.has(n)) { dupes++; continue; }
        existingDevNorms.add(n);
        devInserts.push({
          owner_id: user.id,
          developer_name: c.name,
          developer_slug: slugify(c.name),
          status: "not_started",
          phone: c.phone || null,
          developer_email: c.email || null,
          website: c.website || null,
          emirate: c.emirate || null,
        });
        rerouted++;
        continue;
      }
      if (c.dld && existingDld.has(c.dld)) { dupes++; continue; }
      if (existingBrkNorms.has(n)) { dupes++; continue; }
      existingBrkNorms.add(n);
      if (c.dld) existingDld.add(c.dld);
      brkInserts.push({
        company_name: c.name,
        name_arabic: c.arabic || null,
        dld_office_number: c.dld || null,
        emirate: c.emirate || null,
        phone: c.phone || null,
        email: c.email || null,
        website: c.website || null,
        owner_id: user.id,
      });
      if (sampleInserted.length < 10) sampleInserted.push(c.name);
      inserted++;
    }

    const insertChunked = async (table: string, rows: any[]) => {
      for (let i = 0; i < rows.length; i += 200) {
        const slice = rows.slice(i, i + 200);
        const { error } = await service.from(table).insert(slice);
        if (error) console.warn(`Insert ${table} chunk failed:`, error.message);
      }
    };
    if (brkInserts.length) await insertChunked("crm_brokerages", brkInserts);
    if (devInserts.length) await insertChunked("crm_developer_registry", devInserts);

    return new Response(JSON.stringify({
      inserted, rerouted, rejected_non_real_estate: rejected,
      duplicates_skipped: dupes, total: companies.length,
      sample_inserted: sampleInserted, sample_rejected: sampleRejected,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-bulk-upload-brokerages error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
