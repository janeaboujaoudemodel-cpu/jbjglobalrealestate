/**
 * Owner-side uploader for developer company profile PDFs.
 * Uploads to the private `developer-profiles` bucket, records the doc in
 * developer_documents, then invokes ai-developer-profile-extract which
 * writes an entry into enrichment_review_drafts for owner review.
 */
import { useCallback, useState } from "react";
import { Upload, Loader2, FileText, Eye, EyeOff, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

interface Props {
  developerId: string;
  developerName?: string;
}

interface DocRow {
  id: string;
  file_name: string | null;
  file_url: string;
  storage_path: string | null;
  doc_type: string;
  is_public: boolean;
  extracted_at: string | null;
}

const BUCKET = "developer-profiles";

export default function OwnerCompanyProfileUploader({ developerId, developerName }: Props) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["developer-documents", developerId],
    enabled: !!developerId,
    queryFn: async (): Promise<DocRow[]> => {
      const { data, error } = await supabase
        .from("developer_documents")
        .select("id, file_name, file_url, storage_path, doc_type, is_public, extracted_at")
        .eq("developer_id", developerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any) ?? [];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["developer-documents", developerId] });
    qc.invalidateQueries({ queryKey: ["developer-company-profile", developerId] });
    qc.invalidateQueries({ queryKey: ["enrichment-drafts"] });
    qc.invalidateQueries({ queryKey: ["admin-developer"] });
    qc.invalidateQueries({ queryKey: ["developer"] });
    qc.invalidateQueries({ queryKey: ["project"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const [lastExtraction, setLastExtraction] = useState<string[] | null>(null);

  const upload = useCallback(async (files: FileList | File[]) => {
    if (!files || (files as FileList).length === 0) return;
    setBusy(true);
    setLastExtraction(null);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const path = `${developerId}/${crypto.randomUUID()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type || "application/pdf" });
        if (upErr) throw upErr;

        // Private bucket → create a signed URL that outlives the AI extraction call.
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 6);
        const fileUrl = signed?.signedUrl || "";

        const { data: docRow, error: dbErr } = await supabase.from("developer_documents").insert({
          developer_id: developerId,
          doc_type: "company_profile",
          file_url: fileUrl,
          file_name: file.name,
          storage_path: path,
          file_size: file.size,
          is_public: true,
        }).select("id").single();
        if (dbErr) throw dbErr;

        // Await the AI extraction so the user sees exactly what got written.
        toast.message(`Reading ${file.name} with AI…`, { duration: 4000 });
        const { data: aiData, error: aiErr } = await supabase.functions.invoke(
          "ai-developer-profile-extract",
          { body: { developerId, fileUrl, fileName: file.name, documentId: docRow.id } },
        );
        if (aiErr) {
          toast.error(`AI extraction failed: ${aiErr.message}`);
        } else {
          const updated: string[] = (aiData as any)?.updatedFields ?? [];
          setLastExtraction(updated);
          if (updated.length > 0) {
            toast.success(`AI wrote ${updated.length} field${updated.length > 1 ? "s" : ""} into the developer profile`);
          } else {
            toast.message("AI ran but found no new information in this file");
          }
        }
        ok++;
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Upload failed");
      }
    }
    if (ok) toast.success(`Uploaded ${ok} file${ok > 1 ? "s" : ""}`);
    setBusy(false);
    refresh();
  }, [developerId]);

  const togglePublic = async (d: DocRow) => {
    const { error } = await supabase.from("developer_documents").update({ is_public: !d.is_public }).eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success(!d.is_public ? "Now visible on developer page" : "Hidden from public");
    refresh();
  };

  const remove = async (d: DocRow) => {
    if (!confirm(`Delete "${d.file_name || d.doc_type}"?`)) return;
    if (d.storage_path) await supabase.storage.from(BUCKET).remove([d.storage_path]);
    const { error } = await supabase.from("developer_documents").delete().eq("id", d.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  };

  return (
    <div className="rounded-xl border border-[#B89555]/40 bg-[#FDFBF7] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
            Owner · Company Profiles
          </p>
          <p className="text-[11px] text-[#1A1A1A]/55">
            Upload the developer's official PDF. AI reads it and instantly writes the description and profile fields for {developerName || "this developer"}. You can still edit every field manually below.
          </p>
        </div>
        <Link to="/owner/enrichment-review" className="text-xs font-semibold text-[#064E3B] hover:underline">
          Audit log →
        </Link>
      </div>
        <Link to="/owner/enrichment-review" className="text-xs font-semibold text-[#064E3B] hover:underline">
          Review queue →
        </Link>
      </div>

      <label
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer?.files?.length) upload(e.dataTransfer.files); }}
        className={`block border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition ${
          drag ? "bg-[#EFE6D6] border-[#B89555]" : "border-[#B89555]/50 hover:bg-[#F7F2EA]"
        }`}
      >
        <input type="file" multiple accept=".pdf,application/pdf,image/*" className="hidden" disabled={busy}
          onChange={(e) => e.target.files && upload(e.target.files)} />
        {busy ? <Loader2 className="w-6 h-6 mx-auto animate-spin text-[#B89555]" /> : <Upload className="w-6 h-6 mx-auto text-[#B89555]" />}
        <div className="mt-2 text-sm font-semibold text-[#1A1A1A]">
          {busy ? "Uploading…" : "Drop company profile PDFs here"}
        </div>
        <div className="text-xs text-[#1A1A1A]/60 mt-0.5 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> AI reads it · you review before it publishes
        </div>
      </label>

      {docs.length > 0 && (
        <div className="mt-3 divide-y divide-[#B89555]/15 rounded-md border border-[#B89555]/20 bg-white">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <FileText className="w-4 h-4 text-[#B89555] shrink-0" />
              <span className="font-medium text-[#1A1A1A] truncate flex-1">{d.file_name || d.doc_type}</span>
              {d.extracted_at && <span className="text-[10px] text-emerald-800 uppercase tracking-wider">AI ✓</span>}
              <button onClick={() => togglePublic(d)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-[#B89555]/40 bg-[#F7F2EA] hover:bg-[#EFE6D6] text-[#1A1A1A]">
                {d.is_public ? <><Eye className="w-3.5 h-3.5" /> Public</> : <><EyeOff className="w-3.5 h-3.5" /> Hidden</>}
              </button>
              <button onClick={() => remove(d)}
                className="inline-grid place-items-center w-7 h-7 rounded-full border border-[#B91C1C]/30 text-[#B91C1C] hover:bg-[#FCE8E8]">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
