import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus, Search, Film, Image as ImageIcon, FileText, Package, Grid, List,
  Loader2, Sparkles, Home, Settings, MoreVertical, Copy,
  Trash2, Share2, Pencil, Wand2, Mic, Languages, ChevronRight, FolderOpen,
  Zap, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Project {
  id: string;
  name: string;
  project_type: string;
  status: string;
  thumbnail_url?: string;
  is_shared: boolean;
  updated_at: string;
}

const projectTypes = [
  { value: "video", label: "Video Project", icon: Film },
  { value: "image", label: "Image Project", icon: ImageIcon },
  { value: "pdf", label: "PDF Flyer", icon: FileText },
  { value: "marketing_pack", label: "Marketing Pack", icon: Package },
];

const typeIcons: Record<string, any> = {
  video: Film, image: ImageIcon, pdf: FileText, marketing_pack: Package,
};

// Champagne gold accent colors per type
const typeHex: Record<string, string> = {
  video: "#B89555",
  image: "#B8964A",
  pdf: "#D4AF37",
  marketing_pack: "#A89048",
};

const quickTools = [
  { href: "/toolkit/background-ai", label: "Background Remover", icon: Wand2 },
  { href: "/toolkit/captions-translate", label: "Captions & Translate", icon: Languages },
  { href: "/toolkit/image-resize", label: "Image Resizer", icon: ImageIcon },
  { href: "/toolkit/brochure-generator", label: "Brochure Generator", icon: FileText },
  { href: "/toolkit/voice-studio", label: "Voice Studio", icon: Mic },
];

const suiteLaunchpad = [
  { label: "Video Suite", subtitle: "Edit · Captions · Voice", icon: Film, href: "/toolkit/video-suite", desc: "AI video editing, subtitles & voice studio" },
  { label: "Photo Suite", subtitle: "BG Remove · Filters · Resize", icon: ImageIcon, href: "/toolkit/photo-suite", desc: "Background AI, beauty filters, image resizer" },
  { label: "PDF Suite", subtitle: "Edit · Sign · Brochures", icon: FileText, href: "/toolkit/pdf-suite", desc: "PDF editor, scanner, brochure generator" },
  { label: "Marketing Pack", subtitle: "Brochures · Social · Print", icon: Package, href: "/toolkit/brochure-generator", desc: "Professional marketing collateral" },
];

