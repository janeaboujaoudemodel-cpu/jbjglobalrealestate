/**
 * GuidedTour — Spotlight coachmark tour.
 *
 * Instead of a separate slideshow modal, this overlays a dimmed page with a
 * cutout around real on-page icons (mobile menu, search, account, language…)
 * and shows a tooltip arrow pointing at each one. The user sees exactly where
 * the icon lives in the actual website.
 *
 * Steps are resolved by `data-tour-target="…"` selectors. If a step's element
 * is missing on the current viewport (e.g. desktop-only icon on iPad), the
 * step is skipped automatically.
 */
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, X, Compass, Sparkles } from "lucide-react";
import { JJLogoImage } from "./JJLogoImage";

const TOUR_COMPLETED_KEY = "jj_tour_completed";

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

type SpotlightStep = {
  target: string;        // CSS selector — primary
  fallbackTargets?: string[];
  title: string;
  description: string;
  pulse?: boolean;
};

const SPOTLIGHT_STEPS: SpotlightStep[] = [
  {
    target: '[data-tour-target="mobile-menu"]',
    fallbackTargets: ['[data-tour-target="header"] nav', 'header'],
    title: "Main menu",
    description: "Tap here to open the full navigation — Buy, Rent, Projects, Services, Areas and more.",
    pulse: true,
  },
  {
    target: '[data-tour-target="search"]',
    fallbackTargets: ['[aria-label="Search"]', '[data-tour-target="mobile-menu"]'],
    title: "Search",
    description: "Search properties, projects, areas and tools instantly. On tablet/mobile, the search lives inside the main menu.",
    pulse: true,
  },
  {
    target: '[data-tour-target="account"]',
    fallbackTargets: ['[aria-label="My Account"]', '[aria-label="Sign In"]', '[data-tour-target="mobile-menu"]'],
    title: "Your account",
    description: "Sign in, manage your profile, view favorites and access your dashboard.",
    pulse: true,
  },
  {
    target: '[data-tour-target="language"]',
    fallbackTargets: ['[aria-label="Language"]', '[data-tour-target="mobile-menu"]'],
    title: "Language",
    description: "Switch the entire site between 16 languages — translations are live.",
    pulse: true,
  },
];

// ── Geometry helpers ──────────────────────────────────────────────────────
type Rect = { top: number; left: number; width: number; height: number };

function getRect(selector: string, fallbacks: string[] = []): { rect: Rect; el: HTMLElement } | null {
  const tryOne = (sel: string): HTMLElement | null => {
    try {
      const list = document.querySelectorAll<HTMLElement>(sel);
      for (const el of Array.from(list)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && el.offsetParent !== null) return el;
      }
    } catch {/* invalid selector */}
    return null;
  };
  const el = tryOne(selector) || fallbacks.map(tryOne).find(Boolean) || null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { rect: { top: r.top, left: r.left, width: r.width, height: r.height }, el };
}

