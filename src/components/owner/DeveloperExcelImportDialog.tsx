/**
 * Developer Excel/CSV Bulk Import — v2
 *
 * Rules (locked, per approved plan):
 *   • Amra                → NEVER touched (row skipped entirely).
 *   • Citi Developers     → fill-blanks-only.
 *   • Every other row     → Excel WINS: non-empty Excel cells overwrite existing
 *                           fields; empty cells never wipe existing data.
 *   • New developers      → inserted with is_hidden = true.
 *   • Dedupe by slug (fallback: case-insensitive name). Zero duplication.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";

type Row = Record<string, string>;

const FIELD_LABELS: Record<string, string> = {
  name: "Developer name",
  website_url: "Website",
  ceo_name: "CEO / Founder",
  founded_year: "Founded year",
  description: "Description / About",
  office_phone: "Office phone",
  whatsapp: "WhatsApp",
  admin_email: "Email",
  instagram_url: "Instagram",
  linkedin_url: "LinkedIn",
  notable_projects: "Projects",
  specialization: "Specialization",
  parent_company: "Parent company",
  logo_url: "Logo URL",
  google_drive_url: "Google Drive folder",
};

const HEADER_MAP: Record<string, string[]> = {
  name: ["name", "developer", "developer name", "company", "company name", "developer's", "developer’s"],
  website_url: ["website", "url", "site", "web", "website url", "homepage"],
  ceo_name: ["ceo", "founder", "chairman", "owner", "owner / founder / ceo", "ceo name", "founder name"],
  founded_year: ["founded", "founded year", "year founded", "since", "established", "founding date", "founding year"],
  description: ["description", "about", "bio", "summary", "overview"],
  office_phone: ["phone", "office phone", "telephone", "contact number", "mobile"],
  whatsapp: ["whatsapp"],
  admin_email: ["email", "contact email", "admin email", "info email"],
  instagram_url: ["instagram", "ig"],
  linkedin_url: ["linkedin", "li"],
  notable_projects: ["projects", "notable projects", "portfolio", "no. of projects", "number of projects"],
  specialization: ["specialization", "specialty", "focus", "segment"],
  parent_company: ["parent", "parent company", "group"],
  logo_url: ["logo", "logo url"],
  google_drive_url: ["google drive", "drive", "drive link", "google drive folder", "marketing folder"],
};

const norm = (s: string) => String(s ?? "").trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function detectColumn(header: string): string | null {
  const h = norm(header);
  if (!h || h.startsWith("__empty")) return null;
  for (const [field, aliases] of Object.entries(HEADER_MAP)) {
    if (aliases.some((a) => a === h || h.includes(a))) return field;
  }
  return null;
}

/**
 * Smart header detection: XLSX may put a title row (e.g. "DEVELOPER'S
 * REGISTRATION MONITORING") in row 1 so the parser thinks the real headers are
 * data. We scan the first 12 rows as arrays-of-arrays and pick the row whose
 * cells match the most known field aliases; everything above it is dropped.
 */
