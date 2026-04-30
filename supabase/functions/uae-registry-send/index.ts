// Owner-only outreach send for UAE Developers + Brokerages registry.
// Locks sender to CONTACT@JBJ.AE. Hard-blocks forbidden senders.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOCKED_SENDER = "CONTACT@JBJ.AE";

interface SendBody {
  recordType: "developer" | "brokerage";
  recordId: string;
  language?: "en" | "ar";
  contactPersonName: string;
  recipientEmail: string;
  isTestSend?: boolean;
  attachmentNames?: string[];
}

const TEMPLATES = {
  en: (vars: { contact: string; company: string; attachments: string }) => ({
    subject: "Company Registration Request — JBJ Global Real Estate",
    html: `<!DOCTYPE html><html><body style="background:#ffffff;color:#0a0a0a;font-family:Inter,Arial,sans-serif;padding:32px;max-width:640px;margin:0 auto;">
      <p>Dear ${escape(vars.contact)},</p>
      <p>I hope you are well.</p>
      <p>We are contacting you from <strong>JBJ Global Real Estate</strong> regarding company registration with <strong>${escape(vars.company)}</strong>.</p>
      <p>Please proceed with the company registration; we are not able to proceed from our side. We have sent you the documents — please register from your side. Let us know if you need any additional documents.</p>
      <p><strong>Attached documents:</strong><br/>${vars.attachments || "—"}</p>
      <p>Kindly confirm once the registration is completed, or advise if any further information is required.</p>
      <p>Best regards,<br/><strong>JBJ Global Real Estate</strong><br/>CONTACT@JBJ.AE</p>
    </body></html>`,
  }),
  ar: (vars: { contact: string; company: string; attachments: string }) => ({
    subject: "طلب تسجيل شركة — JBJ Global Real Estate",
    html: `<!DOCTYPE html><html dir="rtl" lang="ar"><body style="background:#ffffff;color:#0a0a0a;font-family:Inter,Arial,sans-serif;padding:32px;max-width:640px;margin:0 auto;">
      <p>السيد/السيدة ${escape(vars.contact)}،</p>
      <p>تحية طيبة وبعد،</p>
      <p>نتواصل معكم من شركة <strong>JBJ Global Real Estate</strong> بخصوص تسجيل شركتنا مع <strong>${escape(vars.company)}</strong>.</p>
      <p>Please proceed with the company registration; we are not able to proceed from our side. We have sent you the documents — please register from your side. Let us know if you need any additional documents.</p>
      <p><strong>المستندات المرفقة:</strong><br/>${vars.attachments || "—"}</p>
      <p>يرجى تأكيد إتمام التسجيل أو إعلامنا في حال احتجتم إلى أي مستندات إضافية.</p>
      <p>مع التحية،<br/><strong>JBJ Global Real Estate</strong><br/>CONTACT@JBJ.AE</p>
    </body></html>`,
  }),
};

function escape(s: string) {
  return String(s ?? "").replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  let body: SendBody;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  // Validate
  if (!body.recordType || !body.recordId || !body.recipientEmail || !body.contactPersonName) {
    return json({ error: "Missing required fields" }, 400);
  }
  const lang = body.language === "ar" ? "ar" : "en";

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Settings & forbidden sender check
  const { data: settings } = await supabase.from("uae_registry_settings").select("*").eq("id", 1).maybeSingle();
  const forbidden = (settings?.forbidden_senders ?? ["janeaboujaoudemodel@gmail.com"]) as string[];
  if (forbidden.map((x) => x.toLowerCase()).includes(LOCKED_SENDER.toLowerCase())) {
    return json({ error: "Sender misconfiguration" }, 500);
  }

  // Load record
  const table = body.recordType === "developer" ? "uae_dev_registry" : "uae_brk_registry";
  const { data: record, error: recErr } = await supabase.from(table).select("*").eq("id", body.recordId).maybeSingle();
  if (recErr || !record) return json({ error: "Record not found" }, 404);

  // Validation: verification + sources
  if (record.verification_status === "Not Verified") {
    return json({ error: "Cannot send: record is Not Verified" }, 422);
  }
  const sourcesQ = body.recordType === "developer"
    ? supabase.from("uae_registry_sources").select("id", { count: "exact", head: true }).eq("developer_id", body.recordId)
    : supabase.from("uae_registry_sources").select("id", { count: "exact", head: true }).eq("brokerage_id", body.recordId);
  const { count: sourceCount } = await sourcesQ;
  if (!sourceCount || sourceCount === 0) {
    return json({ error: "Cannot send: at least one verified source is required" }, 422);
  }

  // Render template
  const company = record.brand_name || record.legal_company_name;
  const attachmentsHtml = (body.attachmentNames ?? []).map((n) => `• ${escape(n)}`).join("<br/>");
  const tpl = TEMPLATES[lang]({ contact: body.contactPersonName, company, attachments: attachmentsHtml });

  // Send via Resend (through Lovable connector gateway).
  // Sender is hard-locked to CONTACT@JBJ.AE — domain jbj.ae must be verified in Resend.
  let sendOk = false;
  let sendError: string | null = null;
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: `JBJ Global Real Estate <${LOCKED_SENDER}>`,
        to: [body.recipientEmail],
        subject: tpl.subject,
        html: tpl.html,
      }),
    });
    sendOk = res.ok;
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      sendError = `Resend returned ${res.status}: ${txt.slice(0, 300)}`;
    }
  } catch (e) {
    sendError = (e as Error).message;
  }

  // Log
  const logRow: Record<string, unknown> = {
    [body.recordType === "developer" ? "developer_id" : "brokerage_id"]: body.recordId,
    channel: "Email",
    direction: "Outbound",
    summary: `${body.isTestSend ? "Test send" : "Registration request"} to ${body.recipientEmail} (${lang})`,
    full_message: tpl.html,
    language: lang,
    added_by: auth.userId,
    ai_extracted: { sender: LOCKED_SENDER, send_ok: sendOk, error: sendError },
  };
  await supabase.from("uae_registry_log").insert(logRow);

  // Update record
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    last_email_sent_at: now,
    outreach_status: body.isTestSend ? "Test Sent" : "Contacted",
  };
  if (!record.first_email_sent_at) updates.first_email_sent_at = now;
  if (body.isTestSend) updates.test_email_completed = true;
  if (!body.isTestSend) {
    const followFirst = settings?.follow_up_days_first ?? 2;
    const d = new Date();
    d.setDate(d.getDate() + followFirst);
    updates.next_follow_up_date = d.toISOString().slice(0, 10);
  }
  await supabase.from(table).update(updates).eq("id", body.recordId);

  return json({ ok: sendOk, error: sendError, sender: LOCKED_SENDER });
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
