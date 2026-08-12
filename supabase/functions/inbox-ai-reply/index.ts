// inbox-ai-reply — drafts an assistive reply. Never sends; the admin must approve.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { streamText } from "npm:ai";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return jsonResponse({ error: "AI is not configured (missing LOVABLE_API_KEY)" }, 500);

  let body: { emailId?: string; tone?: string; instruction?: string; save?: boolean } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.emailId) return jsonResponse({ error: "emailId is required" }, 400);

  const { data: email } = await admin
    .from("inbox_emails")
    .select("id, subject, from_name, from_email, snippet, body_text, account_id, category, urgency")
    .eq("id", body.emailId)
    .maybeSingle();
  if (!email) return jsonResponse({ error: "Email not found" }, 404);

  const { data: brain } = await admin
    .from("inbox_ai_brain")
    .select("guidance, tone, signature")
    .eq("is_active", true)
    .maybeSingle();

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  try {
    const result = streamText({
      model,
      system:
        "You draft email replies for JBJ Global Real Estate, a Dubai real-estate brokerage. " +
        "Write a complete, ready-to-send reply in clean HTML paragraphs (no <html> or <body> wrapper). " +
        "Be precise and professional. Never invent prices, availability, or commitments. " +
        `Tone: ${body.tone ?? brain?.tone ?? "warm, concise, institutional"}. ` +
        (brain?.guidance ? `Business context: ${brain.guidance} ` : "") +
        (brain?.signature ? `End with this signature block: ${brain.signature}` : ""),
      prompt:
        `Reply to this email.${body.instruction ? ` Special instruction: ${body.instruction}` : ""}\n\n` +
        `Subject: ${email.subject ?? "(no subject)"}\n` +
        `From: ${email.from_name ?? ""} <${email.from_email ?? ""}>\n\n` +
        (email.body_text ?? email.snippet ?? "").slice(0, 12000),
    });

    const html = await result.text;

    let draftId: string | null = null;
    if (body.save !== false) {
      const { data: draft } = await admin.from("inbox_drafts").upsert(
        {
          email_id: email.id,
          account_id: email.account_id,
          subject: `Re: ${email.subject ?? ""}`.trim(),
          to_email: email.from_email,
          body_html: html,
          source: "ai",
          status: "pending_review",
          created_by: auth.userId || null,
        },
        { onConflict: "email_id" },
      ).select("id").single();
      draftId = draft?.id ?? null;
    }

    await logInboxActivity(admin, {
      event_type: "ai_draft",
      email_id: email.id,
      account_id: email.account_id,
      status: "ok",
      message: "AI reply drafted for review",
      actor: auth.userId || null,
    });

    return jsonResponse({ success: true, html, draftId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 502);
  }
});
