import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AnnouncementCategory =
  | "general" | "policy" | "training" | "event"
  | "recognition" | "urgent" | "holiday" | "payroll";

export interface HRAnnouncement {
  id: string;
  author_user_id: string;
  author_persona: string;
  category: AnnouncementCategory;
  title: string;
  body_html: string;
  audience: "all_brokers" | "all_employees" | "specific_users" | "specific_role";
  audience_user_ids: string[] | null;
  audience_role: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  status: "draft" | "scheduled" | "published" | "archived";
  pin: boolean;
  attachments: any;
  created_at: string;
  updated_at: string;
}

export function useHRAnnouncements(opts?: { includeAll?: boolean }) {
  return useQuery({
    queryKey: ["hr-announcements", opts?.includeAll],
    queryFn: async () => {
      let q: any = supabase
        .from("hr_announcements")
        .select("*")
        .order("pin", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(200);
      if (!opts?.includeAll) q = q.eq("status", "published");
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as HRAnnouncement[];
    },
  });
}

export function useUpsertAnnouncement() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<HRAnnouncement> & { id?: string }) => {
      if (!user?.id) throw new Error("Sign in required");
      const payload: any = {
        author_user_id: user.id,
        author_persona: input.author_persona ?? "amanda_clarke",
        category: input.category ?? "general",
        title: input.title,
        body_html: input.body_html ?? "",
        audience: input.audience ?? "all_brokers",
        audience_user_ids: input.audience_user_ids ?? null,
        audience_role: input.audience_role ?? null,
        scheduled_for: input.scheduled_for ?? null,
        status: input.status ?? "draft",
        pin: input.pin ?? false,
      };
      if (input.id) {
        const { data, error } = await supabase
          .from("hr_announcements")
          .update(payload).eq("id", input.id).select().single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("hr_announcements").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-announcements"] });
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e?.message || "Save failed"),
  });
}

export function usePublishAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("hr_announcement_publish" as any, { _id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-announcements"] });
      toast.success("Published to team");
    },
    onError: (e: any) => toast.error(e?.message || "Publish failed"),
  });
}

export function useMarkAnnouncementRead() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("hr_announcement_mark_read" as any, { _id: id });
      if (error) throw error;
    },
  });
}
