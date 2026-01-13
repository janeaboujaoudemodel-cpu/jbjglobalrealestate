import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Users,
  MessageSquare,
  Phone,
  Mail,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  LayoutGrid,
  List,
} from "lucide-react";
import { JBJLeadCard } from "@/components/jbj-broker/JBJLeadCard";
import { JBJSidebar } from "@/components/jbj-broker/JBJSidebar";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  notes: string | null;
  property_interest: string | null;
  last_contact: string | null;
  created_at: string;
}

interface BrokerStats {
  totalLeads: number;
  contactedToday: number;
  pendingFollowUp: number;
  converted: number;
}

export default function JBJBrokerDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<BrokerStats>({
    totalLeads: 0,
    contactedToday: 0,
    pendingFollowUp: 0,
    converted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [brokerProfile, setBrokerProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/jbj-broker-dashboard");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBrokerProfile();
      fetchLeads();
    }
  }, [user]);

  const fetchBrokerProfile = async () => {
    const { data } = await supabase
      .from("jbj_brokers")
      .select("*")
      .eq("user_id", user?.id)
      .single();

    setBrokerProfile(data);
  };

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("jbj_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);

      if (error) throw error;
      setLeads(data || []);

      // Calculate stats
      const today = new Date().toISOString().split("T")[0];
      const todayLeads = data?.filter(
        (l) => l.last_contact && l.last_contact.startsWith(today)
      );

      setStats({
        totalLeads: data?.length || 0,
        contactedToday: todayLeads?.length || 0,
        pendingFollowUp: data?.filter((l) => l.status === "follow_up").length || 0,
        converted: data?.filter((l) => l.status === "converted").length || 0,
      });
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleLeadAction = async (leadId: string, action: string) => {
    // Log activity
    await supabase.from("jbj_activity_logs").insert({
      actor: user?.email || "Unknown",
      action,
      target: leadId,
    });

    toast.success(`Action logged: ${action}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <JBJSidebar 
        brokerProfile={brokerProfile} 
        activePage="leads" 
      />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-black border-b border-zinc-800 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gold tracking-wide">
                  My Leads
                </h1>
                <p className="text-gray-400 text-sm">
                  Manage and contact your assigned leads
                </p>
              </div>

              <Button
                className="bg-gold hover:bg-gold-dark text-black font-medium"
                onClick={() => navigate("/jbj-broker-messages")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Total Leads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalLeads}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Contacted Today</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.contactedToday}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Pending Follow-up</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendingFollowUp}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gold/20">
                    <AlertCircle className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Converted</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.converted}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                {["all", "new", "contacted", "follow_up", "qualified", "converted"].map(
                  (status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className={
                        statusFilter === status
                          ? "bg-gold text-black hover:bg-gold-dark"
                          : ""
                      }
                    >
                      {status === "all"
                        ? "All"
                        : status.charAt(0).toUpperCase() +
                          status.slice(1).replace("_", " ")}
                    </Button>
                  )
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-gray-100" : ""}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-gray-100" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Leads Grid */}
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "flex flex-col gap-3"
            }
          >
            {filteredLeads.map((lead) => (
              <JBJLeadCard
                key={lead.id}
                lead={lead}
                viewMode={viewMode}
                onAction={handleLeadAction}
              />
            ))}

            {filteredLeads.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-16 w-16 text-gray-300 mb-4" />
                <h3 className="text-gray-600 text-lg font-medium mb-2">
                  No Leads Found
                </h3>
                <p className="text-gray-400">
                  {searchQuery
                    ? "Try adjusting your search or filters"
                    : "No leads assigned to you yet"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
