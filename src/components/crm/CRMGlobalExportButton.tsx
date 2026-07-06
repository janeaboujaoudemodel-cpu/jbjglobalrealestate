/**
 * CRMGlobalExportButton — persistent header CTA for owner CRM.
 * Lets the operator pick which dataset (leads, brokers, brokerages, developers,
 * sales-reps, employees) to export. Fetches the live rows then opens the
 * UnifiedCRMExportModal which already handles column include/exclude + CSV.
 */
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import UnifiedCRMExportModal, { type UnifiedCRMKind } from "./UnifiedCRMExportModal";

const DATASETS: { kind: UnifiedCRMKind | "sales_reps" | "employees"; label: string; description: string }[] = [
  { kind: "leads",        label: "Leads",                description: "All CRM leads + investors + clients" },
  { kind: "brokers",      label: "Brokers",              description: "Individual broker registry (32k+)" },
  { kind: "brokerages",   label: "Brokerage Agencies",   description: "Companies + offices" },
  { kind: "developers",   label: "Developers",           description: "Master developer registry" },
  { kind: "sales_reps",   label: "Developer Sales Reps", description: "Per-developer rep contacts" },
  { kind: "employees",    label: "Employees",            description: "Internal team roster" },
];

export default function CRMGlobalExportButton() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportKind, setExportKind] = useState<UnifiedCRMKind>("leads");
  const [exportRows, setExportRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  async function pick(kind: typeof DATASETS[number]["kind"]) {
    setLoading(kind);
    try {
      let rows: any[] = [];
      let modalKind: UnifiedCRMKind = "leads";

      if (kind === "leads") {
        const { data, error } = await supabase
          .from("crm_leads")
          .select("*")
          .is("deleted_at", null)
          .limit(10000);
        if (error) throw error;
        rows = data ?? [];
        modalKind = "leads";
      } else if (kind === "brokers") {
        const { data, error } = await supabase
          .from("crm_brokers")
          .select("*")
          .limit(40000);
        if (error) throw error;
        rows = data ?? [];
        modalKind = "brokers";
      } else if (kind === "brokerages") {
        const { data, error } = await supabase
          .from("crm_brokerages")
          .select("*")
          .is("deleted_at", null)
          .limit(20000);
        if (error) throw error;
        rows = data ?? [];
        modalKind = "brokerages";
      } else if (kind === "developers") {
        const { data, error } = await supabase
          .from("developers")
          .select("*")
          .limit(5000);
        if (error) throw error;
        rows = data ?? [];
        modalKind = "developers";
      } else if (kind === "sales_reps") {
        const { data, error } = await supabase
          .from("developer_sales_reps")
          .select("*")
          .limit(5000);
        if (error) throw error;
        rows = (data ?? []).map((r: any) => ({
          ...r,
          name: r.full_name,
          email: r.email,
          phone: r.phone_e164,
        }));
        modalKind = "brokers";
      } else if (kind === "employees") {
        const { data, error } = await supabase
          .from("team_members")
          .select("*")
          .limit(5000);
        if (error) throw error;
        rows = ((data ?? []) as any[]).map((r: any) => ({
          ...r,
          name: r.full_name || r.name,
          email: r.email,
          phone: r.phone || r.phone_e164,
        }));
        modalKind = "brokers";
      }

      if (!rows.length) {
        toast.info(`No ${kind.replace("_", " ")} rows to export.`);
        return;
      }

      setExportRows(rows);
      setExportKind(modalKind);
      setPickerOpen(false);
      setExportOpen(true);
    } catch (e: any) {
      toast.error(e?.message || "Could not load data for export");
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        data-surface="emerald"
        data-emerald-action="true"
        className="jj-cta-emerald allow-white shrink-0 inline-flex h-10 items-center gap-2 px-3.5 rounded-xl text-xs font-semibold text-white hover:text-white border border-white/20 shadow-[0_10px_22px_-14px_rgba(6,78,59,0.85)]"
        style={{ color: "#FFFFFF" }}
      >
        <Download className="allow-white h-3.5 w-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
        <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Export</span>
      </button>


      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="bg-[#FDFBF7] border-[#B89555]/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">Export CRM data</DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/70">
              Pick a dataset. The next screen lets you choose columns and download CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DATASETS.map((d) => (
              <button
                key={d.kind}
                type="button"
                onClick={() => pick(d.kind)}
                disabled={loading !== null}
                className="text-left p-3 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] hover:bg-[#EFE6D6] transition disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1A1A1A]">{d.label}</span>
                  {loading === d.kind && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#1A1A1A]/60" />}
                </div>
                <p className="text-[11px] text-[#1A1A1A]/65 mt-0.5">{d.description}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {exportRows.length > 0 && (
        <UnifiedCRMExportModal
          open={exportOpen}
          onOpenChange={(v) => { setExportOpen(v); if (!v) setExportRows([]); }}
          kind={exportKind}
          rows={exportRows}
        />
      )}
    </>
  );
}
