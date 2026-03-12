import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects, useDevelopers, useCommunities, useProjectsTotalCount } from "@/hooks/useProjects";
import { useAreas } from "@/hooks/useAreas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectDocument {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  document_type: string;
  file_size: number | null;
  created_at: string;
}

export function useAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isOwner, loading, signOut } = useAuth();

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "overview");
  const { data: projects, refetch: refetchProjects } = useProjects();
  const { data: developers } = useDevelopers();
  const { data: communities } = useCommunities();
  const { data: areas } = useAreas();
  const { data: totalProjectsCount } = useProjectsTotalCount();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [propertiesFilter, setPropertiesFilter] = useState<"all" | "premium" | "developers" | "communities" | "areas">("all");

  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("brochure");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      is_premium: project.is_premium || false,
      furnished_status: project.furnished_status || "unfurnished",
      payment_plan: project.payment_plan || "",
      service_charge: project.service_charge || "",
    });
    setIsEditing(true);

    const { data: docs } = await supabase
      .from("project_documents")
      .select("*")
      .eq("project_id", project.id)
      .order("created_at", { ascending: false });

    setProjectDocuments(docs || []);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedProject) return;

    setIsUploadingDocument(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const file of Array.from(files)) {
        try {
          const fileName = `${selectedProject.id}/${Date.now()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from("project-files").upload(fileName, file);
          if (uploadError) { failCount++; continue; }

          const { data: urlData } = supabase.storage.from("project-files").getPublicUrl(fileName);
          const { error: dbError } = await supabase.from("project_documents").insert({
            project_id: selectedProject.id,
            file_name: file.name,
            file_url: urlData.publicUrl,
            document_type: selectedDocType,
            file_size: file.size,
          });
          if (dbError) { failCount++; continue; }
          successCount++;
        } catch { failCount++; }
      }

      const { data: docs } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", selectedProject.id)
        .order("created_at", { ascending: false });
      setProjectDocuments(docs || []);

      if (successCount > 0) toast.success(`${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully`);
      if (failCount > 0) toast.error(`${failCount} document${failCount > 1 ? 's' : ''} failed to upload`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload documents");
    } finally {
      setIsUploadingDocument(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (doc: ProjectDocument) => {
    try {
      const urlParts = doc.file_url.split('/project-files/');
      const filePath = urlParts[1];
      if (filePath) await supabase.storage.from("project-files").remove([filePath]);

      const { error } = await supabase.from("project_documents").delete().eq("id", doc.id);
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
      const { error } = await supabase.from("projects").update({ is_premium: !currentValue }).eq("id", projectId);
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
        is_premium: formData.is_premium,
        furnished_status: formData.furnished_status,
        payment_plan: formData.payment_plan || null,
        service_charge: formData.service_charge || null,
      };

      const { error } = await supabase.from("projects").update(updateData).eq("id", selectedProject.id);
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

  return {
    // Auth
    user, isOwner, loading,
    // Navigation
    navigate,
    // Tab state
    activeTab, setActiveTab,
    // Data
    projects, developers, communities, areas, totalProjectsCount,
    filteredProjects,
    // Search
    searchQuery, setSearchQuery,
    // Project editing
    selectedProject, isEditing, setIsEditing, isSaving,
    formData, setFormData,
    handleEditProject, handleSaveProject, handleToggleFeatured,
    // Documents
    projectDocuments, isUploadingDocument, selectedDocType, setSelectedDocType,
    fileInputRef, handleFileUpload, handleDeleteDocument, formatFileSize,
    // Properties filter
    propertiesFilter, setPropertiesFilter,
    // Command palette
    showCommandPalette, setShowCommandPalette,
    // Actions
    handleSignOut,
    refetchProjects,
  };
}
