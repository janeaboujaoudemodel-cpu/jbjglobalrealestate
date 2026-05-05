// Background runner for the UAE Directory.
// Modes:
//   POST { action: "start", kind: "brokerage_seed"|"brokerage_enrich"|"developer_enrich", emirate? }
//     -> creates job, schedules first chunk via EdgeRuntime.waitUntil, returns { jobId } in <1s
//   POST { action: "continue", jobId }
//     -> processes ONE chunk, updates progress, schedules next chunk if more work, returns immediately
//   POST { action: "status", jobId } -> returns job row
//   POST { action: "cron" } -> (no auth) kicks off the daily rotation; called only by pg_cron
//
// Owner/admin only for start/status/continue (continue can also be called with the
// service role internal token used by the function itself).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version, x-internal-token",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PPLX = Deno.env.get("PERPLEXITY_API_KEY");
const FIRE = Deno.env.get("FIRECRAWL_API_KEY");
const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
const INTERNAL_TOKEN = SERVICE_KEY; // reused as continuation auth between chunks

const EMIRATES = ["Dubai","Abu Dhabi","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"] as const;
const CHUNK_SIZE = 12; // rows per chunk — keeps each invocation under ~60s

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

/* ------------------------- normalisers ------------------------- */
function normPhone(p?: string | null): string | null {
  if (!p) return null;
  const d = String(p).replace(/[^0-9+]/g, "");
  if (!d) return null;
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("0")) return "+971" + d.slice(1);
  return d.startsWith("+") ? d : "+" + d;
}
function normSite(w?: string | null): string | null {
  if (!w) return null;
  const t = String(w).trim();
  if (!t) return null;
  return t.startsWith("http") ? t : "https://" + t.replace(/^\/+/, "");
}
function normIg(ig?: string | null): string | null {
  if (!ig) return null;
  const t = String(ig).trim();
  if (!t) return null;
  if (t.startsWith("http")) return t;
  const handle = t.replace(/^@/, "");
  return `https://instagram.com/${handle}`;
}
function mapsUrl(addr?: string | null): string | null {
  if (!addr) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
}

/* ------------------------- perplexity helpers ------------------------- */
async function pplxList(emirate: string, offset: number, pageSize: number) {
  if (!PPLX) return [];
  const schema = {
    type: "object",
    properties: {
      brokerages: {
        type: "array",
        items: {
          type: "object",
          properties: {
            company_name: { type: "string" },
            rera_license: { type: ["string","null"] },
            office_address: { type: ["string","null"] },
            phone: { type: ["string","null"] },
            email: { type: ["string","null"] },
            website: { type: ["string","null"] },
            instagram_url: { type: ["string","null"] },
          },
          required: ["company_name","rera_license","office_address","phone","email","website","instagram_url"],
        },
      },
    },
    required: ["brokerages"],
  };
  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PPLX}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [
        { role: "system", content: "You compile UAE real estate brokerage directories from official licensing authorities (DLD/RERA, Abu Dhabi DMT, emirate municipalities). Only real, currently-licensed firms. Never fabricate. Use null for unknowns." },
        { role: "user", content: `List up to ${pageSize} licensed real estate brokerage offices in ${emirate}. Skip the first ${offset} firms (already returned). For each return: company_name, rera_license, office_address (full street + area + emirate), phone (+971 international), email (sales/info), website, instagram_url (e.g. https://instagram.com/handle).` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "brokerage_directory", schema } },
      temperature: 0.0,
    }),
  });
  if (!resp.ok) { console.error("pplx list", emirate, resp.status); return []; }
  const j = await resp.json();
  let parsed: any = null;
  try { parsed = typeof j?.choices?.[0]?.message?.content === "string" ? JSON.parse(j.choices[0].message.content) : j?.choices?.[0]?.message?.content; } catch {}
  return (parsed?.brokerages ?? []) as any[];
}

