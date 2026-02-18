import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Search,
  Film,
  Image as ImageIcon,
  FileText,
  Package,
  Grid,
  List,
  Loader2,
  Sparkles,
  Home,
  Settings,
  HelpCircle,
  MoreVertical,
  Copy,
  Trash2,
  Share2,
  Pencil,
  Wand2,
  Mic,
  Languages,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  video: Film,
  image: ImageIcon,
  pdf: FileText,
  marketing_pack: Package,
};

const typeColors: Record<string, string> = {
  video: "#E85C4A",
  image: "#5B8AF5",
  pdf: "#E8A84A",
  marketing_pack: "#7B5BF5",
};

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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const { data: userData } = await supabase.auth.getUser();
      
      let query = supabase
        .from("studio_projects")
        .select("id, name, project_type, status, thumbnail_url, is_shared, updated_at")
        .order("updated_at", { ascending: false });

      if (userData?.user?.id) {
        query = query.or(`user_id.eq.${userData.user.id},session_id.eq.${sessionId}`);
      } else {
        query = query.eq("session_id", sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem("studio_session_id");
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem("studio_session_id", sessionId);
    }
    return sessionId;
  };

  const handleCreate = async () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    setIsCreating(true);
    try {
      const sessionId = getOrCreateSessionId();
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("studio_projects")
        .insert({
          name: newProjectName.trim(),
          project_type: newProjectType,
          status: "draft",
          session_id: sessionId,
          user_id: userData?.user?.id || null,
          timeline_state: { tracks: [], duration: 0 },
          canvas_settings: { format: "16:9", quality: "1080p" },
          ai_settings: {},
          is_shared: false,
        })
        .select()
        .single();

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
      const { data: fullProject, error: fetchError } = await supabase
        .from("studio_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (fetchError) throw fetchError;

      const sessionId = getOrCreateSessionId();
      const { data: userData } = await supabase.auth.getUser();

      const { id, created_at, updated_at, ...projectData } = fullProject;

      const { error } = await supabase.from("studio_projects").insert({
        ...projectData,
        name: `${fullProject.name} (Copy)`,
        session_id: sessionId,
        user_id: userData?.user?.id || null,
      });

      if (error) throw error;
      toast.success("Project duplicated!");
      loadProjects();
    } catch (err) {
      console.error("Failed to duplicate:", err);
      toast.error("Failed to duplicate project");
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("studio_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success("Project deleted");
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Failed to delete project");
    }
  };

  const handleShare = (projectId: string) => {
    const shareUrl = `${window.location.origin}/studio/share/${projectId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied!");
  };

  const handleRename = (projectId: string) => {
    toast.info("Rename feature coming soon");
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.project_type === filterType;
    return matchesSearch && matchesType;
  });

  const typeFilters = [
    { value: "all", label: "All", icon: Grid },
    { value: "video", label: "Video", icon: Film },
    { value: "image", label: "Image", icon: ImageIcon },
    { value: "pdf", label: "PDF", icon: FileText },
    { value: "marketing_pack", label: "Marketing", icon: Package },
  ];

  const creativeShortcuts = [
    { href: "/toolkit/background-ai", label: "Background Remover", icon: Wand2, color: "#5B8AF5" },
    { href: "/toolkit/captions-translate", label: "Captions", icon: Languages, color: "#E85C4A" },
    { href: "/toolkit/image-resize", label: "Image Resizer", icon: ImageIcon, color: "#7B5BF5" },
    { href: "/toolkit/pdf-from-photos", label: "PDF Tools", icon: FileText, color: "#E8A84A" },
    { href: "/toolkit/voice-studio", label: "Voice Studio", icon: Mic, color: "#4AE8A8" },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Studio Sub-Header ── */}
      <div className="border-b border-gold/20 bg-gradient-to-r from-black via-zinc-900/40 to-black">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          {/* Brand */}
          <Link to="/studio" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center shadow-[0_0_20px_rgba(201,168,76,0.15)]">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Creative Suite™</p>
              <p className="text-[10px] text-gold/60 mt-0.5 leading-none">JBJ Global Real Estate</p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            <Link
              to="/studio"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold border border-gold/30 text-sm font-medium"
            >
              <Home className="w-4 h-4" />
              Projects
            </Link>
            <Link
              to="/studio/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-sm font-medium"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </div>

      {/* ── Main ── */}
      <main className="px-6 py-10 max-w-[1800px] mx-auto">
        <div className="space-y-8">

          {/* Page title + CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-8 bg-gold/50" />
                <span className="text-xs text-gold/70 uppercase tracking-widest font-medium">Creative Studio</span>
              </div>
              <h1 className="text-4xl font-bold text-white leading-tight">
                Your <span className="text-gold">Projects</span>
              </h1>
              <p className="text-zinc-400 mt-2 text-sm">
                Create and manage your creative projects
              </p>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-6 py-3 h-auto rounded-xl shadow-[0_4px_24px_rgba(201,168,76,0.3)] transition-all hover:shadow-[0_6px_32px_rgba(201,168,76,0.45)] hover:-translate-y-0.5">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0d0d0f] border border-gold/20 shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl font-bold">
                    Create New <span className="text-gold">Project</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-2">
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Project Name</label>
                    <Input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="My New Project..."
                      className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:border-gold/50 rounded-xl h-11"
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 uppercase tracking-wider mb-2 block">Project Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {projectTypes.map((type) => {
                        const Icon = type.icon;
                        const isActive = newProjectType === type.value;
                        const color = typeColors[type.value] || "#C9A84C";
                        return (
                          <button
                            key={type.value}
                            onClick={() => setNewProjectType(type.value)}
                            className={`p-4 rounded-xl border transition-all text-left ${
                              isActive
                                ? "border-opacity-100 bg-white/5"
                                : "border-white/10 bg-white/[0.02] hover:border-white/20"
                            }`}
                            style={isActive ? { borderColor: color + "66", boxShadow: `0 0 20px ${color}18` } : {}}
                          >
                            <Icon
                              className="w-5 h-5 mb-2"
                              style={{ color: isActive ? color : "#71717a" }}
                            />
                            <p className="text-sm text-white font-medium leading-tight">{type.label}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    className="w-full bg-gold hover:bg-gold/90 text-black font-semibold h-11 rounded-xl"
                    onClick={handleCreate}
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* ── Quick Tools Strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {creativeShortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  to={shortcut.href}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 transition-all"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: shortcut.color + "18", border: `1px solid ${shortcut.color}33` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: shortcut.color }} />
                  </div>
                  <span className="text-xs text-zinc-400 group-hover:text-white transition-colors leading-tight font-medium">{shortcut.label}</span>
                  <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors ml-auto shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* ── Filters + Search Row ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Type Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {typeFilters.map((type) => {
                const Icon = type.icon;
                const isActive = filterType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all border ${
                      isActive
                        ? "bg-gold/15 border-gold/50 text-gold"
                        : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </div>

            {/* Search + View Toggle */}
            <div className="flex items-center gap-3 ml-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search projects..."
                  className="pl-9 w-56 bg-white/[0.04] border-white/10 text-white placeholder:text-zinc-600 focus:border-gold/40 rounded-xl h-10"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.04] border border-white/10">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid" ? "bg-gold/15 text-gold" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list" ? "bg-gold/15 text-gold" : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Projects Grid ── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Loading projects...</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-gold/5 border border-gold/15 flex items-center justify-center mx-auto mb-5">
                <Package className="w-9 h-9 text-gold/40" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
              <p className="text-zinc-500 mb-6 text-sm">Create your first project to get started</p>
              <Button
                className="bg-gold hover:bg-gold/90 text-black font-semibold px-6 rounded-xl"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div
              className={`grid gap-4 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
                  : "grid-cols-1"
              }`}
            >
              {filteredProjects.map((project) => {
                const Icon = typeIcons[project.project_type] || Film;
                const accentColor = typeColors[project.project_type] || "#C9A84C";

                if (viewMode === "list") {
                  return (
                    <div
                      key={project.id}
                      className="group flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: accentColor + "15", border: `1px solid ${accentColor}30` }}
                      >
                        <Icon className="w-6 h-6" style={{ color: accentColor }} />
                      </div>
                      <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate hover:text-gold transition-colors">{project.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {project.project_type} · {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                        </p>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                          <MoreVertical className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#111113] border border-white/10">
                          <DropdownMenuItem onClick={() => handleRename(project.id)} className="text-zinc-300 focus:text-white focus:bg-white/10">
                            <Pencil className="w-4 h-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(project.id)} className="text-zinc-300 focus:text-white focus:bg-white/10">
                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(project.id)} className="text-zinc-300 focus:text-white focus:bg-white/10">
                            <Share2 className="w-4 h-4 mr-2" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                }

                return (
                  <div
                    key={project.id}
                    className="group relative rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden hover:border-white/15 hover:bg-white/[0.04] transition-all hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                  >
                    <Link to={`/studio/editor/${project.id}`}>
                      {/* Thumbnail */}
                      <div className="aspect-video relative overflow-hidden bg-black/50">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className="w-16 h-16 rounded-2xl flex items-center justify-center"
                              style={{ background: accentColor + "15", border: `1px solid ${accentColor}25` }}
                            >
                              <Icon className="w-8 h-8" style={{ color: accentColor + "80" }} />
                            </div>
                          </div>
                        )}
                        {/* Type badge */}
                        <div className="absolute top-2.5 left-2.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium capitalize"
                            style={{ background: accentColor + "25", color: accentColor, border: `1px solid ${accentColor}40` }}
                          >
                            {project.project_type}
                          </span>
                        </div>
                        {project.is_shared && (
                          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                            <Share2 className="w-3 h-3 text-gold" />
                          </div>
                        )}
                        {/* Accent line at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />
                      </div>
                    </Link>

                    {/* Card body */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate hover:text-gold transition-colors text-sm">
                            {project.name}
                          </h3>
                          <p className="text-xs text-zinc-600 mt-1">
                            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                          </p>
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#111113] border border-white/10">
                            <DropdownMenuItem onClick={() => handleRename(project.id)} className="text-zinc-300 focus:text-white focus:bg-white/10">
                              <Pencil className="w-4 h-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(project.id)} className="text-zinc-300 focus:text-white focus:bg-white/10">
                              <Copy className="w-4 h-4 mr-2" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(project.id)} className="text-zinc-300 focus:text-white focus:bg-white/10">
                              <Share2 className="w-4 h-4 mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => handleDelete(project.id)} className="text-red-400 focus:text-red-300 focus:bg-red-500/10">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-5 px-6">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <p className="text-xs text-zinc-600">JBJ Creative Suite™ — Free for all users</p>
          <div className="flex items-center gap-4">
            <Link to="/toolkit" className="text-xs text-zinc-600 hover:text-gold transition-colors">Tool Hub</Link>
            <Link to="/studio/settings" className="text-xs text-zinc-600 hover:text-gold transition-colors">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
