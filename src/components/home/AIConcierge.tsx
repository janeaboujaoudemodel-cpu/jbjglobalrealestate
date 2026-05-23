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
              bg-[#FDFBF7] border-l border-t sm:border-t-0 border-[#B89555]/55"
            style={{ boxShadow: "0 -20px 60px rgba(0,0,0,0.25), -20px 0 60px rgba(0,0,0,0.25)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#B89555]/30 bg-[#F7F2EA]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#B89555]/55 bg-[#FDFBF7]">
                  <Sparkles className="h-5 w-5 text-[#B89555]" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-[#1A1A1A] leading-tight">AI Concierge</div>
                  <div className="text-[11px] text-[#1A1A1A]/65 leading-tight">JBJ Global Real Estate</div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close concierge"
                data-no-contrast-guard
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4 bg-[#FDFBF7]">
              {!isVerified && (
                <ConciergeGate onVerified={() => { /* state auto-updates via hook */ }} />
              )}
              {isVerified && messages.length === 0 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2 py-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#B89555]/55 bg-[#F7F2EA]">
                      <Sparkles className="h-6 w-6 text-[#B89555]" />
                    </div>
                    <h3 className="text-[18px] font-semibold text-[#1A1A1A]">Welcome back{verified?.firstName ? `, ${verified.firstName}` : ""}</h3>
                    <p className="text-[13px] text-[#1A1A1A]/70 max-w-[300px] mx-auto leading-relaxed">
                      Ask anything — I'll guide you with one-tap shortcuts.
                    </p>
                  </div>

                  {/* Premium channel switcher */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Concierge (active) */}
                    <div
                      data-no-contrast-guard
                      className="relative flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl
                        border border-[#B89555]/70 bg-[#EFE6D6]"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#B89555]" />
                        <span className="text-[12.5px] font-semibold text-[#1A1A1A]">AI Concierge</span>
                      </div>
                      <span className="text-[11px] text-[#1A1A1A]/70 leading-snug">Instant answers · 24/7</span>
                      <span className="absolute top-2 right-2 text-[9.5px] tracking-[0.14em] uppercase font-semibold text-[#B89555]">Active</span>
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
                        border border-[#B89555]/40 bg-[#FDFBF7] hover:bg-[#F7F2EA] hover:border-[#B89555]/70 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[#1A1A1A]" />
                        <span className="text-[12.5px] font-semibold text-[#1A1A1A]">Chat Support</span>
                      </div>
                      <span className="text-[11px] text-[#1A1A1A]/70 leading-snug">Talk to a JBJ agent</span>
                    </button>
                    {/* WhatsApp */}
                    <a
                      href={getWhatsAppUrl()}
                      target="_blank"
                      rel="noreferrer"
                      data-no-contrast-guard
                      className="group flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl
                        border border-[#B89555]/40 bg-[#FDFBF7] hover:bg-[#F7F2EA] hover:border-[#B89555]/70 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-[#1A1A1A]" />
                        <span className="text-[12.5px] font-semibold text-[#1A1A1A]">WhatsApp</span>
                      </div>
                      <span className="text-[11px] text-[#1A1A1A]/70 leading-snug">Reply in minutes</span>
                    </a>
                    {/* Call */}
                    <a
                      href={getCallUrl()}
                      data-no-contrast-guard
                      className="group flex flex-col items-start gap-1.5 px-3.5 py-3 rounded-xl
                        border border-[#B89555]/40 bg-[#FDFBF7] hover:bg-[#F7F2EA] hover:border-[#B89555]/70 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#1A1A1A]" />
                        <span className="text-[12.5px] font-semibold text-[#1A1A1A]">Call an Agent</span>
                      </div>
                      <span className="text-[11px] text-[#1A1A1A]/70 leading-snug">{CONTACT_INFO.phone}</span>
                    </a>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10.5px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/55 px-1">
                      Try asking
                    </div>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        data-no-contrast-guard
                        className="w-full text-left px-4 py-3 rounded-xl text-[13px] text-[#1A1A1A]
                          border border-[#B89555]/40 bg-[#FDFBF7] hover:bg-[#F7F2EA] hover:border-[#B89555]/70
                          transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}




              {messages.map((m, i) => {
                const { action, cleaned } = m.role === "assistant"
                  ? parseAction(m.content)
                  : { action: null as ReturnType<typeof parseAction>["action"], cleaned: m.content };
                return (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      data-no-contrast-guard
                      className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed
                        ${m.role === "user"
                          ? "bg-[#1A1A1A] text-[#FDFBF7] rounded-br-md"
                          : "bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/40 rounded-bl-md"}`}
                    >
                      {m.role === "assistant" ? (
                        <>
                          {cleaned && (
                            <div className="prose prose-sm max-w-none
                              prose-p:my-1.5 prose-p:text-[#1A1A1A]
                              prose-a:text-[#B89555] prose-a:no-underline hover:prose-a:underline
                              prose-strong:text-[#1A1A1A] prose-ul:my-1.5 prose-li:my-0.5 prose-li:text-[#1A1A1A]
                              prose-code:text-[#1A1A1A] prose-code:bg-[#EFE6D6] prose-code:px-1 prose-code:rounded">
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
                                {cleaned || "…"}
                              </ReactMarkdown>
                            </div>
                          )}
                          {action && (
                            <ConciergeActionCard action={action} onNavigate={onClose} />
                          )}
                        </>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                );
              })}

              {streaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[#F7F2EA] border border-[#B89555]/40">
                    <Loader2 className="h-4 w-4 animate-spin text-[#B89555]" />
                  </div>
                </div>
              )}
            </div>

            {/* Footer escalation + input */}
            <div className="border-t border-[#B89555]/30 px-5 py-3 space-y-3 bg-[#F7F2EA]">
              {messages.length > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.16em] font-semibold text-[#1A1A1A]/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    24/7 Support · Free
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        data-no-contrast-guard
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold
                          text-[#1A1A1A] border border-[#B89555]/55 bg-[#FDFBF7] hover:bg-[#EFE6D6] hover:border-[#B89555] transition"
                      >
                        Switch channel
                        <ChevronDown className="h-3 w-3 text-[#B89555]" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      align="end"
                      sideOffset={8}
                      data-no-contrast-guard
                      className="w-[300px] p-2 space-y-1.5 !bg-[#FDFBF7] !text-[#1A1A1A] border border-[#B89555]/55 rounded-xl"
                      style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}
                    >
                      <ChannelCard channel={{
                        id: "chat-support",
                        label: "Chat Support",
                        description: "Talk to a JBJ agent",
                        responseTime: "Replies in ~2 min",
                        Icon: MessageSquare,
                        action: () => { onClose(); setTimeout(() => window.dispatchEvent(new CustomEvent('jbj:open-chat-support')), 250); },
                      }} />
                      <ChannelCard channel={{
                        id: "whatsapp",
                        label: "WhatsApp",
                        description: "Reply in minutes",
                        responseTime: "24/7",
                        Icon: MessageCircle,
                        href: getWhatsAppUrl(),
                        external: true,
                      }} />
                      <ChannelCard channel={{
                        id: "call",
                        label: "Call an Agent",
                        description: CONTACT_INFO.phone,
                        responseTime: "Avg 30s pickup",
                        Icon: Phone,
                        href: getCallUrl(),
                      }} />
                    </PopoverContent>
                  </Popover>
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
                  className="w-full h-12 pl-4 pr-12 rounded-xl text-[14px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/45
                    bg-[#FDFBF7] border border-[#B89555]/45 focus:border-[#B89555] outline-none transition"
                />
                <button
                  type="submit"
                  disabled={streaming || !draft.trim()}
                  aria-label="Send"
                  data-no-contrast-guard
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center
                    rounded-lg text-[#FDFBF7] bg-[#1A1A1A] hover:bg-[#2a2a2a] disabled:opacity-40
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
