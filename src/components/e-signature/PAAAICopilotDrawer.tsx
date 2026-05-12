import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/config/backend";
import { toast } from "sonner";

interface Msg { role: "user" | "assistant"; content: string; updates?: Record<string, string> | null }

interface Props {
  envelopeId: string;
  currentValues: Record<string, any>;
  onApplyUpdates: (updates: Record<string, string>) => void;
}

export default function PAAAICopilotDrawer({ envelopeId, currentValues, onApplyUpdates }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi — I'm your PAA Co-Pilot. Ask me to rewrite the description, change the rent to AED 180,000, set the term to 12 months, etc." },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/paa-ai-copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          envelope_id: envelopeId,
          current_values: currentValues,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) toast.error("AI rate limit — try again in a moment");
        else if (res.status === 402) toast.error("AI credits exhausted");
        else toast.error(data.error || "AI failed");
        setMessages((m) => [...m, { role: "assistant", content: "Sorry — I couldn't process that." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.content || "", updates: data.updates }]);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
          <Sparkles className="w-4 h-4 mr-2" /> AI Co-Pilot
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-[#FDFBF7] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <Sparkles className="w-4 h-4 text-purple-600" /> PAA Co-Pilot
          </SheetTitle>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/30"
                  : "bg-white text-[#1A1A1A] border border-[#B89555]/30"
              }`}>
                <div className="whitespace-pre-wrap">{m.content.replace(/```json[\s\S]*?```/g, "").trim()}</div>
                {m.updates && Object.keys(m.updates).length > 0 && (
                  <div className="mt-2 space-y-1.5 border-t border-[#B89555]/20 pt-2">
                    <div className="text-[10px] uppercase tracking-wide text-[#1A1A1A]/60">Suggested updates</div>
                    {Object.entries(m.updates).map(([k, v]) => (
                      <div key={k} className="text-xs flex items-start gap-1.5">
                        <span className="font-medium text-[#1A1A1A]">{k.replace(/_/g, " ")}:</span>
                        <span className="text-[#1A1A1A]/80 break-words">{v}</span>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="gold"
                      className="h-7 text-[11px] mt-1"
                      onClick={() => { onApplyUpdates(m.updates!); toast.success("Applied — review and save"); }}
                    >
                      <Check className="w-3 h-3 mr-1" /> Apply to document
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#B89555]/30 rounded-lg px-3 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#B89555]/30 pt-3 flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything about this agreement…"
            className="min-h-[60px] resize-none"
            disabled={busy}
          />
          <Button onClick={send} disabled={busy || !input.trim()} variant="gold" className="self-end">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
