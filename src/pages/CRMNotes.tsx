/**
 * CRMNotes — owner notes with alerts, repeat and reminders.
 *
 * Notes live in public.owner_notes (previously browser-only localStorage, which
 * is migrated once on first load). Each note can carry a reminder with a repeat
 * rule, a lead time, snooze and alert channels (in-app bell + email).
 * Notes are deliberately never written to the calendar.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  StickyNote, Plus, ArrowLeft, Search, Trash2, Edit2, Save, X, Mic, ListChecks,
  Bell, BellRing, Repeat, Clock, Check, AlarmClockOff,
} from "lucide-react";
import { format, isPast } from "date-fns";
import VoiceNoteRecorder from "@/components/crm/VoiceNoteRecorder";
import NoteAlertEditor, { NoteAlertValue } from "@/components/crm/NoteAlertEditor";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  is_pinned: boolean;
  is_done: boolean;
  reminder_at: string | null;
  repeat_rule: string;
  repeat_until: string | null;
  lead_minutes: number;
  alert_channels: string[];
  snoozed_until: string | null;
  last_alerted_at: string | null;
  next_alert_at: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT =
  "id,title,content,color,is_pinned,is_done,reminder_at,repeat_rule,repeat_until,lead_minutes,alert_channels,snoozed_until,last_alerted_at,next_alert_at,created_at,updated_at";

const CARD_TINTS = ["pearl", "emerald", "sand", "sky", "rose", "violet"] as const;
const tintClass: Record<string, string> = {
  pearl: "bg-card border-border/60",
  emerald: "bg-[color:var(--emerald-1,#064E3B)]/[0.06] border-[color:var(--emerald-1,#064E3B)]/25",
  sand: "bg-muted/50 border-border/60",
  sky: "bg-accent/30 border-border/60",
  rose: "bg-destructive/[0.06] border-destructive/20",
  violet: "bg-secondary/40 border-border/60",
};

const repeatLabel: Record<string, string> = {
  none: "",
  daily: "daily",
  weekdays: "weekdays",
  weekly: "weekly",
  biweekly: "every 2 weeks",
  monthly: "monthly",
  yearly: "yearly",
};

const SNOOZE_OPTIONS = [10, 60, 1440];
const snoozeLabel = (m: number) => (m < 60 ? `${m}m` : m < 1440 ? `${m / 60}h` : `${m / 1440}d`);

const CRMNotes = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [alertNote, setAlertNote] = useState<Note | null>(null);

  const loadNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("owner_notes")
      .select(SELECT)
      .eq("is_archived", false)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("[CRMNotes] load failed", error);
      toast.error("Could not load notes");
      setLoading(false);
      return;
    }
    setNotes((data ?? []) as unknown as Note[]);
    setLoading(false);
  }, []);

  /** One-time migration of legacy browser-only notes into the database. */
  const migrateLegacyNotes = useCallback(async () => {
    if (!user) return;
    const key = `crm_notes_${user.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.removeItem(key);
        return;
      }
      const rows = parsed.map((n: any) => ({
        owner_id: user.id,
        title: String(n.title ?? "Note").slice(0, 200),
        content: String(n.content ?? "").slice(0, 20000),
        color: "pearl",
      }));
      const { error } = await supabase.from("owner_notes").insert(rows);
      if (error) throw error;
      localStorage.setItem(`${key}__migrated`, raw);
      localStorage.removeItem(key);
      toast.success(`${rows.length} note(s) moved into your account`);
    } catch (e) {
      console.error("[CRMNotes] migration failed", e);
    }
  }, [user]);

  /** Fire any reminders that came due while the owner was away. */
  const dispatchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("owner-note-alerts", {
        body: { action: "dispatch" },
      });
      if (error) return;
      const count = (data as any)?.fired_count ?? 0;
      if (count > 0) {
        toast.info(`${count} note reminder${count === 1 ? "" : "s"} alerted`);
        await loadNotes();
      }
    } catch {
      /* silent — alerts also run on the next visit */
    }
  }, [loadNotes]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    (async () => {
      await migrateLegacyNotes();
      await loadNotes();
      void dispatchAlerts();
    })();
  }, [authLoading, user, navigate, migrateLegacyNotes, loadNotes, dispatchAlerts]);

  const addNote = async (content?: string) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("owner_notes")
      .insert({
        owner_id: user.id,
        title: content ? "Voice Note" : "New Note",
        content: content ?? "",
        color: CARD_TINTS[Math.floor(Math.random() * CARD_TINTS.length)],
      })
      .select(SELECT)
      .maybeSingle();
    if (error || !data) {
      toast.error("Could not create note");
      return;
    }
    const note = data as unknown as Note;
    setNotes((prev) => [note, ...prev]);
    if (!content) {
      setEditingId(note.id);
      setEditTitle(note.title);
      setEditContent(note.content);
    }
    toast.success("Note created");
  };

  const patchNote = async (id: string, patch: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from("owner_notes")
      .update(patch)
      .eq("id", id)
      .select(SELECT)
      .maybeSingle();
    if (error || !data) {
      toast.error("Could not save note");
      return null;
    }
    const note = data as unknown as Note;
    setNotes((prev) => prev.map((n) => (n.id === id ? note : n)));
    return note;
  };

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript?.trim()) void addNote(transcript);
    setShowVoiceRecorder(false);
  };

  const extractTasks = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const patterns = [/^[-*]\s*\[?\s?\]?\s*(.+)/gm, /(?:TODO|TASK|ACTION|FOLLOW.?UP):\s*(.+)/gim];
    const extracted: string[] = [];
    patterns.forEach((p) => {
      let m;
      while ((m = p.exec(note.content)) !== null) {
        const t = m[1].trim();
        if (t.length > 3 && !extracted.includes(t)) extracted.push(t);
      }
    });
    if (!extracted.length) {
      toast.info("No tasks found. Use '- [ ] task' or 'TODO: task' format");
      return;
    }
    const existing = JSON.parse(localStorage.getItem(`crm_extracted_tasks_${user?.id}`) || "[]");
    const newTasks = extracted.map((t) => ({
      id: `task-${Date.now()}-${Math.random()}`,
      text: t,
      done: false,
      noteId,
      createdAt: new Date().toISOString(),
    }));
    localStorage.setItem(`crm_extracted_tasks_${user?.id}`, JSON.stringify([...newTasks, ...existing]));
    toast.success(`${extracted.length} task(s) extracted from note!`);
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from("owner_notes").delete().eq("id", noteId);
    if (error) {
      toast.error("Could not delete note");
      return;
    }
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success("Note deleted");
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const saved = await patchNote(editingId, { title: editTitle || "Untitled", content: editContent });
    if (saved) {
      setEditingId(null);
      toast.success("Note saved");
    }
  };

  const saveAlert = async (value: NoteAlertValue) => {
    if (!alertNote) return;
    const saved = await patchNote(alertNote.id, { ...value, snoozed_until: null, is_done: false });
    if (saved) {
      setAlertNote(null);
      toast.success(value.reminder_at ? "Alert set" : "Alert removed");
    }
  };

  const snooze = async (note: Note, minutes: number) => {
    const saved = await patchNote(note.id, {
      snoozed_until: new Date(Date.now() + minutes * 60000).toISOString(),
    });
    if (saved) toast.success(`Snoozed ${snoozeLabel(minutes)}`);
  };

  const completeReminder = async (note: Note) => {
    const saved = await patchNote(note.id, { reminder_at: null, repeat_rule: "none", snoozed_until: null });
    if (saved) toast.success("Reminder cleared");
  };

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [notes, searchQuery]);

  const dueCount = notes.filter((n) => n.reminder_at && isPast(new Date(n.reminder_at))).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-0.5 md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8">
        <header className="border-b border-border/60 bg-background sticky top-0 lg:top-[48px] z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <Link to="/crm">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to CRM
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 rounded-lg bg-muted border border-border/60">
                  <StickyNote className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-bold leading-tight">Notes</h1>
                  <p className="text-xs text-muted-foreground">
                    {notes.length} notes{dueCount > 0 ? ` · ${dueCount} due` : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                variant="secondary"
                size="sm"
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice Note
              </Button>
              <Button onClick={() => addNote()} variant="primary" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {showVoiceRecorder && (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mic className="h-5 w-5" />
                  Voice Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Record a voice note — your speech is transcribed and saved automatically.
                </p>
                <VoiceNoteRecorder onTranscript={handleVoiceTranscript} />
              </CardContent>
            </Card>
          )}

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredNotes.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="py-12 text-center">
                <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium">No notes yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first note to get started</p>
                <Button onClick={() => addNote()} variant="primary" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => {
                const due = note.reminder_at ? isPast(new Date(note.reminder_at)) : false;
                return (
                  <Card
                    key={note.id}
                    className={`border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                      tintClass[note.color] ?? tintClass.pearl
                    }`}
                  >
                    <CardContent className="p-4">
                      {editingId === note.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="font-semibold"
                            placeholder="Note title"
                          />
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[120px] resize-none"
                            placeholder="Write your note..."
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={saveEdit} variant="primary">
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold break-words">{note.title}</h3>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setAlertNote(note)}
                                className="h-7 w-7 p-0"
                                title="Alert, repeat & reminder"
                              >
                                {note.reminder_at ? (
                                  <BellRing className={`h-3 w-3 ${due ? "text-destructive" : ""}`} />
                                ) : (
                                  <Bell className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => extractTasks(note.id)}
                                className="h-7 w-7 p-0"
                                title="Extract tasks from note"
                              >
                                <ListChecks className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(note)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNote(note.id)}
                                className="h-7 w-7 p-0 hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                            {note.content || "Empty note..."}
                          </p>

                          {note.reminder_at && (
                            <div className="mt-3 space-y-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge
                                  variant={due ? "destructive" : "default"}
                                  className="rounded-full inline-flex items-center gap-1"
                                >
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(note.reminder_at), "MMM d, HH:mm")}
                                </Badge>
                                {note.repeat_rule !== "none" && (
                                  <Badge variant="secondary" className="rounded-full inline-flex items-center gap-1">
                                    <Repeat className="h-3 w-3" />
                                    {repeatLabel[note.repeat_rule]}
                                  </Badge>
                                )}
                                {note.snoozed_until && new Date(note.snoozed_until) > new Date() && (
                                  <Badge variant="secondary" className="rounded-full">
                                    snoozed
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {SNOOZE_OPTIONS.map((m) => (
                                  <Button
                                    key={m}
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => snooze(note, m)}
                                  >
                                    <AlarmClockOff className="h-3 w-3 mr-1" />
                                    {snoozeLabel(m)}
                                  </Button>
                                ))}
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => completeReminder(note)}
                                >
                                  <Check className="h-3 w-3 mr-1" />
                                  Done
                                </Button>
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-muted-foreground mt-3">
                            Updated {format(new Date(note.updated_at), "MMM d, yyyy")}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {alertNote && (
        <NoteAlertEditor
          open={!!alertNote}
          onOpenChange={(v) => !v && setAlertNote(null)}
          noteTitle={alertNote.title}
          value={{
            reminder_at: alertNote.reminder_at,
            repeat_rule: alertNote.repeat_rule,
            repeat_until: alertNote.repeat_until,
            lead_minutes: alertNote.lead_minutes,
            alert_channels: alertNote.alert_channels,
          }}
          onSave={saveAlert}
        />
      )}
    </div>
  );
};

export default CRMNotes;
