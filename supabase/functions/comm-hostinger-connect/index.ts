/**
 * comm-hostinger-connect — Validate and store Hostinger IMAP/SMTP credentials.
 *
 * Flow:
 *   1. Validate body (email, password, imap_host, imap_port, smtp_host, smtp_port)
 *   2. Test IMAP connection via @workingdevshero/deno-imap
 *   3. Test SMTP connection via deno.land/x/smtp
 *   4. Encrypt password with COMM_CREDENTIAL_KEY
 *   5. Upsert owner_comm_channels row
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";
import { encryptCredential } from "../_shared/credentialCrypto.ts";
import { logChannelAudit } from "../_shared/channelAudit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HostingerPayload {
  email: string;
  password: string;
  imap_host?: string;
  imap_port?: number;
  smtp_host?: string;
  smtp_port?: number;
}

const DEFAULTS = {
  imap_host: "imap.hostinger.com",
  imap_port: 993,
  smtp_host: "smtp.hostinger.com",
  smtp_port: 465,
};

async function testImap(
  email: string,
  password: string,
  host: string,
  port: number
): Promise<boolean> {
  const client = new ImapClient({ host, port, tls: true });
  try {
    await client.connect();
    await client.authenticate({ mechanism: "PLAIN", username: email, password });
    await client.selectMailbox("INBOX");
    await client.disconnect();
    return true;
  } catch (e) {
    console.error("[hostinger] IMAP test failed:", e);
    return false;
  }
}

async function testSmtp(
  email: string,
  password: string,
  host: string,
  port: number
): Promise<boolean> {
  const client = new SmtpClient();
  try {
    await client.connectTLS({ hostname: host, port, username: email, password });
    await client.close();
    return true;
  } catch (e) {
    console.error("[hostinger] SMTP test failed:", e);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const CRED_KEY = Deno.env.get("COMM_CREDENTIAL_KEY") || Deno.env.get("HOSTINGER_CREDENTIAL_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as HostingerPayload;
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imapHost = body.imap_host || DEFAULTS.imap_host;
    const imapPort = body.imap_port || DEFAULTS.imap_port;
    const smtpHost = body.smtp_host || DEFAULTS.smtp_host;
    const smtpPort = body.smtp_port || DEFAULTS.smtp_port;

    // 1) Test IMAP
    const imapOk = await testImap(email, password, imapHost, imapPort);
    if (!imapOk) {
      return new Response(JSON.stringify({ error: "IMAP connection failed. Check email/password and server settings." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Test SMTP
    const smtpOk = await testSmtp(email, password, smtpHost, smtpPort);
    if (!smtpOk) {
      return new Response(JSON.stringify({ error: "SMTP connection failed. Check email/password and server settings." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!CRED_KEY) {
      return new Response(JSON.stringify({ error: "Server misconfiguration: credential encryption key missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Encrypt password
    const encryptedPassword = await encryptCredential(password, CRED_KEY);

    // 4) Upsert channel
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: existing } = await admin
      .from("owner_comm_channels")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_type", "email_hostinger")
      .eq("identifier", email)
      .maybeSingle();

    const credentials = {
      email,
      password: encryptedPassword,
      imap_host: imapHost,
      imap_port: imapPort,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
    };

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
        .from("owner_comm_channels")
        .insert(payload)
        .select("id")
        .single();
      channelId = inserted?.id ?? null;
    }

    await logChannelAudit(admin, {
      user_id: user.id,
      channel_id: channelId,
      channel_type: "email_hostinger",
      identifier: email,
      event_type: existing?.id ? "reconnected" : "connected",
      details: { display_name: email, imap_host: imapHost, smtp_host: smtpHost },
    });

    return new Response(
      JSON.stringify({ success: true, channel_id: channelId, email }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("[comm-hostinger-connect] error", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
