import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AutoPublishPayload {
  developer_id: string;
  project_id?: string | null;
  publish_live?: boolean;
  enrich?: boolean;
  locked_fields?: string[];
  patch: Record<string, unknown>;
  images?: Array<{ image_url: string; alt_text?: string; display_order?: number }>;
  documents?: Array<{ file_url: string; file_name: string; document_type?: string; file_size?: number | null; storage_path?: string | null; cover_image_url?: string | null; display_title?: string | null }>;
  developer_patch?: { description?: string; logo_url?: string; website?: string };
}

export interface AutoPublishResponse {
  status: "published" | "queued_for_review" | "saved_preview" | "enriched";
  project_id?: string;
  slug?: string | null;
  public_path?: string | null;
  publish_error?: string | null;
  submission_id?: string;
  changed_keys?: string[];
  images_added?: number;
  documents_added?: number;
  enrich_error?: string | null;
}

/**
 * Trust-gated submit. Returns 'published' (live) or 'queued_for_review'.
 * After one-time owner approval (trust_level=auto_publish), every call publishes live.
 */
export function useDeveloperAutoPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AutoPublishPayload): Promise<AutoPublishResponse> => {
      const { data, error } = await supabase.functions.invoke("developer-auto-publish", {
        body: payload,
      });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));
      return data as AutoPublishResponse;
    },
    onSuccess: (data) => {
      if (data.status === "published") {
        toast.success("Published live");
      } else if (data.status === "saved_preview") {
        toast.success("Owner preview saved");
      } else if (data.status === "enriched") {
        const n = data.changed_keys?.length ?? 0;
        const im = data.images_added ?? 0;
        const dc = data.documents_added ?? 0;
        toast.success(
          n + im + dc === 0
            ? "Already up to date — no new data to merge"
            : `Enriched: ${n} field${n === 1 ? "" : "s"}, ${im} image${im === 1 ? "" : "s"}, ${dc} doc${dc === 1 ? "" : "s"}`
        );
      } else {
        toast.info("Submitted for owner review");
      }
      qc.invalidateQueries({ queryKey: ["developer-projects"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(`Publish failed: ${e.message}`),
  });
}
