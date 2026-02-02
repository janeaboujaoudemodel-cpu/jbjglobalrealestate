import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface PodcastVisibilityContextType {
  isPodcastVisible: boolean;
  isLoading: boolean;
  togglePodcastVisibility: () => Promise<void>;
  setPodcastVisibility: (enabled: boolean) => Promise<void>;
}

const PodcastVisibilityContext = createContext<PodcastVisibilityContextType | undefined>(undefined);

export const PodcastVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // Fetch the current podcast visibility setting
  const { data: isPodcastVisible = false, isLoading } = useQuery({
    queryKey: ["podcast-visibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "podcast_visibility")
        .single();
      
      if (error) {
        console.error("Error fetching podcast visibility:", error);
        return false; // Default to hidden if error
      }
      
      return (data?.setting_value as { enabled: boolean })?.enabled ?? false;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Mutation to update podcast visibility
  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase.rpc("set_podcast_visibility", {
        p_enabled: enabled,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["podcast-visibility"] });
    },
  });

  const setPodcastVisibility = async (enabled: boolean) => {
    await mutation.mutateAsync(enabled);
  };

  const togglePodcastVisibility = async () => {
    await setPodcastVisibility(!isPodcastVisible);
  };

  return (
    <PodcastVisibilityContext.Provider
      value={{
        isPodcastVisible,
        isLoading,
        togglePodcastVisibility,
        setPodcastVisibility,
      }}
    >
      {children}
    </PodcastVisibilityContext.Provider>
  );
};

export const usePodcastVisibility = () => {
  const context = useContext(PodcastVisibilityContext);
  if (context === undefined) {
    throw new Error("usePodcastVisibility must be used within a PodcastVisibilityProvider");
  }
  return context;
};

export default PodcastVisibilityContext;
