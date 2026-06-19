import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CalendarIcon, ListTodo, StickyNote, Plus, Trash2, Check, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDisplayDate } from "@/utils/formatDate";

type Tab = "calendar" | "tasks" | "notes";

interface Props {
  lead: { id: string; full_name?: string | null; email?: string | null; phone?: string | null; pipeline_stage?: string | null } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PIPE_CALENDAR = "broker_personal_calendar";
const PIPE_TASKS = "broker_personal_tasks";
const PIPE_NOTES = "broker_personal_notes";

export default function LeadHubSheet({ lead, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("calendar");
  const leadId = lead?.id ?? null;
  const leadName = lead?.full_name || "Unnamed lead";

  // ---------------- Calendar ----------------
  const events = useQuery({
    queryKey: ["lead-hub-events", user?.id, leadId],
    enabled: !!user?.id && !!leadId && open,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)(PIPE_CALENDAR)
        .select("id, title, description, location, starts_at, ends_at, all_day")
        .eq("broker_user_id", user!.id)
        .eq("lead_id", leadId!)
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [newEvent, setNewEvent] = useState({ title: "", starts_at: "", ends_at: "", location: "" });
  const createEvent = useMutation({
    mutationFn: async () => {
      if (!newEvent.title.trim() || !newEvent.starts_at) throw new Error("Title and start time are required");
      const starts = new Date(newEvent.starts_at).toISOString();
      const ends = newEvent.ends_at
        ? new Date(newEvent.ends_at).toISOString()
        : new Date(new Date(newEvent.starts_at).getTime() + 30 * 60_000).toISOString();
      const { error } = await (supabase.from as any)(PIPE_CALENDAR).insert({
        broker_user_id: user!.id,
        lead_id: leadId,
        title: newEvent.title.trim(),
        location: newEvent.location || null,
        starts_at: starts,
        ends_at: ends,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event added");
      setNewEvent({ title: "", starts_at: "", ends_at: "", location: "" });
      qc.invalidateQueries({ queryKey: ["lead-hub-events"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not add event"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)(PIPE_CALENDAR).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Event removed");
      qc.invalidateQueries({ queryKey: ["lead-hub-events"] });
    },
  });

  // ---------------- Tasks ----------------
  const tasks = useQuery({
    queryKey: ["lead-hub-tasks", user?.id, leadId],
    enabled: !!user?.id && !!leadId && open,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)(PIPE_TASKS)
        .select("id, title, status, due_at, priority")
        .eq("broker_user_id", user!.id)
        .eq("lead_id", leadId!)
        .is("deleted_at", null)
        .order("due_at", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [newTask, setNewTask] = useState({ title: "", due_at: "" });
  const createTask = useMutation({
    mutationFn: async () => {
      if (!newTask.title.trim()) throw new Error("Title is required");
      const { error } = await (supabase.from as any)(PIPE_TASKS).insert({
        broker_user_id: user!.id,
        lead_id: leadId,
        title: newTask.title.trim(),
        status: "todo",
        priority: "normal",
        due_at: newTask.due_at ? new Date(newTask.due_at).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Task added");
      setNewTask({ title: "", due_at: "" });
      qc.invalidateQueries({ queryKey: ["lead-hub-tasks"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not add task"),
  });

  const toggleTask = useMutation({
    mutationFn: async (t: any) => {
      const next = t.status === "done" ? "todo" : "done";
      const { error } = await (supabase.from as any)(PIPE_TASKS)
        .update({ status: next, completed_at: next === "done" ? new Date().toISOString() : null })
        .eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-hub-tasks"] }),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)(PIPE_TASKS)
        .update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-hub-tasks"] }),
  });

  // ---------------- Notes ----------------
  const notes = useQuery({
    queryKey: ["lead-hub-notes", user?.id, leadId],
    enabled: !!user?.id && !!leadId && open,
    queryFn: async () => {
      const { data, error } = await (supabase.from as any)(PIPE_NOTES)
        .select("id, title, body, pinned, created_at, updated_at")
        .eq("broker_user_id", user!.id)
        .eq("lead_id", leadId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const [newNote, setNewNote] = useState("");
  const createNote = useMutation({
    mutationFn: async () => {
      if (!newNote.trim()) throw new Error("Write something first");
      const { error } = await (supabase.from as any)(PIPE_NOTES).insert({
        broker_user_id: user!.id,
        lead_id: leadId,
        body: newNote.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Note saved");
      setNewNote("");
      qc.invalidateQueries({ queryKey: ["lead-hub-notes"] });
    },
    onError: (e: any) => toast.error(e?.message || "Could not save note"),
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from as any)(PIPE_NOTES).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead-hub-notes"] }),
  });

  const counts = useMemo(() => ({
    calendar: events.data?.length ?? 0,
    tasks: tasks.data?.length ?? 0,
    notes: notes.data?.length ?? 0,
  }), [events.data, tasks.data, notes.data]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto bg-[#FDFBF7] border-l border-[#B89555]/30"
      >
        <SheetHeader className="text-left">
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]/55">Lead hub</div>
          <SheetTitle className="text-xl text-[#1A1A1A]">{leadName}</SheetTitle>
          <SheetDescription className="text-[#1A1A1A]/70 flex flex-wrap items-center gap-3 text-xs">
            {lead?.email && (<span className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> {lead.email}</span>)}
            {lead?.phone && (<span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" /> {lead.phone}</span>)}
            {lead?.pipeline_stage && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#EFE6D6] border border-[#B89555]/35 text-[#1A1A1A]">
                {lead.pipeline_stage}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        {/* Tabs */}
        <div className="mt-5 inline-flex rounded-md border border-[#B89555]/35 bg-[#F7F2EA] p-0.5">
          {([
            { id: "calendar", label: "Calendar", icon: CalendarIcon, count: counts.calendar },
            { id: "tasks", label: "Tasks", icon: ListTodo, count: counts.tasks },
            { id: "notes", label: "Notes", icon: StickyNote, count: counts.notes },
          ] as const).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`text-xs px-3 py-1.5 rounded inline-flex items-center gap-1.5 transition-colors ${
                tab === t.id ? "bg-[#EFE6D6] text-[#1A1A1A]" : "text-[#1A1A1A]/65 hover:text-[#1A1A1A]"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
              <span className="tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A]/80">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Calendar tab */}
        {tab === "calendar" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-4 space-y-2">
              <div className="text-xs font-semibold text-[#1A1A1A]">Schedule a meeting / call</div>
              <Input
                placeholder="Title (e.g. Viewing call)"
                value={newEvent.title}
                onChange={(e) => setNewEvent((s) => ({ ...s, title: e.target.value }))}
                className="bg-[#FDFBF7] border-[#B89555]/35 text-[#1A1A1A]"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="datetime-local"
                  value={newEvent.starts_at}
                  onChange={(e) => setNewEvent((s) => ({ ...s, starts_at: e.target.value }))}
                  className="bg-[#FDFBF7] border-[#B89555]/35 text-[#1A1A1A]"
                />
                <Input
                  type="datetime-local"
                  value={newEvent.ends_at}
                  onChange={(e) => setNewEvent((s) => ({ ...s, ends_at: e.target.value }))}
                  className="bg-[#FDFBF7] border-[#B89555]/35 text-[#1A1A1A]"
                />
              </div>
              <Input
                placeholder="Location (optional)"
                value={newEvent.location}
                onChange={(e) => setNewEvent((s) => ({ ...s, location: e.target.value }))}
                className="bg-[#FDFBF7] border-[#B89555]/35 text-[#1A1A1A]"
              />
              <Button
                onClick={() => createEvent.mutate()}
                disabled={createEvent.isPending}
                className="bg-[#0A0A0A] text-white hover:bg-[#1F1F1F] w-full"
                data-allow-dark-cta
              >
                {createEvent.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Add to calendar
              </Button>
            </div>

            <div className="space-y-2">
              {events.isLoading ? (
                <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#B89555]" /></div>
              ) : (events.data ?? []).length === 0 ? (
                <div className="py-8 text-center text-xs text-[#1A1A1A]/60">No events yet for this lead.</div>
              ) : (events.data ?? []).map((e: any) => (
                <div key={e.id} className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/25 p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#1A1A1A] truncate">{e.title}</div>
                    <div className="text-[11px] text-[#1A1A1A]/65">
                      {new Date(e.starts_at).toLocaleString()} {e.location ? `· ${e.location}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteEvent.mutate(e.id)}
                    className="text-[#1A1A1A]/55 hover:text-[#1A1A1A] p-1"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks tab */}
        {tab === "tasks" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-4 space-y-2">
              <div className="text-xs font-semibold text-[#1A1A1A]">Add a follow-up task</div>
              <Input
                placeholder="Task (e.g. Send brochure)"
                value={newTask.title}
                onChange={(e) => setNewTask((s) => ({ ...s, title: e.target.value }))}
                className="bg-[#FDFBF7] border-[#B89555]/35 text-[#1A1A1A]"
              />
              <Input
                type="datetime-local"
                value={newTask.due_at}
                onChange={(e) => setNewTask((s) => ({ ...s, due_at: e.target.value }))}
                className="bg-[#FDFBF7] border-[#B89555]/35 text-[#1A1A1A]"
              />
              <Button
                onClick={() => createTask.mutate()}
                disabled={createTask.isPending}
                className="bg-[#0A0A0A] text-white hover:bg-[#1F1F1F] w-full"
                data-allow-dark-cta
              >
                {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Add task
              </Button>
            </div>

            <div className="space-y-2">
              {tasks.isLoading ? (
                <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#B89555]" /></div>
              ) : (tasks.data ?? []).length === 0 ? (
                <div className="py-8 text-center text-xs text-[#1A1A1A]/60">No tasks yet for this lead.</div>
              ) : (tasks.data ?? []).map((t: any) => (
                <div key={t.id} className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/25 p-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleTask.mutate(t)}
                    className={`h-5 w-5 rounded-md border grid place-items-center transition-colors ${
                      t.status === "done"
                        ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                        : "bg-[#FDFBF7] border-[#B89555]/40"
                    }`}
                    title="Toggle complete"
                  >
                    {t.status === "done" && <Check className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm text-[#1A1A1A] truncate ${t.status === "done" ? "line-through opacity-60" : ""}`}>
                      {t.title}
                    </div>
                    {t.due_at && (
                      <div className="text-[11px] text-[#1A1A1A]/65">Due {formatDisplayDate(t.due_at)}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTask.mutate(t.id)}
                    className="text-[#1A1A1A]/55 hover:text-[#1A1A1A] p-1"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes tab */}
        {tab === "notes" && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-4 space-y-2">
              <div className="text-xs font-semibold text-[#1A1A1A]">Add a note</div>
              <Textarea
                placeholder="What did you discuss with this lead?"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
                className="bg-[#FDFBF7] border-[#B89555]/35 text-[#1A1A1A]"
              />
              <Button
                onClick={() => createNote.mutate()}
                disabled={createNote.isPending}
                className="bg-[#0A0A0A] text-white hover:bg-[#1F1F1F] w-full"
                data-allow-dark-cta
              >
                {createNote.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
                Save note
              </Button>
            </div>

            <div className="space-y-2">
              {notes.isLoading ? (
                <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-[#B89555]" /></div>
              ) : (notes.data ?? []).length === 0 ? (
                <div className="py-8 text-center text-xs text-[#1A1A1A]/60">No notes yet for this lead.</div>
              ) : (notes.data ?? []).map((n: any) => (
                <div key={n.id} className="rounded-lg bg-[#F7F2EA] border border-[#B89555]/25 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[11px] text-[#1A1A1A]/60">{formatDisplayDate(n.updated_at || n.created_at)}</div>
                    <button
                      type="button"
                      onClick={() => deleteNote.mutate(n.id)}
                      className="text-[#1A1A1A]/55 hover:text-[#1A1A1A] p-1"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="text-sm text-[#1A1A1A] whitespace-pre-wrap mt-1">{n.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
