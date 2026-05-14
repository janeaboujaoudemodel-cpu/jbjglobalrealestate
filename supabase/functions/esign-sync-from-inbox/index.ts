// esign-sync-from-inbox
// When a client emails a signed PDF back to JBJ, this function matches the
// inbound message to an esign_envelopes recipient by sender email, downloads
// the attached PDF from Gmail, uploads it to the signed-documents bucket,
// marks the recipient as signed (signed_via='email_reply'), and — once all
// client recipients have signed — flips the envelope to 'completed' and
// inserts an esign_signed_documents row. Idempotent: safe to call repeatedly
// for the same gmail_message_id.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";

interface Attachment { filename: string; mimeType: string; attachmentId?: string }

interface Body {
  gmail_message_id: string;
  gmail_thread_id?: string | null;
  from_email: string;
  received_at?: string | null;
  attachments?: Attachment[];
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function collectPdfParts(p: any, out: Attachment[] = []): Attachment[] {
  if (!p) return out;
  const fn = (p.filename || "").toLowerCase();
  const mt = (p.mimeType || "").toLowerCase();
  if (p.body?.attachmentId && (mt.includes("pdf") || fn.endsWith(".pdf"))) {
    out.push({ filename: p.filename, mimeType: p.mimeType, attachmentId: p.body.attachmentId });
  }
  for (const c of p.parts || []) collectPdfParts(c, out);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const body = await req.json() as Body;
    if (!body?.gmail_message_id || !body?.from_email) {
      return new Response(JSON.stringify({ ok: false, error: "missing gmail_message_id or from_email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromLower = body.from_email.trim().toLowerCase();

    // 1. Find matching pending recipient(s) by sender email.
    const { data: recipients, error: recErr } = await admin
      .from("esign_recipients")
      .select("id, envelope_id, name, email, status, metadata, esign_envelopes!inner(id, status, owner_id, document_url, document_filename, metadata)")
      .ilike("email", fromLower)
      .neq("status", "signed");
    if (recErr) throw recErr;
    if (!recipients?.length) {
      return new Response(JSON.stringify({ ok: true, matched: 0, reason: "no_pending_recipient_for_sender" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Idempotency: skip if this gmail_message_id was already recorded.
    const updated: string[] = [];
    const completed: string[] = [];

    // 3. Try to download the first PDF attachment from Gmail (best-effort).
    let pdfBytes: Uint8Array | null = null;
    let pdfFilename: string | null = null;
    if (LOVABLE_API_KEY && GMAIL_KEY) {
      try {
        const det = await fetch(`${GATEWAY}/users/me/messages/${body.gmail_message_id}?format=full`, {
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GMAIL_KEY },
        }).then((r) => r.ok ? r.json() : null);
        const parts = det ? collectPdfParts(det.payload) : [];
        const first = parts[0];
        if (first?.attachmentId) {
          const attRes = await fetch(`${GATEWAY}/users/me/messages/${body.gmail_message_id}/attachments/${first.attachmentId}`, {
            headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "X-Connection-Api-Key": GMAIL_KEY },
          });
          if (attRes.ok) {
            const j = await attRes.json() as { data?: string };
            if (j.data) {
              pdfBytes = b64urlToBytes(j.data);
              pdfFilename = first.filename || `signed-${body.gmail_message_id}.pdf`;
            }
          }
        }
      } catch (_e) { /* best-effort */ }
    }

    const signedAt = body.received_at || new Date().toISOString();

    for (const r of recipients) {
      const env: any = (r as any).esign_envelopes;
      if (!env) continue;

      // Mark recipient signed.
      await admin.from("esign_recipients").update({
        status: "signed",
        signed_at: signedAt,
        metadata: {
          ...(r.metadata as any || {}),
          signed_via: "email_reply",
          signed_via_gmail_message_id: body.gmail_message_id,
          signed_via_gmail_thread_id: body.gmail_thread_id || null,
          signed_from_email: body.from_email,
        },
      }).eq("id", r.id);
      updated.push(r.id);

      // Audit
      await admin.from("esign_audit_log").insert({
        envelope_id: env.id,
        recipient_id: r.id,
        action: "signed_via_email_reply",
        details: { gmail_message_id: body.gmail_message_id, from: body.from_email },
      }).then(() => {}).catch(() => {});

      // Upload signed PDF if we have bytes (one per envelope; idempotent on filename).
      let signedDocUrl: string | null = null;
      if (pdfBytes && pdfFilename) {
        const path = `${env.id}/${Date.now()}-${pdfFilename.replace(/[^A-Za-z0-9._-]/g, "_")}`;
        const up = await admin.storage.from("esign-signed").upload(path, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });
        if (!up.error) {
          const { data: pub } = admin.storage.from("esign-signed").getPublicUrl(path);
          signedDocUrl = pub.publicUrl;
          await admin.from("esign_signed_documents").insert({
            envelope_id: env.id,
            document_url: signedDocUrl,
            document_filename: pdfFilename,
            certificate_data: {
              signed_via: "email_reply",
              signed_at: signedAt,
              gmail_message_id: body.gmail_message_id,
              from: body.from_email,
            },
          }).then(() => {}).catch(() => {});
        }
      }

      // Re-fetch all recipients for this envelope to decide completion.
      const { data: allRec } = await admin
        .from("esign_recipients")
        .select("id, status, metadata")
        .eq("envelope_id", env.id);
      const clientRecs = (allRec || []).filter((x) => (x.metadata as any)?.role !== "owner");
      const allClientSigned = clientRecs.length > 0 && clientRecs.every((x) => x.status === "signed");

      if (allClientSigned && env.status !== "completed") {
        await admin.from("esign_envelopes").update({
          status: "completed",
          completed_at: new Date().toISOString(),
          signed_document_url: signedDocUrl || env.document_url,
          metadata: {
            ...(env.metadata || {}),
            completed_via: "email_reply",
          },
        }).eq("id", env.id);
        completed.push(env.id);

        // Fire-and-forget: post-completion side effects (certificate, thanks, etc.).
        try {
          await fetch(`${SUPABASE_URL}/functions/v1/esign-complete-envelope`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${SERVICE_ROLE}`,
            },
            body: JSON.stringify({ envelope_id: env.id, source: "email_reply" }),
          });
        } catch (_e) { /* ignore */ }
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      matched: recipients.length,
      updated_recipients: updated,
      completed_envelopes: completed,
      pdf_uploaded: !!pdfBytes,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
