/**
 * AiEditChatPanel
 * ---------------
 * Right-side live AI editor for the Document Studio. The owner types
 * an instruction ("make salary AED 30k", "add 90-day probation clause")
 * and the chat reissues the document via the existing
 * `letter-ai-generate` edge function, replacing the body in-place.
 *
 * The locked premium chrome (header + footer) is never sent to the AI
 * and never returned by it — only the editable body changes.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { stripChromeArtifacts } from "@/templates/jbjLockedChrome";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  /** Current editable HTML body — sent to the AI so it can edit in place. */
  currentBody: string;
  /** The catalog template's AI instructions (steering). */
  aiInstructions: string;
  /** Apply the AI's revised body back to the editor. */
  onApply: (nextBody: string) => void;
}

export default function AiEditChatPanel({ currentBody, aiInstructions, onApply }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "I'm your document editor. Tell me what to change — e.g., \"raise the salary to AED 30,000\", \"add a 90-day probation clause\", \"make the tone warmer\".",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const instruction = input.trim();
    if (!instruction || busy) return;
    setMessages((m) => [...m, { role: "user", content: instruction }]);
    setInput("");
    setBusy(true);

    try {
      const prompt = [
        `Steering: ${aiInstructions}`,
        ``,
        `The user is editing an existing document. Current body (plain text):`,
        `"""`,
        stripChromeArtifacts(currentBody)
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n\n")
          .replace(/<[^>]+>/g, "")
          .replace(/\n{3,}/g, "\n\n")
          .trim(),
        `"""`,
        ``,
        `Apply this instruction and return the FULL revised body:`,
        instruction,
      ].join("\n");

      const { data, error } = await supabase.functions.invoke("letter-ai-generate", {
        body: { prompt, tone: "formal", language: "English" },
      });
      if (error) throw error;

      const newBodyText: string =
        (data?.body_text || data?.bodyText || "").toString().trim();

      if (!newBodyText) throw new Error("No content returned");

      // Convert paragraph-separated text → simple HTML paragraphs
      const html = newBodyText
        .split(/\n{2,}/)
        .map((p) => `<p style="margin:0 0 14px;line-height:1.65;">${p.replace(/\n/g, "<br/>")}</p>`)
        .join("");

      onApply(html);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Done — the document has been updated. Anything else?" },
      ]);
    } catch (e: any) {
      toast.error(e?.message || "AI edit failed");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I couldn't apply that change. Try rephrasing the instruction." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFBF7] border border-[#B89555]/25 rounded-xl">
      <div className="px-4 py-3 border-b border-[#B89555]/20 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
        <span className="text-sm font-semibold text-[#1A1A1A]">Live Document Editor</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[280px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={[
              "text-sm rounded-lg px-3 py-2 max-w-[92%]",
              m.role === "assistant"
                ? "bg-[#F7F2EA] border border-[#B89555]/20 text-[#1A1A1A] mr-auto"
                : "bg-[#EFE6D6] border border-[#B89555]/30 text-[#1A1A1A] ml-auto",
            ].join(" ")}
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-[#1A1A1A]/70">
            <Loader2 className="w-3 h-3 animate-spin" /> Updating document…
          </div>
        )}
      </div>

      <div className="p-3 border-t border-[#B89555]/20 space-y-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell the editor what to change…"
          rows={3}
          className="text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              send();
            }
          }}
        />
        <Button onClick={send} disabled={busy || !input.trim()} className="w-full" size="sm">
          <Send className="w-4 h-4 mr-2" /> Apply with AI
        </Button>
      </div>
    </div>
  );
}
