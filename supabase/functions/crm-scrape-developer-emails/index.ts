// Scrapes developer websites to fill missing admin_email.
// Idempotent: only touches rows where admin_email IS NULL/'' and website_url is set.
// Records provenance in developers.metadata->>'admin_email_source'.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { safeFetch } from "../_shared/ssrf-guard.ts";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BAD_PREFIXES = ["noreply", "no-reply", "donotreply", "example", "wixpress", "sentry"];
const BAD_TLDS = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];

// Prefer these mailbox names when multiple emails are found
const PREFERRED = ["sales", "partnerships", "partner", "brokers", "broker", "contact", "info", "hello", "admin", "enquiries", "inquiries"];

function scoreEmail(e: string): number {
  const lower = e.toLowerCase();
  if (BAD_PREFIXES.some((p) => lower.startsWith(p + "@") || lower.startsWith(p + "."))) return -1;
  if (BAD_TLDS.some((t) => lower.endsWith(t))) return -1;
  const local = lower.split("@")[0];
  const idx = PREFERRED.indexOf(local);
  if (idx >= 0) return 100 - idx;
  return 10;
}

function pickBest(emails: string[], domainHint: string | null): string | null {
  const uniq = Array.from(new Set(emails.map((e) => e.trim().toLowerCase())));
  const scored = uniq
    .map((e) => ({ e, s: scoreEmail(e) + (domainHint && e.endsWith("@" + domainHint) ? 25 : 0) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  return scored[0]?.e ?? null;
}

async function fetchText(url: string, timeoutMs = 6000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await safeFetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; JBJ-Enrich/1.0; +https://jbj.ae)",
        accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text") && !ct.includes("html")) return null;
    const buf = await res.arrayBuffer();
    const slice = buf.byteLength > 200_000 ? buf.slice(0, 200_000) : buf;
    return new TextDecoder("utf-8", { fatal: false }).decode(slice);
  } catch {
    return null;
  }
}

function domainOf(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function extractEmails(html: string): string[] {
  const out: string[] = [];
  // Fast path: mailto: links
  const mailtoRe = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  let m: RegExpExecArray | null;
  while ((m = mailtoRe.exec(html)) !== null) out.push(m[1]);
  if (out.length) return out;
  // Fallback: plain-text emails, cap to first 5 matches to protect CPU
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  for (let i = 0; i < 5; i++) {
    const mm = re.exec(html);
    if (!mm) break;
    out.push(mm[0]);
  }
  return out;
}

async function findEmailForSite(website: string): Promise<{ email: string | null; source: string | null }> {
  const base = website.startsWith("http") ? website : `https://${website}`;
  const domain = domainOf(base);
  // Only two paths to stay within CPU budget: homepage + /contact
  const paths = ["", "/contact"];
  const foundBySource: { email: string; source: string }[] = [];
  for (const p of paths) {
    const url = base.replace(/\/$/, "") + p;
    const html = await fetchText(url);
    if (!html) continue;
    const emails = extractEmails(html);
    for (const e of emails) foundBySource.push({ email: e, source: url });
    if (foundBySource.length) break;
  }
  const best = pickBest(foundBySource.map((f) => f.email), domain);
  if (!best) return { email: null, source: null };
  const src = foundBySource.find((f) => f.email.toLowerCase() === best)?.source ?? null;
  return { email: best, source: src };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit ?? 50), 200);
    const dryRun = Boolean(body.dry_run ?? false);

    const { data: rows, error } = await supabase
      .from("developers")
      .select("id, name, website_url, admin_email, enrichment_source")
      .eq("is_hidden", false)
      .or("admin_email.is.null,admin_email.eq.")
      .not("website_url", "is", null)
      .neq("website_url", "")
      .order("last_enriched_at", { ascending: true, nullsFirst: true })
      .limit(limit);
    if (error) throw error;

    const results: any[] = [];
    let updated = 0;
    for (const dev of rows ?? []) {
      const { email, source } = await findEmailForSite(dev.website_url!);
      const entry = { id: dev.id, name: dev.name, website: dev.website_url, email, source };
      results.push(entry);
      if (dryRun) continue;
      if (email) {
        const { error: upErr } = await supabase
          .from("developers")
          .update({ admin_email: email, enrichment_source: `website:${source}`, last_enriched_at: new Date().toISOString() })
          .eq("id", dev.id);
        if (!upErr) updated++;
        else entry.source = `update_error:${upErr.message}`;
      } else {
        // Mark as attempted so subsequent runs advance to fresh rows
        await supabase.from("developers").update({ last_enriched_at: new Date().toISOString() }).eq("id", dev.id);
      }
    }

    return new Response(
      JSON.stringify({ scanned: rows?.length ?? 0, updated, dry_run: dryRun, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
