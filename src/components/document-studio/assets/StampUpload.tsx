/**
 * StampUpload — single file picker for an official stamp (PNG/JPG).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onCapture: (file: File, label: string) => Promise<void> | void;
  onCancel?: () => void;
}

export default function StampUpload({ onCapture, onCancel }: Props) {
  const [label, setLabel] = useState("Company stamp");
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg)/i.test(file.type)) { toast.error("PNG or JPG only"); return; }
    setBusy(true);
    try { await onCapture(file, label || file.name); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/65">Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} className="bg-[#FDFBF7] mt-1" />
      </div>
      <label className="block rounded-md border border-dashed border-[#B89555]/40 bg-[#F7F2EA] hover:bg-[#EFE6D6] px-6 py-8 text-center cursor-pointer">
        {busy ? (
          <Loader2 className="w-5 h-5 mx-auto animate-spin text-[#1A1A1A]/70" />
        ) : (
          <Upload className="w-5 h-5 mx-auto text-[#1A1A1A]/70" />
        )}
        <div className="text-[12px] mt-2 text-[#1A1A1A]">Click to upload stamp image</div>
        <div className="text-[11px] text-[#1A1A1A]/60">Transparent PNG works best</div>
        <input type="file" accept="image/png,image/jpeg" className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {onCancel && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel}>Close</Button>
        </div>
      )}
    </div>
  );
}
