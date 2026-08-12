// Two-way mirror: apply an in-app action to the real mailbox AND locally, in one call.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import {
  gmailFetch,
  outlookFetch,
  nativeId,
  imapConfig,
  IMAP_FOLDER_CANDIDATES,
  type CanonicalFolder,
  type InboxProvider,
} from "./inbox-providers.ts";
import { logInboxActivity } from "./inbox-activity.ts";

export type MirrorAction =
  | "star"
  | "unstar"
  | "read"
  | "unread"
  | "trash"
  | "untrash"
  | "archive"
  | "spam"
  | "inbox";

export interface MirrorEmailRow {
  id: string;
  gmail_id: string;
  provider: InboxProvider;
  account_id: string | null;
  folder: CanonicalFolder;
  subject?: string | null;
}

interface LocalPatch {
  is_starred?: boolean;
  is_unread?: boolean;
  folder?: CanonicalFolder;
  deleted_at?: string | null;
}

function localPatchFor(action: MirrorAction): LocalPatch {
  switch (action) {
    case "star":
      return { is_starred: true };
    case "unstar":
      return { is_starred: false };
    case "read":
      return { is_unread: false };
    case "unread":
      return { is_unread: true };
    case "trash":
      return { folder: "trash", deleted_at: new Date().toISOString() };
    case "untrash":
      return { folder: "inbox", deleted_at: null };
    case "archive":
      return { folder: "archive", deleted_at: null };
    case "spam":
      return { folder: "spam" };
    case "inbox":
      return { folder: "inbox", deleted_at: null };
  }
}

async function pushGmail(id: string, action: MirrorAction) {
  const modify = (body: Record<string, string[]>) =>
    gmailFetch(`/users/me/messages/${id}/modify`, {
      method: "POST",
      body: JSON.stringify(body),
    });

  switch (action) {
    case "star":
      return modify({ addLabelIds: ["STARRED"] });
    case "unstar":
      return modify({ removeLabelIds: ["STARRED"] });
    case "read":
      return modify({ removeLabelIds: ["UNREAD"] });
    case "unread":
      return modify({ addLabelIds: ["UNREAD"] });
    case "archive":
      return modify({ removeLabelIds: ["INBOX"] });
    case "inbox":
      return modify({ addLabelIds: ["INBOX"], removeLabelIds: ["SPAM"] });
    case "spam":
      return modify({ addLabelIds: ["SPAM"], removeLabelIds: ["INBOX"] });
    case "trash":
      return gmailFetch(`/users/me/messages/${id}/trash`, { method: "POST" });
    case "untrash":
      return gmailFetch(`/users/me/messages/${id}/untrash`, { method: "POST" });
  }
}

async function pushOutlook(
  id: string,
  action: MirrorAction,
  secretRef: string | null,
) {
  const patch = (body: Record<string, unknown>) =>
    outlookFetch(`/me/messages/${id}`, secretRef, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  const move = (destinationId: string) =>
    outlookFetch(`/me/messages/${id}/move`, secretRef, {
      method: "POST",
      body: JSON.stringify({ destinationId }),
    });

  switch (action) {
    case "star":
      return patch({ flag: { flagStatus: "flagged" } });
    case "unstar":
      return patch({ flag: { flagStatus: "notFlagged" } });
    case "read":
      return patch({ isRead: true });
    case "unread":
      return patch({ isRead: false });
    case "trash":
      return move("deleteditems");
    case "untrash":
    case "inbox":
      return move("inbox");
    case "archive":
      return move("archive");
    case "spam":
      return move("junkemail");
  }
}

async function pushImap(
  uid: string,
  action: MirrorAction,
  currentFolder: CanonicalFolder,
) {
  const cfg = imapConfig();
  if (!cfg) throw new Error("IMAP credentials are not configured");
  const { ImapFlow } = await import("npm:imapflow@1.0.164");
  const client = new ImapFlow({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
    logger: false,
  });
  await client.connect();
  try {
    const source = IMAP_FOLDER_CANDIDATES[currentFolder][0] ?? "INBOX";
    const lock = await client.getMailboxLock(source);
    try {
      if (action === "star") await client.messageFlagsAdd({ uid }, ["\\Flagged"], { uid: true });
      else if (action === "unstar") await client.messageFlagsRemove({ uid }, ["\\Flagged"], { uid: true });
      else if (action === "read") await client.messageFlagsAdd({ uid }, ["\\Seen"], { uid: true });
      else if (action === "unread") await client.messageFlagsRemove({ uid }, ["\\Seen"], { uid: true });
      else {
        const target: CanonicalFolder =
          action === "trash" ? "trash"
          : action === "archive" ? "archive"
          : action === "spam" ? "spam"
          : "inbox";
        for (const candidate of IMAP_FOLDER_CANDIDATES[target]) {
          try {
            await client.messageMove({ uid }, candidate, { uid: true });
            break;
          } catch { /* try next candidate name */ }
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout().catch(() => {});
  }
}

export async function mirrorAction(
  admin: SupabaseClient,
  email: MirrorEmailRow,
  action: MirrorAction,
  actor?: string | null,
): Promise<{ mirrored: boolean; error?: string }> {
  const id = nativeId(email.provider, email.gmail_id);
  let mirrored = true;
  let error: string | undefined;

  try {
    if (email.provider === "gmail") {
      await pushGmail(id, action);
    } else if (email.provider === "outlook") {
      let secretRef: string | null = null;
      if (email.account_id) {
        const { data } = await admin
          .from("inbox_accounts")
          .select("secret_ref")
          .eq("id", email.account_id)
          .maybeSingle();
        secretRef = data?.secret_ref ?? null;
      }
      await pushOutlook(id, action, secretRef);
    } else {
      await pushImap(id, action, email.folder);
    }
  } catch (err) {
    mirrored = false;
    error = err instanceof Error ? err.message : String(err);
    console.error(`mirror ${action} failed`, error);
  }

  await admin
    .from("inbox_emails")
    .update(localPatchFor(action))
    .eq("id", email.id);

  await logInboxActivity(admin, {
    event_type: `mirror_${action}`,
    account_id: email.account_id,
    email_id: email.id,
    status: mirrored ? "ok" : "error",
    message: mirrored
      ? `${action} mirrored to ${email.provider}`
      : `${action} failed to mirror to ${email.provider}`,
    detail: { provider: email.provider, error: error ?? null },
    actor: actor ?? null,
  });

  return { mirrored, error };
}
