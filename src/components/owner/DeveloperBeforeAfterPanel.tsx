import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, History, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FIELD_LABELS: Record<string, string> = {
  description: "Description",
  website_url: "Website URL",
  ceo_name: "CEO name",
  founded_year: "Founded year",
  headquarters: "Headquarters",
  logo_url: "Logo URL",
  office_phone: "Office phone",
  admin_email: "Admin email",
  admin_position: "Admin position",
  whatsapp: "WhatsApp",
  linkedin_url: "LinkedIn",
  instagram_url: "Instagram",
  office_address: "Office address",
  google_drive_url: "Google Drive",
  completed_projects: "Completed projects",
  offplan_projects: "Off-plan projects",
  total_units_delivered: "Units delivered",
  upcoming_units: "Upcoming units",
  name: "Name",
};

// Never propose to overwrite these system fields
const NON_APPROVABLE = new Set([
  "id",
  "slug",
  "created_at",
  "updated_at",
  "status",
  "registration_status",
  "group_status",
  "is_hidden",
]);

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function eq(a: unknown, b: unknown): boolean {
  const na = a === null || a === undefined || a === "";
  const nb = b === null || b === undefined || b === "";
  if (na && nb) return true;
  if (na || nb) return false;
  return String(a).trim() === String(b).trim();
}

