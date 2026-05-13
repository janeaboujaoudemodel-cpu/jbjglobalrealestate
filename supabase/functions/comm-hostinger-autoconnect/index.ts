/**
 * comm-hostinger-autoconnect — One-click Hostinger setup using server-stored
 * secrets HOSTINGER_EMAIL_ADDRESS + HOSTINGER_EMAIL_PASSWORD. Same validate +
 * encrypt + upsert flow as comm-hostinger-connect, but no credentials in body.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { ImapClient } from "jsr:@workingdevshero/deno-imap@1.0.0";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { encryptCredential } from "../_shared/credentialCrypto.ts";
import { logChannelAudit } from "../_shared/channelAudit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULTS = {
  imap_host: "imap.hostinger.com",
  imap_port: 993,
  smtp_host: "smtp.hostinger.com",
  smtp_port: 465,
};

async function testImap(email: string, password: string, host: string, port: number) {
  const client = new ImapClient({ host, port, tls: true, username: email, password });
  try {
    await client.connect();
    // deno-imap auto-authenticates via LOGIN on connect when creds passed in ctor.
    // Defensive: if a `login` method exists, call it; otherwise rely on connect.
    const anyClient = client as unknown as { login?: () => Promise<void> };
    if (typeof anyClient.login === "function") {
      await anyClient.login();
    }
    await client.selectMailbox("INBOX");
    await client.disconnect();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

async function testSmtp(email: string, password: string, host: string, port: number) {
  const client = new SmtpClient();
  try {
    await client.connectTLS({ hostname: host, port, username: email, password });
    await client.close();
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const CRED_KEY = Deno.env.get("COMM_CREDENTIAL_KEY") || Deno.env.get("HOSTINGER_CREDENTIAL_KEY");
    const email = (Deno.env.get("HOSTINGER_EMAIL_ADDRESS") || "").trim().toLowerCase();
    const password = Deno.env.get("HOSTINGER_EMAIL_PASSWORD") || "";

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing HOSTINGER_EMAIL_ADDRESS / HOSTINGER_EMAIL_PASSWORD secrets" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!CRED_KEY) {
      return new Response(JSON.stringify({ error: "COMM_CREDENTIAL_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imap = await testImap(email, password, DEFAULTS.imap_host, DEFAULTS.imap_port);
    if (!imap.ok) {
      return new Response(JSON.stringify({ error: `IMAP failed: ${imap.error}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const smtp = await testSmtp(email, password, DEFAULTS.smtp_host, DEFAULTS.smtp_port);
    if (!smtp.ok) {
      return new Response(JSON.stringify({ error: `SMTP failed: ${smtp.error}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const encryptedPassword = await encryptCredential(password, CRED_KEY);
    const credentials = {
      email,
      password: encryptedPassword,
      imap_host: DEFAULTS.imap_host,
      imap_port: DEFAULTS.imap_port,
      smtp_host: DEFAULTS.smtp_host,
      smtp_port: DEFAULTS.smtp_port,
    };

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: existing } = await admin
      .from("owner_comm_channels")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_type", "email_hostinger")
      .eq("identifier", email)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      channel_type: "email_hostinger",
      identifier: email,
      display_name: email,
      credentials,
      is_active: true,
      sync_status: "synced",
      last_sync_at: new Date().toISOString(),
      last_error: null,
      connection_id: null,
    };

    let channelId: string | null = null;
    if (existing?.id) {
      await admin.from("owner_comm_channels").update(payload).eq("id", existing.id);
      channelId = existing.id;
    } else {
      const { data: inserted } = await admin
        .from("owner_comm_channels").insert(payload).select("id").single();
      channelId = inserted?.id ?? null;
    }

    await logChannelAudit(admin, {
      user_id: user.id,
      channel_id: channelId,
      channel_type: "email_hostinger",
      identifier: email,
      event_type: existing?.id ? "reconnected" : "connected",
      details: { display_name: email, source: "autoconnect" },
    });

    return new Response(JSON.stringify({ success: true, channel_id: channelId, email }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("[comm-hostinger-autoconnect]", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
