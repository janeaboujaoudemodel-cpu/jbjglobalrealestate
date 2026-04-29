import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, MessageSquare, Mail, RefreshCw, Trash2, UserPlus, X, Sparkles } from "lucide-react";
import { PIPELINE_STATUSES } from "./LeadStatusBadge";

interface BrokerOption {
  user_id: string;
  display_name: string | null;
  crm_role: string;
}

// Removed unused tokenStyle - now using inline className for proper styling

interface CRMLeadsBulkBarProps {
  userId: string;
  isOwner: boolean;
  selectedIds: string[];
  onClear: () => void;
  onSuccess: () => void;
}

export default function CRMLeadsBulkBar({
  userId,
  isOwner,
  selectedIds,
  onClear,
  onSuccess,
}: CRMLeadsBulkBarProps) {
  const [brokers, setBrokers] = useState<BrokerOption[]>([]);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [nextStatus, setNextStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<"whatsapp" | "email">("whatsapp");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("user_id, display_name, crm_role")
        .eq("is_active", true)
        .order("display_name");

      if (cancelled) return;
      if (!error && data) setBrokers(data as BrokerOption[]);
    };

    if (isOwner) load();

    return () => {
      cancelled = true;
    };
  }, [isOwner]);

  const count = selectedIds.length;

  const statusOptions = useMemo(() => {
    // Ensure stable ordering + avoid duplicates
    const seen = new Set<string>();
    return PIPELINE_STATUSES.filter((s) => {
      if (seen.has(s.value)) return false;
      seen.add(s.value);
      return true;
    });
  }, []);

  const handleDelete = async () => {
    if (count === 0) return;
    if (!confirm(`Delete ${count} lead(s)? This cannot be undone.`)) return;

    setBusy(true);
    try {
      const { error } = await supabase.rpc("crm_hard_delete_leads", {
        p_lead_ids: selectedIds,
      });

      if (error) {
        toast.error(`Delete failed: ${error.message}`);
        return;
      }

      toast.success(`Deleted ${count} lead(s)`);
      onClear();
      onSuccess();
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async () => {
    if (!isOwner) {
      toast.error("Owner access required");
      return;
    }
    if (!assigneeId) {
      toast.error("Select a broker to assign");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.rpc("bulk_assign_leads", {
        p_lead_ids: selectedIds,
        p_assignee_user_id: assigneeId,
        p_assigned_by_user_id: userId,
      });

      if (error) {
        toast.error(`Assign failed: ${error.message}`);
        return;
      }

      toast.success(`Assigned ${count} lead(s)`);
      onClear();
      onSuccess();
    } finally {
      setBusy(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!nextStatus) {
      toast.error("Select a status");
      return;
    }

    setBusy(true);
    try {
      const payload = selectedIds.map((leadId) => ({
        lead_id: leadId,
        user_id: userId,
        pipeline_status: nextStatus as any,
        is_junk: nextStatus === "junk",
        last_touch_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("crm_lead_state_per_user")
        .upsert(payload as any, { onConflict: "lead_id,user_id" });

      if (error) {
        toast.error(`Status change failed: ${error.message}`);
        return;
      }

      toast.success(`Updated status for ${count} lead(s)`);
      onClear();
      onSuccess();
    } finally {
      setBusy(false);
    }
  };

  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-40">
      <div className="rounded-xl border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] shadow-[0_4px_20px_rgba(200,167,102,0.18)] px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-black">
            {count} selected
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 px-2 text-black hover:text-gold hover:bg-gold/10"
            disabled={busy}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={busy}
            className="font-semibold"
          >
            {busy ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>

          {isOwner && (
            <>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="h-9 rounded-lg border-2 border-gold/40 bg-white px-3 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                disabled={busy}
              >
                <option value="" className="text-black">Assign broker…</option>
                {brokers.map((b) => (
                  <option
                    key={b.user_id}
                    value={b.user_id}
                    className="text-black bg-white"
                  >
                    {b.display_name || b.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAssign}
                disabled={busy || !assigneeId}
                className="font-semibold"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Broker
              </Button>
            </>
          )}

          <select
            value={nextStatus}
            onChange={(e) => setNextStatus(e.target.value)}
            className="h-9 rounded-lg border-2 border-gold/40 bg-white px-3 text-sm font-semibold text-black focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
            disabled={busy}
          >
            <option value="" className="text-black">Change status…</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value} className="text-black bg-white">
                {s.label}
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleChangeStatus}
            disabled={busy || !nextStatus}
            className="font-semibold"
          >
            Apply Status
          </Button>
        </div>
      </div>
    </div>
  );
}
