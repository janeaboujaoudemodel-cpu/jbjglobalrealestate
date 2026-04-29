import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Pending Tasks alert.
 *
 * Behaviour rules (per product owner):
 *  - Tasks must NEVER be silently removed/auto-suppressed.
 *  - Closing the modal (X / "Later") only hides it for the current in-memory session;
 *    on the next page load the alert returns until tasks reach 0.
 *  - "View Tasks" deep-links to the owner dashboard root (`/owner`) — the canonical
 *    overview route — with a `#tasks` anchor. We do NOT navigate to non-existent
 *    `/owner/dashboard` (which produced a 404).
 */
export function OwnerTasksPopupAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [hiddenThisSession, setHiddenThisSession] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkTasks = async () => {
      const [tasksRes, cvsRes] = await Promise.all([
        supabase
          .from("admin_tasks")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "pending"),
        supabase
          .from("hr_cv_submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      setPendingCount((tasksRes.count || 0) + (cvsRes.count || 0));
      setLoaded(true);
    };

    checkTasks();
  }, [user]);

  const handleClose = () => {
    // Hide for this in-memory session only — never persist dismissal.
    setHiddenThisSession(true);
    queryClient.invalidateQueries({ queryKey: ['user-alert-counts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
  };

  const handleViewTasks = () => {
    setHiddenThisSession(true);
    // Canonical owner dashboard route is `/owner` (index). `#tasks` lets the
    // overview scroll to / open the tasks panel.
    navigate("/owner#tasks");
  };

  if (!loaded || hiddenThisSession || pendingCount === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-tasks-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close pending tasks alert"
          className="absolute top-3 right-3 text-gray-600 hover:text-black transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-black" />
          </div>
          <div>
            <h3 id="pending-tasks-title" className="text-black font-bold text-lg">
              Pending Tasks
            </h3>
            <p className="text-gray-700 text-sm">Daily action items require attention</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
          <p className="text-black text-sm">
            You have{" "}
            <span className="font-extrabold text-black text-lg">{pendingCount}</span> pending item
            {pendingCount !== 1 ? "s" : ""} that need your review today.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleViewTasks}
            variant="primary"
            className="flex-1 rounded-xl"
          >
            View Tasks <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="secondary"
            onClick={handleClose}
            className="rounded-xl border-gray-300 text-black"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
