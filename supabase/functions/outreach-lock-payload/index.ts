/**
 * outreach-lock-payload
 *
 * Freezes a fully-rendered email payload into outreach_locked_payloads.
 * After lock, the payload is immutable — outreach-send-locked sends it
 * byte-for-byte. This is the SINGLE source of truth for "preview = sent".
 *
 * Owner-only.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  wrapEmailHtml,
  htmlToPlainText,
  computePayloadHash,
} from "../_shared/email-shell.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "infoo.jane@gmail.com",
];

interface LockBody {
  surface: string;
  recipient_email: string;
  cc_emails?: string[];
  from_email: string;
  from_name: string;
  reply_to: string;
  subject: string;
  preheader?: string;
  /** Fully-rendered inner HTML (after variable substitution). */
  inner_html: string;
  /** Optional pre-built plain text mirror; auto-derived if absent. */
  plain_text?: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes((user.email || "").toLowerCase())) {
      return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json()) as LockBody;

    // ---- Validation -----------------------------------------------------
    const required: Array<keyof LockBody> = [
      "surface", "recipient_email", "from_email", "from_name",
      "reply_to", "subject", "inner_html",
    ];
    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === "") {
        return json({ error: `Missing required field: ${k}` }, 400);
      }
    }
    if (!body.recipient_email.includes("@")) {
      return json({ error: "Invalid recipient_email" }, 400);
    }
    if (body.subject.length > 250) {
      return json({ error: "Subject exceeds 250 chars" }, 400);
    }
    // Reject any unresolved {{var}} placeholders — never freeze a broken render.
    const unresolved: string[] = [];
    for (const src of [body.subject, body.inner_html]) {
      const m = src.match(/\{\{\s*([a-zA-Z_][\w]*)\s*\}\}/g);
      if (m) m.forEach((t) => unresolved.push(t.replace(/[{}\s]/g, "")));
    }
    if (unresolved.length > 0) {
      return json({
        error: "LOCKED_TEMPLATE_MISSING_VAR",
        message: `Cannot lock — unresolved variables: ${[...new Set(unresolved)].join(", ")}`,
        missing: [...new Set(unresolved)],
      }, 400);
    }

    // ---- Freeze ---------------------------------------------------------
    const html = wrapEmailHtml({
      innerHtml: body.inner_html,
      preheader: body.preheader,
    });
    const plain_text = body.plain_text?.trim() || htmlToPlainText(body.inner_html);
    const cc_emails = (body.cc_emails || []).map((e) => e.trim()).filter(Boolean);

    const payload_hash = await computePayloadHash({
      from_email: body.from_email,
      from_name: body.from_name,
      reply_to: body.reply_to,
      recipient_email: body.recipient_email,
      cc_emails,
      subject: body.subject,
      html,
      plain_text,
    });

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await service
      .from("outreach_locked_payloads")
      .insert({
        surface: body.surface,
        recipient_email: body.recipient_email,
        cc_emails,
        from_email: body.from_email,
        from_name: body.from_name,
        reply_to: body.reply_to,
        subject: body.subject,
        preheader: body.preheader || null,
        html,
        plain_text,
        payload_hash,
        metadata: body.metadata || {},
        status: "locked",
        locked_by: user.id,
      })
      .select("id, payload_hash, locked_at, html, plain_text, subject, from_email, from_name, reply_to, recipient_email, cc_emails, preheader")
      .single();

    if (error) {
      // Hash collision = identical payload already locked → return existing
      if (String(error.code) === "23505") {
        const { data: existing } = await service
          .from("outreach_locked_payloads")
          .select("id, payload_hash, locked_at, html, plain_text, subject, from_email, from_name, reply_to, recipient_email, cc_emails, preheader")
          .eq("payload_hash", payload_hash).maybeSingle();
        if (existing) return json({ ok: true, reused: true, payload: existing }, 200);
      }
      return json({ error: error.message }, 500);
    }

    return json({ ok: true, payload: data }, 200);
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
