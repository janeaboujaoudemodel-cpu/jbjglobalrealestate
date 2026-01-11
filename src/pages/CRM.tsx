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
  Users, FileText, Plus, Upload, Download, LogOut, Shuffle, LayoutGrid, List, Zap, Briefcase, PanelLeftOpen, PanelLeftClose
} from "lucide-react";
import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";
import CRMLeadsTable from "@/components/crm/CRMLeadsTable";
import CRMEnhancedDashboard from "@/components/crm/CRMEnhancedDashboard";
import CRMImportModal from "@/components/crm/CRMImportModal";
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

interface CRMProfile {
  id: string;
  user_id: string;
  crm_role: 'owner_admin' | 'broker_member' | 'admin' | 'founder';
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [showToolsSidebar, setShowToolsSidebar] = useState(false);
  
  // Smart filters
  const [quickFilter, setQuickFilter] = useState("all");
  const [quickFilterStatuses, setQuickFilterStatuses] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

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

  if (!profile) return null;

  const isAdmin = profile.crm_role === 'owner_admin' || profile.crm_role === 'founder' || profile.crm_role === 'admin';
  const isFounder = profile.crm_role === 'owner_admin' || profile.crm_role === 'founder';

  // Get role label
  const getRoleLabel = () => {
    switch (profile.crm_role) {
      case 'founder':
      case 'owner_admin':
        return 'Founder & CEO';
      case 'admin':
        return 'Admin';
      default:
        return 'Broker';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Tools Sidebar */}
      <CRMToolsSidebar isOpen={showToolsSidebar} onClose={() => setShowToolsSidebar(false)} />

      <div className="flex-1">
        {/* Header */}
        <header className="border-b border-border bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToolsSidebar(!showToolsSidebar)}
                className="text-gold hover:text-gold hover:bg-gold/10"
              >
                {showToolsSidebar ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
              <div className="flex items-center gap-3">
                <img 
                  src={jbjMonogramDarkBg} 
                  alt="JBJ" 
                  className="h-10 w-10 rounded-md"
                />
                <div>
                  <h1 className="text-xl font-bold text-gold tracking-wide" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    JBJ GLOBAL REAL ESTATE
                  </h1>
                  <p className="text-xs text-muted-foreground">Customer Relationship Management</p>
                </div>
              </div>
              <Badge 
                variant="default" 
                className={
                  isFounder ? "bg-amber-600 text-white" :
                  isAdmin ? "bg-primary text-primary-foreground" : 
                  "bg-muted text-muted-foreground"
                }
              >
                {getRoleLabel()}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white font-medium">
                {profile.display_name || user?.email}
              </span>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/crm")} className="text-white border-border hover:bg-muted">
                  Admin Dashboard
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-white hover:text-white hover:bg-muted">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Deal Value Tracker */}
        <DealValueTracker userId={user?.id || ""} />

        {/* Enhanced Dashboard with Charts */}
        <CRMEnhancedDashboard userId={user?.id || ""} isAdmin={isAdmin} />

        {/* Smart Reminders & Automation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Filters */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Quick Filters</h3>
              <LeadQuickFilters 
                activeFilter={quickFilter} 
                onChange={handleQuickFilterChange}
                counts={statusCounts}
              />
            </div>
            {/* Activity Timeline */}
            <ActivityTimeline userId={user?.id || ""} limit={10} />
          </div>
          <div className="space-y-4">
            <SmartReminders userId={user?.id || ""} limit={4} />
            <AutomationRules userId={user?.id || ""} isAdmin={isAdmin} />
            {/* Admin Tasks Panel - Only visible to Founder/Owner */}
            {isFounder && (
              <AdminTasksPanel />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setShowLeadModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)} className="text-white border-border hover:bg-muted">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button 
            variant="outline" 
            onClick={handleExportCSV} 
            className="text-white border-border hover:bg-muted"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => setShowBulkAssignModal(true)} 
              className="text-amber-400 border-amber-500/50 hover:bg-amber-600/20"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Bulk Assign Leads
            </Button>
          )}
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

        {/* Table View */}
        {viewMode === "table" && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-white font-bold">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-muted/50">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground font-semibold"
                >
                  <Users className="h-4 w-4 mr-2" />
                  All Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="own" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground font-semibold"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  My Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="website" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-white text-muted-foreground font-semibold"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Website Leads
                </TabsTrigger>
                <TabsTrigger 
                  value="employees" 
                  className="data-[state=active]:bg-gold data-[state=active]:text-black text-muted-foreground font-semibold"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Employees Hub
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <CRMLeadsTable
                  key={`all-${refreshKey}-${quickFilter}-${sourceFilter}`}
                  userId={user?.id || ""} 
                  filterType="all"
                  onRefresh={handleRefresh}
                  statusFilters={quickFilterStatuses}
                  sourceFilter={sourceFilter !== "all" ? sourceFilter : undefined}
                />
              </TabsContent>

              <TabsContent value="own">
                <CRMLeadsTable 
                  key={`own-${refreshKey}-${quickFilter}-${sourceFilter}`}
                  userId={user?.id || ""} 
                  filterType="own"
                  onRefresh={handleRefresh}
                  statusFilters={quickFilterStatuses}
                  sourceFilter={sourceFilter !== "all" ? sourceFilter : undefined}
                />
              </TabsContent>

              <TabsContent value="website">
                <CRMLeadsTable 
                  key={`website-${refreshKey}-${quickFilter}-${sourceFilter}`}
                  userId={user?.id || ""} 
                  filterType="website"
                  onRefresh={handleRefresh}
                  statusFilters={quickFilterStatuses}
                  sourceFilter={sourceFilter !== "all" ? sourceFilter : undefined}
                />
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
      <CRMImportModal 
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
      </div>
    </div>
  );
};

export default CRM;
