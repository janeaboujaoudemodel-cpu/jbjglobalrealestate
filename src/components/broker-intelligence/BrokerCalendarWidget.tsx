import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, Clock, MapPin, User, Plus, ChevronRight, 
  Phone, Video, Building2, ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  type: "viewing" | "meeting" | "call" | "follow-up";
  time: string;
  location?: string;
  client?: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Property Viewing - Marina Heights", type: "viewing", time: "10:00 AM", location: "Dubai Marina", client: "Ahmed K." },
  { id: "2", title: "Client Call - Investment Discussion", type: "call", time: "2:00 PM", client: "Sarah J." },
  { id: "3", title: "Developer Meeting - Emaar", type: "meeting", time: "4:30 PM", location: "Downtown Dubai" },
  { id: "4", title: "Follow-up - Business Bay Lead", type: "follow-up", time: "5:00 PM", client: "Mohammed H." },
];

export function BrokerCalendarWidget() {
  const [events] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickEvent, setQuickEvent] = useState({
    title: "",
    type: "meeting",
    time: "",
    location: "",
    client: "",
  });

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-AE", { 
    weekday: "long", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });

  const getEventIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "viewing":
        return <Building2 className="w-4 h-4 text-emerald-400" />;
      case "meeting":
        return <Video className="w-4 h-4 text-blue-400" />;
      case "call":
        return <Phone className="w-4 h-4 text-purple-400" />;
      case "follow-up":
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const getEventTypeBadge = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "viewing":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Viewing</Badge>;
      case "meeting":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Meeting</Badge>;
      case "call":
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">Call</Badge>;
      case "follow-up":
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">Follow-up</Badge>;
    }
  };

  const handleQuickAdd = () => {
    if (!quickEvent.title || !quickEvent.time) {
      toast.error("Please fill in title and time");
      return;
    }
    toast.success("Event added to calendar");
    setShowQuickAdd(false);
    setQuickEvent({ title: "", type: "meeting", time: "", location: "", client: "" });
  };

  return (
    <div className="space-y-6">
      {/* Today's Header */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold" />
              Today's Schedule
            </CardTitle>
            <Button
              variant="dark-outline"
              size="sm"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Quick Add
            </Button>
          </div>
          <p className="text-zinc-500 text-sm">{formattedDate}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Add Form */}
          {showQuickAdd && (
            <div className="bg-zinc-800/50 rounded-lg p-4 border border-gold/20 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs">Event Title</Label>
                  <Input
                    placeholder="Meeting title"
                    value={quickEvent.title}
                    onChange={(e) => setQuickEvent({ ...quickEvent, title: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs">Time</Label>
                  <Input
                    type="time"
                    value={quickEvent.time}
                    onChange={(e) => setQuickEvent({ ...quickEvent, time: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white h-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs">Type</Label>
                  <Select value={quickEvent.type} onValueChange={(v) => setQuickEvent({ ...quickEvent, type: v })}>
                    <SelectTriggerDark className="h-9">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark>
                      <SelectItemDark value="viewing">Viewing</SelectItemDark>
                      <SelectItemDark value="meeting">Meeting</SelectItemDark>
                      <SelectItemDark value="call">Call</SelectItemDark>
                      <SelectItemDark value="follow-up">Follow-up</SelectItemDark>
                    </SelectContentDark>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-zinc-400 text-xs">Client (Optional)</Label>
                  <Input
                    placeholder="Client name"
                    value={quickEvent.client}
                    onChange={(e) => setQuickEvent({ ...quickEvent, client: e.target.value })}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 h-9"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ai-gold" size="sm" onClick={handleQuickAdd} className="flex-1">
                  Add Event
                </Button>
                <Button variant="dark-ghost" size="sm" onClick={() => setShowQuickAdd(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Events List */}
          {events.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No events scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 hover:border-gold/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className="text-white font-medium text-sm">{event.title}</span>
                    </div>
                    {getEventTypeBadge(event.type)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.time}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.location}
                      </div>
                    )}
                    {event.client && (
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {event.client}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link to Full Calendar */}
      <Link to="/crm/calendar">
        <Card className="bg-zinc-800/30 border-zinc-800 hover:border-gold/30 transition-colors cursor-pointer">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gold" />
              <div>
                <p className="text-white font-medium text-sm">Open Full Calendar</p>
                <p className="text-zinc-500 text-xs">Manage all events, sync with Google Calendar</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

export default BrokerCalendarWidget;
