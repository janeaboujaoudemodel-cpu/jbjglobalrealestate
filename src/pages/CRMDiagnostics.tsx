import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Shield, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  ArrowLeft,
  Trash2
} from "lucide-react";
import { format } from "date-fns";

interface CRMProfile {
  id: string;
  user_id: string;
  crm_role: string;
  is_active: boolean;
  display_name: string | null;
}

interface ImportSource {
  id: string;
  source_name: string;
  source_group: string;
  total_rows: number | null;
  created_at: string;
  lead_count: number;
}

interface DiagnosticCounts {
  totalLeads: number;
  websiteLeads: number;
  importedLeads: number;
  mislabeledWebsite: number; // leads where lead_source_type='website' AND source_id IS NOT NULL
  mislabeledLanguage: number; // leads where preferred_language='en' AND source_id IS NOT NULL
}

const CRMDiagnostics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<CRMProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<DiagnosticCounts | null>(null);
  const [sources, setSources] = useState<ImportSource[]>([]);
  const [deleteImportButtonRendered, setDeleteImportButtonRendered] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    checkAccess();
  }, [authLoading, user, navigate]);

  const checkAccess = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error || !data) {
        toast.error("Access denied: Not a CRM user");
        navigate("/");
        return;
      }
      
      // Only admins can access diagnostics
      if (!["owner_admin", "admin", "founder"].includes(data.crm_role)) {
        toast.error("Access denied: Admin privileges required");
        navigate("/crm");
        return;
      }
      
      setProfile(data);
      setDeleteImportButtonRendered(true); // Admins see the button
      
      await fetchDiagnostics();
    } catch (err) {
      console.error("Access check failed:", err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchDiagnostics = async () => {
    setRefreshing(true);
    try {
      // Fetch all counts in parallel
      const [
        totalResult,
        websiteResult,
        importedResult,
        mislabeledWebsiteResult,
        mislabeledLanguageResult,
        sourcesResult
      ] = await Promise.all([
        // Total leads
        supabase.from("crm_leads").select("*", { count: "exact", head: true }),
        
        // Website leads (legitimate)
        supabase.from("crm_leads")
          .select("*", { count: "exact", head: true })
          .eq("lead_source_type", "website")
          .is("source_id", null),
        
        // Imported leads (have source_id)
        supabase.from("crm_leads")
          .select("*", { count: "exact", head: true })
          .not("source_id", "is", null),
        
        // Mislabeled: lead_source_type='website' AND source_id IS NOT NULL (BAD)
        supabase.from("crm_leads")
          .select("*", { count: "exact", head: true })
          .eq("lead_source_type", "website")
          .not("source_id", "is", null),
        
        // Mislabeled: preferred_language='en' AND source_id IS NOT NULL (BAD for imports)
        supabase.from("crm_leads")
          .select("*", { count: "exact", head: true })
          .eq("preferred_language", "en")
          .not("source_id", "is", null),
        
        // Import sources
        supabase.from("crm_lead_sources")
          .select("id, source_name, source_group, total_rows, created_at")
          .order("created_at", { ascending: false })
          .limit(20)
      ]);

      setCounts({
        totalLeads: totalResult.count || 0,
        websiteLeads: websiteResult.count || 0,
        importedLeads: importedResult.count || 0,
        mislabeledWebsite: mislabeledWebsiteResult.count || 0,
        mislabeledLanguage: mislabeledLanguageResult.count || 0,
      });

      // Fetch lead counts for each source
      const sourcesWithCounts: ImportSource[] = [];
      for (const source of sourcesResult.data || []) {
        const { count } = await supabase
          .from("crm_leads")
          .select("*", { count: "exact", head: true })
          .eq("source_id", source.id);
        
        sourcesWithCounts.push({
          ...source,
          lead_count: count || 0
        });
      }
      setSources(sourcesWithCounts);

    } catch (err) {
      console.error("Failed to fetch diagnostics:", err);
      toast.error("Failed to load diagnostics");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/crm")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to CRM
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                CRM Diagnostics
              </h1>
              <p className="text-muted-foreground text-sm">Admin-only diagnostic dashboard</p>
            </div>
          </div>
          <Button onClick={fetchDiagnostics} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">User ID</p>
                <p className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                  {profile.user_id}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CRM Role</p>
                <Badge className="mt-1" variant={profile.crm_role === 'owner_admin' ? 'default' : 'secondary'}>
                  {profile.crm_role}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Is Active</p>
                <div className="flex items-center gap-2 mt-1">
                  {profile.is_active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>{profile.is_active ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delete Import Button</p>
                <div className="flex items-center gap-2 mt-1">
                  {deleteImportButtonRendered ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-500 font-semibold">Rendered</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-500">Not Rendered</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Counts Card */}
        <Card>
          <CardHeader>
            <CardTitle>Live Counts</CardTitle>
            <CardDescription>Real-time database statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {counts ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-muted p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-foreground">{counts.totalLeads}</p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-emerald-500">{counts.websiteLeads}</p>
                  <p className="text-sm text-emerald-400">Website Leads</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-500">{counts.importedLeads}</p>
                  <p className="text-sm text-blue-400">Imported Leads</p>
                </div>
                <div className={`p-4 rounded-lg text-center ${counts.mislabeledWebsite === 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/20 border border-red-500'}`}>
                  <p className={`text-3xl font-bold ${counts.mislabeledWebsite === 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {counts.mislabeledWebsite}
                  </p>
                  <p className={`text-sm ${counts.mislabeledWebsite === 0 ? 'text-green-400' : 'text-red-400'}`}>
                    Mislabeled (website)
                  </p>
                  {counts.mislabeledWebsite === 0 && (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                  )}
                  {counts.mislabeledWebsite > 0 && (
                    <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mt-1" />
                  )}
                </div>
                <div className={`p-4 rounded-lg text-center ${counts.mislabeledLanguage === 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/20 border border-amber-500'}`}>
                  <p className={`text-3xl font-bold ${counts.mislabeledLanguage === 0 ? 'text-green-500' : 'text-amber-500'}`}>
                    {counts.mislabeledLanguage}
                  </p>
                  <p className={`text-sm ${counts.mislabeledLanguage === 0 ? 'text-green-400' : 'text-amber-400'}`}>
                    Mislabeled (EN)
                  </p>
                  {counts.mislabeledLanguage === 0 && (
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto mt-1" />
                  )}
                  {counts.mislabeledLanguage > 0 && (
                    <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mt-1" />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Sources Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Latest Import Sources
            </CardTitle>
            <CardDescription>Recent imports available for deletion via Delete Import button in /crm toolbar</CardDescription>
          </CardHeader>
          <CardContent>
            {sources.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground">Source ID</th>
                      <th className="text-left py-2 px-3 text-muted-foreground">Group</th>
                      <th className="text-left py-2 px-3 text-muted-foreground">Name</th>
                      <th className="text-left py-2 px-3 text-muted-foreground">Created</th>
                      <th className="text-right py-2 px-3 text-muted-foreground">Lead Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.map((source) => (
                      <tr key={source.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-3 font-mono text-xs">{source.id.slice(0, 8)}...</td>
                        <td className="py-2 px-3">
                          <Badge variant={source.source_group === 'website' ? 'default' : 'secondary'}>
                            {source.source_group}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 font-medium">{source.source_name}</td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {format(new Date(source.created_at), "MMM d, yyyy HH:mm")}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">{source.lead_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No import sources found</p>
                <p className="text-sm">Import a CSV/Excel file to create sources</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Summary */}
        <Card className={counts && counts.mislabeledWebsite === 0 && counts.mislabeledLanguage === 0 ? 'border-green-500/50' : 'border-red-500/50'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              {counts && counts.mislabeledWebsite === 0 && counts.mislabeledLanguage === 0 ? (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500" />
                  <div>
                    <h3 className="text-lg font-bold text-green-500">All Checks Passed</h3>
                    <p className="text-muted-foreground">No mislabeled imports detected. Import system is functioning correctly.</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                  <div>
                    <h3 className="text-lg font-bold text-red-500">Issues Detected</h3>
                    <p className="text-muted-foreground">
                      {counts?.mislabeledWebsite || 0} leads with wrong source type, {counts?.mislabeledLanguage || 0} with wrong language.
                      Use Delete Import to remove affected imports.
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMDiagnostics;
