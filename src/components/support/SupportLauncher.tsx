/**
 * SupportLauncher — always-visible 24/7 support entry point.
 *  • Mobile: bottom-right gold-ringed star, taps to fan out 4 channel orbs.
 *  • Desktop (md+): vertical "Talk to us" tag pinned to right edge, slides
 *    out a 280px panel with the 4 channel cards.
 * Both surfaces dispatch the same window events that AIConcierge / AIChatWidget
 * listen for. Hides itself when those drawers are open.
 */
import { useEffect, useState, useCallback } from "react";
import { Sparkles, MessageSquare, MessageCircle, Phone, PhoneCall, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import ChannelCard, { ChannelDef } from "./ChannelCard";

function useChannels(closeAfter: () => void): ChannelDef[] {
  return [
    {
      id: "concierge",
      label: "AI Concierge",
      description: "Smart shortcuts & guided filters",
      responseTime: "Instant",
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
      responseTime: "Replies in ~2 min",
      Icon: MessageSquare,
      action: () => {
        closeAfter();
        window.dispatchEvent(new CustomEvent("jbj:open-chat-support"));
      },
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      description: "Reply in minutes",
      responseTime: "24/7",
      Icon: MessageCircle,
      href: getWhatsAppUrl(),
      external: true,
    },
    {
      id: "call",
      label: "Call an Agent",
      description: CONTACT_INFO.phone,
      responseTime: "Avg 30s pickup",
      Icon: Phone,
      href: getCallUrl(),
    },
    {
      id: "voice-ai",
      label: "Voice AI Call · Free",
      description: "Speak with our AI agent now",
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) document.body.setAttribute("data-jbj-support-open", "true");
    else document.body.removeAttribute("data-jbj-support-open");
    return () => document.body.removeAttribute("data-jbj-support-open");
  }, [open]);

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
                className="fixed inset-0 bg-[#1A1A1A]/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                key="orbs"
                className="absolute bottom-16 right-0 flex flex-col gap-2 w-[240px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="flex items-center justify-between px-1 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
                    border border-[#D4B896]/45 bg-[#1A1A1A]/70 text-[#FDFBF7]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    24/7 · Free
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
                  <div key={c.id} className="bg-[#FDFBF7] border border-[#B89555]/45 rounded-xl">
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
      <div className="hidden md:block fixed right-0 top-1/2 z-[60]" data-no-contrast-guard>
        {/* Tag */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Talk to JBJ support"
          className="group relative flex items-center gap-2 px-2 py-4 rounded-l-xl
            border border-r-0 border-[#B89555]/70 bg-[#1A1A1A] text-[#FDFBF7]
            shadow-[-8px_0_24px_rgba(0,0,0,0.30)] transform-gpu transition-all duration-200
            hover:bg-[#1A1A1A] hover:text-[#FDFBF7] hover:border-[#B89555]
            hover:-translate-x-0.5 hover:shadow-[-14px_0_36px_rgba(0,0,0,0.40),0_0_30px_rgba(184,149,85,0.55)]"
          style={{ writingMode: "vertical-rl", transform: "translateY(-50%)" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#E2C9A0] rotate-90" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#FDFBF7]">Talk to us</span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        {/* Slide-out panel */}
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="dscrim"
                className="fixed inset-0 bg-transparent"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={close}
              />
              <motion.div
                key="dpanel"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
                data-no-contrast-guard
                className="fixed right-14 top-1/2 -translate-y-1/2 w-[300px] max-h-[calc(100dvh-128px)] overflow-y-auto
                  rounded-2xl border border-gold/55 bg-background text-foreground
                  shadow-[0_30px_60px_hsl(var(--foreground)/0.25)] p-3 space-y-2"
              >
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold
                    border border-gold/45 bg-secondary text-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Call our agent now · Free
                  </span>
                  <button
                    onClick={close}
                    aria-label="Close"
                    className="h-7 w-7 inline-flex items-center justify-center rounded-full
                      border border-gold/45 text-foreground hover:bg-accent"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {channels.map((c) => (
                  <ChannelCard key={c.id} channel={c} onActivate={close} />
                ))}

              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
