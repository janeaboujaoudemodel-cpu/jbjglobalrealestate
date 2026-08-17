import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plug, Check, X, AlertTriangle, Clock,
  MessageCircle, Mail, Instagram, Facebook,
  Settings, Mic, Phone, Send, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import OwnerGuard from "@/components/OwnerGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type IntegrationStatus = "connected" | "not_connected" | "error";

interface IntegrationCard {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  // Backing channel_type in owner_comm_channels (or "external" for non-channel integrations)
  channelType?: string;
  externalEnv?: string; // env-var presence indicator (read indirectly via owner_comm_provider_status)
  connectHref: string; // where Connect / Configure routes to
}

const INTEGRATIONS: IntegrationCard[] = [
  { id: "whatsapp", name: "WhatsApp Business", icon: MessageCircle, description: "Customer messaging via WhatsApp Cloud API", channelType: "whatsapp", connectHref: "/owner/settings/communication?channel=whatsapp" },
  { id: "gmail", name: "Gmail", icon: Mail, description: "Send & receive email via your Google account", channelType: "email_gmail", connectHref: "/owner/settings/communication?channel=email_gmail" },
  { id: "hostinger", name: "Hostinger Webmail (SMTP)", icon: Mail, description: "Business email via SMTP / Hostinger", channelType: "email_hostinger", connectHref: "/owner/settings/communication?channel=email_hostinger" },
  { id: "instagram", name: "Instagram DM", icon: Instagram, description: "Direct messages via Instagram Graph API", channelType: "instagram", connectHref: "/owner/settings/communication?channel=instagram" },
  { id: "facebook", name: "Facebook Messenger", icon: Facebook, description: "Page inbox via Messenger Platform", channelType: "facebook", connectHref: "/owner/settings/communication?channel=facebook" },
  { id: "voice", name: "Voice Calls", icon: Phone, description: "Inbound / outbound calling (Twilio / cloud telephony)", channelType: "voice", connectHref: "/owner/settings/communication?channel=voice" },
  { id: "elevenlabs", name: "ElevenLabs Voice Agent", icon: Mic, description: "Always-on AI voice concierge on the homepage", externalEnv: "ELEVENLABS_API_KEY", connectHref: "/owner/voice-agent" },
  { id: "resend", name: "Resend Email API", icon: Send, description: "Transactional email + campaigns from jbj.ae", externalEnv: "RESEND_API_KEY", connectHref: "/owner/crm?entity=leads&view=campaigns" },
  { id: "marketing", name: "Marketing Hub", icon: Megaphone, description: "Audience segmentation & branded campaign sender", channelType: undefined, externalEnv: "RESEND_API_KEY", connectHref: "/owner/crm?entity=leads&view=campaigns" },
];

const STATUS_STYLES: Record<IntegrationStatus, string> = {
  connected: "jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30",
  not_connected: "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/30",
  error: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICON: Record<IntegrationStatus, React.ElementType> = {
  connected: Check,
  not_connected: X,
  error: AlertTriangle,
};

const STATUS_LABEL: Record<IntegrationStatus, string> = {
  connected: "Connected",
  not_connected: "Not Connected",
  error: "Error",
};

interface ChannelRow {
  channel_type: string;
  is_active: boolean | null;
  sync_status: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  identifier: string | null;
}

const OwnerIntegrationsPage = () => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChannelRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!user?.id) return;

    const load = async () => {
      setLoading(true);
      const { data: ch } = await (supabase as any)
        .from("owner_comm_channels")
        .select("channel_type, is_active, sync_status, last_sync_at, last_error, identifier")
        .eq("user_id", user.id);
      if (!alive) return;
      setChannels((ch || []) as ChannelRow[]);
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel("owner-integrations-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "owner_comm_channels" }, () => load())
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const statusFor = useMemo(() => {
    return (i: IntegrationCard): { status: IntegrationStatus; meta: { identifier?: string; lastSync?: string | null; error?: string | null } } => {
      if (i.channelType) {
        const row = channels.find((c) => c.channel_type === i.channelType);
        if (!row) return { status: "not_connected", meta: {} };
        if (row.last_error) return { status: "error", meta: { error: row.last_error, identifier: row.identifier ?? undefined, lastSync: row.last_sync_at } };
        if (row.is_active) return { status: "connected", meta: { identifier: row.identifier ?? undefined, lastSync: row.last_sync_at } };
        return { status: "not_connected", meta: { identifier: row.identifier ?? undefined } };
      }
      // External-env integrations (ElevenLabs / Resend) — status is managed server-side;
      // surface as "not_connected" by default so the Configure button leads users to
      // the right hub. A future server probe can flip this to "connected".
      return { status: "not_connected", meta: {} };
    };
  }, [channels]);

  const connectedCount = INTEGRATIONS.filter((i) => statusFor(i).status === "connected").length;

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-[#FDFBF7]">
        {/* Header */}
        <div className="border-b border-[#B89555]/20 bg-[#F7F2EA]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
                  <Plug className="w-6 h-6 text-[#1A1A1A]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1A1A1A]">Integrations</h1>
                  <p className="text-[#1A1A1A]/70">
                    {loading ? "Loading status…" : `${connectedCount} of ${INTEGRATIONS.length} integrations connected`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                Live status
              </Badge>
            </div>
          </div>
        </div>

        {/* Cards grid — auto-rows-fr balances every card to the same height */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
            {INTEGRATIONS.map((integration) => {
              const { status, meta } = statusFor(integration);
              const StatusIcon = STATUS_ICON[status];
              const Icon = integration.icon;
              return (
                <Card
                  key={integration.id}
                  className="flex flex-col h-full bg-[#F7F2EA] border border-[#B89555]/40 rounded-xl shadow-sm transition hover:shadow-md"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 shrink-0 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#1A1A1A]" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-[#1A1A1A] text-base leading-tight truncate">
                            {integration.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1 text-[#1A1A1A]/70 line-clamp-2">
                            {integration.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={`shrink-0 ${STATUS_STYLES[status]} border`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {STATUS_LABEL[status]}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-col flex-1 gap-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[#1A1A1A]/60">Account</span>
                        <span className="text-[#1A1A1A] font-medium truncate max-w-[60%] text-right">
                          {meta.identifier || "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#1A1A1A]/60">Last sync</span>
                        <span className="text-[#1A1A1A]/80">
                          {meta.lastSync ? new Date(meta.lastSync).toLocaleString() : "Never"}
                        </span>
                      </div>
                      {status === "error" && meta.error && (
                        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                          {meta.error}
                        </div>
                      )}
                    </div>

                    {/* Action pinned to bottom so every card balances */}
                    <div className="mt-auto pt-3 border-t border-[#B89555]/20 flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="flex-1 border-[#B89555]/40 bg-[#EFE6D6] hover:bg-[#E6DAC2] text-[#1A1A1A]"
                      >
                        <Link to={integration.connectHref}>
                          <Settings className="w-4 h-4 mr-1.5" />
                          {status === "connected" ? "Configure" : "Connect"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </OwnerGuard>
  );
};

export default OwnerIntegrationsPage;
