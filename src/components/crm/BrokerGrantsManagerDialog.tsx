/**
 * BrokerGrantsManagerDialog — Batch 2 expanded
 *
 * Lists all grants on a source database with owner controls:
 *   Restrict scope · Suspend · Revoke · Reactivate
 * Plus per-broker invitation + session controls:
 *   Resend invite · Revoke invite · Block / Unblock account
 *   Active sessions panel: revoke single, revoke all, block device
 *
 * Champagne / gold theme only — no blue anywhere.
 */
import { useEffect, useState, Fragment } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, ShieldCheck, ShieldOff, Ban, RotateCcw, Clock,
  Mail, MonitorSmartphone, AlertTriangle, ChevronDown, ChevronRight,
} from "lucide-react";
import { formatDisplayDate as fmt } from "@/utils/formatDate";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourceDatabaseId: string;
  sourceDatabaseName: string;
}

type Grant = {
  id: string;
  broker_user_id: string;
  permission_level: string;
  visibility_direction: string;
  date_window_mode: string;
  date_window_start: string | null;
  date_window_end: string | null;
  status_filter: string[] | null;
  expires_at: string | null;
  granted_at: string;
  revoked_at: string | null;
  suspended_at: string | null;
  suspend_reason: string | null;
  revoke_reason: string | null;
  restricted_at: string | null;
};

type BrokerInfo = {
  id: string;
  user_id: string;
  full_name: string | null;
  email_lower: string | null;
  invitation_status: string;
  invitation_sent_at: string | null;
  activated_at: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
};

type SessionRow = {
  id: string;
  device_fingerprint: string | null;
  device_label: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  user_agent: string | null;
  started_at: string;
  last_seen_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  is_suspicious: boolean;
};

import { BrokerStatusBadge, deriveBrokerLifecycle } from "./BrokerStatusBadge";

const stateBadge = (g: Grant) => {
  const state = deriveBrokerLifecycle({
    revoked_at: g.revoked_at,
    suspended_at: g.suspended_at,
    expires_at: g.expires_at,
  });
  return { state };
};

const invitationBadge = (b?: BrokerInfo | null) => {
  if (!b) return null;
  const state = deriveBrokerLifecycle({
    blocked_at: b.blocked_at,
    invitation_status: b.invitation_status,
    activated_at: b.activated_at,
  });
  return { state };
};

const windowLabel = (g: Grant) => {
  switch (g.date_window_mode) {
    case "today":     return "Today only";
    case "last_7":    return "Last 7 days";
    case "last_30":   return "Last 30 days";
    case "from_date": return `From ${g.date_window_start ? fmt(g.date_window_start) : "—"}`;
    case "custom":    return `${g.date_window_start ? fmt(g.date_window_start) : "—"} → ${g.date_window_end ? fmt(g.date_window_end) : "—"}`;
    default:          return "All time";
  }
};

