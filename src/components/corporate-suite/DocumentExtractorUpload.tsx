import { useState, useCallback, useRef } from "react";
import { ScanLine, Upload, X, Loader2, CheckCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  extractionType: "business_card" | "cv" | "cover_letter" | "company_profile";
  onExtracted: (data: Record<string, unknown>) => void;
  label?: string;
  hint?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function countFilledFields(data: Record<string, unknown>): number {
  let count = 0;
  const walk = (obj: unknown) => {
    if (typeof obj === "string") { if (obj.trim()) count++; }
    else if (Array.isArray(obj)) { obj.forEach(walk); }
    else if (obj && typeof obj === "object") { Object.values(obj).forEach(walk); }
  };
  walk(data);
  return count;
}

export function DocumentExtractorUpload({ extractionType, onExtracted, label, hint }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filledCount, setFilledCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const panelLabel = label ?? "Scan Existing Document";
  const panelHint  = hint  ?? "Upload a photo or PDF to pre-fill all fields with AI";

  const handleFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large — please keep it under 10 MB.");
      return;
    }
    setFile(f);
    setFilledCount(null);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFile(e.target.files[0]);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  const extract = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // strip the data URL prefix → keep only the base64 portion
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("document-extractor", {
        body: {
          file_base64: base64,
          file_type: file.type,
          extraction_type: extractionType,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const extracted: Record<string, unknown> = data?.data ?? {};
      const count = countFilledFields(extracted);
      setFilledCount(count);
      onExtracted(extracted);
      toast.success(`${count} field${count !== 1 ? "s" : ""} pre-filled from uploaded document!`);
    } catch (err) {
      console.error("Extraction failed:", err);
      toast.error("Extraction failed — please try a clearer image or PDF.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setFile(null);
    setFilledCount(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden transition-colors duration-200 hover:border-[hsl(var(--gold))]">
        {/* Header trigger */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 group">
            <div className="flex items-center gap-2">
              <ScanLine size={14} className="text-[hsl(var(--gold))]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">
                {panelLabel}
              </span>
              {filledCount !== null && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))] border-[hsl(var(--gold)/0.3)]">
                  {filledCount} filled
                </Badge>
              )}
            </div>
            <ChevronDown
              size={14}
              className={cn(
                "text-[hsl(var(--muted-foreground))] transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-3 pt-3">
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] leading-relaxed">{panelHint}</p>

            {/* Drop zone */}
            {!file ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-colors duration-150",
                  dragging
                    ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]"
                    : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.5)] hover:bg-[hsl(var(--muted)/0.4)]"
                )}
              >
                <Upload size={20} className="text-[hsl(var(--muted-foreground))]" />
                <p className="text-[11px] text-[hsl(var(--muted-foreground))] text-center leading-relaxed">
                  Drop a photo or PDF here<br />
                  <span className="text-[hsl(var(--gold))] font-medium">or click to browse</span>
                </p>
                <p className="text-[9px] text-[hsl(var(--muted-foreground)/0.6)]">JPG, PNG, WEBP, PDF — max 10 MB</p>
              </div>
            ) : (
              /* File preview */
              <div className="flex items-center gap-2 bg-[hsl(var(--muted)/0.4)] rounded-xl px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[hsl(var(--foreground))] truncate">{file.name}</p>
                  <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{formatBytes(file.size)}</p>
                </div>
                {filledCount !== null && (
                  <CheckCircle size={14} className="text-green-500 shrink-0" />
                )}
                <button
                  onClick={clear}
                  className="shrink-0 p-1 rounded-full hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors"
                  title="Remove file"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={onInputChange}
            />

            {/* Extract button */}
            {file && filledCount === null && (
              <Button
                onClick={extract}
                disabled={loading}
                size="sm"
                className="w-full h-8 text-[11px] bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.85)] text-black font-semibold gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Extracting fields with Gemini Vision…
                  </>
                ) : (
                  <>
                    <ScanLine size={12} />
                    Extract with AI
                  </>
                )}
              </Button>
            )}

            {/* Re-upload after success */}
            {filledCount !== null && (
              <Button
                onClick={clear}
                variant="outline"
                size="sm"
                className="w-full h-8 text-[11px]"
              >
                <Upload size={11} className="mr-1" />
                Upload different document
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
