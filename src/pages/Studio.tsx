import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus, Search, Film, Image as ImageIcon, FileText, Package, Grid, List,
  Loader2, Sparkles, Home, Settings, HelpCircle, MoreVertical, Copy,
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

const typeHex: Record<string, string> = {
  video: "#6366F1",
  image: "#3B82F6",
  pdf: "#8B5CF6",
  marketing_pack: "#06B6D4",
};

const quickTools = [
  { href: "/toolkit/background-ai", label: "Background Remover", icon: Wand2, hex: "#6366F1" },
  { href: "/toolkit/captions-translate", label: "Captions & Translate", icon: Languages, hex: "#3B82F6" },
  { href: "/toolkit/image-resize", label: "Image Resizer", icon: ImageIcon, hex: "#8B5CF6" },
  { href: "/toolkit/brochure-generator", label: "Brochure Generator", icon: FileText, hex: "#06B6D4" },
  { href: "/toolkit/voice-studio", label: "Voice Studio", icon: Mic, hex: "#10B981" },
];

const suiteLaunchpad = [
  { label: "Video Suite", subtitle: "Edit · Captions · Voice", icon: Film, href: "/toolkit/video-suite", hex: "#6366F1", desc: "AI video editing, subtitles & voice studio" },
  { label: "Photo Suite", subtitle: "BG Remove · Filters · Resize", icon: ImageIcon, href: "/toolkit/photo-suite", hex: "#3B82F6", desc: "Background AI, beauty filters, image resizer" },
  { label: "PDF Suite", subtitle: "Edit · Sign · Brochures", icon: FileText, href: "/toolkit/pdf-suite", hex: "#8B5CF6", desc: "PDF editor, scanner, brochure generator" },
  { label: "Marketing Pack", subtitle: "Brochures · Social · Print", icon: Package, href: "/toolkit/brochure-generator", hex: "#06B6D4", desc: "Professional marketing collateral" },
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

  // Filter suites and tools by search
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

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(160deg, #0C0E14 0%, #111827 60%, #0C0E14 100%)" }}>

      {/* ─── Sub-Header ─── */}
      <header style={{ borderBottom: "1px solid rgba(99,102,241,0.18)", background: "rgba(99,102,241,0.05)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/studio" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", boxShadow: "0 0 18px rgba(99,102,241,0.15)" }}>
              <Sparkles style={{ width: "18px", height: "18px", color: "#818CF8" }} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white leading-none tracking-tight">Creative Suite™</p>
              <p className="text-[10px] mt-0.5 leading-none" style={{ color: "rgba(129,140,248,0.7)" }}>JBJ Global Real Estate</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Link to="/studio" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all" style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", color: "#818CF8" }}>
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <Link to="/studio/settings" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:bg-white/5" style={{ color: "rgba(255,255,255,0.4)", border: "1px solid transparent" }}>
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <Link to="/toolkit" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:bg-white/5" style={{ color: "rgba(255,255,255,0.4)" }}>
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden md:inline">All Tools</span>
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
              <div className="h-px w-6" style={{ background: "rgba(99,102,241,0.6)" }} />
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(129,140,248,0.8)" }}>Creative Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Your <span style={{ color: "#818CF8" }}>Projects</span>
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Create and manage your creative projects</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 font-semibold px-5 py-2.5 h-auto rounded-xl text-sm text-white transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
                <Plus className="w-4 h-4 mr-1.5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="border max-w-md mx-4" style={{ background: "#0F1117", borderColor: "rgba(99,102,241,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.9)" }}>
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold">
                  Create New <span style={{ color: "#818CF8" }}>Project</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "rgba(255,255,255,0.4)" }}>Project Name</label>
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My New Project..."
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-600 outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.2)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.6)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider mb-2 block" style={{ color: "rgba(255,255,255,0.4)" }}>Project Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {projectTypes.map((type) => {
                      const Icon = type.icon;
                      const isActive = newProjectType === type.value;
                      const hex = typeHex[type.value] || "#6366F1";
                      return (
                        <button key={type.value} onClick={() => setNewProjectType(type.value)}
                          className="p-3.5 rounded-xl text-left transition-all"
                          style={{
                            background: isActive ? `${hex}18` : "rgba(255,255,255,0.02)",
                            border: `1px solid ${isActive ? hex + "55" : "rgba(255,255,255,0.08)"}`,
                            boxShadow: isActive ? `0 0 16px ${hex}20` : "none",
                          }}>
                          <Icon className="w-5 h-5 mb-2" style={{ color: isActive ? hex : "#52525b" }} />
                          <p className="text-xs text-white font-medium leading-snug">{type.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button className="w-full font-semibold h-11 rounded-xl text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)" }}
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
              <Sparkles className="w-3.5 h-3.5" style={{ color: "#818CF8" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(129,140,248,0.8)" }}>Creative Suites — Click to Open</span>
            </div>
            <Link to="/toolkit" className="flex items-center gap-1 text-xs transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.3)" }}>
              All tools <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredSuites.map((suite) => {
              const Icon = suite.icon;
              return (
                <Link key={suite.href} to={suite.href}
                  className="group relative flex flex-col gap-3 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                  style={{ background: `${suite.hex}0D`, border: `1px solid ${suite.hex}28`, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${suite.hex}18`; el.style.borderColor = `${suite.hex}55`; el.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 30px ${suite.hex}22`; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${suite.hex}0D`; el.style.borderColor = `${suite.hex}28`; el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)"; }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${suite.hex}20`, border: `1px solid ${suite.hex}40` }}>
                    <Icon className="w-5 h-5" style={{ color: suite.hex }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm mb-0.5">{suite.label}</p>
                    <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.38)" }}>{suite.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold transition-colors" style={{ color: suite.hex }}>
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
              <Zap className="w-3.5 h-3.5" style={{ color: "#818CF8" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(129,140,248,0.8)" }}>Quick Tools</span>
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {filteredQuickTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link key={tool.href} to={tool.href}
                    className="group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${tool.hex}12`; el.style.borderColor = `${tool.hex}40`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.03)"; el.style.borderColor = "rgba(255,255,255,0.07)"; }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tool.hex}20`, border: `1px solid ${tool.hex}35` }}>
                      <Icon className="w-4 h-4" style={{ color: tool.hex }} />
                    </div>
                    <span className="text-xs group-hover:text-white transition-colors font-medium leading-snug flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>{tool.label}</span>
                    <ChevronRight className="w-3 h-3 shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Projects Section ─── */}
        <div>
          {/* Filter + Search Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5" style={{ color: "#818CF8" }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(129,140,248,0.8)" }}>My Projects</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.3)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full sm:w-48 pl-9 pr-3 py-2 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.2)" }}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(99,102,241,0.2)"}
                />
              </div>
              <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(99,102,241,0.15)" }}>
                {(["grid", "list"] as const).map((mode) => (
                  <button key={mode} onClick={() => setViewMode(mode)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ background: viewMode === mode ? "rgba(99,102,241,0.2)" : "transparent", color: viewMode === mode ? "#818CF8" : "rgba(255,255,255,0.35)" }}>
                    {mode === "grid" ? <Grid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#6366F1" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>Loading projects...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl"
              style={{ background: "rgba(99,102,241,0.04)", border: "1px solid rgba(99,102,241,0.12)" }}>
              <div className="w-16 h-16 rounded-2xl mb-4 flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <FolderOpen className="w-8 h-8" style={{ color: "rgba(99,102,241,0.5)" }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No projects yet</h3>
              <p className="mb-5 text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Create your first project or use the Creative Suites above to get started
              </p>
              <Button className="font-semibold px-6 rounded-xl text-white h-10 transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 16px rgba(99,102,241,0.35)" }}
                onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> Create Project
              </Button>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {filteredProjects.map((project) => {
                const Icon = typeIcons[project.project_type] || Film;
                const hex = typeHex[project.project_type] || "#6366F1";
                return (
                  <div key={project.id} className="group flex items-center gap-4 p-3.5 rounded-xl transition-all"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${hex}18`, border: `1px solid ${hex}35` }}>
                      <Icon className="w-5 h-5" style={{ color: hex }} />
                    </div>
                    <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate text-sm">{project.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{project.project_type} · {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</p>
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
                const hex = typeHex[project.project_type] || "#6366F1";
                return (
                  <div key={project.id} className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${hex}40`; el.style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${hex}15`; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.07)"; el.style.boxShadow = "none"; }}>
                    <Link to={`/studio/editor/${project.id}`}>
                      <div className="aspect-video relative overflow-hidden" style={{ background: "rgba(0,0,0,0.5)" }}>
                        {project.thumbnail_url ? (
                          <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${hex}12`, border: `1px solid ${hex}25` }}>
                              <Icon className="w-7 h-7" style={{ color: `${hex}80` }} />
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize" style={{ background: `${hex}25`, color: hex, border: `1px solid ${hex}45` }}>
                            {project.project_type.replace("_", " ")}
                          </span>
                        </div>
                        {project.is_shared && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.5)" }}>
                            <Share2 className="w-2.5 h-2.5" style={{ color: "#818CF8" }} />
                          </div>
                        )}
                      </div>
                    </Link>
                    <div className="p-3.5 flex items-start justify-between gap-2">
                      <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold truncate text-sm">{project.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</p>
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
      <footer className="mt-12" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>JBJ Creative Suite™ — Free for all users</p>
          <div className="flex items-center gap-4">
            <Link to="/toolkit" className="text-xs transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.25)" }}>Tool Hub</Link>
            <Link to="/studio/settings" className="text-xs transition-colors hover:text-white" style={{ color: "rgba(255,255,255,0.25)" }}>Settings</Link>
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
      <DropdownMenuTrigger className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
        style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
        <MoreVertical className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border" style={{ background: "#111827", borderColor: "rgba(99,102,241,0.2)" }}>
        <DropdownMenuItem onClick={onRename} className="text-zinc-300 focus:text-white focus:bg-white/10 text-xs"><Pencil className="w-3.5 h-3.5 mr-2" />Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} className="text-zinc-300 focus:text-white focus:bg-white/10 text-xs"><Copy className="w-3.5 h-3.5 mr-2" />Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={onShare} className="text-zinc-300 focus:text-white focus:bg-white/10 text-xs"><Share2 className="w-3.5 h-3.5 mr-2" />Share</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 text-xs"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
