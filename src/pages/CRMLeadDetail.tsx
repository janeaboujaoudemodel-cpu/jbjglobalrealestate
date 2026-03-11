import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, Phone, MessageSquare, Mail, User, 
  MapPin, Globe, Clock, Plus, Play, Square, Calendar, FileText
} from "lucide-react";
import LeadStatusBadge, { PIPELINE_STATUSES, getStatusInfo } from "@/components/crm/LeadStatusBadge";
import FollowUpScheduler from "@/components/crm/FollowUpScheduler";
import VoiceNoteRecorder from "@/components/crm/VoiceNoteRecorder";
import CRMAIToolsPanel from "@/components/crm/CRMAIToolsPanel";
import ClientPDFGenerator from "@/components/crm/ClientPDFGenerator";
import AILeadScoring from "@/components/crm/AILeadScoring";
import DealPrediction from "@/components/crm/DealPrediction";
import AIPropertyCoach from "@/components/crm/AIPropertyCoach";
import SmartEmailComposer from "@/components/crm/SmartEmailComposer";
import SmartWhatsAppComposer from "@/components/crm/SmartWhatsAppComposer";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  nationality: string | null;
  preferred_language: string | null;
  current_location_country: string | null;
  current_location_city: string | null;
  gender: string | null;
  age_range: string | null;
  source: string | null;
  tags: string[];
  created_at: string;
  owner_type: string;
}

interface Activity {
  id: string;
  activity_type: string;
  metadata: any;
  created_at: string;
}

interface Note {
  id: string;
  body: string;
  created_at: string;
}

interface Task {
  id: string;
  title: string;
  notes: string | null;
  due_at: string | null;
  status: string;
  completed_at: string | null;
}

interface CallState {
  isActive: boolean;
  startTime: Date | null;
  elapsed: number;
}

const CRMLeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentStatus, setCurrentStatus] = useState("new");
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState({ title: "", due_at: "" });
  
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    startTime: null,
    elapsed: 0
  });
  const [callOutcome, setCallOutcome] = useState("");
  const [callNotes, setCallNotes] = useState("");
  
  const [showPDFGenerator, setShowPDFGenerator] = useState(false);
  const [selectedPDFTools, setSelectedPDFTools] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("activity");

  useEffect(() => {
    if (!user || !id) {
      navigate("/owner");
      return;
    }
    fetchLeadData();
    // Log lead access for audit trail
    supabase.rpc('log_crm_lead_access', { p_lead_id: id, p_user_id: user.id, p_access_type: 'view' }).catch(() => {});
  }, [user, id, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState.isActive && callState.startTime) {
      interval = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          elapsed: Math.floor((Date.now() - prev.startTime!.getTime()) / 1000)
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState.isActive, callState.startTime]);

  const fetchLeadData = async () => {
    if (!id || !user) return;
    
    try {
      const { data: leadData, error: leadError } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("id", id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      const { data: stateData } = await supabase
        .from("crm_lead_state_per_user")
        .select("pipeline_status")
        .eq("lead_id", id)
        .eq("user_id", user.id)
        .single();

      if (stateData) {
        setCurrentStatus(stateData.pipeline_status);
      }

      const { data: activitiesData } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      setActivities(activitiesData || []);

      const { data: notesData } = await supabase
        .from("crm_notes")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });

      setNotes(notesData || []);

      const { data: tasksData } = await supabase
        .from("crm_tasks")
        .select("*")
        .eq("lead_id", id)
        .eq("user_id", user.id)
        .order("due_at", { ascending: true });

      setTasks(tasksData || []);
    } catch (err) {
      console.error("Failed to fetch lead:", err);
      toast.error("Failed to load lead details");
      navigate("/owner");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !id) return;
    try {
      await supabase
        .from("crm_lead_state_per_user")
        .upsert(
          { lead_id: id, user_id: user.id, pipeline_status: newStatus as any, is_junk: newStatus === "junk", last_touch_at: new Date().toISOString() },
          { onConflict: "lead_id,user_id" }
        );
      await supabase.from("crm_activities").insert({ lead_id: id, user_id: user.id, activity_type: "status_change", metadata: { from: currentStatus, to: newStatus } });
      setCurrentStatus(newStatus);
      toast.success(`Status changed to ${newStatus}`);
      fetchLeadData();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleWhatsAppClick = async () => {
    if (!lead?.phone_e164 || !user || !id) return;
    await supabase.from("crm_activities").insert({ lead_id: id, user_id: user.id, activity_type: "whatsapp_click", metadata: { phone: lead.phone_e164 } });
    await supabase.from("crm_lead_state_per_user").upsert({ lead_id: id, user_id: user.id, last_touch_at: new Date().toISOString() }, { onConflict: "lead_id,user_id" });
    const phone = lead.phone_e164.replace("+", "");
    window.open(`https://wa.me/${phone}`, "_blank");
    fetchLeadData();
  };

  const handleEmailClick = async () => {
    if (!lead?.email_lower || !user || !id) return;
    await supabase.from("crm_activities").insert({ lead_id: id, user_id: user.id, activity_type: "email_click", metadata: { email: lead.email_lower } });
    window.open(`mailto:${lead.email_lower}`, "_blank");
    fetchLeadData();
  };

  const startCall = () => {
    setCallState({ isActive: true, startTime: new Date(), elapsed: 0 });
  };

  const endCall = async () => {
    if (!user || !id) return;
    const duration = callState.elapsed;
    await supabase.from("crm_calls").insert({ lead_id: id, user_id: user.id, started_at: callState.startTime?.toISOString(), ended_at: new Date().toISOString(), duration_seconds: duration, outcome: callOutcome, notes: callNotes });
    await supabase.from("crm_activities").insert({ lead_id: id, user_id: user.id, activity_type: "call", metadata: { duration, outcome: callOutcome } });
    await supabase.from("crm_lead_state_per_user").upsert({ lead_id: id, user_id: user.id, last_touch_at: new Date().toISOString() }, { onConflict: "lead_id,user_id" });
    setCallState({ isActive: false, startTime: null, elapsed: 0 });
    setCallOutcome("");
    setCallNotes("");
    toast.success(`Call logged: ${formatDuration(duration)}`);
    fetchLeadData();
  };

  const addNote = async () => {
    if (!newNote.trim() || !user || !id) return;
    try {
      await supabase.from("crm_notes").insert({ lead_id: id, user_id: user.id, body: newNote.trim() });
      await supabase.from("crm_activities").insert({ lead_id: id, user_id: user.id, activity_type: "note", metadata: { preview: newNote.slice(0, 50) } });
      setNewNote("");
      toast.success("Note added");
      fetchLeadData();
    } catch (err) {
      toast.error("Failed to add note");
    }
  };

  const addTask = async () => {
    if (!newTask.title.trim() || !user || !id) return;
    try {
      await supabase.from("crm_tasks").insert({ lead_id: id, user_id: user.id, title: newTask.title.trim(), due_at: newTask.due_at || null, status: "pending" });
      await supabase.from("crm_activities").insert({ lead_id: id, user_id: user.id, activity_type: "followup_created", metadata: { title: newTask.title } });
      setNewTask({ title: "", due_at: "" });
      toast.success("Task created");
      fetchLeadData();
    } catch (err) {
      toast.error("Failed to create task");
    }
  };

  const completeTask = async (taskId: string) => {
    if (!user || !id) return;
    try {
      await supabase.from("crm_tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", taskId);
      await supabase.from("crm_activities").insert({ lead_id: id, user_id: user.id, activity_type: "followup_completed", metadata: { task_id: taskId } });
      toast.success("Task completed");
      fetchLeadData();
    } catch (err) {
      toast.error("Failed to complete task");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <Phone className="h-4 w-4" />;
      case "whatsapp_click": return <MessageSquare className="h-4 w-4 text-green-500" />;
      case "email_click": return <Mail className="h-4 w-4 text-blue-500" />;
      case "status_change": return <Clock className="h-4 w-4 text-orange-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center gap-4">
        <User className="h-16 w-16 text-muted-foreground" />
        <p className="text-muted-foreground text-lg">Lead not found</p>
        <Button variant="primary" onClick={() => navigate('/crm/leads')}>
          Return to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gold/20 bg-[hsl(222,84%,4.9%)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/owner")} className="text-gold hover:text-gold hover:bg-gold/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{lead.full_name}</h1>
            <p className="text-xs text-gold/70">{lead.nationality} · {lead.preferred_language?.toUpperCase()}</p>
          </div>
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[160px]">
              <LeadStatusBadge status={currentStatus} size="sm" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <div className="px-2 py-1 text-xs font-semibold text-emerald-400 uppercase">Positive</div>
              {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase mt-1">Neutral</div>
              {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
              <div className="px-2 py-1 text-xs font-semibold text-red-400 uppercase mt-1">Negative</div>
              {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                <SelectItem key={status.value} value={status.value}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                    {status.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Row 1: Contact Info + Quick Actions + Status side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Contact Info */}
          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lead.phone_e164 && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Phone className="h-4 w-4 text-green-500 shrink-0" />
                  <a href={`tel:${lead.phone_e164}`} className="text-sm font-medium hover:text-green-400 truncate flex-1">{lead.phone_e164}</a>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-green-500 hover:bg-green-500/10" onClick={handleWhatsAppClick}>
                      <MessageSquare className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-500 hover:bg-blue-500/10" onClick={() => window.open(`tel:${lead.phone_e164}`, "_self")}>
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              {lead.email_lower && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <Mail className="h-4 w-4 text-purple-500 shrink-0" />
                  <a href={`mailto:${lead.email_lower}`} onClick={handleEmailClick} className="text-sm font-medium hover:text-purple-400 truncate flex-1">{lead.email_lower}</a>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-purple-500 hover:bg-purple-500/10 shrink-0" onClick={handleEmailClick}>
                    <Mail className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {(lead.current_location_country || lead.current_location_city) && (
                <div className="flex items-center gap-2 px-2 text-sm">
                  <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{[lead.current_location_city, lead.current_location_country].filter(Boolean).join(", ")}</span>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center gap-2 px-2 text-sm">
                  <Globe className="h-4 w-4 text-cyan-500 shrink-0" />
                  <span>Source: {lead.source}</span>
                </div>
              )}
              {lead.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 px-2">
                  {lead.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <Button className="w-full justify-start bg-green-600 hover:bg-green-500 text-white text-sm h-9" onClick={() => setActiveTab("whatsapp")} disabled={!lead.phone_e164}>
                <MessageSquare className="h-4 w-4 mr-2 shrink-0" /> AI WhatsApp
              </Button>
              <Button className="w-full justify-start bg-purple-600 hover:bg-purple-500 text-white text-sm h-9" onClick={() => setActiveTab("email")} disabled={!lead.email_lower}>
                <Mail className="h-4 w-4 mr-2 shrink-0" /> AI Email
              </Button>
              <Button className="w-full justify-start bg-amber-600 hover:bg-amber-500 text-white text-sm h-9" onClick={() => setShowPDFGenerator(true)}>
                <FileText className="h-4 w-4 mr-2 shrink-0" /> Generate PDF
              </Button>
            </CardContent>
          </Card>

          {/* Call Tracker */}
          <Card className="border-gold/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Log Call</CardTitle>
            </CardHeader>
            <CardContent>
              {!callState.isActive ? (
                <Button onClick={startCall} className="w-full">
                  <Play className="h-4 w-4 mr-2" /> Start Call Timer
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center py-3 bg-muted rounded-lg">
                    <p className="text-2xl font-mono font-bold">{formatDuration(callState.elapsed)}</p>
                    <p className="text-xs text-muted-foreground">Call in progress</p>
                  </div>
                  <Select value={callOutcome} onValueChange={setCallOutcome}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Outcome" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="answered">Answered</SelectItem>
                      <SelectItem value="voicemail">Voicemail</SelectItem>
                      <SelectItem value="no_answer">No Answer</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Call notes..." value={callNotes} onChange={(e) => setCallNotes(e.target.value)} rows={2} className="text-sm" />
                  <Button onClick={endCall} variant="destructive" className="w-full h-8 text-sm">
                    <Square className="h-3.5 w-3.5 mr-1" /> End Call
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: AI Intelligence Cards - horizontal grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AILeadScoring lead={lead} activities={activities} />
          <DealPrediction lead={lead} currentStatus={currentStatus} activities={activities} />
          <CRMAIToolsPanel 
            lead={lead}
            onGeneratePDF={(toolType, data) => {
              setSelectedPDFTools(data.tools || []);
              setShowPDFGenerator(true);
            }}
          />
        </div>

        {/* Row 3: AI Property Coach - full width */}
        <AIPropertyCoach lead={lead} activities={activities} />

        {/* Row 4: Tabs - Activity, Notes, Tasks, Email, WhatsApp */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="email" className="text-blue-500">AI Email</TabsTrigger>
            <TabsTrigger value="whatsapp" className="text-green-500">AI WhatsApp</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardContent className="pt-6">
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No activity yet</p>
                ) : (
                  <div className="space-y-3">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex gap-3 pb-3 border-b last:border-0">
                        <div className="p-2 bg-muted rounded-full h-fit">{getActivityIcon(activity.activity_type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize">{activity.activity_type.replace(/_/g, " ")}</p>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">{JSON.stringify(activity.metadata)}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(activity.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-2">
                  <Textarea placeholder="Add a note..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} className="flex-1" />
                  <div className="flex flex-col gap-2">
                    <VoiceNoteRecorder onTranscript={(text) => setNewNote(prev => prev ? `${prev} ${text}` : text)} />
                    <Button onClick={addNote} disabled={!newNote.trim()}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
                {notes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No notes yet</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">{note.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">{formatDate(note.created_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <Input placeholder="New task title..." value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="flex-1 min-w-[200px]" />
                  <Input type="datetime-local" value={newTask.due_at} onChange={(e) => setNewTask({ ...newTask, due_at: e.target.value })} className="w-48" />
                  <Button onClick={addTask} disabled={!newTask.title.trim()}><Plus className="h-4 w-4" /></Button>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No tasks yet</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className={`flex items-center gap-3 p-3 border rounded-lg ${task.status === "completed" ? "opacity-50" : ""}`}>
                        <input type="checkbox" checked={task.status === "completed"} onChange={() => task.status !== "completed" && completeTask(task.id)} className="h-4 w-4" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${task.status === "completed" ? "line-through" : ""}`}>{task.title}</p>
                          {task.due_at && <p className="text-xs text-muted-foreground">Due: {new Date(task.due_at).toLocaleString()}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <SmartEmailComposer lead={lead} />
          </TabsContent>

          <TabsContent value="whatsapp">
            <SmartWhatsAppComposer lead={lead} />
          </TabsContent>
        </Tabs>
      </main>

      <ClientPDFGenerator
        open={showPDFGenerator}
        onClose={() => setShowPDFGenerator(false)}
        lead={lead}
        selectedTools={selectedPDFTools}
      />
    </div>
  );
};

export default CRMLeadDetail;
