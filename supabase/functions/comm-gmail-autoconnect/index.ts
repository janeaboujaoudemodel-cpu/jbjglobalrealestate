/**
 * comm-gmail-autoconnect — Provisions an `email_gmail` row in
 * owner_comm_channels for the authenticated owner using the linked Google Mail
 * connector. Idempotent: if a row already exists for the same Gmail address
 * the function is a no-op. Identifier is the Gmail account address fetched
 * from the Gmail profile API via the Lovable connector gateway.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logChannelAudit } from "../_shared/channelAudit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev";

async function getGmailAddress(lovableKey: string, connectorKey: string): Promise<string | null> {
  try {
    const r = await fetch(`${GATEWAY}/google_mail/gmail/v1/users/me/profile`, {
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": connectorKey },
    });
    if (!r.ok) {
      console.error("[comm-gmail-autoconnect] profile fetch failed", r.status, await r.text());
      return null;
    }
    const j = await r.json();
    return (j.emailAddress || "").toLowerCase() || null;
  } catch (e) {
    console.error("[comm-gmail-autoconnect] profile fetch error", e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    // Pick up any GOOGLE_MAIL_API_KEY* secret (multiple Gmail connections allowed).
    const gmailKeys = Object.entries(Deno.env.toObject())
      .filter(([k]) => /^GOOGLE_MAIL_API_KEY(_\d+)?$/.test(k))
      .map(([, v]) => v)
      .filter(Boolean) as string[];

    if (!LOVABLE_API_KEY || gmailKeys.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, reason: "no_gmail_connection" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const provisioned: Array<{ email: string; channel_id: string; created: boolean }> = [];

    for (const key of gmailKeys) {
      const email = await getGmailAddress(LOVABLE_API_KEY, key);
      if (!email) continue;

      const { data: existing } = await admin
        .from("owner_comm_channels")
        .select("id")
        .eq("user_id", user.id)
        .eq("channel_type", "email_gmail")
        .eq("identifier", email)
        .maybeSingle();

      if (existing?.id) {
        // Re-activate in case it was disabled and clear errors.
        await admin
          .from("owner_comm_channels")
          .update({ is_active: true, last_error: null })
          .eq("id", existing.id);
        provisioned.push({ email, channel_id: existing.id, created: false });
        continue;
      }

      const { data: inserted, error: insErr } = await admin
        .from("owner_comm_channels")
        .insert({
          user_id: user.id,
          channel_type: "email_gmail",
          identifier: email,
          display_name: email,
          is_active: true,
          sync_status: "pending",
          last_error: null,
          connection_id: null,
        })
        .select("id")
        .single();

      if (insErr) {
        console.error("[comm-gmail-autoconnect] insert failed", insErr);
        continue;
      }
      if (inserted?.id) {
        await logChannelAudit(admin, {
          user_id: user.id,
          channel_id: inserted.id,
          channel_type: "email_gmail",
          identifier: email,
          event_type: "connected",
          details: { source: "autoconnect" },
        });
        provisioned.push({ email, channel_id: inserted.id, created: true });
      }
    }

    return new Response(JSON.stringify({ ok: true, provisioned }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[comm-gmail-autoconnect]", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
