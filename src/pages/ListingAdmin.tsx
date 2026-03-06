import { useEffect, useState, useRef } from "react";
import { DeveloperVisibilityPanel } from "@/components/listing-admin/DeveloperVisibilityPanel";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useListingAdmin } from "@/hooks/useListingAdmin";
import { useProjectsCount, useProjectsTotalCount, useProjectsPaginated, useDevelopers, useCommunities } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  Crown,
  Building2,
  Upload,
  Trash2,
  Download,
  File,
  X,
  Image,
  ArrowLeft,
  FolderOpen,
  ExternalLink,
  MessageCircle,
  Users,
  Loader2,
  Database,
} from "lucide-react";
import ListingSearchFilters from "@/components/listing-admin/ListingSearchFilters";
import ListingAdminChat from "@/components/listing-admin/ListingAdminChat";
import { PendingUpdatesQueue } from "@/components/listing-admin/PendingUpdatesQueue";
import { ProjectApprovalQueue } from "@/components/listing-admin/ProjectApprovalQueue";
import { ExtractionJobsPanel } from "@/components/listing-admin/ExtractionJobsPanel";
import SyncDashboard from "@/components/listing-admin/SyncDashboard";
import { ReellyImportPanel } from "@/components/listing-admin/ReellyImportPanel";
import { SourceCountsPanel } from "@/components/listing-admin/SourceCountsPanel";
import { EmergencyMirrorPanel } from "@/components/listing-admin/EmergencyMirrorPanel";
import { EnrichmentCenter } from "@/components/listing-admin/EnrichmentCenter";
import { RefreshCw, Globe, Check, AlertTriangle, Zap } from "lucide-react";
import { ProjectPreviewModal } from "@/components/listing-admin/ProjectPreviewModal";
import { SafeImage } from "@/components/SafeImage";
import type { UnifiedProject } from "@/types/unifiedProject";

interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  file_size: number | null;
  created_at: string;
}

const ListingAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isOwner, ownerLoading } = useAuth();
  const { t } = useLanguage();
  const { isListingAdmin, adminData, isLoading: checkingAdmin } = useListingAdmin();

  const { data: totalCount } = useProjectsCount(); // published only
  const { data: allProjectsCount } = useProjectsTotalCount(); // all including unpublished
  const [projectsPage, setProjectsPage] = useState(0);
  const { data: paginatedProjects, refetch: refetchProjects } = useProjectsPaginated(projectsPage, 50);
  const { data: developers } = useDevelopers();
  const { data: communities } = useCommunities();
  
  // Preview modal state
  const [previewProject, setPreviewProject] = useState<UnifiedProject | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDeveloper, setFilterDeveloper] = useState<string>("all");
  const [filterEmirate, setFilterEmirate] = useState<string>("all");
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // View state - 'chat', 'projects', or 'editor'
  // UNIFIED: Now using 'data-ops' as the single entry for all sync/extraction views
  const [activeView, setActiveView] = useState<'chat' | 'projects' | 'editor' | 'data-ops'>('data-ops');
  
  // Controlled sub-tab state for Data Ops tabs - responds to URL params
  const [dataOpsTab, setDataOpsTab] = useState<string>("reelly");

  // Allow deep-links like /listing-admin?view=data-ops&syncTab=approvals
  // Legacy URLs (sync, reelly, data-sources) all redirect to data-ops
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const view = params.get("view");
    const syncTab = params.get("syncTab");
    
    // Map legacy views to new unified data-ops view
    const legacyToNew: Record<string, string> = {
      'sync': 'data-ops',
      'reelly': 'data-ops', 
      'data-sources': 'data-ops',
    };
    const mappedView = legacyToNew[view || ''] || view;
    const allowed = new Set(["chat", "projects", "editor", "data-ops"]);
    
    if (mappedView && allowed.has(mappedView) && mappedView !== activeView) {
      setActiveView(mappedView as any);
      // Reset sub-modes when switching views via URL
      setIsEditing(false);
      setIsCreating(false);
      setShowChat(mappedView === "chat");
    }
    
    // Handle syncTab URL param for Data Ops sub-tabs (updated tab names)
    if (syncTab && ['reelly', 'approvals', 'updates', 'external', 'emergency', 'enrichment'].includes(syncTab)) {
      setDataOpsTab(syncTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Document upload state
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("brochure");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    location: "",
    price_from: "",
    price_to: "",
    bedrooms_min: "",
    bedrooms_max: "",
    handover_date: "",
    developer_id: "",
    community_id: "",
    emirate: "Dubai",
    is_premium: false,
    is_sold_out: false,
    furnished_status: "unfurnished",
    payment_plan: "",
    service_charge: "",
  });

  useEffect(() => {
    if (!checkingAdmin && !ownerLoading && !user) {
      navigate("/auth?redirect=/listing-admin");
    }
  }, [user, checkingAdmin, ownerLoading, navigate]);

  // Allow access if user is listing admin OR Owner (verified via AuthContext)
  const hasAccess = isListingAdmin || isOwner;

  // Cache owner status in sessionStorage for instant reload
  useEffect(() => {
    if (!ownerLoading && isOwner) {
      sessionStorage.setItem('jj_owner_verified', 'true');
    }
  }, [isOwner, ownerLoading]);

  const cachedOwner = sessionStorage.getItem('jj_owner_verified') === 'true';
  const stillLoading = checkingAdmin || ownerLoading;
  const effectiveAccess = hasAccess || cachedOwner;

  if (stillLoading && !cachedOwner) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center pt-28 gap-6">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-gold" />
          <p className="text-zinc-400 text-sm">Verifying access permissions...</p>
        </div>
        <div className="w-80 space-y-3">
          <div className="h-2 bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-2 bg-zinc-800 rounded-full animate-pulse w-3/4" />
          <div className="h-2 bg-zinc-800 rounded-full animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (!effectiveAccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-28">
        <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-foreground text-xl font-semibold mb-2">{t('listingAdmin.accessDenied')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('listingAdmin.noPermission')}
            </p>
            <Button onClick={() => navigate("/")} variant="primary">
              {t('listingAdmin.goHome')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProjects = paginatedProjects?.filter((project) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.developer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDeveloper = filterDeveloper === "all" || project.developer?.id === filterDeveloper;
    const matchesEmirate = filterEmirate === "all" || project.emirate === filterEmirate;
    const matchesLocation = !filterLocation || 
      project.location?.toLowerCase().includes(filterLocation.toLowerCase()) ||
      project.community?.name?.toLowerCase().includes(filterLocation.toLowerCase());
    return matchesSearch && matchesDeveloper && matchesEmirate && matchesLocation;
  });

  const handleEditProject = async (project: any) => {
    // Hide chat and show editor when a project is selected
    setShowChat(false);
    setSelectedProject(project);
    setFormData({
      name: project.name || "",
      slug: project.slug || "",
      description: project.description || "",
      location: project.location || "",
      price_from: project.price_from?.toString() || "",
      price_to: project.price_to?.toString() || "",
      bedrooms_min: project.bedrooms_min?.toString() || "",
      bedrooms_max: project.bedrooms_max?.toString() || "",
      handover_date: project.handover_date || "",
      developer_id: project.developer?.id || "",
      community_id: project.community?.id || "",
      emirate: project.emirate || "Dubai",
      is_premium: project.is_premium || false,
      is_sold_out: project.is_sold_out || false,
      furnished_status: project.furnished_status || "unfurnished",
      payment_plan: project.payment_plan || "",
      service_charge: project.service_charge || "",
    });
    setIsEditing(true);
    setIsCreating(false);

    // Fetch documents for this project
    const { data: docs } = await supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    setProjectDocuments(docs || []);
  };

  const handleCreateNew = () => {
    setSelectedProject(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      location: "",
      price_from: "",
      price_to: "",
      bedrooms_min: "",
      bedrooms_max: "",
      handover_date: "",
      developer_id: "",
      community_id: "",
      emirate: "Dubai",
      is_premium: false,
      is_sold_out: false,
      furnished_status: "unfurnished",
      payment_plan: "",
      service_charge: "",
    });
    setProjectDocuments([]);
    setIsCreating(true);
    setIsEditing(false);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) return;

    setIsUploadingDocument(true);

    try {
      const fileName = `${selectedProject.id}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("project-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("project-files")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("project_documents")
        .insert({
          project_id: selectedProject.id,
          file_name: file.name,
          file_url: urlData.publicUrl,
          document_type: selectedDocType,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      // Refresh documents
      const { data: docs } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: false });

      setProjectDocuments(docs || []);
      toast.success("Document uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setIsUploadingDocument(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedProject) return;

    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        const fileName = `${selectedProject.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("project-files")
          .upload(fileName, file);

        if (uploadError) continue;

        const { data: urlData } = supabase.storage
          .from("project-files")
          .getPublicUrl(fileName);

        await supabase
          .from("project_images")
          .insert({
            project_id: selectedProject.id,
            image_url: urlData.publicUrl,
            is_primary: false,
          });

        successCount++;
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} image(s) uploaded successfully`);
      refetchProjects();
    }

    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (doc: ProjectDocument) => {
    try {
      const urlParts = doc.file_url.split("/project-files/");
      const filePath = urlParts[1];

      if (filePath) {
        await supabase.storage.from("project-files").remove([filePath]);
      }

      const { error } = await supabase
        .from("project_documents")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;

      setProjectDocuments((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success("Document deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSaveProject = async () => {
    if (!formData.name || !formData.developer_id) {
      toast.error("Name and Developer are required");
      return;
    }

    setIsSaving(true);
    try {
      const projectData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description,
        location: formData.location,
        price_from: formData.price_from ? parseFloat(formData.price_from) : null,
        price_to: formData.price_to ? parseFloat(formData.price_to) : null,
        bedrooms_min: formData.bedrooms_min ? parseInt(formData.bedrooms_min) : null,
        bedrooms_max: formData.bedrooms_max ? parseInt(formData.bedrooms_max) : null,
        handover_date: formData.handover_date || null,
        developer_id: formData.developer_id || null,
        community_id: formData.community_id || null,
        emirate: formData.emirate,
        is_premium: formData.is_premium,
        is_sold_out: formData.is_sold_out,
        furnished_status: formData.furnished_status,
        payment_plan: formData.payment_plan || null,
        service_charge: formData.service_charge || null,
      };

      if (isCreating) {
        const { data, error } = await supabase
          .from("projects")
          .insert(projectData)
          .select()
          .single();

        if (error) throw error;
        
        toast.success("Project created successfully!");
        setSelectedProject(data);
        setIsCreating(false);
        setIsEditing(true);
      } else if (selectedProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", selectedProject.id);

        if (error) throw error;
        toast.success("Project updated successfully");
      }

      refetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", selectedProject.id);

      if (error) throw error;

      toast.success("Project deleted");
      setSelectedProject(null);
      setIsEditing(false);
      refetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete project");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleBulkUpload = (url: string) => {
    console.log("Bulk upload URL:", url);
    // This would trigger the edge function to process the Google Drive link
  };

  const handleCreateListing = (type: "off-plan" | "secondary", data: any) => {
    console.log("Create listing:", type, data);
    handleCreateNew();
    // Pre-fill form data from AI response
  };


  // When editing a project, switch to editor view
  const handleEditProjectWithView = async (project: any) => {
    await handleEditProject(project);
    setActiveView('editor');
  };

  return (
    <div className="min-h-screen bg-black pt-20 lg:pt-24">
      {/* Premium Dashboard Shell */}
      <div className="mx-3 md:mx-4 lg:mx-6 my-6 rounded-2xl border border-border bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
      {/* Header - Clean neutral style */}
      <header className="border-b border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] sticky top-20 lg:top-24 z-40 rounded-t-2xl">
        <div className="max-w-[1200px] mx-auto px-4 py-4">
          {/* Row 1: Title and actions */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-900">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-zinc-900 text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                    {t('listingAdmin.title')}
                  </h1>
                  <span className="text-zinc-500 text-sm">{t('listingAdmin.propertyManager')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate("/team")}
                variant="secondary"
              >
                <Users className="w-4 h-4 mr-2" />
                {t('listingAdmin.team')}
              </Button>
              <Button
                variant="secondary"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t('listingAdmin.signOut')}
              </Button>
            </div>
          </div>

          {/* Row 2: Navigation Tabs + Stats */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                onClick={() => { setActiveView('chat'); setShowChat(true); }}
                variant={activeView === 'chat' ? 'primary' : 'secondary'}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {t('listingAdmin.chatWithSarah')}
              </Button>
              <Button
                onClick={() => { setActiveView('projects'); setShowChat(false); setIsEditing(false); setIsCreating(false); }}
                variant={activeView === 'projects' ? 'primary' : 'secondary'}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {t('listingAdmin.projects')} ({totalCount ?? 0})
              </Button>
              {/* UNIFIED: Single Data Ops button replaces 3 separate buttons */}
              <Button
                onClick={() => { setActiveView('data-ops'); setShowChat(false); setIsEditing(false); setIsCreating(false); }}
                variant={activeView === 'data-ops' ? 'primary' : 'secondary'}
              >
                <Database className="w-4 h-4 mr-2" />
                Data Ops
              </Button>
              <Button
                onClick={() => { handleCreateNew(); setActiveView('editor'); }}
                variant="secondary"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('listingAdmin.addNewProject')}
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] rounded-lg border-2 border-gold/30">
                <Building2 className="w-4 h-4 text-gold" />
                <span className="text-sm text-black font-medium">{totalCount ?? 0} Published</span>
                <span className="text-xs text-zinc-400">/ {allProjectsCount ?? 0} Total</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] rounded-lg border-2 border-gold/30">
                <Crown className="w-4 h-4 text-gold" />
                <span className="text-sm text-black font-medium">{paginatedProjects?.filter((p) => p.is_premium).length || 0} {t('listingAdmin.premium')}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="h-[calc(100vh-220px)]">
        {/* Chat View - Full Width Edge to Edge */}
        {activeView === 'chat' && (
          <div className="h-full">
            <ListingAdminChat
              onBulkUpload={handleBulkUpload}
              onCreateListing={handleCreateListing}
            />
          </div>
        )}

        {/* UNIFIED Data Ops View - All sync/extraction in one tabbed interface */}
        {activeView === 'data-ops' && (
          <div className="container mx-auto px-4 py-6 space-y-6">
            {/* SOURCE COUNTS PANEL - Reelly Only (Provident removed) */}
            <SourceCountsPanel />
            
            <Tabs value={dataOpsTab} onValueChange={setDataOpsTab} className="space-y-6">
              <TabsList className="bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] border-2 border-gold/30 p-1">
                <TabsTrigger 
                  value="reelly" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Reelly Sync
                </TabsTrigger>
                <TabsTrigger 
                  value="approvals"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Project Approvals
                </TabsTrigger>
                <TabsTrigger 
                  value="updates"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Pending Updates
                </TabsTrigger>
                <TabsTrigger 
                  value="external"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
                >
                  <Database className="w-4 h-4 mr-2" />
                  External Sources
                </TabsTrigger>
                <TabsTrigger 
                  value="enrichment"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Enrichment Center
                </TabsTrigger>
                <TabsTrigger 
                  value="emergency"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Emergency Mirror
                </TabsTrigger>
                <TabsTrigger 
                  value="dev-visibility"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:border-gold/40 data-[state=active]:text-foreground"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Developer Visibility
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="reelly" className="mt-0">
                <ReellyImportPanel />
              </TabsContent>
              <TabsContent value="approvals" className="mt-0">
                <ProjectApprovalQueue onRefresh={refetchProjects} />
              </TabsContent>
              <TabsContent value="updates" className="mt-0">
                <PendingUpdatesQueue onRefresh={refetchProjects} />
              </TabsContent>
              <TabsContent value="external" className="mt-0">
                <ExtractionJobsPanel />
              </TabsContent>
              <TabsContent value="enrichment" className="mt-0">
                <EnrichmentCenter />
              </TabsContent>
              <TabsContent value="emergency" className="mt-0">
                <EmergencyMirrorPanel />
              </TabsContent>
              <TabsContent value="dev-visibility" className="mt-0">
                <DeveloperVisibilityPanel />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Projects View - Grid */}
        {activeView === 'projects' && (
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Search Filters */}
              <div className="lg:col-span-1">
                <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 sticky top-44">
                  <CardContent className="p-4">
                    <ListingSearchFilters
                      developers={developers || []}
                      onSearchChange={setSearchQuery}
                      onDeveloperChange={setFilterDeveloper}
                      onEmirateChange={setFilterEmirate}
                      onLocationChange={setFilterLocation}
                      searchValue={searchQuery}
                      developerValue={filterDeveloper}
                      emirateValue={filterEmirate}
                      locationValue={filterLocation}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Project Grid */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProjects?.map((project) => (
                    <Card
                      key={project.id}
                      className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 cursor-pointer transition-all hover:shadow-lg hover:border-gold overflow-hidden ${
                        selectedProject?.id === project.id ? "border-gold ring-2 ring-gold/20" : ""
                      }`}
                      onClick={() => { setPreviewProject(project); setShowPreviewModal(true); }}
                    >
                      {/* Cover Image */}
                      <div className="aspect-[16/10] overflow-hidden bg-muted">
                        <SafeImage
                          src={project.cover_image_url || project.images?.[0]?.image_url}
                          alt={project.name}
                          className="w-full h-full object-cover"
                          fallbackSrc="/placeholder.svg"
                        />
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-black font-medium truncate">{project.name}</h3>
                            <p className="text-zinc-500 text-sm truncate">{project.developer?.name || (project as any).developer_name || "No Developer"}</p>
                            {project.emirate && <p className="text-zinc-400 text-xs">{project.emirate}</p>}
                            {project.price_from && (
                              <p className="text-gold font-bold text-sm mt-1">
                                From AED {(project.price_from / 1000000).toFixed(1)}M
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {project.is_premium && <Crown className="w-4 h-4 text-gold flex-shrink-0" />}
                            {project.is_sold_out && <Badge variant="destructive" className="text-[10px]">Sold Out</Badge>}
                            {(project as any).construction_status && (
                              <Badge variant="outline" className="text-[10px] border-gold/30">{(project as any).construction_status}</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {filteredProjects?.length === 0 && (
                    <div className="col-span-full text-center py-16 text-zinc-500">
                      <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">{t('listingAdmin.noProjectsFound')}</p>
                    </div>
                  )}
                </div>
                {/* Pagination */}
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={projectsPage === 0}
                    onClick={() => setProjectsPage(p => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {projectsPage + 1} of {Math.ceil((allProjectsCount ?? 0) / 50) || 1}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={((projectsPage + 1) * 50) >= (allProjectsCount ?? 0)}
                    onClick={() => setProjectsPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal - outside conditional */}
        <ProjectPreviewModal
          project={previewProject}
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          onEdit={(p) => handleEditProjectWithView(p)}
          onSendToSarah={(p) => {
            setShowPreviewModal(false);
            setActiveView('chat');
            setShowChat(true);
          }}
        />

        {/* Editor View */}
        {activeView === 'editor' && (isEditing || isCreating) && (
          <div className="container mx-auto px-4 py-6">
            <Card className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
              <CardHeader className="border-b border-gold/30">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-black">
                    {isCreating ? t('listingAdmin.createNewProject') : `${t('listingAdmin.editProject')}: ${selectedProject?.name}`}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {!isCreating && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/project/${selectedProject?.slug}`, "_blank")}
                        className="text-zinc-600 hover:text-black"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        {t('listingAdmin.view')}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                        setSelectedProject(null);
                        setActiveView('projects');
                      }}
                      className="text-zinc-600 hover:text-black"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                <Tabs defaultValue="details" className="space-y-6">
                  <TabsList className="bg-zinc-100 border border-zinc-200">
                    <TabsTrigger value="details" className="data-[state=active]:bg-black data-[state=active]:text-white">
                      {t('listingAdmin.details')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documents" 
                      className="data-[state=active]:bg-black data-[state=active]:text-white"
                      disabled={isCreating}
                    >
                      {t('listingAdmin.documents')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="images" 
                      className="data-[state=active]:bg-black data-[state=active]:text-white"
                      disabled={isCreating}
                    >
                      {t('listingAdmin.images')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="md:col-span-2">
                        <Label className="text-zinc-600">{t('listingAdmin.projectName')} *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              name: e.target.value,
                              slug: generateSlug(e.target.value),
                            });
                          }}
                          placeholder="e.g., Sobha Hartland II"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      {/* Developer */}
                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.developer')} *</Label>
                        <Select
                          value={formData.developer_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, developer_id: value })
                          }
                        >
                          <SelectTrigger className="bg-zinc-50 border-zinc-300 text-black mt-1">
                            <SelectValue placeholder={t('listingAdmin.selectDeveloper')} />
                          </SelectTrigger>
                          <SelectContent>
                            {developers?.map((dev) => (
                              <SelectItem key={dev.id} value={dev.id}>
                                {dev.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Community */}
                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.community')}</Label>
                        <Select
                          value={formData.community_id}
                          onValueChange={(value) =>
                            setFormData({ ...formData, community_id: value })
                          }
                        >
                          <SelectTrigger className="bg-zinc-50 border-zinc-300 text-black mt-1">
                            <SelectValue placeholder={t('listingAdmin.selectCommunity')} />
                          </SelectTrigger>
                          <SelectContent>
                            {communities?.map((comm) => (
                              <SelectItem key={comm.id} value={comm.id}>
                                {comm.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Location */}
                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.location')}</Label>
                        <Input
                          value={formData.location}
                          onChange={(e) =>
                            setFormData({ ...formData, location: e.target.value })
                          }
                          placeholder="e.g., MBR City, Dubai"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      {/* Emirate */}
                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.emirate')}</Label>
                        <Select
                          value={formData.emirate}
                          onValueChange={(value) =>
                            setFormData({ ...formData, emirate: value })
                          }
                        >
                          <SelectTrigger className="bg-zinc-50 border-zinc-300 text-black mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Dubai">Dubai</SelectItem>
                            <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                            <SelectItem value="Sharjah">Sharjah</SelectItem>
                            <SelectItem value="Ajman">Ajman</SelectItem>
                            <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range */}
                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.priceFrom')}</Label>
                        <Input
                          type="number"
                          value={formData.price_from}
                          onChange={(e) =>
                            setFormData({ ...formData, price_from: e.target.value })
                          }
                          placeholder="e.g., 1500000"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.priceTo')}</Label>
                        <Input
                          type="number"
                          value={formData.price_to}
                          onChange={(e) =>
                            setFormData({ ...formData, price_to: e.target.value })
                          }
                          placeholder="e.g., 5000000"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      {/* Bedrooms */}
                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.bedroomsMin')}</Label>
                        <Input
                          type="number"
                          value={formData.bedrooms_min}
                          onChange={(e) =>
                            setFormData({ ...formData, bedrooms_min: e.target.value })
                          }
                          placeholder="e.g., 1"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.bedroomsMax')}</Label>
                        <Input
                          type="number"
                          value={formData.bedrooms_max}
                          onChange={(e) =>
                            setFormData({ ...formData, bedrooms_max: e.target.value })
                          }
                          placeholder="e.g., 4"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      {/* Handover & Service Charge */}
                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.handoverDate')}</Label>
                        <Input
                          value={formData.handover_date}
                          onChange={(e) =>
                            setFormData({ ...formData, handover_date: e.target.value })
                          }
                          placeholder="e.g., Q4 2026"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-600">{t('listingAdmin.serviceCharge')}</Label>
                        <Input
                          value={formData.service_charge}
                          onChange={(e) =>
                            setFormData({ ...formData, service_charge: e.target.value })
                          }
                          placeholder="e.g., 15 AED/sqft"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      {/* Payment Plan */}
                      <div className="md:col-span-2">
                        <Label className="text-zinc-600">{t('listingAdmin.paymentPlan')}</Label>
                        <Input
                          value={formData.payment_plan}
                          onChange={(e) =>
                            setFormData({ ...formData, payment_plan: e.target.value })
                          }
                          placeholder="e.g., 60/40 or 10/90"
                          className="bg-zinc-50 border-zinc-300 text-black mt-1"
                        />
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <Label className="text-zinc-600">{t('listingAdmin.description')}</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                          }
                          placeholder="Enter project description..."
                          className="bg-zinc-50 border-zinc-300 text-black mt-1 min-h-[120px]"
                        />
                      </div>

                      {/* Premium Listing */}
                      <div className="md:col-span-2 flex items-center justify-between p-4 bg-gradient-to-r from-gold/10 to-transparent border border-gold/20 rounded-lg">
                        <div>
                          <Label className="text-black font-medium flex items-center gap-2">
                            <Crown className="w-4 h-4 text-gold" />
                            {t('listingAdmin.premiumListing')}
                          </Label>
                          <p className="text-zinc-500 text-sm">
                            {t('listingAdmin.premiumDesc')}
                          </p>
                        </div>
                        <Switch
                          checked={formData.is_premium}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_premium: checked })
                          }
                        />
                      </div>

                      {/* Sold Out Toggle */}
                      <div className="md:col-span-2 flex items-center justify-between p-4 bg-gradient-to-r from-destructive/10 to-transparent border border-destructive/20 rounded-lg">
                        <div>
                          <Label className="text-black font-medium flex items-center gap-2">
                            <X className="w-4 h-4 text-destructive" />
                            {t('listingAdmin.soldOut')}
                          </Label>
                          <p className="text-zinc-500 text-sm">
                            {t('listingAdmin.soldOutDesc')}
                          </p>
                        </div>
                        <Switch
                          checked={formData.is_sold_out}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_sold_out: checked })
                          }
                        />
                      </div>
                    </div>

                    {/* Save/Delete Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSaveProject}
                          disabled={isSaving}
                          variant="primary"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t('listingAdmin.saving')}
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {isCreating ? t('listingAdmin.createProject') : t('listingAdmin.saveChanges')}
                            </>
                          )}
                        </Button>
                      </div>
                      {!isCreating && (
                        <Button
                          variant="destructive"
                          onClick={handleDeleteProject}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('listingAdmin.delete')}
                        </Button>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="documents" className="space-y-4">
                    {/* Document Upload */}
                    <div className="flex items-center gap-4">
                      <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                        <SelectTrigger className="w-48 bg-zinc-50 border-zinc-300 text-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="brochure">{t('listingAdmin.brochure')}</SelectItem>
                          <SelectItem value="floor_plan">{t('listingAdmin.floorPlan')}</SelectItem>
                          <SelectItem value="payment_plan">{t('listingAdmin.paymentPlanDoc')}</SelectItem>
                          <SelectItem value="fact_sheet">{t('listingAdmin.factSheet')}</SelectItem>
                          <SelectItem value="other">{t('listingAdmin.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingDocument}
                        variant="secondary"
                      >
                        {isUploadingDocument ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {t('listingAdmin.uploadDocument')}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileUpload}
                      />
                    </div>

                    {/* Document List */}
                    <div className="space-y-2">
                      {projectDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg border border-zinc-200"
                        >
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-zinc-600" />
                            <div>
                              <p className="text-black text-sm font-medium">{doc.file_name}</p>
                              <p className="text-zinc-500 text-xs">
                                {doc.document_type} • {formatFileSize(doc.file_size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(doc.file_url, "_blank")}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {projectDocuments.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>{t('listingAdmin.noDocuments')}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="images" className="space-y-4">
                    {/* Image Upload */}
                    <Button
                      onClick={() => imageInputRef.current?.click()}
                      variant="secondary"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      {t('listingAdmin.uploadImages')}
                    </Button>
                    <input
                      ref={imageInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                    />

                    {/* Image Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {selectedProject?.images?.map((img: any) => (
                        <div
                          key={img.id}
                          className="relative aspect-video rounded-lg overflow-hidden bg-[#EDE4D3] border-2 border-gold/30"
                        >
                          <img
                            src={img.image_url}
                            alt="Project"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                            }}
                          />
                          {img.is_primary && (
                            <Badge className="absolute top-2 left-2 bg-gold text-black">
                              {t('listingAdmin.primary')}
                            </Badge>
                          )}
                        </div>
                      ))}
                      {(!selectedProject?.images || selectedProject.images.length === 0) && (
                        <div className="col-span-full text-center py-12 text-zinc-500">
                          <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>{t('listingAdmin.noImages')}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      </div>
    </div>
  );
};

export default ListingAdmin;
