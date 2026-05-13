/**
 * comm-hostinger-autoconnect — One-click Hostinger setup using server-stored
 * secrets HOSTINGER_EMAIL_ADDRESS + HOSTINGER_EMAIL_PASSWORD. Same validate +
 * encrypt + upsert flow as comm-hostinger-connect, but no credentials in body.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
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

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function testImap(email: string, password: string, host: string, port: number) {
  let conn: Deno.TlsConn | null = null;
  try {
    conn = await Deno.connectTls({ hostname: host, port });
    const reader = conn.readable.getReader();
    const writer = conn.writable.getWriter();
    const dec = new TextDecoder();
    const enc = new TextEncoder();

    async function readChunk(): Promise<string> {
      const { value } = await reader.read();
      return value ? dec.decode(value) : "";
    }

    const greeting = await readChunk();
    console.log("[imap] greeting:", greeting.trim());

    // Quote password — escape backslash and quotes per RFC3501.
    const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    const cmd = `a1 LOGIN ${q(email)} ${q(password)}\r\n`;
    await writer.write(enc.encode(cmd));

    // Read until we see "a1 OK" or "a1 NO/BAD"
    let buf = "";
    for (let i = 0; i < 10; i++) {
      buf += await readChunk();
      if (/\r\na1 (OK|NO|BAD)/i.test(buf) || /^a1 (OK|NO|BAD)/i.test(buf)) break;
    }
    console.log("[imap] login response:", buf.trim());

    try { await writer.write(enc.encode("a2 LOGOUT\r\n")); } catch { /* noop */ }
    try { reader.releaseLock(); writer.releaseLock(); } catch { /* noop */ }
    try { conn.close(); } catch { /* noop */ }

    const m = buf.match(/a1 (OK|NO|BAD)([^\r\n]*)/i);
    if (m && m[1].toUpperCase() === "OK") return { ok: true as const };
    return { ok: false as const, error: m ? `${m[1]}${m[2]}`.trim() : `Unexpected response: ${buf.slice(0, 200)}` };
  } catch (e) {
    try { conn?.close(); } catch { /* noop */ }
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
  }
}

async function testSmtp(email: string, password: string, host: string, port: number) {
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
      for (let i = 0; i < 10; i++) {
        const n = await conn!.read(buf);
        if (!n) break;
        acc += dec.decode(buf.subarray(0, n));
        const last = acc.trimEnd().split("\r\n").pop() || "";
        if (/^\d{3} /.test(last)) break;
      }
      return acc;
    };
    const send = async (s: string) => {
      await conn!.write(enc.encode(s + "\r\n"));
      return await read();
    };

    const greeting = await read();
    if (!greeting.startsWith("220")) return { ok: false as const, error: `Bad greeting: ${greeting.trim()}` };
    let ehlo = await send(`EHLO ${host}`);
    if (!ehlo.startsWith("250")) return { ok: false as const, error: `EHLO failed: ${ehlo.trim()}` };
    if (port !== 465) {
      if (!/STARTTLS/i.test(ehlo)) return { ok: false as const, error: "STARTTLS not offered by SMTP server" };
      const startTls = await send("STARTTLS");
      if (!startTls.startsWith("220")) return { ok: false as const, error: `STARTTLS failed: ${startTls.trim()}` };
      conn = await Deno.startTls(conn, { hostname: host });
      ehlo = await send(`EHLO ${host}`);
      if (!ehlo.startsWith("250")) return { ok: false as const, error: `EHLO after STARTTLS failed: ${ehlo.trim()}` };
    }
    const auth = await send("AUTH LOGIN");
    if (!auth.startsWith("334")) return { ok: false as const, error: `AUTH LOGIN failed: ${auth.trim()}` };
    const userResp = await send(base64Utf8(email));
    if (!userResp.startsWith("334")) return { ok: false as const, error: `Username rejected: ${userResp.trim()}` };
    const passResp = await send(base64Utf8(password));
    if (!passResp.startsWith("235")) return { ok: false as const, error: `Auth failed: ${passResp.trim()}` };
    try { await send("QUIT"); } catch { /* noop */ }
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e) };
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
