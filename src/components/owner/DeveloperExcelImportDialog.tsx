/**
 * Developer Excel/CSV Bulk Import
 *
 * Owner-only. Upload an .xlsx/.xls/.csv of developers and this dialog will:
 *   1. Auto-detect columns by common header aliases (Name, Website, CEO, etc.)
 *   2. Preview every row + the detected mapping
 *   3. Upsert into `public.developers` by slug (falls back to name).
 *      - Existing developers: only fill BLANK fields (never overwrite).
 *      - New developers: create with `is_hidden=true` so owner can review first.
 *
 * The heavy AI enrichment (bios, CEO photos, projects) is already available via
 * the "Rebuild from site" flow on each developer — this importer just gets the
 * raw seed data into the table so the owner can then trigger rebuilds in bulk.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Row = Record<string, string>;

const HEADER_MAP: Record<string, string[]> = {
  name: ["name", "developer", "developer name", "company", "company name"],
  website_url: ["website", "url", "site", "web", "website url", "homepage"],
  ceo_name: ["ceo", "founder", "chairman", "owner", "owner / founder / ceo", "ceo name", "founder name"],
  founded_year: ["founded", "founded year", "year founded", "since", "established"],
  description: ["description", "about", "bio", "summary", "overview"],
  office_phone: ["phone", "office phone", "telephone", "contact number"],
  whatsapp: ["whatsapp"],
  admin_email: ["email", "contact email", "admin email", "info email"],
  instagram_url: ["instagram", "ig"],
  linkedin_url: ["linkedin", "li"],
  notable_projects: ["projects", "notable projects", "portfolio"],
  specialization: ["specialization", "specialty", "focus", "segment"],
  parent_company: ["parent", "parent company", "group"],
  logo_url: ["logo", "logo url"],
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function detectColumn(header: string): string | null {
  const h = header.trim().toLowerCase().replace(/[_-]+/g, " ");
  for (const [field, aliases] of Object.entries(HEADER_MAP)) {
    if (aliases.some((a) => a === h || h.includes(a))) return field;
  }
  return null;
}

export default function DeveloperExcelImportDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  const reset = () => {
    setRows([]);
    setHeaders([]);
    setMapping({});
    setResult(null);
  };

  const handleFile = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Row>(ws, { defval: "", raw: false });
      if (!json.length) {
        toast.error("Sheet is empty");
        return;
      }
      const hdrs = Object.keys(json[0]);
      const auto: Record<string, string | null> = {};
      for (const h of hdrs) auto[h] = detectColumn(h);
      setHeaders(hdrs);
      setMapping(auto);
      setRows(json);
      setResult(null);
      const mapped = Object.values(auto).filter(Boolean).length;
      toast.success(`Loaded ${json.length} rows · ${mapped}/${hdrs.length} columns auto-mapped`);
    } catch (e: any) {
      toast.error(e.message || "Could not read file");
    }
  };

  const runImport = async () => {
    setBusy(true);
    let created = 0, updated = 0, skipped = 0;
    try {
      const nameCol = Object.entries(mapping).find(([, f]) => f === "name")?.[0];
      if (!nameCol) {
        toast.error("A 'Name' column mapping is required");
        setBusy(false);
        return;
      }

      for (const row of rows) {
        const name = String(row[nameCol] ?? "").trim();
        if (!name) { skipped++; continue; }

        // Build partial payload from mapping (skip empty cells)
        const payload: Record<string, any> = {};
        for (const [header, field] of Object.entries(mapping)) {
          if (!field) continue;
          const raw = String(row[header] ?? "").trim();
          if (!raw) continue;
          if (field === "founded_year") {
            const n = parseInt(raw.replace(/\D/g, ""), 10);
            if (Number.isFinite(n)) payload[field] = n;
          } else {
            payload[field] = raw;
          }
        }

        const slug = slugify(name);

        // Try find existing by slug or by name (case-insensitive)
        const { data: existing } = await supabase
          .from("developers")
          .select("id, slug, name, website_url, ceo_name, founded_year, description, office_phone, whatsapp, admin_email, instagram_url, linkedin_url, notable_projects, specialization, parent_company, logo_url")
          .or(`slug.eq.${slug},name.ilike.${name.replace(/,/g, " ")}`)
          .limit(1)
          .maybeSingle();

        if (existing) {
          // Only fill blank fields — never overwrite
          const fill: Record<string, any> = {};
          for (const [k, v] of Object.entries(payload)) {
            if (k === "name") continue;
            if (!(existing as any)[k]) fill[k] = v;
          }
          if (Object.keys(fill).length === 0) { skipped++; continue; }
          const { error } = await supabase.from("developers").update(fill as any).eq("id", (existing as any).id);
          if (error) { skipped++; continue; }
          updated++;
        } else {
          const { error } = await supabase.from("developers").insert(({
            name,
            slug,
            is_hidden: true, // owner reviews before publishing
            ...payload,
          }) as any);
          if (error) { skipped++; continue; }
          created++;
        }
      }

      setResult({ created, updated, skipped });
      toast.success(`Import complete · +${created} new · ${updated} enriched · ${skipped} skipped`);
      onDone?.();
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#FDFBF7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <FileSpreadsheet className="w-5 h-5 text-[#B89555]" />
            Import Developers from Excel / CSV
          </DialogTitle>
        </DialogHeader>

        {rows.length === 0 ? (
          <label className="block border-2 border-dashed border-[#B89555]/40 rounded-xl p-10 text-center cursor-pointer hover:bg-[#F7F2EA] transition">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            <Upload className="w-8 h-8 mx-auto text-[#B89555] mb-2" />
            <p className="text-sm font-semibold text-[#1A1A1A]">Click to select .xlsx, .xls or .csv</p>
            <p className="text-xs text-[#1A1A1A]/60 mt-1">
              First row is treated as headers. Columns like Name, Website, CEO, Founded, Description, Phone, Email, LinkedIn, Instagram, Projects, Specialization will auto-map.
            </p>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#B89555]/30 bg-white p-3">
              <p className="text-xs font-semibold text-[#1A1A1A] mb-2">
                Column mapping ({rows.length} rows)
              </p>
              <div className="grid md:grid-cols-2 gap-2">
                {headers.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-xs">
                    <span className="flex-1 truncate font-medium text-[#1A1A1A]" title={h}>{h}</span>
                    <span className="text-[#1A1A1A]/40">→</span>
                    <select
                      value={mapping[h] ?? ""}
                      onChange={(e) => setMapping((m) => ({ ...m, [h]: e.target.value || null }))}
                      className="h-7 rounded border border-[#B89555]/30 bg-[#FDFBF7] px-1 text-xs w-40"
                    >
                      <option value="">— ignore —</option>
                      {Object.keys(HEADER_MAP).map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#B89555]/30 bg-white p-3 max-h-64 overflow-auto">
              <p className="text-xs font-semibold text-[#1A1A1A] mb-2">Preview (first 5 rows)</p>
              <table className="w-full text-[11px]">
                <thead>
                  <tr>{headers.map((h) => <th key={h} className="text-left p-1 text-[#1A1A1A]/60 font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-[#B89555]/15">
                      {headers.map((h) => <td key={h} className="p-1 text-[#1A1A1A] truncate max-w-[160px]">{String(r[h] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result && (
              <div className="rounded-lg bg-[#064E3B] text-white p-3 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span><b>{result.created}</b> new developers created (hidden for review) · <b>{result.updated}</b> existing enriched · <b>{result.skipped}</b> skipped.</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#1A1A1A]/60 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Existing developers are only enriched in <b>blank</b> fields. Nothing already saved will be overwritten.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} disabled={busy}>Choose another file</Button>
                <Button
                  onClick={runImport}
                  disabled={busy}
                  className="bg-[#064E3B] hover:bg-[#064E3B]/90 text-white"
                  style={{ color: "#FFFFFF" }}
                >
                  {busy ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Importing…</> : `Import ${rows.length} rows`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
