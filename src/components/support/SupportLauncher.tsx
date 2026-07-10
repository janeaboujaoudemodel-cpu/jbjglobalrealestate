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
      id: "advisor",
      label: "Speak to an advisor",
      description: "Scheduled callback from a senior advisor",
      responseTime: "Same day · Mon–Sat",
      Icon: PhoneCall,
      action: () => {
        closeAfter();
        window.dispatchEvent(new CustomEvent("jbj:open-advisor"));
      },
    },
    {
      id: "callback",
      label: "Request a callback",
      description: "Leave your number — we'll call you back",
      responseTime: "Within 1 business hour",
      Icon: Phone,
      action: () => {
        closeAfter();
        window.dispatchEvent(new CustomEvent("jbj:open-advisor"));
      },
    },
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
      label: "Call now",
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
  // Keep the Contact Us edge tag persistent across every page. It should not
  // disappear because another support surface briefly mounted/opened during load.
  // Only suppress it behind blocking modals.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const check = () => {
      const body = document.body;
      const modalOpen = body.getAttribute("data-modal-open") === "true";
      setHidden(modalOpen);
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-modal-open"] });
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
      {/* ============== MOBILE / TABLET (phone icon trigger + emerald panel — matches desktop) ============== */}
      <div className="fixed bottom-5 right-4 z-[60] block lg:hidden pointer-events-none" data-no-contrast-guard>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="mscrim"
                className="fixed inset-0 bg-[#0F0F0F]/20 pointer-events-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                key="mpanel"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                data-no-contrast-guard
                className="jbj-emerald-animated-border absolute bottom-14 right-0 w-[min(320px,calc(100vw-2rem))] max-h-[calc(100dvh-8rem)] rounded-2xl p-[2px] pointer-events-auto shadow-[0_30px_60px_rgba(0,0,0,0.35),0_0_34px_rgba(16,185,129,0.35)]"
              >
                <div
                  data-emerald="true"
                  data-allow-dark-cta
                  data-no-contrast-guard
                  className="jj-emerald-metallic allow-white flex flex-col overflow-hidden rounded-[14px] p-3 text-white max-h-[calc(100dvh-8.5rem)]"
                >
                  <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-3 mb-2">
                    <span
                      className="allow-white inline-flex h-11 items-center gap-1.5 px-4 rounded-full text-[11px] font-semibold text-white"
                      style={{
                        color: "#FFFFFF",
                        WebkitTextFillColor: "#FFFFFF",
                        backgroundImage: "var(--jj-emerald-ombre)",
                        border: 0,
                        boxShadow: "none",
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Call Our Agent
                    </span>
                    <button
                      onClick={close}
                      aria-label="Close"
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className="allow-white h-11 w-11 min-w-11 inline-flex items-center justify-center rounded-full text-white transition-[filter] hover:brightness-110"
                      style={{
                        color: "#FFFFFF",
                        WebkitTextFillColor: "#FFFFFF",
                        backgroundImage: "var(--jj-emerald-ombre)",
                        border: 0,
                        boxShadow: "none",
                      }}
                    >
                      <X className="h-4 w-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    </button>
                  </div>

                  <div
                    className="grid w-full grid-cols-[minmax(0,1fr)] auto-rows-[86px] items-stretch justify-stretch gap-2.5 overflow-y-auto overflow-x-hidden pr-0.5"
                    style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
                  >
                    {channels.map((c) => (
                      <div
                        key={c.id}
                        className="block h-[86px] w-full min-w-0 max-w-full self-stretch justify-self-stretch [&>*]:!block [&>*]:!h-full [&>*]:!w-full [&>*]:!min-w-0 [&>*]:!max-w-full [&>*]:!box-border"
                        style={{ width: "100%", inlineSize: "100%" }}
                      >
                        <ChannelCard channel={c} onActivate={close} />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close support" : "Contact us"}
          data-surface="emerald"
          data-allow-dark-cta
          data-no-contrast-guard
          whileTap={{ scale: 0.96 }}
          className="allow-white jj-emerald-metallic pointer-events-auto relative inline-flex items-center justify-center h-12 w-12 rounded-full border text-white shadow-[0_10px_28px_rgba(6,78,59,0.35)] transition-colors"
          style={{
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            borderColor: "rgba(52,211,153,0.55)",
            padding: 0,
            gap: 0,
          }}
        >
          {open ? (
            <X aria-hidden style={{ color: "#FFFFFF", stroke: "#FFFFFF", width: 18, height: 18, display: "block" }} />
          ) : (
            <>
              {/* Outer pulse ring */}
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-emerald-300/70 animate-ping" />
              <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-emerald-400/40 animate-ping" style={{ animationDelay: "0.4s" }} />
              <Phone aria-hidden style={{ color: "#FFFFFF", stroke: "#FFFFFF", width: 18, height: 18, display: "block", position: "relative", zIndex: 1 }} />
              <span
                className="pointer-events-none rounded-full bg-emerald-300 animate-pulse ring-2 ring-[#064E3B]"
                style={{ position: "absolute", top: 2, right: 2, width: 8, height: 8, zIndex: 2 }}
              />
            </>
          )}
        </motion.button>

      </div>



      {/* ============== DESKTOP: vertical edge tag (right) ============== */}
      <div className="hidden lg:block fixed inset-0 z-[60] pointer-events-none" data-no-contrast-guard>
        {/* Tag */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Talk to JBJ support"
          data-surface="dark"
          data-allow-dark-cta
          data-no-contrast-guard
          className={`allow-white jj-emerald-metallic group fixed right-0 top-1/2 flex items-center gap-2 px-2 py-4 rounded-l-xl
 text-white transform-gpu pointer-events-auto
 transition-opacity duration-300
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#064E3B]
 ${overHero ? "opacity-70" : "opacity-100"}
 `}

          style={{
            position: "fixed",
            right: 0,
            left: "auto",
            top: "50%",
            zIndex: 60,
            writingMode: "vertical-rl",
            transform: "translate3d(0, -50%, 0)",
            backgroundImage: "var(--jj-emerald-ombre)",
            border: 0,
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            boxShadow: "0 10px 24px -14px rgba(6,78,59,0.92), inset 0 1px 0 rgba(255,255,255,0.14)",
          }}

        >
          <Sparkles className="h-3.5 w-3.5 rotate-90 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          {/* Label hidden on portrait tablet & phone — icon only there.
              Visible from large landscape tablet / desktop up. */}
          <span className="inline allow-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.22em] text-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Contact Us</span>
          <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
          {/* Outer pulse rings for attention */}
          <span aria-hidden className="pointer-events-none absolute inset-0 rounded-l-xl ring-2 ring-emerald-300/60 animate-ping" />
          <span aria-hidden className="pointer-events-none absolute -inset-1 rounded-l-xl ring-2 ring-emerald-400/30 animate-ping" style={{ animationDelay: "0.5s" }} />
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
                className="jbj-emerald-animated-border fixed right-11 sm:right-14 top-1/2 w-[min(320px,calc(100vw-4rem))] max-h-[calc(100dvh-6rem)] rounded-2xl p-[2px] pointer-events-auto shadow-[0_30px_60px_rgba(0,0,0,0.35),0_0_34px_rgba(16,185,129,0.35)]"
              >
                <div
                  data-emerald="true"
                  data-allow-dark-cta
                  data-no-contrast-guard
                  className="jj-emerald-metallic allow-white flex flex-col overflow-hidden rounded-[14px] p-3 text-white max-h-[calc(100dvh-6.5rem)]"
                >
                  <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-3 mb-2">
                    <span
                      className="allow-white inline-flex h-11 items-center gap-1.5 px-4 rounded-full text-[11px] font-semibold text-white"
                      style={{
                        color: "#FFFFFF",
                        WebkitTextFillColor: "#FFFFFF",
                        backgroundImage: "var(--jj-emerald-ombre)",
                        border: 0,
                        boxShadow: "none",
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                      Call Our Agent
                    </span>
                    <button
                      onClick={close}
                      aria-label="Close"
                      data-allow-dark-cta
                      data-no-contrast-guard
                      className="allow-white h-11 w-11 min-w-11 inline-flex items-center justify-center rounded-full text-white transition-[filter] hover:brightness-110"
                      style={{
                        color: "#FFFFFF",
                        WebkitTextFillColor: "#FFFFFF",
                        backgroundImage: "var(--jj-emerald-ombre)",
                        border: 0,
                        boxShadow: "none",
                      }}
                    >
                      <X className="h-4 w-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    </button>
                  </div>

                  <div
                    className="grid w-full grid-cols-[minmax(0,1fr)] auto-rows-[86px] items-stretch justify-stretch gap-2.5 overflow-y-auto overflow-x-hidden pr-0.5"
                    style={{ gridTemplateColumns: "minmax(0, 1fr)" }}
                  >
                    {channels.map((c) => (
                      <div
                        key={c.id}
                        className="block h-[86px] w-full min-w-0 max-w-full self-stretch justify-self-stretch [&>*]:!block [&>*]:!h-full [&>*]:!w-full [&>*]:!min-w-0 [&>*]:!max-w-full [&>*]:!box-border"
                        style={{ width: "100%", inlineSize: "100%" }}
                      >
                        <ChannelCard channel={c} onActivate={close} />
                      </div>
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
