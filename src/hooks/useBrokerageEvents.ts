import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BrokerageEventType = "briefing" | "breakfast";

export interface BrokerageEvent {
  id: string;
  brokerage_id: string;
  event_type: BrokerageEventType;
  event_date: string;
  title: string | null;
  notes: string | null;
  created_at: string;
}

export interface BrokerageEventAttendee {
  id: string;
  event_id: string;
  brokerage_id: string;
  agent_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  matched_via: "manual" | "ai_paste" | "bulk";
  created_at: string;
}

export function useBrokerageEvents(brokerageId?: string) {
  return useQuery({
    enabled: !!brokerageId,
    queryKey: ["brokerage-events", brokerageId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_brokerage_events")
        .select("*")
        .eq("brokerage_id", brokerageId)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return (data || []) as BrokerageEvent[];
    },
  });
}

export function useBrokerageEventAttendees(brokerageId?: string) {
  return useQuery({
    enabled: !!brokerageId,
    queryKey: ["brokerage-event-attendees", brokerageId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_brokerage_event_attendees")
        .select("*")
        .eq("brokerage_id", brokerageId);
      if (error) throw error;
      return (data || []) as BrokerageEventAttendee[];
    },
  });
}

export function useAttendanceCounts() {
  return useQuery({
    queryKey: ["brokerage-attendance-counts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("v_brokerage_attendance_counts")
        .select("*");
      if (error) throw error;
      const map: Record<string, { briefing_count: number; breakfast_count: number; total_attendance: number; last_briefing_date: string | null; last_breakfast_date: string | null }> = {};
      (data || []).forEach((r: any) => { map[r.brokerage_id] = r; });
      return map;
    },
    staleTime: 60_000,
  });
}

export function useCreateBrokerageEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { brokerage_id: string; event_type: BrokerageEventType; event_date?: string; title?: string; notes?: string }) => {
      const { data, error } = await (supabase as any)
        .from("crm_brokerage_events")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data as BrokerageEvent;
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["brokerage-events", row.brokerage_id] });
      qc.invalidateQueries({ queryKey: ["brokerage-attendance-counts"] });
    },
  });
}

export function useDeleteBrokerageEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("crm_brokerage_events").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["brokerage-events"] });
      qc.invalidateQueries({ queryKey: ["brokerage-event-attendees"] });
      qc.invalidateQueries({ queryKey: ["brokerage-attendance-counts"] });
    },
  });
}

export function useAddAttendees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Array<Omit<BrokerageEventAttendee, "id" | "created_at">>) => {
      if (!rows.length) return [];
      const { data, error } = await (supabase as any)
        .from("crm_brokerage_event_attendees")
        .insert(rows)
        .select("*");
      if (error) throw error;
      return data as BrokerageEventAttendee[];
    },
    onSuccess: (_d, variables) => {
      const bid = variables[0]?.brokerage_id;
      if (bid) {
        qc.invalidateQueries({ queryKey: ["brokerage-event-attendees", bid] });
      }
      qc.invalidateQueries({ queryKey: ["brokerage-attendance-counts"] });
    },
  });
}
