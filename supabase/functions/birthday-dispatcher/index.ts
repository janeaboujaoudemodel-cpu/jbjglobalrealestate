// birthday-dispatcher: sends a branded birthday email to every contact whose
// birthday matches today (Asia/Dubai). Idempotent per (contact_id, day).
// Source tables: crm_brokers + crm_leads. Owner-only when invoked manually,
// service-role token when invoked by pg_cron.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";
import { birthdayEmail } from "../_shared/birthdayEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  contact_id: string;
  email: string;
  first_name: string;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

function dubaiToday() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  return {
    iso: `${parts.year}-${parts.month}-${parts.day}`,
    month: Number(parts.month),
    day: Number(parts.day),
  };
}

async function gatherRecipients(): Promise<Recipient[]> {
  const sb = admin();
  const today = dubaiToday();
  const out: Recipient[] = [];
  const seen = new Set<string>();

  const push = (id: string | null, email: string | null, name: string | null) => {
    if (!id || !email) return;
    const lower = email.trim().toLowerCase();
    if (!lower.includes("@")) return;
    const key = `${id}:${lower}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({
      contact_id: id,
      email: lower,
      first_name: (name || "").split(/\s+/)[0] || "",
    });
  };

  const { data: brokers } = await sb
    .from("crm_brokers")
    .select("id, full_name, personal_email, company_email, email_lower, birthday")
    .not("birthday", "is", null);

  for (const b of brokers ?? []) {
    if (!b.birthday) continue;
    const d = new Date(b.birthday as string);
    if (d.getUTCMonth() + 1 !== today.month || d.getUTCDate() !== today.day) continue;
    const email =
      (b.personal_email as string | null) ||
      (b.company_email as string | null) ||
      (b.email_lower as string | null);
    push(b.id as string, email, b.full_name as string);
  }

  const { data: leads } = await sb
    .from("crm_leads")
    .select("id, full_name, email_lower, birthday")
    .not("birthday", "is", null);

  for (const l of leads ?? []) {
    if (!l.birthday) continue;
    const d = new Date(l.birthday as string);
    if (d.getUTCMonth() + 1 !== today.month || d.getUTCDate() !== today.day) continue;
    push(l.id as string, l.email_lower as string, l.full_name as string);
  }

  return out;
}

async function alreadySent(contactId: string, sentOn: string): Promise<boolean> {
  const sb = admin();
  const { data } = await sb
    .from("email_send_log")
    .select("id")
    .eq("contact_id", contactId)
    .eq("kind", "birthday")
    .eq("sent_on", sentOn)
    .maybeSingle();
  return !!data;
}

async function sendOne(rec: Recipient, sentOn: string) {
  const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_KEY) throw new Error("RESEND_API_KEY not configured");
  const fromAddr = Deno.env.get("BIRTHDAY_FROM") ||
    "JBJ GLOBAL REAL ESTATE <noreply@jbj.ae>";

  const { subject, html } = birthdayEmail({ firstName: rec.first_name });

  const sb = admin();

  const resp = await quotaGuardedFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`,
    },
    body: JSON.stringify({
      from: fromAddr,
      to: [rec.email],
      subject,
      html,
    }),
  });

  const body = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    await sb.from("email_send_log").insert({
      contact_id: rec.contact_id,
      to_email: rec.email,
      kind: "birthday",
      subject,
      template: "birthdayEmail.v1",
      status: "failed",
      error: typeof body === "object" ? JSON.stringify(body).slice(0, 500) : String(body),
      sent_on: sentOn,
    });
    return { ok: false, status: resp.status, body };
  }

  await sb.from("email_send_log").insert({
    contact_id: rec.contact_id,
    to_email: rec.email,
    kind: "birthday",
    subject,
    template: "birthdayEmail.v1",
    resend_message_id: (body as any)?.id ?? null,
    status: "sent",
    sent_on: sentOn,
  });
  return { ok: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry_run") === "1" ||
      (await req.clone().json().catch(() => ({})))?.dry_run === true;

    const today = dubaiToday();
    const recipients = await gatherRecipients();

    let sent = 0;
    let skippedAlreadySent = 0;
    let skippedQuota = 0;
    let failed = 0;
    const details: any[] = [];

    for (const rec of recipients) {
      if (await alreadySent(rec.contact_id, today.iso)) {
        skippedAlreadySent++;
        continue;
      }
      if (dryRun) {
        details.push({ to: rec.email, would_send: true });
        continue;
      }
      try {
        const r = await sendOne(rec, today.iso);
        if (r.ok) sent++;
        else if (r.status === 429) skippedQuota++;
        else failed++;
        details.push({ to: rec.email, ...r });
      } catch (e) {
        failed++;
        details.push({ to: rec.email, error: e instanceof Error ? e.message : String(e) });
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        date: today.iso,
        candidates: recipients.length,
        sent,
        skipped_already_sent: skippedAlreadySent,
        skipped_quota: skippedQuota,
        failed,
        dry_run: dryRun,
        details,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
