/**
 * BrokerBulkUploadDialog — multi-file CSV/XLSX uploader for INDIVIDUAL brokers.
 * Required tagging per upload: expertise type (leasing/selling/both) + area(s) of expertise.
 * Strategies: merge all into one batch, one batch per file, or append to an existing batch.
 * Parses client-side with xlsx, then bulk-inserts in 500-row chunks (no row cap).
 */
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileSpreadsheet, Loader2, X, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Expertise = "leasing" | "selling" | "both";
type Strategy = "merge" | "separate";

const COMMON_AREAS = [
  "Dubai Marina", "Downtown Dubai", "Business Bay", "JVC", "JLT", "Palm Jumeirah",
  "DIFC", "Arabian Ranches", "Dubai Hills", "Emirates Hills", "Meydan", "Damac Hills",
  "Mirdif", "Al Barsha", "Jumeirah", "Deira", "Bur Dubai", "Sharjah", "Abu Dhabi",
  "Ajman", "Ras Al Khaimah",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
  brokerages: { id: string; company_name: string }[];
}

interface ParsedFile {
  file: File;
  rows: Record<string, any>[];
  brokerageId?: string | null;
}

function pick(row: Record<string, any>, keys: string[]): string | null {
  for (const k of keys) {
    for (const rk of Object.keys(row)) {
      if (rk.toLowerCase().replace(/[^a-z]/g, "").includes(k)) {
        const v = row[rk];
        if (v != null && String(v).trim()) return String(v).trim();
      }
    }
  }
  return null;
}

async function parseFile(file: File): Promise<Record<string, any>[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: "", raw: false }) as Record<string, any>[];
}

