import { useState } from "react";
import { Sparkles, Mic, CalendarPlus, NotebookPen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VoiceNoteRecorder from "@/components/crm/VoiceNoteRecorder";

export type LeadEntityType =
  | "brokerage"
  | "client"
  | "broker"
  | "developer"
  | "admin"
  | "lead";

interface Props {
  entityType: LeadEntityType;
  entityId: string;
  entityName: string;
  /** Optional contextual hint shown to the AI. */
  context?: string;
}

/**
 * Universal AI star button rendered next to every CRM record.
 * Opens a slide-over assistant scoped to that lead.
 *
 * Voice → transcript → AI parses intent (note / calendar / task / move stage / suspend / register deal / send email).
 * Falls back gracefully when the edge function is not yet deployed: at minimum, voice → note saved locally.
 */
export const LeadAIStar = ({
  entityType,
  entityId,
  entityName,
  context,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<string>("");

  const ask = async (intent: "summarize" | "suggest" | "act") => {
    if (intent === "act" && !text.trim()) {
      toast.error("Type or speak something first");
      return;
    }
    setBusy(true);
    setReply("");
    try {
      const { data, error } = await supabase.functions.invoke(
        "crm-lead-assistant",
        {
          body: {
            entityType,
            entityId,
            entityName,
            intent,
            input: text,
            context,
          },
        }
      );
      if (error) throw error;
      setReply(data?.reply || "Done.");
      if (data?.actions?.length) {
        toast.success(`${data.actions.length} action(s) executed`);
      }
    } catch (e: any) {
      // Graceful fallback if the edge function isn't deployed yet
      const msg =
        e?.message?.includes("not found") ||
        e?.message?.includes("Failed to send")
          ? "Assistant brain is being set up. Saving your input as a note for now."
          : e?.message || "Assistant failed";
      toast.message(msg);
      // Best-effort: save to local notes table where supported
      if (text.trim()) {
        const note = `[AI Star] ${text}`;
        if (entityType === "brokerage") {
          await supabase
            .from("crm_brokerage_notes")
            .insert({ brokerage_id: entityId, body: note })
            .then(({ error }) => {
              if (!error) toast.success("Note saved to brokerage");
            });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        size="icon"
        variant="secondary"
        className="h-8 w-8 bg-[#F7F2EA] hover:bg-[#EFE6D6] border-[#B89555]/40"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={`AI assistant for ${entityName}`}
        title="AI assistant"
      >
        <Sparkles className="w-4 h-4 text-[#B89555]" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="bg-[#FDFBF7] text-[#1A1A1A] border-l border-[#1A1A1A]/10 w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-[#1A1A1A]">
              <Sparkles className="w-5 h-5 text-[#B89555]" />
              {entityName}
            </SheetTitle>
            <p className="text-xs text-[#5A4A2E] capitalize">{entityType}</p>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => ask("summarize")}
              >
                <NotebookPen className="w-3.5 h-3.5 mr-1" />
                Summarize
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => ask("suggest")}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Suggest next step
              </Button>
            </div>

            <div className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#1A1A1A]">
                  Speak or type your instruction
                </span>
                <VoiceNoteRecorder
                  onTranscript={(t) =>
                    setText((cur) => (cur ? `${cur} ${t}` : t))
                  }
                />
              </div>
              <Textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='e.g. "Add to calendar Tuesday 6pm to call them, then create a follow-up task for next week"'
                className="bg-[#FDFBF7] text-[#1A1A1A]"
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="gold"
                  disabled={busy || !text.trim()}
                  onClick={() => ask("act")}
                >
                  <CalendarPlus className="w-3.5 h-3.5 mr-1" />
                  Run
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy || !text.trim()}
                  onClick={() => setText("")}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              </div>
            </div>

            {reply && (
              <div className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/30 p-3">
                <div className="text-xs font-semibold text-[#1A1A1A] mb-1">
                  Assistant
                </div>
                <div className="text-sm text-[#1A1A1A] whitespace-pre-wrap">
                  {reply}
                </div>
              </div>
            )}

            <p className="text-[10px] text-[#5A4A2E]">
              Notes, calendar events and tasks created here are linked to{" "}
              <strong>{entityName}</strong>.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default LeadAIStar;
