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
  Download, UserPlus, Shield, Activity
} from "lucide-react";
import CRMDashboardCards from "@/components/crm/CRMDashboardCards";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allLeads, setAllLeads] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminAccess();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("crm_users_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error || !data || data.crm_role !== "owner_admin") {
        toast.error("Admin access required");
        navigate("/crm");
        return;
      }

      setIsAdmin(true);
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
      "id", "full_name", "email", "phone", "nationality", "language",
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
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/crm")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">JJ Global Capital CRM</p>
          </div>
          <Badge className="bg-red-500">Admin</Badge>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Global Stats */}
        <CRMDashboardCards userId={user?.id || ""} isAdmin={true} />

        {/* Admin Actions */}
        <div className="flex gap-3">
          <Button onClick={exportLeadsCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export All Leads (CSV)
          </Button>
        </div>

        <Tabs defaultValue="brokers">
          <TabsList>
            <TabsTrigger value="brokers">
              <Users className="h-4 w-4 mr-2" />
              Brokers
            </TabsTrigger>
            <TabsTrigger value="leads">
              <TrendingUp className="h-4 w-4 mr-2" />
              All Leads
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="h-4 w-4 mr-2" />
              Audit Logs
            </TabsTrigger>
          </TabsList>

          {/* Brokers Tab */}
          <TabsContent value="brokers">
            <Card>
              <CardHeader>
                <CardTitle>Broker Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Calls (7d)</TableHead>
                      <TableHead>WhatsApp (7d)</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokers.map((broker) => (
                      <TableRow key={broker.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{broker.display_name || "No name"}</p>
                            <p className="text-xs text-muted-foreground">{broker.user_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={broker.crm_role === "owner_admin" ? "default" : "secondary"}>
                            {broker.crm_role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={broker.is_active ? "default" : "destructive"}>
                            {broker.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>{broker.stats?.totalLeads || 0}</TableCell>
                        <TableCell>{broker.stats?.callsThisWeek || 0}</TableCell>
                        <TableCell>{broker.stats?.whatsappThisWeek || 0}</TableCell>
                        <TableCell>
                          {broker.crm_role !== "owner_admin" && (
                            <Button
                              variant="outline"
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
            <Card>
              <CardHeader>
                <CardTitle>All Leads ({allLeads.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Owner Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allLeads.slice(0, 50).map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lead.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {lead.nationality}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {lead.email_lower && <p>{lead.email_lower}</p>}
                            {lead.phone_e164 && (
                              <p className="text-muted-foreground">{lead.phone_e164}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {lead.current_location_country || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.owner_type}</Badge>
                        </TableCell>
                        <TableCell>{lead.source || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {allLeads.length > 50 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Showing 50 of {allLeads.length} leads. Export for full list.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {log.actor_user_id?.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.entity_type}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
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
    </div>
  );
};

export default AdminCRM;
