import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar, Upload, Building2, PartyPopper, FileText, Loader2,
  CheckCircle, X, Plus, FolderOpen, ExternalLink, AlertCircle,
  ClipboardList, Send, Eye, Info, UserCheck, Briefcase, MessageSquare,
  FileSignature, ListTodo,
} from "lucide-react";
import SalesRepRegistration from "@/components/developer-portal/SalesRepRegistration";
import BriefingRequestForm from "@/components/developer-portal/BriefingRequestForm";
import DeveloperMessageForm from "@/components/developer-portal/DeveloperMessageForm";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
}

interface ProjectSession {
  project_name: string;
  project_description: string;
  location: string;
  launch_date: string;
  files: UploadedFile[];
}

const emptyProject = (): ProjectSession => ({
  project_name: "", project_description: "", location: "", launch_date: "", files: [],
});

const DeveloperPortal = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isDeveloperMode } = useUserModeContext();
  const queryClient = useQueryClient();
  const initialTab = searchParams.get("tab") || "projects";
  const [activeTab, setActiveTab] = useState(initialTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Developer info
  const [devName, setDevName] = useState("");
  const [devEmail, setDevEmail] = useState("");

  useEffect(() => {
    if (user?.email) setDevEmail(user.email);
  }, [user?.email]);

  // Check if user has a registered rep profile
  const { data: repProfile, isLoading: loadingRep, refetch: refetchRep } = useQuery({
    queryKey: ["dev-rep-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('developer_representatives')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Session-based multi-project
  const [currentProject, setCurrentProject] = useState<ProjectSession>(emptyProject());
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submittingProject, setSubmittingProject] = useState(false);
  const [sessionProjects, setSessionProjects] = useState<string[]>([]);

  // Event form
  const [eventForm, setEventForm] = useState({
    event_title: "", event_date: "", event_location: "", event_description: "",
  });
  const [eventSubmitting, setEventSubmitting] = useState(false);

  // Fetch developer's submitted projects
  const { data: myProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["dev-portal-projects", devEmail],
    queryFn: async () => {
      if (!devEmail) return [];
      const { data, error } = await supabase
        .from("developer_launch_uploads")
        .select("id, project_name, status, extraction_status, auto_approved, created_at")
        .eq("developer_email", devEmail)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!devEmail,
  });

  // Fetch user's briefing requests
  const { data: myBriefings } = useQuery({
    queryKey: ["dev-briefings", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('briefing_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user's tasks (assigned to them)
  const { data: myTasks } = useQuery({
    queryKey: ["dev-portal-tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('admin_tasks')
        .select('id, title, description, status, priority, due_date, created_at, category')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch agreements (e-signature envelopes where user is a signer)
  const { data: myAgreements } = useQuery({
    queryKey: ["dev-portal-agreements", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const { data } = await (supabase
        .from('e_signature_envelopes') as any)
        .select('id, title, status, created_at, updated_at')
        .or(`sender_id.eq.${user.id},signers.cs.[{"email":"${user.email}"}]`)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!user?.email,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    const uploaded: UploadedFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const safeName = currentProject.project_name?.replace(/[^a-zA-Z0-9-_]/g, '-') || 'project';
        const path = `developer-uploads/${safeName}/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage.from("documents").upload(path, file);
        if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(path);
        uploaded.push({ name: file.name, url: urlData.publicUrl, type: file.type });
      } catch { toast.error(`Error uploading file`); }
    }
    setCurrentProject(prev => ({ ...prev, files: [...prev.files, ...uploaded] }));
    setUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setCurrentProject(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));
  };

  const handleSubmitProject = async () => {
    if (!devName || !devEmail || !currentProject.project_name) {
      toast.error("Please fill in developer name, email, and project name");
      return;
    }
    if (currentProject.files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }
    setSubmittingProject(true);
    try {
      const { error } = await supabase.from("developer_launch_uploads").insert({
        developer_name: devName,
        developer_email: devEmail,
        project_name: currentProject.project_name,
        project_description: currentProject.project_description || null,
        location: currentProject.location || null,
        launch_date: currentProject.launch_date || null,
        uploaded_files: currentProject.files,
      } as any);
      if (error) throw error;

      const ownerIds = ['4944592b-93f1-4e05-ab59-4ebe1fee54f1'];
      for (const ownerId of ownerIds) {
        try {
          await supabase.from("admin_tasks").insert({
            user_id: ownerId,
            title: `New Launch Upload: ${currentProject.project_name}`,
            description: `Developer ${devName} (${devEmail}) has uploaded materials for "${currentProject.project_name}". Review and approve the auto-generated listing.`,
            category: 'developer_launch',
            priority: 'high',
            status: 'pending',
          } as any);
        } catch {}
      }

      setSessionProjects(prev => [...prev, currentProject.project_name]);
      toast.success(`"${currentProject.project_name}" submitted successfully!`);
      setCurrentProject(emptyProject());
      queryClient.invalidateQueries({ queryKey: ["dev-portal-projects"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit project");
    } finally {
      setSubmittingProject(false);
    }
  };

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName || !devEmail || !eventForm.event_title) {
      toast.error("Please fill in developer name, email, and event title");
      return;
    }
    setEventSubmitting(true);
    try {
      const { error } = await supabase.from("developer_submissions").insert({
        developer_name: devName,
        developer_email: devEmail,
        submission_type: "event_invitation",
        event_title: eventForm.event_title,
        event_date: eventForm.event_date ? new Date(eventForm.event_date).toISOString() : null,
        event_location: eventForm.event_location || null,
        event_description: eventForm.event_description || null,
      } as any);
      if (error) throw error;
      toast.success("Event invitation submitted!");
      setEventForm({ event_title: "", event_date: "", event_location: "", event_description: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setEventSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const config: Record<string, string> = {
      pending_review: "bg-amber-500/20 text-amber-700",
      received: "bg-blue-500/20 text-blue-700",
      under_review: "bg-amber-500/20 text-amber-700",
      approved: "bg-emerald-500/20 text-emerald-700",
      rejected: "bg-red-500/20 text-red-700",
    };
    return <Badge className={config[status] || "bg-muted text-muted-foreground"}>{status?.replace(/_/g, " ") || "Pending"}</Badge>;
  };

  const isRepApproved = repProfile?.status === 'approved';
  const hasRepProfile = !!repProfile;

  // Check if user is an approved broker (verified broker_profile or active HR employee)
  const { data: brokerAccess } = useQuery({
    queryKey: ["dev-portal-broker-access", user?.id],
    queryFn: async () => {
      if (!user) return { isBroker: false };
      // Check broker_profiles
      const { data: bp } = await (supabase
        .from('broker_profiles') as any)
        .select('id, verification_status')
        .eq('user_id', user.id)
        .eq('verification_status', 'verified')
        .maybeSingle();
      if (bp) return { isBroker: true };
      // Check hr_employees
      const { data: emp } = await (supabase
        .from('hr_employees') as any)
        .select('id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      if (emp) return { isBroker: true };
      return { isBroker: false };
    },
    enabled: !!user,
  });

  const isApprovedBroker = brokerAccess?.isBroker || false;

  // Show briefing/messages tabs if approved rep OR approved broker
  const showRepTabs = (hasRepProfile && isRepApproved) || isApprovedBroker;

  return (
    <>
      <SEOHead title="Developer Portal | JBJ Global Real Estate" description="Submit projects, briefings, and marketing materials to JBJ Global." />
      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]">
        {/* Hero — champagne-gold theme */}
        <div className="relative py-16 md:py-24 bg-gradient-to-br from-[hsl(38,35%,18%)] via-[hsl(36,30%,14%)] to-[hsl(34,25%,10%)] overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjE1LDE1MCwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
            <Badge className="mb-4 bg-gold/20 text-gold border-gold/30 text-sm">
              {isDeveloperMode ? 'Developer Tools' : 'For Real Estate Developers & Sales Teams'}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-[#F5EBD7]">Developer Portal</h1>
            <p className="text-lg md:text-xl text-[#D4B896]">
              Submit projects, request briefings, upload documents, and manage launches — all in one place.
            </p>
          </div>
        </div>

        {/* Rep Status Banner */}
        {hasRepProfile && !isRepApproved && (
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30 text-stone-800 text-sm">
              <UserCheck className="w-5 h-5 shrink-0 text-gold" />
              <div>
                <strong>Application Status: {repProfile?.status?.replace(/_/g, ' ')}</strong>
                <p className="text-xs mt-0.5 text-stone-600">Your {repProfile?.role?.replace(/_/g, ' ')} registration for <strong>{repProfile?.developer_name}</strong> is being reviewed. You'll receive an email once approved.</p>
              </div>
              {statusBadge(repProfile?.status || 'pending_review')}
            </div>
          </div>
        )}

        {/* Developer Info */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-2 border-gold/30 bg-gradient-to-r from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)] mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Developer / Company Name *</Label>
                  <Input value={devName} onChange={(e) => setDevName(e.target.value)} placeholder="e.g. Emaar Properties" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Email Address *</Label>
                  <Input type="email" value={devEmail} onChange={(e) => setDevEmail(e.target.value)} placeholder="contact@developer.com" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-auto min-w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border-2 border-gold/30 rounded-xl h-14 gap-0.5 px-1">
                <TabsTrigger value="projects" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <FolderOpen className="w-3.5 h-3.5 mr-1 hidden md:block" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="submit" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <Plus className="w-3.5 h-3.5 mr-1 hidden md:block" />
                  New Project
                </TabsTrigger>
                <TabsTrigger value="events" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <Calendar className="w-3.5 h-3.5 mr-1 hidden md:block" />
                  Events
                </TabsTrigger>
                <TabsTrigger value="register" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <UserCheck className="w-3.5 h-3.5 mr-1 hidden md:block" />
                  Register
                </TabsTrigger>
                <TabsTrigger value="agreements" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <FileSignature className="w-3.5 h-3.5 mr-1 hidden md:block" />
                  Agreements
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <ListTodo className="w-3.5 h-3.5 mr-1 hidden md:block" />
                  Tasks
                </TabsTrigger>
                {showRepTabs && (
                  <>
                    <TabsTrigger value="briefing" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                      <Briefcase className="w-3.5 h-3.5 mr-1 hidden md:block" />
                      Briefing
                    </TabsTrigger>
                    <TabsTrigger value="messages" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                      <MessageSquare className="w-3.5 h-3.5 mr-1 hidden md:block" />
                      Messages
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="listings" className="text-[10px] md:text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                  <Eye className="w-3.5 h-3.5 mr-1 hidden md:block" />
                  Listings
                </TabsTrigger>
              </TabsList>
            </ScrollArea>

            {/* MY PROJECTS TAB */}
            <TabsContent value="projects" className="mt-6">
              <Card className="border-2 border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FolderOpen className="w-5 h-5 text-gold" />
                    Your Submitted Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
                  ) : myProjects && myProjects.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {myProjects.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gold/20 bg-card">
                            <div>
                              <h4 className="font-semibold text-foreground">{p.project_name}</h4>
                              <p className="text-xs text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {statusBadge(p.status)}
                              {p.auto_approved && <Badge className="bg-emerald-500/20 text-emerald-700 text-[10px]">Auto-Approved</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No projects submitted yet</p>
                      <Button variant="outline" className="mt-4" onClick={() => setActiveTab("submit")}>
                        <Plus className="w-4 h-4 mr-2" /> Submit Your First Project
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* SUBMIT NEW PROJECT TAB */}
            <TabsContent value="submit" className="mt-6">
              {sessionProjects.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4" />
                  {sessionProjects.length} project(s) submitted this session: {sessionProjects.join(", ")}
                </div>
              )}

              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Building2 className="w-5 h-5 text-gold" />
                    Submit New Project
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Upload PDFs, renders, brochures, and fact sheets. Our system will automatically generate a listing.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name *</Label>
                    <Input value={currentProject.project_name} onChange={(e) => setCurrentProject(p => ({ ...p, project_name: e.target.value }))} placeholder="The Residences at Marina" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input value={currentProject.location} onChange={(e) => setCurrentProject(p => ({ ...p, location: e.target.value }))} placeholder="Dubai Marina, Dubai" />
                    </div>
                    <div className="space-y-2">
                      <Label>Launch Date</Label>
                      <Input type="date" value={currentProject.launch_date} onChange={(e) => setCurrentProject(p => ({ ...p, launch_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Project Description</Label>
                    <Textarea value={currentProject.project_description} onChange={(e) => setCurrentProject(p => ({ ...p, project_description: e.target.value }))} placeholder="Brief overview, unit types, price range, amenities..." rows={3} />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-3">
                    <Label>Marketing Materials *</Label>
                    <div
                      className="border-2 border-dashed border-gold/40 rounded-xl p-8 text-center hover:border-gold/70 transition-colors cursor-pointer bg-card/50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-10 h-10 mx-auto text-gold/60 mb-3" />
                      <p className="text-sm font-medium text-foreground">Click to upload or drag & drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PDFs, images, brochures, renders, videos (up to 100MB each)</p>
                      <input ref={fileInputRef} type="file" className="hidden" multiple
                        accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.pptx,.mp4,.mov"
                        onChange={handleFileUpload} />
                    </div>
                    {uploadingFiles && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Uploading files...
                      </div>
                    )}
                    {currentProject.files.length > 0 && (
                      <div className="space-y-2">
                        {currentProject.files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-gold/20">
                            <FileText className="w-4 h-4 text-gold shrink-0" />
                            <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                            <button type="button" onClick={() => removeFile(idx)} className="text-muted-foreground hover:text-destructive">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={handleSubmitProject} disabled={submittingProject}
                      className="flex-1 bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12">
                      {submittingProject ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4 mr-2" /> Submit Project</>}
                    </Button>
                  </div>

                  {sessionProjects.length > 0 && (
                    <div className="flex gap-3 pt-2">
                      <Button variant="outline" onClick={() => { setCurrentProject(emptyProject()); }} className="flex-1 border-gold/30">
                        <Plus className="w-4 h-4 mr-2" /> Add Another Project
                      </Button>
                      <Button variant="outline" onClick={() => { setSessionProjects([]); setActiveTab("projects"); }} className="flex-1 border-gold/30">
                        <CheckCircle className="w-4 h-4 mr-2" /> End Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* EVENTS & TASKS TAB */}
            <TabsContent value="events" className="mt-6">
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Calendar className="w-5 h-5 text-gold" />
                    Submit Event / Request
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Invite us to events, request documents, signatures, or create tasks for our team.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitEvent} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Event / Request Title *</Label>
                      <Input value={eventForm.event_title} onChange={(e) => setEventForm(p => ({ ...p, event_title: e.target.value }))} placeholder="Grand Launch: Marina Heights" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="datetime-local" value={eventForm.event_date} onChange={(e) => setEventForm(p => ({ ...p, event_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input value={eventForm.event_location} onChange={(e) => setEventForm(p => ({ ...p, event_location: e.target.value }))} placeholder="Address Fountain Views" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description / Details</Label>
                      <Textarea value={eventForm.event_description} onChange={(e) => setEventForm(p => ({ ...p, event_description: e.target.value }))} placeholder="What do you need? Event details, document requests, signatures needed..." rows={4} />
                    </div>
                    <Button type="submit" disabled={eventSubmitting}
                      className="w-full bg-gradient-to-r from-[hsl(40,50%,92%)] via-[hsl(38,40%,87%)] to-[hsl(36,35%,82%)] border border-gold/40 text-foreground font-bold h-12">
                      {eventSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* REGISTER TAB - Contextual: Developer guidance vs Registration form */}
            <TabsContent value="register" className="mt-6">
              {loadingRep ? (
                <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
              ) : hasRepProfile ? (
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <UserCheck className="w-5 h-5 text-gold" />
                      Your Registration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Full Name</p>
                          <p className="font-semibold text-foreground">{repProfile?.full_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Role</p>
                          <p className="font-semibold text-foreground capitalize">{repProfile?.role?.replace(/_/g, ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Company</p>
                          <p className="font-semibold text-foreground">{repProfile?.developer_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Status</p>
                          {statusBadge(repProfile?.status || 'pending_review')}
                        </div>
                        {repProfile?.position && (
                          <div>
                            <p className="text-xs text-muted-foreground">Position</p>
                            <p className="font-semibold text-foreground">{repProfile.position}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-muted-foreground">Auto-Approve Uploads</p>
                          <Badge className={repProfile?.auto_approve_uploads ? 'bg-emerald-500/20 text-emerald-700' : 'bg-muted text-muted-foreground'}>
                            {repProfile?.auto_approve_uploads ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                      {!isRepApproved && (
                        <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 text-sm text-stone-700">
                          Your registration is under review. Once approved, you'll be able to request briefings and send messages directly.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : isDeveloperMode ? (
                /* Developer user — show guidance, not "Are you a developer?" */
                <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)] to-[hsl(38,30%,93%)]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <Building2 className="w-5 h-5 text-gold" />
                      Welcome, Developer
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Here's how to get the most out of the Developer Portal.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white/60 rounded-xl p-4 border border-gold/20">
                        <div className="flex items-center gap-2 mb-2">
                          <FolderOpen className="w-5 h-5 text-gold" />
                          <h4 className="font-bold text-foreground text-sm">Submit Projects</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Upload brochures, renders, and fact sheets. Our system auto-generates listings for your projects.</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 border border-gold/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-gold" />
                          <h4 className="font-bold text-foreground text-sm">Event Invitations</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Invite our brokers to launches, open days, and exclusive previews through the Events tab.</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 border border-gold/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Briefcase className="w-5 h-5 text-gold" />
                          <h4 className="font-bold text-foreground text-sm">Request Briefings</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Once registered, schedule project briefings with our broker team at our office or yours.</p>
                      </div>
                      <div className="bg-white/60 rounded-xl p-4 border border-gold/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-5 h-5 text-gold" />
                          <h4 className="font-bold text-foreground text-sm">Track Listings</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Monitor your approved projects on our platform and report any corrections needed.</p>
                      </div>
                    </div>

                    <div className="bg-gold/10 border-2 border-gold/30 rounded-xl p-4">
                      <p className="text-sm font-semibold text-foreground mb-1">📋 Register Your Sales Team</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        To unlock briefing requests and direct messaging, register yourself or your sales representatives below.
                      </p>
                      <SalesRepRegistration
                        developerName={devName || 'Your Company'}
                        onRegistered={() => {
                          refetchRep();
                          toast.info('Your registration is now under review.');
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <SalesRepRegistration
                  developerName={devName || 'Your Company'}
                  onRegistered={() => {
                    refetchRep();
                    toast.info('Your registration is now under review.');
                  }}
                />
              )}
            </TabsContent>

            {/* BRIEFING TAB - Only for approved reps */}
            {showRepTabs && (
              <TabsContent value="briefing" className="mt-6 space-y-6">
                <BriefingRequestForm
                  representativeId={repProfile!.id}
                  developerName={repProfile!.developer_name}
                />

                {/* Past briefing requests */}
                {myBriefings && myBriefings.length > 0 && (
                  <Card className="border-2 border-gold/30">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-foreground">
                        <ClipboardList className="w-4 h-4 text-gold" />
                        Your Briefing Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {myBriefings.map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between p-3 rounded-xl border border-gold/20 bg-card">
                            <div>
                              <h4 className="font-semibold text-sm text-foreground">{b.project_name}</h4>
                              <p className="text-xs text-muted-foreground">
                                {b.briefing_date} at {b.briefing_time} · {b.duration_minutes} min
                              </p>
                            </div>
                            {statusBadge(b.status)}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}

            {/* MESSAGES TAB - Only for approved reps */}
            {showRepTabs && (
              <TabsContent value="messages" className="mt-6">
                <DeveloperMessageForm
                  representativeId={repProfile!.id}
                  developerName={repProfile!.developer_name}
                  autoApprove={repProfile!.auto_approve_uploads ?? false}
                />
              </TabsContent>
            )}

            {/* CHECK LISTINGS TAB */}
            <TabsContent value="listings" className="mt-6">
              <Card className="border-2 border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Eye className="w-5 h-5 text-gold" />
                    Check Your Listings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">View your projects on the website. If anything is incorrect, let us know.</p>
                </CardHeader>
                <CardContent>
                  {loadingProjects ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gold" /></div>
                  ) : myProjects && myProjects.filter((p: any) => p.status === 'approved').length > 0 ? (
                    <div className="space-y-3">
                      {myProjects.filter((p: any) => p.status === 'approved').map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gold/20 bg-card">
                          <div>
                            <h4 className="font-semibold text-foreground">{p.project_name}</h4>
                            <p className="text-xs text-muted-foreground">Approved · {format(new Date(p.created_at), "MMM d, yyyy")}</p>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/properties?search=${encodeURIComponent(p.project_name)}`}>
                              <Button size="sm" variant="outline" className="border-gold/30">
                                <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> View on Site
                              </Button>
                            </Link>
                            <Button size="sm" variant="outline" className="border-red-500/30 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                toast.info("Report feature coming soon. Please contact support@jbjglobal.com");
                              }}>
                              <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Report Issue
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p>No approved listings yet</p>
                      <p className="text-xs mt-1">Once your projects are approved, they'll appear here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default DeveloperPortal;
