/**
 * Unified Owner Calendar — single source of truth for `/owner/crm?view=calendar`
 * and the calendar shortcut. Backed by public.owner_calendar_events.
 *
 * Features:
 *  - Add / edit / delete events
 *  - Attendee details (name, phone, email)
 *  - Reminders (defaults: 1 day, 30 min, 15 min) — editable, removable, addable
 *  - Auto-emails the attendee a meeting agenda when an email is provided
 */
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon, Plus, ArrowLeft, Clock, MapPin,
  Mail, Phone, User, Bell, X, Trash2, Pencil,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isToday, addMonths, subMonths,
} from "date-fns";

interface Reminder {
  /** minutes before start_at */
  minutes: number;
}

interface EventMeta {
  attendee_name?: string;
  attendee_phone?: string;
  attendee_email?: string;
  agenda?: string;
  reminders?: Reminder[];
}

interface OwnerEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  metadata: EventMeta | null;
}

const DEFAULT_REMINDERS: Reminder[] = [
  { minutes: 1440 }, // 1 day
  { minutes: 30 },
  { minutes: 15 },
];

const formatLocalDateTime = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const presetMinutes = [15, 30, 60, 120, 1440, 2880];
const reminderLabel = (m: number) => {
  if (m < 60) return `${m} minutes before`;
  if (m < 1440) return `${m / 60} hour${m === 60 ? "" : "s"} before`;
  return `${m / 1440} day${m === 1440 ? "" : "s"} before`;
};

