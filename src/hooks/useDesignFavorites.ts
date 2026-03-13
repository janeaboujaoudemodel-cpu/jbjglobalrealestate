import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DesignItemType = 'stamp' | 'business_card' | 'letterhead' | 'cv' | 'logo' | 'cover_letter' | 'document';
export type DesignListType = 'favorite' | 'shortlist';

export interface DesignFavorite {
  id: string;
  user_id: string;
  item_type: DesignItemType;
  item_id: string;
  item_name: string | null;
  thumbnail_svg: string | null;
  metadata: Record<string, unknown>;
  list_type: DesignListType;
  created_at: string;
}

// ─── Authenticated hooks ──────────────────────────────────────────────────────

export function useDesignFavorites(itemType?: DesignItemType) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["design-favorites", user?.id, itemType],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase
        .from("design_favorites")
        .select("*")
        .eq("user_id", user.id)
        .eq("list_type", "favorite")
        .order("created_at", { ascending: false });
      if (itemType) q = q.eq("item_type", itemType);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as DesignFavorite[];
    },
    enabled: !!user,
  });
}

export function useDesignShortlist(itemType?: DesignItemType) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["design-shortlist", user?.id, itemType],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase
        .from("design_favorites")
        .select("*")
        .eq("user_id", user.id)
        .eq("list_type", "shortlist")
        .order("created_at", { ascending: false });
      if (itemType) q = q.eq("item_type", itemType);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as DesignFavorite[];
    },
    enabled: !!user,
  });
}

export function useToggleDesignFavorite() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      itemType,
      itemId,
      itemName,
      thumbnailSvg,
      metadata,
      listType = "favorite",
      isActive,
    }: {
      itemType: DesignItemType;
      itemId: string;
      itemName?: string;
      thumbnailSvg?: string;
      metadata?: Record<string, unknown>;
      listType?: DesignListType;
      isActive: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");
      if (isActive) {
        const { error } = await supabase
          .from("design_favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId)
          .eq("list_type", listType);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("design_favorites")
          .insert({
            user_id: user.id,
            item_type: itemType,
            item_id: itemId,
            item_name: itemName || null,
            thumbnail_svg: thumbnailSvg || null,
            metadata: metadata || {},
            list_type: listType,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isActive, listType = "favorite" }) => {
      qc.invalidateQueries({ queryKey: ["design-favorites"] });
      qc.invalidateQueries({ queryKey: ["design-shortlist"] });
      const label = listType === "favorite" ? "favorites" : "shortlist";
      toast.success(isActive ? `Removed from ${label}` : `Added to ${label}`);
    },
    onError: () => {
      toast.error("Failed to update");
    },
  });
}

// ─── Helper: check if item is saved ───────────────────────────────────────────

export function useIsDesignSaved(itemType: DesignItemType, itemId: string) {
  const { data: favs } = useDesignFavorites(itemType);
  const { data: shorts } = useDesignShortlist(itemType);
  return {
    isFavorite: favs?.some(f => f.item_id === itemId) || false,
    isShortlisted: shorts?.some(s => s.item_id === itemId) || false,
  };
}

// ─── Grouped by type ──────────────────────────────────────────────────────────

export function useAllDesignFavorites() {
  return useDesignFavorites();
}

export function useAllDesignShortlist() {
  return useDesignShortlist();
}

export function groupByType(items: DesignFavorite[]): Record<DesignItemType, DesignFavorite[]> {
  const groups: Record<string, DesignFavorite[]> = {};
  for (const item of items) {
    if (!groups[item.item_type]) groups[item.item_type] = [];
    groups[item.item_type].push(item);
  }
  return groups as Record<DesignItemType, DesignFavorite[]>;
}

export const DESIGN_TYPE_LABELS: Record<DesignItemType, string> = {
  stamp: "Stamps",
  business_card: "Business Cards",
  letterhead: "Letterheads",
  cv: "CVs & Profiles",
  logo: "Logos",
  cover_letter: "Cover Letters",
  document: "Documents",
};
