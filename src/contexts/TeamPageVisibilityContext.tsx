import { createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface TeamPageVisibilityContextType {
  /** When true, the public /team page is reachable. Default: false (hidden). */
  isTeamPageVisible: boolean;
  isLoading: boolean;
  toggleTeamPageVisibility: () => Promise<void>;
  setTeamPageVisibility: (enabled: boolean) => Promise<void>;
}

const TeamPageVisibilityContext = createContext<TeamPageVisibilityContextType | undefined>(undefined);

export const TeamPageVisibilityProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();

  const { data: isTeamPageVisible = false, isLoading } = useQuery({
    queryKey: ["team-page-visibility"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "team_page_visibility")
        .maybeSingle();
      if (error) {
        console.error("Error fetching team page visibility:", error);
        return false;
      }
      return (data?.setting_value as { enabled: boolean } | null)?.enabled ?? false;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const mutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data, error } = await supabase.rpc("set_team_page_visibility" as any, {
        p_enabled: enabled,
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-page-visibility"] });
    },
  });

  const setTeamPageVisibility = async (enabled: boolean) => {
    await mutation.mutateAsync(enabled);
  };

  const toggleTeamPageVisibility = async () => {
    await setTeamPageVisibility(!isTeamPageVisible);
  };

  return (
    <TeamPageVisibilityContext.Provider
      value={{ isTeamPageVisible, isLoading, toggleTeamPageVisibility, setTeamPageVisibility }}
    >
      {children}
    </TeamPageVisibilityContext.Provider>
  );
};

export const useTeamPageVisibility = () => {
  const ctx = useContext(TeamPageVisibilityContext);
  if (!ctx) throw new Error("useTeamPageVisibility must be used within a TeamPageVisibilityProvider");
  return ctx;
};

export default TeamPageVisibilityContext;
