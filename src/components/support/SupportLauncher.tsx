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
      id: "chat-support",
      label: "Chat Support",
      description: "Talk to a JBJ agent",
      responseTime: "",
      Icon: MessageSquare,
      action: () => {
        closeAfter();
        window.dispatchEvent(new CustomEvent("jbj:open-chat-support"));
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
      label: "Free Voice Call",
      description: "Speak to our concierge now",
      responseTime: "Live",
      Icon: PhoneCall,
      action: () => {
        closeAfter();
        window.dispatchEvent(new CustomEvent("jbj:open-voice-concierge"));
      },
    },
  ];
}

function useSuppressed() {
  // Hide launcher whenever a major support drawer or modal is open.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    const check = () => {
      const body = document.body;
      const conciergeOpen = !!document.querySelector("[data-jbj-concierge-open=\"true\"]");
      const chatOpen = !!document.querySelector("[data-jbj-chat-open=\"true\"]");
      const modalOpen = body.getAttribute("data-modal-open") === "true";
      setHidden(conciergeOpen || chatOpen || modalOpen);
    };
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.body, { attributes: true, subtree: true, attributeFilter: ["data-jbj-concierge-open", "data-jbj-chat-open", "data-modal-open"] });
    return () => obs.disconnect();
  }, []);
  return hidden;
}

export default function SupportLauncher() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const channels = useChannels(close);
  const hidden = useSuppressed();

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
      {/* ============== MOBILE: floating star (bottom-right) ============== */}
      <div className="md:hidden fixed bottom-5 right-5 z-[60]" data-no-contrast-guard>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="scrim"
                className="fixed inset-0 bg-[#0F0F0F]/60 backdrop-blur-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                key="orbs"
                className="absolute bottom-16 right-0 flex max-h-[calc(100dvh-7rem)] w-[260px] flex-col gap-2 overflow-y-auto rounded-2xl p-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
                    border border-[#D4B896]/45 bg-[#1A1A1A]/70 text-[#FDFBF7]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Free agent call
                  </span>
                  <button
                    onClick={close}
                    aria-label="Close"
                    className="h-7 w-7 inline-flex items-center justify-center rounded-full
                      border border-[#D4B896]/45 bg-[#1A1A1A]/70 text-[#E2C9A0]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {channels.map((c) => (
                  <div key={c.id} className="rounded-xl">
                    <ChannelCard channel={c} compact onActivate={close} />
                  </div>
                ))}

              </motion.div>
            </>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Talk to JBJ support"
          data-no-contrast-guard
          whileTap={{ scale: 0.94 }}
          className="relative h-14 w-14 rounded-full inline-flex items-center justify-center
            border border-[#D4B896]/70 bg-[#1A1A1A] text-[#E2C9A0]
            shadow-[0_10px_28px_rgba(0,0,0,0.35),0_0_0_4px_rgba(226,201,160,0.12)]
            hover:bg-[#222] transition-colors"
        >
          {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
          {!open && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#1A1A1A] animate-pulse" />
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
          className="group fixed right-0 top-1/2 pointer-events-auto flex items-center gap-2 px-2 py-4 rounded-l-xl
            border border-r-0 border-gold/70 bg-primary text-primary-foreground
            shadow-[-10px_0_28px_hsl(var(--foreground)/0.34),0_0_0_1px_hsl(var(--gold)/0.24)] transform-gpu transition-[box-shadow,border-color] duration-200
            hover:border-gold
            hover:shadow-[-18px_0_42px_hsl(var(--foreground)/0.44),0_0_34px_hsl(var(--gold)/0.58)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          style={{ writingMode: "vertical-rl", transform: "translateY(-50%)", color: "hsl(var(--primary-foreground))", WebkitTextFillColor: "hsl(var(--primary-foreground))" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "hsl(var(--primary-foreground))";
            e.currentTarget.style.backgroundColor = "hsl(var(--primary))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "hsl(var(--primary-foreground))";
            e.currentTarget.style.backgroundColor = "hsl(var(--primary))";
          }}
        >
          <Sparkles className="h-3.5 w-3.5 rotate-90" style={{ color: "hsl(var(--gold-light))", stroke: "hsl(var(--gold-light))" }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "hsl(var(--primary-foreground))", WebkitTextFillColor: "hsl(var(--primary-foreground))" }}>Talk to us</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Slide-out panel */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="dscrim"
                className="fixed inset-0 bg-transparent pointer-events-auto"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                key="dpanel"
                initial={{ opacity: 0, x: 18, y: "-50%", scale: 0.985 }}
                animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
                exit={{ opacity: 0, x: 18, y: "-50%", scale: 0.985 }}
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
                data-no-contrast-guard
                className="fixed right-14 top-[calc(50%+24px)] flex max-h-[calc(100dvh-150px)] w-[300px] flex-col overflow-hidden pointer-events-auto
                  rounded-2xl border border-gold bg-background text-foreground
                  shadow-[0_30px_60px_hsl(var(--foreground)/0.25),0_0_34px_hsl(var(--gold)/0.18)] p-3"
              >
                <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
                    border border-gold bg-raised text-ink">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Call our agent now · Free
                  </span>
                  <button
                    onClick={close}
                    aria-label="Close"
                    className="h-7 w-7 inline-flex items-center justify-center rounded-full
                      border border-gold bg-raised text-ink hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="jbj-gold-animated-border min-h-0 flex-1 overflow-hidden rounded-xl p-[1.5px]">
                  <div className="min-h-0 flex-1 h-full space-y-2 overflow-y-auto rounded-[10px] bg-background p-2">
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
