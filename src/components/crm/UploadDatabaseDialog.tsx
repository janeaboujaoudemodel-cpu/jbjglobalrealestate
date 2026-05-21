import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type ParsedFile = {
  headers: string[];          // ordered, verbatim (duplicates suffixed)
  rows: Record<string, any>[]; // per-row { header: value }
  rawHeaders: string[];       // original (may contain duplicates) — kept for storage
};

type Stage = "pick" | "parsing" | "choose" | "saving" | "done";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string, mode: "separate" | "merged") => void;
}

const MIME_BY_EXT: Record<string, string> = {
  csv: "text/csv",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((raw, i) => {
    const h = (raw ?? `column_${i + 1}`).toString();
    const count = seen.get(h) || 0;
    seen.set(h, count + 1);
    return count === 0 ? h : `${h} (${count + 1})`;
  });
}

async function parseFile(file: File): Promise<ParsedFile> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "csv") {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: false,
        complete: (res) => {
          const data = res.data as any[][];
          if (!data.length) return reject(new Error("Empty CSV"));
          const rawHeaders = (data[0] || []).map((c: any) => (c ?? "").toString());
          const headers = dedupeHeaders(rawHeaders);
          const rows = data.slice(1).map((arr) => {
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => { obj[h] = arr[i] ?? ""; });
            return obj;
          });
          resolve({ headers, rows, rawHeaders });
        },
        error: reject,
      });
    });
  }
  if (ext === "xlsx" || ext === "xls") {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const arr = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "", raw: false });
    if (!arr.length) throw new Error("Empty sheet");
    const rawHeaders = (arr[0] || []).map((c: any) => (c ?? "").toString());
    const headers = dedupeHeaders(rawHeaders);
    const rows = arr.slice(1).map((row: any[]) => {
      const obj: Record<string, any> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
      return obj;
    });
    return { headers, rows, rawHeaders };
  }
  throw new Error(`Unsupported file type: .${ext}`);
}

