import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2, X } from "lucide-react";
import ReadyMessageCard from "./ReadyMessageCard";

export interface ChatTurn {
  id: string;
  role: "user" | "assistant";
  content: string;
  draft_message?: string | null;
}

interface Props {
  turns: ChatTurn[];
  loading: boolean;
  onSend: (msg: string, mode?: string) => void;
  leadName?: string;
  leadPhone?: string | null;
  leadWhatsapp?: string | null;
  disabled?: boolean;
  hasLead?: boolean;
  onClearLead?: () => void;
}

const QUICK_LEAD = [
  { label: "Score this lead", mode: "score", prompt: "Score this lead and explain why." },
  { label: "Recommend properties", mode: "recommend", prompt: "Recommend the best 3 matches from inventory and explain why each fits." },
  { label: "Draft WhatsApp", mode: "draft", prompt: "Draft a friendly WhatsApp message to re-engage this lead based on their interest." },
  { label: "Next step", mode: "freeform", prompt: "What is the single best next step I should take with this lead today?" },
];

const QUICK_GENERAL = [
  { label: "Handle a price objection", mode: "freeform", prompt: "Give me 3 strong ways to handle a buyer who says the price is too high in Dubai off-plan." },
  { label: "Best ROI areas 2026", mode: "freeform", prompt: "What are the best ROI areas in Dubai right now for off-plan investors?" },
  { label: "Cold WhatsApp opener", mode: "freeform", prompt: "Write me a cold WhatsApp opener for a new investor lead from LinkedIn." },
  { label: "Qualify a buyer", mode: "freeform", prompt: "Give me a 5-question script to qualify a new buyer in 2 minutes." },
];

export default function AssistantChat({ turns, loading, onSend, leadName, leadPhone, leadWhatsapp, disabled, hasLead, onClearLead }: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns.length, loading]);

  const submit = (msg?: string, mode?: string) => {
    const text = (msg ?? input).trim();
    if (!text || loading) return;
    onSend(text, mode);
    if (!msg) setInput("");
  };

  const quick = hasLead ? QUICK_LEAD : QUICK_GENERAL;

  return (
    <div className="flex-1 flex flex-col border border-[#B89555]/30 rounded-2xl bg-[#FDFBF7] text-[#1A1A1A] overflow-hidden min-h-[560px]">
      {hasLead && leadName && (
        <div className="px-4 py-2 border-b border-[#B89555]/20 bg-[#F7F2EA] flex items-center justify-between gap-3">
          <div className="text-[11px] text-[#1A1A1A]/70 truncate">
            <span className="uppercase tracking-wider text-[10px] text-[#1A1A1A]/50 mr-1.5">Context:</span>
            <span className="font-semibold text-[#1A1A1A]">{leadName}</span>
          </div>
          {onClearLead && (
            <button
              type="button"
              onClick={onClearLead}
              className="inline-flex items-center gap-1 text-[11px] text-[#1A1A1A]/70 hover:text-[#1A1A1A] px-2 py-0.5 rounded-md border border-[#B89555]/30 hover:bg-[#EFE6D6]"
            >
              <X className="h-3 w-3" /> Clear lead
            </button>
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {turns.length === 0 && !loading && (
          <div className="h-full grid place-items-center text-center px-6">
            <div>
              <div className="mx-auto h-12 w-12 rounded-md grid place-items-center border-2 border-[#B89555] bg-transparent mb-3">
                <Sparkles className="h-5 w-5 text-[#B89555]" />
              </div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">JBJ Sales Assistant</h3>
              <p className="text-sm text-[#1A1A1A]/65 mt-1 max-w-sm">
                {hasLead
                  ? "Ask me anything about this lead — I'll score them, pick matching properties from JBJ inventory, draft a ready-to-send message, and tell you the next best step."
                  : "Ask me anything — sales tactics, objections, market questions, scripts, or property matches. Click a lead on the left to switch into per-lead mode."}
              </p>
            </div>
          </div>
        )}

        {turns.map((t) => (
          <div key={t.id} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              t.role === "user"
                ? "bg-[#0A0A0A] text-white allow-white"
                : "bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/25"
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">{t.content}</div>
              {t.role === "assistant" && t.draft_message && (
                <ReadyMessageCard
                  message={t.draft_message}
                  leadName={leadName}
                  leadPhone={leadPhone}
                  leadWhatsapp={leadWhatsapp}
                />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#F7F2EA] border border-[#B89555]/25 rounded-2xl px-4 py-2.5 text-sm text-[#1A1A1A]/70 inline-flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="border-t border-[#B89555]/20 p-3 space-y-2 bg-[#FDFBF7]">
        <div className="flex flex-wrap gap-1.5">
          {quick.map(q => (
            <button
              key={q.label}
              onClick={() => submit(q.prompt, q.mode)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-md border border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6] disabled:opacity-50"
            >
              {q.label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasLead ? `Ask about ${leadName?.split(" ")[0] || "this lead"}…` : "Ask the assistant anything…"}
            disabled={loading || disabled}
            className="flex-1 h-10 px-3 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            data-surface="dark"
            data-cta="dark"
            data-allow-dark-cta
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            className="jj-cta-dark allow-white h-10 px-4 rounded-lg bg-[#0A0A0A] text-white text-sm font-semibold hover:bg-[#1F1F1F] disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Send className="h-4 w-4 allow-white" style={{ color: "#FFFFFF" }} />
            <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
