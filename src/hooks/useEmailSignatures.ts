import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailSignature {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  display_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  signature_html: string;
  signature_text: string;
  is_system: boolean;
  is_default: boolean;
}

export function useEmailSignatures() {
  return useQuery({
    queryKey: ["email_signature_presets"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_signature_presets")
        .select("*")
        .order("is_system", { ascending: false })
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as EmailSignature[];
    },
  });
}
