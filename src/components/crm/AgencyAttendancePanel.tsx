import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Coffee, Megaphone, Plus, Sparkles, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useBrokerageEvents,
  useBrokerageEventAttendees,
  useCreateBrokerageEvent,
  useDeleteBrokerageEvent,
  useAddAttendees,
  type BrokerageEventType,
} from "@/hooks/useBrokerageEvents";
import { supabase } from "@/integrations/supabase/client";
import type { BrokerageAgentDraft } from "./BrokerageAgentsEditor";

interface Props {
  brokerageId: string;
  brokerageName: string;
  agents: BrokerageAgentDraft[];
}

export function AgencyAttendancePanel({ brokerageId, brokerageName, agents }: Props) {
  const events = useBrokerageEvents(brokerageId);
  const attendees = useBrokerageEventAttendees(brokerageId);
  const createEvent = useCreateBrokerageEvent();
  const deleteEvent = useDeleteBrokerageEvent();
  const addAttendees = useAddAttendees();

  const [showCreate, setShowCreate] = useState<null | BrokerageEventType>(null);
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventTitle, setEventTitle] = useState("");
  const [eventNotes, setEventNotes] = useState("");

  const [aiOpen, setAiOpen] = useState<string | null>(null); // event_id
  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [attendeeName, setAttendeeName] = useState<Record<string, string>>({});

  const submitCreate = async () => {
    if (!showCreate) return;
    try {
      await createEvent.mutateAsync({
        brokerage_id: brokerageId,
        event_type: showCreate,
        event_date: eventDate,
        title: eventTitle || null,
        notes: eventNotes || null,
      });
      setShowCreate(null); setEventTitle(""); setEventNotes("");
      toast.success(`${showCreate === "briefing" ? "Briefing" : "Breakfast"} added`);
    } catch (e: any) {
      toast.error(e.message || "Failed to create event");
    }
  };

  const addOne = async (eventId: string) => {
    const name = (attendeeName[eventId] || "").trim();
    if (!name) return;
    const agent = agents.find((a) => a.name?.toLowerCase() === name.toLowerCase() && a.id);
    await addAttendees.mutateAsync([{
      event_id: eventId, brokerage_id: brokerageId, agent_id: agent?.id || null,
      name, phone: agent?.phone || null, email: agent?.email || null, matched_via: "manual",
    }]);
    setAttendeeName((s) => ({ ...s, [eventId]: "" }));
  };

  const runAI = async () => {
    if (!aiOpen || !aiText.trim()) return;
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("crm-attendance-ai-match", {
        body: { event_id: aiOpen, brokerage_id: brokerageId, raw_text: aiText },
      });
      if (error) throw error;
      toast.success(`Registered ${data?.total || 0} attendees (${data?.matched_count || 0} matched, ${data?.created_count || 0} new)`);
      setAiOpen(null); setAiText("");
    } catch (e: any) {
      toast.error(e.message || "AI matching failed");
    } finally {
      setAiBusy(false);
    }
  };

  const attendeesByEvent = (eventId: string) => (attendees.data || []).filter((a) => a.event_id === eventId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
          <Users className="w-4 h-4 text-[#B89555]" />
          Briefings &amp; Breakfasts — {brokerageName}
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => { setShowCreate("briefing"); setEventTitle(""); }}>
            <Megaphone className="w-3.5 h-3.5 mr-1" /> Add Briefing
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { setShowCreate("breakfast"); setEventTitle(""); }}>
            <Coffee className="w-3.5 h-3.5 mr-1" /> Add Breakfast
          </Button>
        </div>
      </div>

      {events.isLoading && <div className="text-xs text-[#1A1A1A]/70">Loading…</div>}
      {events.data?.length === 0 && !events.isLoading && (
        <div className="text-xs text-[#1A1A1A]/70 p-3 bg-[#F7F2EA] rounded-lg border border-[#B89555]/20">
          No briefings or breakfasts logged yet. Click <b>Add Briefing</b> or <b>Add Breakfast</b> above to start tracking attendance.
        </div>
      )}

      <div className="space-y-2">
        {events.data?.map((ev) => {
          const evAttendees = attendeesByEvent(ev.id);
          return (
            <div key={ev.id} className="border border-[#B89555]/30 rounded-lg bg-white p-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${ev.event_type === "briefing" ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]" : "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/60"}`}>
                  {ev.event_type === "briefing" ? "Briefing" : "Breakfast"}
                </span>
                <span className="text-sm font-semibold text-[#1A1A1A]">{ev.title || `${ev.event_type} on ${ev.event_date}`}</span>
                <span className="text-xs text-[#1A1A1A]/70">{ev.event_date}</span>
                <span className="ml-auto text-xs text-[#1A1A1A]/70">{evAttendees.length} attendees</span>
                <Button size="icon" variant="ghost" onClick={() => deleteEvent.mutate(ev.id)} aria-label="Delete event">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>

              {evAttendees.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {evAttendees.map((a) => (
                    <span key={a.id} className="text-xs px-2 py-0.5 rounded-full bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A]">
                      {a.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  className="h-8 max-w-[260px]"
                  placeholder="Add attendee name"
                  value={attendeeName[ev.id] || ""}
                  onChange={(e) => setAttendeeName((s) => ({ ...s, [ev.id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOne(ev.id); } }}
                />
                <Button size="sm" variant="outline" onClick={() => addOne(ev.id)}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
                <Button size="sm" variant="gold" onClick={() => { setAiOpen(ev.id); setAiText(""); }}>
                  <Sparkles className="w-3 h-3 mr-1" /> Register with AI
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create event dialog */}
      <Dialog open={!!showCreate} onOpenChange={(o) => !o && setShowCreate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {showCreate === "briefing" ? "Briefing" : "Breakfast"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div>
              <Label>Title (optional)</Label>
              <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Q2 Investor Briefing" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea rows={3} value={eventNotes} onChange={(e) => setEventNotes(e.target.value)} placeholder="Topics, location…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(null)}>Cancel</Button>
            <Button onClick={submitCreate} disabled={createEvent.isPending}>
              {createEvent.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI bulk attendance */}
      <Dialog open={!!aiOpen} onOpenChange={(o) => !o && setAiOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#B89555]" /> Register attendance with AI</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-[#1A1A1A]/70">
              Paste a list (one broker per line — names, phones, or emails). AI will match against existing brokers in this agency, create missing brokers, and register them as attendees.
            </p>
            <Textarea
              rows={10}
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder={"Ahmed Hassan\nSara K +971557654321\njohn@example.com\n..."}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiOpen(null)} disabled={aiBusy}>Cancel</Button>
            <Button onClick={runAI} disabled={!aiText.trim() || aiBusy}>
              {aiBusy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Register attendees
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