export default function UploadDatabaseDialog({ open, onOpenChange, onCreated }: Props) {
  const [stage, setStage] = useState<Stage>("pick");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [dbName, setDbName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStage("pick"); setFile(null); setParsed(null);
    setDbName(""); setNotes(""); setError(null);
  }, []);

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handlePick = async (f: File) => {
    setError(null);
    setFile(f);
    setDbName(f.name.replace(/\.(csv|xlsx|xls)$/i, ""));
    setStage("parsing");
    try {
      const p = await parseFile(f);
      setParsed(p);
      setStage("choose");
    } catch (e: any) {
      setError(e?.message || "Could not parse file");
      setStage("pick");
    }
  };

  type PersistResult = { dbId: string; rowErrors: number; leadsInserted: number; leadsDuplicates: number; leadsErrors: number };
  const persist = async (mode: "separate" | "merged"): Promise<PersistResult | null> => {
    if (!parsed || !file) return null;
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) { toast.error("Sign in required"); return null; }

    // 1. Upload original file to private bucket (path scoped by user folder so RLS passes)
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const storagePath = `${uid}/${Date.now()}_${safeName}`;
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const mime = MIME_BY_EXT[ext] || file.type || "application/octet-stream";
    const upload = await supabase.storage
      .from("crm-source-databases")
      .upload(storagePath, file, { contentType: mime, upsert: false });
    if (upload.error) throw upload.error;

    // 2. Insert source database row
    const insert = await supabase
      .from("crm_source_databases" as any)
      .insert({
        owner_user_id: uid,
        uploaded_by: uid,
        name: dbName.trim() || file.name,
        original_filename: file.name,
        mime_type: mime,
        file_storage_path: storagePath,
        file_size_bytes: file.size,
        row_count: parsed.rows.length,
        column_headers: parsed.headers,
        status: mode === "merged" ? "both" : "separate",
        notes: notes.trim() || null,
      })
      .select("id")
      .single();
    if (insert.error) throw insert.error;
    const dbId = (insert.data as any).id as string;

    // 3. Insert rows in chunks (verbatim). Capture per-chunk failures.
    const CHUNK = 500;
    let rowErrors = 0;
    for (let i = 0; i < parsed.rows.length; i += CHUNK) {
      const chunk = parsed.rows.slice(i, i + CHUNK).map((raw, k) => ({
        source_database_id: dbId,
        row_index: i + k,
        raw,
      }));
      const { error: rowErr } = await supabase
        .from("crm_source_database_rows" as any)
        .insert(chunk);
      if (rowErr) {
        console.error(`[UploadDatabase] chunk ${i}-${i + chunk.length} failed:`, rowErr.message);
        rowErrors += chunk.length;
      }
    }

    let leadsInserted = 0;
    let leadsDuplicates = 0;
    let leadsErrors = 0;

    // 4. If merging, also create crm_leads rows linked to this source.
    if (mode === "merged") {
      const headersLower = parsed.headers.map((h) => h.toLowerCase());
      const idx = (...needles: string[]) => {
        for (const n of needles) {
          const i = headersLower.findIndex((h) => h.includes(n));
          if (i >= 0) return parsed.headers[i];
        }
        return null;
      };
      const nameKey  = idx("full name", "name");
      const emailKey = idx("email");
      const phoneKey = idx("phone", "mobile", "whatsapp");
      const companyKey = idx("company", "organisation", "organization");
      const sourceKey  = idx("source");

      const leadsPayload = parsed.rows
        .map((r, i) => ({
          owner_user_id: uid,
          created_by_user_id: uid,
          full_name: (nameKey ? r[nameKey] : "") || (emailKey ? r[emailKey] : "") || `Row ${i + 1}`,
          email_lower: emailKey ? String(r[emailKey] || "").toLowerCase().trim() || null : null,
          phone_e164: phoneKey ? String(r[phoneKey] || "").trim() || null : null,
          company_name: companyKey ? String(r[companyKey] || "").trim() || null : null,
          source: sourceKey ? String(r[sourceKey] || "").trim() || null : null,
          raw_import: r,
          source_database_id: dbId,
          source_row_index: i,
        }))
        .filter((x) => x.full_name && String(x.full_name).trim().length);

      // Pre-dedup against existing leads by email (owner-scoped).
      const incomingEmails = Array.from(
        new Set(leadsPayload.map((l) => l.email_lower).filter(Boolean) as string[])
      );
      const dupSet = new Set<string>();
      if (incomingEmails.length) {
        for (let i = 0; i < incomingEmails.length; i += 500) {
          const slice = incomingEmails.slice(i, i + 500);
          const { data: dups } = await supabase
            .from("crm_leads")
            .select("email_lower")
            .eq("owner_user_id", uid)
            .in("email_lower", slice);
          for (const d of dups ?? []) if (d.email_lower) dupSet.add(d.email_lower);
        }
      }

      const filtered = leadsPayload.filter((l) => {
        if (l.email_lower && dupSet.has(l.email_lower)) { leadsDuplicates++; return false; }
        return true;
      });

      for (let i = 0; i < filtered.length; i += CHUNK) {
        const chunk = filtered.slice(i, i + CHUNK);
        const { error: leadErr, count } = await supabase
          .from("crm_leads")
          .insert(chunk as any, { count: "exact" });
        if (leadErr) {
          console.error(`[UploadDatabase] lead chunk ${i}-${i + chunk.length} failed:`, leadErr.message);
          leadsErrors += chunk.length;
        } else {
          leadsInserted += count ?? chunk.length;
        }
      }
    }

    return { dbId, rowErrors, leadsInserted, leadsDuplicates, leadsErrors };
  };

  const handleChoice = async (mode: "separate" | "merged") => {
    setStage("saving");
    setError(null);
    try {
      const res = await persist(mode);
      if (res) {
        const parts: string[] = [];
        if (res.leadsInserted) parts.push(`${res.leadsInserted} leads added`);
        if (res.leadsDuplicates) parts.push(`${res.leadsDuplicates} duplicates skipped`);
        if (res.leadsErrors) parts.push(`${res.leadsErrors} lead errors`);
        if (res.rowErrors) parts.push(`${res.rowErrors} row errors`);
        const summary = parts.length ? parts.join(" · ") : "All rows preserved";
        toast.success(mode === "merged" ? `Merged into CRM — ${summary}` : "Saved as separate database", {
          description: mode === "separate" ? summary : undefined,
        });
        onCreated?.(res.dbId, mode);
        setStage("done");
        setTimeout(() => handleClose(false), 1200);
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Upload failed");
      setStage("choose");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#FDFBF7] border-[#B89555]/30 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] font-semibold">Upload Database</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            CSV or Excel. All columns and rows are preserved exactly as uploaded.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50/60 px-3 py-2 text-xs text-red-800">
            {error}
          </div>
        )}

        {stage === "pick" && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handlePick(f);
            }}
            className="border-2 border-dashed border-[#B89555]/40 rounded-xl p-10 text-center cursor-pointer hover:bg-[#F7F2EA]/50 transition"
          >
            <Upload className="h-8 w-8 mx-auto text-[#1A1A1A]/60 mb-2" />
            <div className="text-sm font-medium text-[#1A1A1A]">Drop file or click to choose</div>
            <div className="text-xs text-[#1A1A1A]/60 mt-1">Supports .csv, .xlsx, .xls</div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePick(f); }}
            />
          </div>
        )}

        {stage === "parsing" && (
          <div className="py-10 text-center text-sm text-[#1A1A1A]/70 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#B89555]" />
            Parsing {file?.name}…
          </div>
        )}

        {stage === "choose" && parsed && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#B89555]/30 bg-[#F7F2EA]/60 p-3 flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-[#1A1A1A]/70 mt-0.5" />
              <div className="text-xs text-[#1A1A1A] space-y-0.5 flex-1 min-w-0">
                <div className="font-medium truncate">{file?.name}</div>
                <div className="text-[#1A1A1A]/70">
                  {parsed.rows.length.toLocaleString()} rows · {parsed.headers.length} columns
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-[#1A1A1A]/80">Database name</Label>
              <Input value={dbName} onChange={(e) => setDbName(e.target.value)} className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-[#1A1A1A]/80">Notes (optional)</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]" />
            </div>

            <div className="max-h-32 overflow-auto rounded-md border border-[#B89555]/20 bg-[#FDFBF7] text-[11px] text-[#1A1A1A]/80 p-2">
              <div className="font-medium text-[#1A1A1A] mb-1">Columns (preserved order)</div>
              <div className="flex flex-wrap gap-1">
                {parsed.headers.map((h, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded border border-[#B89555]/30 bg-[#F7F2EA]/60">{h}</span>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button variant="outline" onClick={() => handleClose(false)} className="border-[#B89555]/40 text-[#1A1A1A]">Cancel</Button>
              <Button variant="outline" onClick={() => handleChoice("separate")} className="border-[#B89555]/40 text-[#1A1A1A]">
                Save as Separate Database
              </Button>
              <Button onClick={() => handleChoice("merged")} className="bg-[#EFE6D6] hover:bg-[#E7DCC7] text-[#1A1A1A] border border-[#B89555]">
                Merge with CRM
              </Button>
            </DialogFooter>
          </div>
        )}

        {stage === "saving" && (
          <div className="py-10 text-center text-sm text-[#1A1A1A]/70 flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#B89555]" />
            Saving database…
          </div>
        )}

        {stage === "done" && (
          <div className="py-10 text-center text-sm text-[#1A1A1A] flex flex-col items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            Done
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
