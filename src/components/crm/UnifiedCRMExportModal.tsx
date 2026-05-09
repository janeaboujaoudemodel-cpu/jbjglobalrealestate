/**
 * UnifiedCRMExportModal
 * ---------------------
 * One modal, one CSV schema, every CRM list page.
 *
 * Pass in the currently *filtered* rows from any list (leads, brokerages,
 * brokers, developers) along with the entity `kind`, and the modal will
 * export them to CSV using the same unified column set so downstream
 * tooling (Excel, BI, mail-merge) sees identical headers regardless of
 * which page the export was triggered from.
 */
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { toast } from "sonner";

export type UnifiedCRMKind = "leads" | "brokerages" | "brokers" | "developers";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: UnifiedCRMKind;
  /** The currently filtered list visible to the user. */
  rows: any[];
  /** Optional override for the file name stem. */
  filenameStem?: string;
}

/** Canonical, kind-agnostic CRM export columns. */
export const UNIFIED_CRM_COLUMNS: { key: string; label: string }[] = [
  { key: "entity_type", label: "Type" },
  { key: "name", label: "Name" },
  { key: "company", label: "Company" },
  { key: "title", label: "Title / Role" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "nationality", label: "Nationality" },
  { key: "language", label: "Language" },
  { key: "source", label: "Source" },
  { key: "upload_source", label: "Upload Source" },
  { key: "database_source", label: "Database Source" },
  { key: "team", label: "Team" },
  { key: "campaign", label: "Campaign" },
  { key: "stage", label: "Stage / Status" },
  { key: "tags", label: "Tags" },
  { key: "notes", label: "Notes" },
  { key: "created_at", label: "Created At" },
];

const pick = (...vals: any[]) => {
  for (const v of vals) {
    if (v == null) continue;
    if (typeof v === "string" && !v.trim()) continue;
    return v;
  }
  return "";
};

/** Map any kind of CRM row onto the unified column schema. */
function normalizeRow(row: any, kind: UnifiedCRMKind) {
  const tags = Array.isArray(row?.tags) ? row.tags.join(", ") : pick(row?.tags);
  const created = row?.created_at ? new Date(row.created_at).toISOString() : "";
  const country = pick(
    row?.country,
    row?.current_location_country,
    row?.country_of_residence,
    row?.region === "UAE" ? "United Arab Emirates" : row?.region,
  );

  const base = {
    entity_type:
      kind === "leads"
        ? "Lead"
        : kind === "brokerages"
        ? "Brokerage"
        : kind === "brokers"
        ? "Broker"
        : "Developer",
    name: pick(row?.full_name, row?.name, row?.company_name, row?.contact_name),
    company: pick(row?.company_name, row?.brokerage_name, row?.developer_name, row?.company),
    title: pick(row?.title, row?.role, row?.position, row?.job_title),
    email: pick(row?.email_lower, row?.email, row?.primary_email),
    phone: pick(row?.phone_e164, row?.phone, row?.primary_phone),
    whatsapp: pick(row?.whatsapp_e164, row?.whatsapp),
    country,
    city: pick(row?.city, row?.current_city, row?.location_city),
    nationality: pick(row?.nationality),
    language: pick(row?.preferred_language, row?.language),
    source: pick(row?.source),
    upload_source: pick(row?.upload_source),
    database_source: pick(row?.database_source),
    team: pick(row?.team_name, row?.team),
    campaign: pick(row?.campaign_name, row?.campaign),
    stage: pick(row?.pipeline_stage, row?.status, row?.stage),
    tags,
    notes: pick(row?.notes, row?.description),
    created_at: created,
  };
  return base as Record<string, any>;
}

const csvCell = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function downloadCSV(rows: Record<string, any>[], columns: { key: string; label: string }[], filename: string) {
  const header = columns.map((c) => csvCell(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => csvCell(r[c.key])).join(",")).join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function UnifiedCRMExportModal({ open, onOpenChange, kind, rows, filenameStem }: Props) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    UNIFIED_CRM_COLUMNS.map((c) => c.key),
  );

  const total = rows?.length ?? 0;
  const normalized = useMemo(() => (rows || []).map((r) => normalizeRow(r, kind)), [rows, kind]);

  const toggle = (key: string) =>
    setSelectedKeys((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const handleExport = () => {
    if (!total) {
      toast.error("Nothing to export — the current filter is empty.");
      return;
    }
    const cols = UNIFIED_CRM_COLUMNS.filter((c) => selectedKeys.includes(c.key));
    if (!cols.length) {
      toast.error("Select at least one column.");
      return;
    }
    const stem = filenameStem || `crm-${kind}`;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(normalized, cols, `${stem}-${stamp}.csv`);
    toast.success(`Exported ${total} ${kind} (${cols.length} columns)`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle>Export CRM list</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Exports the {total} currently filtered {kind} as CSV using the
            unified CRM column schema. Identical headers across every CRM page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto py-2">
          {UNIFIED_CRM_COLUMNS.map((c) => (
            <label
              key={c.key}
              className="flex items-center gap-2 rounded-md border border-[#B89555]/20 bg-[#F7F2EA] px-2.5 py-1.5 text-sm cursor-pointer hover:bg-[#EFE6D6]"
            >
              <Checkbox
                checked={selectedKeys.includes(c.key)}
                onCheckedChange={() => toggle(c.key)}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedKeys(UNIFIED_CRM_COLUMNS.map((c) => c.key))}
            >
              Select all
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelectedKeys([])}>
              Clear
            </Button>
          </div>
          <Button variant="gold" onClick={handleExport} disabled={!total}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV ({total})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UnifiedCRMExportModal;