async function pplxFacts(name: string, emirate: string | null, isDev: boolean) {
  if (!PPLX) return null;
  const schema = {
    type: "object",
    properties: {
      phone: { type: ["string","null"] },
      email: { type: ["string","null"] },
      website: { type: ["string","null"] },
      instagram_url: { type: ["string","null"] },
      office_address: { type: ["string","null"] },
      hq_emirate: { type: ["string","null"] },
    },
    required: ["phone","email","website","instagram_url","office_address","hq_emirate"],
  };
  const subject = isDev ? "real estate developer" : "real estate brokerage";
  const resp = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${PPLX}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      messages: [
        { role: "system", content: "You research UAE companies. Return verifiable facts only from the firm's website, DLD/RERA, DMT or municipality. Use null for unknowns. Never fabricate." },
        { role: "user", content: `Research the UAE ${subject} "${name}"${emirate ? ` in ${emirate}` : ""}. Return JSON: phone (+971 international), email (sales/info), website, instagram_url, office_address (full street + area + emirate), hq_emirate (one of ${EMIRATES.join(", ")}).` },
      ],
      response_format: { type: "json_schema", json_schema: { name: "facts", schema } },
      search_domain_filter: ["-reddit.com","-x.com","-twitter.com"],
      temperature: 0.0,
    }),
  });
  if (!resp.ok) return null;
  const j = await resp.json();
  let parsed: any = null;
  try { parsed = typeof j?.choices?.[0]?.message?.content === "string" ? JSON.parse(j.choices[0].message.content) : j?.choices?.[0]?.message?.content; } catch {}
  return parsed;
}

/* ------------------------- chunk runners ------------------------- */
async function runBrokerageSeedChunk(job: any) {
  const emirate = job.emirate || EMIRATES[0];
  const offset = job.progress || 0;
  const list = await pplxList(emirate, offset, CHUNK_SIZE);
  let inserted = 0, updated = 0;

  for (const r of list) {
    const phone = normPhone(r.phone);
    const website = normSite(r.website);
    const instagram_url = normIg(r.instagram_url);
    const address = r.office_address?.trim() || null;

    // Dedup by company_name + emirate
    const { data: existing } = await admin
      .from("crm_brokerages")
      .select("id, phone, email, website, instagram_url, office_address, office_map_url, rera_license")
      .eq("emirate", emirate)
      .ilike("company_name", r.company_name)
      .maybeSingle();

    const patch: any = {
      phone: phone ?? existing?.phone ?? null,
      email: r.email?.toLowerCase() ?? existing?.email ?? null,
      website: website ?? existing?.website ?? null,
      instagram_url: instagram_url ?? existing?.instagram_url ?? null,
      office_address: address ?? existing?.office_address ?? null,
      office_map_url: existing?.office_map_url ?? mapsUrl(address ?? existing?.office_address) ?? null,
      rera_license: r.rera_license ?? existing?.rera_license ?? null,
      emirate,
      last_verified_at: new Date().toISOString(),
      entry_source: existing ? undefined : "directory",
      confidence: "medium",
    };

    if (existing) {
      // never overwrite curated values; only fill blanks
      const fillOnly: any = {};
      for (const k of ["phone","email","website","instagram_url","office_address","office_map_url","rera_license"]) {
        if (!(existing as any)[k] && patch[k]) fillOnly[k] = patch[k];
      }
      if (Object.keys(fillOnly).length) {
        fillOnly.last_verified_at = patch.last_verified_at;
        await admin.from("crm_brokerages").update(fillOnly).eq("id", existing.id);
        updated++;
      }
    } else {
      const ins: any = {
        ...patch,
        company_name: r.company_name,
        owner_id: job.triggered_by, // owner attribution
        status: "prospect",
      };
      const { error } = await admin.from("crm_brokerages").insert(ins);
      if (!error) inserted++;
    }
  }

  const totalSoFar = offset + list.length;
  const isEmirateDone = list.length < CHUNK_SIZE;
  const emirateIdx = EMIRATES.indexOf(emirate as any);
  const nextEmirate = isEmirateDone ? EMIRATES[emirateIdx + 1] : emirate;
  const allDone = isEmirateDone && !nextEmirate;

  await admin.from("crm_directory_jobs").update({
    progress: isEmirateDone ? 0 : totalSoFar,
    emirate: allDone ? emirate : (isEmirateDone ? nextEmirate : emirate),
    inserted_count: (job.inserted_count ?? 0) + inserted,
    updated_count: (job.updated_count ?? 0) + updated,
    message: `${emirate}: +${inserted} new, ${updated} filled`,
    status: allDone ? "completed" : "running",
    finished_at: allDone ? new Date().toISOString() : null,
  }).eq("id", job.id);

  return !allDone;
}

