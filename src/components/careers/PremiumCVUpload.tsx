import { useCallback, useState } from "react";
import { Upload, FileText, X, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumCVUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
  uploadProgress?: number;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPT =
  ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.heic,.heif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

export function PremiumCVUpload({
  file,
  onFileChange,
  disabled,
  uploadProgress = 0,
}: PremiumCVUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;
      const f = e.dataTransfer.files?.[0];
      if (f) onFileChange(f);
    },
    [disabled, onFileChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="jbj-form-label text-sm font-semibold">CV / Resume</label>
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0A0A0A]/80">
          <ShieldCheck className="h-3.5 w-3.5" /> Encrypted upload
        </span>
      </div>

      {file ? (
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#B89555] bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-5 shadow-[0_8px_24px_-12px_rgba(184,149,85,0.3)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl jj-surface-emerald/15 blur-lg" />
              <div className="relative grid h-14 w-14 place-items-center rounded-xl bg-[#FDFBF7] border-2 border-[color:var(--emerald-1)]/30">
                <FileText className="h-7 w-7 text-[#1A1A1A]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-[#1A1A1A]">{file.name}</p>
                <CheckCircle2 className="h-4 w-4 text-[#1A1A1A] shrink-0" />
              </div>
              <div className="mt-1 flex items-center gap-3 text-xs text-[#1A1A1A]/70">
                <span>{formatSize(file.size)}</span>
                <span className="h-1 w-1 rounded-full bg-[#1A1A1A]/40" />
                <span className="flex items-center gap-1 font-semibold text-[#0A0A0A]">
                  <Sparkles className="h-3 w-3" /> Ready for Jessica review
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onFileChange(null)}
              disabled={disabled}
              className="grid h-9 w-9 place-items-center rounded-full border border-[#B89555]/55 text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-[#FDFBF7] hover:border-[#B89555] transition disabled:opacity-50"
              aria-label="Remove CV"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[#0A0A0A]/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0A0A0A] via-[#1F1F1F] to-[#0A0A0A] transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "group relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all",
            dragOver
              ? "border-[#B89555] bg-[#B89555]/5 scale-[1.01]"
              : "border-[#B89555]/55 bg-[#FDFBF7] hover:border-[#B89555] hover:bg-[#F7F2EA]/60",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          {/* Decorative glow */}
          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute -top-12 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-[#0A0A0A]/8 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-[#0A0A0A]/10 blur-lg group-hover:bg-[#0A0A0A]/20 transition" />
              <div className="relative grid h-16 w-16 place-items-center rounded-2xl border-2 border-[#B89555] bg-[#FDFBF7]">
                <Upload className="h-7 w-7 text-[#0A0A0A]" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-[#0A0A0A]">
                {dragOver ? "Drop your CV here" : "Click to upload or drag & drop"}
              </p>
              <p className="text-xs font-semibold text-[#0A0A0A]/75">
                PDF · Word · JPG / PNG / HEIC — max 10 MB
              </p>
            </div>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/70">
              <span className="rounded-full border border-[#B89555]/45 bg-[#FDFBF7] px-2.5 py-0.5">
                CV review ready
              </span>
              <span className="rounded-full border border-[#B89555]/45 bg-[#FDFBF7] px-2.5 py-0.5">
                Auto-fill enabled
              </span>
              <span className="rounded-full border border-[#B89555]/45 bg-[#FDFBF7] px-2.5 py-0.5">
                Confidential
              </span>
            </div>
          </div>

          <input
            type="file"
            accept={ACCEPT}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileChange(f);
            }}
            className="hidden"
            disabled={disabled}
          />
        </label>
      )}
    </div>
  );
}

export default PremiumCVUpload;
