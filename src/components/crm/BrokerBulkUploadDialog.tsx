/**
 * BrokerBulkUploadDialog — multi-file CSV/XLSX uploader for INDIVIDUAL brokers.
 * Three-step flow:
 *   A. Files & metadata (specialty label, source name/type, areas, default agency).
 *   B. Parse + dedup match against the existing Broker Registry.
 *   C. Merge confirmation review → finalize via crm-broker-import-finalize.
 * Multiple databases merge into ONE registry — duplicates are detected and
 * specialty labels combine instead of overwrite.
 */
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileSpreadsheet, Loader2, X, Tag, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SPECIALTY_OPTIONS, normalizePhone, normalizeEmail, type Specialty } from "@/lib/crm/brokerNormalize";
import BrokerMergeReviewPanel, { type StagingRow } from "@/components/crm/BrokerMergeReviewPanel";

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
}

type Step = "meta" | "matching" | "review" | "done";

const FAST_MODE_THRESHOLD = 2000; // rows — above this we skip the per-row Review panel
const CHUNK_SIZE = 1000;
const CONCURRENCY = 4;

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
  const [step, setStep] = useState<Step>("meta");
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [specialty, setSpecialty] = useState<Specialty>("leasing");
  const [customLabel, setCustomLabel] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [notes, setNotes] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState("");
  const [batchLabel, setBatchLabel] = useState("");
  const [defaultBrokerage, setDefaultBrokerage] = useState<string>("__none__");
  const [busy, setBusy] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number; inserted: number; merged: number; skipped: number } | null>(null);

  const totalRows = useMemo(() => files.reduce((s, f) => s + f.rows.length, 0), [files]);
  const fastMode = totalRows > FAST_MODE_THRESHOLD;

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
    setFiles((prev) => [...prev, ...next]);
  };

  const addArea = (a: string) => {
    const t = a.trim();
    if (!t) return;
    setAreas((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setAreaInput("");
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const reset = () => {
    setStep("meta"); setFiles([]); setSpecialty("leasing"); setCustomLabel("");
    setSourceName(""); setSourceType(""); setNotes(""); setAreas([]); setAreaInput("");
    setBatchLabel(""); setDefaultBrokerage("__none__"); setBusy(false);
    setBatchId(null); setStagingRows([]); setSummary(null);
  };

  const close = (v: boolean) => {
    if (busy) return;
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  };

  const startMatching = async () => {
    if (files.length === 0) { toast.error("Add at least one file"); return; }
    if (specialty === "other" && !customLabel.trim()) { toast.error("Custom label required"); return; }
    setBusy(true);
    setStep("matching");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // Create batch
      const { data: batch, error: bErr } = await (supabase as any)
        .from("crm_import_batches")
        .insert({
          owner_id: user.id,
          target: "brokers",
          label: batchLabel || `Import ${new Date().toLocaleDateString()}`,
          strategy: "merge",
          default_expertise_type: specialty === "leasing_sales" ? "both" : specialty,
          default_expertise_areas: areas,
          row_count: totalRows,
          status: "running",
          source_filename: files.map((f) => f.file.name).join(", "),
          specialty_label: specialty,
          specialty_custom_label: specialty === "other" ? customLabel.trim() : null,
          source_name: sourceName || null,
          source_type: sourceType || null,
          notes: notes || null,
        })
        .select().single();
      if (bErr) throw bErr;
      setBatchId(batch.id);

      // Build normalized rows
      const allRows: any[] = [];
      let idx = 0;
      for (const pf of files) {
        for (const row of pf.rows) {
          const name = pick(row, ["name", "fullname", "agent", "broker"]) || "Unknown";
          const phone = pick(row, ["phone", "mobile", "tel"]);
          const whatsapp = pick(row, ["whatsapp", "wa"]) || phone;
          const email = pick(row, ["email"]);
          const license = pick(row, ["license", "licence"]);
          const rera = pick(row, ["rera", "brn"]);
          const country = pick(row, ["country"]);
          const city = pick(row, ["city"]);
          const nationality = pick(row, ["nationality"]);
          const role = pick(row, ["role", "title", "position", "designation"]);
          const brokerage_id = defaultBrokerage === "__none__" ? null : defaultBrokerage;
          allRows.push({
            index: idx++,
            file: pf.file.name,
            name, phone, whatsapp, email, role, brokerage_id,
            license_number: license, rera_number: rera,
            country, city, nationality,
          });
        }
      }

      // Match in chunks
      const matchByIndex = new Map<number, { match_agent_id: string | null; confidence: number; reasons: string[] }>();
      for (let i = 0; i < allRows.length; i += 500) {
        const chunk = allRows.slice(i, i + 500);
        const { data, error } = await supabase.functions.invoke("crm-broker-match", {
          body: { rows: chunk },
        });
        if (error) throw error;
        for (const m of (data as any)?.matches ?? []) matchByIndex.set(m.index, m);
      }

      // Insert into staging with auto-decisions
      const staging = allRows.map((r) => {
        const m = matchByIndex.get(r.index) || { match_agent_id: null, confidence: 0, reasons: [] };
        let decision: StagingRow["decision"];
        if (m.confidence >= 0.95 && m.match_agent_id) decision = "merge";
        else if (m.confidence >= 0.6 && m.match_agent_id) decision = "pending";
        else decision = "keep";
        return {
          owner_id: user.id, batch_id: batch.id,
          raw: r, normalized: {
            ...r,
            phone_normalized: normalizePhone(r.phone),
            whatsapp_normalized: normalizePhone(r.whatsapp),
            email_normalized: normalizeEmail(r.email),
          },
          match_agent_id: m.match_agent_id, match_confidence: m.confidence,
          match_reasons: m.reasons, decision,
        };
      });

      // chunked insert
      for (let i = 0; i < staging.length; i += 500) {
        const chunk = staging.slice(i, i + 500);
        await (supabase as any).from("crm_broker_import_staging").insert(chunk);
      }

      // Fetch back the staging rows + matched agent details for review
      const { data: rows } = await (supabase as any)
        .from("crm_broker_import_staging")
        .select("*")
        .eq("batch_id", batch.id);

      const matchIds = Array.from(new Set((rows || []).map((r: any) => r.match_agent_id).filter(Boolean)));
      let matchedAgents: any[] = [];
      if (matchIds.length) {
        const { data: a } = await (supabase as any)
          .from("crm_brokerage_agents")
          .select("id, name, email, phone, whatsapp, brokerage_id, specialty_labels")
          .in("id", matchIds);
        matchedAgents = a ?? [];
      }
      const byId = new Map(matchedAgents.map((a) => [a.id, a]));
      setStagingRows((rows || []).map((r: any) => ({ ...r, matched_agent: r.match_agent_id ? byId.get(r.match_agent_id) : null })));
      setStep("review");
    } catch (e: any) {
      toast.error(e?.message || "Matching failed");
      setStep("meta");
    } finally {
      setBusy(false);
    }
  };

  const finalize = async (decisions: Record<string, StagingRow["decision"]>) => {
    if (!batchId) return;
    setBusy(true);
    try {
      // Persist decisions in chunks
      const ids = Object.keys(decisions);
      for (let i = 0; i < ids.length; i += 200) {
        await Promise.all(ids.slice(i, i + 200).map((id) =>
          (supabase as any).from("crm_broker_import_staging")
            .update({ decision: decisions[id] }).eq("id", id),
        ));
      }
      const { data, error } = await supabase.functions.invoke("crm-broker-import-finalize", {
        body: { batch_id: batchId },
      });
      if (error) throw error;
      setSummary((data as any)?.summary || null);
      setStep("done");
      onDone?.();
    } catch (e: any) {
      toast.error(e?.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-4xl bg-[#FDFBF7] border-[#B89555]/40 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#B89555]" /> Upload broker database
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Drop one or many CSV/Excel files. Tag with a specialty (Leasing / Sales / etc).
            All uploaded databases merge into one unified Broker Registry — duplicates are auto-detected.
          </DialogDescription>
        </DialogHeader>

        {step === "meta" && (
          <div className="space-y-4">
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
                    <Button size="icon" variant="ghost" onClick={() => removeFile(i)}><X className="w-4 h-4" /></Button>
                  </div>
                ))}
                <div className="text-xs text-[#1A1A1A]/70">Total: <b>{totalRows}</b> rows</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
                <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Specialty label (required)</Label>
                <Select value={specialty} onValueChange={(v) => setSpecialty(v as Specialty)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SPECIALTY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {specialty === "other" && (
                  <Input placeholder="Custom label" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
                )}
                <div className="text-[11px] text-[#1A1A1A]/60">
                  Every broker in this upload will receive this label. Combines with existing labels on duplicates.
                </div>
              </div>

              <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
                <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Batch label</Label>
                <Input placeholder='e.g. "DLD Leasing Brokers — May 2026"' value={batchLabel} onChange={(e) => setBatchLabel(e.target.value)} />
                <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70 mt-2">Source name</Label>
                <Input placeholder="e.g. DLD" value={sourceName} onChange={(e) => setSourceName(e.target.value)} />
                <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70 mt-2">Source type</Label>
                <Input placeholder="e.g. Government registry / Event / Partner" value={sourceType} onChange={(e) => setSourceType(e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
              <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Area(s) of expertise (optional)
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {areas.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-xs text-[#1A1A1A]">
                    {a}
                    <button onClick={() => setAreas(areas.filter((x) => x !== a))}><X className="w-3 h-3" /></button>
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
                {COMMON_AREAS.filter((a) => !areas.includes(a)).slice(0, 12).map((a) => (
                  <button key={a} onClick={() => addArea(a)} className="text-[11px] px-2 py-0.5 rounded-full border border-[#B89555]/30 text-[#1A1A1A]/80 hover:bg-[#F7F2EA]">+ {a}</button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
              <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Default agency (optional)</Label>
              <Select value={defaultBrokerage} onValueChange={setDefaultBrokerage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Standalone (no agency)</SelectItem>
                  {brokerages.slice(0, 500).map((b) => <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
              <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Notes</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember about this database…" />
            </div>
          </div>
        )}

        {step === "matching" && (
          <div className="py-12 flex flex-col items-center gap-3 text-[#1A1A1A]">
            <Loader2 className="w-8 h-8 animate-spin text-[#B89555]" />
            <div className="text-sm">Parsing and matching {totalRows} rows against the Broker Registry…</div>
          </div>
        )}

        {step === "review" && (
          <BrokerMergeReviewPanel rows={stagingRows} onChange={setStagingRows} />
        )}

        {step === "done" && summary && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#1A1A1A]"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> <span className="font-semibold">Import complete</span></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <Stat label="Total rows" value={summary.total} />
              <Stat label="New brokers" value={summary.new_brokers} />
              <Stat label="Merged" value={summary.merged} />
              <Stat label="Skipped" value={summary.skipped} />
              <Stat label="Missing phone" value={summary.missing_phone} />
              <Stat label="Missing email" value={summary.missing_email} />
            </div>
            <div className="text-xs text-[#1A1A1A]/70">
              Labels applied: <b>{(summary.labels_applied || []).join(", ") || "—"}</b><br />
              Source: <b>{summary.source_database || "—"}</b><br />
              Batch ID: <code className="text-[10px]">{summary.batch_id}</code>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "meta" && (
            <>
              <Button variant="outline" onClick={() => close(false)} disabled={busy}>Cancel</Button>
              <Button variant="gold" onClick={startMatching} disabled={busy || files.length === 0}>
                <ArrowRight className="w-4 h-4 mr-2" /> Continue ({totalRows} rows)
              </Button>
            </>
          )}
          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("meta")} disabled={busy}>← Back</Button>
              <Button variant="gold" disabled={busy} onClick={() => {
                const decisions: Record<string, StagingRow["decision"]> = {};
                for (const r of stagingRows) decisions[r.id] = r.decision === "pending" ? "keep" : r.decision;
                finalize(decisions);
              }}>
                {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Confirm import
              </Button>
            </>
          )}
          {step === "done" && (
            <Button variant="gold" onClick={() => close(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-[#B89555]/30 bg-white p-2.5">
      <div className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/60">{label}</div>
      <div className="text-lg font-semibold text-[#1A1A1A]">{value ?? 0}</div>
    </div>
  );
}
