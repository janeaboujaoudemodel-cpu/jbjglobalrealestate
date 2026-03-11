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

    // SECURITY: Strip PII from CSV export — no email/phone in plaintext
    const headers = [
      "id", "full_name", "nationality", "language",
      "country", "city", "source", "owner_type", "created_at"
    ];

    const rows = allLeads.map(lead => [
      lead.id,
      lead.full_name,
      lead.nationality || "",
      lead.preferred_language || "",
      lead.current_location_country || "",
      lead.current_location_city || "",
      lead.source || "",
      lead.owner_type,
      lead.created_at
    ]);

    // Audit log the export
    supabase.from("audit_logs").insert({
      action_type: "export" as const,
      resource_type: "crm_lead" as const,
      description: `Admin CSV export of ${allLeads.length} leads (PII stripped)`,
      user_id: user?.id,
      user_agent: navigator.userAgent,
    }).then(() => {});

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
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  if (!hasOwnerAccess) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      {/* Premium Header */}
      <header className="border-b-2 border-gold/30 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] sticky top-0 z-50 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm")} className="text-gold hover:text-black hover:bg-gold/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-black">Admin Dashboard</h1>
            <p className="text-sm text-gold">JBJ Global Real Estate CRM</p>
          </div>
          
          {/* Search */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gold/30 text-zinc-500 hover:border-gold/50 transition-all"
          >
            <Search className="h-4 w-4 text-gold" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-2 px-2 py-0.5 bg-gold/10 text-gold text-xs rounded font-mono">⌘K</kbd>
          </button>
          
          <Button variant="ghost" size="sm" className="text-black hover:text-gold hover:bg-gold/10 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">2</span>
          </Button>
          
          <Badge className="bg-gold/10 text-gold border-gold/30 font-semibold">Admin</Badge>
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

        <Tabs defaultValue="brokers">
          <TabsList className="bg-white/80 border-2 border-gold/30 p-1">
            <TabsTrigger value="brokers" className="tab-trigger-champagne text-black">
              <Users className="h-4 w-4 mr-2" />
              Brokers
            </TabsTrigger>
            <TabsTrigger value="leads" className="tab-trigger-champagne text-black">
              <TrendingUp className="h-4 w-4 mr-2" />
              All Leads
            </TabsTrigger>
            <TabsTrigger value="audit" className="tab-trigger-champagne text-black">
              <Activity className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Brokers Tab */}
          <TabsContent value="brokers">
            <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardHeader>
                <CardTitle className="text-black">Broker Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/20">
                      <TableHead className="text-black">Name</TableHead>
                      <TableHead className="text-black">Role</TableHead>
                      <TableHead className="text-black">Status</TableHead>
                      <TableHead className="text-black">Leads</TableHead>
                      <TableHead className="text-black">Calls (7d)</TableHead>
                      <TableHead className="text-black">WhatsApp (7d)</TableHead>
                      <TableHead className="text-black">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokers.map((broker) => (
                      <TableRow key={broker.id} className="border-gold/10 hover:bg-gold/5">
                        <TableCell>
                          <div>
                            <p className="font-medium text-black">{broker.display_name || "No name"}</p>
                            <p className="text-xs text-zinc-500">{broker.user_id.slice(0, 8)}...</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={broker.crm_role === "owner_admin" ? "bg-gold/10 text-gold border-gold/30" : "bg-zinc-100 text-zinc-600"}>
                            {broker.crm_role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={broker.is_active ? "bg-green-100 text-green-700 border-green-300" : "bg-red-100 text-red-700 border-red-300"}>
                            {broker.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-black">{broker.stats?.totalLeads || 0}</TableCell>
                        <TableCell className="text-black">{broker.stats?.callsThisWeek || 0}</TableCell>
                        <TableCell className="text-black">{broker.stats?.whatsappThisWeek || 0}</TableCell>
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
            <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardHeader>
                <CardTitle className="text-black">All Leads ({allLeads.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/20">
                      <TableHead className="text-black">Name</TableHead>
                      <TableHead className="text-black">Contact</TableHead>
                      <TableHead className="text-black">Location</TableHead>
                      <TableHead className="text-black">Owner Type</TableHead>
                      <TableHead className="text-black">Source</TableHead>
                      <TableHead className="text-black">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLeads.slice(0, 50).map((lead) => (
                      <TableRow key={lead.id} className="border-gold/10 hover:bg-gold/5">
                        <TableCell>
                          <div>
                            <p className="font-medium text-black">{lead.full_name}</p>
                            <p className="text-xs text-zinc-500">
                              {lead.nationality}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {lead.email_lower && <p className="text-black">{lead.email_lower}</p>}
                            {lead.phone_e164 && (
                              <p className="text-zinc-500">{lead.phone_e164}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-black">
                          {lead.current_location_country || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gold/30 text-black">{lead.owner_type}</Badge>
                        </TableCell>
                        <TableCell className="text-black">{lead.source || "-"}</TableCell>
                        <TableCell className="text-sm text-zinc-500">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {allLeads.length > 50 && (
                  <p className="text-center text-sm text-zinc-500 mt-4">
                    Showing 50 of {allLeads.length} leads. Export for full list.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardHeader>
                <CardTitle className="text-black">Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gold/20">
                      <TableHead className="text-black">Time</TableHead>
                      <TableHead className="text-black">Actor</TableHead>
                      <TableHead className="text-black">Action</TableHead>
                      <TableHead className="text-black">Entity</TableHead>
                      <TableHead className="text-black">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className="border-gold/10 hover:bg-gold/5">
                        <TableCell className="text-sm text-black">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono text-zinc-500">
                          {log.actor_user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-gold/30 text-black">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-black">
                          {log.entity_type}
                        </TableCell>
                        <TableCell className="text-xs text-zinc-500 max-w-xs truncate">
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
