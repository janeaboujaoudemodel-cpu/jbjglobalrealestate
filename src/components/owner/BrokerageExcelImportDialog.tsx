import { useCallback, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Database, FileSpreadsheet, FolderOpen, GitCompareArrows, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

type Row = Record<string, string>;
type MappingValue = string | null;

const FIELD_LABELS: Record<string, string> = {
  company_name: "Brokerage / Agency name",
  website: "Website",
  phone: "Phone",
  email: "Email",
  emirate: "Emirate / city",
  country: "Country",
  office_location: "Office location",
  office_address: "Office address",
  google_maps_link: "Google Maps link",
  admin_name: "Admin / contact name",
  admin_phone: "Admin phone",
  dld_office_number: "DLD / RERA office number",
};

const HEADER_MAP: Record<string, string[]> = {
  company_name: ["brokerage", "agency", "company", "company name", "brokerage name", "office name", "name"],
  website: ["website", "web", "url", "site"],
  phone: ["phone", "telephone", "mobile", "contact number"],
  email: ["email", "contact email", "admin email"],
  emirate: ["emirate", "city", "location"],
  country: ["country"],
  office_location: ["office location", "office", "area"],
  office_address: ["office address", "address"],
  google_maps_link: ["google maps", "maps", "map link", "google maps link"],
  admin_name: ["admin", "contact", "manager", "contact name", "primary contact"],
  admin_phone: ["admin phone", "contact phone", "manager phone"],
  dld_office_number: ["dld", "office number", "rera", "rera license", "license"],
};

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
const colName = (index: number) => {
  let n = index + 1, out = "";
  while (n > 0) { const rem = (n - 1) % 26; out = String.fromCharCode(65 + rem) + out; n = Math.floor((n - 1) / 26); }
  return out;
};
const detect = (header: string): string | null => {
  const h = norm(header);
  for (const [field, aliases] of Object.entries(HEADER_MAP)) if (aliases.some((a) => h === a || h.includes(a))) return field;
  return null;
};
const looksEmail = (v: string) => /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(v);
const looksPhone = (v: string) => /(?:\+?\d[\d\s().-]{6,}\d)/.test(v);
const looksUrl = (v: string) => /https?:\/\//i.test(v) || /www\./i.test(v);
const looksName = (v: string) => {
  const s = norm(v);
  return !!s && !looksEmail(v) && !looksPhone(v) && !looksUrl(v) && (s.includes("real estate") || s.includes("broker") || s.includes("properties") || v.length <= 90);
};

function parseSheet(buf: ArrayBuffer, XLSX: any) {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: false, blankrows: false });
  if (!aoa.length) return { headers: [] as string[], rows: [] as Row[], inferred: {} as Record<string, MappingValue> };
  let bestIdx = 0, bestScore = -1;
  for (let i = 0; i < Math.min(aoa.length, 50); i++) {
    const cells = (aoa[i] || []).map((c) => String(c ?? "").trim());
    const nonEmpty = cells.filter(Boolean).length;
    if (nonEmpty < 2) continue;
    const score = cells.reduce((n, c) => n + (detect(c) ? 10 : 0), 0) + nonEmpty;
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }
  const hasHeader = bestScore >= 20;
  const start = hasHeader ? bestIdx + 1 : 0;
  const width = Math.max(...aoa.slice(start, Math.min(aoa.length, start + 200)).map((r) => r.length), aoa[bestIdx]?.length ?? 0);
  const active = Array.from({ length: width }, (_, i) => i).filter((i) => String(aoa[bestIdx]?.[i] ?? "").trim() || aoa.slice(start).some((r) => String(r?.[i] ?? "").trim()));
  const rawHeaders = active.map((i) => hasHeader ? (String(aoa[bestIdx]?.[i] ?? "").trim() || `Column ${colName(i)}`) : `Column ${colName(i)}`);
  const seen = new Map<string, number>();
  const headers = rawHeaders.map((h) => { const n = (seen.get(h) ?? 0) + 1; seen.set(h, n); return n === 1 ? h : `${h} (${n})`; });
  const rows = aoa.slice(start).map((r) => {
    const obj: Row = {};
    headers.forEach((h, i) => { obj[h] = String(r?.[active[i]] ?? "").trim(); });
    return obj;
  }).filter((r) => Object.values(r).some(Boolean));
  const inferred: Record<string, MappingValue> = {};
  headers.forEach((h, i) => {
    const sample = rows.map((r) => r[h]).filter(Boolean).slice(0, 80);
    inferred[h] = detect(h)
      || (sample.filter(looksEmail).length >= Math.max(1, sample.length * 0.2) ? "email" : null)
      || (sample.filter(looksPhone).length >= Math.max(1, sample.length * 0.25) ? "phone" : null)
      || (sample.filter(looksUrl).length >= Math.max(1, sample.length * 0.35) ? "website" : null)
      || (i <= 2 && sample.filter(looksName).length >= Math.max(2, sample.length * 0.45) ? "company_name" : "__custom__");
  });
  if (!Object.values(inferred).includes("company_name") && headers.length) inferred[headers[0]] = "company_name";
  return { headers, rows, inferred };
}

