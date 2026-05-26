/**
 * useOwnerAssets — load + manage the current owner's signature and stamp library.
 * Files are stored in private Supabase buckets keyed by `${uid}/sig/...` and
 * `${uid}/stamp/...`. Display URLs are signed (1 hour TTL) — never public.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AssetKind = "signature" | "stamp";

export interface OwnerAsset {
  id: string;
  kind: AssetKind;
  label: string;
  storage_bucket: string;
  storage_path: string;
  is_default: boolean;
  created_at: string;
  signedUrl?: string;
}

const BUCKET: Record<AssetKind, string> = {
  signature: "owner-signature-assets",
  stamp: "stamp-previews",
};

const FOLDER: Record<AssetKind, string> = { signature: "sig", stamp: "stamp" };

export function useOwnerAssets() {
  const [assets, setAssets] = useState<OwnerAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? null));
  }, []);

  const refresh = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("owner_document_assets")
        .select("*")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as OwnerAsset[];
      // sign URLs
      const signed = await Promise.all(
        rows.map(async (r) => {
          const { data: s } = await supabase.storage
            .from(r.storage_bucket)
            .createSignedUrl(r.storage_path, 60 * 60);
          return { ...r, signedUrl: s?.signedUrl } as OwnerAsset;
        }),
      );
      setAssets(signed);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => { if (uid) refresh(); }, [uid, refresh]);

  const upload = useCallback(
    async (kind: AssetKind, file: Blob, label: string, ext = "png") => {
      if (!uid) { toast.error("Not signed in"); return null; }
      const path = `${uid}/${FOLDER[kind]}/${Date.now()}.${ext}`;
      const bucket = BUCKET[kind];
      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, contentType: file.type || `image/${ext}` });
      if (upErr) { toast.error(upErr.message); return null; }
      const { data, error } = await supabase
        .from("owner_document_assets")
        .insert({
          owner_id: uid, kind, label,
          storage_bucket: bucket, storage_path: path,
          is_default: assets.filter((a) => a.kind === kind).length === 0,
        })
        .select("*")
        .single();
      if (error) { toast.error(error.message); return null; }
      await refresh();
      toast.success(`${kind === "signature" ? "Signature" : "Stamp"} saved`);
      return data as OwnerAsset;
    },
    [uid, assets, refresh],
  );

  const setDefault = useCallback(
    async (id: string, kind: AssetKind) => {
      if (!uid) return;
      await supabase.from("owner_document_assets")
        .update({ is_default: false }).eq("owner_id", uid).eq("kind", kind);
      const { error } = await supabase.from("owner_document_assets")
        .update({ is_default: true }).eq("id", id);
      if (error) { toast.error(error.message); return; }
      await refresh();
    },
    [uid, refresh],
  );

  const remove = useCallback(
    async (asset: OwnerAsset) => {
      await supabase.storage.from(asset.storage_bucket).remove([asset.storage_path]);
      const { error } = await supabase.from("owner_document_assets").delete().eq("id", asset.id);
      if (error) { toast.error(error.message); return; }
      await refresh();
    },
    [refresh],
  );

  const signatures = assets.filter((a) => a.kind === "signature");
  const stamps = assets.filter((a) => a.kind === "stamp");
  const defaultSignature = signatures.find((a) => a.is_default) || signatures[0];
  const defaultStamp = stamps.find((a) => a.is_default) || stamps[0];

  return { loading, uid, signatures, stamps, defaultSignature, defaultStamp, refresh, upload, setDefault, remove };
}