const relTime = (iso?: string | null) => {
  if (!iso) return "—";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function BrokerGrantsManagerDialog({
  open, onOpenChange, sourceDatabaseId, sourceDatabaseName,
}: Props) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [brokers, setBrokers] = useState<Record<string, BrokerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [sessions, setSessions] = useState<Record<string, SessionRow[]>>({});
  const [sessionsLoading, setSessionsLoading] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_database_grants")
      .select("*")
      .eq("source_database_id", sourceDatabaseId)
      .order("granted_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const list = (data ?? []) as Grant[];
    setGrants(list);

    const ids = Array.from(new Set(list.map(g => g.broker_user_id)));
    if (ids.length) {
      const { data: bks } = await supabase
        .from("crm_brokers")
        .select("id, user_id, full_name, email_lower, invitation_status, invitation_sent_at, activated_at, blocked_at, blocked_reason")
        .in("user_id", ids);
      const map: Record<string, BrokerInfo> = {};
      (bks ?? []).forEach((b: any) => { if (b.user_id) map[b.user_id] = b as BrokerInfo; });
      setBrokers(map);
    }
    setLoading(false);
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [open, sourceDatabaseId]);

  const act = async (g: Grant, action: "suspend" | "unsuspend" | "revoke" | "unrevoke", reason?: string) => {
    setActingId(g.id);
    try {
      const { data, error } = await supabase.functions.invoke("crm-broker-grant-manage", {
        body: { grant_id: g.id, action, reason: reason ?? null },
      });
      if (error || (data as any)?.error) throw new Error(error?.message ?? (data as any)?.error);
      toast.success(`Grant ${action}d`);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? `Could not ${action}`);
    } finally {
      setActingId(null);
    }
  };

  const inviteAction = async (
    b: BrokerInfo,
    action: "resend" | "revoke" | "block" | "unblock",
    reason?: string,
  ) => {
    setActingId(b.id);
    try {
      const { data, error } = await supabase.functions.invoke("crm-broker-invite", {
        body: {
          broker_id: b.id,
          broker_email: b.email_lower ?? "",
          action,
          reason: reason ?? null,
        },
      });
      if (error || (data as any)?.error) throw new Error(error?.message ?? (data as any)?.error);
      toast.success(
        action === "resend" ? "Invitation re-sent" :
        action === "revoke" ? "Invitation revoked" :
        action === "block"  ? "Broker account blocked" :
        "Broker account unblocked",
      );
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? `Could not ${action}`);
    } finally {
      setActingId(null);
    }
  };

  const loadSessions = async (b: BrokerInfo) => {
    setSessionsLoading(s => ({ ...s, [b.id]: true }));
    const { data, error } = await supabase
      .from("crm_broker_sessions")
      .select("id, device_fingerprint, device_label, ip_address, country, city, user_agent, started_at, last_seen_at, expires_at, revoked_at, revoke_reason, is_suspicious")
      .eq("broker_id", b.id)
      .order("last_seen_at", { ascending: false })
      .limit(50);
    if (error) toast.error(error.message);
    const sorted = ((data ?? []) as SessionRow[]).slice().sort((a, b) => {
      // Suspicious-and-active first, then by last_seen desc
      const aActive = !a.revoked_at, bActive = !b.revoked_at;
      const aSus = !!a.is_suspicious && aActive, bSus = !!b.is_suspicious && bActive;
      if (aSus !== bSus) return aSus ? -1 : 1;
      const at = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
      const bt = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
      return bt - at;
    });
    setSessions(s => ({ ...s, [b.id]: sorted }));
    setSessionsLoading(s => ({ ...s, [b.id]: false }));
  };

  const toggleSessions = async (b: BrokerInfo) => {
    const isOpen = !!expanded[b.id];
    setExpanded(e => ({ ...e, [b.id]: !isOpen }));
    if (!isOpen) await loadSessions(b);
  };

  const revokeSession = async (b: BrokerInfo, sessionId: string) => {
    const reason = prompt("Revoke reason (optional):") ?? "";
    const { error } = await supabase.rpc("crm_broker_revoke_session" as any, {
      _session_id: sessionId,
      _reason: reason || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Session revoked");
    await loadSessions(b);
  };

  const revokeAllSessions = async (b: BrokerInfo) => {
    if (!confirm(`Revoke ALL active sessions for ${b.full_name ?? b.email_lower}?`)) return;
    const { error } = await supabase.rpc("crm_broker_revoke_all_sessions" as any, {
      _broker_id: b.id,
      _reason: "owner_revoke_all",
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("All sessions revoked");
    await loadSessions(b);
  };

  const blockDevice = async (b: BrokerInfo, fp: string | null) => {
    if (!fp) { toast.error("No device fingerprint on this session"); return; }
    const reason = prompt("Block this device. Reason (optional):") ?? "";
    const { error } = await supabase.rpc("crm_broker_block_device" as any, {
      _broker_id: b.id,
      _fingerprint: fp,
      _reason: reason || null,
    } as any);
    if (error) { toast.error(error.message); return; }
    toast.success("Device blocked. Future logins from it will be denied.");
    await loadSessions(b);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="crm-scope bg-[#FDFBF7] border-l border-[#B89555]/30 text-[#1A1A1A] sm:max-w-2xl w-full overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <ShieldCheck className="h-4 w-4 text-[#B89555]" /> Broker access — {sourceDatabaseName}
          </SheetTitle>
          <SheetDescription className="text-xs text-[#1A1A1A]/60">
            Manage who can see this database, resend invitations, block accounts, and
            terminate active sessions.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#1A1A1A]/70 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading grants…
          </div>
        ) : grants.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#1A1A1A]/60">
            No brokers have been granted access to this database yet.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[#B89555]/15 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
            {grants.map((g) => {
              const b = brokers[g.broker_user_id];
              const badge = stateBadge(g);
              const invBadge = invitationBadge(b);
              const isRevoked = !!g.revoked_at;
              const isSuspended = !!g.suspended_at;
              const isExpanded = b ? !!expanded[b.id] : false;
              const broker = b!;
              return (
                <Fragment key={g.id}>
                  <div className="py-3 flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-[#1A1A1A] truncate">
                          {b?.full_name || b?.email_lower || g.broker_user_id.slice(0, 8)}
                        </span>
                        <BrokerStatusBadge state={badge.state} />
                        {invBadge && invBadge.state !== badge.state && (
                          <BrokerStatusBadge state={invBadge.state} />
                        )}
                        {b?.activated_at && (
                          <span className="text-[10px] text-[#1A1A1A]/55">
                            activated {fmt(b.activated_at)}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#1A1A1A]/60 truncate mt-0.5">
                        {b?.email_lower ?? "no email"} · {g.permission_level === "edit" ? "Edit" : "View"} ·{" "}
                        <Clock className="inline h-3 w-3 mb-0.5" /> {windowLabel(g)}
                        {g.expires_at && <> · expires {fmt(g.expires_at)}</>}
                      </div>
                      <div className="text-[10px] text-[#1A1A1A]/50 mt-0.5">
                        Direction: {g.visibility_direction === "bidirectional" ? "Bidirectional" : "Broker → Owner only"}
                        {g.status_filter?.length ? ` · Statuses: ${g.status_filter.join(", ")}` : ""}
                      </div>
                      {b?.blocked_reason && (
                        <div className="text-[10px] text-[#1A1A1A]/70 mt-0.5">
                          Block reason: {b.blocked_reason}
                        </div>
                      )}
                      {g.suspend_reason && <div className="text-[10px] text-[#1A1A1A]/70 mt-0.5">Suspend reason: {g.suspend_reason}</div>}
                      {g.revoke_reason && <div className="text-[10px] text-[#1A1A1A]/70 mt-0.5">Revoke reason: {g.revoke_reason}</div>}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end max-w-[55%]">
                      {/* Grant-level actions */}
                      {!isRevoked && !isSuspended && (
                        <Button size="sm" variant="outline"
                          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] h-7 px-2 text-[11px]"
                          disabled={actingId === g.id}
                          onClick={() => {
                            const r = prompt("Suspend reason (optional):") ?? "";
                            act(g, "suspend", r);
                          }}>
                          <ShieldOff className="h-3 w-3 mr-1" /> Suspend
                        </Button>
                      )}
                      {isSuspended && !isRevoked && (
                        <Button size="sm" variant="outline"
                          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] h-7 px-2 text-[11px]"
                          disabled={actingId === g.id}
                          onClick={() => act(g, "unsuspend")}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Reactivate
                        </Button>
                      )}
                      {!isRevoked && (
                        <Button size="sm" variant="outline"
                          className="border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white h-7 px-2 text-[11px]"
                          disabled={actingId === g.id}
                          onClick={() => {
                            if (!confirm(`Revoke ${b?.full_name ?? "this broker"}'s access? They will be locked out immediately.`)) return;
                            const r = prompt("Revoke reason (optional):") ?? "";
                            act(g, "revoke", r);
                          }}>
                          <Ban className="h-3 w-3 mr-1" /> Revoke
                        </Button>
                      )}
                      {isRevoked && (
                        <Button size="sm" variant="outline"
                          className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] h-7 px-2 text-[11px]"
                          disabled={actingId === g.id}
                          onClick={() => act(g, "unrevoke")}>
                          <RotateCcw className="h-3 w-3 mr-1" /> Restore
                        </Button>
                      )}

                      {/* Broker-level invitation + account actions */}
                      {b && (
                        <>
                          <Button size="sm" variant="outline"
                            className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] h-7 px-2 text-[11px]"
                            disabled={actingId === b.id || !b.email_lower}
                            onClick={() => inviteAction(b, "resend")}>
                            <Mail className="h-3 w-3 mr-1" /> Resend
                          </Button>
                          {b.invitation_status !== "revoked" && b.invitation_status !== "activated" && (
                            <Button size="sm" variant="outline"
                              className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] h-7 px-2 text-[11px]"
                              disabled={actingId === b.id}
                              onClick={() => {
                                if (!confirm("Revoke this invitation? The activation link will stop working.")) return;
                                inviteAction(b, "revoke");
                              }}>
                              <Ban className="h-3 w-3 mr-1" /> Revoke invite
                            </Button>
                          )}
                          {!b.blocked_at ? (
                            <Button size="sm" variant="outline"
                              className="border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white h-7 px-2 text-[11px]"
                              disabled={actingId === b.id}
                              onClick={() => {
                                if (!confirm("Block this broker account? All live sessions will be terminated.")) return;
                                const r = prompt("Block reason (optional):") ?? "";
                                inviteAction(b, "block", r);
                              }}>
                              <Ban className="h-3 w-3 mr-1" /> Block
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline"
                              className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] h-7 px-2 text-[11px]"
                              disabled={actingId === b.id}
                              onClick={() => inviteAction(b, "unblock")}>
                              <RotateCcw className="h-3 w-3 mr-1" /> Unblock
                            </Button>
                          )}
                          <Button size="sm" variant="outline"
                            className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] h-7 px-2 text-[11px]"
                            onClick={() => toggleSessions(b)}>
                            {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                            <MonitorSmartphone className="h-3 w-3 mr-1" /> Sessions
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sessions panel */}
                  {isExpanded && broker && (
                    <div className="pb-4 pl-3 pr-1">
                      <div className="rounded-md border border-[#B89555]/25 bg-[#F7F2EA]/50 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[11px] font-semibold text-[#1A1A1A] flex items-center gap-1.5">
                            <MonitorSmartphone className="h-3.5 w-3.5 text-[#B89555]" />
                            Active sessions
                            {(() => {
                              const susCount = (sessions[broker.id] ?? []).filter(s => s.is_suspicious && !s.revoked_at).length;
                              return susCount > 0 ? (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555] inline-flex items-center gap-1">
                                  <AlertTriangle className="h-2.5 w-2.5" /> {susCount} suspicious
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <Button size="sm" variant="outline"
                            className="border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white h-6 px-2 text-[10px]"
                            onClick={() => revokeAllSessions(broker)}>
                            Revoke all
                          </Button>
                        </div>



                        {sessionsLoading[broker.id] ? (
                          <div className="text-[11px] text-[#1A1A1A]/60 flex items-center gap-1.5">
                            <Loader2 className="h-3 w-3 animate-spin" /> Loading sessions…
                          </div>
                        ) : !sessions[broker.id]?.length ? (
                          <div className="text-[11px] text-[#1A1A1A]/55">No sessions on record.</div>
                        ) : (
                          <div className="divide-y divide-[#B89555]/10">
                            {sessions[broker.id].map((s) => {
                              const revoked = !!s.revoked_at;
                              const expired = !!s.expires_at && new Date(s.expires_at) < new Date();
                              const status = revoked ? "Revoked" : expired ? "Expired" : "Active";
                              const statusCls = revoked
                                ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                                : expired
                                  ? "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/40"
                                  : "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]";
                              return (
                                <div key={s.id} className="py-2 flex items-center gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[11px] font-medium text-[#1A1A1A]">
                                        {s.device_label ?? "Unknown device"}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${statusCls}`}>
                                        {status}
                                      </span>
                                      {s.is_suspicious && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold border bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555] inline-flex items-center gap-1">
                                          <AlertTriangle className="h-2.5 w-2.5" /> Suspicious
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-[#1A1A1A]/60 truncate">
                                      {s.ip_address ?? "—"}
                                      {(s.city || s.country) && ` · ${[s.city, s.country].filter(Boolean).join(", ")}`}
                                      {" · last seen "}{relTime(s.last_seen_at)}
                                    </div>
                                    {s.revoke_reason && (
                                      <div className="text-[10px] text-[#1A1A1A]/55">Reason: {s.revoke_reason}</div>
                                    )}
                                  </div>
                                  {!revoked && (
                                    <>
                                      <Button size="sm" variant="outline"
                                        className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] h-6 px-2 text-[10px]"
                                        onClick={() => revokeSession(broker, s.id)}>
                                        Revoke
                                      </Button>
                                      <Button size="sm" variant="outline"
                                        className="border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white h-6 px-2 text-[10px]"
                                        onClick={() => blockDevice(broker, s.device_fingerprint)}>
                                        Block device
                                      </Button>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
