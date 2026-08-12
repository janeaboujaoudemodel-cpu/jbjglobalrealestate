// inbox-connect-account — validates and links a new mailbox, then runs the first sync.
import { requireInboxAdmin, inboxCors, jsonResponse } from "../_shared/inbox-auth.ts";
import { logInboxActivity } from "../_shared/inbox-activity.ts";
import { gmailFetch, outlookFetch, outlookKeys } from "../_shared/inbox-providers.ts";

async function invokeSync(fn: string, req: Request) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/${fn}`;
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: req.headers.get("Authorization") ?? "",
      apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    },
    body: JSON.stringify({ maxPerFolder: 25 }),
  }).catch((e) => console.warn("first sync failed", e));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: inboxCors });

  const auth = await requireInboxAdmin(req);
  if (auth.response) return auth.response;
  const admin = auth.admin;

  let body: {
    provider?: "gmail" | "outlook" | "imap";
    secretRef?: string;
    host?: string;
    port?: number;
    user?: string;
    address?: string;
  } = {};
  try { body = await req.json(); } catch { /* noop */ }
  if (!body.provider) return jsonResponse({ error: "provider is required" }, 400);

  try {
    if (body.provider === "gmail") {
      const profile = await (await gmailFetch("/users/me/profile")).json();
      const address = String(profile.emailAddress ?? "").toLowerCase();
      const { data } = await admin.from("inbox_accounts").upsert(
        {
          provider: "gmail",
          email_address: address,
          display_name: address,
          status: "active",
          secret_ref: "GOOGLE_MAIL_API_KEY",
        },
        { onConflict: "provider,email_address" },
      ).select("id, email_address").single();
      await logInboxActivity(admin, {
        event_type: "account_linked", account_id: data?.id, status: "ok",
        message: `Gmail mailbox linked: ${address}`, actor: auth.userId || null,
      });
      await invokeSync("inbox-sync", req);
      return jsonResponse({ success: true, account: data, verified: true });
    }

    if (body.provider === "outlook") {
      const keys = outlookKeys();
      if (!keys.length) {
        return jsonResponse(
          { error: "No Microsoft Outlook connector is linked to this project yet." },
          400,
        );
      }
      const ref = body.secretRef && keys.some((k) => k.ref === body.secretRef)
        ? body.secretRef
        : keys[keys.length - 1].ref;
      const me = await (await outlookFetch("/me", ref)).json();
      const address = String(me.mail ?? me.userPrincipalName ?? "").toLowerCase();
      const { data } = await admin.from("inbox_accounts").upsert(
        {
          provider: "outlook",
          email_address: address,
          display_name: me.displayName ?? address,
          status: "active",
          secret_ref: ref,
        },
        { onConflict: "provider,email_address" },
      ).select("id, email_address").single();
      await logInboxActivity(admin, {
        event_type: "account_linked", account_id: data?.id, status: "ok",
        message: `Outlook mailbox linked: ${address}`, detail: { secret_ref: ref },
        actor: auth.userId || null,
      });
      await invokeSync("inbox-outlook-sync", req);
      return jsonResponse({ success: true, account: data, verified: true });
    }

    // IMAP: validate the credentials against the real server before creating the row.
    const host = body.host ?? Deno.env.get("HOSTINGER_IMAP_HOST");
    const user = body.user ?? Deno.env.get("HOSTINGER_IMAP_USER") ?? Deno.env.get("HOSTINGER_EMAIL_ADDRESS");
    const pass = Deno.env.get("HOSTINGER_IMAP_PASS") ?? Deno.env.get("HOSTINGER_EMAIL_PASSWORD");
    if (!host || !user || !pass) {
      return jsonResponse({
        error: "IMAP host, user and password secrets must be saved before linking this mailbox.",
      }, 400);
    }

    const { ImapFlow } = await import("npm:imapflow@1.0.164");
    const client = new ImapFlow({
      host, port: body.port ?? 993, secure: true,
      auth: { user, pass }, logger: false,
    });
    await client.connect();
    await client.logout().catch(() => {});

    const address = (body.address ?? user).toLowerCase();
    const { data } = await admin.from("inbox_accounts").upsert(
      {
        provider: "imap",
        email_address: address,
        display_name: address,
        status: "active",
        secret_ref: "HOSTINGER_IMAP",
      },
      { onConflict: "provider,email_address" },
    ).select("id, email_address").single();

    await logInboxActivity(admin, {
      event_type: "account_linked", account_id: data?.id, status: "ok",
      message: `IMAP mailbox linked: ${address}`, actor: auth.userId || null,
    });
    await invokeSync("inbox-hostinger-sync", req);
    return jsonResponse({ success: true, account: data, verified: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logInboxActivity(admin, {
      event_type: "account_linked", status: "error",
      message: `Link failed (${body.provider}): ${message}`,
      actor: auth.userId || null,
    });
    return jsonResponse({ error: message }, 400);
  }
});
