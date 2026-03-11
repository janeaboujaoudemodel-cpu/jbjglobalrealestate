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
  ClipboardList, Send, Eye, Info,
} from "lucide-react";

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
      // Insert launch upload
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

      // Also create an admin task notification
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
      approved: "bg-emerald-500/20 text-emerald-700",
      rejected: "bg-red-500/20 text-red-700",
    };
    return <Badge className={config[status] || "bg-muted text-muted-foreground"}>{status?.replace(/_/g, " ") || "Pending"}</Badge>;
  };

  return (
    <>
      <SEOHead title="Developer Portal | JBJ Global Real Estate" description="Submit projects, events, and marketing materials to JBJ Global." />
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Hero */}
        <div className="relative py-16 md:py-24 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="container mx-auto px-4 relative z-10 text-center max-w-3xl">
            <Badge className="mb-4 bg-gold/20 text-gold border-gold/30 text-sm">
              {isDeveloperMode ? 'Developer Tools' : 'For Real Estate Developers'}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Developer Portal</h1>
            <p className="text-lg md:text-xl text-white/70">
              Submit projects, upload marketing materials, manage events — all in one place.
            </p>
          </div>
        </div>

        {/* Mode Notice */}
        {!isDeveloperMode && (
          <div className="container mx-auto px-4 py-4 max-w-4xl">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <Info className="w-5 h-5 shrink-0" />
              <p>You're not in Developer mode. Switch to <strong>Developer</strong> mode from the header to access full developer tools.</p>
            </div>
          </div>
        )}

        {/* Developer Info */}
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="border-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] mb-6">
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
            <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/30 rounded-xl h-14">
              <TabsTrigger value="projects" className="text-xs md:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <FolderOpen className="w-4 h-4 mr-1.5 hidden md:block" />
                My Projects
              </TabsTrigger>
              <TabsTrigger value="submit" className="text-xs md:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <Plus className="w-4 h-4 mr-1.5 hidden md:block" />
                New Project
              </TabsTrigger>
              <TabsTrigger value="events" className="text-xs md:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <Calendar className="w-4 h-4 mr-1.5 hidden md:block" />
                Events & Tasks
              </TabsTrigger>
              <TabsTrigger value="listings" className="text-xs md:text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md rounded-lg">
                <Eye className="w-4 h-4 mr-1.5 hidden md:block" />
                Check Listings
              </TabsTrigger>
            </TabsList>

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
                          <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gold/20 bg-[#FDFBF7]">
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

              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
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
                      className="border-2 border-dashed border-gold/40 rounded-xl p-8 text-center hover:border-gold/70 transition-colors cursor-pointer bg-white/50"
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
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gold/20">
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
                      className="flex-1 bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-foreground font-bold h-12">
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
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6]">
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
                      className="w-full bg-gradient-to-r from-[#D4B896] to-[#C4A87A] hover:from-[#C4A87A] hover:to-[#B4986A] text-foreground font-bold h-12">
                      {eventSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

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
                        <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gold/20 bg-[#FDFBF7]">
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
