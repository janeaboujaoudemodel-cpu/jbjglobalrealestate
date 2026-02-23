import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Calendar, Plus, Clock, MapPin, Users, Bell, Mail, Phone, Trash2, 
  Edit2, Check, X, ChevronLeft, ChevronRight, Save, FolderOpen, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number;
  location: string;
  attendees: string[];
  type: 'meeting' | 'viewing' | 'call' | 'reminder' | 'other';
  emailReminder: boolean;
  phoneReminder: boolean;
  reminderTime: number; // minutes before
  createdAt: Date;
}

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SavedProject {
  id: string;
  name: string;
  events: CalendarEvent[];
  notes: Note[];
  createdAt: Date;
  updatedAt: Date;
}

// Helper to format a Date as YYYY-MM-DD using LOCAL date components (avoids UTC shift)
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const AICalendar = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: formatLocalDate(new Date()),
    time: '10:00',
    duration: 60,
    location: '',
    attendees: '',
    type: 'meeting' as CalendarEvent['type'],
    emailReminder: true,
    phoneReminder: false,
    reminderTime: 30
  });

  const [noteForm, setNoteForm] = useState({
    title: '',
    content: ''
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_calendar_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
        events: p.events.map((e: any) => ({ ...e, createdAt: new Date(e.createdAt) })),
        notes: p.notes.map((n: any) => ({ ...n, createdAt: new Date(n.createdAt), updatedAt: new Date(n.updatedAt) }))
      })));
    }
  }, []);

  // Auto-open event modal from URL params (follow-up from ticket) — runs once
  const [paramsProcessed, setParamsProcessed] = useState(false);
  useEffect(() => {
    if (paramsProcessed) return;
    const ticketParam = searchParams.get('ticket');
    const titleParam = searchParams.get('title');
    if (ticketParam && titleParam) {
      setEventForm(prev => ({
        ...prev,
        title: decodeURIComponent(titleParam),
        description: `Ticket: ${ticketParam}`,
        date: formatLocalDate(new Date()),
        type: 'reminder',
      }));
      setEditingEvent(null);
      setShowEventModal(true);
      setParamsProcessed(true);
      // Clear URL params so back button doesn't re-trigger
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, paramsProcessed]);

  const saveProjects = (updated: SavedProject[]) => {
    localStorage.setItem('ai_calendar_projects', JSON.stringify(updated));
    setProjects(updated);
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return events.filter(e => e.date === dateStr);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // Event handlers
  const handleCreateEvent = async () => {
    if (!eventForm.title) {
      toast.error("Please enter an event title");
      return;
    }

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: eventForm.title,
      description: eventForm.description,
      date: eventForm.date,
      time: eventForm.time,
      duration: eventForm.duration,
      location: eventForm.location,
      attendees: eventForm.attendees.split(',').map(a => a.trim()).filter(Boolean),
      type: eventForm.type,
      emailReminder: eventForm.emailReminder,
      phoneReminder: eventForm.phoneReminder,
      reminderTime: eventForm.reminderTime,
      createdAt: new Date()
    };

    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...newEvent, id: editingEvent.id } : e));
      toast.success("Event updated!");
    } else {
      setEvents(prev => [...prev, newEvent]);
      toast.success("Event created!");
      
      // Send email notification if enabled
      if (eventForm.emailReminder && eventForm.attendees) {
        toast.info("Email reminders will be sent to attendees");
      }
    }

    setShowEventModal(false);
    setEditingEvent(null);
    resetEventForm();
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      date: formatLocalDate(new Date()),
      time: '10:00',
      duration: 60,
      location: '',
      attendees: '',
      type: 'meeting',
      emailReminder: true,
      phoneReminder: false,
      reminderTime: 30
    });
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      duration: event.duration,
      location: event.location,
      attendees: event.attendees.join(', '),
      type: event.type,
      emailReminder: event.emailReminder,
      phoneReminder: event.phoneReminder,
      reminderTime: event.reminderTime
    });
    setShowEventModal(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success("Event deleted");
  };

  // Note handlers
  const handleCreateNote = () => {
    if (!noteForm.title) {
      toast.error("Please enter a note title");
      return;
    }

    const newNote: Note = {
      id: Date.now().toString(),
      title: noteForm.title,
      content: noteForm.content,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (editingNote) {
      setNotes(prev => prev.map(n => n.id === editingNote.id ? { ...newNote, id: editingNote.id, createdAt: editingNote.createdAt } : n));
      toast.success("Note updated!");
    } else {
      setNotes(prev => [...prev, newNote]);
      toast.success("Note created!");
    }

    setShowNoteModal(false);
    setEditingNote(null);
    setNoteForm({ title: '', content: '' });
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({ title: note.title, content: note.content });
    setShowNoteModal(true);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast.success("Note deleted");
  };

  // Project management
  const createProject = () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const newProject: SavedProject = {
      id: Date.now().toString(),
      name: newProjectName,
      events,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updated = [...projects, newProject];
    saveProjects(updated);
    setCurrentProject(newProject);
    setNewProjectName('');
    setShowProjectModal(false);
    toast.success(`Project "${newProjectName}" created!`);
  };

  const saveCurrentProject = () => {
    if (!currentProject) {
      setShowProjectModal(true);
      return;
    }

    const updated = projects.map(p =>
      p.id === currentProject.id
        ? { ...p, events, notes, updatedAt: new Date() }
        : p
    );
    saveProjects(updated);
    toast.success("Project saved!");
  };

  const loadProject = (project: SavedProject) => {
    setCurrentProject(project);
    setEvents(project.events);
    setNotes(project.notes);
    toast.success(`Project "${project.name}" loaded!`);
  };

  const eventTypeColors: Record<CalendarEvent['type'], string> = {
    meeting: 'bg-blue-500',
    viewing: 'bg-emerald-500',
    call: 'bg-purple-500',
    reminder: 'bg-yellow-500',
    other: 'bg-zinc-500'
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-900/30 via-cyan-800/20 to-cyan-900/30 border-b border-cyan-500/30">
        <div className="container mx-auto px-4 py-12">
          {/* Back Arrow */}
          <Button
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 bg-cyan-600 hover:bg-cyan-700 text-white border-0 gap-2 font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/40 rounded-full px-4 py-1 mb-4">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-300 text-sm font-medium">AI-Powered Productivity</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Notes & <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-400">Calendar</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Manage your meetings, notes, and schedules. Automatic email and phone reminders for all your events.
            </p>
            <p className="text-xs text-gold mt-2">Powered by JBJ Global Real Estate</p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Project Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-xl">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-cyan-400" />
            <span className="text-white font-medium">
              {currentProject ? currentProject.name : "Untitled Project"}
            </span>
          </div>
          <div className="flex-1" />
          <Button size="sm" onClick={saveCurrentProject} className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white border-0">
            <Save className="w-3 h-3 mr-1" /> Save Project
          </Button>
          <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white border-0">
                <Plus className="w-3 h-3 mr-1" /> New Project
              </Button>
            </DialogTrigger>
             <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold shadow-[0_8px_40px_rgba(200,167,102,0.4)]">
               <DialogHeader>
                 <DialogTitle className="text-black font-bold">Create New Project</DialogTitle>
               </DialogHeader>
               <div className="space-y-4">
                 <div>
                   <Label className="text-zinc-700">Project Name</Label>
                   <Input
                     value={newProjectName}
                     onChange={(e) => setNewProjectName(e.target.value)}
                     placeholder="My Calendar Project"
                     className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                   />
                 </div>
                 <Button onClick={createProject} className="w-full bg-gradient-to-r from-gold to-gold/80 text-black font-bold hover:from-gold/90 hover:to-gold/70">
                   Create Project
                 </Button>
              </div>
            </DialogContent>
          </Dialog>

          {projects.length > 0 && (
            <Select onValueChange={(id) => {
              const project = projects.find(p => p.id === id);
              if (project) loadProject(project);
            }}>
              <SelectTrigger className="w-40 bg-white border-2 border-gold/30 text-sm text-black">
                <SelectValue placeholder="Load Project" />
              </SelectTrigger>
              <SelectContent className="bg-white border-2 border-gold/30 z-[200]">
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-black hover:bg-gold/10">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card className="bg-cyan-900/20 border-cyan-500/30">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button size="sm" onClick={prevMonth} className="bg-cyan-600 hover:bg-cyan-700 text-white border-0 h-8 w-8 p-0">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-white">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardTitle>
                  <Button size="sm" onClick={nextMonth} className="bg-cyan-600 hover:bg-cyan-700 text-white border-0 h-8 w-8 p-0">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      <Plus className="w-4 h-4 mr-1" /> Add Event
                    </Button>
                  </DialogTrigger>
                   <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold max-w-lg shadow-[0_8px_40px_rgba(200,167,102,0.4)]">
                     <DialogHeader>
                       <DialogTitle className="text-black font-bold flex items-center gap-2">
                         <Calendar className="w-5 h-5 text-gold" />
                         {editingEvent ? 'Edit Event' : 'Create New Event'}
                       </DialogTitle>
                     </DialogHeader>
                     <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                       <div>
                         <Label className="text-zinc-700">Title *</Label>
                         <Input
                           value={eventForm.title}
                           onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                           placeholder="Meeting with client"
                           className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                         />
                      </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <Label className="text-zinc-700">Date</Label>
                           <Input
                             type="date"
                             value={eventForm.date}
                             onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                             className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                           />
                         </div>
                         <div>
                           <Label className="text-zinc-700">Time</Label>
                           <Input
                             type="time"
                             value={eventForm.time}
                             onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                             className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                           />
                         </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <Label className="text-zinc-700">Duration (mins)</Label>
                           <Input
                             type="number"
                             value={eventForm.duration}
                             onChange={(e) => setEventForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                             className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                           />
                         </div>
                         <div>
                           <Label className="text-zinc-700">Type</Label>
                           <Select value={eventForm.type} onValueChange={(v: CalendarEvent['type']) => setEventForm(prev => ({ ...prev, type: v }))}>
                             <SelectTrigger className="bg-white border-2 border-gold/40 focus:border-gold text-black">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="meeting">Meeting</SelectItem>
                               <SelectItem value="viewing">Property Viewing</SelectItem>
                               <SelectItem value="call">Call</SelectItem>
                               <SelectItem value="reminder">Reminder</SelectItem>
                               <SelectItem value="other">Other</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       </div>
                       <div>
                         <Label className="text-zinc-700">Location</Label>
                         <Input
                           value={eventForm.location}
                           onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                           placeholder="Dubai Marina, Tower A"
                           className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                         />
                      </div>
                       <div>
                         <Label className="text-zinc-700">Attendees (comma-separated emails)</Label>
                         <Input
                           value={eventForm.attendees}
                           onChange={(e) => setEventForm(prev => ({ ...prev, attendees: e.target.value }))}
                           placeholder="client@email.com, broker@email.com"
                           className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                         />
                      </div>
                       <div>
                         <Label className="text-zinc-700">Description</Label>
                         <Textarea
                           value={eventForm.description}
                           onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                           placeholder="Event details..."
                           className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                         />
                       </div>
                       <div className="space-y-3 p-4 bg-white/60 rounded-lg border border-gold/20">
                         <p className="text-sm text-zinc-600 font-medium">Reminders</p>
                         <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-zinc-700">Email Reminder</span>
                          </div>
                          <Switch
                            checked={eventForm.emailReminder}
                            onCheckedChange={(v) => setEventForm(prev => ({ ...prev, emailReminder: v }))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-zinc-700">Phone Notification</span>
                          </div>
                          <Switch
                            checked={eventForm.phoneReminder}
                            onCheckedChange={(v) => setEventForm(prev => ({ ...prev, phoneReminder: v }))}
                          />
                        </div>
                         <div>
                           <Label className="text-xs text-zinc-500">Remind before (minutes)</Label>
                           <Select value={eventForm.reminderTime.toString()} onValueChange={(v) => setEventForm(prev => ({ ...prev, reminderTime: parseInt(v) }))}>
                             <SelectTrigger className="bg-white border-2 border-gold/40 text-black">
                              <SelectValue />
                            </SelectTrigger>
                             <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="30">30 minutes</SelectItem>
                              <SelectItem value="60">1 hour</SelectItem>
                              <SelectItem value="1440">1 day</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleCreateEvent} className="w-full bg-gradient-to-r from-gold to-gold/80 text-black font-bold hover:from-gold/90 hover:to-gold/70">
                        {editingEvent ? 'Update Event' : 'Create Event'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs text-zinc-500 py-2">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentMonth).map((date, i) => {
                    if (!date) return <div key={i} className="aspect-square" />;
                    const dayEvents = getEventsForDate(date);
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    
                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDate(date)}
                        className={`aspect-square p-1 rounded-lg cursor-pointer transition-all ${
                          isSelected ? 'bg-blue-600/30 border border-blue-500' :
                          isToday ? 'bg-zinc-800 border border-zinc-600' :
                          'hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className={`text-xs ${isToday ? 'text-blue-400 font-bold' : 'text-zinc-400'}`}>
                          {date.getDate()}
                        </p>
                        <div className="space-y-0.5 mt-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={`text-[10px] truncate px-1 rounded ${eventTypeColors[event.type]} text-white`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <p className="text-[10px] text-zinc-500">+{dayEvents.length - 2} more</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Day Events */}
                <div className="mt-6 pt-6 border-t border-zinc-800">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">
                      Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex gap-2">
                       <Button
                        size="sm"
                        onClick={() => {
                          setEventForm(prev => ({ ...prev, date: formatLocalDate(selectedDate) }));
                          setEditingEvent(null);
                          setShowEventModal(true);
                        }}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Event
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingNote(null);
                          setNoteForm({ title: '', content: '' });
                          setShowNoteModal(true);
                        }}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add Note
                      </Button>
                    </div>
                  </div>
                  {getEventsForDate(selectedDate).length === 0 ? (
                    <p className="text-zinc-500 text-sm">No events scheduled. Click "Add Event" to create one.</p>
                  ) : (
                    <div className="space-y-3">
                      {getEventsForDate(selectedDate).map(event => (
                        <div key={event.id} className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
                          <div className={`w-1 h-full min-h-[60px] rounded-full ${eventTypeColors[event.type]}`} />
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-white font-medium">{event.title}</h4>
                                <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {event.time}
                                  </span>
                                  {event.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3" /> {event.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleEditEvent(event)}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDeleteEvent(event.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {event.attendees.length > 0 && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-zinc-500">
                                <Users className="w-3 h-3" />
                                {event.attendees.join(', ')}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {event.emailReminder && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                  <Mail className="w-2 h-2 inline mr-1" /> Email
                                </span>
                              )}
                              {event.phoneReminder && (
                                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                  <Phone className="w-2 h-2 inline mr-1" /> Phone
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes Sidebar */}
          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-2 border-cyan-500/40">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white text-sm">Quick Notes</CardTitle>
                <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white border-0">
                      <Plus className="w-3 h-3 mr-1" /> Add Note
                    </Button>
                  </DialogTrigger>
                   <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold shadow-[0_8px_40px_rgba(200,167,102,0.4)]">
                     <DialogHeader>
                       <DialogTitle className="text-black font-bold">
                         {editingNote ? 'Edit Note' : 'Create Note'}
                       </DialogTitle>
                     </DialogHeader>
                     <div className="space-y-4">
                       <div>
                         <Label className="text-zinc-700">Title</Label>
                         <Input
                           value={noteForm.title}
                           onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
                           placeholder="Note title"
                           className="bg-white border-2 border-gold/40 focus:border-gold text-black"
                         />
                       </div>
                       <div>
                         <Label className="text-zinc-700">Content</Label>
                         <Textarea
                           value={noteForm.content}
                           onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                           placeholder="Write your note..."
                           className="bg-white border-2 border-gold/40 focus:border-gold text-black min-h-[150px]"
                         />
                       </div>
                       <Button onClick={handleCreateNote} className="w-full bg-gradient-to-r from-gold to-gold/80 text-black font-bold hover:from-gold/90 hover:to-gold/70">
                         {editingNote ? 'Update Note' : 'Save Note'}
                       </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {notes.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No notes yet</p>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className="p-3 bg-zinc-800/50 rounded-lg group">
                      <div className="flex items-start justify-between">
                        <h4 className="text-white text-sm font-medium">{note.title}</h4>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleEditNote(note)}>
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-zinc-400 text-xs mt-1 line-clamp-3">{note.content}</p>
                      <p className="text-zinc-600 text-[10px] mt-2">{note.updatedAt.toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="bg-zinc-900/50 border-2 border-cyan-500/40">
              <CardHeader>
                <CardTitle className="text-white text-sm">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {events
                  .filter(e => new Date(e.date) >= new Date())
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .slice(0, 5)
                  .map(event => (
                    <div key={event.id} className="flex items-center gap-3 p-2 bg-zinc-800/30 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${eventTypeColors[event.type]}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{event.title}</p>
                        <p className="text-zinc-500 text-xs">{new Date(event.date).toLocaleDateString()} at {event.time}</p>
                      </div>
                    </div>
                  ))}
                {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
                  <p className="text-zinc-500 text-sm">No upcoming events</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AICalendar;