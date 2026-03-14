import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AppEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_end_date: string | null;
  location: string | null;
  event_type: string;
  target_categories: string[];
  created_by: string | null;
  status: string;
  invitation_template: string | null;
  cover_image_url: string | null;
  max_attendees: number | null;
  is_public: boolean | null;
  created_at: string;
}

export interface EventInvitation {
  id: string;
  event_id: string;
  user_id: string | null;
  user_email: string | null;
  status: string;
  sent_at: string | null;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
}

export function useEventManagement() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events" as any)
      .select("*")
      .order("event_date", { ascending: false });

    if (!error && data) setEvents(data as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const createEvent = async (eventData: Partial<AppEvent>) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("events" as any)
      .insert({ ...eventData, created_by: user.id } as any)
      .select()
      .single();

    if (error) { toast.error("Failed to create event"); return null; }
    toast.success("Event created");
    fetchEvents();
    return data;
  };

  const updateEvent = async (id: string, updates: Partial<AppEvent>) => {
    const { error } = await supabase
      .from("events" as any)
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) { toast.error("Failed to update event"); return false; }
    toast.success("Event updated");
    fetchEvents();
    return true;
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("events" as any).delete().eq("id", id);
    if (error) { toast.error("Failed to delete event"); return false; }
    toast.success("Event deleted");
    fetchEvents();
    return true;
  };

  const sendInvitations = async (eventId: string, invitations: { user_id?: string; user_email: string }[]) => {
    const rows = invitations.map((inv) => ({
      event_id: eventId,
      user_id: inv.user_id || null,
      user_email: inv.user_email,
      status: "invited",
      sent_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("event_invitations" as any).insert(rows as any);
    if (error) { toast.error("Failed to send invitations"); return false; }
    toast.success(`${invitations.length} invitation(s) sent`);
    return true;
  };

  const fetchInvitations = async (eventId: string) => {
    const { data, error } = await supabase
      .from("event_invitations" as any)
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data || []) as EventInvitation[];
  };

  return { events, loading, createEvent, updateEvent, deleteEvent, sendInvitations, fetchInvitations, refetch: fetchEvents };
}

/** Hook for users to see their own event invitations */
export function useMyEventInvitations() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<(EventInvitation & { event?: AppEvent })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("event_invitations" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        const eventIds = [...new Set((data as any[]).map((d: any) => d.event_id))];
        if (eventIds.length > 0) {
          const { data: eventsData } = await supabase
            .from("events" as any)
            .select("*")
            .in("id", eventIds);

          const eventMap = new Map((eventsData as any[] || []).map((e: any) => [e.id, e]));
          setInvitations((data as any[]).map((inv: any) => ({ ...inv, event: eventMap.get(inv.event_id) })));
        } else {
          setInvitations(data as unknown as EventInvitation[]);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  const respondToInvitation = async (invitationId: string, response: "accepted" | "declined") => {
    const { error } = await supabase
      .from("event_invitations" as any)
      .update({ status: response, responded_at: new Date().toISOString() } as any)
      .eq("id", invitationId);

    if (error) { toast.error("Failed to respond"); return false; }
    toast.success(response === "accepted" ? "RSVP accepted!" : "Invitation declined");
    setInvitations((prev) => prev.map((inv) => inv.id === invitationId ? { ...inv, status: response } : inv));
    return true;
  };

  return { invitations, loading, respondToInvitation };
}
