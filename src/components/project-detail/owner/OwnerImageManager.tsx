import { useCallback, useEffect, useState } from "react";
import { Upload, Loader2, Trash2, Star, StarOff, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
}

const BUCKET = "project-images";

export default function OwnerImageManager({ projectId, coverImageUrl }: Props) {
  const canEdit = useCanEdit("project_photos");
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [order, setOrder] = useState<ImageRow[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);

  const { data: images = [] } = useQuery({
    queryKey: ["owner-project-images", projectId],
    enabled: !!projectId && canEdit,
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

  useEffect(() => { setOrder(images); }, [images]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["owner-project-images", projectId] });
    qc.invalidateQueries({ queryKey: ["project"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const upload = useCallback(async (files: FileList | File[]) => {
    if (!files || (files as FileList).length === 0) return;
    setBusy(true);
    let ok = 0, fail = 0;
    const nextOrder = (images?.length ?? 0);
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

  const remove = async (img: ImageRow) => {
    if (!confirm("Delete this photo?")) return;
    const { error } = await supabase.from("project_images").delete().eq("id", img.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  const setCover = async (img: ImageRow) => {
    const { error: e1 } = await supabase.from("projects").update({ cover_image_url: img.image_url }).eq("id", projectId);
    if (e1) return toast.error(e1.message);
    toast.success("Cover photo updated");
    refresh();
  };

  const persistOrder = async (rows: ImageRow[]) => {
    setOrder(rows);
    // Update display_order in DB (one row at a time to keep it simple)
    const updates = rows.map((r, idx) =>
      supabase.from("project_images").update({ display_order: idx } as any).eq("id", r.id)
    );
    const results = await Promise.all(updates);
    const firstErr = results.find((r: any) => r.error);
    if (firstErr?.error) toast.error("Order save failed");
    else toast.success("Order saved");
    refresh();
  };

  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = order.findIndex((x) => x.id === dragId);
    const to = order.findIndex((x) => x.id === targetId);
    if (from < 0 || to < 0) return;
    const next = order.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    persistOrder(next);
  };

  if (!canEdit) return null;

  return (
    <div className="mt-4 rounded-xl border border-[#B89555]/40 bg-[#F7F2EA] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
          Owner · Photos
        </p>
        <span className="text-[11px] text-[#1A1A1A]/55">Drag to reorder · click ⭐ to set cover · 🗑 to delete</span>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          if (e.dataTransfer?.files?.length) upload(e.dataTransfer.files);
        }}
        className={`block border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition ${
          dragOver ? "bg-[#EFE6D6] border-[#B89555]" : "bg-[#FDFBF7] border-[#B89555]/50 hover:bg-[#F7F2EA]"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
          disabled={busy}
        />
        {busy ? (
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#B89555]" />
        ) : (
          <Upload className="w-6 h-6 mx-auto text-[#B89555]" />
        )}
        <div className="mt-2 text-sm font-semibold text-[#1A1A1A]">
          {busy ? "Uploading…" : "Drop photos here or click to upload"}
        </div>
        <div className="text-xs text-[#1A1A1A]/60 mt-0.5">JPG / PNG / WEBP — adds to gallery instantly</div>
      </label>

      {order.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mt-3">
          {order.map((img) => {
            const isCover = coverImageUrl === img.image_url;
            const isDragging = dragId === img.id;
            return (
              <div
                key={img.id}
                draggable
                onDragStart={(e) => { setDragId(img.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(img.id)}
                onDragEnd={() => setDragId(null)}
                className={`relative group rounded-lg overflow-hidden border border-[#B89555]/30 bg-[#FDFBF7] aspect-square cursor-move ${isDragging ? "opacity-40 ring-2 ring-[#B89555]" : ""}`}
              >
                <img src={img.image_url} alt={img.alt_text ?? ""} className="w-full h-full object-cover" loading="lazy"  decoding="async" />
                <span className="absolute top-1 right-1 text-[10px] font-bold px-1 py-0.5 rounded bg-black/50 text-white inline-flex items-center" data-no-contrast-guard>
                  <GripVertical className="w-3 h-3" />
                </span>
                {isCover && (
                  <span className="absolute top-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#B89555] text-[#1A1A1A]">COVER</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => setCover(img)}
                    className="w-7 h-7 rounded bg-[#FDFBF7] text-[#1A1A1A] inline-flex items-center justify-center hover:bg-[#EFE6D6]"
                    title={isCover ? "Current cover" : "Set as cover"}
                    data-no-contrast-guard
                  >
                    {isCover ? <Star className="w-3.5 h-3.5 fill-current" /> : <StarOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => remove(img)}
                    className="w-7 h-7 rounded bg-[#FDFBF7] text-[#B91C1C] inline-flex items-center justify-center hover:bg-[#FCE8E8]"
                    title="Delete"
                    data-no-contrast-guard
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
