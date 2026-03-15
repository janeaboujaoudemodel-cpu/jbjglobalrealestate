import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { PartyPopper, Plus, Calendar, MapPin, Users, Send, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  submitted: { label: "Pending Approval", className: "bg-amber-500/10 text-amber-600" },
  approved: { label: "Approved", className: "bg-emerald-500/10 text-emerald-600" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
};

const DeveloperLaunchEvents = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    developer_name: "", project_name: "", event_title: "", event_description: "",
    event_date: "", event_end_date: "", venue: "", venue_address: "", max_attendees: "100",
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["dev-launch-events", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("launch_events")
        .select("*")
        .eq("developer_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from("launch_events").insert({
        developer_user_id: user!.id,
        developer_name: form.developer_name,
        project_name: form.project_name,
        event_title: form.event_title,
        event_description: form.event_description || null,
        event_date: new Date(form.event_date).toISOString(),
        event_end_date: form.event_end_date ? new Date(form.event_end_date).toISOString() : null,
        venue: form.venue || null,
        venue_address: form.venue_address || null,
        max_attendees: parseInt(form.max_attendees) || 100,
        approval_status: status as any,
      });
      if (error) throw error;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["dev-launch-events"] });
      setShowCreate(false);
      setForm({ developer_name: "", project_name: "", event_title: "", event_description: "", event_date: "", event_end_date: "", venue: "", venue_address: "", max_attendees: "100" });
      toast.success(status === "submitted" ? "Event submitted for approval!" : "Event draft saved.");
    },
    onError: () => toast.error("Failed to create event."),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Launch Events</h1>
          <p className="text-muted-foreground mt-1">Create and manage project launch events and broker invitations.</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> New Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create Launch Event</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Developer Name *</Label><Input value={form.developer_name} onChange={(e) => setForm({ ...form, developer_name: e.target.value })} /></div>
              <div><Label>Project Name *</Label><Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} /></div>
              <div><Label>Event Title *</Label><Input value={form.event_title} onChange={(e) => setForm({ ...form, event_title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={form.event_description} onChange={(e) => setForm({ ...form, event_description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start Date *</Label><Input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
                <div><Label>End Date</Label><Input type="datetime-local" value={form.event_end_date} onChange={(e) => setForm({ ...form, event_end_date: e.target.value })} /></div>
              </div>
              <div><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} /></div>
              <div><Label>Venue Address</Label><Input value={form.venue_address} onChange={(e) => setForm({ ...form, venue_address: e.target.value })} /></div>
              <div><Label>Max Attendees</Label><Input type="number" value={form.max_attendees} onChange={(e) => setForm({ ...form, max_attendees: e.target.value })} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => createMutation.mutate("draft")} disabled={createMutation.isPending}>Save Draft</Button>
                <Button onClick={() => createMutation.mutate("submitted")} disabled={createMutation.isPending || !form.event_title || !form.event_date || !form.developer_name || !form.project_name}>
                  <Send className="w-4 h-4 mr-1" /> Submit
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Clock className="w-6 h-6 animate-spin text-primary" /></div>
      ) : events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <PartyPopper className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No launch events yet. Create your first event to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event: any) => {
            const badge = STATUS_BADGE[event.approval_status] || STATUS_BADGE.draft;
            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{event.event_title}</CardTitle>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.developer_name} — {event.project_name}</p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(event.event_date).toLocaleDateString("en-AE", { dateStyle: "medium" })}</span>
                  </div>
                  {event.venue && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{event.venue}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Max {event.max_attendees} attendees</span>
                  </div>
                  {event.admin_notes && (
                    <div className="mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs">
                      <AlertTriangle className="w-3 h-3 inline mr-1 text-destructive" />
                      {event.admin_notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeveloperLaunchEvents;
