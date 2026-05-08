/**
 * BrokerBulkUploadDialog — multi-file CSV/XLSX uploader for INDIVIDUAL brokers.
 * Each file gets its own editable database name, category (specialty), source
 * name and source type. One crm_import_batches row is created per file so that
 * the labels chosen at upload time flow through to the registry cards and the
 * Excel grid view.
 */
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, FileSpreadsheet, Loader2, X, ArrowRight, CheckCircle2, Copy, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SPECIALTY_OPTIONS, normalizePhone, normalizeEmail, type Specialty } from "@/lib/crm/brokerNormalize";
import BrokerMergeReviewPanel, { type StagingRow } from "@/components/crm/BrokerMergeReviewPanel";

const SOURCE_TYPE_OPTIONS = [
  "Government registry",
  "Portal export",
  "Event attendees",
  "Partner share",
  "Manual list",
  "Scrape",
  "Other",
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
  brokerages: { id: string; company_name: string }[];
}

interface FileMeta {
  displayName: string;
  specialty: Specialty;
  customLabel: string;
  sourceName: string;
  sourceType: string;
  notes: string;
}

interface ParsedFile {
  file: File;
  rows: Record<string, any>[];
  meta: FileMeta;
}

type Step = "meta" | "matching" | "review" | "done";

const FAST_MODE_THRESHOLD = 2000;
const CHUNK_SIZE = 1000;
const CONCURRENCY = 4;

function stripExt(name: string) {
  return name.replace(/\.(xlsx|xls|csv|tsv)$/i, "");
}

