import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useFounderPhoto } from "@/hooks/useFounderPhoto";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

/**
 * Owner-only overlay that floats on top of the founder portrait, letting the
 * owner click "Edit photo" any time to upload a replacement. Hidden for the
 * public visitor.
 */
export function FounderPhotoEditOverlay() {
  const { isOwner } = useUserRole();
  const { uploadAndSet, clear, isSaving, photoUrl } = useFounderPhoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!isOwner) return null;

  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      await uploadAndSet(file);
      toast.success("Founder photo updated");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Could not update founder photo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const working = busy || isSaving;

  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handlePick}
        disabled={working}
        data-cta="champagne"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FDFBF7] border border-[#B89555]/60 text-[#1A1A1A] text-xs font-medium shadow-sm hover:bg-[#EFE6D6] transition-colors disabled:opacity-60"
        aria-label="Edit founder photo"
      >
        {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        {working ? "Uploading…" : "Edit photo"}
      </button>
      {photoUrl ? (
        <button
          type="button"
          onClick={async () => {
            try {
              await clear();
              toast.success("Reverted to default photo");
            } catch (e: any) {
              toast.error(e?.message || "Could not revert");
            }
          }}
          disabled={working}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FDFBF7]/90 border border-[#B89555]/40 text-[#1A1A1A]/80 text-[10px] font-medium hover:bg-[#EFE6D6]"
        >
          <Trash2 className="w-3 h-3" />
          Use default
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

export default FounderPhotoEditOverlay;
