import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCanEdit } from "@/hooks/useEffectiveOwner";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";

interface Props {
  developerId: string;
  developerName: string;
  logoUrl?: string | null;
}

const BUCKET = "project-images"; // existing public bucket

export default function DeveloperLogoUploader({ developerId, developerName, logoUrl }: Props) {
  const canEdit = useCanEdit("developer_info");
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    setBusy(true);
    try {
      const path = `developer-logos/${developerId}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || "image/png" });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const { error: updErr } = await (supabase as any).from("developers").update({ logo_url: pub.publicUrl }).eq("id", developerId);
      if (updErr) throw updErr;
      toast.success("Logo updated");
      qc.invalidateQueries({ queryKey: ["project"] });
      qc.invalidateQueries({ queryKey: ["developer"] });
      qc.invalidateQueries({ queryKey: ["developers"] });
    } catch (e: any) {
      toast.error(e?.message || "Logo upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div
      className="jj-emerald-metallic w-36 h-36 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 relative group"
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(4,44,28,0.45), inset 0 1px 2px rgba(255,255,255,0.08)'
      }}
    >
      {isValidDeveloperLogoUrl(logoUrl) ? (
        <div className="w-[88%] h-[88%] rounded-lg bg-white flex items-center justify-center overflow-hidden">
          <img src={logoUrl as string} alt={`${developerName} logo`} className="w-full h-full object-contain p-2" />
        </div>
      ) : (
        <span className="text-white font-bold text-base text-center px-2">{developerName}</span>
      )}

      {canEdit && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-xs font-semibold"
            title="Change logo"
            data-no-contrast-guard
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
            <span>{busy ? "Uploading…" : "Change logo"}</span>
          </button>
        </>
      )}
    </div>
  );
}
