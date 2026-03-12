import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Users,
  Bot,
  TrendingUp,
  MessageSquare,
  Phone,
  Mail,
  Settings,
  Search,
  Plus,
  BarChart3,
  Shield,
  Loader2,
  RefreshCw,
  Home,
  LogOut,
} from "lucide-react";
import { AssignLeadModal } from "@/components/jbj-broker/AssignLeadModal";
import { FilterManagerPanel } from "@/components/jbj-broker/FilterManagerPanel";
import { BrokerCapacityPanel } from "@/components/jbj-broker/BrokerCapacityPanel";
import { BrokerPerformanceCard } from "@/components/jbj-broker/BrokerPerformanceCard";

interface Broker {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  capacity: number;
  active_leads: number;
  status: string;
  specialization: string | null;
}

interface DashboardMetrics {
  totalLeads: number;
  activeBrokers: number;
  conversionRate: number;
  messagestoday: number;
  callsToday: number;
  emailsToday: number;
}

export default function JBJBrokerAdmin() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalLeads: 0,
    activeBrokers: 0,
    conversionRate: 0,
    messagestoday: 0,
    callsToday: 0,
    emailsToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"overview" | "filters" | "capacity">("overview");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/jbj-broker-admin");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: brokersData, error: brokersError } = await supabase
        .from("jbj_brokers")
        .select("*")
        .order("name");

      if (brokersError) throw brokersError;
      setBrokers(brokersData || []);

      const today = new Date().toISOString().split("T")[0];
      
      const { count: leadsCount } = await supabase
        .from("jbj_leads")
        .select("*", { count: "exact", head: true });

      const activeBrokersCount = brokersData?.filter(b => b.status === "active").length || 0;

      const { data: messagesData } = await supabase
        .from("jbj_messages")
        .select("channel")
        .gte("created_at", `${today}T00:00:00`);

      const messagesCount = messagesData?.filter(m => m.channel === "whatsapp").length || 0;
      const callsCount = messagesData?.filter(m => m.channel === "call").length || 0;
      const emailsCount = messagesData?.filter(m => m.channel === "email").length || 0;

      const { count: convertedCount } = await supabase
        .from("jbj_leads")
        .select("*", { count: "exact", head: true })
        .eq("status", "converted");

      const conversionRate = leadsCount && leadsCount > 0 
        ? Math.round((convertedCount || 0) / leadsCount * 100) 
        : 0;

      setMetrics({
        totalLeads: leadsCount || 0,
        activeBrokers: activeBrokersCount,
        conversionRate,
        messagestoday: messagesCount,
        callsToday: callsCount,
        emailsToday: emailsCount,
      });

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleBrokerStatusToggle = async (brokerId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    
    const { error } = await supabase
      .from("jbj_brokers")
      .update({ status: newStatus })
      .eq("id", brokerId);

    if (error) {
      toast.error("Failed to update broker status");
      return;
    }

    setBrokers(brokers.map(b => 
      b.id === brokerId ? { ...b, status: newStatus } : b
    ));
    
    toast.success(`Broker ${newStatus === "active" ? "resumed" : "paused"}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const filteredBrokers = brokers.filter(broker =>
    broker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    broker.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header - Layer 2 Active Champagne */}
      <header className="sticky top-0 lg:top-[48px] z-50 border-b border-gold/20">
        <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] px-6 py-4">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black tracking-wide">
                  JBJ Global Real Estate
                </h1>
                <p className="text-black/70 text-sm">Broker Admin Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-black hover:bg-gold/20"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setAssignModalOpen(true)}
                variant="primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Lead
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-black hover:bg-gold/20"
              >
                <Home className="h-4 w-4 mr-2" />
                Back to Site
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-black hover:bg-gold/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6 space-y-6">
        {/* Metrics Cards - Layer 2 */}
        <div className="jj-layer-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-10 h-10">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-black/60 text-xs">Total Leads</p>
                  <p className="text-black text-xl font-bold">{metrics.totalLeads}</p>
                </div>
              </div>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-10 h-10">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-black/60 text-xs">Active Brokers</p>
                  <p className="text-black text-xl font-bold">{metrics.activeBrokers}</p>
                </div>
              </div>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-10 h-10">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-black/60 text-xs">Conversion</p>
                  <p className="text-black text-xl font-bold">{metrics.conversionRate}%</p>
                </div>
              </div>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-10 h-10">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-black/60 text-xs">Messages Today</p>
                  <p className="text-black text-xl font-bold">{metrics.messagestoday}</p>
                </div>
              </div>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-10 h-10">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-black/60 text-xs">Calls Today</p>
                  <p className="text-black text-xl font-bold">{metrics.callsToday}</p>
                </div>
              </div>
            </div>

            <div className="jj-card-inner">
              <div className="flex items-center gap-3">
                <div className="jj-icon-box-active w-10 h-10">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-black/60 text-xs">Emails Today</p>
                  <p className="text-black text-xl font-bold">{metrics.emailsToday}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activePanel === "overview" ? "primary" : "secondary"}
            onClick={() => setActivePanel("overview")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Broker Overview
          </Button>
          <Button
            variant={activePanel === "filters" ? "primary" : "secondary"}
            onClick={() => setActivePanel("filters")}
          >
            <Shield className="h-4 w-4 mr-2" />
            Filter Manager
          </Button>
          <Button
            variant={activePanel === "capacity" ? "primary" : "secondary"}
            onClick={() => setActivePanel("capacity")}
          >
            <Settings className="h-4 w-4 mr-2" />
            Capacity Settings
          </Button>
        </div>

        {/* Main Content Panels */}
        <div className="jj-layer-2">
          {activePanel === "overview" && (
            <div className="space-y-6">
              {/* Search */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/50" />
                  <Input
                    placeholder="Search brokers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Brokers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBrokers.map((broker) => (
                  <BrokerPerformanceCard
                    key={broker.id}
                    broker={broker}
                    onToggleStatus={() => handleBrokerStatusToggle(broker.id, broker.status)}
                  />
                ))}

                {filteredBrokers.length === 0 && (
                  <div className="col-span-full jj-card-inner flex flex-col items-center justify-center py-16 text-center">
                    <Bot className="h-16 w-16 text-black/30 mb-4" />
                    <h3 className="text-black text-lg font-medium mb-2">No Brokers Found</h3>
                    <p className="text-black/60">
                      {searchQuery
                        ? "Try adjusting your search query"
                        : "No brokers configured yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activePanel === "filters" && <FilterManagerPanel />}
          {activePanel === "capacity" && <BrokerCapacityPanel brokers={brokers} onUpdate={fetchData} />}
        </div>
      </div>

      {/* Assign Lead Modal */}
      <AssignLeadModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        brokers={brokers}
        onAssigned={fetchData}
      />
    </div>
  );
}
