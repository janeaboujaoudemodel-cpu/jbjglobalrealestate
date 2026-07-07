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
  real_estate_lead:    { label: "Real Estate Lead",    color: "jj-emerald-metallic allow-white text-white border-transparent [&_*]:!text-white" },
  real_estate_ops:     { label: "Real Estate Ops",     color: "jj-emerald-metallic allow-white text-white border-transparent [&_*]:!text-white" },
  sales_offer:         { label: "Sales / Offers",      color: "jj-emerald-metallic allow-white text-white border-transparent [&_*]:!text-white" },
  campaign:            { label: "Campaign / Influencer", color: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/40" },
  advertising:         { label: "Advertising",         color: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/40" },
  marketing:           { label: "Marketing",           color: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/40" },
  business_linkedin:   { label: "Business / LinkedIn", color: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/40" },
  finance:             { label: "Finance / Banking",   color: "jj-emerald-metallic allow-white text-white border-transparent [&_*]:!text-white" },
  developer_documents: { label: "Developer / Docs",    color: "jj-emerald-metallic allow-white text-white border-transparent [&_*]:!text-white" },
  system:              { label: "System / Website",    color: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40" },
  personal:            { label: "Personal",            color: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/40" },
  spam:                { label: "Spam",                color: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/40" },
  other:               { label: "Other",               color: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30" },
};

/**
 * Client-side deterministic categorizer. Used to classify threads on the
 * fly when AI triage hasn't run yet, so the category filter chips are
 * actually useful (SHEIN → Campaign, Emirates NBD → Finance, etc).
 */
export function clientCategorize(thread: { contact_identifier?: string | null; contact_name?: string | null; last_message_preview?: string | null; ai_category?: string | null }): string {
  // Only honor stored AI category if it matches the new taxonomy; otherwise
  // recompute so legacy "personal"/"other" rows route into the right bucket.
  if (thread.ai_category && thread.ai_category !== "personal" && thread.ai_category !== "other" && CATEGORY_META[thread.ai_category]) {
    return thread.ai_category;
  }
  const hay = `${thread.contact_identifier ?? ""} ${thread.contact_name ?? ""} ${thread.last_message_preview ?? ""}`.toLowerCase();
  if (/(shein.*creator|creator center|influencer|brand collab|campaign\b|sponsor|ugc|content creator|barter|gifting)/.test(hay)) return "campaign";
  if (/(canon|nikon|sony|adidas|nike|samsung|apple store|new product|introducing the|launch|advertis|sponsored)/.test(hay)) return "advertising";
  if (/(linkedin|new connection|profile view|posted|comment on your|endorsement)/.test(hay)) return "business_linkedin";
  if (/(emiratesnbd|enbd|hsbc|adcb|\bfab\b|mashreq|payroll|invoice|\btax\b|\bvat\b|payment|\bbank\b|statement|priorit\w*banking|nbd)/.test(hay)) return "finance";
  if (/(price offer|buyer waiting|luxury closet|offer for your|sell your|resale)/.test(hay)) return "sales_offer";
  if (/(registration|\bmou\b|trade license|docusign|envelope|developer|brochure|inventory|\blisting\b|broker)/.test(hay)) return "developer_documents";
  if (/(github|uptime|monitor|alert|deploy|build failed|run failed|supabase|hostinger|verification code|\botp\b|search console|google.*team|sc-noreply)/.test(hay)) return "system";
  if (/(shein|ruelala|farfetch|cobone|reversible|shopstyle|newsletter|unsubscribe|promo|\bsale\b|\bdeal\b|coupon|rotana|gitex|mmgtalent|job alert)/.test(hay)) return "marketing";
  if (/(spam|win a prize|do not reply|noreply)/.test(hay)) return "other";
  return "other";
}

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
