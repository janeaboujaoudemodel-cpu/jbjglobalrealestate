import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface FounderVisibilityContextType {
  isFounderVisible: boolean;
  isLoading: boolean;
  toggleFounderVisibility: () => Promise<void>;
  setFounderVisibility: (enabled: boolean) => Promise<void>;
}

const FounderVisibilityContext = createContext<FounderVisibilityContextType | undefined>(undefined);

export const FounderVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  // Fetch the current founder visibility setting
  const { data: isFounderVisible = true, isLoading } = useQuery({
    queryKey: ["founder-visibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "founder_visibility")
        .single();
      
      if (error) {
        console.error("Error fetching founder visibility:", error);
        return true; // Default to visible if error
      }
      
      return (data?.setting_value as { enabled: boolean })?.enabled ?? true;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Mutation to update founder visibility
  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase.rpc("set_founder_visibility", {
        p_enabled: enabled,
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["founder-visibility"] });
    },
  });

  const setFounderVisibility = async (enabled: boolean) => {
    await mutation.mutateAsync(enabled);
  };

  const toggleFounderVisibility = async () => {
    await setFounderVisibility(!isFounderVisible);
  };

  return (
    <FounderVisibilityContext.Provider
      value={{
        isFounderVisible,
        isLoading,
        toggleFounderVisibility,
        setFounderVisibility,
      }}
    >
      {children}
    </FounderVisibilityContext.Provider>
  );
};

export const useFounderVisibility = () => {
  const context = useContext(FounderVisibilityContext);
  if (context === undefined) {
    throw new Error("useFounderVisibility must be used within a FounderVisibilityProvider");
  }
  return context;
};

export default FounderVisibilityContext;
