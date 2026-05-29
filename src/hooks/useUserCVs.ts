import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SavedCVRow {
  id: string;
  user_id: string;
  title: string;
  data: any;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useUserCVs(userId: string | null | undefined) {
  const [items, setItems] = useState<SavedCVRow[]>([]);
  const [trashed, setTrashed] = useState<SavedCVRow[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setItems([]); setTrashed([]); return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("user_cvs")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (!error && data) {
      setItems(data.filter((r: SavedCVRow) => !r.deleted_at));
      setTrashed(data.filter((r: SavedCVRow) => !!r.deleted_at));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(
    async (payload: { id?: string; title: string; data: any; photo_url?: string | null }) => {
      if (!userId) throw new Error("Not signed in");
      if (payload.id) {
        const { data, error } = await supabase
          .from("user_cvs")
          .update({
            title: payload.title,
            data: payload.data,
            photo_url: payload.photo_url ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.id)
          .eq("user_id", userId)
          .select()
          .single();
        if (error) throw error;
        await refresh();
        return data as SavedCVRow;
      }
      const { data, error } = await supabase
        .from("user_cvs")
        .insert({
          user_id: userId,
          title: payload.title,
          data: payload.data,
          photo_url: payload.photo_url ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      await refresh();
      return data as SavedCVRow;
    },
    [userId, refresh],
  );

  const softDelete = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase
      .from("user_cvs")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    await refresh();
  }, [userId, refresh]);

  const restore = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase
      .from("user_cvs")
      .update({ deleted_at: null })
      .eq("id", id)
      .eq("user_id", userId);
    await refresh();
  }, [userId, refresh]);

  const hardDelete = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from("user_cvs").delete().eq("id", id).eq("user_id", userId);
    await refresh();
  }, [userId, refresh]);

  return { items, trashed, loading, refresh, save, softDelete, restore, hardDelete };
}