function parseSheet(buf: ArrayBuffer, XLSX: any): { headers: string[]; rows: Row[] } {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
  if (!aoa.length) return { headers: [], rows: [] };

  let bestIdx = 0, bestScore = -1;
  const scan = Math.min(aoa.length, 12);
  for (let i = 0; i < scan; i++) {
    const cells = (aoa[i] || []).map((c) => String(c ?? "").trim());
    const nonEmpty = cells.filter(Boolean).length;
    if (nonEmpty < 2) continue;
    const score = cells.reduce((n, c) => n + (detectColumn(c) ? 1 : 0), 0) + nonEmpty * 0.05;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  const rawHeaders = (aoa[bestIdx] || []).map((c, i) => {
    const v = String(c ?? "").trim();
    return v || `Column ${i + 1}`;
  });
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((h) => {
    const n = (seen.get(h) ?? 0) + 1;
    seen.set(h, n);
    return n === 1 ? h : `${h} (${n})`;
  });
  const rows: Row[] = aoa.slice(bestIdx + 1).map((r) => {
    const obj: Row = {};
    headers.forEach((h, i) => { obj[h] = String(r?.[i] ?? "").trim(); });
    return obj;
  }).filter((r) => Object.values(r).some((v) => v && v.length));
  return { headers, rows };
}

const isAmra = (name: string) => norm(name).includes("amra");
const isCiti = (name: string) => /\bciti\b/.test(norm(name));

export default function DeveloperExcelImportDialog({
  open, onOpenChange, onDone,
}: { open: boolean; onOpenChange: (v: boolean) => void; onDone?: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    created: number; updated: number; filled_citi: number; protected_amra: number; skipped: number;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setRows([]); setHeaders([]); setMapping({}); setResult(null); setProgress(0);
  };

  const runImportWith = async (
    activeRows: Row[],
    activeMapping: Record<string, string | null>,
  ) => {
    const nameCol = Object.entries(activeMapping).find(([, f]) => f === "name")?.[0];
    if (!nameCol) { toast.error("Could not detect a 'Developer name' column"); return; }
    setBusy(true); setProgress(0);
    try {
      const payload = activeRows.map((r) => {
        const obj: Record<string, string> = {};
        for (const [h, f] of Object.entries(activeMapping)) {
          if (!f) continue;
          const v = String(r[h] ?? "").trim();
          if (v) obj[f] = v;
        }
        return obj;
      }).filter((o) => o.name);

      const CHUNK = 200;
      let created = 0, updated = 0, filled_citi = 0, protected_amra = 0, skipped = 0;
      for (let i = 0; i < payload.length; i += CHUNK) {
        const chunk = payload.slice(i, i + CHUNK);
        const { data, error } = await supabase.functions.invoke("bulk-import-developers", {
          body: { rows: chunk },
        });
        if (error) throw error;
        created += data.created ?? 0;
        updated += data.updated ?? 0;
        filled_citi += data.filled_citi ?? 0;
        protected_amra += data.protected_amra ?? 0;
        skipped += data.skipped ?? 0;
        setProgress(Math.min(100, Math.round(((i + chunk.length) / payload.length) * 100)));
      }
      setResult({ created, updated, filled_citi, protected_amra, skipped });
      toast.success(`Saved · +${created} new · ${updated} enriched · ${filled_citi} Citi blanks · ${protected_amra} Amra protected · ${skipped} skipped`);
      onDone?.();
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = useCallback(async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const { headers: hdrs, rows: json } = parseSheet(buf, XLSX);
      if (!json.length) { toast.error("Sheet appears empty"); return; }
      const auto: Record<string, string | null> = {};
      for (const h of hdrs) auto[h] = detectColumn(h);
      setHeaders(hdrs);
      setMapping(auto);
      setRows(json);
      setResult(null);
      const mapped = Object.values(auto).filter(Boolean).length;
      toast.success(`Loaded ${json.length} rows · ${mapped}/${hdrs.length} columns auto-mapped · saving…`);
      // AUTO-RUN: as soon as the file is parsed, save & enrich everything.
      await runImportWith(json, auto);
    } catch (e: any) {
      toast.error(e.message || "Could not read file");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runImport = () => runImportWith(rows, mapping);

  // Deduped developer count preview (skip Amra, skip blank names)
  const stats = useMemo(() => {
    const nameCol = Object.entries(mapping).find(([, f]) => f === "name")?.[0];
    if (!nameCol) return null;
    const seen = new Set<string>();
    let amra = 0, citi = 0;
    for (const r of rows) {
      const n = String(r[nameCol] ?? "").trim();
      if (!n) continue;
      if (isAmra(n)) { amra++; continue; }
      const key = slugify(n) || n.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      if (isCiti(n)) citi++;
    }
    return { unique: seen.size, amra, citi, rows: rows.length };
  }, [rows, mapping]);

  // Virtualized preview
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 30,
    overscan: 12,
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-[#FDFBF7] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#B89555]/20 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <FileSpreadsheet className="w-5 h-5 text-[#B89555]" />
            Import Developers from Excel / CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {rows.length === 0 ? (
            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
              }}
              className={`block border-2 border-dashed rounded-xl p-14 text-center cursor-pointer transition ${
                dragOver ? "border-[#064E3B] bg-[#064E3B]/5" : "border-[#B89555]/50 hover:bg-[#F7F2EA]"
              }`}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              <Upload className="w-10 h-10 mx-auto text-[#B89555] mb-3" />
              <p className="text-base font-semibold text-[#1A1A1A]">Drop your database — extraction & enrichment start automatically</p>
              <p className="text-xs text-[#1A1A1A]/60 mt-1">Drag & drop or click to browse (.xlsx / .xls / .csv). Every existing developer card is enriched instantly — Amra is protected, Citi fills blanks only.</p>
            </label>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              {stats && (
                <div className="rounded-xl bg-gradient-to-br from-[#064E3B] to-[#042c1c] text-white p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Stat label="Rows in file" value={stats.rows} />
                  <Stat label="Unique developers" value={stats.unique} />
                  <Stat label="Amra rows protected" value={stats.amra} />
                  <Stat label="Citi rows (fill blanks)" value={stats.citi} />
                </div>
              )}

              {/* Mapping */}
              <div className="rounded-lg border border-[#B89555]/30 bg-white p-4">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Column mapping — map each spreadsheet column to a developer field.</p>
                <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                  {headers.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs">
                      <span className="flex-1 truncate font-medium text-[#1A1A1A]" title={h}>{h}</span>
                      <span className="text-[#1A1A1A]/40">→</span>
                      <Select
                        value={mapping[h] ?? "__ignore__"}
                        onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v === "__ignore__" ? null : v }))}
                      >
                        <SelectTrigger className="h-8 w-52 bg-[#FDFBF7] border-[#B89555]/40 text-[#1A1A1A] focus:ring-[#064E3B]/40 focus:ring-offset-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">
                          <SelectItem value="__ignore__" className="text-[#1A1A1A]/60">— ignore —</SelectItem>
                          {Object.entries(FIELD_LABELS).map(([k, label]) => (
                            <SelectItem key={k} value={k} className="text-[#1A1A1A]">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Full virtualized preview */}
              <div className="rounded-lg border border-[#B89555]/30 bg-white overflow-hidden">
                <div className="px-3 py-2 border-b border-[#B89555]/20 flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#1A1A1A]">Preview — all {rows.length} rows</p>
                  <p className="text-[10px] text-[#1A1A1A]/50">Scroll to inspect every row before importing.</p>
                </div>
                <div ref={scrollRef} className="max-h-[340px] overflow-auto">
                  <div style={{ width: Math.max(headers.length * 160, 800) }}>
                    <div className="sticky top-0 z-10 bg-[#F7F2EA] border-b border-[#B89555]/30 flex text-[11px] font-semibold text-[#1A1A1A]">
                      <div className="w-12 shrink-0 p-2 border-r border-[#B89555]/20">#</div>
                      {headers.map((h) => (
                        <div key={h} className="w-40 shrink-0 p-2 border-r border-[#B89555]/20 truncate" title={h}>{h}</div>
                      ))}
                    </div>
                    <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                      {virtualizer.getVirtualItems().map((vi) => {
                        const r = rows[vi.index];
                        return (
                          <div
                            key={vi.key}
                            style={{
                              position: "absolute", top: 0, left: 0, right: 0,
                              transform: `translateY(${vi.start}px)`, height: vi.size,
                            }}
                            className="flex text-[11px] text-[#1A1A1A] border-b border-[#B89555]/10 hover:bg-[#F7F2EA]/60"
                          >
                            <div className="w-12 shrink-0 p-2 border-r border-[#B89555]/10 text-[#1A1A1A]/50">{vi.index + 1}</div>
                            {headers.map((h) => (
                              <div key={h} className="w-40 shrink-0 p-2 border-r border-[#B89555]/10 truncate" title={String(r[h] ?? "")}>
                                {String(r[h] ?? "")}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {busy && <Progress value={progress} className="h-2" />}

              {result && (
                <div className="rounded-lg bg-[#064E3B] text-white p-3 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    <b>{result.created}</b> new (hidden for review) · <b>{result.updated}</b> enriched (Excel wins) · <b>{result.filled_citi}</b> Citi blanks filled · <b>{result.protected_amra}</b> Amra rows protected · <b>{result.skipped}</b> skipped.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {rows.length > 0 && (
          <div className="shrink-0 border-t border-[#B89555]/20 px-6 py-3 bg-[#FDFBF7] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-[11px] text-[#1A1A1A]/60 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Amra never touched · Citi fills blanks only · Everyone else: Excel overwrites non-empty cells only.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={reset} disabled={busy} className="border-[#B89555]/50">
                Choose another file
              </Button>
              <Button
                onClick={runImport}
                disabled={busy || !stats}
                className="bg-[#064E3B] hover:bg-[#064E3B]/90"
                style={{ color: "#FFFFFF" }}
              >
                {busy
                  ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving & enriching… {progress}%</>
                  : result ? `Re-run on ${stats?.unique ?? 0} developers` : `Save & enrich ${stats?.unique ?? 0} developers`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.15em] text-white/70">{label}</div>
      <div className="text-xl font-semibold text-white">{value.toLocaleString()}</div>
    </div>
  );
}
