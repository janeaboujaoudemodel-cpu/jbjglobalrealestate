/**
 * Developer Excel/CSV Bulk Import — v2
 *
 * Rules (locked, per approved plan):
 *   • Amra                → NEVER touched (row skipped entirely).
 *   • Citi Developers     → fill-blanks-only.
 *   • Every matched row   → Excel fills missing fields only; empty cells never wipe existing data.
 *   • Unmatched rows      → skipped. No new developer rows are created from Excel.
 *   • Dedupe by slug (fallback: case-insensitive name). Zero duplication.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, FolderOpen, Database, ShieldCheck, GitCompareArrows } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { toast } from "sonner";

type Row = Record<string, string>;
type MappingValue = string | null;

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
const importKey = (s: string) => {
  const cleaned = norm(s)
    .replace(/\b(developments?|developers?|development|properties|property|realty|real\s*estate|holdings?|holding|group|llc|l\.?l\.?c|fz\-?llc|pjsc|psc|inc|co|company|international|investments?|investment|limited|ltd|sole\s+proprietorship|s\.?p\.?c|plc|corp|corporation|establishment|contracting|construction)\b/gi, " ")
    .replace(/[^a-z0-9]+/g, "");
  return cleaned || slugify(s).replace(/-/g, "") || norm(s).replace(/[^a-z0-9]+/g, "");
};

const excelColumnName = (index: number) => {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
};

const cleanHeader = (value: string, index: number) => {
  const raw = String(value ?? "").trim();
  if (!raw || /^__empty/i.test(raw) || /^blank$/i.test(raw)) return `Column ${excelColumnName(index)}`;
  return raw.replace(/^_+|_+$/g, "").replace(/\s+/g, " ");
};

const isProbablyTitleRow = (cells: string[]) => {
  const nonEmpty = cells.filter(Boolean);
  return nonEmpty.length <= 1 || (nonEmpty.length <= 2 && nonEmpty.join(" ").length > 28 && !nonEmpty.some((c) => detectColumn(c)));
};

const looksLikeUrl = (v: string) => /https?:\/\//i.test(v) || /www\./i.test(v);
const looksLikeEmail = (v: string) => /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(v);
const looksLikePhone = (v: string) => /(?:\+?\d[\d\s().-]{6,}\d)/.test(v);
const looksLikeYear = (v: string) => /\b(18|19|20|21)\d{2}\b/.test(v);
const looksLikeDeveloperName = (v: string) => {
  const n = norm(v);
  if (!n || looksLikeUrl(v) || looksLikeEmail(v) || looksLikePhone(v)) return false;
  return /\b(development|developers?|properties|real estate|holding|group|invest|capital|estate|contracting|construction|one|amana|wadan|citi)\b/.test(n)
    || (v.length >= 3 && v.length <= 80 && !/[.!?]{2,}/.test(v));
};

function detectColumn(header: string): string | null {
  const h = norm(header);
  if (!h || h.startsWith("__empty")) return null;
  const isNotesColumn = /\b(notes?|remarks?|comments?|status|follow\s*up)\b/.test(h);
  for (const [field, aliases] of Object.entries(HEADER_MAP)) {
    if (field === "google_drive_url") {
      if (isNotesColumn) continue;
      if (["google drive", "drive link", "google drive link", "google drive folder", "marketing folder", "folder url"].includes(h)) return field;
      if ((h.includes("drive") || h.includes("folder")) && /\b(url|link|folder)\b/.test(h)) return field;
      continue;
    }
    if (aliases.some((a) => a === h || h.includes(a))) return field;
  }
  return null;
}

function inferColumnFromValues(header: string, values: string[], columnIndex: number): string | null {
  const fixed = detectColumn(header);
  if (fixed) return fixed;
  const sample = values.map((v) => String(v ?? "").trim()).filter(Boolean).slice(0, 80);
  if (!sample.length) return null;
  const lower = sample.map(norm);
  const urlCount = sample.filter(looksLikeUrl).length;
  const emailCount = sample.filter(looksLikeEmail).length;
  const phoneCount = sample.filter(looksLikePhone).length;
  const yearCount = sample.filter(looksLikeYear).length;
  const driveCount = lower.filter((v) => v.includes("drive.google") || v.includes("google drive")).length;
  const instagramCount = lower.filter((v) => v.includes("instagram.com") || v.startsWith("@") || v.includes("instagram")).length;
  const linkedinCount = lower.filter((v) => v.includes("linkedin.com") || v.includes("linkedin")).length;
  const developerNames = sample.filter(looksLikeDeveloperName).length;
  const longText = sample.filter((v) => v.length > 120).length;

  if (driveCount) return "google_drive_url";
  if (emailCount >= Math.max(1, sample.length * 0.2)) return "admin_email";
  if (linkedinCount) return "linkedin_url";
  if (instagramCount) return "instagram_url";
  if (urlCount >= Math.max(1, sample.length * 0.35)) return "website_url";
  if (phoneCount >= Math.max(1, sample.length * 0.35)) return "office_phone";
  if (yearCount >= Math.max(2, sample.length * 0.35)) return "founded_year";
  if (longText >= Math.max(1, sample.length * 0.25)) return "description";
  if (columnIndex <= 2 && developerNames >= Math.max(2, sample.length * 0.45)) return "name";
  return null;
}

/**
 * Smart header detection: XLSX may put a title row (e.g. "DEVELOPER'S
 * REGISTRATION MONITORING") in row 1 so the parser thinks the real headers are
 * data. We scan the first 12 rows as arrays-of-arrays and pick the row whose
 * cells match the most known field aliases; everything above it is dropped.
 */
