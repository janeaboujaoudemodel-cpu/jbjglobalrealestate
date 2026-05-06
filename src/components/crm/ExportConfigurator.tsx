// Configurable export dialog — user picks format, scope, and which columns to include.
// Shared by the Brokerages and Developers tabs of /owner/crm/relationships.

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileSpreadsheet, FileText, FileType } from "lucide-react";

export type ExportFormat = "xlsx" | "csv" | "pdf";

export interface ColumnDef {
  key: string;
  label: string;
  group?: string; // e.g. "Public", "Admin contact", "Broker contact", "Internal"
  defaultOn?: boolean;
}

export interface ExportPreset {
  name: string;
  columns: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  totalVisible: number;
  totalSelected?: number;
  totalAll?: number;
  columns: ColumnDef[];
  presets?: ExportPreset[];
  storageKey: string; // e.g. "export.brokerages"
  statusFilters?: { key: string; label: string }[];
  onExport: (opts: {
    format: ExportFormat;
    scope: "visible" | "selected" | "all";
    columns: string[];
    statuses?: string[];
  }) => Promise<void> | void;
}

export function ExportConfigurator({
  open,
  onClose,
  totalVisible,
  totalSelected = 0,
  totalAll,
  columns,
  presets = [],
  storageKey,
  statusFilters,
  onExport,
}: Props) {
  const defaultCols = columns.filter((c) => c.defaultOn !== false).map((c) => c.key);
  const [format, setFormat] = useState<ExportFormat>("xlsx");
  const [scope, setScope] = useState<"visible" | "selected" | "all">("visible");
  const [selected, setSelected] = useState<string[]>(defaultCols);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // Load saved selection
  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSelected(parsed.filter((k: string) => columns.some((c) => c.key === k)));
      }
    } catch {}
  }, [open, storageKey, columns]);

  const toggle = (k: string) =>
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const toggleStatus = (k: string) =>
    setStatuses((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const applyPreset = (p: ExportPreset) => setSelected(p.columns);

  const groups = Array.from(
    new Set(columns.map((c) => c.group || "General")),
  );

  const run = async () => {
    if (!selected.length) return;
    setBusy(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(selected));
      await onExport({ format, scope, columns: selected, statuses: statuses.length ? statuses : undefined });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border border-[#B89555]/40 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <Download className="w-5 h-5" /> Export — choose columns & scope
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Format */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Format</Label>
            <div className="mt-2 flex gap-2">
              {[
                { v: "xlsx", l: "Excel (.xlsx)", I: FileSpreadsheet },
                { v: "csv", l: "CSV", I: FileType },
                { v: "pdf", l: "PDF", I: FileText },
              ].map((f) => {
                const Icon = f.I;
                const active = format === f.v;
                return (
                  <button
                    key={f.v}
                    type="button"
                    onClick={() => setFormat(f.v as ExportFormat)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm ${
                      active
                        ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A] font-semibold"
                        : "bg-white border-[#B89555]/30 text-[#1A1A1A]/80"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {f.l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scope */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Scope</Label>
            <RadioGroup
              value={scope}
              onValueChange={(v) => setScope(v as any)}
              className="mt-2 space-y-1"
            >
              <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                <RadioGroupItem value="visible" /> Visible filtered ({totalVisible})
              </label>
              {totalSelected > 0 && (
                <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                  <RadioGroupItem value="selected" /> Selected rows ({totalSelected})
                </label>
              )}
              {typeof totalAll === "number" && totalAll !== totalVisible && (
                <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                  <RadioGroupItem value="all" /> Entire database ({totalAll})
                </label>
              )}
            </RadioGroup>
          </div>

          {/* Status filters */}
          {statusFilters && statusFilters.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">
                Filter by status {statuses.length > 0 && `(${statuses.length})`}
              </Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {statusFilters.map((s) => {
                  const active = statuses.includes(s.key);
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleStatus(s.key)}
                      className={`px-2.5 py-1 rounded-full border text-xs ${
                        active
                          ? "bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A] font-semibold"
                          : "bg-white border-[#B89555]/30 text-[#1A1A1A]/80"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
                {statuses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatuses([])}
                    className="px-2.5 py-1 rounded-full border border-[#B89555]/30 bg-white text-xs text-[#1A1A1A]/70"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-[#1A1A1A]/60">
                {statuses.length === 0 ? "No filter — all statuses included." : "Only rows matching selected statuses will be exported."}
              </p>
            </div>
          )}

          {/* Presets */}
          {presets.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Quick presets</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {presets.map((p) => (
                  <Button
                    key={p.name}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="border-[#B89555]/40 bg-white text-[#1A1A1A]"
                    onClick={() => applyPreset(p)}
                  >
                    {p.name}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#B89555]/40"
                  onClick={() => setSelected(columns.map((c) => c.key))}
                >
                  Select all
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#B89555]/40"
                  onClick={() => setSelected([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}

          {/* Columns by group */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">
              Columns ({selected.length}/{columns.length})
            </Label>
            <div className="mt-2 space-y-3">
              {groups.map((g) => (
                <div key={g} className="rounded-md border border-[#B89555]/25 bg-white p-3">
                  <div className="text-xs font-semibold text-[#1A1A1A] mb-2">{g}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {columns.filter((c) => (c.group || "General") === g).map((c) => (
                      <label
                        key={c.key}
                        className="flex items-center gap-2 text-sm text-[#1A1A1A] cursor-pointer"
                      >
                        <Checkbox
                          checked={selected.includes(c.key)}
                          onCheckedChange={() => toggle(c.key)}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            onClick={run}
            disabled={busy || !selected.length}
            className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
          >
            <Download className="w-4 h-4 mr-2" />
            {busy ? "Exporting…" : `Download ${format.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
