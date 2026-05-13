/**
 * useCommAITriage — categorize a comm thread and run quick actions
 * (create task, schedule meeting, save note) from a triaged thread.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CommThread } from "./useOwnerInbox";

export interface TriageResult {
  ok: boolean;
  cached?: boolean;
  ai_category?: string;
  ai_priority?: string;
  ai_summary?: string;
  ai_suggested_reply?: string;
  ai_next_step?: { type?: string; title?: string; due_in_hours?: number | null; reasoning?: string } | null;
}

export const CATEGORY_META: Record<string, { label: string; color: string }> = {
  real_estate_lead: { label: "Real Estate Lead", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  real_estate_ops:  { label: "Real Estate Ops",  color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
  marketing:        { label: "Marketing",        color: "bg-purple-500/10 text-purple-700 border-purple-500/30" },
  finance:          { label: "Finance",          color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  personal:         { label: "Personal",         color: "bg-rose-500/10 text-rose-700 border-rose-500/30" },
  spam:             { label: "Spam",             color: "bg-red-500/10 text-red-700 border-red-500/30" },
  other:            { label: "Other",            color: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30" },
};

export default function useCommAITriage() {
  const qc = useQueryClient();

  const triage = useMutation({
    mutationFn: async ({ threadId, force }: { threadId: string; force?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("comm-ai-triage", {
        body: { threadId, force: !!force },
      });
      if (error) throw error;
      return data as TriageResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["owner-inbox-threads"] });
    },
    onError: (e: Error) => toast.error(e.message || "AI triage failed"),
  });

  const createTask = useMutation({
    mutationFn: async ({ thread, title, dueInHours }: { thread: CommThread; title: string; dueInHours?: number | null }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const due_at = dueInHours ? new Date(Date.now() + dueInHours * 3600_000).toISOString() : null;
      const { error } = await supabase.from("owner_comm_tasks").insert({
        user_id: u.user.id,
        thread_id: thread.id,
        lead_id: thread.lead_id,
        title,
        is_ai_suggested: true,
        priority: (thread.ai_priority as string) || "medium",
        due_at,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Task created"),
    onError: (e: Error) => toast.error(e.message),
  });

  const scheduleMeeting = useMutation({
    mutationFn: async ({ thread, title, startInHours = 24 }: { thread: CommThread; title: string; startInHours?: number }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const start = new Date(Date.now() + startInHours * 3600_000);
      const end = new Date(start.getTime() + 30 * 60_000);
      const { error } = await supabase.from("owner_calendar_events").insert({
        owner_id: u.user.id,
        title,
        description: `From thread with ${thread.contact_name ?? thread.contact_identifier}`,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        metadata: { source: "comm_ai_triage", thread_id: thread.id },
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Meeting scheduled"),
    onError: (e: Error) => toast.error(e.message),
  });

  const saveNote = useMutation({
    mutationFn: async ({ thread, content }: { thread: CommThread; content: string }) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("owner_comm_notes").insert({
        user_id: u.user.id,
        thread_id: thread.id,
        content,
        is_ai_suggested: true,
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Note saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  return { triage, createTask, scheduleMeeting, saveNote };
}
