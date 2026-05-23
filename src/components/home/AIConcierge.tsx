/**
 * AIConcierge — premium streaming chat drawer that guides users through the JBJ platform.
 * Right sheet on desktop, bottom sheet on mobile. Glass-on-dark to match the hero.
 * Calls supabase/functions/ai-concierge (Lovable AI Gateway, streaming SSE).
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, MessageCircle, Loader2, MessageSquare, Phone, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ConciergeGate from "@/components/concierge/ConciergeGate";
import ConciergeActionCard, { parseAction } from "@/components/concierge/ConciergeActionCard";
import ChannelCard from "@/components/support/ChannelCard";
import { useConciergeVerification } from "@/hooks/useConciergeVerification";


type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "How do I find Marina apartments under 2M AED?",
  "Tell me about the Golden Visa",
  "Which calculators can help me estimate ROI?",
  "How do I book a free consultation?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-concierge`;

export default function AIConcierge({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isVerified, verified } = useConciergeVerification();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle body attribute so SupportLauncher hides while concierge is open.
  useEffect(() => {
    if (open) document.body.setAttribute("data-jbj-concierge-open", "true");
    else document.body.removeAttribute("data-jbj-concierge-open");
    return () => document.body.removeAttribute("data-jbj-concierge-open");
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const send = useCallback(async (text: string) => {
    const userMsg: Msg = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setDraft("");
    setStreaming(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
      });
      if (resp.status === 429) { toast.error("Concierge is busy — try again in a moment."); setStreaming(false); return; }
      if (resp.status === 402) { toast.error("Concierge credits exhausted."); setStreaming(false); return; }
      if (!resp.ok || !resp.body) { toast.error("Concierge unavailable."); setStreaming(false); return; }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || !line.trim()) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Concierge connection failed.");
    } finally {
      setStreaming(false);
    }
  }, [messages]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = draft.trim();
    if (!t || streaming) return;
    send(t);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            data-no-contrast-guard
            className="fixed z-[201] flex flex-col
              inset-x-0 bottom-0 h-[88vh] rounded-t-3xl
              sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:w-[440px] sm:rounded-none sm:rounded-l-3xl
              bg-gradient-to-br from-[hsl(32,28%,11%)] via-[hsl(33,27%,13%)] to-[hsl(33,28%,9%)]
              border-l border-t sm:border-t-0 border-[#D4B896]/35"
            style={{ boxShadow: "0 -20px 60px rgba(0,0,0,0.55), -20px 0 60px rgba(0,0,0,0.55)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D4B896]/20">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D4B896]/40"
                  style={{ background: "rgba(253,251,247,0.08)" }}
                >
                  <Sparkles className="h-5 w-5 text-[#E2C9A0]" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#FDFBF7] leading-tight">AI Concierge</div>
                  <div className="text-[11px] text-[#FDFBF7]/60 leading-tight">JBJ Global Real Estate</div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close concierge"
                data-no-contrast-guard
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#FDFBF7]/70 hover:text-[#FDFBF7] hover:bg-white/10 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
              {!isVerified && (
                <ConciergeGate onVerified={() => { /* state auto-updates via hook */ }} />
              )}
              {isVerified && messages.length === 0 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2 py-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4B896]/40"
                      style={{ background: "rgba(253,251,247,0.08)" }}>
                      <Sparkles className="h-6 w-6 text-[#E2C9A0]" />
                    </div>
                    <h3 className="text-[18px] font-semibold text-[#FDFBF7]">Welcome back{verified?.firstName ? `, ${verified.firstName}` : ""}</h3>
                    <p className="text-[13px] text-[#FDFBF7]/65 max-w-[300px] mx-auto leading-relaxed">
                      Ask anything — I'll guide you with one-tap shortcuts.
                    </p>
                  </div>

                  {/* Premium channel switcher — Concierge / Chat Support / WhatsApp / Call */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Concierge (active) */}
                    <div
                      data-no-contrast-guard
                      className="relative flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl
                        border border-[#E2C9A0]/70 bg-[rgba(226,201,160,0.10)]"
                    >
                      <div className="flex items-center gap-2 text-[#E2C9A0]">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-[12.5px] font-semibold text-[#FDFBF7]">AI Concierge</span>
                      </div>
                      <span className="text-[11px] text-[#FDFBF7]/60 leading-snug">Instant answers · 24/7</span>
                      <span className="absolute top-2 right-2 text-[9.5px] tracking-[0.14em] uppercase font-semibold text-[#E2C9A0]">Active</span>
                    </div>
                    {/* Chat Support */}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => window.dispatchEvent(new CustomEvent('jbj:open-chat-support')), 250);
                      }}
                      data-no-contrast-guard
                      className="group flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl text-left
                        border border-[#D4B896]/35 bg-white/[0.04] hover:bg-white/[0.10] hover:border-[#E2C9A0]/60 transition-all"
                    >
                      <div className="flex items-center gap-2 text-[#E2C9A0]">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-[12.5px] font-semibold text-[#FDFBF7]">Chat Support</span>
                      </div>
                      <span className="text-[11px] text-[#FDFBF7]/60 leading-snug">Talk to a JBJ agent</span>
                    </button>
                    {/* WhatsApp */}
                    <a
                      href={getWhatsAppUrl()}
                      target="_blank"
                      rel="noreferrer"
                      data-no-contrast-guard
                      className="group flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl
                        border border-[#D4B896]/35 bg-white/[0.04] hover:bg-white/[0.10] hover:border-[#E2C9A0]/60 transition-all"
                    >
                      <div className="flex items-center gap-2 text-[#E2C9A0]">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-[12.5px] font-semibold text-[#FDFBF7]">WhatsApp</span>
                      </div>
                      <span className="text-[11px] text-[#FDFBF7]/60 leading-snug">Reply in minutes</span>
                    </a>
                    {/* Call */}
                    <a
                      href={getCallUrl()}
                      data-no-contrast-guard
                      className="group flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl
                        border border-[#D4B896]/35 bg-white/[0.04] hover:bg-white/[0.10] hover:border-[#E2C9A0]/60 transition-all"
                    >
                      <div className="flex items-center gap-2 text-[#E2C9A0]">
                        <Phone className="h-4 w-4" />
                        <span className="text-[12.5px] font-semibold text-[#FDFBF7]">Call an Agent</span>
                      </div>
                      <span className="text-[11px] text-[#FDFBF7]/60 leading-snug">{CONTACT_INFO.phone}</span>
                    </a>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10.5px] uppercase tracking-[0.18em] font-semibold text-[#FDFBF7]/50 px-1">
                      Try asking
                    </div>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        data-no-contrast-guard
                        className="w-full text-left px-4 py-3 rounded-xl text-[13px] text-[#FDFBF7]/90
                          border border-[#D4B896]/30 bg-white/[0.04] hover:bg-white/[0.10] hover:border-[#E2C9A0]/60
                          transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}


              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    data-no-contrast-guard
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed
                      ${m.role === "user"
                        ? "bg-[#E2C9A0] text-[#1A1A1A] rounded-br-md"
                        : "bg-white/[0.07] text-[#FDFBF7] border border-[#D4B896]/25 rounded-bl-md"}`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm prose-invert max-w-none
                        prose-p:my-1.5 prose-p:text-[#FDFBF7]
                        prose-a:text-[#E2C9A0] prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-[#FDFBF7] prose-ul:my-1.5 prose-li:my-0.5
                        prose-code:text-[#E2C9A0] prose-code:bg-white/5 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown
                          components={{
                            a: ({ href, children }) => {
                              if (href && href.startsWith("/")) {
                                return <Link to={href} onClick={onClose}>{children}</Link>;
                              }
                              return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
                            },
                          }}
                        >
                          {m.content || "…"}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}

              {streaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.07] border border-[#D4B896]/25">
                    <Loader2 className="h-4 w-4 animate-spin text-[#E2C9A0]" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer escalation + input */}
            <div className="border-t border-[#D4B896]/20 px-5 py-3 space-y-3">
              {messages.length > 0 && (
                <div className="flex items-center justify-between gap-2 text-[11px] text-[#FDFBF7]/55">
                  <span className="shrink-0">Switch channel</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        setTimeout(() => window.dispatchEvent(new CustomEvent('jbj:open-chat-support')), 250);
                      }}
                      data-no-contrast-guard
                      title="Chat Support"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#D4B896]/30 text-[#E2C9A0] hover:text-[#FDFBF7] hover:border-[#E2C9A0]/60 transition"
                    >
                      <MessageSquare className="h-3 w-3" /> Chat
                    </button>
                    <a
                      href={getWhatsAppUrl()}
                      target="_blank"
                      rel="noreferrer"
                      data-no-contrast-guard
                      title="WhatsApp"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#D4B896]/30 text-[#E2C9A0] hover:text-[#FDFBF7] hover:border-[#E2C9A0]/60 transition"
                    >
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </a>
                    <a
                      href={getCallUrl()}
                      data-no-contrast-guard
                      title="Call an agent"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#D4B896]/30 text-[#E2C9A0] hover:text-[#FDFBF7] hover:border-[#E2C9A0]/60 transition"
                    >
                      <Phone className="h-3 w-3" /> Call
                    </a>
                  </div>
                </div>
              )}

              <form onSubmit={onSubmit} className="relative">
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask the concierge…"
                  disabled={streaming}
                  data-no-contrast-guard
                  className="w-full h-12 pl-4 pr-12 rounded-xl text-[14px] text-[#FDFBF7] placeholder:text-[#FDFBF7]/45
                    bg-white/[0.06] border border-[#D4B896]/35 focus:border-[#E2C9A0] outline-none transition"
                />
                <button
                  type="submit"
                  disabled={streaming || !draft.trim()}
                  aria-label="Send"
                  data-no-contrast-guard
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center
                    rounded-lg text-[#1A1A1A] bg-[#E2C9A0] hover:bg-[#EBD3AA] disabled:opacity-40
                    disabled:cursor-not-allowed transition"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
