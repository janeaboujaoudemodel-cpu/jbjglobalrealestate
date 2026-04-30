import { useState, useEffect, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Bell, ArrowRight, CheckCircle, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export const UserTasksPopupAlert = forwardRef<HTMLDivElement>(function UserTasksPopupAlert(_props, ref) {
  const { user, isOwner, ownerLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [ticketAlerts, setTicketAlerts] = useState<Array<{ id: string; title: string; message: string }>>([]);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || ownerLoading) return;
    if (isOwner) {
      setLoaded(true);
      return;
    }

    const dismissedAt = localStorage.getItem('user_tasks_popup_dismissed_at');
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        setLoaded(true);
        return;
      }
      localStorage.removeItem('user_tasks_popup_dismissed_at');
    }

    const checkAlerts = async () => {
      const { count } = await supabase
        .from("admin_tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      setPendingCount(count || 0);

      const { data: notifications } = await supabase
        .from("user_notifications")
        .select("id, title, message")
        .eq("user_id", user.id)
        .eq("type", "support_ticket")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      setTicketAlerts(notifications || []);
      setLoaded(true);
    };

    checkAlerts();
  }, [user, isOwner, ownerLoading]);

  const handleDismiss = () => {
    localStorage.setItem('user_tasks_popup_dismissed_at', Date.now().toString());
    setDismissed(true);
    // Invalidate alert counts so header badges update
    queryClient.invalidateQueries({ queryKey: ['user-alert-counts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
  };

  const totalAlerts = pendingCount + ticketAlerts.length;
  if (!loaded || dismissed || totalAlerts === 0) return null;

  return (
    <div ref={ref} className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm p-4">
      <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full relative">
        <button
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-3 right-3 text-[#5A4A2E] hover:text-[#1A1A1A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#1A1A1A]" />
          </div>
          <div>
            <h3 className="text-[#1A1A1A] font-bold text-lg">
              {ticketAlerts.length > 0 && pendingCount > 0
                ? "Updates & Tasks"
                : ticketAlerts.length > 0
                  ? "Ticket Updates"
                  : "Pending Tasks"}
            </h3>
            <p className="text-[#5A4A2E] text-sm">
              {totalAlerts} notification{totalAlerts !== 1 ? "s" : ""} for you
            </p>
          </div>
        </div>

        {ticketAlerts.length > 0 && (
          <div className="space-y-2 mb-4">
            {ticketAlerts.map((alert) => (
              <div key={alert.id} className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[#1A1A1A] font-semibold text-sm">{alert.title}</p>
                  <p className="text-[#5A4A2E] text-xs">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingCount > 0 && (
          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-4 mb-5">
            <p className="text-[#1A1A1A] text-sm">
              You have <span className="font-extrabold text-[#1A1A1A] text-lg">{pendingCount}</span> pending task{pendingCount !== 1 ? "s" : ""} that require your attention.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {ticketAlerts.length > 0 && (
            <Button
              onClick={() => { handleDismiss(); navigate("/my-tickets"); }}
              variant="primary"
              className="flex-1 rounded-xl"
            >
              <Headphones className="w-4 h-4 mr-2" />
              My Tickets
            </Button>
          )}
          {pendingCount > 0 && (
            <Button
              onClick={() => { handleDismiss(); navigate("/my-account#tasks"); }}
              variant="primary"
              className="flex-1 rounded-xl"
            >
              View Tasks <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={handleDismiss}
            className="rounded-xl border-[#B89555]/30 text-[#1A1A1A]"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
});
