import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Users, FileText, Plus, Upload, Download, LogOut, Shuffle, LayoutGrid, List, Zap, Briefcase, PanelLeftOpen, PanelLeftClose, Crown, Flag, Sparkles, CheckSquare, Calendar
} from "lucide-react";
// Logo import removed - CRM uses clean minimal header
import CRMLeadsTableV2 from "@/components/crm/CRMLeadsTableV2";
import CRMEnhancedDashboard from "@/components/crm/CRMEnhancedDashboard";
import CRMImportModalV3 from "@/components/crm/CRMImportModalV3";
import DeleteImportButton from "@/components/crm/DeleteImportButton";
import CRMLeadModal from "@/components/crm/CRMLeadModal";
import LeadQuickFilters from "@/components/crm/LeadQuickFilters";
import LeadSourceFilter from "@/components/crm/LeadSourceFilter";
import BulkAssignModal from "@/components/crm/BulkAssignModal";
import SmartReminders from "@/components/crm/SmartReminders";
import KanbanPipeline from "@/components/crm/KanbanPipeline";
import ActivityTimeline from "@/components/crm/ActivityTimeline";
import DealValueTracker from "@/components/crm/DealValueTracker";
import AutomationRules from "@/components/crm/AutomationRules";
import EmployeeCenter from "@/components/crm/EmployeeCenter";
import EmployeesHub from "@/components/crm/EmployeesHub";
import CRMToolsSidebar from "@/components/crm/CRMToolsSidebar";
import { AdminTasksPanel } from "@/components/crm/AdminTasksPanel";
import FlaggedLeadsView from "@/components/crm/FlaggedLeadsView";
import VIPExportButton from "@/components/crm/VIPExportButton";
import CRMAssistantPanel from "@/components/crm/CRMAssistantPanel";
import CRMCommunicationPanel from "@/components/crm/CRMCommunicationPanel";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { useForcePasswordChange } from "@/hooks/useForcePasswordChange";

interface CRMProfile {
  id: string;
  user_id: string;
  crm_role: 'owner_admin' | 'broker_member' | 'admin' | 'founder' | 'sales_director';
  is_active: boolean;
  display_name: string | null;
}

