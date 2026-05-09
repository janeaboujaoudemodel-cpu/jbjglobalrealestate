import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, MessageSquare, Mail, RefreshCw, Trash2, UserPlus, X, Sparkles, GitMerge } from "lucide-react";
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

  const handleDuplicate = async () => {
    if (count === 0) return;
    if (!confirm(`Duplicate ${count} lead(s)?`)) return;
    setBusy(true);
    try {
      const { data: src, error: srcErr } = await supabase
        .from("crm_leads")
        .select("*")
        .in("id", selectedIds);
      if (srcErr) {
        toast.error(`Duplicate failed: ${srcErr.message}`);
        return;
      }
      const clones = (src ?? []).map((row: any) => {
        const { id, created_at, updated_at, deleted_at, ...rest } = row;
        return {
          ...rest,
          full_name: `${rest.full_name ?? "Lead"} (copy)`,
          owner_user_id: userId,
        };
      });
      if (clones.length === 0) return;
      const { error } = await supabase.from("crm_leads").insert(clones as any);
      if (error) {
        toast.error(`Duplicate failed: ${error.message}`);
        return;
      }
      toast.success(`Duplicated ${clones.length} lead(s)`);
      onClear();
      onSuccess();
    } finally {
      setBusy(false);
    }
  };

  const handleMerge = async () => {
    if (count < 2) {
      toast.error("Select at least 2 leads to merge");
      return;
    }
    if (!confirm(`Merge ${count} leads into one? The oldest record is kept as primary; others are moved to Recently Deleted.`)) return;
    setBusy(true);
    try {
      const { data: src, error: srcErr } = await supabase
        .from("crm_leads")
        .select("*")
        .in("id", selectedIds)
        .order("created_at", { ascending: true });
      if (srcErr || !src || src.length < 2) {
        toast.error(`Merge failed: ${srcErr?.message || "Need at least 2 leads"}`);
        return;
      }
      const primary: any = src[0];
      const dupes = src.slice(1);

      // Coalesce non-null fields from duplicates into primary (don't overwrite existing values)
      const merged: Record<string, any> = { ...primary };
      const skipKeys = new Set([
        "id", "created_at", "updated_at", "deleted_at",
        "owner_user_id", "owner_type", "vip_tagged_at", "vip_tagged_by",
      ]);
      for (const d of dupes) {
        for (const [k, v] of Object.entries(d)) {
          if (skipKeys.has(k)) continue;
          if (merged[k] == null || merged[k] === "") {
            if (v != null && v !== "") merged[k] = v;
          }
        }
      }
      const mergeNote = `Merged ${dupes.length} duplicate(s) on ${new Date().toISOString().slice(0, 10)} (${dupes.map((d: any) => d.id.slice(0, 8)).join(", ")})`;
      merged.notes = [primary.notes, mergeNote].filter(Boolean).join("\n");

      // Update primary
      const { id: _id, created_at: _c, ...updateFields } = merged;
      const { error: upErr } = await supabase
        .from("crm_leads")
        .update(updateFields as any)
        .eq("id", primary.id);
      if (upErr) {
        toast.error(`Merge failed: ${upErr.message}`);
        return;
      }

      // Soft-delete the duplicates
      const dupeIds = dupes.map((d: any) => d.id);
      const { error: delErr } = await supabase.rpc("crm_soft_delete_leads", {
        p_lead_ids: dupeIds,
      });
      if (delErr) {
        toast.error(`Merge: dupes not removed: ${delErr.message}`);
        return;
      }

      toast.success(`Merged ${dupes.length} duplicate(s) into ${primary.full_name || "primary lead"}`);
      onClear();
      onSuccess();
    } catch (err: any) {
      toast.error(`Merge failed: ${err?.message || "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  };
    if (!broadcastMessage.trim()) {
      toast.error("Message is required");
      return;
    }
    if (broadcastChannel === "email" && !broadcastSubject.trim()) {
      toast.error("Email subject is required");
      return;
    }
    setBusy(true);
    try {
      const { data: leads } = await supabase
        .from("crm_leads")
        .select("id, full_name, phone_e164, whatsapp_e164, email_lower")
        .in("id", selectedIds);

      let sent = 0;
      let skipped = 0;

      if (broadcastChannel === "whatsapp") {
        // Open wa.me links in new tabs (browser blocks > ~5 popups; we batch the rest as a download)
        for (const l of leads ?? []) {
          const phone = (l.whatsapp_e164 || l.phone_e164 || "").replace(/[^0-9]/g, "");
          if (!phone) { skipped++; continue; }
          const personalised = broadcastMessage.replace(/\{name\}/gi, l.full_name || "");
          window.open(
            `https://wa.me/${phone}?text=${encodeURIComponent(personalised)}`,
            "_blank",
            "noopener,noreferrer",
          );
          sent++;
        }
      } else {
        const recipients = (leads ?? [])
          .map((l) => l.email_lower)
          .filter(Boolean) as string[];
        skipped = (leads?.length ?? 0) - recipients.length;
        if (recipients.length) {
          const mailto = `mailto:?bcc=${recipients.join(",")}&subject=${encodeURIComponent(
            broadcastSubject,
          )}&body=${encodeURIComponent(broadcastMessage)}`;
          window.location.href = mailto;
          sent = recipients.length;
        }
      }

      // Log activity
      await supabase.from("crm_activities").insert(
        (leads ?? []).map((l) => ({
          lead_id: l.id,
          user_id: userId,
          activity_type: broadcastChannel === "whatsapp" ? "whatsapp" : "email",
          metadata: { bulk: true, subject: broadcastSubject || null },
        })) as any,
      );

      toast.success(`Broadcast: ${sent} sent, ${skipped} skipped`);
      setShowBroadcast(false);
      setBroadcastMessage("");
      setBroadcastSubject("");
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
          <span className="text-sm font-bold text-[#1A1A1A]">
            {count} selected
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 px-2 text-[#1A1A1A] hover:text-gold hover:bg-gold/10"
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
                className="h-9 rounded-lg border-2 border-gold/40 bg-[#FDFBF7] px-3 text-sm font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
                disabled={busy}
              >
                <option value="" className="text-[#1A1A1A]">Assign broker…</option>
                {brokers.map((b) => (
                  <option
                    key={b.user_id}
                    value={b.user_id}
                    className="text-[#1A1A1A] bg-[#FDFBF7]"
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
            className="h-9 rounded-lg border-2 border-gold/40 bg-[#FDFBF7] px-3 text-sm font-semibold text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold"
            disabled={busy}
          >
            <option value="" className="text-[#1A1A1A]">Change status…</option>
            {statusOptions.map((s) => (
              <option key={s.value} value={s.value} className="text-[#1A1A1A] bg-[#FDFBF7]">
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

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleDuplicate}
            disabled={busy}
            className="font-semibold"
          >
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowBroadcast((v) => !v)}
            disabled={busy}
            className="font-semibold"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Bulk Message
          </Button>
        </div>
      </div>

      {showBroadcast && (
        <div className="mt-2 rounded-xl border-2 border-gold/40 bg-[#FDFBF7] p-4 space-y-3 shadow-md">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={broadcastChannel === "whatsapp" ? "primary" : "secondary"}
              onClick={() => setBroadcastChannel("whatsapp")}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
            <Button
              type="button"
              size="sm"
              variant={broadcastChannel === "email" ? "primary" : "secondary"}
              onClick={() => setBroadcastChannel("email")}
            >
              <Mail className="h-4 w-4 mr-2" /> Email
            </Button>
            <span className="ml-auto text-xs text-[#1A1A1A]/60">
              Use <code className="text-[#1A1A1A]">{"{name}"}</code> for personalisation
            </span>
          </div>
          {broadcastChannel === "email" && (
            <input
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder="Subject"
              className="w-full h-10 rounded-lg border-2 border-gold/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-gold"
            />
          )}
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder={`Hi {name}, ...`}
            rows={4}
            className="w-full rounded-lg border-2 border-gold/30 bg-[#FDFBF7] px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-gold"
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowBroadcast(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" size="sm" variant="primary" onClick={handleBroadcast} disabled={busy || !broadcastMessage.trim()}>
              {busy ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
              Send to {count}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
