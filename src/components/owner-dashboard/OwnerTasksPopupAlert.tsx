import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function OwnerTasksPopupAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
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

    // Check if already dismissed this session
    const sessionKey = `owner_tasks_popup_${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) {
      setDismissed(true);
      setLoaded(true);
      return;
    }

    checkTasks();
  }, [user]);

  const handleDismiss = () => {
    const sessionKey = `owner_tasks_popup_${new Date().toDateString()}`;
    sessionStorage.setItem(sessionKey, "1");
    setDismissed(true);
  };

  if (!loaded || dismissed || pendingCount === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[#C9A84C]/50 rounded-2xl shadow-2xl shadow-[#C9A84C]/20 p-6 md:p-8 max-w-md w-[90vw] relative">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/10 border-2 border-[#C9A84C]/40 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-[#C9A84C]" />
          </div>
          <div>
            <h3 className="text-black font-bold text-lg">Pending Tasks</h3>
            <p className="text-zinc-500 text-sm">Daily action items require attention</p>
          </div>
        </div>

        <div className="bg-white/60 border border-[#C9A84C]/20 rounded-xl p-4 mb-5">
          <p className="text-black text-sm">
            You have <span className="font-bold text-[#C9A84C] text-lg">{pendingCount}</span> pending item{pendingCount !== 1 ? 's' : ''} that need your review today, including CV applications, leave requests, partnership applications, support tickets, and more.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => { handleDismiss(); navigate("/owner/dashboard#tasks"); }}
            className="flex-1 bg-gradient-to-r from-[#C9A84C] to-[#B8973F] hover:from-[#B8973F] hover:to-[#A7862E] text-black font-bold rounded-xl"
          >
            View Tasks <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="border-[#C9A84C]/30 text-zinc-600 hover:bg-[#C9A84C]/10 rounded-xl"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}