const CRM = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CRMProfile | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showAssistantPanel, setShowAssistantPanel] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [showToolsSidebar, setShowToolsSidebar] = useState(false);
  
  // Force password change hook
  const { needsPasswordChange, isLoading: passwordCheckLoading, userName, setNeedsPasswordChange } = useForcePasswordChange();
  
  // Smart filters
  const [quickFilter, setQuickFilter] = useState("all");
  const [quickFilterStatuses, setQuickFilterStatuses] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Show force password change screen if needed
  if (needsPasswordChange && !passwordCheckLoading) {
    return (
      <ForcePasswordChange 
        userName={userName} 
        onComplete={() => setNeedsPasswordChange(false)} 
      />
    );
  }

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    checkCRMAccess();
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user?.id) {
      fetchStatusCounts();
    }
  }, [user?.id, refreshKey]);

  const checkCRMAccess = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        toast.error("Access denied. You are not registered in the CRM system.");
        navigate("/");
        return;
      }

      if (!data.is_active) {
        toast.error("Your CRM account has been deactivated. Contact admin.");
        navigate("/");
        return;
      }

      setProfile(data as CRMProfile);
    } catch (err) {
      console.error("CRM access check failed:", err);
      toast.error("Failed to verify CRM access");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusCounts = async () => {
    try {
      const { data } = await supabase
        .from("crm_lead_state_per_user")
        .select("pipeline_status");
      
      const counts: Record<string, number> = {};
      data?.forEach(item => {
        const status = item.pipeline_status || "new";
        counts[status] = (counts[status] || 0) + 1;
      });
      setStatusCounts(counts);
    } catch (err) {
      console.error("Failed to fetch status counts:", err);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleExportCSV = async () => {
    try {
      const { data: leads } = await supabase
        .from("crm_leads")
        .select("full_name, email_lower, phone_e164, nationality, preferred_language, current_location_country, source, tags, created_at")
        .order("created_at", { ascending: false });
      
      if (!leads || leads.length === 0) {
        toast.error("No leads to export");
        return;
      }
      
      const headers = ["Full Name", "Email", "Phone", "Nationality", "Language", "Country", "Source", "Tags", "Created At"];
      const csvRows = [
        headers.join(","),
        ...leads.map(lead => [
          `"${(lead.full_name || '').replace(/"/g, '""')}"`,
          lead.email_lower || '',
          lead.phone_e164 || '',
          lead.nationality || '',
          lead.preferred_language || '',
          lead.current_location_country || '',
          lead.source || '',
          `"${(lead.tags || []).join(', ')}"`,
          lead.created_at ? new Date(lead.created_at).toLocaleDateString() : ''
        ].join(","))
      ];
      
      const csv = csvRows.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jbj_crm_leads_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${leads.length} leads to CSV`);
    } catch (err) {
      console.error("Export failed:", err);
      toast.error("Failed to export leads");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleQuickFilterChange = (filter: string, statuses: string[]) => {
    setQuickFilter(filter);
    setQuickFilterStatuses(statuses);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-lg border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">CRM access unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We couldn’t load your CRM profile for this session. Please refresh the page. If it keeps happening, sign out and sign in again.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
                Refresh
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full sm:w-auto">
                Back to site
              </Button>
              <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAdmin = profile.crm_role === 'owner_admin' || profile.crm_role === 'founder' || profile.crm_role === 'admin';
  const isFounder = profile.crm_role === 'owner_admin' || profile.crm_role === 'founder';

  // Get role label with proper display name
  const getRoleLabel = () => {
    const displayName = profile.display_name || 'Team Member';
    switch (profile.crm_role) {
      case 'founder':
      case 'owner_admin':
        return `Founder & CEO — ${displayName}`;
      case 'admin':
        return `Admin — ${displayName}`;
      case 'broker_member':
        return `Broker — ${displayName}`;
      default:
        return displayName;
    }
  };

  // Get short role title
  const getRoleTitle = () => {
    switch (profile.crm_role) {
      case 'founder':
      case 'owner_admin':
        return 'Founder & CEO';
      case 'admin':
        return 'Admin';
      case 'broker_member':
        return 'Broker';
      default:
        return 'Team Member';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Tools Sidebar */}
      <CRMToolsSidebar isOpen={showToolsSidebar} onClose={() => setShowToolsSidebar(false)} />

      <div className="flex-1">
        {/* Header - Clean white minimal design */}
        <header className="border-b border-zinc-200 bg-white sticky top-0 z-50">
          <div className="max-w-[1600px] w-full mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToolsSidebar(!showToolsSidebar)}
                className="text-zinc-700 hover:text-gold hover:bg-zinc-100 shrink-0 transition-all duration-200 ease-in-out"
              >
                {showToolsSidebar ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
              
              {/* Role Title - Dynamic based on logged-in user */}
              <div className="flex flex-col">
                <span 
                  className="text-sm text-zinc-500"
                  style={{ fontFamily: 'Poppins, Inter, sans-serif' }}
                >
                  {getRoleTitle()}
                </span>
                <span 
                  className="text-base md:text-lg font-semibold text-zinc-900"
                  style={{ fontFamily: 'Poppins, Inter, sans-serif' }}
                >
                  {profile.display_name || 'Team Member'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Quick Navigation Buttons */}
              <div className="hidden md:flex items-center gap-1 mr-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/crm/tasks")}
                  className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 text-xs"
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  Tasks
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/crm/calendar")}
                  className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 text-xs"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Calendar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/crm/employees")}
                  className="text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 text-xs"
                >
                  <Users className="h-4 w-4 mr-1" />
                  Team
                </Button>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/crm/automations")}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 text-xs"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    Automations
                  </Button>
                )}
              </div>

              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/admin/crm")} 
                  className="text-zinc-800 font-semibold hover:text-gold hover:bg-zinc-100 border border-zinc-200 transition-all duration-200 ease-in-out"
                >
                  Admin Dashboard
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut} 
                className="text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition-all duration-200 ease-in-out"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

      <main className="max-w-[1600px] w-full mx-auto px-4 pt-8 pb-6 space-y-6">
        {/* Deal Value Tracker */}
        <DealValueTracker userId={user?.id || ""} />

        {/* Enhanced Dashboard with Charts */}
        <CRMEnhancedDashboard userId={user?.id || ""} isAdmin={isAdmin} />

        {/* Smart Reminders, Automation & Communication - Compact layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Activity Timeline */}
            <ActivityTimeline userId={user?.id || ""} limit={8} />
            
            {/* Communication Panel - Chat, Video, Files */}
            <CRMCommunicationPanel />
          </div>
          
          {/* Right Column: Smart Automations (scrollable) */}
          <div className="space-y-4">
            <SmartReminders userId={user?.id || ""} limit={4} />
            
            {/* Smart Automations - Organized scrollable container */}
            <Card className="border-zinc-200 bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-zinc-900 font-bold text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gold" />
                  Smart Automations
                  <Badge variant="outline" className="ml-auto text-xs border-gold/30 text-gold">
                    Active
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[350px] overflow-y-auto">
                  <AutomationRules userId={user?.id || ""} isAdmin={isAdmin} />
                </div>
              </CardContent>
            </Card>
            
            {/* Admin Tasks Panel - Only visible to Founder/Owner */}
            {isFounder && (
              <AdminTasksPanel />
            )}
          </div>
        </div>
        
        {/* Divider */}
        <div className="border-t border-zinc-200" />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setShowLeadModal(true)} className="btn-premium-gold">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)} className="btn-premium-outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExportCSV} className="text-foreground border-border bg-card hover:bg-muted font-semibold">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setShowBulkAssignModal(true)}
              className="text-foreground border-border bg-card hover:bg-muted font-semibold"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Bulk Assign Leads
            </Button>
          )}
          {isAdmin && (
            <DeleteImportButton userId={user?.id || ""} onSuccess={handleRefresh} isAdmin={isAdmin} />
          )}
          <Button
            variant="outline"
            onClick={() => setShowAssistantPanel(true)}
            className="text-gold border-gold/60 bg-card hover:bg-gold/15 font-bold"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            My Assistant
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="rounded-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <LeadSourceFilter value={sourceFilter} onChange={setSourceFilter} />
          </div>
        </div>

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <KanbanPipeline userId={user?.id || ""} onRefresh={handleRefresh} />
        )}

        {/* Table View - WHITE background for readability */}
        {viewMode === "table" && (
        <Card className="border-zinc-200 bg-white text-zinc-900 shadow-lg">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-zinc-900 font-bold text-lg">Leads Pipeline</CardTitle>
              
              {/* Quick Filters - Integrated into Leads header */}
              <div className="flex-1">
                <LeadQuickFilters 
                  activeFilter={quickFilter} 
                  onChange={handleQuickFilterChange}
                  counts={statusCounts}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-zinc-100 border border-zinc-200 flex-wrap">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black text-zinc-600 font-bold"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="own" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black text-zinc-600 font-bold"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  My Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="website" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black text-zinc-600 font-bold"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Website Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="flagged" 
                  className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground text-zinc-600 font-bold"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Flagged
                </TabsTrigger>
                <TabsTrigger 
                  value="vip" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black text-zinc-600 font-bold"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  VIP Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="employees" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black text-zinc-600 font-bold"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Employees Hub
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <CRMLeadsTableV2
                  key={`all-${refreshKey}-${quickFilter}-${sourceFilter}`}
                  userId={user?.id || ""} 
                  filterType="all"
                  onRefresh={handleRefresh}
                  statusFilters={quickFilterStatuses}
                  sourceFilter={sourceFilter !== "all" ? sourceFilter : undefined}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="own">
                <CRMLeadsTableV2 
                  key={`own-${refreshKey}-${quickFilter}-${sourceFilter}`}
                  userId={user?.id || ""} 
                  filterType="own"
                  onRefresh={handleRefresh}
                  statusFilters={quickFilterStatuses}
                  sourceFilter={sourceFilter !== "all" ? sourceFilter : undefined}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="website">
                <CRMLeadsTableV2
                  key={`website-${refreshKey}-${quickFilter}-${sourceFilter}`}
                  userId={user?.id || ""} 
                  filterType="website"
                  onRefresh={handleRefresh}
                  statusFilters={quickFilterStatuses}
                  sourceFilter={sourceFilter !== "all" ? sourceFilter : undefined}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="flagged">
                <FlaggedLeadsView userId={user?.id || ""} onRefresh={handleRefresh} />
              </TabsContent>

              <TabsContent value="vip">
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <VIPExportButton />
                  </div>
                  <CRMLeadsTableV2
                    key={`vip-${refreshKey}-${quickFilter}-${sourceFilter}`}
                    userId={user?.id || ""} 
                    filterType="vip"
                    onRefresh={handleRefresh}
                    statusFilters={quickFilterStatuses}
                    sourceFilter={sourceFilter !== "all" ? sourceFilter : undefined}
                    isAdmin={isAdmin}
                  />
                </div>
              </TabsContent>

              <TabsContent value="employees">
                <EmployeesHub userId={user?.id || ""} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        )}
      </main>

      {/* Modals */}
      <CRMImportModalV3 
        open={showImportModal} 
        onClose={() => setShowImportModal(false)}
        onSuccess={handleRefresh}
        userId={user?.id || ""}
      />

      <CRMLeadModal
        open={showLeadModal}
        onClose={() => setShowLeadModal(false)}
        onSuccess={handleRefresh}
        userId={user?.id || ""}
      />

      {isAdmin && (
        <BulkAssignModal
          open={showBulkAssignModal}
          onClose={() => setShowBulkAssignModal(false)}
          onSuccess={handleRefresh}
          selectedLeadIds={[]}
          filterStatus={quickFilter !== "all" ? quickFilterStatuses[0] : undefined}
          totalAvailable={Object.values(statusCounts).reduce((a, b) => a + b, 0)}
        />
        )}

      <CRMAssistantPanel
        userId={user?.id || ""}
        isOpen={showAssistantPanel}
        onClose={() => setShowAssistantPanel(false)}
      />
      </div>
    </div>
  );
};

export default CRM;
