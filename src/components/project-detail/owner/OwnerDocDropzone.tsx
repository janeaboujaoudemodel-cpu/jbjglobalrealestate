import { useCallback, useState } from "react";
import { Upload, Loader2, Eye, EyeOff, FileText, Trash2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

interface DocRow {
  id: string;
  file_name: string | null;
  file_url: string;
  document_type: string;
  is_visible: boolean | null;
}

interface OwnerDocDropzoneProps {
  projectId: string;
}

const BUCKET = "project-documents";

const inferType = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("brochure")) return "brochure";
  if (n.includes("payment")) return "payment_plan";
  if (n.includes("floor")) return "floor_plan";
  if (n.includes("fact")) return "fact_sheet";
  if (n.includes("inventory")) return "inventory";
  if (/\.(mp4|mov|webm|ogg|m4v)(\?|$)/i.test(n) || n.includes("video") || n.includes("tour")) return "video";
  return "brochure";
};

export default function OwnerDocDropzone({ projectId }: OwnerDocDropzoneProps) {
  const { isOwner: ownerCheck } = useIsAppOwner();
  const { data: existing = [] } = useQuery({
    queryKey: ["owner-project-documents", projectId],
    enabled: !!projectId && ownerCheck,
    queryFn: async (): Promise<DocRow[]> => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("id, file_name, file_url, document_type, is_visible")
        .eq("project_id", projectId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
  const isOwner = ownerCheck;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["owner-project-documents", projectId] });
    qc.invalidateQueries({ queryKey: ["project"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const upload = useCallback(async (files: FileList | File[]) => {
    if (!files || (files as FileList).length === 0) return;
    setBusy(true);
    let ok = 0, fail = 0;
    for (const file of Array.from(files)) {
      try {
        const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const docType = inferType(file.name);
        const { error: insErr } = docType === "video"
          ? await supabase.from("project_videos").insert({
              project_id: projectId,
              url: pub.publicUrl,
              title: file.name,
              is_visible: true,
              display_order: 0,
            } as any)
          : await supabase.from("project_documents").insert({
              project_id: projectId,
              document_type: docType,
              file_url: pub.publicUrl,
              file_name: file.name,
              file_size: file.size,
              storage_path: path,
              is_visible: true,
              allow_download: true,
              data_source: "owner_upload",
            } as any);
        if (insErr) throw insErr;

        // Fire-and-forget enrichment via existing edge function
        supabase.functions
          .invoke("enrich-project", { body: { projectId, fileUrl: pub.publicUrl, fileName: file.name } })
          .catch(() => {});
        ok++;
      } catch (e: any) {
        console.error(e);
        fail++;
      }
    }
    if (ok) toast.success(`Uploaded ${ok} file${ok > 1 ? "s" : ""}${fail ? ` · ${fail} failed` : ""}`);
    if (!ok && fail) toast.error(`Upload failed`);
    setBusy(false);
    refresh();
  }, [projectId]);

  const toggleVisibility = async (doc: DocRow) => {
    const next = !(doc.is_visible ?? true);
    const { error } = await supabase
      .from("project_documents")
      .update({ is_visible: next })
      .eq("id", doc.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Visible on the page" : "Hidden from visitors");
    refresh();
  };

  const remove = async (doc: DocRow) => {
    if (!confirm(`Delete "${doc.file_name || doc.document_type}"?`)) return;
    const { error } = await supabase.from("project_documents").delete().eq("id", doc.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  if (!isOwner) return null;

  return (
    <details className="mt-4 group rounded-xl border border-[#B89555]/40 bg-[#F7F2EA]">
      <summary className="list-none cursor-pointer p-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
            Owner · Documents
          </p>
          <span className="text-[11px] text-[#1A1A1A]/55">Collapsed by default · auto-enriches the listing</span>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-[#064E3B]/25 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#064E3B] bg-[#FDFBF7]">
          <span className="group-open:hidden">Expand</span>
          <span className="hidden group-open:inline">Collapse</span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="px-4 pb-4">

      <label
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          if (e.dataTransfer?.files?.length) upload(e.dataTransfer.files);
        }}
        className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          dragOver ? "bg-[#EFE6D6] border-[#B89555]" : "bg-[#FDFBF7] border-[#B89555]/50 hover:bg-[#F7F2EA]"
        }`}
      >
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
          disabled={busy}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.webm,.ogg,.m4v,application/pdf,image/*,video/*"
        />
        {busy ? (
          <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#B89555]" />
        ) : (
          <Upload className="w-6 h-6 mx-auto text-[#B89555]" />
        )}
        <div className="mt-2 text-sm font-semibold text-[#1A1A1A]">
          {busy ? "Uploading…" : "Drop brochures, floor plans, payment plans, videos"}
        </div>
        <div className="text-xs text-[#1A1A1A]/60 mt-0.5">
          PDF / PNG / JPG / MP4 / MOV — auto-attaches to this project
        </div>
      </label>

      {existing.length > 0 && (
        <div className="mt-3 divide-y divide-[#B89555]/15 rounded-md border border-[#B89555]/20 bg-[#FDFBF7]">
          {existing.map((d) => {
            const visible = d.is_visible ?? true;
            return (
              <div key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <FileText className="w-4 h-4 text-[#B89555] shrink-0" />
                <span className="font-medium text-[#1A1A1A] truncate">
                  {d.file_name || d.document_type}
                </span>
                <span className="text-[11px] text-[#1A1A1A]/55 uppercase tracking-wider">
                  {d.document_type}
                </span>
                <button
                  onClick={() => toggleVisibility(d)}
                  data-emerald-action={visible ? "true" : undefined}
                  data-surface={visible ? "emerald" : "champagne"}
                  className={visible
                    ? "jj-emerald-action ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-transparent"
                    : "ml-auto inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border border-[#B89555]/40 bg-[#F7F2EA] hover:bg-[#EFE6D6] text-[#1A1A1A]"
                  }
                >
                  {visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {visible ? "Visible" : "Hidden"}
                </button>
                <button
                  onClick={() => remove(d)}
                  data-icon-circle="true"
                  className="inline-grid place-items-center w-7 h-7 min-w-7 min-h-7 aspect-square rounded-full border border-[#B91C1C]/30 text-[#B91C1C] hover:bg-[#FCE8E8] p-0 overflow-hidden"
                  aria-label="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </details>
  );
}
