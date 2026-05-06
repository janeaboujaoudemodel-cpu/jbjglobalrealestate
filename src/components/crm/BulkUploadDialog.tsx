/**
 * BulkUploadDialog — drop an Excel/CSV/HTML list of brokerages or developers.
 * Server classifies (real-estate brokerage / developer / mortgage / other),
 * de-duplicates strictly, reroutes mis-tab uploads, and reports the breakdown.
 */
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type UploadKind = "brokerage" | "developer";

interface UploadResult {
  inserted: number;
  rerouted: number;
  rejected_non_real_estate: number;
  duplicates_skipped: number;
  total: number;
  sample_inserted?: string[];
  sample_rejected?: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: UploadKind;
  onDone?: () => void;
}

export function BulkUploadDialog({ open, onOpenChange, kind, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const reset = () => {
    setFile(null);
    setBusy(false);
    setResult(null);
  };

  const handleClose = (v: boolean) => {
    if (!busy) {
      onOpenChange(v);
      if (!v) reset();
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    try {
      const text = await file.text();
      const fnName = kind === "brokerage" ? "crm-bulk-upload-brokerages" : "crm-bulk-upload-developers";
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: { filename: file.name, content: text },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as UploadResult);
      toast.success(`Processed ${(data as UploadResult).total} rows`);
      onDone?.();
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const labelNoun = kind === "brokerage" ? "brokerages" : "developers";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-[#FDFBF7] border-[#B89555]/40">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#B89555]" />
            Upload {labelNoun} list
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Drop an Excel (.xlsx), CSV, or DLD-style HTML. We auto-detect duplicates,
            reject mortgage/consulting firms, and reroute mis-tab entries (e.g. developer
            rows uploaded here will go to the {kind === "brokerage" ? "Developer" : "Brokerage"} tab).
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-3">
            <label
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#B89555]/50 rounded-xl py-10 cursor-pointer bg-[#F7F2EA] hover:bg-[#EFE6D6] transition-colors"
            >
              <FileSpreadsheet className="w-8 h-8 text-[#B89555]" />
              <div className="text-sm font-semibold text-[#1A1A1A]">
                {file ? file.name : "Click to choose a file"}
              </div>
              <div className="text-xs text-[#1A1A1A]/70">.xlsx, .csv, .html, .xls</div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,.html,.htm,.tsv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}

        {result && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Stat icon={<CheckCircle2 className="w-4 h-4" />} label="Inserted" value={result.inserted} tone="emerald" />
              <Stat icon={<UploadCloud className="w-4 h-4" />} label="Rerouted" value={result.rerouted} tone="blue" />
              <Stat icon={<AlertCircle className="w-4 h-4" />} label="Duplicates skipped" value={result.duplicates_skipped} tone="amber" />
              <Stat icon={<AlertCircle className="w-4 h-4" />} label="Rejected (not RE)" value={result.rejected_non_real_estate} tone="red" />
            </div>
            {!!result.sample_rejected?.length && (
              <div className="text-xs">
                <div className="font-semibold mb-1 text-[#1A1A1A]">Examples rejected:</div>
                <div className="text-[#1A1A1A]/70">{result.sample_rejected.slice(0, 8).join(" · ")}</div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button variant="gold" onClick={() => handleClose(false)}>Close</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleClose(false)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="gold" disabled={!file || busy} onClick={handleUpload}>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                {busy ? "Processing…" : "Upload & classify"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "emerald" | "amber" | "red" | "blue" }) {
  const styles = {
    emerald: "bg-emerald-50 border-emerald-300 text-emerald-900",
    amber: "bg-amber-50 border-amber-300 text-amber-900",
    red: "bg-red-50 border-red-300 text-red-900",
    blue: "bg-blue-50 border-blue-300 text-blue-900",
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-2 ${styles}`}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold opacity-80">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold mt-0.5">{value}</div>
    </div>
  );
}