function parseSheet(buf: ArrayBuffer, XLSX: any): { headers: string[]; rows: Row[]; inferred: Record<string, MappingValue> } {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
  if (!aoa.length) return { headers: [], rows: [], inferred: {} };

  let bestIdx = -1, bestScore = -1, bestAliasScore = 0;
  const scan = Math.min(aoa.length, 50);
  for (let i = 0; i < scan; i++) {
    const cells = (aoa[i] || []).map((c) => String(c ?? "").trim());
    const nonEmpty = cells.filter(Boolean).length;
    if (nonEmpty < 2 || isProbablyTitleRow(cells)) continue;
    const aliasScore = cells.reduce((n, c) => n + (detectColumn(c) ? 1 : 0), 0);
    const dataLikeScore = cells.reduce((n, c) => n + (looksLikeUrl(c) || looksLikeEmail(c) || looksLikePhone(c) || looksLikeDeveloperName(c) ? 0.2 : 0), 0);
    const score = aliasScore * 10 + dataLikeScore + nonEmpty * 0.08;
    if (score > bestScore) { bestScore = score; bestIdx = i; bestAliasScore = aliasScore; }
  }

  const hasRealHeader = bestIdx >= 0 && bestAliasScore >= 2;
  const dataStartIdx = hasRealHeader
    ? bestIdx + 1
    : Math.max(0, aoa.findIndex((r) => {
        const cells = (r || []).map((c) => String(c ?? "").trim());
        return !isProbablyTitleRow(cells) && cells.filter(Boolean).length >= 2;
      }));

  const width = Math.max(...aoa.slice(dataStartIdx, Math.min(aoa.length, dataStartIdx + 200)).map((r) => r?.length ?? 0), aoa[bestIdx]?.length ?? 0);
  const activeIndexes = Array.from({ length: width }, (_, i) => i).filter((i) => {
    const headerValue = hasRealHeader ? String(aoa[bestIdx]?.[i] ?? "").trim() : "";
    if (headerValue) return true;
    return aoa.slice(dataStartIdx).some((r) => String(r?.[i] ?? "").trim());
  });

  const rawHeaders = activeIndexes.map((sourceIndex) => (
    hasRealHeader ? cleanHeader(String(aoa[bestIdx]?.[sourceIndex] ?? ""), sourceIndex) : `Column ${excelColumnName(sourceIndex)}`
  ));
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((h) => {
    const n = (seen.get(h) ?? 0) + 1;
    seen.set(h, n);
    return n === 1 ? h : `${h} (${n})`;
  });
  const rows: Row[] = aoa.slice(dataStartIdx).map((r) => {
    const obj: Row = {};
    headers.forEach((h, i) => { obj[h] = String(r?.[activeIndexes[i]] ?? "").trim(); });
    return obj;
  }).filter((r) => Object.values(r).some((v) => v && v.length));

  const inferred: Record<string, MappingValue> = {};
  headers.forEach((h, i) => {
    const values = rows.map((r) => r[h]);
    inferred[h] = inferColumnFromValues(h, values, i) ?? "__custom__";
  });
  const mappedName = Object.values(inferred).includes("name");
  if (!mappedName && headers.length) inferred[headers[0]] = "name";
  return { headers, rows, inferred };
}

