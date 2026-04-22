import { useCallback, useRef, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
  disabled?: boolean;
}

const MAX_BYTES = 25 * 1024 * 1024;

export default function UploadDropzone({ file, onFile, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback((f: File | null) => {
    setError(null);
    if (!f) { onFile(null); return; }
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("File must be a PDF.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File exceeds 25 MB.");
      return;
    }
    onFile(f);
  }, [onFile]);

  return (
    <div className="space-y-2">
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault(); setHover(false);
          if (disabled) return;
          accept(e.dataTransfer.files?.[0] ?? null);
        }}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          hover ? "border-primary bg-muted/40" : "border-border hover:border-foreground/30",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => accept(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex items-center justify-center gap-3 text-sm">
            <FileText className="h-5 w-5" />
            <span className="font-medium">{file.name}</span>
            <span className="text-muted-foreground">
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-6 w-6" />
            <div><span className="font-medium text-foreground">Click to browse</span> or drag a Canva PDF here</div>
            <div className="text-xs">PDF · max 25 MB</div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
