import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Favorite {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface Shortlist {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export function useFavorites() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !loading && !!user,
  });
}

export function useShortlist() {
  const { user, loading } = useAuth();

  return useQuery({
    queryKey: ["shortlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("shortlists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Shortlist[];
    },
    enabled: !loading && !!user,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, isFavorite }: { projectId: string; isFavorite: boolean }) => {
      if (!user) throw new Error("Must be logged in");

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", projectId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, project_id: projectId });
        if (error) throw error;
      }
    },
    onSuccess: (_, { isFavorite }) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    },
    onError: (error) => {
      toast.error("Failed to update favorites");
      console.error(error);
    },
  });
}

export function useToggleShortlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      isShortlisted, 
    }: { 
      projectId: string; 
      isShortlisted: boolean;
      currentCount?: number;
    }) => {
      if (!user) throw new Error("Must be logged in");

      if (isShortlisted) {
        const { error } = await supabase
          .from("shortlists")
          .delete()
          .eq("user_id", user.id)
          .eq("project_id", projectId);
        if (error) throw error;
      } else {
        // No limit - users can shortlist as many as they want
        const { error } = await supabase
          .from("shortlists")
          .upsert(
            { user_id: user.id, project_id: projectId },
            { onConflict: "user_id,project_id", ignoreDuplicates: true }
          );
        if (error) throw error;
      }
    },
    onSuccess: (_, { isShortlisted }) => {
      queryClient.invalidateQueries({ queryKey: ["shortlist"] });
      toast.success(isShortlisted ? "Removed from shortlist" : "Added to shortlist");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update shortlist");
    },
  });
}