const isAmra = (name: string) => norm(name).includes("amra");
const isCiti = (name: string) => /\bciti\b/.test(norm(name));

export default function DeveloperExcelImportDialog({
  open, onOpenChange, onDone,
}: { open: boolean; onOpenChange: (v: boolean) => void; onDone?: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, MappingValue>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    created: number; updated: number; filled_citi: number; protected_amra: number; skipped: number; unmatched?: number; total_unique?: number; drive_jobs?: number; dry_run?: boolean; changed?: Array<{ name: string; action: string; fields: string[] }>;
  } | null>(null);
  const [previewResult, setPreviewResult] = useState<{
    created: number; updated: number; filled_citi: number; protected_amra: number; skipped: number; unmatched?: number; total_unique?: number; changed?: Array<{ name: string; action: string; fields: string[] }>;
  } | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]); setHeaders([]); setMapping({}); setResult(null); setPreviewResult(null); setProgress(0);
  };

  const buildPayload = (
    activeRows: Row[],
    activeMapping: Record<string, MappingValue>,
  ) => {
    const nameCol = Object.entries(activeMapping).find(([, f]) => f === "name")?.[0];
    if (!nameCol) throw new Error("Could not detect a 'Developer name' column");
    const byDeveloper = new Map<string, Record<string, string | Record<string, string>>>();
    activeRows.forEach((r) => {
      const obj: Record<string, string | Record<string, string>> = {};
      const customFields: Record<string, string> = {};
      for (const [h, f] of Object.entries(activeMapping)) {
        if (!f) continue;
        const v = String(r[h] ?? "").trim();
        if (!v) continue;
        if (f === "__custom__") customFields[h] = v;
        else obj[f] = v;
      }
      if (Object.keys(customFields).length) obj.custom_fields = customFields;
      if (!obj.name) return;
      const key = importKey(String(obj.name));
      const previous = byDeveloper.get(key) ?? {};
      const previousCustom = (previous.custom_fields as Record<string, string> | undefined) ?? {};
      byDeveloper.set(key, {
        ...previous,
        ...obj,
        custom_fields: { ...previousCustom, ...(obj.custom_fields as Record<string, string> | undefined ?? {}) },
      });
    });
    const payload = Array.from(byDeveloper.values()).filter((o) => o.name);
    if (!payload.length) throw new Error("No developer names were found in the database file");
    return payload;
  };

  const runImportWith = async (
    activeRows: Row[],
    activeMapping: Record<string, MappingValue>,
  ) => {
    setBusy(true); setProgress(0);
    try {
      const payload = buildPayload(activeRows, activeMapping);
      const batchSize = 75;
      const chunks = Array.from({ length: Math.ceil(payload.length / batchSize) }, (_, i) => payload.slice(i * batchSize, (i + 1) * batchSize));
      const totals: { created: number; updated: number; filled_citi: number; protected_amra: number; skipped: number; unmatched: number; total_unique: number; drive_jobs: number; changed: Array<{ name: string; action: string; fields: string[] }> } = { created: 0, updated: 0, filled_citi: 0, protected_amra: 0, skipped: 0, unmatched: 0, total_unique: 0, drive_jobs: 0, changed: [] };
      for (let i = 0; i < chunks.length; i++) {
        setProgress(Math.max(5, Math.round((i / chunks.length) * 95)));
        const { data, error } = await supabase.functions.invoke("bulk-import-developers", {
          body: { rows: chunks[i], auto_enrich_drive: true, import_marker: `developer_excel_${new Date().toISOString().slice(0, 10)}` },
        });
        if (error) throw error;
        totals.created += data?.created ?? 0;
        totals.updated += data?.updated ?? 0;
        totals.filled_citi += data?.filled_citi ?? 0;
        totals.protected_amra += data?.protected_amra ?? 0;
        totals.skipped += data?.skipped ?? 0;
        totals.unmatched += data?.unmatched ?? 0;
        totals.total_unique += data?.total_unique ?? 0;
        totals.drive_jobs += data?.drive_jobs ?? 0;
        totals.changed.push(...(Array.isArray(data?.changed) ? data.changed : []));
      }
      setProgress(100);
      const summary = {
        created: totals.created,
        updated: totals.updated,
        filled_citi: totals.filled_citi,
        protected_amra: totals.protected_amra,
        skipped: totals.skipped,
        unmatched: totals.unmatched,
        total_unique: totals.total_unique,
        drive_jobs: totals.drive_jobs,
        changed: totals.changed,
      };
      setResult(summary);
      toast.success(`Updated ${summary.updated + summary.filled_citi} existing developers · ${summary.unmatched} unmatched skipped · 0 new records created`);
      onDone?.();
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const runPreview = async () => {
    setBusy(true); setProgress(0);
    try {
      const payload = buildPayload(rows, mapping);
      const batchSize = 75;
      const chunks = Array.from({ length: Math.ceil(payload.length / batchSize) }, (_, i) => payload.slice(i * batchSize, (i + 1) * batchSize));
      const totals = { created: 0, updated: 0, filled_citi: 0, protected_amra: 0, skipped: 0, unmatched: 0, total_unique: 0, changed: [] as Array<{ name: string; action: string; fields: string[] }> };
      for (let i = 0; i < chunks.length; i++) {
        setProgress(Math.max(5, Math.round((i / chunks.length) * 95)));
        const { data, error } = await supabase.functions.invoke("bulk-import-developers", {
          body: { rows: chunks[i], dry_run: true, auto_enrich_drive: false },
        });
        if (error) throw error;
        totals.created += data?.created ?? 0;
        totals.updated += data?.updated ?? 0;
        totals.filled_citi += data?.filled_citi ?? 0;
        totals.protected_amra += data?.protected_amra ?? 0;
        totals.skipped += data?.skipped ?? 0;
        totals.unmatched += data?.unmatched ?? 0;
        totals.total_unique += data?.total_unique ?? 0;
        totals.changed.push(...(Array.isArray(data?.changed) ? data.changed : []));
      }
      setProgress(100);
      setPreviewResult(totals);
      setCompareOpen(true);
      toast.success(`Impact preview ready: ${totals.updated + totals.filled_citi} existing updates · ${totals.unmatched} unmatched skipped · 0 new records`);
    } catch (e: any) {
      toast.error(e.message || "Could not preview import impact");
    } finally {
      setBusy(false);
    }
  };

  const handleFile = useCallback(async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const { headers: hdrs, rows: json, inferred } = parseSheet(buf, XLSX);
      if (!json.length) { toast.error("Sheet appears empty"); return; }
      const auto: Record<string, MappingValue> = inferred;
      setHeaders(hdrs);
      setMapping(auto);
      setRows(json);
      setResult(null);
      setPreviewResult(null);
      setCompareOpen(false);
      const mapped = Object.values(auto).filter((v) => v && v !== "__custom__").length;
      const captured = Object.values(auto).filter(Boolean).length;
      toast.success(`Loaded ${json.length} rows · ${mapped} mapped fields · ${captured} columns captured. Review first, then click Save & Enrich.`);
    } catch (e: any) {
      toast.error(e.message || "Could not read file");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runImport = () => runImportWith(rows, mapping);

  const acceptFiles = async (incoming: FileList | File[] | null) => {
    const file = pickImportFile(incoming ? Array.from(incoming) : []);
    if (!file) {
      toast.error("No Excel or CSV database file found. Drop the file itself, or choose a folder that contains it.");
      return;
    }
    await handleFile(file);
  };

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
      const key = importKey(n);
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
          <DialogDescription className="sr-only">
            Upload a developer database to save and enrich developer records in batches.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {rows.length === 0 ? (
            <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.currentTarget.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={async (e) => {
                e.preventDefault(); setDragOver(false);
                const files = await collectDroppedFiles(e.dataTransfer);
                await acceptFiles(files.length ? files : e.dataTransfer.files);
              }}
              className={`block rounded-xl border-2 border-dashed p-14 text-center cursor-pointer transition ${
                dragOver ? "border-[#064E3B] bg-[#064E3B]/5" : "border-[#B89555]/50 hover:bg-[#F7F2EA]"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => acceptFiles(e.target.files)}
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                className="hidden"
                {...({ webkitdirectory: "", directory: "" } as any)}
                onChange={(e) => acceptFiles(e.target.files)}
              />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#064E3B] text-white">
                <FolderOpen className="h-7 w-7" />
              </div>
              <p className="text-base font-semibold text-[#1A1A1A]">Drop the full developer database here</p>
              <p className="mt-1 text-xs text-[#1A1A1A]/70">Excel / CSV is reviewed first. Nothing saves until you click Save & Enrich.</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#B89555]/50 bg-[#FDFBF7] text-[#1A1A1A]"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  Choose database file
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#B89555]/50 bg-[#FDFBF7] text-[#1A1A1A]"
                  onClick={(e) => { e.stopPropagation(); folderInputRef.current?.click(); }}
                >
                  Choose folder
                </Button>
              </div>
              <div className="mt-5 grid gap-2 text-left text-xs text-[#1A1A1A] sm:grid-cols-3">
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3"><Database className="mb-1 h-4 w-4 text-[#064E3B]" />All columns are captured — no forced ignore.</div>
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3"><ShieldCheck className="mb-1 h-4 w-4 text-[#064E3B]" />Amra protected. Citi fills only blanks.</div>
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3"><Upload className="mb-1 h-4 w-4 text-[#064E3B]" />Google Drive links queue AI scans.</div>
              </div>
            </div>
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

              {stats && (
                <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-3 text-xs text-[#1A1A1A] flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-black text-[#1A1A1A]">Before / after checkpoint</p>
                      <p className="text-[#1A1A1A]/70">Before: uploaded file loaded only, backend unchanged. After: appears here only after Save & Enrich completes.</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" disabled={busy} className="border-[#B89555]/50" onClick={previewResult ? () => setCompareOpen((v) => !v) : runPreview}>
                      <GitCompareArrows className="w-3.5 h-3.5 mr-1" /> {previewResult ? (compareOpen ? "Hide compare" : "Show compare") : "Compare impact"}
                    </Button>
                  </div>
                  {compareOpen && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-[#FDFBF7] border border-[#B89555]/25 p-3">
                        <p className="font-bold">Before save</p>
                        <p>{stats.unique.toLocaleString()} unique developers detected · {headers.length.toLocaleString()} columns captured · 0 records changed.</p>
                      </div>
                      <div className="rounded-lg bg-[#FDFBF7] border border-[#B89555]/25 p-3">
                        <p className="font-bold">After save</p>
                        {previewResult ? (
                      <p>0 new developers will be created · {previewResult.updated} existing developers will be improved · {previewResult.filled_citi} Citi blanks will be filled · {previewResult.unmatched ?? 0} unmatched Excel rows will be skipped · 0 records saved yet.</p>
                        ) : result ? (
                          <p>0 new developers created · {result.updated} updated · {result.filled_citi} Citi blanks filled · {result.unmatched ?? 0} unmatched skipped · {result.drive_jobs ?? 0} Drive scans queued.</p>
                        ) : (
                          <p>Pending — click Compare impact to preview, then Save & Enrich to write changes.</p>
                        )}
                      </div>
                      {(previewResult?.changed?.length || result?.changed?.length) ? (
                        <div className="md:col-span-2 max-h-40 overflow-auto rounded-lg border border-[#B89555]/25 bg-white">
                          {(previewResult?.changed ?? result?.changed ?? []).slice(0, 30).map((row, idx) => (
                            <div key={`${row.name}-${idx}`} className="flex items-center justify-between gap-3 border-b border-[#B89555]/10 px-3 py-2">
                              <span className="font-semibold truncate">{row.name}</span>
                              <span className="text-[#1A1A1A]/70 shrink-0">{row.action} · {row.fields.slice(0, 5).join(", ") || "status"}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Mapping */}
              <div className="rounded-lg border border-[#B89555]/30 bg-white p-4">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Column mapping — unknown columns are saved as extra developer fields instead of being ignored.</p>
                <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                  {headers.map((h) => (
                    <div key={h} className="grid grid-cols-[minmax(0,1fr)_14px_13rem] items-center gap-2 text-xs">
                      <span className="truncate font-medium text-[#1A1A1A]" title={h}>{h}</span>
                      <span className="text-center text-[#1A1A1A]/40">→</span>
                      <Select
                        value={mapping[h] ?? "__ignore__"}
                        onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v === "__ignore__" ? null : v }))}
                      >
                        <SelectTrigger className="h-8 bg-transparent text-[#1A1A1A] focus:ring-[#064E3B]/40 focus:ring-offset-0 [&>span]:truncate [&>span]:whitespace-nowrap">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">
                          <SelectItem value="__custom__" className="text-[#1A1A1A]">Keep as extra field</SelectItem>
                          <SelectItem value="__ignore__" className="text-[#1A1A1A]/60">Ignore this column</SelectItem>
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
                    <p className="text-[10px] text-[#1A1A1A]/50">Virtualised full database preview.</p>
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
                    <b>{result.total_unique ?? 0}</b> unique developers processed · <b>0</b> new records created · <b>{result.updated}</b> existing developers enriched · <b>{result.filled_citi}</b> Citi blanks filled · <b>{result.unmatched ?? 0}</b> unmatched skipped · <b>{result.protected_amra}</b> Amra rows protected · <b>{result.drive_jobs ?? 0}</b> Drive scans queued.
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
               Amra never touched · Citi fills blanks only · matched existing developers are enriched only · unmatched Excel rows are skipped.
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

function pickImportFile(files: File[]): File | null {
  const candidates = files.filter((f) => /\.(xlsx|xls|csv)$/i.test(f.name));
  if (!candidates.length) return null;
  const ranked = [...candidates].sort((a, b) => {
    const aNamed = /developer|database|registration|monitoring|crm/i.test(a.name) ? 0 : 1;
    const bNamed = /developer|database|registration|monitoring|crm/i.test(b.name) ? 0 : 1;
    if (aNamed !== bNamed) return aNamed - bNamed;
    const aExcel = /\.(xlsx|xls)$/i.test(a.name) ? 0 : 1;
    const bExcel = /\.(xlsx|xls)$/i.test(b.name) ? 0 : 1;
    if (aExcel !== bExcel) return aExcel - bExcel;
    return b.size - a.size;
  });
  return ranked[0];
}

async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<File[]> {
  const items = Array.from(dataTransfer.items ?? []);
  const entries = items.map((item: any) => item.webkitGetAsEntry?.()).filter(Boolean);
  if (!entries.length) return Array.from(dataTransfer.files ?? []);
  const out: File[] = [];
  for (const entry of entries) await walkEntry(entry, out);
  return out;
}

async function walkEntry(entry: any, out: File[]): Promise<void> {
  if (entry?.isFile) {
    await new Promise<void>((resolve) => entry.file((file: File) => { out.push(file); resolve(); }, () => resolve()));
    return;
  }
  if (!entry?.isDirectory) return;
  const reader = entry.createReader();
  const readBatch = () => new Promise<any[]>((resolve) => reader.readEntries((entries: any[]) => resolve(entries), () => resolve([])));
  let batch = await readBatch();
  while (batch.length) {
    for (const child of batch) await walkEntry(child, out);
    batch = await readBatch();
  }
}
