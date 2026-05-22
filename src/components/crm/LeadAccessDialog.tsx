/**
 * LeadAccessDialog — owner-only "Who can see this lead?" panel.
 *
 * Shows every broker who currently has access to a single lead, grouped by
 * how they got that access (direct per-lead share OR database/folder grant).
 * If the same lead is reachable through multiple databases, each one is
 * listed separately so the owner can decide which path to keep or suspend.
 *
 * Every Suspend / Restore / Revoke action requires the owner to type a
 * confirmation word, then calls the SECURITY DEFINER RPC
 * `crm_owner_set_access_status` which re-checks owner identity server-side,
 * mutates exactly one row, and writes a full audit record.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  Database,
  Lock,
  RefreshCcw,
} from "lucide-react";

type AccessRow = {
  source: "direct_share" | "database_grant";
  source_row_id: string;
  source_label: string;
  broker_user_id: string | null;
  broker_id: string | null;
  broker_name: string | null;
  permission_level: string | null;
  started_at: string | null;
  expires_at: string | null;
  status: "active" | "suspended" | "expired";
};

type PendingAction = {
  row: AccessRow;
  action: "suspend" | "restore" | "revoke";
} | null;

const CONFIRM_WORDS: Record<NonNullable<PendingAction>["action"], string> = {
  suspend: "SUSPEND",
  restore: "RESTORE",
  revoke: "REVOKE",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName?: string | null;
}

export default function LeadAccessDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
}: Props) {
  const [rows, setRows] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [pending, setPending] = useState<PendingAction>(null);
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.rpc("crm_owner_list_access", {
      p_lead_id: leadId,
    } as any);
    setLoading(false);
    if (error) {
      setErr(error.message);
      setRows([]);
      return;
    }
    setRows((data as AccessRow[]) || []);
  };

  useEffect(() => {
    if (open && leadId) {
      setPending(null);
      setConfirmText("");
      setReason("");
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId]);

  const grouped = useMemo(() => {
    const direct = rows.filter((r) => r.source === "direct_share");
    const byDb = new Map<string, AccessRow[]>();
    rows
      .filter((r) => r.source === "database_grant")
      .forEach((r) => {
        const k = r.source_label;
        if (!byDb.has(k)) byDb.set(k, []);
        byDb.get(k)!.push(r);
      });
    return { direct, byDb };
  }, [rows]);

  const activeCount = rows.filter((r) => r.status === "active").length;

  const requestAction = (row: AccessRow, action: NonNullable<PendingAction>["action"]) => {
    setPending({ row, action });
    setConfirmText("");
    setReason("");
  };

  const confirmAction = async () => {
    if (!pending) return;
    const expected = CONFIRM_WORDS[pending.action];
    if (confirmText.trim().toUpperCase() !== expected) {
      toast.error(`Please type ${expected} to confirm.`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.rpc("crm_owner_set_access_status", {
      p_source: pending.row.source,
      p_source_row_id: pending.row.source_row_id,
      p_action: pending.action,
      p_reason: reason.trim() || null,
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error("Action failed", { description: error.message });
      return;
    }
    toast.success(
      pending.action === "suspend"
        ? "Access suspended"
        : pending.action === "restore"
        ? "Access restored"
        : "Access revoked",
      {
        description: `Broker: ${pending.row.broker_name || "broker"} • ${pending.row.source_label}`,
      },
    );
    setPending(null);
    setConfirmText("");
    setReason("");
    load();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Shield className="w-5 h-5" />
            Access — {leadName || "Lead"}
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/75">
            Every broker who can currently see this lead — whether through a
            direct share or because the lead lives in a database you granted
            them. Suspend or restore individually.
          </DialogDescription>
        </DialogHeader>

        {/* Privacy banner */}
        <div className="rounded-lg border border-[#B89555]/40 bg-[#EFE6D6] p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 mt-0.5 text-[#1A1A1A] shrink-0" />
          <p className="text-[12.5px] text-[#1A1A1A] leading-snug">
            <strong>Sensitive data.</strong> Every Suspend / Restore is
            verified server-side against the owner account, applied to a
            single access row at a time, and written to the immutable audit
            log. Brokers lose access immediately on suspend.
          </p>
        </div>

        {/* Body */}
        <div className="max-h-[420px] overflow-y-auto pr-1 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-[#1A1A1A]/60">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading access…
            </div>
          ) : err ? (
            <div className="rounded-lg border border-red-300 bg-red-50/40 p-3 text-sm text-[#1A1A1A]">
              {err === "not_owner"
                ? "Owner account required."
                : `Could not load access: ${err}`}
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-8 text-center">
              <Users className="w-8 h-8 text-[#1A1A1A]/40 mx-auto mb-2" />
              <p className="text-sm text-[#1A1A1A]/70">
                No broker currently has access to this lead.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-[#B89555]/50 text-[#1A1A1A]"
                >
                  {activeCount} active
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[#B89555]/50 text-[#1A1A1A]"
                >
                  {rows.length} total path{rows.length === 1 ? "" : "s"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-7 px-2 text-[#1A1A1A]"
                  onClick={load}
                >
                  <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                  Refresh
                </Button>
              </div>

              {/* Direct shares */}
              {grouped.direct.length > 0 && (
                <Section
                  title="Direct shares"
                  icon={<Users className="w-4 h-4 text-[#1A1A1A]" />}
                  rows={grouped.direct}
                  onAction={requestAction}
                />
              )}

              {/* Database grants */}
              {[...grouped.byDb.entries()].map(([label, rs]) => (
                <Section
                  key={label}
                  title={label}
                  icon={<Database className="w-4 h-4 text-[#1A1A1A]" />}
                  rows={rs}
                  onAction={requestAction}
                />
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#B89555]/40"
          >
            Close
          </Button>
        </DialogFooter>

        {/* Typed-confirm sub-dialog */}
        <Dialog
          open={!!pending}
          onOpenChange={(o) => {
            if (!o && !submitting) setPending(null);
          }}
        >
          <DialogContent className="max-w-md bg-[#FDFBF7] border-[#B89555]/40">
            {pending && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
                    {pending.action === "restore" ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-red-700" />
                    )}
                    {pending.action === "suspend"
                      ? "Suspend access?"
                      : pending.action === "restore"
                      ? "Restore access?"
                      : "Revoke access permanently?"}
                  </DialogTitle>
                  <DialogDescription className="text-[#1A1A1A]/75 space-y-1">
                    <div>
                      Broker:{" "}
                      <strong className="text-[#1A1A1A]">
                        {pending.row.broker_name || "broker"}
                      </strong>
                    </div>
                    <div>
                      Path:{" "}
                      <strong className="text-[#1A1A1A]">
                        {pending.row.source_label}
                      </strong>
                    </div>
                    {pending.action !== "restore" && (
                      <div className="text-[12.5px] text-red-700 mt-2">
                        This broker will lose visibility on this lead
                        immediately.
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-[#1A1A1A]">
                      Type{" "}
                      <code className="px-1.5 py-0.5 rounded bg-[#EFE6D6] border border-[#B89555]/40 text-[11px]">
                        {CONFIRM_WORDS[pending.action]}
                      </code>{" "}
                      to confirm
                    </label>
                    <Input
                      autoFocus
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="mt-1 bg-white border-[#B89555]/30"
                      placeholder={CONFIRM_WORDS[pending.action]}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#1A1A1A]">
                      Reason (optional, recorded in audit log)
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="mt-1 bg-white border-[#B89555]/30 min-h-[60px]"
                      placeholder="e.g. broker left agency / complaint received…"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setPending(null)}
                    disabled={submitting}
                    className="border-[#B89555]/40"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={confirmAction}
                    disabled={
                      submitting ||
                      confirmText.trim().toUpperCase() !==
                        CONFIRM_WORDS[pending.action]
                    }
                    className={
                      pending.action === "restore"
                        ? "bg-emerald-700 text-white hover:bg-emerald-800"
                        : "bg-red-700 text-white hover:bg-red-800"
                    }
                  >
                    {submitting && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Confirm{" "}
                    {pending.action === "suspend"
                      ? "Suspend"
                      : pending.action === "restore"
                      ? "Restore"
                      : "Revoke"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  icon,
  rows,
  onAction,
}: {
  title: string;
  icon: React.ReactNode;
  rows: AccessRow[];
  onAction: (row: AccessRow, action: "suspend" | "restore" | "revoke") => void;
}) {
  return (
    <div className="rounded-lg border border-[#B89555]/30 bg-white">
      <div className="px-3 py-2 border-b border-[#B89555]/20 flex items-center gap-2">
        {icon}
        <span className="text-[13px] font-semibold text-[#1A1A1A]">
          {title}
        </span>
        <Badge
          variant="outline"
          className="ml-auto border-[#B89555]/40 text-[10px] text-[#1A1A1A]"
        >
          {rows.length}
        </Badge>
      </div>
      <ul className="divide-y divide-[#B89555]/15">
        {rows.map((r) => {
          const isActive = r.status === "active";
          const isSuspended = r.status === "suspended";
          return (
            <li
              key={`${r.source}-${r.source_row_id}`}
              className="px-3 py-2.5 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-[#1A1A1A] truncate">
                    {r.broker_name || "Broker"}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      "text-[10px] " +
                      (isActive
                        ? "border-emerald-300 text-emerald-700 bg-emerald-50/40"
                        : isSuspended
                        ? "border-red-300 text-red-700 bg-red-50/40"
                        : "border-[#B89555]/40 text-[#1A1A1A]/70")
                    }
                  >
                    {r.status}
                  </Badge>
                  {r.permission_level && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-[#B89555]/40 text-[#1A1A1A]/70"
                    >
                      {r.permission_level}
                    </Badge>
                  )}
                </div>
                <div className="text-[11px] text-[#1A1A1A]/60 mt-0.5">
                  {r.started_at
                    ? `Since ${new Date(r.started_at).toLocaleDateString()}`
                    : "—"}
                  {r.expires_at
                    ? ` • expires ${new Date(r.expires_at).toLocaleDateString()}`
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {isActive ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50 h-8"
                    onClick={() => onAction(r, "suspend")}
                  >
                    Suspend
                  </Button>
                ) : isSuspended ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 h-8"
                    onClick={() => onAction(r, "restore")}
                  >
                    Restore
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
