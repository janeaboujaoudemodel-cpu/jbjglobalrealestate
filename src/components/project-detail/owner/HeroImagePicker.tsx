import { useCallback, useState } from "react";
import { ImageIcon, Loader2, Star, User, Upload, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCanEdit } from "@/hooks/useEffectiveOwner";

interface ImageRow {
  id: string;
  image_url: string;
  display_order?: number | null;
  alt_text?: string | null;
}

interface Props {
  projectId: string;
  coverImageUrl?: string | null;
  cardImageUrl?: string | null;
}

const BUCKET = "project-images";

export default function HeroImagePicker({ projectId, coverImageUrl, cardImageUrl }: Props) {
  const canEdit = useCanEdit("project_photos");
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ["owner-project-images", projectId],
    enabled: !!projectId && canEdit && open,
    queryFn: async (): Promise<ImageRow[]> => {
      const { data, error } = await supabase
        .from("project_images")
        .select("id, image_url, display_order, alt_text")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["owner-project-images", projectId] });
    qc.invalidateQueries({ queryKey: ["project"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["nearby-projects"] });
  };

  const setAsCover = async (img: ImageRow) => {
    setBusy(true);
    const { error } = await supabase
      .from("projects")
      .update({ cover_image_url: img.image_url } as any)
      .eq("id", projectId);
    if (!error) {
      // bump to first in carousel
      await supabase
        .from("project_images")
        .update({ display_order: 0 } as any)
        .eq("id", img.id);
      toast.success("Cover photo updated");
      refresh();
    } else {
      toast.error(error.message);
    }
    setBusy(false);
  };

  const setAsProfile = async (img: ImageRow) => {
    setBusy(true);
    const { error } = await supabase
      .from("projects")
      .update({ card_image_url: img.image_url } as any)
      .eq("id", projectId);
    if (!error) {
      toast.success("Profile photo updated");
      refresh();
    } else {
      toast.error(error.message);
    }
    setBusy(false);
  };

  const upload = useCallback(async (files: FileList | File[]) => {
    if (!files || (files as FileList).length === 0) return;
    setBusy(true);
    let ok = 0, fail = 0;
    const nextOrder = images?.length ?? 0;
    let i = 0;
    for (const file of Array.from(files)) {
      try {
        const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "image/jpeg" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const { error: insErr } = await supabase.from("project_images").insert({
          project_id: projectId,
          image_url: pub.publicUrl,
          display_order: nextOrder + i,
          alt_text: file.name,
        } as any);
        if (insErr) throw insErr;
        ok++;
      } catch (e) {
        console.error(e);
        fail++;
      }
      i++;
    }
    if (ok) toast.success(`Uploaded ${ok} photo${ok > 1 ? "s" : ""}${fail ? ` · ${fail} failed` : ""}`);
    if (!ok && fail) toast.error("Upload failed");
    setBusy(false);
    refresh();
  }, [projectId, images?.length]);

  if (!canEdit) return null;

  return (
    <>
      {/* Trigger pill — absolute inside the hero section so it scrolls with
          the hero and never overlaps the fixed header (88px) or sidebar (88px). */}
      <div className="absolute top-4 right-4 z-20" data-owner-pencil>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 bg-[#F7F2EA]/95 text-[#1A1A1A] px-3 py-1.5 rounded-md text-[11px] font-semibold uppercase tracking-[0.2em] shadow-lg border border-[#B89555]/60 backdrop-blur-sm hover:bg-[#EFE6D6] transition-colors"
          data-no-contrast-guard
          title="Edit hero / profile photo"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Edit hero
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#FDFBF7] rounded-2xl border border-[#B89555]/40 shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#B89555]/30 bg-[#F7F2EA]">
              <div>
                <h3 className="text-base font-semibold text-[#1A1A1A]">Select hero image</h3>
                <p className="text-xs text-[#1A1A1A]/70 mt-0.5">
                  Choose any gallery photo. <strong>Use as Cover</strong> sets the hero image · <strong>Use as Profile</strong> sets the listing-card thumbnail.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-md inline-flex items-center justify-center text-[#1A1A1A] hover:bg-[#EFE6D6] border border-[#B89555]/40"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Upload */}
            <div className="px-6 py-3 border-b border-[#B89555]/20 bg-[#FDFBF7]">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[#B89555]/50 bg-[#F7F2EA] text-[#1A1A1A] text-xs font-semibold cursor-pointer hover:bg-[#EFE6D6] transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files && upload(e.target.files)}
                  disabled={busy}
                />
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {busy ? "Uploading…" : "Upload new photo"}
              </label>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-16 text-[#1A1A1A]/60">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-16 text-[#1A1A1A]/70 text-sm">
                  No photos yet. Upload one to get started.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img) => {
                    const isCover = coverImageUrl === img.image_url;
                    const isProfile = cardImageUrl === img.image_url;
                    return (
                      <div
                        key={img.id}
                        className="relative group rounded-lg overflow-hidden border border-[#B89555]/30 bg-[#F7F2EA] aspect-square"
                      >
                        <img
                          src={img.image_url}
                          alt={img.alt_text ?? ""}
                          className="w-full h-full object-cover"
                          loading="lazy"
                         decoding="async" />

                        {/* Active badges */}
                        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
                          {isCover && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]">
                              <Check className="w-2.5 h-2.5" /> Cover
                            </span>
                          )}
                          {isProfile && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]">
                              <Check className="w-2.5 h-2.5" /> Profile
                            </span>
                          )}
                        </div>

                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <button
                            onClick={() => setAsCover(img)}
                            disabled={busy || isCover}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-[#F7F2EA] text-[#1A1A1A] text-[11px] font-semibold border border-[#B89555] hover:bg-[#EFE6D6] disabled:opacity-50 disabled:cursor-not-allowed"
                            data-no-contrast-guard
                          >
                            <Star className="w-3 h-3" />
                            {isCover ? "Current cover" : "Use as Cover"}
                          </button>
                          <button
                            onClick={() => setAsProfile(img)}
                            disabled={busy || isProfile}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-[#F7F2EA] text-[#1A1A1A] text-[11px] font-semibold border border-[#B89555] hover:bg-[#EFE6D6] disabled:opacity-50 disabled:cursor-not-allowed"
                            data-no-contrast-guard
                          >
                            <User className="w-3 h-3" />
                            {isProfile ? "Current profile" : "Use as Profile"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-6 py-3 border-t border-[#B89555]/20 bg-[#F7F2EA] text-[11px] text-[#1A1A1A]/70">
              <strong>Cover</strong> = the big hero on this project page · <strong>Profile</strong> = the thumbnail shown on listing cards across the site.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