type Specialty = "secondary" | "off_plan" | "both";
type ActionKey = "separate" | "merge" | "assign_me";

export default function BrokerageExcelImportDialog({ open, onOpenChange, onDone }: { open: boolean; onOpenChange: (v: boolean) => void; onDone?: () => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, MappingValue>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [listName, setListName] = useState("");
  const [filename, setFilename] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [specialty, setSpecialty] = useState<Specialty>("both");
  const [actions, setActions] = useState<Record<ActionKey, boolean>>({ separate: true, merge: false, assign_me: true });
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const merge = actions.merge;
  const reset = () => { setRows([]); setHeaders([]); setMapping({}); setProgress(0); setResult(null); setActions({ separate: true, merge: false, assign_me: true }); setFilename(""); setListName(""); setSourceLabel(""); setSpecialty("both"); };
  const stats = useMemo(() => {
    const nameCol = Object.entries(mapping).find(([, f]) => f === "company_name")?.[0];
    if (!nameCol) return null;
    const set = new Set(rows.map((r) => norm(r[nameCol])).filter(Boolean));
    return { rows: rows.length, unique: set.size, columns: headers.length };
  }, [rows, mapping, headers.length]);

  const handleFile = useCallback(async (file: File) => {
    const XLSX = await import("xlsx");
    const parsed = parseSheet(await file.arrayBuffer(), XLSX);
    if (!parsed.rows.length) { toast.error("Sheet appears empty"); return; }
    setFilename(file.name);
    const base = file.name.replace(/\.(xlsx|xls|csv)$/i, "");
    setListName(base);
    setSourceLabel((prev) => prev || base);
    setHeaders(parsed.headers);
    setRows(parsed.rows);
    setMapping(parsed.inferred);
    setResult(null);
    toast.success(`Loaded ${parsed.rows.length} brokerage rows. Review first, then click Save Database.`);
  }, []);

  const runImport = async () => {
    const nameCol = Object.entries(mapping).find(([, f]) => f === "company_name")?.[0];
    if (!nameCol) { toast.error("Map one column to Brokerage / Agency name"); return; }
    setBusy(true); setProgress(5);
    try {
      const mappedRows = rows.map((r) => {
        const obj: Record<string, any> = {};
        const custom: Record<string, string> = {};
        for (const [h, f] of Object.entries(mapping)) {
          const v = String(r[h] ?? "").trim();
          if (!f || !v) continue;
          if (f === "__custom__") custom[h] = v; else obj[f] = v;
        }
        if (Object.keys(custom).length) obj.custom_fields = custom;
        const dbSpecialty = ({ secondary: "secondary_first", off_plan: "offplan_first", both: "equal" } as const)[specialty];
        obj.specialty_focus = dbSpecialty;
        return obj;
      }).filter((r) => r.company_name);
      const dbSpecialty = ({ secondary: "secondary_first", off_plan: "offplan_first", both: "equal" } as const)[specialty];
      const { data, error } = await supabase.functions.invoke("bulk-import-brokerages", {
        body: { rows: mappedRows, list_name: listName, source_filename: filename, source_label: sourceLabel || listName, merge_to_main: merge, assign_to_me: actions.assign_me, specialty_focus: dbSpecialty },
      });
      if (error) throw error;
      setProgress(100); setResult(data); onDone?.();
      const bits = [actions.separate ? "separate database" : null, merge ? "merged into full list" : null, actions.assign_me ? "assigned to you" : null].filter(Boolean).join(" · ");
      toast.success(`Saved ${data?.total_unique ?? 0} brokerages · ${bits}`);
    } catch (e: any) { toast.error(e.message || "Brokerage import failed"); }
    finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden bg-[#FDFBF7] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#B89555]/20 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]"><FileSpreadsheet className="w-5 h-5 text-[#B89555]" /> Import Brokerage Database</DialogTitle>
          <DialogDescription className="sr-only">Upload a brokerage Excel or CSV database.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!rows.length ? (
            <div onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = Array.from(e.dataTransfer.files).find((x) => /\.(xlsx|xls|csv)$/i.test(x.name)); if (f) handleFile(f); }} className="rounded-xl border-2 border-dashed border-[#B89555]/50 hover:bg-[#F7F2EA] p-14 text-center cursor-pointer">
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#064E3B] text-white"><FolderOpen className="h-7 w-7" /></div>
              <p className="text-base font-semibold text-[#1A1A1A]">Drop or choose a brokerage database</p>
              <p className="mt-1 text-xs text-[#1A1A1A]/70">Review first. Nothing saves until Save Database is clicked.</p>
              <Button type="button" variant="outline" className="mt-4 border-[#B89555]/50 bg-[#FDFBF7] text-[#1A1A1A]"><Upload className="w-4 h-4 mr-1" /> Choose file</Button>
            </div>
          ) : (
            <>
              <div className="rounded-xl bg-gradient-to-br from-[#064E3B] to-[#042c1c] text-white p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Rows" value={stats?.rows ?? 0} /><Stat label="Unique agencies" value={stats?.unique ?? 0} /><Stat label="Columns" value={stats?.columns ?? 0} /><Stat label="Mode" value={merge ? "Merge + separate" : "Separate only"} />
              </div>
              <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA] p-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#1A1A1A]">Database name</label>
                  <Input value={listName} onChange={(e) => setListName(e.target.value)} className="bg-[#FDFBF7] text-[#1A1A1A]" placeholder="e.g. DLD off-plan brokerages · Jul 2026" />
                  <label className="text-xs font-black text-[#1A1A1A] mt-2 block">Source label</label>
                  <Input value={sourceLabel} onChange={(e) => setSourceLabel(e.target.value)} className="bg-[#FDFBF7] text-[#1A1A1A]" placeholder="e.g. DLD, City Developers assignment, LinkedIn scrape" />
                  <p className="text-[10px] text-[#1A1A1A]/60">Shows on every card as the "Source" chip so you can trace where the brokerage came from.</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-black text-[#1A1A1A] mb-1 block">What to do with this database</label>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-sm text-[#1A1A1A]"><Checkbox checked={actions.separate} onCheckedChange={(v) => setActions((a) => ({ ...a, separate: v === true || !a.merge }))} /> Save as a separate database</label>
                      <label className="flex items-center gap-2 text-sm text-[#1A1A1A]"><Checkbox checked={actions.merge} onCheckedChange={(v) => setActions((a) => ({ ...a, merge: v === true }))} /> Also merge into the full brokerage list</label>
                      <label className="flex items-center gap-2 text-sm text-[#1A1A1A]"><Checkbox checked={actions.assign_me} onCheckedChange={(v) => setActions((a) => ({ ...a, assign_me: v === true }))} /> Assign this list to me for follow-up</label>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-[#1A1A1A] mb-1 block">Specialty focus</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(["secondary", "off_plan", "both"] as Specialty[]).map((s) => (
                        <button key={s} type="button" onClick={() => setSpecialty(s)} className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition ${specialty === s ? "bg-[#064E3B] text-white border-[#064E3B]" : "bg-white text-[#1A1A1A] border-[#B89555]/40 hover:bg-[#F7F2EA]"}`}>{s === "off_plan" ? "Off-plan" : s === "both" ? "Secondary + Off-plan" : "Secondary"}</button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#1A1A1A]/60 mt-1">Applied to every brokerage in this database as the default specialty. Individual cards can override.</p>
                  </div>
                  <div className="rounded-md bg-[#FDFBF7] border border-[#B89555]/25 p-2 text-[11px] text-[#1A1A1A] flex items-start gap-2"><GitCompareArrows className="w-3.5 h-3.5 text-[#064E3B] mt-0.5" /><span>{merge ? "Rows will appear in this database AND the total brokerage list." : "Rows stay inside this database only until you merge later."}</span></div>
                </div>
              </div>
              <div className="rounded-lg border border-[#B89555]/30 bg-white p-4">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-3">Column mapping</p>
                <div className="grid md:grid-cols-2 gap-x-4 gap-y-2">
                  {headers.map((h) => (
                    <div key={h} className="grid grid-cols-[minmax(0,1fr)_14px_13rem] items-center gap-2 text-xs">
                      <span className="truncate font-medium text-[#1A1A1A]" title={h}>{h}</span><span className="text-center text-[#1A1A1A]/40">→</span>
                      <Select value={mapping[h] ?? "__ignore__"} onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v === "__ignore__" ? null : v }))}>
                        <SelectTrigger className="h-8 bg-transparent text-[#1A1A1A]"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#FDFBF7] border-[#B89555]/40">
                          <SelectItem value="__custom__">Keep as extra field</SelectItem><SelectItem value="__ignore__">Ignore</SelectItem>
                          {Object.entries(FIELD_LABELS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-[#B89555]/30 bg-white overflow-hidden">
                <div className="px-3 py-2 border-b border-[#B89555]/20 flex items-center justify-between"><p className="text-xs font-semibold text-[#1A1A1A]">Preview — first 120 rows</p><Database className="w-4 h-4 text-[#064E3B]" /></div>
                <div className="max-h-[300px] overflow-auto"><table className="min-w-full text-[11px] text-[#1A1A1A]"><thead className="sticky top-0 bg-[#F7F2EA]"><tr><th className="px-2 py-2 text-left">#</th>{headers.slice(0, 8).map((h) => <th key={h} className="px-2 py-2 text-left min-w-36">{h}</th>)}</tr></thead><tbody>{rows.slice(0, 120).map((r, i) => <tr key={i} className="border-t border-[#B89555]/10"><td className="px-2 py-1">{i + 1}</td>{headers.slice(0, 8).map((h) => <td key={h} className="px-2 py-1 max-w-44 truncate">{r[h]}</td>)}</tr>)}</tbody></table></div>
              </div>
              {busy && <Progress value={progress} className="h-2" />}
              {result && <div className="rounded-lg bg-[#064E3B] text-white p-3 text-xs"><b>{result.total_unique}</b> unique brokerages · <b>{result.created}</b> new · <b>{result.updated}</b> matched · list: <b>{result.list_name}</b>.</div>}
            </>
          )}
        </div>
        {rows.length > 0 && <div className="shrink-0 border-t border-[#B89555]/20 px-6 py-3 bg-[#FDFBF7] flex justify-between gap-2 flex-wrap"><Button variant="outline" onClick={reset} disabled={busy}>Choose another file</Button><Button onClick={runImport} disabled={busy || !stats} className="bg-[#064E3B] hover:bg-[#064E3B]/90" style={{ color: "#FFFFFF" }}>{busy ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving…</> : `Save Database (${stats?.unique ?? 0})`}</Button></div>}
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div><div className="text-[10px] uppercase tracking-[0.15em] text-white/70">{label}</div><div className="text-xl font-semibold text-white">{typeof value === "number" ? value.toLocaleString() : value}</div></div>;
}