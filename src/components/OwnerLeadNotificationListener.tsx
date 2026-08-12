import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
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
  const { pathname } = useLocation();
  const seenRef = useRef<Set<string>>(new Set());
  const isOwnerBackendRoute =
    pathname === "/owner" ||
    pathname.startsWith("/owner/") ||
    pathname === "/crm" ||
    pathname.startsWith("/crm/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/");

  useEffect(() => {
    // Client/lead notifications are private CRM data. Never subscribe, poll,
    // or render them on public, access-gate, or non-owner portal routes.
    if (!user || !isOwner || !isOwnerBackendRoute) return;

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
      // Realtime already delivers new leads instantly; this poll is only a
      // safety net, so skip it entirely while the tab is hidden and run it at
      // a calm cadence instead of every 15s.
      if (document.visibilityState === "hidden") return;
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
    const interval = window.setInterval(poll, 90000);


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
  }, [user, isOwner, isOwnerBackendRoute]);

  return null;
}