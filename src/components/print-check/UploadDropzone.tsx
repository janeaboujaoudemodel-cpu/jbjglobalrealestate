import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  files: File[];
  onFiles: (f: File[]) => void;
  disabled?: boolean;
}

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 50;

// Allow webkitdirectory attribute on HTMLInputElement
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface InputHTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}

export default function UploadDropzone({ files, onFiles, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dirInputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback((incoming: FileList | File[] | null) => {
    setError(null);
    if (!incoming) return;
    const arr = Array.from(incoming);
    const pdfs = arr.filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (pdfs.length === 0) {
      setError("No PDF files found.");
      return;
    }
    const oversized = pdfs.find((f) => f.size > MAX_BYTES);
    if (oversized) {
      setError(`"${oversized.name}" exceeds 25 MB.`);
      return;
    }
    const merged = [...files];
    for (const f of pdfs) {
      if (!merged.find((m) => m.name === f.name && m.size === f.size)) merged.push(f);
    }
    if (merged.length > MAX_FILES) {
      setError(`Too many PDFs (max ${MAX_FILES}).`);
      return;
    }
    onFiles(merged);
  }, [files, onFiles]);

  const removeAt = (i: number) => {
    const next = files.slice();
    next.splice(i, 1);
    onFiles(next);
  };

  const totalMB = files.reduce((s, f) => s + f.size, 0) / 1024 / 1024;

  return (
    <div className="space-y-2">
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={(e) => {
          e.preventDefault(); setHover(false);
          if (disabled) return;
          // Walk DataTransferItemList for folders
          const items = e.dataTransfer.items;
          if (items && Array.from(items).some((i) => i.webkitGetAsEntry?.()?.isDirectory)) {
            collectFromItems(items).then(accept);
          } else {
            accept(e.dataTransfer.files);
          }
        }}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          hover ? "border-primary bg-muted/40" : "border-border hover:border-foreground/30",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          ref={fileInputRef} type="file" accept="application/pdf" multiple
          className="hidden"
          onChange={(e) => accept(e.target.files)}
        />
        <input
          ref={dirInputRef} type="file" multiple
          webkitdirectory="" directory=""
          className="hidden"
          onChange={(e) => accept(e.target.files)}
        />
        {files.length > 0 ? (
          <div className="text-sm">
            <div className="font-medium text-foreground">
              {files.length} PDF{files.length === 1 ? "" : "s"} selected
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {totalMB.toFixed(2)} MB total · click to add more
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-6 w-6" />
            <div>
              <span className="font-medium text-foreground">Click to browse</span> or drag PDFs / a folder here
            </div>
            <div className="text-xs">PDF · max 25 MB each · up to {MAX_FILES} files</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button" variant="outline" size="sm"
          disabled={disabled}
          onClick={() => dirInputRef.current?.click()}
        >
          <Folder className="h-4 w-4 mr-2" /> Select folder
        </Button>
        {files.length > 0 && (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onFiles([])}>
            Clear all
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <ul className="rounded-lg border divide-y max-h-48 overflow-y-auto">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{f.name}</span>
                <span className="text-muted-foreground shrink-0">
                  ({(f.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <button
                type="button" disabled={disabled}
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

async function collectFromItems(items: DataTransferItemList): Promise<File[]> {
  const out: File[] = [];
  const walks: Promise<void>[] = [];
  for (const it of Array.from(items)) {
    const entry = it.webkitGetAsEntry?.();
    if (entry) walks.push(walkEntry(entry, out));
    else {
      const f = it.getAsFile();
      if (f) out.push(f);
    }
  }
  await Promise.all(walks);
  return out;
}

async function walkEntry(entry: any, out: File[]): Promise<void> {
  if (entry.isFile) {
    await new Promise<void>((res) => entry.file((f: File) => { out.push(f); res(); }, () => res()));
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    const readBatch = (): Promise<any[]> =>
      new Promise((res) => reader.readEntries((entries: any[]) => res(entries), () => res([])));
    let batch = await readBatch();
    while (batch.length > 0) {
      for (const e of batch) await walkEntry(e, out);
      batch = await readBatch();
    }
  }
}
