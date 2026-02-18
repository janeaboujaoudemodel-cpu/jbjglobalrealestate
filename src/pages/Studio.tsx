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

// Using HSL values from design system where possible, accent colors for type-coded visuals
const typeColors: Record<string, string> = {
  video: "224 76% 66%",       // blue-ish
  image: "14 76% 62%",        // warm red
  pdf: "38 76% 62%",          // amber
  marketing_pack: "262 76% 66%", // purple
};

const typeHex: Record<string, string> = {
  video: "#5B8AF5",
  image: "#E85C4A",
  pdf: "#E8A84A",
  marketing_pack: "#7B5BF5",
};

const quickTools = [
  { href: "/toolkit/background-ai", label: "Background Remover", icon: Wand2, color: "hsl(224 76% 66%)", hex: "#5B8AF5" },
  { href: "/toolkit/captions-translate", label: "Captions & Translate", icon: Languages, color: "hsl(14 76% 62%)", hex: "#E85C4A" },
  { href: "/toolkit/image-resize", label: "Image Resizer", icon: ImageIcon, color: "hsl(262 76% 66%)", hex: "#7B5BF5" },
  { href: "/toolkit/pdf-suite", label: "PDF Tools", icon: FileText, color: "hsl(38 76% 62%)", hex: "#E8A84A" },
  { href: "/toolkit/voice-studio", label: "Voice Studio", icon: Mic, color: "hsl(158 60% 54%)", hex: "#4AE8A8" },
];

const typeFilters = [
  { value: "all", label: "All", icon: Grid },
  { value: "video", label: "Video", icon: Film },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "marketing_pack", label: "Marketing", icon: Package },
];

