/**
 * EmailAttachmentsPicker — lets the owner attach one or many extra files to
 * the outbound email (in addition to the envelope's signed PDF). Files are
 * uploaded to the `assistant-files` storage bucket and a public URL is
 * passed to the send edge function, which fetches and base64-encodes the
 * bytes for Resend's `attachments` array.
 */
import { useRef, useState } from "react";
import { Loader2, Paperclip, X, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmailAttachment {
  name: string;
  url: string;
  contentType: string;
  size: number;
}

interface Props {
  value: EmailAttachment[];
  onChange: (next: EmailAttachment[]) => void;
  disabled?: boolean;
}

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB per file (matches edge fetch cap)
const formatSize = (b: number) =>
  b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

export function EmailAttachmentsPicker({ value, onChange, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    setBusy(true);
    const next: EmailAttachment[] = [...value];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || "anonymous";
      for (const f of arr) {
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name} is larger than 15 MB and was skipped`);
          continue;
        }
        const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `email-attachments/${uid}/${Date.now()}-${safe}`;
        const { error } = await supabase.storage
          .from("assistant-files")
          .upload(path, f, { cacheControl: "3600", upsert: false });
        if (error) {
          console.error("attachment upload failed", error);
          toast.error(`Failed to upload ${f.name}`);
          continue;
        }
        const { data: urlData } = supabase.storage.from("assistant-files").getPublicUrl(path);
        next.push({
          name: f.name,
          url: urlData.publicUrl,
          contentType: f.type || "application/octet-stream",
          size: f.size,
        });
      }
      onChange(next);
    } finally {
      setBusy(false);
    }
  };

  const removeAt = (i: number) => {
    const next = value.slice();
    next.splice(i, 1);
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-[#1A1A1A] text-xs flex items-center gap-1.5">
        <Paperclip className="w-3.5 h-3.5" /> Attachments · {value.length}
      </Label>
      <div className="rounded-md border border-dashed border-[#B89555]/40 bg-[#F7F2EA] p-2.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="w-full border-[#B89555]/50 hover:bg-[#EFE6D6] text-[#1A1A1A]"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
          Upload files (PDF, images, docs…)
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) handleFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <p className="text-[10px] text-[#1A1A1A]/60 mt-1.5">
          Up to 15 MB each. The signed PDF is already attached automatically — add anything extra here.
        </p>

        {!!value.length && (
          <ul className="mt-2 space-y-1">
            {value.map((a, i) => (
              <li
                key={`${a.name}-${i}`}
                className="flex items-center gap-2 text-xs text-[#1A1A1A] bg-white border border-[#B89555]/30 rounded px-2 py-1.5"
              >
                <FileText className="w-3.5 h-3.5 shrink-0 text-[#1A1A1A]/60" />
                <span className="truncate flex-1">{a.name}</span>
                <span className="text-[10px] text-[#1A1A1A]/50 shrink-0">{formatSize(a.size)}</span>
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  className="shrink-0 p-0.5 hover:bg-[#EFE6D6] rounded"
                  aria-label={`Remove ${a.name}`}
                >
                  <X className="w-3.5 h-3.5 text-[#1A1A1A]/60" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
