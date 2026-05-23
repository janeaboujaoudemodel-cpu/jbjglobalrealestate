/**
 * PremiumFileDrop — branded file upload card with drag-and-drop, dashed gold border,
 * document iconography, and inline file preview.
 */
import { useRef, useState } from "react";
import { FileText, UploadCloud, X, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  file: File | null;
  onChange: (f: File | null) => void;
  accept?: string;
  maxBytes?: number;
  label?: string;
  hint?: string;
}

export function PremiumFileDrop({
  file,
  onChange,
  accept = ".pdf,.doc,.docx,.png,.jpg,.jpeg",
  maxBytes = 10 * 1024 * 1024,
  label = "Attach company profile or proposal",
  hint = "PDF, DOC, JPG, PNG · up to 10 MB",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const accept_validate = (f: File): boolean => {
    setErr(null);
    if (f.size > maxBytes) {
      setErr(`File is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).`);
      return false;
    }
    return true;
  };

  const onPick = (f: File | null) => {
    if (!f) { onChange(null); return; }
    if (accept_validate(f)) onChange(f);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/40">
        <div className="w-10 h-10 rounded-lg bg-[#EFE6D6] flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#B89555]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#B89555]" />
            <p className="text-sm font-medium text-[#1A1A1A] truncate">{file.name}</p>
          </div>
          <p className="text-[11px] text-[#1A1A1A]/60">{(file.size / 1024).toFixed(0)} KB · ready to upload</p>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="p-2 text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault(); setDrag(false);
          onPick(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "w-full px-6 py-7 rounded-xl border-2 border-dashed transition text-left flex items-center gap-4",
          drag
            ? "border-[#B89555] bg-[#EFE6D6]"
            : "border-[#B89555]/40 bg-[#FDFBF7] hover:border-[#B89555]/70 hover:bg-[#F7F2EA]",
        )}
      >
        <div className="w-12 h-12 rounded-xl bg-[#EFE6D6] flex items-center justify-center shrink-0">
          <UploadCloud className="w-6 h-6 text-[#B89555]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
          <p className="text-[11px] text-[#1A1A1A]/60 mt-0.5">{hint}</p>
        </div>
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#B89555] hidden sm:inline">
          Browse
        </span>
      </button>
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </>
  );
}
