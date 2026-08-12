// Provider plumbing for the Admin Email Inbox.
// Gateways, key loading, fetch wrappers, canonical folder maps and id helpers.

export const GMAIL_GATEWAY =
  "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
export const OUTLOOK_GATEWAY =
  "https://connector-gateway.lovable.dev/microsoft_outlook";

export type InboxProvider = "gmail" | "outlook" | "imap";
export type CanonicalFolder =
  | "inbox"
  | "sent"
  | "drafts"
  | "trash"
  | "archive"
  | "spam";

export const CANONICAL_FOLDERS: CanonicalFolder[] = [
  "inbox",
  "sent",
  "drafts",
  "trash",
  "archive",
  "spam",
];

export function lovableKey(): string {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return key;
}

export function gmailKey(): string {
  const key = Deno.env.get("GOOGLE_MAIL_API_KEY");
  if (!key) throw new Error("GOOGLE_MAIL_API_KEY is not configured");
  return key;
}

/** Every linked Outlook mailbox key: MICROSOFT_OUTLOOK_API_KEY, _1, _2, ... */
export function outlookKeys(): { ref: string; key: string }[] {
  const found: { ref: string; key: string }[] = [];
  const base = Deno.env.get("MICROSOFT_OUTLOOK_API_KEY");
  if (base) found.push({ ref: "MICROSOFT_OUTLOOK_API_KEY", key: base });
  for (let i = 1; i <= 8; i++) {
    const ref = `MICROSOFT_OUTLOOK_API_KEY_${i}`;
    const value = Deno.env.get(ref);
    if (value) found.push({ ref, key: value });
  }
  return found;
}

export function outlookKeyFor(secretRef?: string | null): string {
  const keys = outlookKeys();
  if (!keys.length) throw new Error("No Microsoft Outlook connector key configured");
  if (secretRef) {
    const match = keys.find((k) => k.ref === secretRef);
    if (match) return match.key;
  }
  return keys[0].key;
}

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  address: string;
}

export function imapConfig(): ImapConfig | null {
  const host = Deno.env.get("HOSTINGER_IMAP_HOST");
  const user =
    Deno.env.get("HOSTINGER_IMAP_USER") ?? Deno.env.get("HOSTINGER_EMAIL_ADDRESS");
  const pass =
    Deno.env.get("HOSTINGER_IMAP_PASS") ?? Deno.env.get("HOSTINGER_EMAIL_PASSWORD");
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(Deno.env.get("HOSTINGER_IMAP_PORT") ?? 993),
    secure: true,
    user,
    pass,
    address: Deno.env.get("HOSTINGER_EMAIL_ADDRESS") ?? user,
  };
}

export function smtpConfig() {
  const cfg = imapConfig();
  if (!cfg) return null;
  return {
    ...cfg,
    host: Deno.env.get("HOSTINGER_SMTP_HOST") ?? cfg.host.replace("imap", "smtp"),
    port: Number(Deno.env.get("HOSTINGER_SMTP_PORT") ?? 465),
  };
}

async function gatewayFetch(
  url: string,
  connectionKey: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${lovableKey()}`);
  headers.set("X-Connection-Api-Key", connectionKey);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return await fetch(url, { ...init, headers });
}

export async function gmailFetch(path: string, init: RequestInit = {}) {
  const res = await gatewayFetch(`${GMAIL_GATEWAY}${path}`, gmailKey(), init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[${res.status}] Gmail gateway: ${body}`);
  }
  return res;
}

export async function outlookFetch(
  path: string,
  secretRef: string | null | undefined,
  init: RequestInit = {},
) {
  const res = await gatewayFetch(
    `${OUTLOOK_GATEWAY}${path}`,
    outlookKeyFor(secretRef),
    init,
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`[${res.status}] Outlook gateway: ${body}`);
  }
  return res;
}

/** Our stored ids are prefixed per provider; recover the provider's own id. */
export function nativeId(provider: InboxProvider, storedId: string): string {
  const prefixes = [`${provider}:`, "gmail:", "outlook:", "imap:"];
  for (const p of prefixes) {
    if (storedId.startsWith(p)) return storedId.slice(p.length);
  }
  return storedId;
}

export function prefixedId(provider: InboxProvider, id: string): string {
  return `${provider}:${id}`;
}

/** Gmail: canonical folder -> search query used for listing. */
export const GMAIL_FOLDER_QUERY: Record<CanonicalFolder, string> = {
  inbox: "in:inbox",
  sent: "in:sent",
  drafts: "in:draft",
  trash: "in:trash",
  archive: "-in:inbox -in:trash -in:spam -in:draft -in:sent",
  spam: "in:spam",
};

export const GMAIL_FOLDER_LABEL: Record<CanonicalFolder, string | null> = {
  inbox: "INBOX",
  sent: "SENT",
  drafts: "DRAFT",
  trash: "TRASH",
  archive: null,
  spam: "SPAM",
};

/** Outlook: canonical folder -> well-known Graph folder id. */
export const OUTLOOK_FOLDER_ID: Record<CanonicalFolder, string> = {
  inbox: "inbox",
  sent: "sentitems",
  drafts: "drafts",
  trash: "deleteditems",
  archive: "archive",
  spam: "junkemail",
};

/** IMAP: canonical folder -> candidate mailbox names, first match wins. */
export const IMAP_FOLDER_CANDIDATES: Record<CanonicalFolder, string[]> = {
  inbox: ["INBOX"],
  sent: ["INBOX.Sent", "Sent", "Sent Items", "Sent Messages"],
  drafts: ["INBOX.Drafts", "Drafts"],
  trash: ["INBOX.Trash", "Trash", "Deleted Items"],
  archive: ["INBOX.Archive", "Archive"],
  spam: ["INBOX.Junk", "Junk", "Spam", "INBOX.spam"],
};

export function folderFromGmailLabels(labels: string[]): CanonicalFolder {
  if (labels.includes("TRASH")) return "trash";
  if (labels.includes("SPAM")) return "spam";
  if (labels.includes("DRAFT")) return "drafts";
  if (labels.includes("SENT")) return "sent";
  if (labels.includes("INBOX")) return "inbox";
  return "archive";
}

export function cleanSnippet(input?: string | null): string {
  if (!input) return "";
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\u200c|\u200b|\u00ad/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);
}

export function parseAddress(raw?: string | null): { name: string; email: string } {
  if (!raw) return { name: "", email: "" };
  const m = raw.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim(), email: m[2].trim().toLowerCase() };
  return { name: "", email: raw.trim().toLowerCase() };
}

export function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecodeToBytes(input: string): Uint8Array {
  const normalised = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised + "=".repeat((4 - (normalised.length % 4)) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

export function decodeBase64Url(input: string): string {
  return new TextDecoder().decode(base64UrlDecodeToBytes(input));
}

export function buildRawEmail(opts: {
  from?: string;
  to: string;
  cc?: string;
  subject: string;
  html: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const lines = [
    opts.from ? `From: ${opts.from}` : null,
    `To: ${opts.to}`,
    opts.cc ? `Cc: ${opts.cc}` : null,
    `Subject: ${opts.subject}`,
    opts.inReplyTo ? `In-Reply-To: ${opts.inReplyTo}` : null,
    opts.references ? `References: ${opts.references}` : null,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    opts.html,
  ].filter(Boolean);
  return base64UrlEncode(lines.join("\r\n"));
}
