import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
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
}

const QUICK = [
  { label: "Score this lead", mode: "score", prompt: "Score this lead and explain why." },
  { label: "Recommend properties", mode: "recommend", prompt: "Recommend the best 3 matches from inventory and explain why each fits." },
  { label: "Draft WhatsApp", mode: "draft", prompt: "Draft a friendly WhatsApp message to re-engage this lead based on their interest." },
  { label: "Next step", mode: "freeform", prompt: "What is the single best next step I should take with this lead today?" },
];

export default function AssistantChat({ turns, loading, onSend, leadName, leadPhone, leadWhatsapp, disabled }: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns.length, loading]);

  const submit = (msg?: string, mode?: string) => {
    const text = (msg ?? input).trim();
    if (!text || loading) return;
    onSend(text, mode);
    if (!msg) setInput("");
  };

  return (
    <div className="flex-1 flex flex-col border border-[#B89555]/30 rounded-2xl bg-[#FDFBF7] overflow-hidden min-h-[560px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {turns.length === 0 && !loading && (
          <div className="h-full grid place-items-center text-center px-6">
            <div>
              <div className="mx-auto h-12 w-12 rounded-md grid place-items-center border-2 border-[#B89555] bg-transparent mb-3">
                <Sparkles className="h-5 w-5 text-[#B89555]" />
              </div>
              <h3 className="text-base font-semibold text-[#1A1A1A]">JBJ Sales Assistant</h3>
              <p className="text-sm text-[#1A1A1A]/65 mt-1 max-w-sm">
                Ask me anything about this lead — I'll score them, pick matching properties from JBJ inventory,
                draft a ready-to-send message, and tell you the next best step.
              </p>
            </div>
          </div>
        )}

        {turns.map((t) => (
          <div key={t.id} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              t.role === "user"
                ? "bg-[#102540] text-white"
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
          {QUICK.map(q => (
            <button
              key={q.label}
              onClick={() => submit(q.prompt, q.mode)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-md border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6] disabled:opacity-50"
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
            placeholder={disabled ? "Pick a lead on the left, then ask the assistant…" : "Ask the assistant…"}
            disabled={loading}
            className="flex-1 h-10 px-3 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            data-allow-dark-cta
            className="h-10 px-4 rounded-lg bg-[#102540] text-white text-sm font-semibold hover:bg-[#1a3d63] disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
