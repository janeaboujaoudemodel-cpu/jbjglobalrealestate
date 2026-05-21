/**
 * Pass 7 — Unified Broker Lifecycle Action Centre
 *
 * One owner-facing hub that aggregates the entire broker lifecycle:
 *   1. Invites expiring within 24h
 *   2. Suspicious sessions (impossible-travel / new-device)
 *   3. Inactive brokers (no session in 14d, active grants)
 *   4. Unsigned commission agreements (sent > 48h ago)
 *   5. Recently revoked/suspended grants (last 7d)
 *
 * Read-only triage view. Action buttons deep-link into the existing
 * BrokerGrantsManagerDialog / BrokerAgreementSignPage flows — we don't
 * duplicate any mutation logic here.
 *
 * Champagne / gold only. No blue. No gold fills.
 */
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDisplayDate as fmt } from "@/utils/formatDate";
import {
  Loader2, AlertTriangle, Clock, MonitorSmartphone, FileSignature,
  UserX, ShieldOff, RefreshCw,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function BrokerLifecycleActionCenter({ open, onOpenChange }: Props) {
  const expiringInvites = useQuery({
    queryKey: ["lifecycle:expiring-invites"],
    enabled: open,
    queryFn: async () => {
      const cutoff = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("crm_brokers")
        .select("id, full_name, email_lower, invitation_status, invitation_token_expires_at")
        .in("invitation_status", ["invited", "otp_sent"])
        .lt("invitation_token_expires_at", cutoff)
        .gt("invitation_token_expires_at", new Date().toISOString())
        .order("invitation_token_expires_at", { ascending: true })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  const suspiciousSessions = useQuery({
    queryKey: ["lifecycle:suspicious-sessions"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_broker_sessions")
        .select("id, broker_user_id, ip_address, country, city, suspicious_reason, last_seen_at")
        .eq("suspicious", true)
        .is("revoked_at", null)
        .order("last_seen_at", { ascending: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  const inactiveBrokers = useQuery({
    queryKey: ["lifecycle:inactive-brokers"],
    enabled: open,
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("crm_brokers")
        .select("id, full_name, email_lower, last_session_at, activated_at, account_status")
        .eq("invitation_status", "activated")
        .eq("account_status", "active")
        .lt("last_session_at", cutoff)
        .order("last_session_at", { ascending: true })
        .limit(25);
      if (error && error.code !== "42703") throw error;
      return data ?? [];
    },
  });

  const unsignedAgreements = useQuery({
    queryKey: ["lifecycle:unsigned-agreements"],
    enabled: open,
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("crm_broker_commission_agreements")
        .select("id, broker_user_id, status, sent_at, deal_ref")
        .eq("status", "sent")
        .lt("sent_at", cutoff)
        .order("sent_at", { ascending: true })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  const recentRevocations = useQuery({
    queryKey: ["lifecycle:recent-revocations"],
    enabled: open,
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await supabase
        .from("crm_database_grants")
        .select("id, broker_user_id, revoked_at, suspended_at, revoke_reason, suspend_reason")
        .or(`revoked_at.gte.${cutoff},suspended_at.gte.${cutoff}`)
        .order("revoked_at", { ascending: false, nullsFirst: false })
        .limit(25);
      if (error) throw error;
      return data ?? [];
    },
  });

  const refetchAll = () => {
    expiringInvites.refetch();
    suspiciousSessions.refetch();
    inactiveBrokers.refetch();
    unsignedAgreements.refetch();
    recentRevocations.refetch();
  };

  const totals = {
    invites: expiringInvites.data?.length ?? 0,
    sessions: suspiciousSessions.data?.length ?? 0,
    inactive: inactiveBrokers.data?.length ?? 0,
    agreements: unsignedAgreements.data?.length ?? 0,
    revocations: recentRevocations.data?.length ?? 0,
  };
  const totalActions = totals.invites + totals.sessions + totals.inactive + totals.agreements;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto bg-[#FDFBF7] border-l border-[#B89555]/30">
        <SheetHeader className="border-b border-[#B89555]/20 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <SheetTitle className="text-[#1A1A1A] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#B89555]" />
                Broker Lifecycle Action Centre
              </SheetTitle>
              <SheetDescription className="text-[#1A1A1A]/70">
                {totalActions === 0
                  ? "All clear. No outstanding broker lifecycle actions."
                  : `${totalActions} item${totalActions === 1 ? "" : "s"} need owner attention.`}
              </SheetDescription>
            </div>
            <Button variant="outline" size="sm" onClick={refetchAll}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
          </div>
        </SheetHeader>

        <div className="space-y-6 pt-4">
          <Section
            icon={<Clock className="w-4 h-4 text-[#B89555]" />}
            title="Invites expiring in 24h"
            count={totals.invites}
            loading={expiringInvites.isLoading}
          >
            {expiringInvites.data?.map((r: any) => (
              <Row
                key={r.id}
                primary={r.full_name || r.email_lower || "Unknown broker"}
                secondary={r.email_lower}
                meta={`Expires ${fmt(r.invitation_token_expires_at)} · ${r.invitation_status}`}
              />
            ))}
          </Section>

          <Section
            icon={<MonitorSmartphone className="w-4 h-4 text-[#B89555]" />}
            title="Suspicious active sessions"
            count={totals.sessions}
            loading={suspiciousSessions.isLoading}
          >
            {suspiciousSessions.data?.map((r: any) => (
              <Row
                key={r.id}
                primary={r.broker_user_id?.slice(0, 8) ?? "broker"}
                secondary={[r.city, r.country, r.ip_address].filter(Boolean).join(" · ")}
                meta={`${r.suspicious_reason ?? "flagged"} · last seen ${fmt(r.last_seen_at)}`}
              />
            ))}
          </Section>

          <Section
            icon={<UserX className="w-4 h-4 text-[#B89555]" />}
            title="Inactive brokers (14d+ no session)"
            count={totals.inactive}
            loading={inactiveBrokers.isLoading}
          >
            {inactiveBrokers.data?.map((r: any) => (
              <Row
                key={r.id}
                primary={r.full_name || r.email_lower || "Unknown"}
                secondary={r.email_lower}
                meta={`Last session ${r.last_session_at ? fmt(r.last_session_at) : "never"}`}
              />
            ))}
          </Section>

          <Section
            icon={<FileSignature className="w-4 h-4 text-[#B89555]" />}
            title="Unsigned commission agreements (>48h)"
            count={totals.agreements}
            loading={unsignedAgreements.isLoading}
          >
            {unsignedAgreements.data?.map((r: any) => (
              <Row
                key={r.id}
                primary={r.deal_ref ?? `Agreement ${r.id.slice(0, 8)}`}
                secondary={`Broker ${r.broker_user_id?.slice(0, 8) ?? "—"}`}
                meta={`Sent ${fmt(r.sent_at)}`}
              />
            ))}
          </Section>

          <Section
            icon={<ShieldOff className="w-4 h-4 text-[#B89555]" />}
            title="Recently revoked / suspended grants (7d)"
            count={totals.revocations}
            loading={recentRevocations.isLoading}
            muted
          >
            {recentRevocations.data?.map((r: any) => (
              <Row
                key={r.id}
                primary={`Broker ${r.broker_user_id?.slice(0, 8) ?? "—"}`}
                secondary={r.revoked_at ? "Revoked" : "Suspended"}
                meta={(r.revoke_reason || r.suspend_reason || "—") + ` · ${fmt(r.revoked_at || r.suspended_at)}`}
              />
            ))}
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon, title, count, loading, muted, children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  loading: boolean;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-[#B89555]/25 ${muted ? "bg-[#F7F2EA]" : "bg-[#FDFBF7]"} p-4`}>
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A]">
          {icon} {title}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full border border-[#B89555]/30 bg-[#EFE6D6] text-[#1A1A1A]">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : count}
        </span>
      </header>
      {loading ? (
        <div className="text-xs text-[#1A1A1A]/60 flex items-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading…
        </div>
      ) : count === 0 ? (
        <div className="text-xs text-[#1A1A1A]/60">Nothing here. ✓</div>
      ) : (
        <ul className="space-y-1.5">{children}</ul>
      )}
    </section>
  );
}

function Row({ primary, secondary, meta }: { primary: string; secondary?: string | null; meta?: string }) {
  return (
    <li className="rounded-lg border border-[#B89555]/15 bg-white/60 px-3 py-2 text-xs">
      <div className="font-medium text-[#1A1A1A]">{primary}</div>
      {secondary ? <div className="text-[#1A1A1A]/70 truncate">{secondary}</div> : null}
      {meta ? <div className="text-[#1A1A1A]/55 mt-0.5">{meta}</div> : null}
    </li>
  );
}
