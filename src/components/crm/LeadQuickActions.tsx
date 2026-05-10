import { useEffect, useState } from "react";
import { CalendarPlus, StickyNote, ListTodo, Loader2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  leadId: string;
  leadName?: string;
  leadPhone?: string | null;
  leadEmail?: string | null;
  userId: string;
}

export default function LeadQuickActions({ leadId, leadName, leadPhone, leadEmail, userId }: Props) {
  return (
    <div className="inline-flex items-center gap-1">
      <InvestorToggle leadId={leadId} />
      <CalendarPopover leadId={leadId} leadName={leadName} leadPhone={leadPhone} leadEmail={leadEmail} userId={userId} />
      <NotePopover leadId={leadId} leadName={leadName} leadPhone={leadPhone} leadEmail={leadEmail} userId={userId} />
      <TaskPopover leadId={leadId} leadName={leadName} leadPhone={leadPhone} leadEmail={leadEmail} userId={userId} />
    </div>
  );
}

function InvestorToggle({ leadId }: { leadId: string }) {
  const [isInvestor, setIsInvestor] = useState<boolean>(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("crm_leads")
        .select("is_investor")
        .eq("id", leadId)
        .maybeSingle();
      if (!cancelled && data) setIsInvestor(Boolean((data as any).is_investor));
    })();
    return () => { cancelled = true; };
  }, [leadId]);

  const toggle = async () => {
    setSaving(true);
    const next = !isInvestor;
    const { error } = await supabase
      .from("crm_leads")
      .update({ is_investor: next })
      .eq("id", leadId);
    setSaving(false);
    if (error) return toast.error(error.message);
    setIsInvestor(next);
    toast.success(next ? "Marked as Investor" : "Unmarked as Investor");
  };

  return (
    <Button
      type="button"
      size="icon"
      onClick={toggle}
      disabled={saving}
      title={isInvestor ? "Unmark as Investor" : "Mark as Investor"}
      className={
        "h-9 w-9 border " +
        (isInvestor
          ? "bg-[#B89555] hover:bg-[#A08047] text-white border-[#B89555]"
          : "bg-[#EFE6D6] hover:bg-[#E5D9C4] text-[#1A1A1A] border-[#B89555]/30")
      }
    >
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
    </Button>
  );
}

function CalendarPopover({ leadId, leadName, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(leadName ? `Meeting with ${leadName}` : "Meeting");
  const [startAt, setStartAt] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!startAt) return toast.error("Pick a date/time");
    setSaving(true);
    const start = new Date(startAt);
    const end = new Date(start.getTime() + 30 * 60000);
    const { error } = await supabase.from("owner_calendar_events").insert({
      owner_id: userId,
      title,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      metadata: { lead_id: leadId },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Event added");
    setOpen(false);
    setStartAt("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" className="h-9 w-9 bg-[#EFE6D6] hover:bg-[#E5D9C4] text-[#1A1A1A] border border-[#B89555]/30" title="Schedule">
          <CalendarPlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-[#FDFBF7] border-[#B89555]/30 z-50" align="end">
        <div className="space-y-2">
          <div className="text-sm font-bold text-[#1A1A1A]">Schedule meeting</div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          <Button onClick={save} disabled={saving} className="w-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotePopover({ leadId, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!body.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("crm_notes").insert({
      lead_id: leadId,
      user_id: userId,
      body: body.trim(),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Note saved");
    setBody("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" className="h-9 w-9 bg-[#EFE6D6] hover:bg-[#E5D9C4] text-[#1A1A1A] border border-[#B89555]/30" title="Note">
          <StickyNote className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-[#FDFBF7] border-[#B89555]/30 z-50" align="end">
        <div className="space-y-2">
          <div className="text-sm font-bold text-[#1A1A1A]">Add note</div>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Type a note…" />
          <Button onClick={save} disabled={saving} className="w-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save note"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TaskPopover({ leadId, leadName, userId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return toast.error("Title required");
    setSaving(true);
    const { error } = await supabase.from("crm_tasks").insert({
      lead_id: leadId,
      user_id: userId,
      title: title.trim(),
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      status: "open",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Task added");
    setTitle("");
    setDueAt("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="icon" className="h-9 w-9 bg-[#EFE6D6] hover:bg-[#E5D9C4] text-[#1A1A1A] border border-[#B89555]/30" title="Task">
          <ListTodo className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-[#FDFBF7] border-[#B89555]/30 z-50" align="end">
        <div className="space-y-2">
          <div className="text-sm font-bold text-[#1A1A1A]">Add task{leadName ? ` for ${leadName}` : ""}</div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
          <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          <Button onClick={save} disabled={saving} className="w-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save task"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
