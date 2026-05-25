import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useEventManagement, type AppEvent } from "@/hooks/useEventManagement";
import { Calendar, MapPin, Users, Plus, Send, Trash2, Edit, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-[#B89555]/10 text-[#1A1A1A]/70 border-[#B89555]/30",
  published: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/30",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/30",
};

const CATEGORIES = [
  { value: "all", label: "All Users" },
  { value: "investor", label: "Investors Only" },
  { value: "broker", label: "Brokers Only" },
  { value: "developer", label: "Developers Only" },
];

export default function EventManagementHub() {
  const { events, loading, createEvent, updateEvent, deleteEvent, sendInvitations, fetchInvitations } = useEventManagement();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_date: "", event_end_date: "", location: "",
    event_type: "launch", target_categories: ["all"] as string[], status: "draft",
    invitation_template: "", max_attendees: "",
  });
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [inviteEmails, setInviteEmails] = useState("");

  const handleCreate = async () => {
    if (!form.title || !form.event_date) return;
    await createEvent({
      title: form.title,
      description: form.description || null,
      event_date: new Date(form.event_date).toISOString(),
      event_end_date: form.event_end_date ? new Date(form.event_end_date).toISOString() : null,
      location: form.location || null,
      event_type: form.event_type,
      target_categories: form.target_categories,
      status: form.status,
      invitation_template: form.invitation_template || null,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
    });
    setShowCreate(false);
    setForm({ title: "", description: "", event_date: "", event_end_date: "", location: "", event_type: "launch", target_categories: ["all"], status: "draft", invitation_template: "", max_attendees: "" });
  };

  const handlePublish = async (id: string) => {
    await updateEvent(id, { status: "published" } as any);
  };

  const handleSendInvites = async () => {
    if (!selectedEvent || !inviteEmails.trim()) return;
    const emails = inviteEmails.split(",").map(e => e.trim()).filter(Boolean);
    await sendInvitations(selectedEvent.id, emails.map(email => ({ user_email: email })));
    setInviteEmails("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Event Management</h1>
          <p className="text-sm text-muted-foreground">Create events, manage invitations, and track RSVPs</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[hsl(36,40%,70%)] to-[hsl(38,35%,60%)] text-[hsl(32,28%,13%)]">
              <Plus className="w-4 h-4 mr-2" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event title" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date *</Label><Input type="datetime-local" value={form.event_date} onChange={(e) => setForm(f => ({ ...f, event_date: e.target.value }))} /></div>
                <div><Label>End Date</Label><Input type="datetime-local" value={form.event_end_date} onChange={(e) => setForm(f => ({ ...f, event_end_date: e.target.value }))} /></div>
              </div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Event location" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Event Type</Label>
                  <Select value={form.event_type} onValueChange={(v) => setForm(f => ({ ...f, event_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="launch">Launch</SelectItem>
                      <SelectItem value="briefing">Briefing</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Target Audience</Label>
                  <Select value={form.target_categories[0]} onValueChange={(v) => setForm(f => ({ ...f, target_categories: [v] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Max Attendees</Label><Input type="number" value={form.max_attendees} onChange={(e) => setForm(f => ({ ...f, max_attendees: e.target.value }))} placeholder="Unlimited" /></div>
              <div><Label>Invitation Template</Label><Textarea value={form.invitation_template} onChange={(e) => setForm(f => ({ ...f, invitation_template: e.target.value }))} placeholder="Custom invitation message..." rows={3} /></div>
              <div className="flex gap-3">
                <Button onClick={handleCreate} className="bg-gradient-to-r from-[hsl(36,40%,70%)] to-[hsl(38,35%,60%)] text-[hsl(32,28%,13%)]">Create Event</Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-[hsl(36,40%,70%)] border-t-transparent rounded-full" /></div>
      ) : events.length === 0 ? (
        <Card className="border-[hsl(36,40%,70%)]/20">
          <CardContent className="p-8 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-muted-foreground">No events created yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-[hsl(36,40%,70%)]/20 hover:border-[hsl(36,40%,70%)]/40 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[hsl(36,40%,70%)]/20 to-[hsl(36,40%,70%)]/5 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-[hsl(36,40%,70%)]">{format(new Date(event.event_date), "dd")}</span>
                        <span className="text-[10px] text-muted-foreground">{format(new Date(event.event_date), "MMM yy")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <Badge className={STATUS_STYLES[event.status] || STATUS_STYLES.draft}>{event.status}</Badge>
                          <Badge variant="outline" className="text-[10px]">{event.event_type}</Badge>
                        </div>
                        {event.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>}
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                          {event.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>}
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{format(new Date(event.event_date), "HH:mm")}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{event.target_categories.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {event.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => handlePublish(event.id)} className="text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Publish
                        </Button>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedEvent(event)} className="text-xs">
                            <Send className="w-3 h-3 mr-1" /> Invite
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Send Invitations — {event.title}</DialogTitle></DialogHeader>
                          <div className="space-y-4 pt-2">
                            <div>
                              <Label>Email addresses (comma-separated)</Label>
                              <Textarea value={inviteEmails} onChange={(e) => setInviteEmails(e.target.value)} placeholder="email1@example.com, email2@example.com" rows={4} />
                            </div>
                            <Button onClick={handleSendInvites} className="bg-gradient-to-r from-[hsl(36,40%,70%)] to-[hsl(38,35%,60%)] text-[hsl(32,28%,13%)]">
                              <Send className="w-4 h-4 mr-2" /> Send Invitations
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button size="sm" variant="ghost" onClick={() => deleteEvent(event.id)} className="text-red-500 hover:bg-red-500/10">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
