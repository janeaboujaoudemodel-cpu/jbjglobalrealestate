import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

function playLeadSound() {
  try {
    const audio = new Audio("/audio/jbj-intro-sting.mp3");
    audio.volume = 0.45;
    void audio.play().catch(() => undefined);
  } catch {
    // Browsers can block sound before user interaction; the toast still appears.
  }
}

export default function OwnerLeadNotificationListener() {
  const { user, isOwner } = useAuth();
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !isOwner) return;

    const handleLeadNotification = (row: any) => {
      if (!row || row.notification_type !== "new_lead" || seenRef.current.has(row.id)) return;
      seenRef.current.add(row.id);
      playLeadSound();
      toast(row.title || "New lead received", {
        description: row.body || "Open CRM to follow up.",
        action: row.action_url
          ? {
              label: "Open CRM",
              onClick: () => {
                window.location.href = row.action_url;
              },
            }
          : undefined,
        duration: 12000,
      });
    };

    const poll = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("id,title,body,notification_type,action_url,created_at")
        .eq("user_id", user.id)
        .eq("notification_type", "new_lead")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(3);
      (data || []).reverse().forEach(handleLeadNotification);
    };

    void poll();
    const interval = window.setInterval(poll, 15000);

    const channel = supabase
      .channel(`owner-new-leads-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          handleLeadNotification(payload.new as any);
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, isOwner]);

  return null;
}