import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export function OwnerTasksPopupAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const sessionKey = `owner_tasks_popup_${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) {
      setDismissed(true);
      setLoaded(true);
      return;
    }

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

  const handleDismiss = () => {
    const sessionKey = `owner_tasks_popup_${new Date().toDateString()}`;
    sessionStorage.setItem(sessionKey, "1");
    setDismissed(true);
    queryClient.invalidateQueries({ queryKey: ['user-alert-counts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
  };

  if (!loaded || dismissed || pendingCount === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[#B89555]/50 rounded-2xl shadow-2xl shadow-[#B89555]/20 p-6 md:p-8 max-w-md w-[90vw] relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B89555]/20 to-[#B89555]/10 border-2 border-[#B89555]/40 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#B89555]" />
          </div>
          <div>
            <h3 className="text-black font-bold text-lg">Pending Tasks</h3>
            <p className="text-zinc-500 text-sm">Daily action items require attention</p>
          </div>
        </div>

        <div className="bg-white/60 border border-[#B89555]/20 rounded-xl p-4 mb-5">
          <p className="text-black text-sm">
            You have <span className="font-bold text-[#B89555] text-lg">{pendingCount}</span> pending item{pendingCount !== 1 ? 's' : ''} that need your review today.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => { handleDismiss(); navigate("/owner/dashboard#tasks"); }}
            className="flex-1 bg-gradient-to-r from-[#B89555] to-[#A68444] hover:from-[#A68444] hover:to-[#A7862E] text-black font-bold rounded-xl"
          >
            View Tasks <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="border-[#B89555]/30 text-zinc-600 hover:bg-[#B89555]/10 rounded-xl"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
