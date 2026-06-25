/**
 * SupportLauncher — always-visible 24/7 support entry point.
 *  • Mobile: bottom-right gold-ringed star, taps to fan out 4 channel orbs.
 *  • Desktop (md+): vertical "Talk to us" tag pinned to right edge, slides
 *    out a 280px panel with the 4 channel cards.
 * Both surfaces dispatch the same window events that AIConcierge / AIChatWidget
 * listen for. Hides itself when those drawers are open.
 */
import { useEffect, useState, useCallback, useLayoutEffect } from "react";
import { Sparkles, MessageSquare, MessageCircle, Phone, PhoneCall, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import ChannelCard, { ChannelDef } from "./ChannelCard";

function useChannels(closeAfter: () => void): ChannelDef[] {
  return [
    {
      id: "concierge",
      label: "JBJ Concierge",
      description: "Smart shortcuts & guided filters",
      responseTime: "Instant · 24/7",
      Icon: Sparkles,
      action: () => {
        closeAfter();
        window.dispatchEvent(new CustomEvent("jbj:open-concierge"));
      },
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      description: "Message us 24/7",
      responseTime: "",
      Icon: MessageCircle,
      href: getWhatsAppUrl(),
      external: true,
    },
    {
      id: "call",
      label: "Call Us",
      description: CONTACT_INFO.phone,
      responseTime: "",
      Icon: Phone,
      href: getCallUrl(),
    },
    {
      id: "voice-ai",
      label: "Voice Call Free",
      description: "Speak with our agent now live",
      responseTime: "",
      Icon: PhoneCall,
      action: () => {
        closeAfter();
        window.dispatchEvent(new CustomEvent("jbj:open-voice-concierge"));
      },
    },

  ];
}

function useSuppressed() {
  // Hide launcher whenever a major support drawer or modal is open,
  // and on all internal owner/admin workspaces (no consumer launcher there).
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const check = () => {
      const body = document.body;
      const conciergeOpen = !!document.querySelector("[data-jbj-concierge-open=\"true\"]");
      const chatOpen = !!document.querySelector("[data-jbj-chat-open=\"true\"]");
      const modalOpen = body.getAttribute("data-modal-open") === "true";
      const path = window.location.pathname || "";
      const internal =
        path.startsWith("/owner") ||
        path.startsWith("/admin") ||
        path.startsWith("/broker") ||
        path.startsWith("/developers-portal") ||
        path.startsWith("/developer-hub");
      setHidden(conciergeOpen || chatOpen || modalOpen || internal);
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-jbj-concierge-open", "data-jbj-chat-open", "data-modal-open"] });
    window.addEventListener("popstate", check);
    return () => {
      obs.disconnect();
      window.removeEventListener("popstate", check);
    };
  }, []);
  return hidden;
}

function useOverHero() {
  // STRICT hero rule (per product definition):
  //   A "hero section" = a section explicitly marked [data-hero-dark]
  //   AND containing a real <video> element (i.e. cinematic video hero).
  // Pages that simply put a tool / calculator / form at the top (e.g.
  //   /mortgage-calculator, /contact, dashboard tools) are NOT heroes —
  //   so the launcher must stay in its normal navy-blue style there.
  // Default is the safe navy variant.
  // Default to FALSE so the navy tag renders immediately on routes without a
  // qualifying hero (the vast majority). Only initialise to TRUE when a hero
  // video is already in the DOM at mount, which prevents both:
  //   (a) the initial flash of the tag before fading out over a homepage hero
  //   (b) the persistent fade-in/out flicker on anonymous sessions caused by
  //       tiny layout shifts crossing the threshold during first paint.
  const [overHero, setOverHero] = useState<boolean>(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return false;
    return !!document.querySelector("[data-hero-dark] video");
  });
  useEffect(() => {
    // If no hero video exists for this route, skip the listener entirely.
    if (typeof document === "undefined") return;
    if (!document.querySelector("[data-hero-dark] video")) {
      if (overHero) setOverHero(false);
      return;
    }

    let raf = 0;
    const HYSTERESIS = 6; // px buffer to avoid flip-flop on micro layout shifts
    const check = () => {
      raf = 0;
      const vh = window.innerHeight;
      const heroes = document.querySelectorAll<HTMLElement>("[data-hero-dark]");
      let hit = false;
      heroes.forEach((el) => {
        if (!el.querySelector("video")) return;
        const r = el.getBoundingClientRect();
        if (r.top <= 0
          ? r.bottom >= vh * 0.85 + HYSTERESIS
          : r.top <= vh * 0.15 - HYSTERESIS) hit = true;
      });
      setOverHero((prev) => (prev === hit ? prev : hit));
    };
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(check);
    };

    schedule();
    const t1 = window.setTimeout(schedule, 100);
    const t2 = window.setTimeout(schedule, 500);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return overHero;
}



