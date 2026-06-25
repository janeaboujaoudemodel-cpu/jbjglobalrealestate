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
    } as any);

    toast.success(`Action logged: ${action}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)] pt-24 lg:pt-28">
      {/* Header */}
      <header className="border-b-2 border-[#B89555]/40 bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] sticky top-20 lg:top-24 z-40 shadow-[0_4px_20px_rgba(200,167,102,0.15)] hover:bg-[#1A1A1A] hover:text-white hover:[&_svg]:text-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(184,149,85,0.35)] transition-all duration-300">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]">
                <Users className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div>
                <h1 className="text-[#1A1A1A] text-xl font-bold tracking-wide">
                  My Leads
                </h1>
                <p className="text-[#1A1A1A]/70 text-sm">
                  Manage and contact your assigned leads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                onClick={() => navigate("/jbj-broker-messages")}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Button>
              <Button
                variant="secondary"
                onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
              >
                Sign Out
              </Button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {["all", "new", "contacted", "follow_up", "qualified", "converted"].map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
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
      </header>

      <main className="px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#FDFBF7] border border-[#B89555]/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#F7F1E6] to-[#D8C7A6]">
                  <Users className="h-5 w-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <p className="text-[#1A1A1A]/70 text-xs">Total Leads</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">
                    {stats.totalLeads}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FDFBF7] border border-[#B89555]/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#F7F1E6] to-[#D8C7A6]">
                  <CheckCircle className="h-5 w-5 text-[color:var(--emerald-1)]" />
                </div>
                <div>
                  <p className="text-[#1A1A1A]/70 text-xs">Contacted Today</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">
                    {stats.contactedToday}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FDFBF7] border border-[#B89555]/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#F7F1E6] to-[#D8C7A6]">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[#1A1A1A]/70 text-xs">Pending Follow-up</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">
                    {stats.pendingFollowUp}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#FDFBF7] border border-[#B89555]/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#F7F1E6] to-[#D8C7A6]">
                  <AlertCircle className="h-5 w-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <p className="text-[#1A1A1A]/70 text-xs">Converted</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">
                    {stats.converted}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/70" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setViewMode("grid")}
              className={viewMode === "grid" ? "bg-[#EFE6D6]/20 border-[#B89555]" : ""}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-[#EFE6D6]/20 border-[#B89555]" : ""}
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
              <Users className="h-16 w-16 text-[#1A1A1A]/70 mb-4" />
              <h3 className="text-[#1A1A1A] text-lg font-medium mb-2">
                No Leads Found
              </h3>
              <p className="text-[#1A1A1A]/70">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "No leads assigned to you yet"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
