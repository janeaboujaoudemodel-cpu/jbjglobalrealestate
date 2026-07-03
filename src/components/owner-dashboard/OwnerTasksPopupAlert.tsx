import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, AlertTriangle, ArrowRight } from "lucide-react";
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
const DISMISS_KEY_PREFIX = "owner_tasks_popup_dismissed_at_";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24h
// Routes where the pending-tasks popup must never appear (covers core working
// surfaces the user actively complained about).
const SUPPRESS_PATTERNS: RegExp[] = [
  /^\/owner\/crm(\/|$|\?)/i,
  /^\/owner\/documents(\/|$|\?)/i,
  /^\/owner\/inbox(\/|$|\?)/i,
  /^\/sign\//i,
  /^\/e-signature(\/|$)/i,
];
const isSuppressedRoute = () => {
  if (typeof window === "undefined") return false;
  const p = (window.location.pathname || "") + (window.location.search || "");
  return SUPPRESS_PATTERNS.some((rx) => rx.test(p));
};

export function OwnerTasksPopupAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pendingCount, setPendingCount] = useState(0);
  const [hiddenThisSession, setHiddenThisSession] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [suppressed, setSuppressed] = useState<boolean>(() => isSuppressedRoute());

  // Watch route changes (history pushState/popstate) to re-evaluate suppression.
  useEffect(() => {
    const update = () => setSuppressed(isSuppressedRoute());
    window.addEventListener("popstate", update);
    const id = window.setInterval(update, 500);
    return () => { window.removeEventListener("popstate", update); window.clearInterval(id); };
  }, []);

  useEffect(() => {
    if (!user) return;

    // 24h per-user dismissal — once you close it, it stays closed for the day.
    const key = `${DISMISS_KEY_PREFIX}${user.id}`;
    try {
      const ts = localStorage.getItem(key);
      if (ts) {
        const elapsed = Date.now() - parseInt(ts, 10);
        if (Number.isFinite(elapsed) && elapsed < DISMISS_TTL_MS) {
          setHiddenThisSession(true);
          setLoaded(true);
          return;
        }
        localStorage.removeItem(key);
      }
    } catch { /* ignore */ }

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

  const persistDismiss = () => {
    try {
      if (user?.id) localStorage.setItem(`${DISMISS_KEY_PREFIX}${user.id}`, Date.now().toString());
    } catch { /* ignore */ }
  };

  const handleClose = () => {
    persistDismiss();
    setHiddenThisSession(true);
    queryClient.invalidateQueries({ queryKey: ['user-alert-counts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
  };

  const handleViewTasks = () => {
    persistDismiss();
    setHiddenThisSession(true);
    navigate("/owner#tasks");
  };

  if (suppressed || !loaded || hiddenThisSession || pendingCount === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pending-tasks-title"
      data-no-contrast-guard
      className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center bg-[#1A1A1A]/50 p-4 pt-24 md:pt-[104px]"
      data-no-backdrop-blur
    >
      <div
        data-no-contrast-guard
        data-surface="page"
        style={{ backgroundColor: "#FDFBF7", color: "#1A1A1A" }}
        className="border-2 border-[#B89555]/60 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full relative"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close pending tasks alert"
          data-no-contrast-guard
          data-emerald="true"
          style={{ backgroundImage: "var(--jj-emerald-ombre)", backgroundColor: "#064E3B", color: "#FFFFFF", border: "none", boxShadow: "none" }}
          className="absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]"
        >
          <X
            ref={(el) => {
              if (!el) return;
              el.style.setProperty("color", "#FFFFFF", "important");
              el.style.setProperty("stroke", "#FFFFFF", "important");
              el.style.setProperty("opacity", "1", "important");
              el.querySelectorAll("path").forEach((p) => {
                p.style.setProperty("stroke", "#FFFFFF", "important");
              });
            }}
            className="w-5 h-5"
            data-no-contrast-guard
            strokeWidth={2.5}
            color="#FFFFFF"
            stroke="#FFFFFF"
          />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            data-emerald="true"
            data-surface="emerald"
            data-backend-icon-tile="emerald"
            className="allow-white w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
            style={{
              backgroundImage: "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)",
              border: "1px solid rgba(52,211,153,0.55)",
            }}
          >
            <AlertTriangle className="allow-white w-6 h-6" strokeWidth={2.5} style={{ color: "#FFFFFF", stroke: "#FFFFFF", opacity: 1 }} />
          </div>
          <div>
            <h3 id="pending-tasks-title" style={{ color: "#1A1A1A" }} className="font-bold text-lg leading-tight">
              Pending Tasks
            </h3>
            <p style={{ color: "rgba(26,26,26,0.75)" }} className="text-sm font-medium">
              Daily action items require attention
            </p>
          </div>
        </div>

        <div className="bg-[#F7F2EA] border border-[#B89555]/40 rounded-xl p-4 mb-5">
          <p style={{ color: "#1A1A1A" }} className="text-sm">
            You have{" "}
            <span className="font-extrabold text-lg" data-no-contrast-guard style={{ color: "#064E3B" }}>{pendingCount}</span> pending item
            {pendingCount !== 1 ? "s" : ""} that need your review today.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleViewTasks}
            data-emerald="true"
            data-surface="emerald"
            data-emerald-ok="button"
            style={{
              backgroundImage: "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)",
              backgroundColor: "#064E3B",
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              borderColor: "rgba(52,211,153,0.55)",
            }}
            className="allow-white flex-1 inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl border-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]"
          >
            <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>View Tasks</span>
            <ArrowRight
              className="allow-white w-4 h-4"
              strokeWidth={2.5}
              style={{ color: "#FFFFFF", stroke: "#FFFFFF", opacity: 1 }}
            />
          </button>
          <button
            type="button"
            onClick={handleClose}
            data-no-contrast-guard
            style={{ backgroundColor: "#F7F2EA", color: "#1A1A1A", borderColor: "rgba(184,149,85,0.4)" }}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl border-2 text-sm font-semibold hover:!bg-[#EFE6D6] hover:!border-[#B89555] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7]"
          >
            <span data-no-contrast-guard style={{ color: "#1A1A1A" }}>Later</span>
          </button>
        </div>
      </div>
    </div>
  );
}
