// Shared outbound sending for the Admin Inbox (Gmail / Outlook / SMTP).
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  gmailFetch,
  outlookFetch,
  smtpConfig,
  buildRawEmail,
  type InboxProvider,
} from "./inbox-providers.ts";

export interface SendPayload {
  provider: InboxProvider;
  secretRef?: string | null;
  from?: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
  inReplyTo?: string | null;
  threadId?: string | null;
}

export async function sendEmail(payload: SendPayload): Promise<{ id?: string }> {
  if (payload.provider === "gmail") {
    const raw = buildRawEmail({
      from: payload.from,
      to: payload.to,
      cc: payload.cc,
      subject: payload.subject,
      html: payload.html,
      inReplyTo: payload.inReplyTo ?? undefined,
      references: payload.inReplyTo ?? undefined,
    });
    const res = await gmailFetch("/users/me/messages/send", {
      method: "POST",
      body: JSON.stringify(
        payload.threadId ? { raw, threadId: payload.threadId } : { raw },
      ),
    });
    const json = await res.json();
    return { id: json.id };
  }

  if (payload.provider === "outlook") {
    await outlookFetch("/me/sendMail", payload.secretRef ?? null, {
      method: "POST",
      body: JSON.stringify({
        message: {
          subject: payload.subject,
          body: { contentType: "HTML", content: payload.html },
          toRecipients: payload.to
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
            .map((address) => ({ emailAddress: { address } })),
          ccRecipients: (payload.cc ?? "")
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean)
            .map((address) => ({ emailAddress: { address } })),
        },
        saveToSentItems: true,
      }),
    });
    return {};
  }

  const cfg = smtpConfig();
  if (!cfg) throw new Error("SMTP credentials are not configured");
  const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
  const client = new SMTPClient({
    connection: {
      hostname: cfg.host,
      port: cfg.port,
      tls: true,
      auth: { username: cfg.user, password: cfg.pass },
    },
  });
  await client.send({
    from: payload.from ?? cfg.address,
    to: payload.to.split(",").map((a) => a.trim()).filter(Boolean),
    cc: (payload.cc ?? "").split(",").map((a) => a.trim()).filter(Boolean),
    subject: payload.subject,
    html: payload.html,
  });
  await client.close();
  return {};
}

/** Resolve which connected mailbox to send from. */
export async function resolveAccount(
  admin: SupabaseClient,
  accountId?: string | null,
  fallbackProvider: InboxProvider = "gmail",
) {
  if (accountId) {
    const { data } = await admin
      .from("inbox_accounts")
      .select("id, provider, email_address, display_name, secret_ref")
      .eq("id", accountId)
      .maybeSingle();
    if (data) return data;
  }
  const { data } = await admin
    .from("inbox_accounts")
    .select("id, provider, email_address, display_name, secret_ref")
    .eq("provider", fallbackProvider)
    .limit(1)
    .maybeSingle();
  return data;
}
