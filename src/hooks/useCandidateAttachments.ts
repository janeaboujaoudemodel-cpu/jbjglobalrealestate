/**
 * useCandidateAttachments — owner-only archive of ID/passport/visa
 * scans uploaded inside Document Studio, organised by candidate folder.
 *
 * Files live in private storage bucket `candidate-documents` under
 *   {owner_user_id}/{candidate_folder_slug}/{timestamp}-{filename}
 * with a metadata row in `crm_document_attachments` per upload.
 *
 * Supports the same 30-day soft-delete contract as crm_documents.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normaliseFolderKey } from "@/utils/candidateFolder";

export interface CandidateAttachment {
  id: string;
  owner_user_id: string;
  candidate_folder: string;
  candidate_display_name: string | null;
  file_path: string;
  mime_type: string | null;
  original_filename: string | null;
  kind: string | null;
  deleted_at: string | null;
  created_at: string;
}

function slugForPath(s: string) {
  return s.replace(/[^a-z0-9-_ ]/gi, "").replace(/\s+/g, "-").toLowerCase() || "unsorted";
}

export function useCandidateAttachments(folder?: string | null, includeDeleted = false) {
  return useQuery({
    queryKey: ["candidate_attachments", folder ?? "__all__", includeDeleted],
    queryFn: async (): Promise<CandidateAttachment[]> => {
      let q = supabase.from("crm_document_attachments" as any).select("*").order("created_at", { ascending: false });
      if (folder) q = q.eq("candidate_folder", folder);
      if (!includeDeleted) q = q.is("deleted_at", null);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any) ?? [];
    },
  });
}

export function useUploadCandidateAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      file: File;
      candidate_display_name: string;
      kind?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const folder = normaliseFolderKey(vars.candidate_display_name);
      if (!folder) throw new Error("Candidate name required before attaching");
      const safeFolder = slugForPath(folder);
      const safeName = vars.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${safeFolder}/${Date.now()}-${safeName}`;
      const { error: upErr } = await supabase.storage
        .from("candidate-documents")
        .upload(path, vars.file, { contentType: vars.file.type || undefined, upsert: false });
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("crm_document_attachments" as any)
        .insert({
          owner_user_id: user.id,
          candidate_folder: folder,
          candidate_display_name: vars.candidate_display_name,
          file_path: path,
          mime_type: vars.file.type || null,
          original_filename: vars.file.name,
          kind: vars.kind || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CandidateAttachment;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candidate_attachments"] });
      qc.invalidateQueries({ queryKey: ["candidate_folders"] });
    },
    onError: (e: any) => toast.error(e?.message || "Attachment upload failed"),
  });
}

export function useSoftDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_document_attachments" as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate_attachments"] }),
    onError: (e: any) => toast.error(e?.message || "Delete failed"),
  });
}

export function useRestoreAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("crm_document_attachments" as any)
        .update({ deleted_at: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["candidate_attachments"] }),
  });
}

export async function getAttachmentSignedUrl(path: string, expiresInSec = 300): Promise<string | null> {
  const { data, error } = await supabase.storage.from("candidate-documents").createSignedUrl(path, expiresInSec);
  if (error) return null;
  return data?.signedUrl ?? null;
}
