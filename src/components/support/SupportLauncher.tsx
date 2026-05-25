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
                className="fixed inset-0 bg-[#0F0F0F]/25"
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
          data-allow-dark-cta
          data-no-contrast-guard
          className="allow-white group fixed right-0 top-1/2 pointer-events-auto flex items-center gap-2 px-2 py-4 rounded-l-xl
            border border-r-0 border-[#B89555]/70 bg-[#102540] text-white
            shadow-[-10px_0_28px_rgba(0,0,0,0.34),0_0_0_1px_rgba(184,149,85,0.24)] transform-gpu transition-[background-color,box-shadow,border-color] duration-200
            hover:bg-[#475569] hover:border-[#B89555]
            hover:shadow-[-18px_0_42px_rgba(0,0,0,0.44),0_0_34px_rgba(184,149,85,0.58)]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#102540]"
          style={{ writingMode: "vertical-rl", transform: "translateY(-50%)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          <Sparkles className="h-3.5 w-3.5 rotate-90 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          <span className="allow-white text-[11px] font-semibold uppercase tracking-[0.22em] text-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Contact us</span>
          <span className="h-2 w-2 rounded-full bg-[#B89555] animate-pulse" />
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
                className="jbj-gold-animated-border fixed right-14 top-1/2 w-[300px] rounded-2xl p-[1.5px] pointer-events-auto
                  shadow-[0_30px_60px_hsl(var(--foreground)/0.25),0_0_34px_hsl(var(--gold)/0.22)]"
              >
                <div className="flex flex-col overflow-hidden rounded-[14px] bg-background text-foreground p-3">
                  <div className="flex shrink-0 items-center justify-between gap-2 px-1 pb-3">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
                      border border-gold bg-raised text-ink">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Call our agent now · Free
                    </span>
                    <button
                      onClick={close}
                      aria-label="Close"
                      className="h-7 w-7 inline-flex items-center justify-center rounded-full
                        border border-gold bg-raised text-[#B89555] hover:bg-[#1A1A1A] hover:text-[#B89555] transition-colors"
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