const suiteLaunchpad = [
  { label: "Video Suite", subtitle: "Edit · Captions · Voice", icon: Film, href: "/toolkit/video-suite", hex: "#5B8AF5", desc: "AI video editing, subtitles & voice studio" },
  { label: "Photo Suite", subtitle: "BG Remove · Filters · Resize", icon: ImageIcon, href: "/toolkit/photo-suite", hex: "#E85C4A", desc: "Background AI, beauty filters, image resizer" },
  { label: "PDF Suite", subtitle: "Edit · Sign · Brochures", icon: FileText, href: "/toolkit/pdf-suite", hex: "#E8A84A", desc: "PDF editor, scanner, brochure generator" },
  { label: "Marketing Pack", subtitle: "Brochures · Social · Print", icon: Package, href: "/toolkit/brochure-generator", hex: "#7B5BF5", desc: "Professional marketing collateral" },
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

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.project_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(160deg, #0D0B08 0%, #120F0A 60%, #0D0B08 100%)" }}>

      {/* ─── Sub-Header ─── */}
      <header style={{ borderBottom: "1px solid rgba(201,168,76,0.22)", background: "linear-gradient(180deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.01) 100%)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link to="/studio" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)", boxShadow: "0 0 18px rgba(201,168,76,0.12)" }}>
              <Sparkles className="w-4.5 h-4.5 text-gold" style={{ width: "18px", height: "18px" }} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white leading-none tracking-tight">Creative Suite™</p>
              <p className="text-[10px] mt-0.5 leading-none" style={{ color: "rgba(201,168,76,0.55)" }}>JBJ Global Real Estate</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Link to="/studio" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "hsl(var(--gold))" }}>
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Projects</span>
            </Link>
            <Link to="/studio/settings" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-all hover:bg-white/5" style={{ border: "1px solid transparent" }}>
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <Link to="/toolkit" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium text-zinc-400 hover:text-white transition-all hover:bg-white/5">
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
              <div className="h-px w-6 bg-gold/50" />
              <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "rgba(201,168,76,0.7)" }}>Creative Studio</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
              Your <span className="text-gold">Projects</span>
            </h1>
            <p className="text-zinc-500 mt-1.5 text-sm">Create and manage your creative projects</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="shrink-0 font-semibold px-5 py-2.5 h-auto rounded-xl text-sm text-black transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(var(--gold-light)) 100%)", boxShadow: "0 4px 20px rgba(201,168,76,0.35)" }}>
                <Plus className="w-4 h-4 mr-1.5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="border max-w-md mx-4" style={{ background: "#0d0d10", borderColor: "rgba(201,168,76,0.2)", boxShadow: "0 24px 80px rgba(0,0,0,0.9)" }}>
              <DialogHeader>
                <DialogTitle className="text-white text-xl font-bold">
                  Create New <span className="text-gold">Project</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-2">
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">Project Name</label>
                  <input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My New Project..."
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder:text-zinc-600 outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"}
                    onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">Project Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {projectTypes.map((type) => {
                      const Icon = type.icon;
                      const isActive = newProjectType === type.value;
                      const hex = typeHex[type.value] || "#C9A84C";
                      return (
                        <button key={type.value} onClick={() => setNewProjectType(type.value)}
                          className="p-3.5 rounded-xl text-left transition-all"
                          style={{
                            background: isActive ? `${hex}12` : "rgba(255,255,255,0.02)",
                            border: `1px solid ${isActive ? hex + "55" : "rgba(255,255,255,0.08)"}`,
                            boxShadow: isActive ? `0 0 16px ${hex}18` : "none",
                          }}>
                          <Icon className="w-5 h-5 mb-2" style={{ color: isActive ? hex : "#52525b" }} />
                          <p className="text-xs text-white font-medium leading-snug">{type.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <Button className="w-full font-semibold h-11 rounded-xl text-black transition-all" style={{ background: "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(var(--gold-light)) 100%)" }} onClick={handleCreate} disabled={isCreating}>
                  {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Project"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* ─── Suite Launchpad ─── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(201,168,76,0.7)" }}>Creative Suites</span>
            </div>
            <Link to="/toolkit" className="flex items-center gap-1 text-xs hover:text-gold transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>
              All tools <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {suiteLaunchpad.map((suite) => {
              const Icon = suite.icon;
              return (
                <Link key={suite.href} to={suite.href}
                  className="group relative flex flex-col gap-3 p-5 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: `${suite.hex}07`, border: `1px solid ${suite.hex}22`, boxShadow: "0 2px 16px rgba(0,0,0,0.3)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${suite.hex}12`; (e.currentTarget as HTMLElement).style.borderColor = `${suite.hex}45`; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 24px ${suite.hex}18`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${suite.hex}07`; (e.currentTarget as HTMLElement).style.borderColor = `${suite.hex}22`; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 16px rgba(0,0,0,0.3)"; }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${suite.hex}18`, border: `1px solid ${suite.hex}35` }}>
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
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-gold" />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(201,168,76,0.7)" }}>Quick Tools</span>
            </div>
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {quickTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.href} to={tool.href}
                  className="group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${tool.hex}10`; (e.currentTarget as HTMLElement).style.borderColor = `${tool.hex}40`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${tool.hex}18`, border: `1px solid ${tool.hex}33` }}>
                    <Icon className="w-4 h-4" style={{ color: tool.hex }} />
                  </div>
                  <span className="text-xs group-hover:text-white transition-colors font-medium leading-snug flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>{tool.label}</span>
                  <ChevronRight className="w-3 h-3 transition-colors shrink-0" style={{ color: "rgba(255,255,255,0.2)" }} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ─── Filter + Search Row ─── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Type filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {typeFilters.map((type) => {
              const Icon = type.icon;
              const isActive = filterType === type.value;
              return (
                <button key={type.value} onClick={() => setFilterType(type.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: isActive ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isActive ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.08)"}`,
                    color: isActive ? "hsl(var(--gold))" : "rgba(255,255,255,0.45)",
                  }}>
                  <Icon className="w-3 h-3" />
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* Search + View toggle */}
          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full sm:w-52 pl-9 pr-3 py-2 rounded-xl text-sm text-white placeholder:text-zinc-600 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
            <div className="flex items-center gap-0.5 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {(["grid", "list"] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ background: viewMode === mode ? "rgba(201,168,76,0.15)" : "transparent", color: viewMode === mode ? "hsl(var(--gold))" : "rgba(255,255,255,0.35)" }}>
                  {mode === "grid" ? <Grid className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Projects ─── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-gold animate-spin" />
            <p className="text-zinc-500 text-sm">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-2xl mb-5 flex items-center justify-center" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)" }}>
              <FolderOpen className="w-9 h-9" style={{ color: "rgba(201,168,76,0.4)" }} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
            <p className="text-zinc-500 mb-6 text-sm max-w-xs">Create your first project to get started with the Creative Suite</p>
            <Button className="font-semibold px-6 rounded-xl text-black h-10 transition-all hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, hsl(var(--gold)) 0%, hsl(var(--gold-light)) 100%)", boxShadow: "0 4px 16px rgba(201,168,76,0.3)" }}
              onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" /> Create Project
            </Button>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-2">
            {filteredProjects.map((project) => {
              const Icon = typeIcons[project.project_type] || Film;
              const hex = typeHex[project.project_type] || "#C9A84C";
              return (
                <div key={project.id} className="group flex items-center gap-4 p-3.5 sm:p-4 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${hex}15`, border: `1px solid ${hex}30` }}>
                    <Icon className="w-5 h-5" style={{ color: hex }} />
                  </div>
                  <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-sm hover:text-gold transition-colors">{project.name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{project.project_type} · {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</p>
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
              const hex = typeHex[project.project_type] || "#C9A84C";
              return (
                <div key={project.id} className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${hex}35`; (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px rgba(0,0,0,0.5), 0 0 20px ${hex}12`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.3)"; }}>
                  <Link to={`/studio/editor/${project.id}`}>
                    <div className="aspect-video relative overflow-hidden" style={{ background: "rgba(0,0,0,0.5)" }}>
                      {project.thumbnail_url ? (
                        <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${hex}12`, border: `1px solid ${hex}22` }}>
                            <Icon className="w-7 h-7" style={{ color: `${hex}70` }} />
                          </div>
                        </div>
                      )}
                      {/* Type badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize" style={{ background: `${hex}22`, color: hex, border: `1px solid ${hex}40` }}>
                          {project.project_type.replace("_", " ")}
                        </span>
                      </div>
                      {project.is_shared && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(201,168,76,0.2)", border: "1px solid rgba(201,168,76,0.4)" }}>
                          <Share2 className="w-2.5 h-2.5 text-gold" />
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${hex}60, transparent)` }} />
                    </div>
                  </Link>
                  <div className="p-3.5 flex items-start justify-between gap-2">
                    <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold truncate text-sm hover:text-gold transition-colors">{project.name}</h3>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</p>
                    </Link>
                    <ProjectMenu projectId={project.id} onRename={() => toast.info("Rename coming soon")} onDuplicate={() => handleDuplicate(project.id)} onShare={() => handleShare(project.id)} onDelete={() => handleDelete(project.id)} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="mt-12" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>JBJ Creative Suite™ — Free for all users</p>
          <div className="flex items-center gap-4">
            <Link to="/toolkit" className="text-xs transition-colors hover:text-gold" style={{ color: "rgba(255,255,255,0.3)" }}>Tool Hub</Link>
            <Link to="/studio/settings" className="text-xs transition-colors hover:text-gold" style={{ color: "rgba(255,255,255,0.3)" }}>Settings</Link>
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
      <DropdownMenuTrigger className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-white"
        style={{ background: "transparent" }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
        <MoreVertical className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border" style={{ background: "#111113", borderColor: "rgba(255,255,255,0.1)" }}>
        <DropdownMenuItem onClick={onRename} className="text-zinc-300 focus:text-white focus:bg-white/10 text-xs"><Pencil className="w-3.5 h-3.5 mr-2" />Rename</DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate} className="text-zinc-300 focus:text-white focus:bg-white/10 text-xs"><Copy className="w-3.5 h-3.5 mr-2" />Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={onShare} className="text-zinc-300 focus:text-white focus:bg-white/10 text-xs"><Share2 className="w-3.5 h-3.5 mr-2" />Share</DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-300 focus:bg-red-500/10 text-xs"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