export default function SupportLauncher() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const channels = useChannels(close);
  const hidden = useSuppressed();
  const overHero = useOverHero();

  useLayoutEffect(() => {
    if (!open) return;
    document.body.setAttribute("data-jbj-support-open", "true");
    return () => document.body.removeAttribute("data-jbj-support-open");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (hidden) return null;

  return (
    <>
      {/* ============== MOBILE: horizontal "Contact us" pill (bottom-right) ============== */}
      <div className="md:hidden fixed bottom-5 right-4 z-[60]" data-no-contrast-guard>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="scrim"
                className="fixed inset-0 bg-[#0F0F0F]/25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                key="orbs"
                className="absolute bottom-12 right-0 flex max-h-[calc(100dvh-7rem)] w-[280px] flex-col gap-2 overflow-hidden rounded-2xl p-3"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  background: "linear-gradient(180deg, rgba(247,242,234,0.96) 0%, rgba(239,230,214,0.94) 100%)",
                  backdropFilter: "blur(18px) saturate(160%)",
                  WebkitBackdropFilter: "blur(18px) saturate(160%)",
                  border: "1px solid rgba(184,149,85,0.45)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.55)",
                }}
              >
                <div className="flex items-center justify-between gap-2 pb-2 mb-1 border-b border-[#B89555]/25">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg jj-surface-emerald text-white shrink-0">
                      <Sparkles className="h-3.5 w-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    </span>
                    <span className="text-[13px] font-semibold tracking-tight text-[#1A1A1A] whitespace-nowrap truncate">JBJ Concierge</span>
                  </div>
                  <button
                    onClick={close}
                    aria-label="Close"
                    className="h-7 w-7 shrink-0 inline-flex items-center justify-center rounded-full border border-[#B89555]/45 bg-white/60 text-[#1A1A1A]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto pr-0.5">
                  {channels.map((c) => (
                    <div key={c.id} className="rounded-xl">
                      <ChannelCard channel={c} compact onActivate={close} />
                    </div>
                  ))}
                </div>
              </motion.div>

            </>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close support" : "Contact us"}
          data-surface="dark"
          data-allow-dark-cta
          data-no-contrast-guard
          whileTap={{ scale: 0.94 }}
          className="allow-white relative inline-flex items-center justify-center h-11 w-11 rounded-full bg-[#0A0A0A] hover:bg-[#1F1F1F] border border-[#B89555]/70 text-white shadow-[0_10px_28px_rgba(0,0,0,0.35),0_0_0_1px_rgba(184,149,85,0.24)] transition-colors"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          {open ? (
            <X className="h-4 w-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          ) : (
            <>
              <Phone className="h-4 w-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full jj-surface-emerald ring-2 ring-[#0A0A0A] animate-pulse" />
            </>
          )}
        </motion.button>
      </div>


      {/* ============== DESKTOP: vertical edge tag (right) ============== */}
      <div className="hidden md:block fixed inset-0 z-[60] pointer-events-none" data-no-contrast-guard>
        {/* Tag */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Talk to JBJ support"
          data-surface="dark"
          data-allow-dark-cta
          data-no-contrast-guard
          className={`allow-white jj-emerald-metallic group fixed right-0 top-1/2 flex items-center gap-2 px-2 py-4 rounded-l-xl
 border border-r-0 text-white transform-gpu pointer-events-auto
 transition-opacity duration-300
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#064E3B]
 ${overHero ? "opacity-70" : "opacity-100"}
 `}

          style={{
            writingMode: "vertical-rl",
            transform: "translateY(-50%)",
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            borderColor: "rgba(52,211,153,0.55)",
          }}

        >
          <Sparkles className="h-3.5 w-3.5 rotate-90 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          {/* Label hidden on portrait tablet & phone — icon only there.
              Visible from large landscape tablet / desktop up. */}
          <span className="hidden md:inline allow-white text-[11px] font-semibold uppercase tracking-[0.22em] text-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Contact Us</span>
          <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
        </button>


        {/* Slide-out panel */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="dscrim"
                className="fixed inset-0 bg-[#0F0F0F]/20 pointer-events-auto"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                key="dpanel"
                initial={{ opacity: 0, x: 18, y: "-50%", scale: 0.99 }}
                animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
                exit={{ opacity: 0, x: 18, y: "-50%", scale: 0.99 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                data-no-contrast-guard
                className="jbj-gold-animated-border fixed right-14 top-1/2 w-[300px] rounded-2xl p-[1.5px] pointer-events-auto shadow-[0_30px_60px_hsl(var(--foreground)/0.25),0_0_34px_hsl(var(--gold)/0.22)]"
              >
                <div className="flex flex-col overflow-hidden rounded-[14px] bg-background text-foreground p-3">
                  <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold border border-gold bg-raised text-ink">
                      <span className="h-1.5 w-1.5 rounded-full jj-surface-emerald animate-pulse" />
                      Call our agent now · Free
                    </span>
                    <button
                      onClick={close}
                      aria-label="Close"
                      className="h-7 w-7 inline-flex items-center justify-center rounded-full border border-gold bg-raised text-[#B89555] hover:bg-[#1A1A1A] hover:text-[#B89555] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-3 rounded-xl p-1">
                    {channels.map((c) => (
                      <ChannelCard key={c.id} channel={c} onActivate={close} />
                    ))}
                  </div>
                </div>
              </motion.div>


            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
