import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  ArrowLeft, Users, Phone, MessageSquare, TrendingUp, 
  Download, UserPlus, Shield, Activity, Search, Bell, Brain
} from "lucide-react";
import CRMDashboardCards from "@/components/crm/CRMDashboardCards";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";
import { BrokerManagementPanel } from "@/components/admin/BrokerManagementPanel";

interface Broker {
  id: string;
  user_id: string;
  display_name: string | null;
  crm_role: string;
  is_active: boolean;
  created_at: string;
  email?: string;
  stats?: {
    totalLeads: number;
    callsThisWeek: number;
    whatsappThisWeek: number;
  };
}

interface AuditLog {
  id: string;
  actor_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const AdminCRM = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasOwnerAccess, setHasOwnerAccess] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    checkOwnerAccess();
  }, [user, authLoading, navigate]);

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

  const checkOwnerAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data || data.crm_role !== "owner_admin") {
        toast.error("Owner access required");
        navigate("/crm");
        return;
      }

      setHasOwnerAccess(true);
      await Promise.all([
        fetchBrokers(),
        fetchAuditLogs(),
        fetchAllLeads()
      ]);
    } catch (err) {
      console.error("Admin check failed:", err);
      navigate("/crm");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from("crm_users_profile")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch stats for each broker
      const brokersWithStats = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          
          const [leadsRes, callsRes, whatsappRes] = await Promise.all([
            supabase
              .from("crm_lead_state_per_user")
              .select("id", { count: "exact" })
              .eq("user_id", profile.user_id),
            supabase
              .from("crm_calls")
              .select("id", { count: "exact" })
              .eq("user_id", profile.user_id)
              .gte("started_at", weekAgo),
            supabase
              .from("crm_activities")
              .select("id", { count: "exact" })
              .eq("user_id", profile.user_id)
              .eq("activity_type", "whatsapp_click")
              .gte("created_at", weekAgo)
          ]);

          return {
            ...profile,
            stats: {
              totalLeads: leadsRes.count || 0,
              callsThisWeek: callsRes.count || 0,
              whatsappThisWeek: whatsappRes.count || 0
            }
          };
        })
      );

      setBrokers(brokersWithStats);
    } catch (err) {
      console.error("Failed to fetch brokers:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("crm_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const fetchAllLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      setAllLeads(data || []);
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    }
  };

  const toggleBrokerStatus = async (brokerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("crm_users_profile")
        .update({ is_active: !currentStatus })
        .eq("id", brokerId);

      if (error) throw error;

      // Log audit
      await supabase.from("crm_audit_logs").insert({
        actor_user_id: user?.id,
        action: currentStatus ? "deactivate_broker" : "activate_broker",
        entity_type: "crm_users_profile",
        entity_id: brokerId,
        details: { new_status: !currentStatus }
      });

      toast.success(`Broker ${currentStatus ? "deactivated" : "activated"}`);
      fetchBrokers();
      fetchAuditLogs();
    } catch (err) {
      toast.error("Failed to update broker status");
    }
  };

  const exportLeadsCSV = () => {
    if (allLeads.length === 0) {
      toast.error("No leads to export");
      return;
    }

    const headers = [
      "id", "full_name", "email_lower", "phone_e164", "nationality", "language",
      "country", "city", "source", "owner_type", "created_at"
    ];

    const rows = allLeads.map(lead => [
      lead.id,
      lead.full_name,
      lead.email_lower || "",
      lead.phone_e164 || "",
      lead.nationality || "",
      lead.preferred_language || "",
      lead.current_location_country || "",
      lead.current_location_city || "",
      lead.source || "",
      lead.owner_type,
      lead.created_at
    ]);

    // Audit log the export
    supabase.from("audit_logs").insert([{
      action_type: "export" as const,
      resource_type: "lead" as const,
      description: `Admin CSV export of ${allLeads.length} leads (full data)`,
      user_id: user?.id,
      user_agent: navigator.userAgent,
    }]).then(() => {});

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jj_global_capital_leads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${allLeads.length} leads`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#B89555]" />
      </div>
    );
  }

  if (!hasOwnerAccess) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      {/* Premium Header */}
      <header className="border-b-2 border-[#B89555]/30 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] sticky top-0 z-50 shadow-[0_4px_20px_rgba(200,167,102,0.1)] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#1A1A1A]">Admin Dashboard</h1>
            <p className="text-sm text-[#1A1A1A]">JBJ Global Real Estate CRM</p>
          </div>
          
          {/* Search */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A]/70 hover:border-[#B89555]/50 transition-all"
          >
            <Search className="h-4 w-4 text-[#1A1A1A]" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-2 px-2 py-0.5 bg-[#EFE6D6]/10 text-[#1A1A1A] text-xs rounded font-mono">⌘K</kbd>
          </button>
          
          <Button variant="ghost" size="sm" className="text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/10 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">2</span>
          </Button>
          
          <Badge className="bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30 font-semibold">Admin</Badge>
        </div>
      </header>

      <main className="max-w-[1600px] w-full mx-auto px-4 md:px-6 py-6 space-y-6 pb-24 overflow-hidden">
        {/* Global Stats */}
        <CRMDashboardCards userId={user?.id || ""} hasOwnerAccess={true} />

        {/* Admin Actions */}
        <div className="flex gap-3">
          <Button onClick={exportLeadsCSV} variant="primary">
            <Download className="h-4 w-4 mr-2" />
            Export All Leads (CSV)
          </Button>
        </div>

        <Tabs defaultValue="broker-profiles">
          <TabsList className="bg-[#FDFBF7]/80 border-2 border-[#B89555]/30 p-1">
            <TabsTrigger value="broker-profiles" className="tab-trigger-champagne text-[#1A1A1A]">
              <Shield className="h-4 w-4 mr-2" />
              Broker Profiles
            </TabsTrigger>
            <TabsTrigger value="brokers" className="tab-trigger-champagne text-[#1A1A1A]">
              <Users className="h-4 w-4 mr-2" />
              CRM Users
            </TabsTrigger>
            <TabsTrigger value="leads" className="tab-trigger-champagne text-[#1A1A1A]">
              <TrendingUp className="h-4 w-4 mr-2" />
              All Leads
            </TabsTrigger>
            <TabsTrigger value="audit" className="tab-trigger-champagne text-[#1A1A1A]">
              <Activity className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Broker Profiles Management Tab */}
          <TabsContent value="broker-profiles">
            <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardContent className="p-6">
                <BrokerManagementPanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brokers Tab */}
          <TabsContent value="brokers">
            <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardHeader>
                <CardTitle className="text-[#1A1A1A]">Broker Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#B89555]/20">
                      <TableHead className="text-[#1A1A1A]">Name</TableHead>
                      <TableHead className="text-[#1A1A1A]">Role</TableHead>
                      <TableHead className="text-[#1A1A1A]">Status</TableHead>
                      <TableHead className="text-[#1A1A1A]">Leads</TableHead>
                      <TableHead className="text-[#1A1A1A]">Calls (7d)</TableHead>
                      <TableHead className="text-[#1A1A1A]">WhatsApp (7d)</TableHead>
                      <TableHead className="text-[#1A1A1A]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokers.map((broker) => (
                      <TableRow key={broker.id} className="border-[#B89555]/10 hover:bg-[#EFE6D6]/5">
                        <TableCell>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{broker.display_name || "No name"}</p>
                            <p className="text-xs text-[#1A1A1A]/70">{broker.user_id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={broker.crm_role === "owner_admin" ? "bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30" : "bg-[#F7F2EA] text-[#1A1A1A]/70"}>
                            {broker.crm_role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={broker.is_active ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}>
                            {broker.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#1A1A1A]">{broker.stats?.totalLeads || 0}</TableCell>
                        <TableCell className="text-[#1A1A1A]">{broker.stats?.callsThisWeek || 0}</TableCell>
                        <TableCell className="text-[#1A1A1A]">{broker.stats?.whatsappThisWeek || 0}</TableCell>
                        <TableCell>
                          {broker.crm_role !== "owner_admin" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => toggleBrokerStatus(broker.id, broker.is_active)}
                            >
                              {broker.is_active ? "Deactivate" : "Activate"}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Leads Tab */}
          <TabsContent value="leads">
            <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardHeader>
                <CardTitle className="text-[#1A1A1A]">All Leads ({allLeads.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#B89555]/20">
                      <TableHead className="text-[#1A1A1A]">Name</TableHead>
                      <TableHead className="text-[#1A1A1A]">Contact</TableHead>
                      <TableHead className="text-[#1A1A1A]">Location</TableHead>
                      <TableHead className="text-[#1A1A1A]">Owner Type</TableHead>
                      <TableHead className="text-[#1A1A1A]">Source</TableHead>
                      <TableHead className="text-[#1A1A1A]">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLeads.slice(0, 50).map((lead) => (
                      <TableRow key={lead.id} className="border-[#B89555]/10 hover:bg-[#EFE6D6]/5">
                        <TableCell>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{lead.full_name}</p>
                            <p className="text-xs text-[#1A1A1A]/70">
                              {lead.nationality}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {lead.email_lower && <p className="text-[#1A1A1A]">{lead.email_lower}</p>}
                            {lead.phone_e164 && (
                              <p className="text-[#1A1A1A]/70">{lead.phone_e164}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[#1A1A1A]">
                          {lead.current_location_country || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]">{lead.owner_type}</Badge>
                        </TableCell>
                        <TableCell className="text-[#1A1A1A]">{lead.source || "-"}</TableCell>
                        <TableCell className="text-sm text-[#1A1A1A]/70">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {allLeads.length > 50 && (
                  <p className="text-center text-sm text-[#1A1A1A]/70 mt-4">
                    Showing 50 of {allLeads.length} leads. Export for full list.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardHeader>
                <CardTitle className="text-[#1A1A1A]">Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#B89555]/20">
                      <TableHead className="text-[#1A1A1A]">Time</TableHead>
                      <TableHead className="text-[#1A1A1A]">Actor</TableHead>
                      <TableHead className="text-[#1A1A1A]">Action</TableHead>
                      <TableHead className="text-[#1A1A1A]">Entity</TableHead>
                      <TableHead className="text-[#1A1A1A]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className="border-[#B89555]/10 hover:bg-[#EFE6D6]/5">
                        <TableCell className="text-sm text-[#1A1A1A]">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-[#1A1A1A]/70">
                          {log.actor_user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-[#1A1A1A]">
                          {log.entity_type}
                        </TableCell>
                        <TableCell className="text-xs text-[#1A1A1A]/70 max-w-xs truncate">
                          {JSON.stringify(log.details)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Bar */}
      <FloatingActionBar />
    </div>
  );
};

export default AdminCRM;
