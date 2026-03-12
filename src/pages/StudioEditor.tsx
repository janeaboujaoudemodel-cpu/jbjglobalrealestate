import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  Building2,
  Layers,
  Download,
  ChevronDown,
  Loader2,
  Sparkles,
  Home,
  Settings,
  HelpCircle,
  Save,
  Clock,
  ChevronRight,
  Wand2,
  Music,
  Share2,
  Plus,
  Check,
  Search,
  MapPin,
  TrendingUp,
  Globe,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Instagram,
  Youtube,
  Linkedin,
  Copy,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";

interface StudioProject {
  id: string;
  name: string;
  project_type: string;
  status: string;
  property_id?: string;
  property_snapshot?: any;
  timeline_state: any;
  canvas_settings: any;
  ai_settings: any;
  is_shared: boolean;
  share_token?: string;
  updated_at: string;
}

interface StudioJob {
  id: string;
  user_id: string;
  project_id?: string | null;
  job_type: string;
  status: string;
  progress: number;
  created_at: string;
  completed_at?: string | null;
  error_message?: string | null;
  progress_message?: string | null;
  input_data?: Record<string, unknown> | null;
}

export default function StudioEditor() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [project, setProject] = useState<StudioProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [jobs, setJobs] = useState<StudioJob[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(80);
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("ai");
  
  // AI Director state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [creativityLevel, setCreativityLevel] = useState(1);
  const [brandStrictness, setBrandStrictness] = useState(2);
  const [audience, setAudience] = useState("investors");

  // Property picker state
  const [propertySearch, setPropertySearch] = useState("");
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  // Load project
  useEffect(() => {
    if (projectId) {
      loadProject();
      loadJobs();
    }
  }, [projectId]);

  const loadProject = async () => {
    if (!projectId) return;
    try {
      const { data, error } = await supabase
        .from("studio_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data as StudioProject);
      if (data.property_snapshot) {
        setSelectedProperty(data.property_snapshot);
      }
    } catch (err) {
      console.error("Failed to load project:", err);
      toast.error("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  const loadJobs = async () => {
    if (!projectId) return;
    try {
      // NOTE: We intentionally cast to `any` here to avoid deep type instantiation issues
      // from the generated DB types when selecting from large tables.
      const { data, error } = await (supabase as any)
        .from("studio_jobs")
        .select(
          "id,user_id,project_id,job_type,status,progress,created_at,completed_at,error_message,progress_message,input_data"
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setJobs((data || []) as StudioJob[]);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    }
  };


  // Save project with debounce
  const saveProject = useCallback(async (updates: Partial<StudioProject>) => {
    if (!projectId) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const { error } = await supabase
          .from("studio_projects")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", projectId);

        if (error) throw error;
        setLastSaved(new Date());
      } catch (err) {
        console.error("Failed to save:", err);
      } finally {
        setIsSaving(false);
      }
    }, 2000);
  }, [projectId]);

  const handlePropertySelect = useCallback(async (property: any) => {
    setSelectedProperty(property);
    setIsPropertyPickerOpen(false);
    saveProject({ property_id: property.id, property_snapshot: property });
    toast.success(`Selected: ${property.name}`);
  }, [saveProject]);

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim() || !projectId) return;
    
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("studio_jobs").insert({
        user_id: user.id,
        project_id: projectId,
        job_type: "ai_creative",
        status: "pending",
        progress: 0,
        input_data: {
          projectId,
          prompt: aiPrompt,
          settings: { creativityLevel, brandStrictness, audience },
          propertySnapshot: selectedProperty,
        },
      });

      if (error) throw error;
      toast.success("AI generation queued!");
      loadJobs();
    } catch (err) {
      console.error("Failed to create job:", err);
      toast.error("Failed to start generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const loadProperties = async () => {
    setLoadingProperties(true);
    try {
      let query = supabase
        .from("projects")
        .select("id, name, developer_name, area_name, price_from, cover_image_url")
        .eq("is_published", true)
        .order("name")
        .limit(50);

      if (propertySearch) {
        query = query.ilike("name", `%${propertySearch}%`);
      }

      const { data } = await query;
      setProperties(data || []);
    } catch (err) {
      console.error("Failed to load properties:", err);
    } finally {
      setLoadingProperties(false);
    }
  };

  useEffect(() => {
    if (isPropertyPickerOpen) {
      loadProperties();
    }
  }, [isPropertyPickerOpen, propertySearch]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatPrice = (price?: number) => {
    if (!price) return "POA";
    if (price >= 1000000) return `AED ${(price / 1000000).toFixed(1)}M`;
    return `AED ${(price / 1000).toFixed(0)}K`;
  };

  const creativityLabels = ["Safe", "Balanced", "Bold"];
  const brandLabels = ["Minimal", "Branded", "Fully Branded"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-foreground mb-4">Project not found</h2>
        <Button className="bg-gold hover:bg-gold/90 text-black" onClick={() => navigate("/studio")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 lg:top-[48px] z-50 bg-background/90 backdrop-blur-xl border-b border-gold/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/studio" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Creative Suite™</h1>
                <p className="text-xs text-muted-foreground">JBJ Global Real Estate</p>
              </div>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">{project.name}</span>
            {(isSaving || lastSaved) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isSaving ? (
                  <>
                    <Save className="w-3 h-3 animate-pulse" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <Clock className="w-3 h-3" />
                    <span>Saved {format(lastSaved, "h:mm a")}</span>
                  </>
                ) : null}
              </div>
            )}
          </div>

          <nav className="flex items-center gap-2">
            <Link to="/studio" className="flex items-center gap-2 px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50">
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Projects</span>
            </Link>
            <button className="p-2 text-muted-foreground hover:text-foreground">
              <HelpCircle className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* Left Panel - Property & Assets */}
          <div className="col-span-3 space-y-4 overflow-y-auto">
            <div className="p-4 rounded-2xl bg-card border border-gold/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold">Property</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPropertyPickerOpen(true)}
                  className="text-gold hover:text-gold hover:bg-gold/10"
                >
                  <Building2 className="w-4 h-4 mr-1" />
                  {selectedProperty ? "Change" : "Select"}
                </Button>
              </div>

              {selectedProperty ? (
                <div className="space-y-3">
                  <div className="aspect-video rounded-lg bg-background overflow-hidden">
                    {selectedProperty.cover_image_url ? (
                      <img
                        src={selectedProperty.cover_image_url}
                        alt={selectedProperty.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <h4 className="text-foreground font-medium text-sm">{selectedProperty.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedProperty.developer_name}</p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Select a property to pull assets
                </div>
              )}
            </div>

            {/* Timeline Layers Preview */}
            <div className="p-4 rounded-2xl bg-card border border-gold/20">
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-gold" />
                <h3 className="text-foreground font-semibold">Layers</h3>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="p-2 rounded bg-background/50 border border-gold/10">Video Track</div>
                <div className="p-2 rounded bg-background/50 border border-gold/10">Audio Track</div>
                <div className="p-2 rounded bg-background/50 border border-gold/10">Captions</div>
                <div className="p-2 rounded bg-background/50 border border-gold/10">Overlays</div>
              </div>
            </div>
          </div>

          {/* Center - Preview & Timeline */}
          <div className="col-span-6 flex flex-col">
            {/* Video Preview */}
            <div className="flex-1 rounded-2xl bg-background border border-gold/20 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-gold ml-1" />
                  </div>
                  <p className="text-muted-foreground">Preview will appear here</p>
                </div>
              </div>
              <button className="absolute top-4 right-4 p-2 rounded-lg bg-background/50 text-foreground hover:bg-background/70 transition-colors">
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            {/* Playback Controls */}
            <div className="mt-4 p-4 rounded-2xl bg-card border border-gold/20">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-muted-foreground hover:text-foreground">
                    <SkipBack className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-black hover:bg-gold/90 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <button className="p-2 text-muted-foreground hover:text-foreground">
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground w-12">{formatTime(currentTime)}</span>
                <div className="flex-1">
                  <Slider value={[currentTime]} max={duration} step={0.1} onValueChange={([v]) => setCurrentTime(v)} />
                </div>
                <span className="text-xs text-muted-foreground w-12">{formatTime(duration)}</span>
                <div className="flex items-center gap-2 w-24">
                  <Volume2 className="w-4 h-4 text-muted-foreground" />
                  <Slider value={[volume]} max={100} onValueChange={([v]) => setVolume(v)} className="flex-1" />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-4 p-4 rounded-2xl bg-card border border-gold/20 h-40 overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-foreground font-semibold text-sm">Timeline</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <button className="hover:text-foreground">100%</button>
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-background/50 rounded border border-gold/10 relative">
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-gold/20 rounded" />
                </div>
                <div className="h-8 bg-background/50 rounded border border-gold/10 relative">
                  <div className="absolute inset-y-0 left-[20%] w-1/4 bg-primary/20 rounded" />
                </div>
                <div className="h-8 bg-background/50 rounded border border-gold/10" />
              </div>
            </div>
          </div>

          {/* Right Panel - Tools */}
          <div className="col-span-3 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-4 bg-background/50 border border-gold/20 mb-4">
                <TabsTrigger value="ai" className="text-xs">AI</TabsTrigger>
                <TabsTrigger value="audio" className="text-xs">Audio</TabsTrigger>
                <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
                <TabsTrigger value="jobs" className="text-xs">Jobs</TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="mt-0 space-y-4">
                <div className="p-6 rounded-2xl bg-card border border-gold/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold">AI Creative Director</h3>
                      <p className="text-xs text-muted-foreground">Describe what you want to create</p>
                    </div>
                  </div>

                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Create a 30-second luxury property showcase..."
                    className="min-h-[100px] bg-background border-gold/30 mb-4"
                  />

                  {!selectedProperty && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm mb-4">
                      Select a property to enable AI generation
                    </div>
                  )}

                  <Button
                    className="w-full bg-gold hover:bg-gold/90 text-black"
                    onClick={handleAIGenerate}
                    disabled={!aiPrompt.trim() || isGenerating || !selectedProperty}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                </div>

                {/* Settings */}
                <div className="p-6 rounded-2xl bg-card border border-gold/20 space-y-6">
                  <h3 className="text-foreground font-semibold">Creative Settings</h3>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Creativity Level</label>
                      <span className="text-sm text-gold">{creativityLabels[creativityLevel]}</span>
                    </div>
                    <Slider value={[creativityLevel]} max={2} step={1} onValueChange={([v]) => setCreativityLevel(v)} />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-muted-foreground">Brand Strictness</label>
                      <span className="text-sm text-gold">{brandLabels[brandStrictness]}</span>
                    </div>
                    <Slider value={[brandStrictness]} max={2} step={1} onValueChange={([v]) => setBrandStrictness(v)} />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Target Audience</label>
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger className="bg-background border-gold/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investors">Investors</SelectItem>
                        <SelectItem value="end_users">End Users</SelectItem>
                        <SelectItem value="brokers">Brokers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="audio" className="mt-0">
                <div className="p-6 rounded-2xl bg-card border border-gold/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                      <Music className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-foreground font-semibold">Trending Audio</h3>
                      <p className="text-xs text-muted-foreground">Suggested tracks for your video</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {["Luxury Vibes", "Modern Elegance", "Urban Dreams"].map((track) => (
                      <div key={track} className="p-3 rounded-xl bg-background/50 border border-gold/10 flex items-center justify-between">
                        <span>{track}</span>
                        <Button variant="ghost" size="sm" className="text-gold hover:text-gold hover:bg-gold/10">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="export" className="mt-0 space-y-4">
                <div className="p-6 rounded-2xl bg-card border border-gold/20 space-y-4">
                  <h3 className="text-foreground font-semibold">Export Formats</h3>
                  <div className="space-y-2">
                    {[
                      { label: "Instagram Reel", format: "9:16", size: "1080x1920" },
                      { label: "YouTube", format: "16:9", size: "1920x1080" },
                      { label: "Square", format: "1:1", size: "1080x1080" },
                      { label: "Story", format: "9:16", size: "1080x1920" },
                    ].map((exp) => (
                      <button
                        key={exp.label}
                        className="w-full p-3 rounded-xl bg-background/50 border border-gold/20 hover:border-gold/40 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-foreground">{exp.label}</p>
                            <p className="text-xs text-muted-foreground">{exp.size}</p>
                          </div>
                          <span className="text-xs text-gold">{exp.format}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button className="w-full bg-gold hover:bg-gold/90 text-black">
                    <Download className="w-4 h-4 mr-2" />
                    Export All (ZIP)
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="jobs" className="mt-0">
                <div className="p-6 rounded-2xl bg-card border border-gold/20">
                  <h3 className="text-foreground font-semibold mb-4">Background Jobs</h3>
                  {jobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No jobs running</div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.map((job) => (
                        <div key={job.id} className="p-4 rounded-xl bg-background/50 border border-gold/20">
                          <div className="flex items-center gap-2">
                            {job.status === "processing" ? (
                              <Loader2 className="w-4 h-4 text-gold animate-spin" />
                            ) : job.status === "completed" ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : job.status === "failed" ? (
                              <XCircle className="w-4 h-4 text-destructive" />
                            ) : (
                              <Clock className="w-4 h-4 text-yellow-400" />
                            )}
                            <span className="text-sm text-foreground">{job.job_type}</span>
                          </div>
                          {job.status === "processing" && (
                            <div className="mt-2 h-1.5 bg-background rounded-full overflow-hidden">
                              <div className="h-full bg-gold" style={{ width: `${job.progress}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      {/* Property Picker Dialog */}
      <Dialog open={isPropertyPickerOpen} onOpenChange={setIsPropertyPickerOpen}>
        <DialogContent className="bg-card border-gold/20 max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold" />
              Select Property
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={propertySearch}
                onChange={(e) => setPropertySearch(e.target.value)}
                placeholder="Search properties..."
                className="pl-10 bg-background border-gold/30"
              />
            </div>

            <ScrollArea className="h-[400px]">
              {loadingProperties ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
              ) : properties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No properties found</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pr-4">
                  {properties.map((property) => (
                    <button
                      key={property.id}
                      onClick={() => handlePropertySelect(property)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        selectedProperty?.id === property.id
                          ? "bg-gold/10 border-gold"
                          : "bg-background/50 border-gold/20 hover:border-gold/40"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className="w-24 h-16 rounded-lg bg-background overflow-hidden flex-shrink-0">
                          {property.cover_image_url ? (
                            <img src={property.cover_image_url} alt={property.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-foreground font-medium truncate">{property.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{property.developer_name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gold">{formatPrice(property.price_from)}</span>
                            {property.area_name && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {property.area_name}
                              </span>
                            )}
                          </div>
                        </div>
                        {selectedProperty?.id === property.id && <Check className="w-5 h-5 text-gold" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gold/10">
            <Button variant="secondary" onClick={() => setIsPropertyPickerOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