const CRMCalendar = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<OwnerEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Modal state
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    agenda: "",
    location: "",
    start: formatLocalDateTime(new Date()),
    duration: 60,
    attendeeName: "",
    attendeePhone: "",
    attendeeEmail: "",
    reminders: [...DEFAULT_REMINDERS] as Reminder[],
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }
    fetchEvents();
  }, [authLoading, user, navigate, currentMonth]);

  // Auto-open modal from URL params (e.g. shortcut prefill)
  useEffect(() => {
    const title = searchParams.get("title");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    if (!title && !date) return;
    const d = date ? new Date(date) : new Date();
    if (time) {
      const [h, m] = time.split(":").map(Number);
      d.setHours(h || 10, m || 0, 0, 0);
    }
    setForm((p) => ({ ...p, title: title || "", start: formatLocalDateTime(d) }));
    setEditingId(null);
    setOpen(true);
    window.history.replaceState({}, "", window.location.pathname + window.location.search.replace(/[?&](title|date|time)=[^&]*/g, "").replace(/^&/, "?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);
      const { data, error } = await supabase
        .from("owner_calendar_events")
        .select("id,title,description,location,start_at,end_at,metadata")
        .eq("owner_id", user.id)
        .gte("start_at", monthStart.toISOString())
        .lte("start_at", monthEnd.toISOString())
        .order("start_at", { ascending: true });
      if (error) throw error;
      setEvents((data || []) as unknown as OwnerEvent[]);
    } catch (e: any) {
      console.error("Failed to fetch events", e);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.start_at), date));

  const dayHasEvents = (date: Date) => getEventsForDate(date).length > 0;

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const openCreate = (presetDate?: Date) => {
    const start = presetDate || new Date();
    if (presetDate) {
      start.setHours(10, 0, 0, 0);
    }
    setEditingId(null);
    setForm({
      title: "",
      agenda: "",
      location: "",
      start: formatLocalDateTime(start),
      duration: 60,
      attendeeName: "",
      attendeePhone: "",
      attendeeEmail: "",
      reminders: [...DEFAULT_REMINDERS],
    });
    setOpen(true);
  };

  const openEdit = (ev: OwnerEvent) => {
    const meta = (ev.metadata || {}) as EventMeta;
    const start = new Date(ev.start_at);
    const end = new Date(ev.end_at);
    const duration = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      agenda: meta.agenda || ev.description || "",
      location: ev.location || "",
      start: formatLocalDateTime(start),
      duration,
      attendeeName: meta.attendee_name || "",
      attendeePhone: meta.attendee_phone || "",
      attendeeEmail: meta.attendee_email || "",
      reminders: meta.reminders?.length ? meta.reminders : [...DEFAULT_REMINDERS],
    });
    setOpen(true);
  };

  const removeReminder = (idx: number) =>
    setForm((p) => ({ ...p, reminders: p.reminders.filter((_, i) => i !== idx) }));

  const addReminder = (minutes: number) => {
    if (form.reminders.some((r) => r.minutes === minutes)) return;
    setForm((p) => ({
      ...p,
      reminders: [...p.reminders, { minutes }].sort((a, b) => b.minutes - a.minutes),
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.title.trim()) { toast.error("Subject is required"); return; }
    const start = new Date(form.start);
    if (Number.isNaN(start.getTime())) { toast.error("Invalid date/time"); return; }
    const end = new Date(start.getTime() + form.duration * 60 * 1000);

    const meta: EventMeta = {
      attendee_name: form.attendeeName.trim() || undefined,
      attendee_phone: form.attendeePhone.trim() || undefined,
      attendee_email: form.attendeeEmail.trim() || undefined,
      agenda: form.agenda.trim() || undefined,
      reminders: form.reminders,
    };

    try {
      let eventId = editingId;
      if (editingId) {
        const { error } = await supabase
          .from("owner_calendar_events")
          .update({
            title: form.title.trim(),
            description: form.agenda.trim() || null,
            location: form.location.trim() || null,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            metadata: meta as any,
          })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Event updated");
      } else {
        const { data, error } = await supabase
          .from("owner_calendar_events")
          .insert({
            owner_id: user.id,
            title: form.title.trim(),
            description: form.agenda.trim() || null,
            location: form.location.trim() || null,
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            metadata: meta as any,
          })
          .select("id")
          .single();
        if (error) throw error;
        eventId = data?.id || null;
        toast.success("Event created");
      }

      // Fire agenda email when an attendee email is set (best-effort)
      if (eventId && meta.attendee_email) {
        try {
          await supabase.functions.invoke("send-meeting-agenda", {
            body: {
              eventId,
              mode: editingId ? "update" : "create",
            },
          });
          toast.success(`Meeting agenda emailed to ${meta.attendee_email}`);
        } catch (err) {
          console.warn("Failed to send meeting agenda email", err);
        }
      }

      setOpen(false);
      setEditingId(null);
      fetchEvents();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save event");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("owner_calendar_events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Event deleted");
    fetchEvents();
  };

  if (loading && events.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[#B89555]/30 bg-[#FDFBF7] sticky top-0 lg:top-[48px] z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/owner/crm">
              <Button variant="ghost" size="sm" className="text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to CRM
              </Button>
            </Link>
            <div className="h-6 w-px bg-[#EFE6D6]" />
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#EFE6D6] border border-[#B89555]/40">
                <CalendarIcon className="h-5 w-5 text-[#1A1A1A]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#1A1A1A]">Calendar</h1>
                <p className="text-xs text-[#1A1A1A]/70">{events.length} event{events.length === 1 ? "" : "s"} this month</p>
              </div>
            </div>
          </div>
          <Button onClick={() => openCreate()} className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <Card className="lg:col-span-2 border-[#B89555]/30 bg-[#FDFBF7]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-[#1A1A1A]">{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>Today</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>Next</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-[#1A1A1A]/70 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24" />
                ))}
                {daysInMonth.map((day) => {
                  const dayEvents = getEventsForDate(day);
                  const has = dayEvents.length > 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      onDoubleClick={() => openCreate(day)}
                      className={`h-24 p-1.5 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "border-[#B89555] bg-[#EFE6D6]"
                          : isToday(day)
                          ? "border-[#B89555]/60 bg-[#F7F2EA] ring-1 ring-[#B89555]/30"
                          : has
                          ? "border-[#B89555]/40 bg-[#EFE6D6]/60 hover:bg-[#EFE6D6]"
                          : "border-[#B89555]/15 bg-[#FDFBF7] hover:bg-[#F7F2EA]"
                      }`}
                    >
                      <span className={`text-sm tabular-nums ${isToday(day) ? "font-bold" : "font-medium"} text-[#1A1A1A]`}>
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div key={ev.id}
                               className="text-[10px] leading-tight px-1.5 py-0.5 rounded border truncate bg-[#1A1A1A] text-[#FDFBF7] border-[#1A1A1A]">
                            <span className="font-semibold tabular-nums">{format(new Date(ev.start_at), "HH:mm")}</span> {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[10px] text-[#1A1A1A]/70">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#1A1A1A]/60 mt-3">Tip: double-click a day to add an event.</p>
            </CardContent>
          </Card>

          {/* Selected day panel */}
          <Card className="border-[#B89555]/30 bg-[#FDFBF7]">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#1A1A1A]">
                {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a day"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedDate ? (
                <div className="text-center py-8 text-sm text-[#1A1A1A]/60">
                  Click any day to view its events.
                </div>
              ) : selectedEvents.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-center py-4">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-[#1A1A1A]/60" />
                    <p className="text-sm text-[#1A1A1A]/70">No events on this day</p>
                  </div>
                  <Button onClick={() => openCreate(selectedDate)} className="w-full bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
                    <Plus className="h-4 w-4 mr-2" /> Add Event
                  </Button>
                </div>
              ) : (
                selectedEvents.map((ev) => {
                  const meta = (ev.metadata || {}) as EventMeta;
                  return (
                    <div key={ev.id} className="p-3 rounded-lg bg-[#F7F2EA] border border-[#B89555]/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1A1A1A] truncate">{ev.title}</p>
                          <p className="text-xs text-[#1A1A1A]/70 tabular-nums mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {format(new Date(ev.start_at), "HH:mm")} – {format(new Date(ev.end_at), "HH:mm")}
                          </p>
                          {ev.location && (
                            <p className="text-xs text-[#1A1A1A]/70 mt-0.5 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {ev.location}
                            </p>
                          )}
                          {meta.attendee_name && (
                            <Badge variant="outline" className="mt-1 text-[10px] border-[#B89555]/40 text-[#1A1A1A]">
                              {meta.attendee_name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(ev)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-700" onClick={() => handleDelete(ev.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Event Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-[#FDFBF7] border-[#B89555]/40">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {editingId ? "Edit Event" : "New Event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-[#1A1A1A]">Subject *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                     placeholder="Meeting with…" className="bg-white border-[#B89555]/40" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]">Agenda / Description</Label>
              <Textarea rows={3} value={form.agenda} onChange={(e) => setForm((p) => ({ ...p, agenda: e.target.value }))}
                        placeholder="What will you be discussing?" className="bg-white border-[#B89555]/40" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[#1A1A1A]">Date &amp; time *</Label>
                <Input type="datetime-local" value={form.start}
                       onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))}
                       className="bg-white border-[#B89555]/40" />
              </div>
              <div>
                <Label className="text-[#1A1A1A]">Duration (mins)</Label>
                <Input type="number" min={15} step={15} value={form.duration}
                       onChange={(e) => setForm((p) => ({ ...p, duration: parseInt(e.target.value) || 60 }))}
                       className="bg-white border-[#B89555]/40" />
              </div>
            </div>
            <div>
              <Label className="text-[#1A1A1A] flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Location</Label>
              <Input value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                     placeholder="Office, Dubai Marina, or address…" className="bg-white border-[#B89555]/40" />
            </div>
            <div className="rounded-lg border border-[#B89555]/30 p-3 space-y-2 bg-[#F7F2EA]/40">
              <p className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Attendee</p>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Name" value={form.attendeeName}
                       onChange={(e) => setForm((p) => ({ ...p, attendeeName: e.target.value }))}
                       className="bg-white border-[#B89555]/40" />
                <Input placeholder="Phone" value={form.attendeePhone}
                       onChange={(e) => setForm((p) => ({ ...p, attendeePhone: e.target.value }))}
                       className="bg-white border-[#B89555]/40" />
              </div>
              <Input placeholder="Email (sends meeting agenda automatically)" value={form.attendeeEmail}
                     onChange={(e) => setForm((p) => ({ ...p, attendeeEmail: e.target.value }))}
                     className="bg-white border-[#B89555]/40" />
            </div>
            <div className="rounded-lg border border-[#B89555]/30 p-3 space-y-2 bg-[#F7F2EA]/40">
              <p className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> Reminders</p>
              <div className="flex flex-wrap gap-1.5">
                {form.reminders.map((r, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[#EFE6D6] border border-[#B89555]/40 text-[#1A1A1A]">
                    {reminderLabel(r.minutes)}
                    <button onClick={() => removeReminder(i)} className="text-[#1A1A1A]/60 hover:text-red-700">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {form.reminders.length === 0 && (
                  <span className="text-xs text-[#1A1A1A]/60">No reminders</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#B89555]/20">
                <span className="text-[11px] text-[#1A1A1A]/60 self-center mr-1">Add:</span>
                {presetMinutes.filter((m) => !form.reminders.some((r) => r.minutes === m)).map((m) => (
                  <button key={m} onClick={() => addReminder(m)}
                          className="text-[11px] px-2 py-0.5 rounded-full border border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]">
                    + {reminderLabel(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingId && (
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => { handleDelete(editingId); setOpen(false); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
              {editingId ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMCalendar;
