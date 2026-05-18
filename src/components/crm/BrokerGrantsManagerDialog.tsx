/**
 * BrokerGrantsManagerDialog
 * Lists all grants on a source database with owner controls:
 *   Restrict scope · Suspend · Revoke · Reactivate
 * Phase 3 — asymmetric visibility.
 */
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, ShieldOff, Ban, RotateCcw, Clock } from "lucide-react";
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

type BrokerInfo = { user_id: string; full_name: string | null; email_lower: string | null };

const stateBadge = (g: Grant) => {
  if (g.revoked_at)   return { label: "Revoked",   cls: "bg-[#1A1A1A] text-white border-[#1A1A1A]" };
  if (g.suspended_at) return { label: "Suspended", cls: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]" };
  if (g.expires_at && new Date(g.expires_at) < new Date())
    return { label: "Expired",   cls: "bg-[#F7F2EA] text-[#1A1A1A]/70 border-[#B89555]/40" };
  return { label: "Active", cls: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]" };
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

export default function BrokerGrantsManagerDialog({
  open, onOpenChange, sourceDatabaseId, sourceDatabaseName,
}: Props) {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [brokers, setBrokers] = useState<Record<string, BrokerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

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
        .select("user_id, full_name, email_lower")
        .in("user_id", ids);
      const map: Record<string, BrokerInfo> = {};
      (bks ?? []).forEach((b: any) => { if (b.user_id) map[b.user_id] = b; });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#B89555]" /> Broker access — {sourceDatabaseName}
          </DialogTitle>
          <p className="text-xs text-[#1A1A1A]/60">
            Manage who can see this database. Revoke instantly removes broker visibility.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#1A1A1A]/70 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading grants…
          </div>
        ) : grants.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#1A1A1A]/60">
            No brokers have been granted access to this database yet.
          </div>
        ) : (
          <div className="divide-y divide-[#B89555]/15 max-h-[60vh] overflow-y-auto">
            {grants.map((g) => {
              const b = brokers[g.broker_user_id];
              const badge = stateBadge(g);
              const isRevoked = !!g.revoked_at;
              const isSuspended = !!g.suspended_at;
              return (
                <div key={g.id} className="py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#1A1A1A] truncate">
                      {b?.full_name || b?.email_lower || g.broker_user_id.slice(0, 8)}
                    </div>
                    <div className="text-[11px] text-[#1A1A1A]/60 truncate">
                      {b?.email_lower ?? "no email"} · {g.permission_level === "edit" ? "Edit" : "View"} ·{" "}
                      <Clock className="inline h-3 w-3 mb-0.5" /> {windowLabel(g)}
                      {g.expires_at && <> · expires {fmt(g.expires_at)}</>}
                    </div>
                    <div className="text-[10px] text-[#1A1A1A]/50 mt-0.5">
                      Direction: {g.visibility_direction === "bidirectional" ? "Bidirectional" : "Broker → Owner only"}
                      {g.status_filter?.length ? ` · Statuses: ${g.status_filter.join(", ")}` : ""}
                    </div>
                    {g.suspend_reason && <div className="text-[10px] text-[#1A1A1A]/70 mt-0.5">Suspend reason: {g.suspend_reason}</div>}
                    {g.revoke_reason && <div className="text-[10px] text-[#1A1A1A]/70 mt-0.5">Revoke reason: {g.revoke_reason}</div>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
