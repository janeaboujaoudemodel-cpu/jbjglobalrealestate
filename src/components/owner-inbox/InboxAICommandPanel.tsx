import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CommThread, ThreadStatus } from "@/hooks/useOwnerInbox";

interface PlannedAction {
  type: "mark_read" | "set_status" | "draft_reply" | "filter_only";
  thread_ids: string[];
  value?: string;
}

interface Props {
  threads: CommThread[];
  selectedIds: string[];
  onApplyFilter: (ids: string[], description: string) => void;
  onBulkMarkRead: (ids: string[]) => void;
  onBulkSetStatus: (ids: string[], status: ThreadStatus) => void;
}

const SUGGESTIONS = [
  "Find unanswered emails older than 3 days",
  "Mark all marketing and newsletters as read",
  "Show finance messages only",
  "Promote waiting threads older than 3 days to follow-up due",
  "Draft replies for selected",
];

export default function InboxAICommandPanel({ threads, selectedIds, onApplyFilter, onBulkMarkRead, onBulkSetStatus }: Props) {
  const [open, setOpen] = useState(false);
  const [cmd, setCmd] = useState("");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<{ summary: string; actions: PlannedAction[] } | null>(null);

  const run = async () => {
    if (!cmd.trim() || busy) return;
    setBusy(true);
    setPlan(null);
    try {
      const now = Date.now();
      const compact = threads.map(t => ({
        id: t.id,
        channel_type: t.channel_type,
        status: t.status,
        unread_count: t.unread_count,
        contact_name: t.contact_name,
        contact_identifier: t.contact_identifier,
        last_message_preview: t.last_message_preview,
        ai_category: t.ai_category,
        ai_priority: t.ai_priority,
        hours_since_last: t.last_message_at ? Math.round((now - new Date(t.last_message_at).getTime()) / 3_600_000) : null,
      }));
      const { data, error } = await supabase.functions.invoke("inbox-ai-command", {
        body: { command: cmd, threads: compact, selected_ids: selectedIds },
      });
      if (error) throw error;
      if (data?.error === "rate_limited") { toast.error("AI rate limit — try again"); return; }
      if (data?.error === "credits_exhausted") { toast.error("AI credits exhausted"); return; }
      setPlan({ summary: data?.summary || "", actions: data?.actions || [] });
    } catch (e) {
      toast.error((e as Error).message || "AI command failed");
    } finally {
      setBusy(false);
    }
  };

  const apply = (a: PlannedAction) => {
    if (!a.thread_ids?.length && a.type !== "filter_only") {
      toast.error("No matching conversations");
      return;
    }
    if (a.type === "mark_read") onBulkMarkRead(a.thread_ids);
    else if (a.type === "set_status" && a.value) onBulkSetStatus(a.thread_ids, a.value as ThreadStatus);
    else if (a.type === "filter_only") onApplyFilter(a.thread_ids, a.value || "AI filter");
    else if (a.type === "draft_reply") {
      toast.info(`${a.thread_ids.length} draft${a.thread_ids.length === 1 ? "" : "s"} prepared — open each thread to review`);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        data-surface="emerald"
        className="jj-emerald-metallic allow-white inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white border-0 shadow-sm transition [&_*]:!text-white [&_svg]:!stroke-white"
      >
        <Sparkles className="h-3.5 w-3.5" /> Ask Amanda
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] to-white p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[#1A1A1A] font-semibold text-sm">
          <Sparkles className="h-4 w-4" /> Inbox Command
        </div>
        <button onClick={() => { setOpen(false); setPlan(null); }} className="text-[#1A1A1A]/50 hover:text-[#1A1A1A]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <Input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") run(); }}
          placeholder='e.g. "Mark all SHEIN and newsletters as read"'
          className="flex-1 border-[#B89555]/30 bg-white"
          disabled={busy}
        />
        <Button onClick={run} disabled={busy || !cmd.trim()} data-surface="emerald" className="jj-emerald-metallic allow-white text-white">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {SUGGESTIONS.map(s => (
          <button key={s} onClick={() => setCmd(s)} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/40">
            {s}
          </button>
        ))}
      </div>

      {plan && (
        <div className="mt-3 space-y-2">
          {plan.summary && <p className="text-xs text-[#1A1A1A]/80 italic">{plan.summary}</p>}
          {plan.actions.length === 0 && <p className="text-xs text-[#1A1A1A]/60">No actions suggested.</p>}
          {plan.actions.map((a, i) => (
            <div key={i} className="flex items-center justify-between bg-white border border-[#B89555]/20 rounded-lg p-2">
              <div className="flex items-center gap-2 min-w-0">
                <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30 text-[10px]">{a.type}</Badge>
                <span className="text-xs text-[#1A1A1A]/70 truncate">
                  {a.thread_ids?.length || 0} thread{(a.thread_ids?.length || 0) === 1 ? "" : "s"}
                  {a.value ? ` — ${a.value.slice(0, 60)}` : ""}
                </span>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#B89555]/30 text-[#1A1A1A]" onClick={() => apply(a)}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Apply
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