export default function Studio() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectType, setNewProjectType] = useState("video");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const getOrCreateSessionId = () => {
    let s = localStorage.getItem("studio_session_id");
    if (!s) { s = crypto.randomUUID(); localStorage.setItem("studio_session_id", s); }
    return s;
  };

  const loadProjects = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const { data: userData } = await supabase.auth.getUser();
      let q = supabase.from("studio_projects")
        .select("id, name, project_type, status, thumbnail_url, is_shared, updated_at")
        .order("updated_at", { ascending: false });
      if (userData?.user?.id) {
        q = q.or(`user_id.eq.${userData.user.id},session_id.eq.${sessionId}`);
      } else {
        q = q.eq("session_id", sessionId);
      }
      const { data, error } = await q;
      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newProjectName.trim()) { toast.error("Please enter a project name"); return; }
    setIsCreating(true);
    try {
      const sessionId = getOrCreateSessionId();
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("studio_projects").insert({
        name: newProjectName.trim(), project_type: newProjectType, status: "draft",
        session_id: sessionId, user_id: userData?.user?.id || null,
        timeline_state: { tracks: [], duration: 0 },
        canvas_settings: { format: "16:9", quality: "1080p" },
        ai_settings: {}, is_shared: false,
      }).select().single();
      if (error) throw error;
      toast.success("Project created!");
      setIsCreateOpen(false);
      setNewProjectName("");
      navigate(`/studio/editor/${data.id}`);
    } catch (err) {
      console.error("Failed to create project:", err);
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (projectId: string) => {
    try {
      const { data: fullProject, error: fetchError } = await supabase.from("studio_projects").select("*").eq("id", projectId).single();
      if (fetchError) throw fetchError;
      const sessionId = getOrCreateSessionId();
      const { data: userData } = await supabase.auth.getUser();
      const { id, created_at, updated_at, ...projectData } = fullProject;
      const { error } = await supabase.from("studio_projects").insert({ ...projectData, name: `${fullProject.name} (Copy)`, session_id: sessionId, user_id: userData?.user?.id || null });
      if (error) throw error;
      toast.success("Project duplicated!"); loadProjects();
    } catch (err) { toast.error("Failed to duplicate project"); }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const { error } = await supabase.from("studio_projects").delete().eq("id", projectId);
      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project deleted");
    } catch (err) { toast.error("Failed to delete project"); }
  };

  const handleShare = (projectId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/studio/share/${projectId}`);
    toast.success("Share link copied!");
  };

  const filteredSuites = suiteLaunchpad.filter(s =>
    s.label.toLowerCase().includes(search.toLowerCase()) ||
    s.desc.toLowerCase().includes(search.toLowerCase())
  );
  const filteredQuickTools = quickTools.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.project_type === filterType;
    return matchesSearch && matchesType;
  });

  const goldAccent = "#B89555";
  const goldLight = "rgba(201,168,76,0.15)";
  const goldBorder = "rgba(201,168,76,0.3)";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">

      {/* ─── Sub-Header ─── */}
      <header className="border-b border-[#B89555]/20 bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/studio" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#EFE6D6]/15 border border-[#B89555]/40">
              <Sparkles className="w-[18px] h-[18px] text-[#1A1A1A]" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-[#1A1A1A] leading-none tracking-tight">Creative Suite™</p>
              <p className="text-[10px] mt-0.5 leading-none text-[#1A1A1A]/70">JBJ Global Real Estate</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Link to="/studio" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-[#EFE6D6]/15 border border-[#B89555]/40 text-[#1A1A1A]">
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <Link to="/studio/settings" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-[#1A1A1A]/70 hover:bg-[#EFE6D6]/10 border border-transparent hover:border-[#B89555]/30 transition-all">
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <Link to="/toolkit" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-[#1A1A1A]/70 hover:bg-[#EFE6D6]/10 transition-all">
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden md:inline">AI Tools Hub</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Main ─── */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

        {/* ─── Hero Row ─── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-6 bg-[#EFE6D6]/60" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1A1A1A]">Creative Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1A1A] leading-tight">
              Your <span className="text-[#1A1A1A]">Projects</span>
            </h1>
            <p className="mt-1.5 text-sm text-[#1A1A1A]/70">Create and manage your creative projects</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 font-semibold px-5 py-2.5 h-auto rounded-xl text-sm text-[#1A1A1A] bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 border-0 transition-all hover:-translate-y-0.5 shadow-[0_4px_20px_rgba(201,168,76,0.3)]">
                <Plus className="w-4 h-4 mr-1.5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="border border-[#B89555]/30 max-w-md mx-4 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]" style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.15)" }}>
              <DialogHeader>
                <DialogTitle className="text-[#1A1A1A] text-xl font-bold">
                  Create New <span className="text-[#1A1A1A]">Project</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-2 block text-[#1A1A1A]/70">Project Name</label>
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My New Project..."
                    className="w-full px-4 py-3 rounded-xl text-[#1A1A1A] text-sm placeholder:text-[#1A1A1A]/70 outline-none transition-all bg-[#FDFBF7]/60 border border-[#B89555]/20 focus:border-[#B89555]/50"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-2 block text-[#1A1A1A]/70">Project Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {projectTypes.map((type) => {
                      const Icon = type.icon;
                      const isActive = newProjectType === type.value;
                      return (
                        <button key={type.value} onClick={() => setNewProjectType(type.value)}
                          className={`p-3.5 rounded-xl text-left transition-all border ${
                            isActive
                              ? "bg-[#EFE6D6]/15 border-[#B89555]/50 shadow-[0_0_16px_rgba(201,168,76,0.15)]"
                              : "bg-[#FDFBF7]/30 border-[#B89555]/10 hover:border-[#B89555]/30"
                          }`}>
                          <Icon className={`w-5 h-5 mb-2 ${isActive ? "text-[#1A1A1A]" : "text-[#1A1A1A]/70"}`} />
                          <p className="text-xs text-[#1A1A1A] font-medium leading-snug">{type.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button className="w-full font-semibold h-11 rounded-xl text-[#1A1A1A] bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 border-0"
                  onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ─── Suite Launchpad — PRIMARY NAVIGATION ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Creative Suites — Click to Open</span>
            </div>
            <Link to="/toolkit" className="flex items-center gap-1 text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">
              All tools <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredSuites.map((suite) => {
              const Icon = suite.icon;
              return (
                <Link key={suite.href} to={suite.href}
                  className="group relative flex flex-col gap-3 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-1 cursor-pointer bg-[#FDFBF7]/50 border border-[#B89555]/20 hover:border-[#B89555]/50 hover:shadow-[0_12px_40px_rgba(201,168,76,0.15)]"
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#EFE6D6]/15 border border-[#B89555]/30">
                    <Icon className="w-5 h-5 text-[#1A1A1A]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1A1A1A] font-semibold text-sm mb-0.5">{suite.label}</p>
                    <p className="text-[11px] leading-snug text-[#1A1A1A]/70">{suite.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#1A1A1A] transition-colors">
                    Open Suite <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ─── Quick Tools Strip ─── */}
        {filteredQuickTools.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">Quick Tools</span>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {filteredQuickTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} to={tool.href}
                    className="group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all bg-[#FDFBF7]/40 border border-[#B89555]/15 hover:border-[#B89555]/40 hover:bg-[#EFE6D6]/10"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#EFE6D6]/15 border border-[#B89555]/30">
                      <Icon className="w-4 h-4 text-[#1A1A1A]" />
                    </div>
                    <span className="text-xs text-[#1A1A1A]/70 group-hover:text-[#1A1A1A] transition-colors font-medium leading-snug flex-1">{tool.label}</span>
                    <ChevronRight className="w-3 h-3 shrink-0 text-[#1A1A1A]/70" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Projects Section ─── */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-[#1A1A1A]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1A1A1A]">My Projects</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1A1A1A]/70" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full sm:w-48 pl-9 pr-3 py-2 rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 outline-none transition-all bg-[#FDFBF7]/60 border border-[#B89555]/20 focus:border-[#B89555]/50"
                />
              </div>
              <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[#FDFBF7]/40 border border-[#B89555]/15">
                {(["grid", "list"] as const).map((mode) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === mode ? "bg-[#EFE6D6]/20 text-[#1A1A1A]" : "text-[#1A1A1A]/70"}`}>
                    {mode === "grid" ? <Grid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#1A1A1A]" />
              <p className="text-sm text-[#1A1A1A]/70">Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-[#FDFBF7]/40 border border-[#B89555]/20">
              <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center bg-[#EFE6D6]/10 border border-[#B89555]/25">
                <FolderOpen className="w-8 h-8 text-[#1A1A1A]/70" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">No projects yet</h3>
              <p className="mb-5 text-sm max-w-xs text-[#1A1A1A]/70">
                Create your first project or use the Creative Suites above to get started
              </p>
              <Button className="font-semibold px-6 rounded-xl text-[#1A1A1A] h-10 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 border-0 shadow-[0_4px_16px_rgba(201,168,76,0.25)]"
                onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Create Project
              </Button>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {filteredProjects.map((project) => {
                const Icon = typeIcons[project.project_type] || Film;
                return (
                  <div key={project.id} className="group flex items-center gap-4 p-3.5 rounded-xl transition-all bg-[#FDFBF7]/40 border border-[#B89555]/15 hover:border-[#B89555]/30 hover:bg-[#FDFBF7]/60">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#EFE6D6]/15 border border-[#B89555]/30">
                      <Icon className="w-5 h-5 text-[#1A1A1A]" />
                    </div>
                    <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                      <p className="text-[#1A1A1A] font-medium truncate text-sm">{project.name}</p>
                      <p className="text-xs mt-0.5 text-[#1A1A1A]/70">{project.project_type} · {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</p>
                    </Link>
                    <ProjectMenu projectId={project.id} onRename={() => toast.info("Rename coming soon")} onDuplicate={() => handleDuplicate(project.id)} onShare={() => handleShare(project.id)} onDelete={() => handleDelete(project.id)} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProjects.map((project) => {
                const Icon = typeIcons[project.project_type] || Film;
                return (
                  <div key={project.id} className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 bg-[#FDFBF7]/50 border border-[#B89555]/15 hover:border-[#B89555]/40 hover:shadow-[0_12px_40px_rgba(201,168,76,0.15)]">
                    <Link to={`/studio/editor/${project.id}`}>
                      <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-[#F7F1E6] to-[#ECE2D2]">
                        {project.thumbnail_url ? (
                          <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#EFE6D6]/10 border border-[#B89555]/25">
                              <Icon className="w-7 h-7 text-[#1A1A1A]/70" />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-[#EFE6D6]/20 text-[#1A1A1A] border border-[#B89555]/40">
                            {project.project_type.replace("_", " ")}
                          </span>
                        </div>
                        {project.is_shared && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-[#EFE6D6]/20 border border-[#B89555]/40">
                            <Share2 className="w-2.5 h-2.5 text-[#1A1A1A]" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-3.5 flex items-start justify-between gap-2">
                      <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                        <h3 className="text-[#1A1A1A] font-semibold truncate text-sm">{project.name}</h3>
                        <p className="text-xs mt-0.5 text-[#1A1A1A]/70">{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</p>
                      </Link>
                      <ProjectMenu projectId={project.id} onRename={() => toast.info("Rename coming soon")} onDuplicate={() => handleDuplicate(project.id)} onShare={() => handleShare(project.id)} onDelete={() => handleDelete(project.id)} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-12 border-t border-[#B89555]/20">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#1A1A1A]/70">JBJ Creative Suite™ — Free for all users</p>
          <div className="flex items-center gap-4">
            <Link to="/toolkit" className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">AI Tools Hub</Link>
            <Link to="/studio/settings" className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProjectMenu({ projectId, onRename, onDuplicate, onShare, onDelete }: {
  projectId: string; onRename: () => void; onDuplicate: () => void; onShare: () => void; onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-[#1A1A1A]/70 hover:bg-[#EFE6D6]/10">
        <MoreVertical className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA]">
        <DropdownMenuItem onClick={onRename} className="text-[#1A1A1A]/70 focus:text-[#1A1A1A] focus:bg-[#EFE6D6]/10 text-xs"><Pencil className="w-3.5 h-3.5 mr-2" />Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} className="text-[#1A1A1A]/70 focus:text-[#1A1A1A] focus:bg-[#EFE6D6]/10 text-xs"><Copy className="w-3.5 h-3.5 mr-2" />Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={onShare} className="text-[#1A1A1A]/70 focus:text-[#1A1A1A] focus:bg-[#EFE6D6]/10 text-xs"><Share2 className="w-3.5 h-3.5 mr-2" />Share</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#EFE6D6]/20" />
        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-700 focus:bg-red-50 text-xs"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
