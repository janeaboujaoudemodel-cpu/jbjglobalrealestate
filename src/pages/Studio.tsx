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
// Select removed - replaced with type pills
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

  // Type filter pills configuration
  const typeFilters = [
    { value: "all", label: "All", icon: Grid },
    { value: "video", label: "Video", icon: Film },
    { value: "image", label: "Image", icon: ImageIcon },
    { value: "pdf", label: "PDF", icon: FileText },
    { value: "marketing_pack", label: "Marketing", icon: Package },
  ];

  // Creative toolkit shortcuts
  const creativeShortcuts = [
    { href: "/toolkit/background-ai", label: "Background Remover", icon: Sparkles },
    { href: "/toolkit/captions-translate", label: "Captions", icon: FileText },
    { href: "/toolkit/image-resize", label: "Image Resizer", icon: ImageIcon },
    { href: "/toolkit/pdf-from-photos", label: "PDF Tools", icon: FileText },
    { href: "/toolkit/voice-studio", label: "Voice Studio", icon: Film },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-gold/20">
        <div className="flex items-center justify-between px-6 py-4">
          <Link to="/studio" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Creative Suite™</h1>
              <p className="text-xs text-muted-foreground">JBJ Global Real Estate</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/studio"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 text-gold border border-gold/30"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Projects</span>
            </Link>
            <Link
              to="/studio/settings"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8 max-w-[1800px] mx-auto">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Your Projects</h2>
              <p className="text-muted-foreground mt-1">
                Create and manage your creative projects
              </p>
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gold hover:bg-gold/90 text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-gold/20">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    Create New Project
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Project name"
                    className="bg-background border-gold/30"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    {projectTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          onClick={() => setNewProjectType(type.value)}
                          className={`p-4 rounded-xl border transition-all ${
                            newProjectType === type.value
                              ? "bg-gold/10 border-gold"
                              : "bg-background/50 border-gold/20 hover:border-gold/40"
                          }`}
                        >
                          <Icon
                            className={`w-6 h-6 mb-2 ${
                              newProjectType === type.value
                                ? "text-gold"
                                : "text-muted-foreground"
                            }`}
                          />
                          <p className="text-sm text-foreground">{type.label}</p>
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    className="w-full bg-gold hover:bg-gold/90 text-black"
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

          {/* Type Filter Pills + Search */}
          <div className="flex flex-wrap items-center gap-3">
            {typeFilters.map((type) => {
              const Icon = type.icon;
              const isActive = filterType === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => setFilterType(type.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all border ${
                    isActive 
                      ? "bg-gold/20 border-gold text-gold" 
                      : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & View Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="pl-10 bg-zinc-900 border-gold/30 text-white placeholder:text-zinc-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900/50 border border-gold/20">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-gold/10 text-gold"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-gold/10 text-gold"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Creative Toolkit Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gold/10">
            <span className="text-xs text-zinc-500 uppercase tracking-wider mr-2">Quick Tools:</span>
            {creativeShortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <Link
                  key={shortcut.href}
                  to={shortcut.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-gold hover:border-gold/50 transition-all"
                >
                  <Icon className="w-3 h-3" />
                  {shortcut.label}
                </Link>
              );
            })}
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No projects yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to get started
              </p>
              <Button className="bg-gold hover:bg-gold/90 text-black" onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {filteredProjects.map((project) => {
                const Icon = typeIcons[project.project_type] || Film;
                return (
                  <div
                    key={project.id}
                    className="group relative rounded-2xl bg-card border border-gold/20 overflow-hidden hover:border-gold/40 transition-colors"
                  >
                    <Link to={`/studio/editor/${project.id}`}>
                      <div className="aspect-video bg-background/50 relative overflow-hidden">
                        {project.thumbnail_url ? (
                          <img
                            src={project.thumbnail_url}
                            alt={project.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Icon className="w-12 h-12 text-gold/20" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex gap-2">
                          <span className="px-2 py-1 rounded-full bg-background/70 text-xs text-gold border border-gold/30">
                            {project.project_type}
                          </span>
                          {project.status === "draft" && (
                            <span className="px-2 py-1 rounded-full bg-background/70 text-xs text-muted-foreground border border-muted">
                              Draft
                            </span>
                          )}
                        </div>
                        {project.is_shared && (
                          <div className="absolute top-2 right-2">
                            <Share2 className="w-4 h-4 text-gold" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <Link to={`/studio/editor/${project.id}`} className="flex-1 min-w-0">
                          <h3 className="text-foreground font-medium truncate hover:text-gold transition-colors">
                            {project.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                          </p>
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-gold/20">
                            <DropdownMenuItem
                              onClick={() => handleRename(project.id)}
                              className="text-muted-foreground focus:text-foreground focus:bg-gold/10"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicate(project.id)}
                              className="text-muted-foreground focus:text-foreground focus:bg-gold/10"
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleShare(project.id)}
                              className="text-muted-foreground focus:text-foreground focus:bg-gold/10"
                            >
                              <Share2 className="w-4 h-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gold/10" />
                            <DropdownMenuItem
                              onClick={() => handleDelete(project.id)}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
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

      {/* Footer */}
      <footer className="border-t border-gold/10 py-4 px-6 text-center text-xs text-muted-foreground">
        JBJ RealEstate Creative Suite™ — Free for all users
      </footer>
    </div>
  );
}
