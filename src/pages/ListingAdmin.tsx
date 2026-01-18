import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useListingAdmin } from "@/hooks/useListingAdmin";
import { useProjects, useDevelopers, useCommunities } from "@/hooks/useProjects";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  Edit2,
  Crown,
  Building2,
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  File,
  X,
  Home,
  Image,
  ArrowLeft,
  FolderOpen,
  ExternalLink,
  BookOpen,
} from "lucide-react";

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
  const { user, signOut, isAdmin } = useAuth();
  const { isListingAdmin, adminData, isLoading: checkingAdmin } = useListingAdmin();
  const { data: projects, refetch: refetchProjects } = useProjects();
  const { data: developers } = useDevelopers();
  const { data: communities } = useCommunities();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterDeveloper, setFilterDeveloper] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    furnished_status: "unfurnished",
    payment_plan: "",
    service_charge: "",
  });

  useEffect(() => {
    if (!checkingAdmin && !user) {
      navigate("/auth?redirect=/listing-admin");
    }
  }, [user, checkingAdmin, navigate]);

  // Allow access if user is listing admin OR full admin
  const hasAccess = isListingAdmin || isAdmin;

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Card className="bg-zinc-900 border-zinc-800 max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-zinc-400 mb-6">
              You don't have permission to access the Listing Admin panel. 
              Please contact your administrator to request access.
            </p>
            <Button onClick={() => navigate("/")} variant="primary">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredProjects = projects?.filter((project) => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.developer?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDeveloper = filterDeveloper === "all" || project.developer?.id === filterDeveloper;
    return matchesSearch && matchesDeveloper;
  });

  const handleEditProject = async (project: any) => {
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

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-white text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Listing Admin
              </h1>
              <p className="text-zinc-500 text-sm">
                Welcome, {adminData?.display_name || user?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/training-guide")}
              className="border-gold/50 text-gold hover:bg-gold/10"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Training Guide
            </Button>
            <Badge className="bg-gold/20 text-gold border-gold/30">
              <Building2 className="w-3 h-3 mr-1" />
              Property Manager
            </Badge>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Project List */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-gold" />
                    <span className="text-zinc-400 text-sm">Projects</span>
                  </div>
                  <p className="text-white text-2xl font-bold">{projects?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="w-4 h-4 text-gold" />
                    <span className="text-zinc-400 text-sm">Premium</span>
                  </div>
                  <p className="text-white text-2xl font-bold">
                    {projects?.filter((p) => p.is_premium).length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actions */}
            <Button
              onClick={handleCreateNew}
              variant="primary"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Project
            </Button>

            {/* Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
              <Select value={filterDeveloper} onValueChange={setFilterDeveloper}>
                <SelectTrigger className="bg-zinc-900 border-zinc-700 text-white">
                  <SelectValue placeholder="Filter by Developer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Developers</SelectItem>
                  {developers?.map((dev) => (
                    <SelectItem key={dev.id} value={dev.id}>
                      {dev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project List */}
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-2 pr-4">
                {filteredProjects?.map((project) => (
                  <Card
                    key={project.id}
                    className={`bg-zinc-900 border cursor-pointer transition-all hover:border-gold/50 ${
                      selectedProject?.id === project.id
                        ? "border-gold"
                        : "border-zinc-800"
                    }`}
                    onClick={() => handleEditProject(project)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-white font-medium truncate text-sm">
                            {project.name}
                          </h3>
                          <p className="text-zinc-500 text-xs truncate">
                            {project.developer?.name || "No Developer"}
                          </p>
                        </div>
                        {project.is_premium && (
                          <Crown className="w-4 h-4 text-gold flex-shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Editor */}
          <div className="lg:col-span-2">
            {(isEditing || isCreating) ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">
                      {isCreating ? "Create New Project" : `Edit: ${selectedProject?.name}`}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {!isCreating && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`/project/${selectedProject?.slug}`, "_blank")}
                          className="text-zinc-400 hover:text-white"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          setIsCreating(false);
                          setSelectedProject(null);
                        }}
                        className="text-zinc-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Tabs defaultValue="details" className="space-y-6">
                    <TabsList className="bg-zinc-800 border border-zinc-700">
                      <TabsTrigger value="details" className="data-[state=active]:bg-gold data-[state=active]:text-black">
                        Details
                      </TabsTrigger>
                      <TabsTrigger 
                        value="documents" 
                        className="data-[state=active]:bg-gold data-[state=active]:text-black"
                        disabled={isCreating}
                      >
                        Documents
                      </TabsTrigger>
                      <TabsTrigger 
                        value="images" 
                        className="data-[state=active]:bg-gold data-[state=active]:text-black"
                        disabled={isCreating}
                      >
                        Images
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="md:col-span-2">
                          <Label className="text-zinc-400">Project Name *</Label>
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
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        {/* Developer */}
                        <div>
                          <Label className="text-zinc-400">Developer *</Label>
                          <Select
                            value={formData.developer_id}
                            onValueChange={(value) =>
                              setFormData({ ...formData, developer_id: value })
                            }
                          >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                              <SelectValue placeholder="Select Developer" />
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
                          <Label className="text-zinc-400">Community</Label>
                          <Select
                            value={formData.community_id}
                            onValueChange={(value) =>
                              setFormData({ ...formData, community_id: value })
                            }
                          >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
                              <SelectValue placeholder="Select Community" />
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
                          <Label className="text-zinc-400">Location</Label>
                          <Input
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({ ...formData, location: e.target.value })
                            }
                            placeholder="e.g., MBR City, Dubai"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        {/* Emirate */}
                        <div>
                          <Label className="text-zinc-400">Emirate</Label>
                          <Select
                            value={formData.emirate}
                            onValueChange={(value) =>
                              setFormData({ ...formData, emirate: value })
                            }
                          >
                            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white mt-1">
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
                          <Label className="text-zinc-400">Price From (AED)</Label>
                          <Input
                            type="number"
                            value={formData.price_from}
                            onChange={(e) =>
                              setFormData({ ...formData, price_from: e.target.value })
                            }
                            placeholder="e.g., 1500000"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-zinc-400">Price To (AED)</Label>
                          <Input
                            type="number"
                            value={formData.price_to}
                            onChange={(e) =>
                              setFormData({ ...formData, price_to: e.target.value })
                            }
                            placeholder="e.g., 5000000"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        {/* Bedrooms */}
                        <div>
                          <Label className="text-zinc-400">Bedrooms Min</Label>
                          <Input
                            type="number"
                            value={formData.bedrooms_min}
                            onChange={(e) =>
                              setFormData({ ...formData, bedrooms_min: e.target.value })
                            }
                            placeholder="e.g., 1"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-zinc-400">Bedrooms Max</Label>
                          <Input
                            type="number"
                            value={formData.bedrooms_max}
                            onChange={(e) =>
                              setFormData({ ...formData, bedrooms_max: e.target.value })
                            }
                            placeholder="e.g., 4"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        {/* Handover & Service Charge */}
                        <div>
                          <Label className="text-zinc-400">Handover Date</Label>
                          <Input
                            value={formData.handover_date}
                            onChange={(e) =>
                              setFormData({ ...formData, handover_date: e.target.value })
                            }
                            placeholder="e.g., Q4 2026"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-zinc-400">Service Charge</Label>
                          <Input
                            value={formData.service_charge}
                            onChange={(e) =>
                              setFormData({ ...formData, service_charge: e.target.value })
                            }
                            placeholder="e.g., 15 AED/sqft"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        {/* Payment Plan */}
                        <div className="md:col-span-2">
                          <Label className="text-zinc-400">Payment Plan</Label>
                          <Input
                            value={formData.payment_plan}
                            onChange={(e) =>
                              setFormData({ ...formData, payment_plan: e.target.value })
                            }
                            placeholder="e.g., 60/40 or 10/90"
                            className="bg-zinc-800 border-zinc-700 text-white mt-1"
                          />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                          <Label className="text-zinc-400">Description</Label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Enter project description..."
                            className="bg-zinc-800 border-zinc-700 text-white mt-1 min-h-[120px]"
                          />
                        </div>

                        {/* Premium Listing */}
                        <div className="md:col-span-2 flex items-center justify-between p-4 bg-gradient-to-r from-gold/10 to-transparent border border-gold/20 rounded-lg">
                          <div>
                            <Label className="text-white font-medium flex items-center gap-2">
                              <Crown className="w-4 h-4 text-gold" />
                              Premium Listing
                            </Label>
                            <p className="text-zinc-500 text-sm">
                              Premium properties appear with special badge in search & listings
                            </p>
                          </div>
                          <Switch
                            checked={formData.is_premium}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, is_premium: checked })
                            }
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                        {!isCreating && (
                          <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                            className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/30"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Project
                          </Button>
                        )}
                        <div className="flex gap-3 ml-auto">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              setIsCreating(false);
                              setSelectedProject(null);
                            }}
                            className="border-zinc-700 text-zinc-400"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveProject}
                            disabled={isSaving}
                            variant="primary"
                          >
                            {isSaving ? "Saving..." : isCreating ? "Create Project" : "Save Changes"}
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
                        <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                          <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="brochure">Brochure</SelectItem>
                            <SelectItem value="floorplan">Floor Plan</SelectItem>
                            <SelectItem value="factsheet">Fact Sheet</SelectItem>
                            <SelectItem value="payment_plan">Payment Plan</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingDocument}
                          variant="primary"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploadingDocument ? "Uploading..." : "Upload Document"}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          onChange={handleFileUpload}
                        />
                      </div>

                      <div className="space-y-2">
                        {projectDocuments.length === 0 ? (
                          <div className="text-center py-12 text-zinc-500">
                            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No documents uploaded yet</p>
                          </div>
                        ) : (
                          projectDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <File className="w-5 h-5 text-gold" />
                                <div>
                                  <p className="text-white text-sm">{doc.file_name}</p>
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
                                  className="text-zinc-400 hover:text-white"
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="images" className="space-y-4">
                      <div className="p-4 bg-zinc-800/50 rounded-lg">
                        <Button
                          onClick={() => imageInputRef.current?.click()}
                          variant="primary"
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Upload Images
                        </Button>
                        <input
                          ref={imageInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                        />
                        <p className="text-zinc-500 text-sm mt-2">
                          You can select multiple images at once
                        </p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedProject?.images?.map((img: any) => (
                          <div
                            key={img.id}
                            className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800"
                          >
                            <img
                              src={img.image_url}
                              alt="Project"
                              className="w-full h-full object-cover"
                            />
                            {img.is_primary && (
                              <Badge className="absolute top-2 left-2 bg-gold text-black">
                                Primary
                              </Badge>
                            )}
                          </div>
                        ))}
                        {(!selectedProject?.images || selectedProject.images.length === 0) && (
                          <div className="col-span-full text-center py-12 text-zinc-500">
                            <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No images uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-gold" />
                  </div>
                  <h2 className="text-white text-xl font-semibold mb-2">
                    Select a Project to Edit
                  </h2>
                  <p className="text-zinc-400 mb-6">
                    Choose a project from the list on the left, or create a new one
                  </p>
                  <Button
                    onClick={handleCreateNew}
                    variant="primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Project
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ListingAdmin;