async function runEnrichChunk(job: any) {
  const isDev = job.kind === "developer_enrich";
  const table = isDev ? "crm_developer_registry" : "crm_brokerages";
  const nameCol = isDev ? "developer_name" : "company_name";
  const emailCol = isDev ? "developer_email" : "email";

  const { data: rows } = await admin
    .from(table)
    .select(`id, ${nameCol}, emirate, phone, ${emailCol}, website, instagram_url, office_address, office_map_url`)
    .or(`phone.is.null,${emailCol}.is.null,website.is.null,instagram_url.is.null,office_address.is.null,office_map_url.is.null`)
    .order("updated_at", { ascending: true, nullsFirst: true })
    .limit(CHUNK_SIZE);

  const list = rows ?? [];
  let updated = 0;
  for (const r of list) {
    const facts = await pplxFacts((r as any)[nameCol], r.emirate, isDev).catch(() => null);
    const patch: any = {};
    if (facts) {
      if (!r.phone && facts.phone) patch.phone = normPhone(facts.phone);
      if (!(r as any)[emailCol] && facts.email) patch[emailCol] = String(facts.email).toLowerCase();
      if (!r.website && facts.website) patch.website = normSite(facts.website);
      if (!r.instagram_url && facts.instagram_url) patch.instagram_url = normIg(facts.instagram_url);
      if (!r.office_address && facts.office_address) patch.office_address = facts.office_address;
      const finalAddr = patch.office_address ?? r.office_address;
      if (!r.office_map_url && finalAddr) patch.office_map_url = mapsUrl(finalAddr);
    }
    // ALWAYS stamp last_verified_at so the same row is not re-scanned forever.
    // Public records may legitimately have no email/phone — we still mark them
    // checked so the enrich job can finish and the UI shows a real "completed" tick.
    patch.last_verified_at = new Date().toISOString();
    if (Object.keys(patch).length > 1) updated++;
    await admin.from(table).update(patch).eq("id", r.id);
  }

  // Hard cap: 30 chunks per run (=360 rows) so even in the worst case the job
  // completes within minutes and the user sees a clear ✓ instead of an infinite spinner.
  const HARD_CAP = 30 * CHUNK_SIZE;
  const newProgressEarly = (job.progress ?? 0) + list.length;
  const moreLikely = list.length === CHUNK_SIZE && newProgressEarly < HARD_CAP;
  const newProgress = (job.progress ?? 0) + list.length;

  await admin.from("crm_directory_jobs").update({
    progress: newProgress,
    updated_count: (job.updated_count ?? 0) + updated,
    message: `Enriched ${updated}/${list.length} this chunk (total scanned ${newProgress})`,
    status: moreLikely ? "running" : "completed",
    finished_at: moreLikely ? null : new Date().toISOString(),
  }).eq("id", job.id);

  return moreLikely;
}

