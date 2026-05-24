import { createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ConsVisibilityContextType {
  /** When true, AI "Cons" sections are shown across the website. Default: false (hidden). */
  isConsVisible: boolean;
  isLoading: boolean;
  toggleConsVisibility: () => Promise<void>;
  setConsVisibility: (enabled: boolean) => Promise<void>;
}

const ConsVisibilityContext = createContext<ConsVisibilityContextType | undefined>(undefined);

export const ConsVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: isConsVisible = false, isLoading } = useQuery({
    queryKey: ["cons-visibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "cons_visibility")
        .maybeSingle();

      if (error) {
        console.error("Error fetching cons visibility:", error);
        return false; // Default to hidden on error (safer for owner intent)
      }
      return (data?.setting_value as { enabled: boolean } | null)?.enabled ?? false;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase.rpc("set_cons_visibility" as any, {
        p_enabled: enabled,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cons-visibility"] });
    },
  });

  const setConsVisibility = async (enabled: boolean) => {
    await mutation.mutateAsync(enabled);
  };

  const toggleConsVisibility = async () => {
    await setConsVisibility(!isConsVisible);
  };

  return (
    <ConsVisibilityContext.Provider
      value={{ isConsVisible, isLoading, toggleConsVisibility, setConsVisibility }}
    >
      {children}
    </ConsVisibilityContext.Provider>
  );
};

export const useConsVisibility = () => {
  const ctx = useContext(ConsVisibilityContext);
  if (!ctx) throw new Error("useConsVisibility must be used within a ConsVisibilityProvider");
  return ctx;
};

export default ConsVisibilityContext;