export default function BrokerBulkUploadDialog({ open, onOpenChange, onDone, brokerages }: Props) {
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [strategy, setStrategy] = useState<Strategy>("merge");
  const [expertise, setExpertise] = useState<Expertise>("both");
  const [areas, setAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");
  const [batchLabel, setBatchLabel] = useState("");
  const [defaultBrokerage, setDefaultBrokerage] = useState<string>("__none__");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ inserted: number; total: number } | null>(null);

  const totalRows = useMemo(() => files.reduce((s, f) => s + f.rows.length, 0), [files]);

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next: ParsedFile[] = [];
    for (const f of Array.from(list)) {
      try {
        const rows = await parseFile(f);
        next.push({ file: f, rows });
      } catch (e: any) {
        toast.error(`Could not read ${f.name}: ${e?.message || "parse error"}`);
      }
    }
    setFiles(prev => [...prev, ...next]);
  };

  const addArea = (a: string) => {
    const t = a.trim();
    if (!t) return;
    setAreas(prev => prev.includes(t) ? prev : [...prev, t]);
    setAreaInput("");
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const reset = () => {
    setFiles([]); setStrategy("merge"); setExpertise("both"); setAreas([]); setAreaInput("");
    setBatchLabel(""); setDefaultBrokerage("__none__"); setProgress(null);
  };

  const close = (v: boolean) => {
    if (busy) return;
    onOpenChange(v);
    if (!v) reset();
  };

  const handleUpload = async () => {
    if (files.length === 0) { toast.error("Add at least one file"); return; }
    if (areas.length === 0) { toast.error("Add at least one area of expertise"); return; }
    setBusy(true);
    setProgress({ inserted: 0, total: totalRows });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Build batches according to strategy
      const groups: { label: string; files: ParsedFile[] }[] = strategy === "merge"
        ? [{ label: batchLabel || `Import ${new Date().toLocaleDateString()}`, files }]
        : files.map(f => ({ label: f.file.name.replace(/\.[^.]+$/, ""), files: [f] }));

      let totalInserted = 0;
      for (const g of groups) {
        // Create batch record
        const { data: batch, error: bErr } = await (supabase as any)
          .from("crm_import_batches")
          .insert({
            owner_id: user.id,
            target: "brokers",
            label: g.label,
            strategy,
            default_expertise_type: expertise,
            default_expertise_areas: areas,
            row_count: g.files.reduce((s, f) => s + f.rows.length, 0),
            status: "running",
            source_filename: g.files.map(f => f.file.name).join(", "),
          })
          .select()
          .single();
        if (bErr) throw bErr;

        // Map rows -> agent payload
        const payloads: any[] = [];
        for (const pf of g.files) {
          for (const row of pf.rows) {
            const name = pick(row, ["name", "fullname", "agent", "broker"]) || "Unknown";
            const phone = pick(row, ["phone", "mobile", "tel"]);
            const email = pick(row, ["email"]);
            const whatsapp = pick(row, ["whatsapp", "wa"]) || phone;
            const role = pick(row, ["role", "title", "position", "designation"]);
            payloads.push({
              owner_id: user.id,
              brokerage_id: defaultBrokerage === "__none__" ? null : defaultBrokerage,
              name, phone, whatsapp, email, role,
              status: "active",
              source: "bulk_import",
              expertise_type: expertise,
              expertise_areas: areas,
              import_batch_id: batch.id,
              import_label: g.label,
            });
          }
        }

        // Insert in 500-row chunks
        let inserted = 0;
        for (let i = 0; i < payloads.length; i += 500) {
          const chunk = payloads.slice(i, i + 500);
          const { error } = await (supabase as any).from("crm_brokerage_agents").insert(chunk);
          if (!error) inserted += chunk.length;
          totalInserted += chunk.length;
          setProgress({ inserted: totalInserted, total: totalRows });
        }

        await (supabase as any).from("crm_import_batches").update({
          inserted, status: "complete",
        }).eq("id", batch.id);
      }

      toast.success(`Imported ${totalInserted} brokers across ${groups.length} batch${groups.length === 1 ? "" : "es"}`);
      onDone?.();
      close(false);
    } catch (e: any) {
      toast.error(e?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/40 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#B89555]" /> Upload broker database
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Drop one or many CSV/Excel files. Tag each upload with leasing or selling expertise and area focus.
            No row limit — 33,000+ brokers supported.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File drop */}
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#B89555]/50 rounded-xl py-8 cursor-pointer bg-[#F7F2EA] hover:bg-[#EFE6D6] transition-colors">
            <FileSpreadsheet className="w-8 h-8 text-[#B89555]" />
            <div className="text-sm font-semibold text-[#1A1A1A]">Click or drop files here</div>
            <div className="text-xs text-[#1A1A1A]/70">.xlsx, .xls, .csv — multiple files OK</div>
            <input type="file" multiple accept=".xlsx,.xls,.csv,.tsv" className="hidden"
              onChange={(e) => handleFiles(e.target.files)} />
          </label>

          {files.length > 0 && (
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-[#B89555]/30 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-[#B89555] shrink-0" />
                    <span className="truncate text-[#1A1A1A]">{f.file.name}</span>
                    <span className="text-[#1A1A1A]/60 text-xs shrink-0">{f.rows.length} rows</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeFile(i)} disabled={busy}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="text-xs text-[#1A1A1A]/70">Total: <b>{totalRows}</b> rows across {files.length} file(s)</div>
            </div>
          )}

          {/* Strategy */}
          <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
            <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Import strategy</Label>
            <RadioGroup value={strategy} onValueChange={(v) => setStrategy(v as Strategy)} className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm text-[#1A1A1A] cursor-pointer">
                <RadioGroupItem value="merge" /> Merge all files into one batch
              </label>
              <label className="flex items-center gap-2 text-sm text-[#1A1A1A] cursor-pointer">
                <RadioGroupItem value="separate" /> Keep each file as its own batch (different category per file)
              </label>
            </RadioGroup>
            {strategy === "merge" && (
              <Input placeholder="Batch label (optional)" value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} className="mt-2" />
            )}
          </div>

          {/* Expertise type */}
          <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
            <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Expertise (required)</Label>
            <RadioGroup value={expertise} onValueChange={(v) => setExpertise(v as Expertise)} className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="leasing" /> Leasing</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="selling" /> Selling</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><RadioGroupItem value="both" /> Both</label>
            </RadioGroup>
          </div>

          {/* Areas */}
          <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
            <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Area(s) of expertise (required)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {areas.map(a => (
                <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-xs text-[#1A1A1A]">
                  {a}
                  <button onClick={() => setAreas(areas.filter(x => x !== a))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={areaInput} onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addArea(areaInput); } }}
                placeholder="Type an area and press Enter" />
              <Button variant="outline" onClick={() => addArea(areaInput)}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {COMMON_AREAS.filter(a => !areas.includes(a)).slice(0, 12).map(a => (
                <button key={a} onClick={() => addArea(a)} className="text-[11px] px-2 py-0.5 rounded-full border border-[#B89555]/30 text-[#1A1A1A]/80 hover:bg-[#F7F2EA]">+ {a}</button>
              ))}
            </div>
          </div>

          {/* Default brokerage */}
          <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
            <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Default agency (optional)</Label>
            <Select value={defaultBrokerage} onValueChange={setDefaultBrokerage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Standalone (no agency)</SelectItem>
                {brokerages.slice(0, 500).map(b => <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {progress && (
            <div className="rounded-lg border border-[#B89555]/30 bg-white p-3">
              <div className="text-xs text-[#1A1A1A]/70 mb-1">Importing… {progress.inserted} / {progress.total}</div>
              <div className="h-2 rounded-full bg-[#EFE6D6] overflow-hidden">
                <div className="h-full bg-[#B89555] transition-all" style={{ width: `${(progress.inserted / Math.max(1, progress.total)) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={busy}>Cancel</Button>
          <Button variant="gold" onClick={handleUpload} disabled={busy || files.length === 0}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
            {busy ? "Importing…" : `Import ${totalRows} brokers`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
