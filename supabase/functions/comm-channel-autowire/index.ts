// Comm Hub v2: one-click connect pipeline
// - Verifies the connector secret is present
// - Calls the gateway's verify_credentials when applicable
// - Resolves the user's identifier
// - Upserts the owner_comm_channels row (active, synced)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { logChannelAudit } from "../_shared/channelAudit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GATEWAY_BASE = "https://connector-gateway.lovable.dev";

// Map provider id → connector secret env var name + identifier resolver.
type ProviderConfig = {
  connectorId: string;
  secretName: string;
  resolveIdentifier?: (lovableKey: string, connectorKey: string) => Promise<{ identifier: string; display_name: string }>;
};

async function gmailIdentity(lovableKey: string, connectorKey: string) {
  const r = await fetch(`${GATEWAY_BASE}/google_mail/gmail/v1/users/me/profile`, {
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectorKey,
    },
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Gmail identity failed [${r.status}]: ${JSON.stringify(j)}`);
  return { identifier: j.emailAddress, display_name: j.emailAddress };
}

const PROVIDERS: Record<string, ProviderConfig> = {
  email_gmail: {
    connectorId: "google_mail",
    secretName: "GOOGLE_MAIL_API_KEY",
    resolveIdentifier: gmailIdentity,
  },
  email_outlook: {
    connectorId: "microsoft_outlook",
    secretName: "MICROSOFT_OUTLOOK_API_KEY",
  },
  email_resend: {
    connectorId: "resend",
    secretName: "RESEND_API_KEY",
  },
  whatsapp_twilio: {
    connectorId: "twilio",
    secretName: "TWILIO_API_KEY",
  },
  slack: {
    connectorId: "slack",
    secretName: "SLACK_API_KEY",
  },
  telegram: {
    connectorId: "telegram",
    secretName: "TELEGRAM_API_KEY",
  },
  voice_elevenlabs: {
    connectorId: "elevenlabs",
    secretName: "ELEVENLABS_API_KEY",
  },
};

async function verifyCredentials(lovableKey: string, connectorKey: string) {
  const r = await fetch(`${GATEWAY_BASE}/api/v1/verify_credentials`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": connectorKey,
    },
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok && (j.outcome === "verified" || j.outcome === "skipped"), payload: j, status: r.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    const body = await req.json().catch(() => ({}));
    const channelType: string = body.channel_type;
    const connectorId: string | null = body.connector_id ?? null;
    if (!channelType) {
      return new Response(JSON.stringify({ error: "channel_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = PROVIDERS[channelType];
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Custom flow placeholder: hostinger handled separately.
    if (!cfg) {
      return new Response(
        JSON.stringify({ error: `Provider ${channelType} not supported in autowire (yet)` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Collect ALL connector secrets matching this provider so multiple connections
    // (e.g. two Gmail accounts → GOOGLE_MAIL_API_KEY + GOOGLE_MAIL_API_KEY_2) are
    // discovered and each gets its own dedicated channel row.
    const allEnvKeys = Object.keys(Deno.env.toObject());
    const baseSecret = cfg.secretName;
    const matchingKeys = allEnvKeys
      .filter((k) => k === baseSecret || k.startsWith(`${baseSecret}_`))
      .map((k) => Deno.env.get(k))
      .filter((v): v is string => !!v);

    if (matchingKeys.length === 0 || !LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({
          requires_connector_link: true,
          connector_id: connectorId,
          message: `Connect ${channelType} via the workspace Connections panel first.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For each connector secret, verify + resolve identity and upsert a channel.
    const wired: Array<{ identifier: string; display_name: string }> = [];
    for (const connectorKey of matchingKeys) {
      const v = await verifyCredentials(LOVABLE_API_KEY, connectorKey);
      if (!v.ok && v.status !== 404) {
        console.warn("[autowire] verify failed for one key", v.status);
        continue;
      }

      let identifier = `${channelType}-${user.id.slice(0, 8)}-${connectorKey.slice(-6)}`;
      let displayName = channelType;
      if (cfg.resolveIdentifier) {
        try {
          const id = await cfg.resolveIdentifier(LOVABLE_API_KEY, connectorKey);
          identifier = id.identifier;
          displayName = id.display_name;
        } catch (err) {
          console.warn("[autowire] identifier resolve failed", err);
        }
      }
      wired.push({ identifier, display_name: displayName });
    }

    // Upsert one channel per discovered identity. (Loop below uses last identity
    // for legacy callers expecting a single response payload.)
    let lastIdentifier = wired[wired.length - 1]?.identifier ?? `${channelType}-${user.id.slice(0, 8)}`;
    let lastDisplay = wired[wired.length - 1]?.display_name ?? channelType;

    for (const { identifier, display_name: displayName } of wired) {

    // 3) Upsert the channel row
    const { data: existing } = await admin
      .from("owner_comm_channels")
      .select("id")
      .eq("user_id", user.id)
      .eq("channel_type", channelType)
      .eq("identifier", identifier)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      channel_type: channelType,
      identifier,
      display_name: displayName,
      is_active: true,
      sync_status: "synced",
      last_sync_at: new Date().toISOString(),
      last_error: null,
      connection_id: connectorId,
    };

    let resolvedChannelId: string | null = existing?.id ?? null;
    const wasReconnect = !!existing?.id;
    if (existing?.id) {
      await admin.from("owner_comm_channels").update(payload).eq("id", existing.id);
    } else {
      const { data: inserted } = await admin
        .from("owner_comm_channels")
        .insert(payload)
        .select("id")
        .single();
      resolvedChannelId = inserted?.id ?? null;
    }

    await logChannelAudit(admin, {
      user_id: user.id,
      channel_id: resolvedChannelId,
      channel_type: channelType,
      identifier,
      event_type: wasReconnect ? "reconnected" : "connected",
      details: { display_name: displayName, connection_id: connectorId },
    });

    return new Response(
      JSON.stringify({ success: true, identifier, display_name: displayName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error("[comm-channel-autowire] error", err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
