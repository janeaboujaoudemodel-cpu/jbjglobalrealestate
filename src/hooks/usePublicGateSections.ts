import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type GateSectionKind =
  | "hero" | "overview" | "video" | "features" | "solutions" | "lead_cta" | "login_signup";

export interface GateSection {
  id: string;
  kind: GateSectionKind;
  position: number;
  visible: boolean;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  media: any;
  cta: any;
  props: any;
  created_at: string;
  updated_at: string;
}

export function usePublicGateSections(opts: { includeHidden?: boolean } = {}) {
  return useQuery({
    queryKey: ["public_gate_sections", opts.includeHidden ?? false],
    queryFn: async (): Promise<GateSection[]> => {
      let q = supabase.from("public_gate_sections").select("*").order("position", { ascending: true });
      if (!opts.includeHidden) q = q.eq("visible", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as GateSection[];
    },
    staleTime: 60_000,
  });
}
