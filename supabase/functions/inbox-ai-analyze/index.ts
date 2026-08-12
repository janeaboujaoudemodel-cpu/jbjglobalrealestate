// inbox-ai-analyze — classifies a message: category, division, urgency, sentiment, summary.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { createLovableAiGatewayProvider } from "../_shared/ai-gateway.ts";
import { generateText, Output, NoObjectGeneratedError } from "npm:ai";
import { z } from "npm:zod";

const schema = z.object({
  category: z.enum([
    "lead", "client", "developer", "partner", "internal", "vendor",
    "recruitment", "legal", "finance", "marketing", "spam", "other",
  ]),
  division: z.enum(["sales", "leasing", "operations", "finance", "marketing", "hr", "legal", "unassigned"]),
  urgency: z.enum(["critical", "high", "normal", "low"]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  intent: z.string(),
  summary: z.string(),
  suggested_labels: z.array(z.string()),
  requires_reply: z.boolean(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return jsonResponse({ error: "AI is not configured (missing LOVABLE_API_KEY)" }, 500);

  let body: { emailId?: string; bodyText?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.emailId) return jsonResponse({ error: "emailId is required" }, 400);

  const { data: email } = await admin
    .from("inbox_emails")
    .select("id, subject, from_name, from_email, snippet, body_text, account_id")
    .eq("id", body.emailId)
    .maybeSingle();
  if (!email) return jsonResponse({ error: "Email not found" }, 404);

  const { data: brain } = await admin
    .from("inbox_ai_brain")
    .select("guidance, tone, signature")
    .eq("is_active", true)
    .maybeSingle();

  const content = (body.bodyText ?? email.body_text ?? email.snippet ?? "").slice(0, 12000);

  const gateway = createLovableAiGatewayProvider(key);
  const model = gateway("google/gemini-3-flash-preview");

  try {
    const result = await generateText({
      model,
      output: Output.object({ schema }),
      system:
        "You triage the inbox of JBJ Global Real Estate, a Dubai real-estate brokerage. " +
        "Classify accurately and write a one-sentence summary. Keep summary under 200 characters. " +
        (brain?.guidance ? `Business context: ${brain.guidance}` : ""),
      prompt:
        `Subject: ${email.subject ?? "(no subject)"}\n` +
        `From: ${email.from_name ?? ""} <${email.from_email ?? ""}>\n\n` +
        content,
    });

    const analysis = result.output;

    await admin.from("inbox_emails").update({
      category: analysis.category,
      division: analysis.division,
      urgency: analysis.urgency,
      sentiment: analysis.sentiment,
      ai_intent: analysis.intent,
      ai_summary: analysis.summary,
      ai_analyzed_at: new Date().toISOString(),
      requires_reply: analysis.requires_reply,
    }).eq("id", email.id);

    await logInboxActivity(admin, {
      event_type: "ai_analyze",
      email_id: email.id,
      account_id: email.account_id,
      status: "ok",
      message: `Classified as ${analysis.category} / ${analysis.urgency}`,
      actor: auth.userId || null,
    });

    return jsonResponse({ success: true, analysis });
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      return jsonResponse({ error: "AI could not classify this message" }, 422);
    }
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 502);
  }
});