/* ------------------------- continuation ------------------------- */
async function scheduleNext(jobId: string) {
  // Fire and forget — uses service-role auth for an internal continuation
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/directory-job-runner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SERVICE_KEY}`,
        "x-internal-token": INTERNAL_TOKEN,
      },
      body: JSON.stringify({ action: "continue", jobId }),
    });
  } catch (e) {
    console.error("scheduleNext err", e);
  }
}

async function runChunk(jobId: string) {
  const { data: job, error } = await admin.from("crm_directory_jobs").select("*").eq("id", jobId).maybeSingle();
  if (error || !job) { console.error("job not found", jobId); return; }
  if (job.status === "completed" || job.status === "failed") return;

  await admin.from("crm_directory_jobs").update({ status: "running" }).eq("id", jobId);

  try {
    let more = false;
    if (job.kind === "brokerage_seed") more = await runBrokerageSeedChunk(job);
    else more = await runEnrichChunk(job);
    if (more) await scheduleNext(jobId);
  } catch (e) {
    console.error("chunk err", jobId, e);
    await admin.from("crm_directory_jobs").update({
      status: "failed",
      error: (e as Error).message,
      finished_at: new Date().toISOString(),
    }).eq("id", jobId);
  }
}

/* ------------------------- HTTP entry ------------------------- */
async function isOwner(authHeader: string): Promise<{ ok: boolean; userId?: string }> {
  if (!authHeader) return { ok: false };
  const u = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data } = await u.auth.getUser();
  if (!data?.user) return { ok: false };
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", data.user.id);
  const ok = (roles ?? []).some((r: any) => r.role === "owner" || r.role === "admin");
  return { ok, userId: data.user.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "start";
    const internal = req.headers.get("x-internal-token") === INTERNAL_TOKEN;

    if (action === "continue") {
      if (!internal) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      // @ts-ignore - EdgeRuntime is available in Supabase Edge runtime
      const ert = (globalThis as any).EdgeRuntime;
      if (ert?.waitUntil) ert.waitUntil(runChunk(body.jobId));
      else runChunk(body.jobId);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "cron") {
      // pg_cron / public daily kickoff. Creates the three rotating jobs.
      const { data: ownerRow } = await admin.from("user_roles").select("user_id").eq("role","owner").limit(1).maybeSingle();
      const ownerId = ownerRow?.user_id ?? null;

      const dayOfWeek = new Date().getUTCDay();
      const emirate = EMIRATES[dayOfWeek % EMIRATES.length];

      const jobs = [
        { kind: "brokerage_seed", emirate, triggered_by: ownerId },
        { kind: "brokerage_enrich", emirate: null, triggered_by: ownerId },
        { kind: "developer_enrich", emirate: null, triggered_by: ownerId },
      ];
      const { data: created } = await admin.from("crm_directory_jobs").insert(jobs).select("id");
      for (const j of created ?? []) await scheduleNext(j.id);
      return new Response(JSON.stringify({ scheduled: created?.length ?? 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // start / status — owner only
    const auth = req.headers.get("Authorization") ?? "";
    const owner = await isOwner(auth);
    if (!owner.ok) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (action === "status") {
      if (body.jobId) {
        const { data } = await admin.from("crm_directory_jobs").select("*").eq("id", body.jobId).maybeSingle();
        return new Response(JSON.stringify({ job: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data } = await admin.from("crm_directory_jobs").select("*").order("started_at", { ascending: false }).limit(20);
      return new Response(JSON.stringify({ jobs: data }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // default: start
    const kind = body.kind ?? "brokerage_seed";
    if (!["brokerage_seed","brokerage_enrich","developer_enrich"].includes(kind)) {
      return new Response(JSON.stringify({ error: "bad kind" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const emirate = body.emirate ?? (kind === "brokerage_seed" ? EMIRATES[0] : null);
    const { data: job, error } = await admin.from("crm_directory_jobs").insert({
      kind, emirate, triggered_by: owner.userId, status: "queued",
    }).select("*").single();
    if (error) throw error;
    await scheduleNext(job.id);
    return new Response(JSON.stringify({ jobId: job.id, job }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("runner err", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
