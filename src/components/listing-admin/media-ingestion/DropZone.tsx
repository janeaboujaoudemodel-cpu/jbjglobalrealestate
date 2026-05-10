import { useCallback, useRef, useState } from "react";
import { Upload, Link2, FileText, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DropZoneProps {
  onFiles: (files: File[]) => Promise<void> | void;
  onLinks: (urls: string[]) => Promise<void> | void;
  busy?: boolean;
}

export function DropZone({ onFiles, onLinks, busy }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkText, setLinkText] = useState("");

  const handleFiles = useCallback(
    (list: FileList | File[]) => {
      const arr = Array.from(list);
      if (arr.length) onFiles(arr);
    },
    [onFiles],
  );

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-colors bg-[#F7F2EA] ${
          dragOver ? "border-[#B89555] bg-[#EFE6D6]" : "border-[#B89555]/40"
        }`}
      >
        <div className="flex justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-[#EFE6D6] ring-1 ring-[#B89555] flex items-center justify-center text-[#1A1A1A]">
            <Upload className="w-5 h-5" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EFE6D6] ring-1 ring-[#B89555] flex items-center justify-center text-[#1A1A1A]">
            <FileText className="w-5 h-5" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#EFE6D6] ring-1 ring-[#B89555] flex items-center justify-center text-[#1A1A1A]">
            <Video className="w-5 h-5" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Drop videos, PDFs, brochures, decks — or pick from your computer
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Mix any number of files. AI auto-detects the developer & project for each one.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept="video/*,application/pdf,image/*,.ppt,.pptx,.doc,.docx"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Button
          variant="gold"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload className="w-4 h-4 mr-2" /> Choose files
        </Button>
      </div>

      <div className="rounded-xl border border-[#B89555]/30 bg-[#F7F2EA] p-4">
        <div className="flex items-center gap-2 mb-2 text-sm font-medium text-foreground">
          <Link2 className="w-4 h-4 text-[#1A1A1A]" />
          Or paste links (Drive, Dropbox, YouTube, developer portals — one per line)
        </div>
        <textarea
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
          rows={3}
          placeholder="https://drive.google.com/...&#10;https://youtube.com/..."
          className="w-full rounded-lg border border-[#B89555]/30 bg-white p-2 text-sm text-foreground"
        />
        <div className="flex justify-end mt-2">
          <Button
            variant="gold"
            size="sm"
            disabled={busy || !linkText.trim()}
            onClick={() => {
              const urls = linkText
                .split("\n")
                .map((s) => s.trim())
                .filter((s) => /^https?:\/\//i.test(s));
              if (urls.length) {
                onLinks(urls);
                setLinkText("");
              }
            }}
          >
            Queue links
          </Button>
        </div>
      </div>
    </div>
  );
}
