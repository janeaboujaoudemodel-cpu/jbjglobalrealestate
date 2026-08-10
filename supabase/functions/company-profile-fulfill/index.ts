/**
 * company-profile-fulfill — owner/admin action that answers a company-profile
 * request in one click:
 *   1. attaches the PDF to the developer (developer_documents, is_public = true)
 *      so the public developer page shows a Download button from now on;
 *   2. emails the requester with the file attached (plus a 7-day signed link);
 *   3. marks this request — and any other pending request for the same
 *      developer — as sent.
 *
 * The file must already be uploaded to the `developer-profiles` bucket, or an
 * existing document id can be reused.
 */
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendViaResend } from "../_shared/resendClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BUCKET = "developer-profiles";
const MAX_ATTACH_BYTES = 8 * 1024 * 1024;

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  try {
    // --- auth: owner or admin only -----------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Authentication required" }, 401);
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Authentication required" }, 401);

    const [{ data: isOwner }, { data: isAdmin }] = await Promise.all([
      admin.rpc("has_role", { _user_id: user.id, _role: "owner" }),
      admin.rpc("has_role", { _user_id: user.id, _role: "admin" }),
    ]);
    if (!isOwner && !isAdmin) return json({ error: "Forbidden" }, 403);

    // --- input --------------------------------------------------------------
    const body = await req.json().catch(() => null) as {
      requestId?: string;
      storagePath?: string;
      fileName?: string;
      fileSize?: number;
      documentId?: string;
      message?: string;
    } | null;

    const requestId = body?.requestId;
    if (!requestId) return json({ error: "requestId is required" }, 400);
    if (body?.message && body.message.length > 4000) return json({ error: "Message too long" }, 400);

    const { data: reqRow, error: reqErr } = await admin
      .from("company_profile_requests")
      .select("id, developer_id, requester_name, requester_email")
      .eq("id", requestId)
      .maybeSingle();
    if (reqErr) throw reqErr;
    if (!reqRow) return json({ error: "Request not found" }, 404);
    if (!reqRow.requester_email) return json({ error: "This request has no email address" }, 400);

    const { data: dev } = await admin
      .from("developers")
      .select("id, name, slug")
      .eq("id", reqRow.developer_id)
      .maybeSingle();
    const devName = dev?.name || "the developer";

    // --- resolve / create the document row ----------------------------------
    let documentId = body?.documentId ?? null;
    let storagePath = body?.storagePath ?? null;
    let fileName = body?.fileName ?? null;

    if (!storagePath && !documentId) {
      const { data: existing } = await admin
        .from("developer_documents")
        .select("id, storage_path, file_name")
        .eq("developer_id", reqRow.developer_id)
        .eq("doc_type", "company_profile")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!existing?.storage_path) {
        return json({ error: "Attach a company profile PDF first" }, 400);
      }
      documentId = existing.id;
      storagePath = existing.storage_path;
      fileName = existing.file_name;
    } else if (documentId && !storagePath) {
      const { data: doc } = await admin
        .from("developer_documents")
        .select("id, storage_path, file_name")
        .eq("id", documentId)
        .maybeSingle();
      if (!doc?.storage_path) return json({ error: "Document not found" }, 404);
      storagePath = doc.storage_path;
      fileName = doc.file_name;
      await admin.from("developer_documents").update({ is_public: true }).eq("id", documentId);
    } else if (storagePath) {
      // Newly uploaded file — register it on the developer and publish it.
      const { data: inserted, error: insErr } = await admin
        .from("developer_documents")
        .insert({
          developer_id: reqRow.developer_id,
          doc_type: "company_profile",
          file_url: storagePath,
          storage_path: storagePath,
          file_name: fileName || "company-profile.pdf",
          file_size: body?.fileSize ?? null,
          is_public: true,
          uploaded_by: user.id,
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      documentId = inserted.id;
    }

    // --- download + signed link --------------------------------------------
    const { data: fileBlob, error: dlErr } = await admin.storage.from(BUCKET).download(storagePath!);
    if (dlErr || !fileBlob) return json({ error: "Could not read the stored file" }, 400);
    const bytes = new Uint8Array(await fileBlob.arrayBuffer());

    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath!, 60 * 60 * 24 * 7);
    const link = signed?.signedUrl || null;

    const attachments = bytes.length <= MAX_ATTACH_BYTES
      ? [{
        filename: fileName || `${dev?.slug || "developer"}-company-profile.pdf`,
        content: toBase64(bytes),
        type: "application/pdf",
      }]
      : undefined;

    const note = body?.message?.trim();
    const html = `
<div style="font-family:Arial,Helvetica,sans-serif;background:#ffffff;padding:24px;">
  <div style="max-width:560px;margin:0 auto;border:1px solid #EFE6D6;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#064E3B,#042c1c,#000);padding:18px 22px;">
      <div style="color:#ffffff;font-size:12px;letter-spacing:.18em;text-transform:uppercase;">JBJ Global Real Estate</div>
      <div style="color:#ffffff;font-size:19px;font-weight:700;margin-top:6px;">${esc(devName)} — company profile</div>
    </div>
    <div style="padding:22px;color:#1A1A1A;font-size:14px;line-height:1.65;">
      <p style="margin:0 0 12px;">Dear ${esc(reqRow.requester_name || "Investor")},</p>
      <p style="margin:0 0 12px;">Please find the official ${esc(devName)} company profile attached${
        attachments ? "" : " via the secure link below"
      }.</p>
      ${note ? `<p style="margin:0 0 12px;white-space:pre-wrap;">${esc(note)}</p>` : ""}
      ${link ? `<a href="${link}" style="display:inline-block;margin:10px 0 4px;background:#064E3B;color:#ffffff;text-decoration:none;padding:11px 18px;border-radius:8px;font-size:13px;font-weight:700;">Download the profile</a>
      <p style="margin:6px 0 0;color:#666;font-size:12px;">Secure link, valid for 7 days.</p>` : ""}
      <p style="margin:18px 0 0;">Warm regards,<br/>JBJ Global Real Estate</p>
    </div>
  </div>
</div>`;

    const sent = await sendViaResend({
      from: "JBJ Global Real Estate <contact@jbj.ae>",
      to: [reqRow.requester_email],
      reply_to: "CONTACT@JBJ.AE",
      subject: `${devName} — company profile`,
      html,
      attachments,
    });

    if (!sent.ok) {
      return json({ error: sent.error || "Email delivery failed", status: sent.status }, 502);
    }

    // --- close this request + every other pending one for the developer -----
    const nowIso = new Date().toISOString();
    await admin
      .from("company_profile_requests")
      .update({
        status: "sent",
        fulfilled_at: nowIso,
        fulfilled_by: user.id,
        document_id: documentId,
        sent_to_email: reqRow.requester_email,
      })
      .eq("id", requestId);

    await admin
      .from("company_profile_requests")
      .update({ status: "fulfilled", fulfilled_at: nowIso, document_id: documentId })
      .eq("developer_id", reqRow.developer_id)
      .eq("status", "pending")
      .neq("id", requestId);

    return json({ ok: true, documentId, attached: !!attachments });
  } catch (e) {
    console.error("company-profile-fulfill error", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
