import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects, useDevelopers, useCommunities } from "@/hooks/useProjects";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Star,
  Building2,
  FileText,
  Upload,
  Search,
  Trash2,
  Download,
  File,
  X,
  Sparkles,
  Shield,
  ShieldBan,
  Activity,
} from "lucide-react";
import { SmartDocumentUploader } from "@/components/SmartDocumentUploader";
import { RateLimitDashboard } from "@/components/admin/RateLimitDashboard";
import { IPBlocklistDashboard } from "@/components/admin/IPBlocklistDashboard";
import { SecurityDashboardSummary } from "@/components/admin/SecurityDashboardSummary";

interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  file_size: number | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();
  const { data: projects, refetch: refetchProjects } = useProjects();
  const { data: developers } = useDevelopers();
  const { data: communities } = useCommunities();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Document upload state
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("brochure");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    is_featured: false,
    furnished_status: "unfurnished",
    payment_plan: "",
    service_charge: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      toast.error("You don't have admin access");
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  const filteredProjects = projects?.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.developer?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      is_featured: project.is_featured || false,
      furnished_status: project.furnished_status || "unfurnished",
      payment_plan: project.payment_plan || "",
      service_charge: project.service_charge || "",
    });
    setIsEditing(true);
    
    // Fetch documents for this project
    const { data: docs } = await supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });
    
    setProjectDocuments(docs || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) return;
    
    setIsUploadingDocument(true);
    
    try {
      const fileExt = file.name.split('.').pop();
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

  const handleDeleteDocument = async (doc: ProjectDocument) => {
    try {
      // Extract path from URL
      const urlParts = doc.file_url.split('/project-files/');
      const filePath = urlParts[1];
      
      if (filePath) {
        await supabase.storage.from("project-files").remove([filePath]);
      }
      
      const { error } = await supabase
        .from("project_documents")
        .delete()
        .eq("id", doc.id);
      
      if (error) throw error;
      
      setProjectDocuments(prev => prev.filter(d => d.id !== doc.id));
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

  const handleToggleFeatured = async (projectId: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_featured: !currentValue })
        .eq("id", projectId);

      if (error) throw error;

      toast.success(`Project ${!currentValue ? "marked as" : "removed from"} premium`);
      refetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to update project");
    }
  };

  const handleSaveProject = async () => {
    if (!selectedProject) return;

    setIsSaving(true);
    try {
      const updateData = {
        name: formData.name,
        slug: formData.slug,
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
        is_featured: formData.is_featured,
        furnished_status: formData.furnished_status,
        payment_plan: formData.payment_plan || null,
        service_charge: formData.service_charge || null,
      };

      const { error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", selectedProject.id);

      if (error) throw error;

      toast.success("Project updated successfully");
      setIsEditing(false);
      setSelectedProject(null);
      refetchProjects();
    } catch (error: any) {
      toast.error(error.message || "Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1
              className="text-white text-2xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Admin Panel
            </h1>
            <span className="px-3 py-1 bg-gold/20 text-gold text-sm rounded-full">
              {user?.email}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white"
            >
              View Site
            </Button>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="security" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <Activity className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="properties" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <Building2 className="w-4 h-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="rate-limits" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <Shield className="w-4 h-4 mr-2" />
              Rate Limits
            </TabsTrigger>
            <TabsTrigger value="ip-blocklist" className="data-[state=active]:bg-gold data-[state=active]:text-black">
              <ShieldBan className="w-4 h-4 mr-2" />
              IP Blocklist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-8">
            <SecurityDashboardSummary />
          </TabsContent>

          <TabsContent value="properties" className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-gold" />
                  <span className="text-gray-400">Total Projects</span>
                </div>
                <p className="text-white text-3xl font-bold">{projects?.length || 0}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-5 h-5 text-gold" />
                  <span className="text-gray-400">Premium Properties</span>
                </div>
                <p className="text-white text-3xl font-bold">
                  {projects?.filter((p) => p.is_featured).length || 0}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="w-5 h-5 text-gold" />
                  <span className="text-gray-400">Developers</span>
                </div>
                <p className="text-white text-3xl font-bold">{developers?.length || 0}</p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-gold" />
                  <span className="text-gray-400">Communities</span>
                </div>
                <p className="text-white text-3xl font-bold">{communities?.length || 0}</p>
              </div>
            </div>

            {/* Smart Document Uploader */}
            <SmartDocumentUploader 
              projects={projects?.map(p => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                developer: p.developer ? {
                  id: p.developer.id,
                  name: p.developer.name,
                  slug: p.developer.slug
                } : null
              }))}
              onUploadComplete={() => refetchProjects()}
            />

            {/* Projects Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2
                  className="text-white text-xl font-semibold"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Property Listings
                </h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64 bg-zinc-950 border-zinc-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <table className="w-full">
                  <thead className="bg-zinc-950 sticky top-0">
                    <tr>
                      <th className="text-left text-gray-400 font-medium px-6 py-4">Project</th>
                      <th className="text-left text-gray-400 font-medium px-6 py-4">Developer</th>
                      <th className="text-left text-gray-400 font-medium px-6 py-4">Price</th>
                      <th className="text-left text-gray-400 font-medium px-6 py-4">Handover</th>
                      <th className="text-center text-gray-400 font-medium px-6 py-4">Premium</th>
                      <th className="text-right text-gray-400 font-medium px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects?.map((project) => (
                      <tr
                        key={project.id}
                        className="border-t border-zinc-800 hover:bg-zinc-950/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                project.images?.[0]?.image_url ||
                                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=100"
                              }
                              alt={project.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div>
                              <p className="text-white font-medium">{project.name}</p>
                              <p className="text-gray-500 text-sm">{project.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {project.developer?.name || "—"}
                        </td>
                        <td className="px-6 py-4 text-gold">
                          {project.price_from
                            ? `AED ${(project.price_from / 1000000).toFixed(1)}M`
                            : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {project.handover_date || "—"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleFeatured(project.id, project.is_featured || false)}
                            className="inline-flex items-center justify-center"
                          >
                            <Star
                              className={`w-5 h-5 transition-colors ${
                                project.is_featured
                                  ? "fill-gold text-gold"
                                  : "text-gray-600 hover:text-gray-400"
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditProject(project)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="rate-limits">
            <RateLimitDashboard />
          </TabsContent>

          <TabsContent value="ip-blocklist">
            <IPBlocklistDashboard />
          </TabsContent>
        </Tabs>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "Poppins, sans-serif" }}>
              Edit Property
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Project Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-zinc-950 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="bg-zinc-950 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-zinc-950 border-zinc-700 text-white min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-zinc-950 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Emirate</Label>
                <Select
                  value={formData.emirate}
                  onValueChange={(value) => setFormData({ ...formData, emirate: value })}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    {["Dubai", "Abu Dhabi", "Sharjah", "Ras Al Khaimah", "Ajman", "Fujairah", "Umm Al Quwain"].map((e) => (
                      <SelectItem key={e} value={e} className="text-white hover:bg-zinc-800">
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Price From (AED)</Label>
                <Input
                  type="number"
                  value={formData.price_from}
                  onChange={(e) => setFormData({ ...formData, price_from: e.target.value })}
                  className="bg-zinc-950 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Price To (AED)</Label>
                <Input
                  type="number"
                  value={formData.price_to}
                  onChange={(e) => setFormData({ ...formData, price_to: e.target.value })}
                  className="bg-zinc-950 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Bedrooms Min</Label>
                <Input
                  type="number"
                  value={formData.bedrooms_min}
                  onChange={(e) => setFormData({ ...formData, bedrooms_min: e.target.value })}
                  className="bg-zinc-950 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Bedrooms Max</Label>
                <Input
                  type="number"
                  value={formData.bedrooms_max}
                  onChange={(e) => setFormData({ ...formData, bedrooms_max: e.target.value })}
                  className="bg-zinc-950 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Developer</Label>
                <Select
                  value={formData.developer_id}
                  onValueChange={(value) => setFormData({ ...formData, developer_id: value })}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                    <SelectValue placeholder="Select developer" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                    {developers?.map((dev) => (
                      <SelectItem key={dev.id} value={dev.id} className="text-white hover:bg-zinc-800">
                        {dev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Community</Label>
                <Select
                  value={formData.community_id}
                  onValueChange={(value) => setFormData({ ...formData, community_id: value })}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                    <SelectValue placeholder="Select community" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                    {communities?.map((comm) => (
                      <SelectItem key={comm.id} value={comm.id} className="text-white hover:bg-zinc-800">
                        {comm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Handover Date</Label>
                <Input
                  value={formData.handover_date}
                  onChange={(e) => setFormData({ ...formData, handover_date: e.target.value })}
                  placeholder="e.g., Q4 2026"
                  className="bg-zinc-950 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Furnished Status</Label>
                <Select
                  value={formData.furnished_status}
                  onValueChange={(value) => setFormData({ ...formData, furnished_status: value })}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="unfurnished" className="text-white hover:bg-zinc-800">
                      Unfurnished
                    </SelectItem>
                    <SelectItem value="semi-furnished" className="text-white hover:bg-zinc-800">
                      Semi-Furnished
                    </SelectItem>
                    <SelectItem value="furnished" className="text-white hover:bg-zinc-800">
                      Furnished
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl">
              <div>
                <Label className="text-white font-medium">Premium Property</Label>
                <p className="text-gray-500 text-sm">
                  Mark as exclusive residence (Penthouse, Villa, Mansion)
                </p>
              </div>
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
            </div>

            {/* Document Upload Section */}
            <div className="space-y-4 border-t border-zinc-800 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium text-lg">Documents</Label>
                  <p className="text-gray-500 text-sm">Upload brochures, floor plans, and payment plans</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Select
                  value={selectedDocType}
                  onValueChange={setSelectedDocType}
                >
                  <SelectTrigger className="w-40 bg-zinc-950 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="brochure" className="text-white hover:bg-zinc-800">
                      Brochure
                    </SelectItem>
                    <SelectItem value="floor_plan" className="text-white hover:bg-zinc-800">
                      Floor Plan
                    </SelectItem>
                    <SelectItem value="payment_plan" className="text-white hover:bg-zinc-800">
                      Payment Plan
                    </SelectItem>
                    <SelectItem value="renders" className="text-white hover:bg-zinc-800">
                      Renders
                    </SelectItem>
                    <SelectItem value="other" className="text-white hover:bg-zinc-800">
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingDocument}
                  className="bg-gradient-to-r from-gold to-gold-dark hover:opacity-90 text-black"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploadingDocument ? "Uploading..." : "Upload Document"}
                </Button>
              </div>

              {projectDocuments.length > 0 ? (
                <div className="space-y-2">
                  {projectDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
                          <File className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{doc.file_name}</p>
                          <p className="text-gray-500 text-xs">
                            {doc.document_type.replace('_', ' ')} • {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No documents uploaded yet</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="bg-gradient-to-r from-gold to-gold-dark text-black"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
