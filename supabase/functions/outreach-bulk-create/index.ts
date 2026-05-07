/**
 * outreach-bulk-create
 *
 * Creates a bulk brokerage outreach campaign.
 * - Forces sender, sender name, reply-to, and CC to the locked production identity.
 * - Validates the HTML/subject template (must contain {{brokerage_name}} and no other vars).
 * - Hashes the locked payload (subject + html_template) so per-recipient sends are auditable.
 * - Inserts one outreach_bulk_jobs row + N outreach_bulk_recipients rows.
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { PRIMARY_SENDER, PRIMARY_SENDER_NAME, DEFAULT_REPLY_TO, DEFAULT_CC } from "../_shared/outreachIdentity.ts";
import { validateOutreachTemplate } from "../_shared/outreachRender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "infoo.jane@gmail.com",
];

interface Recipient {
  brokerage_id?: string | null;
  brokerage_name: string;
  email: string;
}

interface Body {
  subject: string;
  html_template: string;
  plain_text_template?: string;
  preheader?: string;
  recipients: Recipient[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes((user.email || "").toLowerCase())) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json()) as Body;
    if (!body?.subject?.trim()) return json({ error: "subject required" }, 400);
    const tmplCheck = validateOutreachTemplate(body.html_template || "");
    if (!tmplCheck.ok) return json({ error: tmplCheck.error }, 400);
    const subjCheck = validateOutreachTemplate(body.subject); // subject must also reference {{brokerage_name}}? not necessarily; relax:
    // Subject may or may not contain brokerage_name; just block other vars.
    const badSubjVars = [...body.subject.matchAll(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g)]
      .map((m) => m[1])
      .filter((v) => v !== "brokerage_name");
    if (badSubjVars.length) return json({ error: `Subject contains unsupported vars: ${[...new Set(badSubjVars)].join(", ")}` }, 400);

    const cleaned: Recipient[] = [];
    const seen = new Set<string>();
    for (const r of body.recipients || []) {
      const email = (r.email || "").trim().toLowerCase();
      const name = (r.brokerage_name || "").trim();
      if (!email || !email.includes("@") || !name) continue;
      if (seen.has(email)) continue;
      seen.add(email);
      cleaned.push({ email, brokerage_name: name, brokerage_id: r.brokerage_id || null });
    }
    if (cleaned.length === 0) return json({ error: "No valid recipients" }, 400);

    // Hash the locked payload (subject + html_template + identity)
    const hashSrc = JSON.stringify({
      subject: body.subject,
      html: body.html_template,
      from: PRIMARY_SENDER,
      cc: DEFAULT_CC,
      reply_to: DEFAULT_REPLY_TO,
    });
    const enc = new TextEncoder().encode(hashSrc);
    const hashBuf = await crypto.subtle.digest("SHA-256", enc);
    const payload_hash = [...new Uint8Array(hashBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: job, error: jobErr } = await service
      .from("outreach_bulk_jobs")
      .insert({
        owner_id: user.id,
        subject: body.subject,
        html_template: body.html_template,
        plain_text_template: body.plain_text_template || null,
        preheader: body.preheader || null,
        payload_hash,
        status: "queued",
        total: cleaned.length,
      })
      .select("*").single();
    if (jobErr) return json({ error: jobErr.message }, 500);

    // Bulk insert recipients
    const rows = cleaned.map((r) => ({
      job_id: job.id,
      brokerage_id: r.brokerage_id,
      brokerage_name: r.brokerage_name,
      email: r.email,
    }));
    // Chunk to avoid payload limits
    for (let i = 0; i < rows.length; i += 1000) {
      const slice = rows.slice(i, i + 1000);
      const { error } = await service.from("outreach_bulk_recipients").insert(slice);
      if (error) {
        await service.from("outreach_bulk_jobs").update({ status: "failed", last_error: error.message }).eq("id", job.id);
        return json({ error: error.message }, 500);
      }
    }

    // Mark as running so the worker picks it up immediately
    await service.from("outreach_bulk_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", job.id);

    // Kick the worker right away (best-effort)
    void fetch(`${supabaseUrl}/functions/v1/outreach-bulk-worker`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
      },
      body: JSON.stringify({ job_id: job.id }),
    }).catch(() => {});

    return json({ ok: true, job_id: job.id, total: cleaned.length, payload_hash }, 200);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
