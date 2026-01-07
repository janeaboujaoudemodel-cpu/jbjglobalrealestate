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
  Users, Phone, MessageSquare, Calendar, 
  TrendingUp, FileText, Plus, Upload, LogOut
} from "lucide-react";
import CRMLeadsTable from "@/components/crm/CRMLeadsTable";
import CRMDashboardCards from "@/components/crm/CRMDashboardCards";
import CRMImportModal from "@/components/crm/CRMImportModal";
import CRMLeadModal from "@/components/crm/CRMLeadModal";

interface CRMProfile {
  id: string;
  user_id: string;
  crm_role: 'owner_admin' | 'broker_member';
  is_active: boolean;
  display_name: string | null;
}

const CRM = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CRMProfile | null>(null);
  const [activeTab, setActiveTab] = useState("assigned");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkCRMAccess();
  }, [user, navigate]);

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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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

  const isAdmin = profile.crm_role === 'owner_admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">JJ Global Capital CRM</h1>
            <Badge variant={isAdmin ? "default" : "secondary"} className={isAdmin ? "bg-primary text-primary-foreground" : ""}>
              {isAdmin ? "Admin" : "Broker"}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground">
              {profile.display_name || user?.email}
            </span>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin/crm")} className="text-foreground border-border">
                Admin Dashboard
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-foreground hover:text-foreground">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Cards */}
        <CRMDashboardCards userId={user?.id || ""} isAdmin={isAdmin} />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={() => setShowLeadModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)} className="text-foreground border-border">
            <Upload className="h-4 w-4 mr-2" />
            Import Contacts
          </Button>
        </div>

        {/* Leads Tabs */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 bg-muted">
                <TabsTrigger value="assigned" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                  <Users className="h-4 w-4 mr-2" />
                  Assigned by JJ Global Capital
                </TabsTrigger>
                <TabsTrigger value="own" className="data-[state=active]:bg-card data-[state=active]:text-foreground text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2" />
                  My Own Leads
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assigned">
                <CRMLeadsTable 
                  key={`assigned-${refreshKey}`}
                  userId={user?.id || ""} 
                  filterType="assigned"
                  onRefresh={handleRefresh}
                />
              </TabsContent>

              <TabsContent value="own">
                <CRMLeadsTable 
                  key={`own-${refreshKey}`}
                  userId={user?.id || ""} 
                  filterType="own"
                  onRefresh={handleRefresh}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
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
    </div>
  );
};

export default CRM;
