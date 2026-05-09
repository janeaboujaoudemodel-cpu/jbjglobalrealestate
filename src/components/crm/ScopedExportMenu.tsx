/**
 * ScopedExportMenu
 * --------------------------------------------------------------------------
 * Unified CSV / XLSX / PDF exporter with five scopes:
 *   1. Current view (uses the rows the caller already has on screen)
 *   2. Company    (brokerage or developer name → all matching leads)
 *   3. Event      (brokerage event → its attendees)
 *   4. Segment    (saved lead list → all leads on that list)
 *   5. Campaign   (campaign → recipients with lead detail)
 *
 * Backed by `exportLeads` (CSV/XLSX/PDF) and `exportScopes.ts` fetchers.
 * --------------------------------------------------------------------------
 */
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui/tabs";
import { Download, Loader2, FileText, FileSpreadsheet, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportLeads, type LeadExportFormat } from "@/utils/exportLeads";
import {
  listCompanyOptions, listEventOptions, listSegmentOptions, listCampaignOptions,
  rowsForCompany, rowsForEvent, rowsForSegment, rowsForCampaign,
  type ExportScopeKind, type ScopeOption,
} from "@/utils/exportScopes";

interface Props {
  /** Rows currently visible on the caller's page. Used for scope = "view". */
  currentRows?: any[];
  /** Default filename stem; format/scope is appended. */
  filenameBase?: string;
  /** Optional column whitelist passed straight to exportLeads. */
  columns?: { key: string; label: string }[];
  buttonLabel?: string;
}

const SCOPE_TABS: { key: ExportScopeKind; label: string }[] = [
  { key: "view", label: "Current view" },
  { key: "company", label: "Company" },
  { key: "event", label: "Event" },
  { key: "segment", label: "Segment" },
  { key: "campaign", label: "Campaign" },
];

export function ScopedExportMenu({
  currentRows, filenameBase = "crm-export", columns, buttonLabel = "Export",
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ExportScopeKind>("view");
  const [optionId, setOptionId] = useState<string>("");
  const [options, setOptions] = useState<ScopeOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [busy, setBusy] = useState<LeadExportFormat | null>(null);

  // Load scope option list on tab change
  useEffect(() => {
    if (!open) return;
    setOptionId("");
    if (scope === "view") { setOptions([]); return; }
    let cancelled = false;
    (async () => {
      setLoadingOptions(true);
      try {
        const fn = scope === "company" ? listCompanyOptions
                 : scope === "event"   ? listEventOptions
                 : scope === "segment" ? listSegmentOptions
                                       : listCampaignOptions;
        const opts = await fn();
        if (!cancelled) setOptions(opts);
      } catch (err: any) {
        if (!cancelled) toast({
          title: "Could not load options", description: err?.message, variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingOptions(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, scope, toast]);

  const selectedOption = useMemo(
    () => options.find((o) => o.id === optionId) ?? null,
    [options, optionId]
  );

  async function gatherRows(): Promise<{ rows: any[]; suffix: string }> {
    if (scope === "view") {
      return { rows: currentRows ?? [], suffix: "view" };
    }
    if (!optionId) throw new Error("Pick an option first.");
    const safe = (selectedOption?.label ?? "selection")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (scope === "company")  return { rows: await rowsForCompany(optionId),  suffix: `company-${safe}` };
    if (scope === "event")    return { rows: await rowsForEvent(optionId),    suffix: `event-${safe}` };
    if (scope === "segment")  return { rows: await rowsForSegment(optionId),  suffix: `segment-${safe}` };
    /* campaign */            return { rows: await rowsForCampaign(optionId), suffix: `campaign-${safe}` };
  }

  async function run(format: LeadExportFormat) {
    setBusy(format);
    try {
      const { rows, suffix } = await gatherRows();
      if (!rows.length) {
        toast({ title: "Nothing to export", description: "No rows match this scope." });
        return;
      }
      await exportLeads(rows, {
        format,
        filename: `${filenameBase}-${suffix}-${new Date().toISOString().slice(0, 10)}`,
        columns,
      });
      toast({ title: `Exported ${rows.length} rows`, description: `${suffix} · ${format.toUpperCase()}` });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Export failed", description: err?.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  const needsPicker = scope !== "view";
  const canExport = scope === "view"
    ? (currentRows?.length ?? 0) > 0
    : !!optionId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" title="Export CRM data">
          <Download className="w-4 h-4 mr-2" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#FDFBF7] border-[#B89555]/25 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A]">Export CRM data</DialogTitle>
        </DialogHeader>

        <Tabs value={scope} onValueChange={(v) => setScope(v as ExportScopeKind)}>
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/20 flex-wrap h-auto">
            {SCOPE_TABS.map((t) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A]"
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="view" className="mt-4">
            <p className="text-sm text-[#1A1A1A]/80">
              Exports the {currentRows?.length ?? 0} rows currently visible on this page.
            </p>
          </TabsContent>

          {(["company", "event", "segment", "campaign"] as const).map((k) => (
            <TabsContent key={k} value={k} className="mt-4 space-y-2">
              <label className="text-xs uppercase tracking-wider text-[#1A1A1A]/60">
                Pick a {k}
              </label>
              {loadingOptions ? (
                <div className="flex items-center text-sm text-[#1A1A1A]/70">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading…
                </div>
              ) : options.length === 0 ? (
                <p className="text-sm text-[#1A1A1A]/60">No {k} records found.</p>
              ) : (
                <Select value={optionId} onValueChange={setOptionId}>
                  <SelectTrigger className="bg-[#FDFBF7] border-[#B89555]/25">
                    <SelectValue placeholder={`Select a ${k}…`} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#FDFBF7] border-[#B89555]/25 max-h-72">
                    {options.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                        {o.sublabel && (
                          <span className="ml-2 text-[11px] text-[#1A1A1A]/60">· {o.sublabel}</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <FormatBtn label="CSV"  icon={<FileType className="h-4 w-4" />}
            disabled={!canExport || !!busy} busy={busy === "csv"}
            onClick={() => run("csv")} />
          <FormatBtn label="Excel" icon={<FileSpreadsheet className="h-4 w-4" />}
            disabled={!canExport || !!busy} busy={busy === "xlsx"}
            onClick={() => run("xlsx")} />
          <FormatBtn label="PDF"  icon={<FileText className="h-4 w-4" />}
            disabled={!canExport || !!busy} busy={busy === "pdf"}
            onClick={() => run("pdf")} />
        </div>
        {needsPicker && !optionId && (
          <p className="text-[11px] text-[#1A1A1A]/60 mt-2">
            Pick a {scope} above to enable export.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormatBtn({
  label, icon, onClick, disabled, busy,
}: {
  label: string; icon: React.ReactNode;
  onClick: () => void; disabled: boolean; busy: boolean;
}) {
  return (
    <Button
      variant="gold"
      onClick={onClick}
      disabled={disabled}
      className="justify-center"
    >
      {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <span className="mr-2">{icon}</span>}
      {label}
    </Button>
  );
}
