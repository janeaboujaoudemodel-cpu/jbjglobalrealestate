import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EmailTemplate {
  id: string;
  owner_user_id: string | null;
  slug: string;
  name: string;
  category: string;
  audience: string;
  subject: string;
  body_text: string;
  body_html: string | null;
  language: string;
  variables: string[];
  signature_preset_id: string | null;
  is_system: boolean;
  is_default_for_audience: boolean;
  tags: string[];
  usage_count: number;
  updated_at: string;
}

export function useEmailTemplateLibrary(audienceFilter?: string) {
  return useQuery({
    queryKey: ["email_template_library", audienceFilter ?? "all"],
    queryFn: async () => {
      let q = (supabase as any)
        .from("email_template_library")
        .select("*")
        .order("is_system", { ascending: false })
        .order("category")
        .order("name");
      if (audienceFilter && audienceFilter !== "any") {
        q = q.in("audience", [audienceFilter, "any"]);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EmailTemplate[];
    },
  });
}

export function useSaveEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      category?: string;
      audience?: string;
      subject: string;
      body_text: string;
      language?: string;
      signature_preset_id?: string | null;
    }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + "-" + Date.now().toString(36);
      const { data, error } = await (supabase as any)
        .from("email_template_library")
        .insert({
          owner_user_id: u.user.id,
          slug,
          name: input.name,
          category: input.category ?? "custom",
          audience: input.audience ?? "any",
          subject: input.subject,
          body_text: input.body_text,
          language: input.language ?? "en",
          signature_preset_id: input.signature_preset_id ?? null,
          is_system: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as EmailTemplate;
    },
    onSuccess: () => {
      toast.success("Template saved");
      qc.invalidateQueries({ queryKey: ["email_template_library"] });
    },
    onError: (e: Error) => toast.error(e.message || "Save failed"),
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("email_template_library").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template removed");
      qc.invalidateQueries({ queryKey: ["email_template_library"] });
    },
    onError: (e: Error) => toast.error(e.message || "Delete failed"),
  });
}

/** Merge {{vars}} into body and subject. Returns rendered text plus list of unresolved variables. */
export function mergeTemplate(
  text: string,
  ctx: Record<string, string | undefined | null>,
): { rendered: string; missing: string[] } {
  const missing: string[] = [];
  const rendered = text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = ctx[key];
    if (v === undefined || v === null || v === "") {
      missing.push(key);
      return `{{${key}}}`;
    }
    return String(v);
  });
  return { rendered, missing: Array.from(new Set(missing)) };
}
