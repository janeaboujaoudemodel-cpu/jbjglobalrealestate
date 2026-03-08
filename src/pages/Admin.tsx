import { useEffect, useState, useRef, lazy, Suspense, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects, useDevelopers, useCommunities, useProjectsTotalCount } from "@/hooks/useProjects";
import { useAreas } from "@/hooks/useAreas";
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
  Sparkles,
  Shield,
  ShieldBan,
  Activity,
  Bell,
  Settings,
  Brain,
  Home,
  Ticket,
  UserCog,
  Monitor,
  Heart,
  ExternalLink,
   AlertCircle,
   MapPin,
   Calendar,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { SmartDocumentUploader } from "@/components/SmartDocumentUploader";
import { ClipboardList, Users, Briefcase, Megaphone, Smartphone, LayoutDashboard, Bot, Mic, Send, Handshake, BookOpen } from "lucide-react";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy-load ALL tab content components for fast initial render
const AdminOverviewDashboard = lazy(() => import("@/components/admin/AdminOverviewDashboard").then(m => ({ default: m.AdminOverviewDashboard })));
const AdminAIAssistant = lazy(() => import("@/components/admin/AdminAIAssistant").then(m => ({ default: m.AdminAIAssistant })));
const AIBrokersDashboard = lazy(() => import("@/components/admin/ai-brokers/AIBrokersDashboard").then(m => ({ default: m.AIBrokersDashboard })));
const SecurityDashboardSummary = lazy(() => import("@/components/admin/SecurityDashboardSummary").then(m => ({ default: m.SecurityDashboardSummary })));
const AuditLogDashboard = lazy(() => import("@/components/admin/AuditLogDashboard"));
const BrokerSubscriptionsDashboard = lazy(() => import("@/components/admin/BrokerSubscriptionsDashboard"));
const AIAnalyticsDashboard = lazy(() => import("@/components/admin/AIAnalyticsDashboard"));
const MarketingSettingsDashboard = lazy(() => import("@/components/admin/MarketingSettingsDashboard"));
const PWAAnalyticsDashboard = lazy(() => import("@/components/admin/PWAAnalyticsDashboard"));
const VisitorInsightsDashboard = lazy(() => import("@/components/admin/VisitorInsightsDashboard"));
const RateLimitDashboard = lazy(() => import("@/components/admin/RateLimitDashboard").then(m => ({ default: m.RateLimitDashboard })));
const IPBlocklistDashboard = lazy(() => import("@/components/admin/IPBlocklistDashboard").then(m => ({ default: m.IPBlocklistDashboard })));
const VoiceRecorder = lazy(() => import("@/components/admin/VoiceRecorder"));
const FounderVisibilityToggle = lazy(() => import("@/components/admin/FounderVisibilityToggle").then(m => ({ default: m.FounderVisibilityToggle })));
const PodcastVisibilityToggle = lazy(() => import("@/components/admin/PodcastVisibilityToggle").then(m => ({ default: m.PodcastVisibilityToggle })));
const CompanyProfileDownload = lazy(() => import("@/components/admin/CompanyProfileDownload").then(m => ({ default: m.CompanyProfileDownload })));

// Lazy load embedded department components for performance
const EmbeddedHRDashboard = lazy(() => import("@/components/admin/EmbeddedHRDashboard").then(m => ({ default: m.EmbeddedHRDashboard })));
const EmbeddedITDepartment = lazy(() => import("@/components/admin/EmbeddedITDepartment").then(m => ({ default: m.EmbeddedITDepartment })));
const EmbeddedEmployeeHub = lazy(() => import("@/components/admin/EmbeddedEmployeeHub").then(m => ({ default: m.EmbeddedEmployeeHub })));
const EmbeddedSupportTickets = lazy(() => import("@/components/admin/EmbeddedSupportTickets").then(m => ({ default: m.EmbeddedSupportTickets })));
const EmbeddedInquiryManagementHub = lazy(() => import("@/pages/admin/InquiryManagementHub"));
const EmbeddedCustomerHappinessHub = lazy(() => import("@/components/admin/EmbeddedCustomerHappinessHub").then(m => ({ default: m.EmbeddedCustomerHappinessHub })));
const AdminIntelligence = lazy(() => import("@/pages/admin/AdminIntelligence"));
const PartnershipsDashboardLazy = lazy(() => import("@/components/admin/PartnershipsDashboard").then(m => ({ default: m.PartnershipsDashboard })));
const BookHubDashboardLazy = lazy(() => import("@/components/admin/BookHubDashboard"));

