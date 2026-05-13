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

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function testImap(
  email: string,
  password: string,
  host: string,
  port: number
): Promise<{ ok: boolean; error?: string }> {
  let conn: Deno.TlsConn | null = null;
  try {
    conn = await Deno.connectTls({ hostname: host, port });
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const buf = new Uint8Array(8192);

    const read = async (): Promise<string> => {
      const n = await conn!.read(buf);
      return n ? dec.decode(buf.subarray(0, n)) : "";
    };

    const greeting = await read();
    console.log("[hostinger] IMAP greeting:", greeting.trim());
    if (!greeting.startsWith("* OK")) {
      return { ok: false, error: `Bad greeting: ${greeting.trim()}` };
    }

    // RFC3501 quoted string: escape \ and "
    const qPass = password.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const cmd = `a1 LOGIN "${email}" "${qPass}"\r\n`;
    await conn.write(enc.encode(cmd));

    let response = "";
    for (let i = 0; i < 5; i++) {
      const chunk = await read();
      response += chunk;
      if (response.includes("a1 OK") || response.includes("a1 NO") || response.includes("a1 BAD")) break;
    }
    console.log("[hostinger] IMAP login response:", response.trim());

    if (response.includes("a1 OK")) return { ok: true };
    const errLine = response.split("\r\n").find((l) => l.startsWith("a1 NO") || l.startsWith("a1 BAD")) || response.trim();
    return { ok: false, error: errLine };
  } catch (e) {
    console.error("[hostinger] IMAP test exception:", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    try { conn?.close(); } catch { /* noop */ }
  }
}

async function testSmtp(
  email: string,
  password: string,
  host: string,
  port: number
): Promise<{ ok: boolean; error?: string }> {
  let conn: Deno.Conn | Deno.TlsConn | null = null;
  try {
    conn = port === 465
      ? await Deno.connectTls({ hostname: host, port })
      : await Deno.connect({ hostname: host, port });
    const dec = new TextDecoder();
    const enc = new TextEncoder();
    const buf = new Uint8Array(8192);

    const read = async (): Promise<string> => {
      let acc = "";
      // Read until we see a complete SMTP reply (line ending with " " after code, not "-")
      for (let i = 0; i < 10; i++) {
        const n = await conn!.read(buf);
        if (!n) break;
        acc += dec.decode(buf.subarray(0, n));
        const lines = acc.trimEnd().split("\r\n");
        const last = lines[lines.length - 1];
        if (/^\d{3} /.test(last)) break;
      }
      return acc;
    };
    const send = async (s: string) => {
      await conn!.write(enc.encode(s + "\r\n"));
      return await read();
    };

    const greeting = await read();
    if (!greeting.startsWith("220")) return { ok: false, error: `Bad greeting: ${greeting.trim()}` };

    let ehlo = await send(`EHLO ${host}`);
    if (!ehlo.startsWith("250")) return { ok: false, error: `EHLO failed: ${ehlo.trim()}` };

    if (port !== 465) {
      if (!/STARTTLS/i.test(ehlo)) return { ok: false, error: "STARTTLS not offered by SMTP server" };
      const startTls = await send("STARTTLS");
      if (!startTls.startsWith("220")) return { ok: false, error: `STARTTLS failed: ${startTls.trim()}` };
      conn = await Deno.startTls(conn, { hostname: host });
      ehlo = await send(`EHLO ${host}`);
      if (!ehlo.startsWith("250")) return { ok: false, error: `EHLO after STARTTLS failed: ${ehlo.trim()}` };
    }

    const auth = await send("AUTH LOGIN");
    if (!auth.startsWith("334")) return { ok: false, error: `AUTH LOGIN failed: ${auth.trim()}` };

    const userResp = await send(base64Utf8(email));
    if (!userResp.startsWith("334")) return { ok: false, error: `Username rejected: ${userResp.trim()}` };

    const passResp = await send(base64Utf8(password));
    if (!passResp.startsWith("235")) return { ok: false, error: `Auth failed: ${passResp.trim()}` };

    try { await send("QUIT"); } catch { /* noop */ }
    return { ok: true };
  } catch (e) {
    console.error("[hostinger] SMTP test exception:", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    try { conn?.close(); } catch { /* noop */ }
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
    const savedEmail = (Deno.env.get("HOSTINGER_EMAIL_ADDRESS") || "").trim().toLowerCase();
    const savedPassword = Deno.env.get("HOSTINGER_EMAIL_PASSWORD") || "";
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imapHost = body.imap_host || DEFAULTS.imap_host;
    const imapPort = body.imap_port || DEFAULTS.imap_port;
    const smtpHost = body.smtp_host || DEFAULTS.smtp_host;
    let smtpPort = body.smtp_port || DEFAULTS.smtp_port;

    let passwordForStorage = password;
    let usedSavedCredential = false;

    // 1) Test IMAP. If the project-owned mailbox has a saved credential,
    // recover from a stale/wrong form password by validating the saved one.
    let imapResult = await testImap(email, passwordForStorage, imapHost, imapPort);
    const isAuthFailure = /AUTHENTICATIONFAILED|authentication failed|invalid credentials|login failed/i.test(
      imapResult.error || ""
    );
    if (!imapResult.ok && isAuthFailure && savedEmail && savedPassword && email === savedEmail) {
      const savedImapResult = await testImap(email, savedPassword, imapHost, imapPort);
      if (savedImapResult.ok) {
        passwordForStorage = savedPassword;
        usedSavedCredential = true;
        imapResult = savedImapResult;
      }
    }
    if (!imapResult.ok) {
      return new Response(JSON.stringify({ error: `IMAP login failed: ${imapResult.error || "unknown"}` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Test SMTP
    let smtpResult = await testSmtp(email, passwordForStorage, smtpHost, smtpPort);
    if (!smtpResult.ok && smtpHost === DEFAULTS.smtp_host && smtpPort === 465) {
      const fallback = await testSmtp(email, passwordForStorage, smtpHost, 587);
      if (fallback.ok) {
        console.log("[hostinger] SMTP connected through STARTTLS fallback on port 587");
        smtpResult = fallback;
        smtpPort = 587;
      } else {
        smtpResult = { ok: false, error: `${smtpResult.error || "port 465 failed"}; fallback 587: ${fallback.error || "failed"}` };
      }
    }
    if (!smtpResult.ok) {
      return new Response(JSON.stringify({ error: `SMTP login failed: ${smtpResult.error || "unknown"}` }), {
        status: 200,
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
    const encryptedPassword = await encryptCredential(passwordForStorage, CRED_KEY);

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
      details: { display_name: email, imap_host: imapHost, smtp_host: smtpHost, used_saved_credential: usedSavedCredential },
    });

    return new Response(
      JSON.stringify({ success: true, channel_id: channelId, email, used_saved_credential: usedSavedCredential }),
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
