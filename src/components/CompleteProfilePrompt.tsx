import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, ArrowRight, Trophy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useIsRegistered } from "@/hooks/useIsRegistered";

const SESSION_KEY = "jj_complete_profile_shown_at";
const SUPPRESS_MINUTES = 60; // don't re-show within an hour
const MIN_DWELL_MS = 8_000; // wait at least 8s so we don't ambush a fresh visit
const SCROLL_TRIGGER_RATIO = 0.55; // mobile fallback: ~55% of page scrolled

const PITCH: Record<"investor" | "broker" | "developer", string> = {
  investor:
    "Complete your investor profile — share your budget, areas, and goals to unlock matched opportunities and earn points.",
  broker:
    "Complete your broker profile — add your credentials, areas, and bio to unlock CRM, AI tools, and earn points.",
  developer:
    "Complete your developer profile — submit your company details to access launches and earn points.",
};

function wasShownRecently(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const when = Number(raw);
    if (!Number.isFinite(when)) return false;
    return Date.now() - when < SUPPRESS_MINUTES * 60 * 1000;
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  } catch {}
}

export default function CompleteProfilePrompt() {
  const { user } = useAuth();
  const { mode } = useUserModeContext();
  const { data: isRegistered, isLoading } = useIsRegistered();
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false);
  const mountedAt = useRef<number>(Date.now());
  const armed = useRef<boolean>(false);

  // Force-show for testing: append ?completeProfile=1 to any URL.
  const forceShow =
    new URLSearchParams(location.search).get("completeProfile") === "1";

  const shouldQualify =
    !!user && !isLoading && isRegistered === false; // strict false, not undefined

  const trigger = useCallback(
    (reason: string) => {
      if (!shouldQualify && !forceShow) return;
      if (open) return;
      if (!forceShow && wasShownRecently()) return;
      if (!forceShow && Date.now() - mountedAt.current < MIN_DWELL_MS) return;
      // eslint-disable-next-line no-console
      console.info("[CompleteProfilePrompt] opening, reason:", reason);
      setOpen(true);
      markShown();
    },
    [shouldQualify, forceShow, open]
  );

  // Force-show on mount when the query param is present
  useEffect(() => {
    if (forceShow && !open) {
      setOpen(true);
      markShown();
    }
  }, [forceShow, open]);

  // Arm exit-intent listeners only after the user qualifies + dwell window.
  useEffect(() => {
    if (!shouldQualify) return;
    if (wasShownRecently()) return;

    const armTimer = window.setTimeout(() => {
      armed.current = true;
    }, MIN_DWELL_MS);

    // Desktop: mouse leaves via the top edge → likely heading for tabs/close.
    const onMouseOut = (e: MouseEvent) => {
      if (!armed.current) return;
      if (e.relatedTarget) return; // moved to another element, not out of window
      if (e.clientY > 0) return; // only top-edge exits count
      trigger("mouseout-top");
    };

    // Tab/window backgrounded — strong signal of leaving.
    const onVisibility = () => {
      if (!armed.current) return;
      if (document.visibilityState === "hidden") trigger("visibility-hidden");
    };

    // Mobile fallback: deep scroll without registering.
    const onScroll = () => {
      if (!armed.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const ratio = window.scrollY / max;
      if (ratio >= SCROLL_TRIGGER_RATIO) trigger("scroll-deep");
    };

    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", onScroll);
    };
  }, [shouldQualify, trigger]);

  const close = () => setOpen(false);
  const goRegister = () => {
    setOpen(false);
    navigate(`/register/${mode}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[9990] flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm px-3 sm:px-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-profile-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            initial={{ y: 32, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[460px] rounded-2xl bg-[#FDFBF7] border border-[#B89555]/60 shadow-2xl overflow-hidden"
          >
            {/* Gold hairline accent */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#B89555] to-transparent" />

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-[#EFE6D6]/60 border border-[#B89555]/40 flex items-center justify-center text-[#1A1A1A] hover:bg-[#EFE6D6] transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={2.25} />
            </button>

            <div className="px-6 pt-7 pb-2">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-10 h-10 rounded-xl bg-[#EFE6D6] border border-[#B89555]/60 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-[#1A1A1A]" strokeWidth={2.25} />
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#1A1A1A]/70">
                  Earn rewards · 2 minutes
                </span>
              </div>

              <h2
                id="complete-profile-title"
                className="text-[22px] sm:text-[24px] leading-tight font-bold text-[#1A1A1A] tracking-tight"
              >
                Complete your profile to earn points
              </h2>
              <p className="mt-2.5 text-sm text-[#1A1A1A]/75 leading-relaxed">
                {PITCH[mode]}
              </p>

              <ul className="mt-4 space-y-2">
                {[
                  "Unlock matched opportunities tailored to you",
                  "Earn points toward perks and priority access",
                  "Get a verified profile badge",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-sm text-[#1A1A1A]"
                  >
                    <CheckCircle2
                      className="w-4 h-4 mt-[2px] flex-shrink-0 text-[#B89555]"
                      strokeWidth={2.25}
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-6 pt-5 pb-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={close}
                className="flex-1 h-11 rounded-[999px] border border-[#B89555]/40 bg-transparent text-sm font-medium text-[#1A1A1A] hover:bg-[#EFE6D6]/40 transition-colors"
              >
                Maybe later
              </button>
              <button
                type="button"
                onClick={goRegister}
                data-no-contrast-guard
                className="flex-1 h-11 rounded-[999px] inline-flex items-center justify-center gap-2 bg-[#EFE6D6] border border-[#B89555] text-sm font-semibold text-[#1A1A1A] hover:bg-[#E6DAC2] transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
              >
                <Sparkles className="w-4 h-4" strokeWidth={2.25} />
                Take me there
                <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
