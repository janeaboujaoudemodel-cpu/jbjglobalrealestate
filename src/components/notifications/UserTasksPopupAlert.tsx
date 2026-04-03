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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/50 rounded-2xl shadow-2xl shadow-[#B89555]/20 p-6 md:p-8 max-w-md w-[90vw] relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B89555]/20 to-[#B89555]/10 border-2 border-[#B89555]/40 flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#B89555]" />
          </div>
          <div>
            <h3 className="text-black font-bold text-lg">
              {ticketAlerts.length > 0 && pendingCount > 0
                ? "Updates & Tasks"
                : ticketAlerts.length > 0
                  ? "Ticket Updates"
                  : "Pending Tasks"}
            </h3>
            <p className="text-gray-600 text-sm">
              {totalAlerts} notification{totalAlerts !== 1 ? "s" : ""} for you
            </p>
          </div>
        </div>

        {ticketAlerts.length > 0 && (
          <div className="space-y-2 mb-4">
            {ticketAlerts.map((alert) => (
              <div key={alert.id} className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-black font-semibold text-sm">{alert.title}</p>
                  <p className="text-gray-600 text-xs">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {pendingCount > 0 && (
          <div className="bg-white/60 border border-[#B89555]/20 rounded-xl p-4 mb-5">
            <p className="text-black text-sm">
              You have <span className="font-bold text-[#B89555] text-lg">{pendingCount}</span> pending task{pendingCount !== 1 ? "s" : ""} that require your attention.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {ticketAlerts.length > 0 && (
            <Button
              onClick={() => { handleDismiss(); navigate("/my-tickets"); }}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl"
            >
              <Headphones className="w-4 h-4 mr-2" />
              My Tickets
            </Button>
          )}
          {pendingCount > 0 && (
            <Button
              onClick={() => { handleDismiss(); navigate("/my-account#tasks"); }}
              className="flex-1 bg-gradient-to-r from-[#B89555] to-[#A68444] hover:from-[#A68444] hover:to-[#A7862E] text-black font-bold rounded-xl"
            >
              View Tasks <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="border-[#B89555]/30 text-gray-600 hover:bg-[#B89555]/10 rounded-xl"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
