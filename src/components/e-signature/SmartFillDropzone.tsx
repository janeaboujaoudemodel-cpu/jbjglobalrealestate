import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, FileText, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Props = {
  schemaHint: "jbj_paa_leasing"; // extend later
  onExtracted: (fields: Record<string, string>, meta: { sourceDocType?: string; confidence?: Record<string, number> }) => void;
  className?: string;
};

type FileStatus = {
  name: string;
  state: "queued" | "extracting" | "done" | "error";
  message?: string;
};

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function SmartFillDropzone({ schemaHint, onExtracted, className }: Props) {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [isOver, setIsOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const arr = Array.from(incoming).filter(
        (f) =>
          f.type.startsWith("image/") ||
          f.type === "application/pdf" ||
          /\.(jpe?g|png|webp|heic|pdf)$/i.test(f.name),
      );
      if (!arr.length) {
        toast.error("Please drop images (JPG/PNG/WEBP/HEIC) or a PDF");
        return;
      }

      setBusy(true);
      setFiles((prev) => [...prev, ...arr.map((f) => ({ name: f.name, state: "queued" as const }))]);

      const merged: Record<string, string> = {};
      const mergedConfidence: Record<string, number> = {};
      let lastSourceType: string | undefined;

      for (const f of arr) {
        setFiles((prev) =>
          prev.map((p) => (p.name === f.name && p.state === "queued" ? { ...p, state: "extracting" as const } : p)),
        );
        try {
          const base64 = await fileToBase64(f);
          const { data, error } = await supabase.functions.invoke("document-extractor", {
            body: {
              file_base64: base64,
              file_type: f.type || "image/jpeg",
              extraction_type: "jbj_paa_leasing",
              schema_hint: schemaHint,
            },
          });
          if (error) throw error;
          const payload = (data as any)?.data || {};
          const fields = (payload.fields || {}) as Record<string, string>;
          const conf = (payload.confidence || {}) as Record<string, number>;
          lastSourceType = payload.source_doc_type || lastSourceType;
          // Merge: prefer non-empty values; later files overwrite only if new value is non-empty
          for (const [k, v] of Object.entries(fields)) {
            if (v && String(v).trim()) merged[k] = String(v).trim();
          }
          for (const [k, v] of Object.entries(conf)) {
            mergedConfidence[k] = Math.max(mergedConfidence[k] || 0, Number(v) || 0);
          }
          setFiles((prev) =>
            prev.map((p) =>
              p.name === f.name ? { ...p, state: "done" as const, message: payload.source_doc_type } : p,
            ),
          );
        } catch (err: any) {
          console.error("Smart-fill extraction failed:", err);
          setFiles((prev) =>
            prev.map((p) =>
              p.name === f.name ? { ...p, state: "error" as const, message: err?.message || "Failed" } : p,
            ),
          );
        }
      }

      setBusy(false);

      const filledKeys = Object.keys(merged);
      if (filledKeys.length) {
        onExtracted(merged, { sourceDocType: lastSourceType, confidence: mergedConfidence });
        toast.success(`AI filled ${filledKeys.length} field${filledKeys.length === 1 ? "" : "s"}`);
      } else {
        toast.message("Nothing to extract", { description: "AI couldn't read any fields from those files." });
      }
    },
    [schemaHint, onExtracted],
  );

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={[
          "cursor-pointer rounded-lg border border-dashed p-4 transition-colors",
          isOver ? "border-[#B89555] bg-[#EFE6D6]" : "border-[#B89555]/40 bg-[#F7F2EA] hover:border-[#B89555]",
        ].join(" ")}
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-white border border-[#B89555]/40 flex items-center justify-center shrink-0">
            {busy ? <Loader2 className="w-4 h-4 animate-spin text-[#1A1A1A]" /> : <Sparkles className="w-4 h-4 text-[#1A1A1A]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[#1A1A1A]">AI Smart-Fill</div>
            <div className="text-xs text-[#1A1A1A]/70 mt-0.5">
              Drop a Passport, Emirates ID, Title Deed, Ejari, MOU, brochure, floor plan or unit photo. AI reads them and pre-fills the agreement.
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Upload className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
              <span className="text-[11px] uppercase tracking-[0.16em] text-[#1A1A1A]/60">
                Click or drop · multiple files OK
              </span>
            </div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
      </div>

      {!!files.length && (
        <ul className="mt-3 space-y-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs text-[#1A1A1A]/80">
              <FileText className="w-3.5 h-3.5 shrink-0 text-[#1A1A1A]/50" />
              <span className="truncate flex-1">{f.name}</span>
              {f.state === "extracting" && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1A1A1A]/60" />}
              {f.state === "done" && (
                <span className="flex items-center gap-1 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {f.message || "extracted"}
                </span>
              )}
              {f.state === "error" && (
                <span className="flex items-center gap-1 text-red-700">
                  <XCircle className="w-3.5 h-3.5" />
                  {f.message || "failed"}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SmartFillDropzone;
