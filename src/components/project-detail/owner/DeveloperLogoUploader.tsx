import { useRef, useState } from "react";
import { Upload, Loader2, Pencil } from "lucide-react";
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
    <div className="relative flex-shrink-0 w-36 h-36">
      <div
        data-keep-gold
        className="jj-cta-gold-metallic jj-developer-logo-metallic w-36 h-36 rounded-2xl flex items-center justify-center overflow-hidden"
      >
        {isValidDeveloperLogoUrl(logoUrl) ? (
          <img src={logoUrl as string} alt={`${developerName} logo`} className="w-full h-full object-contain p-3"  loading="lazy" decoding="async" />
        ) : (
          <span className="text-[#1A1A1A] font-bold text-base text-center px-3 leading-snug w-full">{developerName}</span>
        )}
      </div>


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
            aria-label="Change logo"
            title="Change logo"
            data-no-contrast-guard
            className="absolute -top-3 -right-3 z-10 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#F7F2EA] hover:bg-[#EFE6D6] border border-[#B89555]/50 text-[#1A1A1A] shadow-sm"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
        </>
      )}
    </div>
  );
}