const GuidedTour = ({ isOpen, onClose }: GuidedTourProps) => {
  const [phase, setPhase] = useState<"welcome" | "spotlight" | "done">("welcome");
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [vh, setVh] = useState(typeof window !== "undefined" ? window.innerHeight : 768);
  const rafRef = useRef<number | null>(null);

  const handleComplete = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setPhase("welcome");
    setStepIdx(0);
    onClose();
  }, [onClose]);

  // ── Resolve current step target & keep rect synced on scroll/resize ──
  useLayoutEffect(() => {
    if (!isOpen || phase !== "spotlight") return;
    const step = SPOTLIGHT_STEPS[stepIdx];
    if (!step) return;

    let cancelled = false;
    let attempts = 0;

    const tick = () => {
      if (cancelled) return;
      const found = getRect(step.target, step.fallbackTargets);
      if (found) {
        setRect(found.rect);
        // Ensure visible: scroll into view if off-screen
        const r = found.rect;
        if (r.top < 80 || r.top + r.height > window.innerHeight - 80) {
          found.el.scrollIntoView({ behavior: "smooth", block: "center" });
          // re-measure after scroll
          setTimeout(() => {
            const re = found.el.getBoundingClientRect();
            if (!cancelled) setRect({ top: re.top, left: re.left, width: re.width, height: re.height });
          }, 350);
        }
      } else if (attempts++ < 20) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Element never appeared → auto-skip to next step
        setStepIdx((i) => {
          if (i + 1 >= SPOTLIGHT_STEPS.length) {
            setPhase("done");
            return i;
          }
          return i + 1;
        });
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    const onMove = () => {
      const found = getRect(step.target, step.fallbackTargets);
      if (found) setRect(found.rect);
    };
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
      onMove();
    };
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen, phase, stepIdx]);

  // ── ESC to close ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleComplete();
      if (e.key === "ArrowRight" && phase === "spotlight") next();
      if (e.key === "ArrowLeft" && phase === "spotlight") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, phase, stepIdx]);

  if (!isOpen) return null;

  const next = () => {
    if (stepIdx + 1 >= SPOTLIGHT_STEPS.length) setPhase("done");
    else setStepIdx((i) => i + 1);
  };
  const prev = () => setStepIdx((i) => Math.max(0, i - 1));

  const step = SPOTLIGHT_STEPS[stepIdx];

  // Tooltip placement: prefer below the target; if no room, place above.
  const TOOLTIP_W = Math.min(320, vw - 32);
  const TOOLTIP_H_EST = 170;
  const GAP = 14;

  let tooltipLeft = 16;
  let tooltipTop = 80;
  let placement: "below" | "above" | "center" = "below";

  if (phase === "spotlight" && rect) {
    const centerX = rect.left + rect.width / 2;
    tooltipLeft = Math.max(12, Math.min(vw - TOOLTIP_W - 12, centerX - TOOLTIP_W / 2));
    const spaceBelow = vh - (rect.top + rect.height) - GAP;
    const spaceAbove = rect.top - GAP;
    if (spaceBelow >= TOOLTIP_H_EST) {
      placement = "below";
      tooltipTop = rect.top + rect.height + GAP;
    } else if (spaceAbove >= TOOLTIP_H_EST) {
      placement = "above";
      tooltipTop = rect.top - TOOLTIP_H_EST - GAP;
    } else {
      placement = "center";
      tooltipTop = Math.max(16, vh - TOOLTIP_H_EST - 16);
    }
  }

  // SVG mask: full-screen black with circular cutout around the target
  const cutout = phase === "spotlight" && rect
    ? {
        cx: rect.left + rect.width / 2,
        cy: rect.top + rect.height / 2,
        r: Math.max(rect.width, rect.height) / 2 + 12,
      }
    : null;

  return (
    <AnimatePresence>
      {/* ═══ WELCOME / DONE — centered compact card ═══════════════════ */}
      {(phase === "welcome" || phase === "done") && (
        <motion.div
          key="welcome-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10050] flex items-center justify-center bg-[#1A1A1A]/70 backdrop-blur-md px-4 py-6 overflow-y-auto overscroll-contain"
        >
          <motion.div
            initial={{ scale: 0.96, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            className="relative w-full max-w-md my-auto bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl shadow-2xl overflow-hidden"
          >
            <button
              onClick={handleComplete}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-[#F7F2EA] hover:bg-[#EFE6D6] transition-colors"
              aria-label="Close tour"
            >
              <X className="w-4 h-4 text-[#1A1A1A]/70" />
            </button>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

            <div className="px-6 py-7 text-center">
              <div className="flex justify-center mb-4 text-[#1A1A1A]">
                <JJLogoImage variant="light" size="sm" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EFE6D6] border border-[#B89555]/40 rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
                <span className="text-[#1A1A1A] text-xs font-medium">
                  {phase === "welcome" ? "Welcome Guide" : "You're all set"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-[#1A1A1A] mb-2">
                {phase === "welcome"
                  ? "Welcome to JBJ Global Real Estate"
                  : "Enjoy exploring the platform"}
              </h2>
              <p className="text-[#1A1A1A]/70 text-sm mb-5">
                {phase === "welcome"
                  ? "We'll highlight key icons right on the page so you know exactly where to tap."
                  : "You can restart this tour anytime from the help menu."}
              </p>

              {phase === "welcome" ? (
                <div className="space-y-2.5">
                  <Button
                    onClick={() => { setStepIdx(0); setPhase("spotlight"); }}
                    type="button"
                    className="w-full h-12 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-[#FDFBF7] font-semibold rounded-xl group border border-[#B89555]/40"
                  >
                    <Compass className="w-4 h-4 mr-2" />
                    <span className="flex-1 text-left">Start the quick tour</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                  <Button
                    onClick={handleComplete}
                    type="button"
                    variant="ghost"
                    className="w-full h-10 rounded-xl text-sm text-[#1A1A1A]/70"
                  >
                    Skip for now
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleComplete}
                  type="button"
                  className="w-full h-12 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-[#FDFBF7] font-semibold rounded-xl border border-[#B89555]/40"
                >
                  Done
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ═══ SPOTLIGHT — dim page with cutout around real on-page icon ═ */}
      {phase === "spotlight" && (
        <motion.div
          key="spotlight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10050] pointer-events-none"
        >
          {/* Dimmed backdrop with SVG cutout */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-auto"
            onClick={handleComplete}
            aria-hidden
          >
            <defs>
              <mask id="jbj-tour-mask">
                <rect width="100%" height="100%" fill="white" />
                {cutout && (
                  <circle cx={cutout.cx} cy={cutout.cy} r={cutout.r} fill="black" />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(26,26,26,0.72)"
              mask="url(#jbj-tour-mask)"
              style={{ backdropFilter: "blur(2px)" } as any}
            />
          </svg>

          {/* Pulse ring around target */}
          {cutout && step?.pulse && (
            <motion.div
              className="absolute rounded-full border-2 border-[#B89555] pointer-events-none"
              style={{
                left: cutout.cx - cutout.r,
                top: cutout.cy - cutout.r,
                width: cutout.r * 2,
                height: cutout.r * 2,
              }}
              animate={{ scale: [1, 1.18, 1], opacity: [0.9, 0.3, 0.9] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          {/* Animated arrow pointing AT the icon */}
          {rect && placement !== "center" && (
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: rect.left + rect.width / 2 - 12,
                top: placement === "below" ? rect.top + rect.height + 2 : rect.top - 26,
                color: "#B89555",
              }}
              animate={{ y: placement === "below" ? [0, 6, 0] : [0, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                {placement === "below" ? (
                  <path d="M12 3v15m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M12 21V6m0 0l-6 6m6-6l6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </motion.div>
          )}

          {/* Tooltip card */}
          <motion.div
            key={`tip-${stepIdx}`}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute pointer-events-auto bg-[#FDFBF7] border border-[#B89555]/40 rounded-2xl shadow-2xl"
            style={{ left: tooltipLeft, top: tooltipTop, width: TOOLTIP_W }}
          >
            <div className="px-5 pt-4 pb-4">
              {/* Progress */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  {SPOTLIGHT_STEPS.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1 rounded-full transition-all ${i === stepIdx ? "w-6 bg-[#1A1A1A]" : i < stepIdx ? "w-3 bg-[#1A1A1A]/40" : "w-3 bg-[#EFE6D6]"}`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleComplete}
                  className="p-1.5 rounded-full hover:bg-[#F7F2EA] transition-colors"
                  aria-label="Close tour"
                >
                  <X className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                </button>
              </div>

              <h3 className="text-base font-semibold text-[#1A1A1A] mb-1.5">{step.title}</h3>
              <p className="text-sm text-[#1A1A1A]/75 leading-relaxed mb-4">{step.description}</p>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prev}
                  disabled={stepIdx === 0}
                  className="h-9 px-3 text-[#1A1A1A]/70 disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <span className="text-[11px] text-[#1A1A1A]/60 tabular-nums">
                  {stepIdx + 1} / {SPOTLIGHT_STEPS.length}
                </span>
                <Button
                  type="button"
                  onClick={next}
                  className="h-9 px-4 bg-[#1A1A1A] hover:bg-[#1A1A1A]/90 text-[#FDFBF7] border border-[#B89555]/40"
                >
                  {stepIdx + 1 === SPOTLIGHT_STEPS.length ? "Finish" : "Next"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuidedTour;
