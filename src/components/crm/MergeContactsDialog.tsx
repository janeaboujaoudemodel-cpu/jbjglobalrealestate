import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, GitMerge } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type Lead = Record<string, any> & { id: string };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadIds: string[];
  onMerged: () => void;
}

// Fields the user reviews. Anything not listed here keeps the primary's value.
const FIELDS: { key: string; label: string }[] = [
  { key: "full_name", label: "Full name" },
  { key: "email_lower", label: "Email" },
  { key: "phone_e164", label: "Phone" },
  { key: "company_name", label: "Company" },
  { key: "nationality", label: "Nationality" },
  { key: "current_location_city", label: "City" },
  { key: "current_location_country", label: "Country" },
  { key: "source", label: "Source" },
  { key: "lead_source_type", label: "Source type" },
  { key: "notes", label: "Notes" },
];

const fmt = (v: any): string => {
  if (v == null) return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  const s = String(v).trim();
  return s.length ? s : "—";
};

export default function MergeContactsDialog({
  open,
  onOpenChange,
  leadIds,
  onMerged,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  // For each field, holds the lead id whose value should win.
  const [winners, setWinners] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || leadIds.length < 2) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("crm_leads")
          .select("*")
          .in("id", leadIds)
          .order("created_at", { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const rows = (data || []) as Lead[];
        setLeads(rows);
        const initialPrimary = rows[0]?.id ?? null;
        setPrimaryId(initialPrimary);
        // Default winner for each field: first lead with a non-empty value.
        const w: Record<string, string> = {};
        for (const f of FIELDS) {
          const r = rows.find((row) => row[f.key] != null && row[f.key] !== "");
          w[f.key] = (r?.id ?? initialPrimary) as string;
        }
        setWinners(w);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load leads");
        onOpenChange(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, leadIds.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const primary = useMemo(
    () => leads.find((l) => l.id === primaryId) || null,
    [leads, primaryId],
  );

  const handleConfirm = async () => {
    if (!primary || leads.length < 2) return;
    setBusy(true);
    try {
      // Build the surviving record: start from primary, override with chosen winners.
      const update: Record<string, any> = {};
      for (const f of FIELDS) {
        const winnerId = winners[f.key] || primary.id;
        const winner = leads.find((l) => l.id === winnerId);
        if (!winner) continue;
        update[f.key] = winner[f.key] ?? null;
      }

      // Merge tags as a union of all leads (de-duped).
      const tagSet = new Set<string>();
      for (const l of leads) {
        const t = (l as any).tags;
        if (Array.isArray(t)) t.forEach((x) => tagSet.add(String(x)));
      }
      if (tagSet.size > 0) update.tags = Array.from(tagSet);

      // Append a merge note describing the absorbed records.
      const dupes = leads.filter((l) => l.id !== primary.id);
      const mergeNote = `Merged ${dupes.length} duplicate(s) on ${new Date()
        .toISOString()
        .slice(0, 10)} (${dupes.map((d) => d.id.slice(0, 8)).join(", ")})`;
      update.notes = [update.notes, mergeNote].filter(Boolean).join("\n");

      const { error: upErr } = await supabase
        .from("crm_leads")
        .update(update as any)
        .eq("id", primary.id);
      if (upErr) throw upErr;

      // Mark absorbed leads as duplicates pointing to the primary, then soft-delete.
      const dupeIds = dupes.map((d) => d.id);
      const { error: dupErr } = await supabase
        .from("crm_leads")
        .update({ duplicate_of_id: primary.id } as any)
        .in("id", dupeIds);
      if (dupErr) console.warn("Failed to set duplicate_of_id:", dupErr.message);

      const { error: delErr } = await supabase.rpc("crm_soft_delete_leads", {
        p_lead_ids: dupeIds,
      });
      if (delErr) {
        // Fallback: direct soft delete
        await supabase
          .from("crm_leads")
          .update({ deleted_at: new Date().toISOString() } as any)
          .in("id", dupeIds);
      }

      toast.success(
        `Merged ${dupes.length} duplicate${dupes.length === 1 ? "" : "s"} into ${
          primary.full_name || "primary lead"
        }`,
      );
      onOpenChange(false);
      onMerged();
    } catch (e: any) {
      toast.error(e?.message || "Merge failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (busy ? null : onOpenChange(o))}>
      <DialogContent className="max-w-4xl bg-[#FDFBF7] border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <GitMerge className="w-5 h-5" /> Merge contacts
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Pick the primary record (kept) and choose the surviving value per field.
            Other records are moved to Recently Deleted.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : leads.length < 2 ? (
          <p className="text-sm text-[#1A1A1A]/70 py-4">
            Select at least 2 leads to merge.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border border-[#B89555]/30">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F2EA]">
                <tr>
                  <th className="text-left p-2 text-[#1A1A1A]/70 font-bold uppercase tracking-wide">
                    Field
                  </th>
                  {leads.map((l) => (
                    <th
                      key={l.id}
                      className="text-left p-2 text-[#1A1A1A] align-bottom min-w-[180px]"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="primary"
                          checked={primaryId === l.id}
                          onChange={() => setPrimaryId(l.id)}
                          aria-label={`Make ${l.full_name || l.id.slice(0, 8)} primary`}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {l.full_name || "(no name)"}
                          </div>
                          <div className="text-[10px] text-[#1A1A1A]/60">
                            {primaryId === l.id ? "Primary · kept" : "Will be merged into primary"}
                          </div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FIELDS.map((f) => (
                  <tr key={f.key} className="border-t border-[#B89555]/20">
                    <td className="p-2 text-[#1A1A1A]/80 font-medium align-top">
                      {f.label}
                    </td>
                    {leads.map((l) => {
                      const v = (l as any)[f.key];
                      const checked = winners[f.key] === l.id;
                      return (
                        <td
                          key={l.id}
                          className={`p-2 align-top ${checked ? "bg-[#EFE6D6]" : ""}`}
                        >
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`field-${f.key}`}
                              checked={checked}
                              onChange={() =>
                                setWinners((prev) => ({ ...prev, [f.key]: l.id }))
                              }
                              className="mt-0.5"
                            />
                            <span className="text-[#1A1A1A] break-words">
                              {fmt(v)}
                            </span>
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={busy || loading || leads.length < 2}
            className="bg-[#1A1A1A] text-[#FDFBF7] hover:bg-[#2A2A2A]"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <GitMerge className="w-4 h-4 mr-2" />
            )}
            Merge {leads.length} → 1
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
