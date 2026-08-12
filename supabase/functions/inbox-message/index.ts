// inbox-message — full message body, inline images and attachment metadata.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import {
  gmailFetch,
  outlookFetch,
  nativeId,
  decodeBase64Url,
  cleanSnippet,
  imapConfig,
  IMAP_FOLDER_CANDIDATES,
} from "../_shared/inbox-providers.ts";

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  inline: boolean;
  contentId?: string | null;
  dataUrl?: string;
}

function walkGmail(payload: any, out: { html: string; text: string; attachments: Attachment[] }) {
  if (!payload) return;
  const mime = payload.mimeType ?? "";
  const disposition = (payload.headers ?? []).find(
    (h: any) => h.name?.toLowerCase() === "content-disposition",
  )?.value ?? "";
  const contentId = (payload.headers ?? []).find(
    (h: any) => h.name?.toLowerCase() === "content-id",
  )?.value?.replace(/[<>]/g, "") ?? null;

  if (payload.body?.attachmentId) {
    out.attachments.push({
      id: payload.body.attachmentId,
      filename: payload.filename || "attachment",
      mimeType: mime,
      size: payload.body.size ?? 0,
      inline: /inline/i.test(disposition) || Boolean(contentId),
      contentId,
    });
  } else if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (mime === "text/html") out.html += decoded;
    else if (mime === "text/plain") out.text += decoded;
  }

  for (const part of payload.parts ?? []) walkGmail(part, out);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: { emailId?: string } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.emailId) return jsonResponse({ error: "emailId is required" }, 400);

  const { data: email } = await admin
    .from("inbox_emails")
    .select("id, gmail_id, provider, account_id, subject, folder, from_email, from_name, to_email, cc_email, received_at")
    .eq("id", body.emailId)
    .maybeSingle();
  if (!email) return jsonResponse({ error: "Email not found" }, 404);

  const id = nativeId(email.provider, email.gmail_id);

  try {
    if (email.provider === "gmail") {
      const msg = await (await gmailFetch(`/users/me/messages/${id}?format=full`)).json();
      const out = { html: "", text: "", attachments: [] as Attachment[] };
      walkGmail(msg.payload, out);

      // Inline images fetched and embedded as data URLs so the reader renders fully.
      for (const att of out.attachments.filter((a) => a.inline)) {
        try {
          const data = await (
            await gmailFetch(`/users/me/messages/${id}/attachments/${att.id}`)
          ).json();
          att.dataUrl = `data:${att.mimeType};base64,${String(data.data ?? "")
            .replace(/-/g, "+")
            .replace(/_/g, "/")}`;
          if (att.contentId) {
            out.html = out.html.replaceAll(`cid:${att.contentId}`, att.dataUrl);
          }
        } catch (e) { console.warn("inline image fetch failed", e); }
      }

      return jsonResponse({
        success: true,
        html: out.html || `<pre style="white-space:pre-wrap">${out.text}</pre>`,
        text: out.text || cleanSnippet(out.html),
        attachments: out.attachments,
      });
    }

    if (email.provider === "outlook") {
      const { data: account } = await admin
        .from("inbox_accounts").select("secret_ref").eq("id", email.account_id ?? "").maybeSingle();
      const ref = account?.secret_ref ?? null;
      const msg = await (
        await outlookFetch(`/me/messages/${id}?$select=body,bodyPreview,subject,hasAttachments`, ref)
      ).json();
      let html = msg.body?.content ?? "";
      const attachments: Attachment[] = [];

      if (msg.hasAttachments) {
        const list = await (await outlookFetch(`/me/messages/${id}/attachments`, ref)).json();
        for (const att of list.value ?? []) {
          const entry: Attachment = {
            id: att.id,
            filename: att.name ?? "attachment",
            mimeType: att.contentType ?? "application/octet-stream",
            size: att.size ?? 0,
            inline: Boolean(att.isInline),
            contentId: att.contentId ?? null,
          };
          if (entry.inline && att.contentBytes) {
            entry.dataUrl = `data:${entry.mimeType};base64,${att.contentBytes}`;
            if (entry.contentId) html = html.replaceAll(`cid:${entry.contentId}`, entry.dataUrl);
          }
          attachments.push(entry);
        }
      }

      return jsonResponse({
        success: true,
        html,
        text: cleanSnippet(msg.bodyPreview ?? html),
        attachments,
      });
    }

    // IMAP
    const cfg = imapConfig();
    if (!cfg) return jsonResponse({ error: "IMAP credentials are not configured" }, 400);
    const { ImapFlow } = await import("npm:imapflow@1.0.164");
    const client = new ImapFlow({
      host: cfg.host, port: cfg.port, secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass }, logger: false,
    });
    await client.connect();
    let html = "";
    try {
      const mailbox = IMAP_FOLDER_CANDIDATES[email.folder as keyof typeof IMAP_FOLDER_CANDIDATES]?.[0] ?? "INBOX";
      const lock = await client.getMailboxLock(mailbox);
      try {
        const download = await client.download(id, undefined, { uid: true });
        if (download?.content) {
          const chunks: Uint8Array[] = [];
          for await (const chunk of download.content) chunks.push(chunk as Uint8Array);
          const raw = new TextDecoder().decode(
            new Uint8Array(chunks.reduce<number[]>((acc, c) => acc.concat(Array.from(c)), [])),
          );
          const split = raw.split(/\r?\n\r?\n/);
          html = `<pre style="white-space:pre-wrap">${split.slice(1).join("\n\n")}</pre>`;
        }
      } finally { lock.release(); }
    } finally { await client.logout().catch(() => {}); }

    return jsonResponse({ success: true, html, text: cleanSnippet(html), attachments: [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: message }, 502);
  }
});
