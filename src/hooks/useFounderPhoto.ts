import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * useFounderPhoto — reads the optional founder photo override URL stored in
 * site_settings.founder_photo_url and exposes an admin-only uploader.
 *
 * Falls back to the bundled hero asset when no override is set.
 */
export function useFounderPhoto() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["founder-photo-url"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "founder_photo_url")
        .maybeSingle();
      if (error) {
        console.error("founder_photo_url fetch error:", error);
        return null as string | null;
      }
      return ((data?.setting_value as { url: string | null } | null)?.url) ?? null;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const setUrlMutation = useMutation({
    mutationFn: async (url: string | null) => {
      const { error } = await supabase.rpc("set_founder_photo_url" as any, { p_url: url });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["founder-photo-url"] }),
  });

  const uploadAndSet = useCallback(
    async (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `founder/founder-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-branding").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("site-branding").getPublicUrl(path);
      const url = pub.publicUrl;
      await setUrlMutation.mutateAsync(url);
      return url;
    },
    [setUrlMutation],
  );

  return {
    photoUrl: query.data ?? null,
    isLoading: query.isLoading,
    uploadAndSet,
    clear: () => setUrlMutation.mutateAsync(null),
    isSaving: setUrlMutation.isPending,
  };
}