function defaultMeta(file: File): FileMeta {
  return {
    displayName: stripExt(file.name),
    specialty: "leasing",
    customLabel: "",
    sourceName: "",
    sourceType: "",
    notes: "",
  };
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
  const [step, setStep] = useState<Step>("meta");
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [defaultBrokerage, setDefaultBrokerage] = useState<string>("__none__");
  const [busy, setBusy] = useState(false);
  const [stagingRows, setStagingRows] = useState<StagingRow[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [summary, setSummary] = useState<any | null>(null);
  const [progress, setProgress] = useState<{ phase: string; done: number; total: number; inserted: number; merged: number; skipped: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalRows = useMemo(() => files.reduce((s, f) => s + f.rows.length, 0), [files]);
  const fastMode = totalRows > FAST_MODE_THRESHOLD;

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next: ParsedFile[] = [];
    for (const f of Array.from(list)) {
      try {
        const rows = await parseFile(f);
        next.push({ file: f, rows, meta: defaultMeta(f) });
      } catch (e: any) {
        toast.error(`Could not read ${f.name}: ${e?.message || "parse error"}`);
      }
    }
    setFiles((prev) => [...prev, ...next]);
  };

  const updateMeta = (i: number, patch: Partial<FileMeta>) => {
    setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, meta: { ...f.meta, ...patch } } : f)));
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const applyFirstToAll = () => {
    if (files.length < 2) return;
    const src = files[0].meta;
    setFiles((prev) => prev.map((f, idx) => idx === 0 ? f : ({
      ...f,
      meta: {
        ...f.meta,
        specialty: src.specialty,
        customLabel: src.customLabel,
        sourceName: src.sourceName,
        sourceType: src.sourceType,
      },
    })));
    toast.success("Applied first file's category & source to all");
  };

  const reset = () => {
    setStep("meta"); setFiles([]); setDefaultBrokerage("__none__"); setBusy(false);
    setStagingRows([]); setActiveBatchId(null); setSummary(null); setProgress(null);
  };

  const close = (v: boolean) => {
    if (busy) return;
    onOpenChange(v);
    if (!v) setTimeout(reset, 200);
  };

  /** Validate metadata before submit. */
  const validate = (): string | null => {
    if (files.length === 0) return "Add at least one file";
    for (const f of files) {
      if (!f.meta.displayName.trim()) return `"${f.file.name}": database name required`;
      if (f.meta.specialty === "other" && !f.meta.customLabel.trim()) {
        return `"${f.meta.displayName}": custom label required for "Other"`;
      }
    }
    return null;
  };

  /** Build normalized broker rows for a single file. */
  const buildRows = (pf: ParsedFile): any[] => {
    const out: any[] = [];
    let idx = 0;
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
      out.push({
        index: idx++,
        file: pf.file.name,
        name, phone, whatsapp, email, role, brokerage_id,
        license_number: license, rera_number: rera,
        country, city, nationality,
      });
    }
    return out;
  };

  /** Create one crm_import_batches row for a single file with its metadata. */
  const createBatchForFile = async (userId: string, pf: ParsedFile) => {
    const m = pf.meta;
    const { data: batch, error: bErr } = await (supabase as any)
      .from("crm_import_batches")
      .insert({
        owner_id: userId,
        target: "brokers",
        label: m.displayName.trim() || stripExt(pf.file.name),
        strategy: "merge",
        default_expertise_type: m.specialty,
        default_expertise_areas: [],
        row_count: pf.rows.length,
        status: "running",
        source_filename: pf.file.name,
        specialty_label: m.specialty,
        specialty_custom_label: m.specialty === "other" ? m.customLabel.trim() : null,
        source_name: m.sourceName || null,
        source_type: m.sourceType || null,
        notes: m.notes || null,
      })
      .select().single();
    if (bErr) throw new Error(`"${m.displayName || pf.file.name}": ${bErr.message}`);
    return batch;
  };

  /** Run fast import for a single file using its own batch_id.
   *  - Logs every chunk failure to crm_import_batch_errors so the user sees WHY it stalled.
   *  - Persists progress to crm_import_batches after each chunk so a tab close
   *    no longer leaves an orphaned "running" batch with 0 rows.
   *  - Marks the batch as `complete` only if every row was accounted for, otherwise `partial`.
   */
  const runFastImportForFile = async (
    pf: ParsedFile,
    batch: any,
    accAgg: { inserted: number; merged: number; skipped: number },
    overall: { fileIdx: number; fileTotal: number },
    userId: string,
  ) => {
    const rows = buildRows(pf);
    const chunks: any[][] = [];
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) chunks.push(rows.slice(i, i + CHUNK_SIZE));

    // Per-batch counters (so we can persist accurate batch totals incrementally).
    let bInserted = 0, bMerged = 0, bSkipped = 0;
    let cursor = 0;
    let chunksDone = 0;
    let firstError: string | null = null;

    const persistBatchProgress = async () => {
      try {
        await (supabase as any).from("crm_import_batches").update({
          inserted: bInserted,
          updated: bMerged,
          skipped: bSkipped,
          status: "running",
        }).eq("id", batch.id);
      } catch (_) { /* best effort */ }
    };

    const logChunkError = async (chunkIdx: number, chunkLen: number, msg: string) => {
      if (!firstError) firstError = msg;
      try {
        await (supabase as any).from("crm_import_batch_errors").insert({
          batch_id: batch.id,
          owner_id: userId,
          chunk_index: chunkIdx,
          chunk_size: chunkLen,
          error_text: msg.slice(0, 2000),
        });
      } catch (_) { /* best effort */ }
    };

    const runOne = async () => {
      while (cursor < chunks.length) {
        const myIdx = cursor++;
        const chunk = chunks[myIdx];
        let attempts = 0;
        let lastErr: string = "unknown error";
        while (attempts < 2) {
          try {
            const { data, error } = await supabase.functions.invoke("crm-broker-bulk-import", {
              body: { rows: chunk, batch_id: batch.id },
            });
            if (error) {
              // supabase-js wraps the body in error.context; extract whatever we can
              const ctxMsg = (error as any)?.context?.error || (error as any)?.message || JSON.stringify(error);
              throw new Error(typeof ctxMsg === "string" ? ctxMsg : JSON.stringify(ctxMsg));
            }
            const d = data as any;
            const ins = d?.inserted ?? 0, mer = d?.merged ?? 0, skp = d?.skipped ?? 0;
            accAgg.inserted += ins; accAgg.merged += mer; accAgg.skipped += skp;
            bInserted += ins; bMerged += mer; bSkipped += skp;
            chunksDone++;
            setProgress({
              phase: `File ${overall.fileIdx}/${overall.fileTotal}: ${pf.meta.displayName}`,
              done: chunksDone, total: chunks.length,
              inserted: accAgg.inserted, merged: accAgg.merged, skipped: accAgg.skipped,
            });
            await persistBatchProgress();
            break;
          } catch (e: any) {
            lastErr = e?.message || String(e);
            attempts++;
            if (attempts >= 2) {
              accAgg.skipped += chunk.length;
              bSkipped += chunk.length;
              chunksDone++;
              await logChunkError(myIdx, chunk.length, lastErr);
              setProgress({
                phase: `File ${overall.fileIdx}/${overall.fileTotal}: ${pf.meta.displayName}`,
                done: chunksDone, total: chunks.length,
                inserted: accAgg.inserted, merged: accAgg.merged, skipped: accAgg.skipped,
              });
              await persistBatchProgress();
            }
          }
        }
      }
    };
    const workers = Array(Math.min(CONCURRENCY, chunks.length || 1)).fill(0).map(runOne);
    await Promise.all(workers);

    const accountedFor = bInserted + bMerged + bSkipped;
    const finalStatus = accountedFor >= rows.length && firstError == null
      ? "complete"
      : (accountedFor === 0 ? "failed" : "partial");
    await (supabase as any).from("crm_import_batches").update({
      inserted: bInserted,
      updated: bMerged,
      skipped: bSkipped,
      status: finalStatus,
      notes: firstError
        ? `Import error (first of many possibly): ${firstError.slice(0, 500)}`
        : batch.notes ?? null,
    }).eq("id", batch.id);

    if (finalStatus === "failed") {
      throw new Error(firstError || `Import failed for "${pf.meta.displayName}" — 0 rows inserted.`);
    }
  };

  const startMatching = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setBusy(true);
    setStep("matching");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      // ============ FAST MODE: per-file batches, parallel chunks per file ============
      if (fastMode) {
        const accAgg = { inserted: 0, merged: 0, skipped: 0 };
        const labelsApplied = new Set<string>();
        const sourceNames: string[] = [];

        for (let fi = 0; fi < files.length; fi++) {
          const pf = files[fi];
          const batch = await createBatchForFile(user.id, pf);
          labelsApplied.add(pf.meta.specialty);
          if (pf.meta.specialty === "other" && pf.meta.customLabel) labelsApplied.add(pf.meta.customLabel);
          sourceNames.push(pf.meta.displayName || pf.file.name);
          try {
            await runFastImportForFile(pf, batch, accAgg, { fileIdx: fi + 1, fileTotal: files.length }, user.id);
          } catch (e: any) {
            // Mark batch failed with reason so it doesn't stay "running" with 0 rows.
            await (supabase as any).from("crm_import_batches").update({
              status: "failed",
              notes: `Import failed: ${(e?.message || String(e)).slice(0, 500)}`,
            }).eq("id", batch.id);
            toast.error(`"${pf.meta.displayName}" failed: ${e?.message || "see import errors"}`);
          }
        }

        setSummary({
          total: totalRows,
          new_brokers: accAgg.inserted,
          merged: accAgg.merged,
          skipped: accAgg.skipped,
          missing_phone: 0, missing_email: 0,
          labels_applied: Array.from(labelsApplied),
          source_database: sourceNames.join(", "),
        });
        setStep("done");
        onDone?.();
        return;
      }

      // ============ SLOW MODE (≤2k rows total): one file at a time via Review panel ============
      // For simplicity in the slow path, if multiple files, run them sequentially through
      // the full match → review → finalize cycle. For a single file (most common case for
      // small uploads) the dialog behaves exactly as before, but with per-file metadata.
      // NOTE: when multiple small files are uploaded together, the Review panel will show
      // each file's batch in turn. To keep this change shippable we collapse them: build
      // one staging set per file but show them merged in the panel, tagged by batch.
      const allStaging: any[] = [];
      let firstBatchId: string | null = null;

      for (const pf of files) {
        const batch = await createBatchForFile(user.id, pf);
        if (!firstBatchId) firstBatchId = batch.id;
        const rows = buildRows(pf);

        const matchByIndex = new Map<number, { match_agent_id: string | null; confidence: number; reasons: string[] }>();
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { data, error } = await supabase.functions.invoke("crm-broker-match", {
            body: { rows: chunk },
          });
          if (error) throw error;
          for (const m of (data as any)?.matches ?? []) matchByIndex.set(m.index, m);
        }

        const staging = rows.map((r) => {
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

        for (let i = 0; i < staging.length; i += 500) {
          await (supabase as any).from("crm_broker_import_staging").insert(staging.slice(i, i + 500));
        }

        const PAGE = 1000;
        for (let from = 0; ; from += PAGE) {
          const { data: p } = await (supabase as any)
            .from("crm_broker_import_staging")
            .select("*")
            .eq("batch_id", batch.id)
            .range(from, from + PAGE - 1);
          const arr = (p ?? []) as any[];
          allStaging.push(...arr);
          if (arr.length < PAGE) break;
        }
      }

      const matchIds = Array.from(new Set(allStaging.map((r: any) => r.match_agent_id).filter(Boolean)));
      let matchedAgents: any[] = [];
      if (matchIds.length) {
        const { data: a } = await (supabase as any)
          .from("crm_brokerage_agents")
          .select("id, name, email, phone, whatsapp, brokerage_id, specialty_labels")
          .in("id", matchIds);
        matchedAgents = a ?? [];
      }
      const byId = new Map(matchedAgents.map((a) => [a.id, a]));
      setStagingRows(allStaging.map((r: any) => ({ ...r, matched_agent: r.match_agent_id ? byId.get(r.match_agent_id) : null })));
      setActiveBatchId(firstBatchId); // first batch is the "primary" for finalize signal
      setStep("review");
    } catch (e: any) {
      toast.error(e?.message || "Matching failed");
      setStep("meta");
    } finally {
      setBusy(false);
    }
  };

  const finalize = async (decisions: Record<string, StagingRow["decision"]>) => {
    setBusy(true);
    try {
      const ids = Object.keys(decisions);
      for (let i = 0; i < ids.length; i += 200) {
        await Promise.all(ids.slice(i, i + 200).map((id) =>
          (supabase as any).from("crm_broker_import_staging")
            .update({ decision: decisions[id] }).eq("id", id),
        ));
      }
      // Finalize each unique batch represented in staging (multi-file slow path).
      const batchIds = Array.from(new Set(stagingRows.map((r) => r.batch_id).filter(Boolean)));
      const agg = { total: 0, new_brokers: 0, merged: 0, skipped: 0, missing_phone: 0, missing_email: 0, labels: new Set<string>(), sources: [] as string[] };
      for (const bid of batchIds) {
        const { data, error } = await supabase.functions.invoke("crm-broker-import-finalize", {
          body: { batch_id: bid },
        });
        if (error) throw error;
        const s = (data as any)?.summary;
        if (s) {
          agg.total += s.total ?? 0;
          agg.new_brokers += s.new_brokers ?? 0;
          agg.merged += s.merged ?? 0;
          agg.skipped += s.skipped ?? 0;
          agg.missing_phone += s.missing_phone ?? 0;
          agg.missing_email += s.missing_email ?? 0;
          for (const l of s.labels_applied || []) agg.labels.add(l);
          if (s.source_database) agg.sources.push(s.source_database);
        }
      }
      setSummary({
        total: agg.total, new_brokers: agg.new_brokers, merged: agg.merged, skipped: agg.skipped,
        missing_phone: agg.missing_phone, missing_email: agg.missing_email,
        labels_applied: Array.from(agg.labels),
        source_database: agg.sources.join(", "),
      });
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
      <DialogContent className="max-w-5xl bg-[#FDFBF7] border-[#B89555]/40 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#B89555]" /> Upload broker databases
          </DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Drop one or many CSV/Excel files. <b>Each file</b> gets its own database name,
            category and source — these labels are saved to every broker in that file and
            appear on the broker cards and the Excel grid view.
          </DialogDescription>
        </DialogHeader>

        {step === "meta" && (
          <div className="space-y-4">
            <label
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault(); e.stopPropagation(); setIsDragging(false);
                if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors ${
                isDragging ? "border-[#B89555] bg-[#EFE6D6]" : "border-[#B89555]/50 bg-[#F7F2EA] hover:bg-[#EFE6D6]"
              }`}
            >
              <FileSpreadsheet className="w-8 h-8 text-[#B89555]" />
              <div className="text-sm font-semibold text-[#1A1A1A]">
                {isDragging ? "Drop files to add" : files.length > 0 ? "Click or drop to add more files" : "Click or drop files here"}
              </div>
              <div className="text-xs text-[#1A1A1A]/70">.xlsx, .xls, .csv — multiple files OK</div>
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,.tsv"
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  // Reset so selecting the same filename again still triggers onChange
                  e.target.value = "";
                }}
              />
            </label>

            {files.length > 1 && (
              <div className="flex items-center justify-between rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] px-3 py-2 text-xs text-[#1A1A1A]">
                <span><b>{files.length}</b> files · <b>{totalRows.toLocaleString()}</b> total rows</span>
                <Button size="sm" variant="outline" onClick={applyFirstToAll}>
                  <Copy className="w-3.5 h-3.5 mr-1.5" /> Apply first file's category &amp; source to all
                </Button>
              </div>
            )}

            {files.length > 0 && (
              <div className="space-y-3">
                {files.map((pf, i) => (
                  <div key={i} className="rounded-xl border border-[#B89555]/30 bg-white p-3 space-y-3">
                    {/* Header: filename + remove */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <FileSpreadsheet className="w-4 h-4 text-[#B89555] shrink-0 mt-1" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={pf.meta.displayName}
                              onChange={(e) => updateMeta(i, { displayName: e.target.value })}
                              placeholder="Database name"
                              className="h-9 text-sm font-semibold"
                            />
                            <Button
                              size="icon" variant="ghost"
                              title="Clear name"
                              onClick={() => updateMeta(i, { displayName: "" })}
                            ><X className="w-3.5 h-3.5" /></Button>
                            <Button
                              size="icon" variant="ghost"
                              title="Reset to filename"
                              onClick={() => updateMeta(i, { displayName: stripExt(pf.file.name) })}
                            ><RotateCcw className="w-3.5 h-3.5" /></Button>
                          </div>
                          <div className="text-[11px] text-[#1A1A1A]/60 mt-0.5">
                            Original file: <span className="font-mono">{pf.file.name}</span> · {pf.rows.length.toLocaleString()} rows
                          </div>
                        </div>
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeFile(i)} title="Remove file">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Per-file metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-[#B89555]/15">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/70">Category *</Label>
                        <Select value={pf.meta.specialty} onValueChange={(v) => updateMeta(i, { specialty: v as Specialty })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SPECIALTY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {pf.meta.specialty === "other" && (
                          <Input
                            placeholder="Custom label"
                            value={pf.meta.customLabel}
                            onChange={(e) => updateMeta(i, { customLabel: e.target.value })}
                            className="h-9"
                          />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/70">Source name</Label>
                        <Input
                          placeholder='e.g. "DLD Export May 2026"'
                          value={pf.meta.sourceName}
                          onChange={(e) => updateMeta(i, { sourceName: e.target.value })}
                          className="h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/70">Source type</Label>
                        <Select value={pf.meta.sourceType || "__none__"} onValueChange={(v) => updateMeta(i, { sourceType: v === "__none__" ? "" : v })}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Select…" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— None —</SelectItem>
                            {SOURCE_TYPE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/70">Notes (optional)</Label>
                        <Textarea
                          rows={1}
                          value={pf.meta.notes}
                          onChange={(e) => updateMeta(i, { notes: e.target.value })}
                          placeholder="Anything to remember about this database…"
                          className="min-h-[36px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 space-y-2">
              <Label className="text-xs uppercase tracking-wide text-[#1A1A1A]/70">Default agency for all files (optional)</Label>
              <Select value={defaultBrokerage} onValueChange={setDefaultBrokerage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Standalone (no agency)</SelectItem>
                  {brokerages.slice(0, 500).map((b) => <SelectItem key={b.id} value={b.id}>{b.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === "matching" && (
          <div className="py-10 flex flex-col items-center gap-4 text-[#1A1A1A]">
            <Loader2 className="w-8 h-8 animate-spin text-[#B89555]" />
            {progress ? (
              <>
                <div className="text-sm font-semibold">{progress.phase}</div>
                <div className="text-xs text-[#1A1A1A]/70">chunk {progress.done} / {progress.total}</div>
                <div className="w-full max-w-md h-2 rounded-full bg-[#EFE6D6] overflow-hidden border border-[#B89555]/30">
                  <div
                    className="h-full bg-[#1A1A1A] transition-all"
                    style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs text-[#1A1A1A]/70 flex gap-4">
                  <span>New: <b className="text-[#1A1A1A]">{progress.inserted.toLocaleString()}</b></span>
                  <span>Merged: <b className="text-[#1A1A1A]">{progress.merged.toLocaleString()}</b></span>
                  <span>Skipped: <b className="text-[#1A1A1A]">{progress.skipped.toLocaleString()}</b></span>
                </div>
              </>
            ) : (
              <div className="text-sm">Parsing and matching {totalRows.toLocaleString()} rows against the Broker Registry…</div>
            )}
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
              Databases: <b>{summary.source_database || "—"}</b>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === "meta" && (
            <>
              <Button variant="outline" onClick={() => close(false)} disabled={busy}>Cancel</Button>
              <Button variant="gold" onClick={startMatching} disabled={busy || files.length === 0}>
                <ArrowRight className="w-4 h-4 mr-2" />
                {fastMode
                  ? `Fast import ${totalRows.toLocaleString()} rows (${files.length} file${files.length === 1 ? "" : "s"})`
                  : `Continue (${totalRows.toLocaleString()} rows)`}
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