const TabLoadingFallback = () => (
  <div className="space-y-4 p-4">
    <Skeleton className="h-20 w-full" />
    <div className="grid grid-cols-4 gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);

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
  const [searchParams] = useSearchParams();
  const { user, isOwner, loading, signOut } = useAuth();
  
  // Read tab from URL parameter for deep-linking (e.g., /admin?tab=customer-happiness)
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
    is_premium: false,
    furnished_status: "unfurnished",
    payment_plan: "",
    service_charge: "",
  });

  // NOTE: Removed page-level redirect logic.
  // Access is now controlled by OwnerGuard at the route level.
  // If this component renders, OwnerGuard has already verified access.

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
    
    // Fetch documents for this project
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
          
          const { error: uploadError } = await supabase.storage
            .from("project-files")
            .upload(fileName, file);
          
          if (uploadError) { failCount++; continue; }
          
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
          
          if (dbError) { failCount++; continue; }
          successCount++;
        } catch {
          failCount++;
        }
      }
      
      // Refresh documents
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
        .update({ is_premium: !currentValue })
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
        is_premium: formData.is_premium,
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
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      {/* Premium Header */}
       <header className="border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] sticky top-0 z-50 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#B8973F] flex items-center justify-center shadow-lg shadow-gold/20">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-black text-lg font-bold leading-tight">Owner Panel</h1>
              <p className="text-gold text-xs font-medium truncate max-w-[180px]">{user?.email}</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-white/80 border border-gold/30 text-zinc-500 hover:border-gold/50 transition-all"
            >
              <Search className="h-4 w-4 text-gold flex-shrink-0" />
              <span className="text-sm">Search...</span>
              <kbd className="ml-auto px-1.5 py-0.5 bg-gold/10 text-gold text-[10px] rounded font-mono flex-shrink-0">⌘K</kbd>
            </button>
          </div>
          
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            <AdminNotificationBell />
            <Link to="/admin/marketing-hub">
              <Button
                size="sm"
                className="bg-gradient-to-r from-gold to-amber-600 hover:from-gold/90 hover:to-amber-600/90 text-black font-semibold shadow-lg shadow-gold/20"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden xl:inline">Marketing Hub</span>
                <span className="xl:hidden">Marketing</span>
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/")}
            >
              <Home className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden md:inline">View Site</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSignOut}
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="w-full jj-scrollbar-gold-x">
          <TabsList className="w-max min-w-full justify-start bg-white/80 border-2 border-gold/30 p-1">
              <TabsTrigger value="overview" className="tab-trigger-champagne text-black">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="ai-assistant" className="tab-trigger-champagne text-black">
                <Bot className="w-4 h-4 mr-2" />
                Admin Assistant
              </TabsTrigger>
              <TabsTrigger value="security" className="tab-trigger-champagne text-black">
                <Activity className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="properties" className="tab-trigger-champagne text-black">
                <Building2 className="w-4 h-4 mr-2" />
                Properties
              </TabsTrigger>
              <TabsTrigger value="rate-limits" className="tab-trigger-champagne text-black">
                <Shield className="w-4 h-4 mr-2" />
                Rate Limits
              </TabsTrigger>
              <TabsTrigger value="ip-blocklist" className="tab-trigger-champagne text-black">
                <ShieldBan className="w-4 h-4 mr-2" />
                IP Blocklist
              </TabsTrigger>
              <TabsTrigger value="audit-logs" className="tab-trigger-champagne text-black">
                <ClipboardList className="w-4 h-4 mr-2" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger value="brokers" className="tab-trigger-champagne text-black">
                <Briefcase className="w-4 h-4 mr-2" />
                Brokers
              </TabsTrigger>
              <TabsTrigger value="ai-analytics" className="tab-trigger-champagne text-black">
                <Brain className="w-4 h-4 mr-2" />
                AI Analytics
              </TabsTrigger>
              <TabsTrigger value="marketing" className="tab-trigger-champagne text-black">
                <Megaphone className="w-4 h-4 mr-2" />
                Marketing
              </TabsTrigger>
              <TabsTrigger value="pwa-analytics" className="tab-trigger-champagne text-black">
                <Smartphone className="w-4 h-4 mr-2" />
                PWA Analytics
              </TabsTrigger>
              <TabsTrigger value="visitor-insights" className="tab-trigger-champagne text-black">
                <Activity className="w-4 h-4 mr-2" />
                Visitors
              </TabsTrigger>
              <TabsTrigger value="hr-hub" className="tab-trigger-champagne text-black">
                <UserCog className="w-4 h-4 mr-2" />
                HR Hub
              </TabsTrigger>
              <TabsTrigger value="it-department" className="tab-trigger-champagne text-black">
                <Monitor className="w-4 h-4 mr-2" />
                IT Department
              </TabsTrigger>
              <TabsTrigger value="employee-hub" className="tab-trigger-champagne text-black">
                <Briefcase className="w-4 h-4 mr-2" />
                Employee Hub
              </TabsTrigger>
              <TabsTrigger value="inquiries-hub" className="tab-trigger-champagne text-black">
                <Ticket className="w-4 h-4 mr-2" />
                Inquiries Hub
              </TabsTrigger>
              <TabsTrigger value="auth-test" className="tab-trigger-champagne text-black">
                <Shield className="w-4 h-4 mr-2" />
                Authentication Test
              </TabsTrigger>
              <TabsTrigger value="customer-happiness" className="tab-trigger-champagne text-black">
                <Heart className="w-4 h-4 mr-2" />
                Customer Happiness Hub
              </TabsTrigger>
              <TabsTrigger value="podcast-studio" className="tab-trigger-champagne text-black">
                <Mic className="w-4 h-4 mr-2" />
                Podcast Studio
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="tab-trigger-champagne text-black">
                <Brain className="w-4 h-4 mr-2" />
                User Intelligence
              </TabsTrigger>
              <TabsTrigger value="founder" className="tab-trigger-champagne text-black">
                <Crown className="w-4 h-4 mr-2" />
                Founder
              </TabsTrigger>
              <TabsTrigger value="partnerships" className="tab-trigger-champagne text-black">
                <Handshake className="w-4 h-4 mr-2" />
                Partnerships
              </TabsTrigger>
              <TabsTrigger value="book-hub" className="tab-trigger-champagne text-black">
                <BookOpen className="w-4 h-4 mr-2" />
                Book Hub
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <AdminOverviewDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="ai-assistant" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="space-y-6">
                <AdminAIAssistant />
                <AIBrokersDashboard />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="security" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <SecurityDashboardSummary />
            </Suspense>
          </TabsContent>

          <TabsContent value="audit-logs" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <AuditLogDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="brokers" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <BrokerSubscriptionsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="ai-analytics" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <AIAnalyticsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="marketing" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <MarketingSettingsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="pwa-analytics" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <PWAAnalyticsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="visitor-insights" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <VisitorInsightsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="hr-hub" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <EmbeddedHRDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="it-department" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <EmbeddedITDepartment />
            </Suspense>
          </TabsContent>

          <TabsContent value="employee-hub" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <EmbeddedEmployeeHub />
            </Suspense>
          </TabsContent>

          <TabsContent value="inquiries-hub" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <EmbeddedInquiryManagementHub />
            </Suspense>
          </TabsContent>

          <TabsContent value="auth-test" className="space-y-8">
            <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardHeader>
                <CardTitle className="text-black">Authentication Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-black/70">
                  Open the account reactivation test flow and verify the "We Found Your Account" popup behavior.
                  This opens in a new tab to prevent the overlay from freezing this panel.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => window.open('/auth?test_reactivation=1', '_blank')} className="bg-gold text-black hover:bg-gold/90">
                    Open Reactivation Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer-happiness" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <EmbeddedCustomerHappinessHub />
            </Suspense>
          </TabsContent>

          <TabsContent value="podcast-studio" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="max-w-3xl mx-auto">
                <VoiceRecorder />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <AdminIntelligence embedded />
            </Suspense>
          </TabsContent>

          <TabsContent value="founder" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FounderVisibilityToggle />
                <PodcastVisibilityToggle />
                <CompanyProfileDownload />
              </div>
            </Suspense>
          </TabsContent>

          <TabsContent value="partnerships" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <PartnershipsDashboardLazy />
            </Suspense>
          </TabsContent>

          <TabsContent value="book-hub" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <BookHubDashboardLazy />
            </Suspense>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            {/* Stats - Premium Cards - Clickable filters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: "all" as const, label: "Total Projects", value: totalProjectsCount ?? projects?.length ?? 0, icon: <Building2 className="w-5 h-5 text-gold" /> },
                { key: "premium" as const, label: "Premium", value: projects?.filter((p) => p.is_premium).length || 0, icon: <Crown className="w-5 h-5 text-gold" /> },
                { key: "developers" as const, label: "Developers", value: developers?.length || 0, icon: <Briefcase className="w-5 h-5 text-gold" /> },
                { key: "communities" as const, label: "Communities", value: communities?.length || 0, icon: <Users className="w-5 h-5 text-gold" /> },
                { key: "areas" as const, label: "Areas", value: areas?.length || 0, icon: <MapPin className="w-5 h-5 text-gold" /> },
              ].map((stat) => (
                <Card
                  key={stat.key}
                  className={`bg-white border-2 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                    propertiesFilter === stat.key ? "border-gold ring-2 ring-gold/20" : "border-gold/20 hover:border-gold/40"
                  }`}
                  onClick={() => setPropertiesFilter(stat.key)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                        {stat.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-2xl font-bold text-black leading-tight">{stat.value}</p>
                        <p className="text-xs text-zinc-500 truncate">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>




            {/* Filtered Content based on card selection */}
            {propertiesFilter === "developers" ? (
              <Card className="bg-white border-2 border-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-black">All Developers ({developers?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {developers?.map((dev) => (
                        <div key={dev.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-gold/20 hover:border-gold/40 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {dev.logo_url ? <img src={dev.logo_url} alt={dev.name} className="w-full h-full object-contain" /> : <Building2 className="w-5 h-5 text-gold" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-black truncate">{dev.name}</p>
                              <p className="text-xs text-zinc-400">{dev.slug}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/developers/${dev.slug}`, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : propertiesFilter === "communities" ? (
              <Card className="bg-white border-2 border-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-black">All Communities ({communities?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {communities?.map((comm) => (
                        <div key={comm.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-gold/20 hover:border-gold/40 transition-all">
                          <div className="min-w-0">
                            <p className="font-semibold text-black truncate">{comm.name}</p>
                            <p className="text-xs text-zinc-400">{comm.slug}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => window.open(`/communities/${comm.slug}`, '_blank')}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : propertiesFilter === "areas" ? (
              <Card className="bg-white border-2 border-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-black">All Areas ({areas?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-2">
                      {areas?.map((area) => (
                        <div key={area.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-gold/20 hover:border-gold/40 transition-all">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {area.image_url ? <img src={area.image_url} alt={area.name} className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-gold" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-black truncate">{area.name}</p>
                              <p className="text-xs text-zinc-400">{area.emirate} · {area.property_count || 0} projects</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {area.is_trending && <Badge className="bg-gold/10 text-gold border-gold/30 text-[10px]">Trending</Badge>}
                            <Button variant="ghost" size="sm" onClick={() => window.open(`/areas/${area.slug}`, '_blank')}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <>
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
                <Card className="bg-white border-2 border-gold/20 shadow-lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-black">
                        {propertiesFilter === "premium" ? "Premium Projects" : "All Projects"}
                      </CardTitle>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold" />
                        <Input
                          placeholder="Search projects..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 bg-white border border-gold/30 text-black placeholder:text-zinc-400"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {(propertiesFilter === "premium"
                          ? filteredProjects?.filter(p => p.is_premium)
                          : filteredProjects
                        )?.map((project) => {
                          const coverImg = project.cover_image_url
                            || (project.images?.[0] ? (typeof project.images[0] === 'string' ? project.images[0] : project.images[0]?.image_url) : null);
                          const isIncomplete = !coverImg || !project.description;
                          const subtitleParts = [
                            project.developer?.name,
                            project.location || project.area_name,
                          ].filter(Boolean);
                          const priceDisplay = project.price_from
                            ? `AED ${Math.round(project.price_from).toLocaleString()}`
                            : null;

                          return (
                            <div
                              key={project.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-white border border-gold/20 hover:border-gold/40 transition-all"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-14 h-14 rounded-lg bg-gold/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {coverImg ? (
                                    <img src={coverImg} alt={project.name} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                                  ) : (
                                    <Building2 className="w-5 h-5 text-gold" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-black text-sm truncate">{project.name}</h3>
                                    {isIncomplete && (
                                      <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1 py-0 flex-shrink-0">
                                        <AlertCircle className="w-3 h-3 mr-0.5" />
                                        Incomplete
                                      </Badge>
                                    )}
                                    {project.is_premium && (
                                      <Badge className="bg-gold/10 text-gold border-gold/30 text-[10px] px-1 py-0 flex-shrink-0">
                                        <Crown className="w-3 h-3" />
                                      </Badge>
                                    )}
                                  </div>
                                  {subtitleParts.length > 0 && (
                                    <p className="text-xs text-zinc-500 truncate">{subtitleParts.join(' — ')}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                                    {priceDisplay && <span>{priceDisplay}</span>}
                                    {project.updated_at && (
                                      <span className="flex items-center gap-0.5">
                                        <Calendar className="w-3 h-3" />
                                        Updated {new Date(project.updated_at).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-gold" onClick={() => window.open(`/project/${project.slug}`, '_blank')} title="Preview">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-gold" onClick={() => handleEditProject(project)} title="Edit & Upload Docs">
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-400 hover:text-gold"
                                  onClick={() => handleToggleFeatured(project.id, project.is_premium)}
                                  title={project.is_premium ? "Remove Premium" : "Make Premium"}
                                >
                                  <Crown className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="rate-limits" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <RateLimitDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="ip-blocklist" className="space-y-8">
            <Suspense fallback={<TabLoadingFallback />}>
              <IPBlocklistDashboard />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Bar */}
      <FloatingActionBar />

      {/* Edit Project Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-2 border-gold/30">
          <DialogHeader>
            <DialogTitle className="text-black">Edit Project: {selectedProject?.name}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label className="text-black">Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white border-gold/30 text-black"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-black">Slug</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="bg-white border-gold/30 text-black"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-black">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white border-gold/30 text-black"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-black">Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-white border-gold/30 text-black"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-black">Emirate</Label>
              <Select
                value={formData.emirate}
                onValueChange={(value) => setFormData({ ...formData, emirate: value })}
              >
                <SelectTrigger className="bg-white border-gold/30 text-black">
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
            <div className="space-y-2">
              <Label className="text-black">Price From (AED)</Label>
              <Input
                type="number"
                value={formData.price_from}
                onChange={(e) => setFormData({ ...formData, price_from: e.target.value })}
                className="bg-white border-gold/30 text-black"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-black">Price To (AED)</Label>
              <Input
                type="number"
                value={formData.price_to}
                onChange={(e) => setFormData({ ...formData, price_to: e.target.value })}
                className="bg-white border-gold/30 text-black"
              />
            </div>
            <div className="col-span-2 flex items-center justify-between bg-gold/5 p-4 rounded-xl border border-gold/20">
              <div>
                <Label className="text-black font-semibold">Premium Property</Label>
                <p className="text-sm text-zinc-500">Mark as featured/premium listing</p>
              </div>
              <Switch
                checked={formData.is_premium}
                onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
              />
            </div>
          </div>

          {/* Documents Section */}
          <div className="mt-6 pt-6 border-t border-gold/20">
            <h3 className="font-semibold text-black mb-4">Project Documents</h3>
            <div className="flex items-center gap-3 mb-4">
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger className="w-40 bg-white border-gold/30 text-black">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brochure">Brochure</SelectItem>
                  <SelectItem value="floor_plan">Floor Plan</SelectItem>
                  <SelectItem value="payment_plan">Payment Plan</SelectItem>
                  <SelectItem value="factsheet">Factsheet</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                multiple
              />
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingDocument}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingDocument ? "Uploading..." : "Upload"}
              </Button>
            </div>

            {projectDocuments.length > 0 ? (
              <div className="space-y-2">
                {projectDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FDFBF7] to-white rounded-lg border border-gold/20"
                  >
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-sm text-black font-medium">{doc.file_name}</p>
                        <p className="text-xs text-zinc-500">
                          {doc.document_type} • {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.file_url, "_blank")}
                        className="text-gold hover:text-black hover:bg-gold/10"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-500 text-sm">No documents uploaded yet.</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveProject} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
