import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SignatureAssetKind = "signature" | "initial" | "stamp";

export interface OwnerSignatureAsset {
  id: string;
  user_id: string;
  kind: SignatureAssetKind;
  label: string | null;
  image_url: string;
  storage_path: string | null;
  is_default: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useOwnerSignatureAssets(kind?: SignatureAssetKind) {
  return useQuery({
    queryKey: ["owner_signature_assets", kind ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("owner_signature_assets" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (kind) q = q.eq("kind", kind);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as OwnerSignatureAsset[];
    },
  });
}

export function useSaveSignatureAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      kind: SignatureAssetKind;
      image_data_url: string;
      label?: string;
      makeDefault?: boolean;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not signed in");

      // Upload PNG to bucket
      const blob = await (await fetch(input.image_data_url)).blob();
      const filename = `${input.kind}-${Date.now()}.png`;
      const path = `${userId}/${filename}`;
      const { error: upErr } = await supabase.storage
        .from("owner-signature-assets")
        .upload(path, blob, { contentType: "image/png", upsert: true });
      if (upErr) throw upErr;

      const { data: signed } = await supabase.storage
        .from("owner-signature-assets")
        .createSignedUrl(path, 60 * 60 * 24 * 365);

      // If set as default, unflag others of same kind
      if (input.makeDefault) {
        await supabase
          .from("owner_signature_assets" as any)
          .update({ is_default: false })
          .eq("kind", input.kind);
      }

      const { data, error } = await supabase
        .from("owner_signature_assets" as any)
        .insert({
          user_id: userId,
          kind: input.kind,
          label: input.label ?? null,
          image_url: signed?.signedUrl ?? input.image_data_url,
          storage_path: path,
          is_default: input.makeDefault ?? false,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["owner_signature_assets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApplyAdoptSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      envelope_id: string;
      signature_asset_id: string;
      stamp_asset_id?: string;
      initials_asset_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("apply-adopt-signature", {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Document signed and stored in Contract Vault");
      qc.invalidateQueries({ queryKey: ["signed_contracts"] });
      qc.invalidateQueries({ queryKey: ["esign_envelopes"] });
    },
    onError: (e: Error) => toast.error(`Sign failed: ${e.message}`),
  });
}