export default function DeveloperBeforeAfterPanel({
  developerId,
  developerName,
}: {
  developerId: string;
  developerName: string;
}) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const qc = useQueryClient();

  // LIVE developer record — this is the real "before"
  const { data: developer, isLoading: loadingDev } = useQuery({
    queryKey: ["dev-before-after-live", developerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("id", developerId)
        .maybeSingle();
      if (error) throw error;
      return (data ?? {}) as Record<string, unknown>;
    },
  });

  // Pending Excel import proposals for this developer
  const { data: excelRows = [], isLoading: loadingExcel } = useQuery({
    queryKey: ["dev-before-after-excel", developerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dev_excel_import_review")
        .select("id, bucket, decision, after_data, reason, created_at, developer_name")
        .eq("matched_developer_id", developerId)
        .eq("decision", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Build a clean list of proposals: only rows with at least one real diff
  const proposals = useMemo(() => {
    if (!developer) return [];
    return excelRows
      .map((r) => {
        const after = (r.after_data as Record<string, unknown>) ?? {};
        const diffs: { field: string; before: unknown; after: unknown }[] = [];
        for (const [k, v] of Object.entries(after)) {
          if (NON_APPROVABLE.has(k)) continue;
          if (v === null || v === undefined || v === "") continue; // Excel had no value
          const current = developer[k];
          if (!eq(current, v)) {
            diffs.push({ field: k, before: current, after: v });
          }
        }
        return { ...r, diffs };
      })
      .filter((r) => r.diffs.length > 0);
  }, [excelRows, developer]);

  const toggle = (rowId: string, field: string) => {
    setSelected((prev) => {
      const cur = new Set(prev[rowId] ?? []);
      if (cur.has(field)) cur.delete(field);
      else cur.add(field);
      return { ...prev, [rowId]: cur };
    });
  };

  const toggleAll = (rowId: string, fields: string[]) => {
    setSelected((prev) => {
      const cur = prev[rowId] ?? new Set();
      const allOn = fields.every((f) => cur.has(f));
      return { ...prev, [rowId]: allOn ? new Set() : new Set(fields) };
    });
  };

  const approve = async (
    rowId: string,
    diffs: { field: string; after: unknown }[],
    fields: string[],
  ) => {
    const patch: Record<string, unknown> = {};
    for (const d of diffs) {
      if (fields.includes(d.field)) patch[d.field] = d.after;
    }
    if (Object.keys(patch).length === 0) {
      toast.error("Select at least one field to approve");
      return;
    }
    setSaving(rowId);
    try {
      const { error: upErr } = await supabase.from("developers").update(patch).eq("id", developerId);
      if (upErr) throw upErr;

      // If this approval covers every remaining diff on the row, mark it committed.
      const remaining = diffs.filter((d) => !fields.includes(d.field));
      if (remaining.length === 0) {
        await supabase
          .from("dev_excel_import_review")
          .update({ decision: "committed", committed_at: new Date().toISOString(), committed_developer_id: developerId })
          .eq("id", rowId);
      }

      toast.success(`Approved ${Object.keys(patch).length} field${Object.keys(patch).length > 1 ? "s" : ""}`);
      setSelected((prev) => ({ ...prev, [rowId]: new Set() }));
      qc.invalidateQueries({ queryKey: ["dev-before-after-live", developerId] });
      qc.invalidateQueries({ queryKey: ["dev-before-after-excel", developerId] });
      qc.invalidateQueries({ queryKey: ["developer", developerId] });
    } catch (e) {
      toast.error((e as Error).message || "Failed to approve");
    } finally {
      setSaving(null);
    }
  };

  const loading = loadingDev || loadingExcel;

  return (
    <Card className="border border-[#B89555]/40 bg-[#FDFBF7]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#064E3B]" />
            <CardTitle className="text-sm font-black text-[#1A1A1A]">
              Before / After · {developerName}
            </CardTitle>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-grid h-7 w-7 place-items-center rounded-full border border-[#B89555]/40 bg-white text-[#064E3B] hover:bg-[#F7F2EA]"
            title={open ? "Collapse" : "Expand"}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[11px] text-[#1A1A1A]/60 mt-1">
          Only real proposed changes are shown. Tick the fields you want to keep, then approve — approved values replace the live developer record.
        </p>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {loading && <p className="text-xs text-[#1A1A1A]/60">Loading proposals…</p>}
          {!loading && proposals.length === 0 && (
            <div className="rounded-md border border-dashed border-[#B89555]/40 bg-white p-4 text-xs text-[#1A1A1A]/70">
              No pending proposals — the live record already matches every non-empty value in the Excel import for this developer.
            </div>
          )}
          {!loading &&
            proposals.map((row) => {
              const fields = row.diffs.map((d) => d.field);
              const sel = selected[row.id] ?? new Set<string>();
              const allOn = fields.every((f) => sel.has(f));
              const anyOn = sel.size > 0;
              return (
                <div key={row.id} className="rounded-md border border-[#B89555]/30 bg-white overflow-hidden">
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#F7F2EA] border-b border-[#B89555]/30">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-[#064E3B] text-white border-0 uppercase text-[10px]">Excel import</Badge>
                      <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 uppercase text-[10px]">
                        {row.diffs.length} proposed change{row.diffs.length > 1 ? "s" : ""}
                      </Badge>
                      <span className="text-[11px] text-[#1A1A1A]/70 truncate max-w-[240px]">
                        from “{row.developer_name}”
                      </span>
                    </div>
                    <span className="text-[11px] text-[#1A1A1A]/55">{new Date(row.created_at).toLocaleString()}</span>
                  </div>

                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-white border-b border-[#B89555]/20">
                        <th className="px-3 py-2 w-8">
                          <Checkbox checked={allOn} onCheckedChange={() => toggleAll(row.id, fields)} aria-label="Select all" />
                        </th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 w-[160px]">Field</th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-red-700/70">Current (before)</th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-emerald-700/80">Proposed (after)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {row.diffs.map((d) => (
                        <tr key={d.field} className="border-t border-[#B89555]/20 align-top">
                          <td className="px-3 py-2">
                            <Checkbox
                              checked={sel.has(d.field)}
                              onCheckedChange={() => toggle(row.id, d.field)}
                              aria-label={`Approve ${d.field}`}
                            />
                          </td>
                          <td className="px-3 py-2 text-xs font-semibold text-[#1A1A1A] whitespace-nowrap">
                            {FIELD_LABELS[d.field] ?? d.field}
                          </td>
                          <td className="px-3 py-2 text-xs bg-red-50 text-red-900 max-w-[260px] break-words">{fmt(d.before)}</td>
                          <td className="px-3 py-2 text-xs bg-emerald-50 text-emerald-900 font-medium max-w-[260px] break-words">
                            {fmt(d.after)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#FDFBF7] border-t border-[#B89555]/20">
                    <span className="text-[11px] text-[#1A1A1A]/60">
                      {sel.size} of {fields.length} selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#B89555]/40 text-[#1A1A1A] h-7 text-xs"
                        onClick={() => toggleAll(row.id, fields)}
                      >
                        {allOn ? "Clear" : "Select all"}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#064E3B] hover:bg-[#053D2F] text-white h-7 text-xs"
                        disabled={!anyOn || saving === row.id}
                        onClick={() => approve(row.id, row.diffs, Array.from(sel))}
                      >
                        {saving === row.id ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        )}
                        Approve selected
                      </Button>
                      <Button
                        size="sm"
                        className="bg-[#B89555] hover:bg-[#a5854c] text-white h-7 text-xs"
                        disabled={saving === row.id}
                        onClick={() => approve(row.id, row.diffs, fields)}
                      >
                        Approve all
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
        </CardContent>
      )}
    </Card>
  );
}
