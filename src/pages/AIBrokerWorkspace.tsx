import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bot,
  Users,
  MessageSquare,
  Mail,
  Phone,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  Clock,
  BarChart3,
  Send,
} from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { AIBrokerLeadCard } from "@/components/ai-broker/AIBrokerLeadCard";
import { AIBrokerConversations } from "@/components/ai-broker/AIBrokerConversations";
import { AIBrokerActivityFeed } from "@/components/ai-broker/AIBrokerActivityFeed";

interface AIBroker {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  status: string;
  total_leads_handled: number | null;
  total_conversions: number | null;
  current_daily_interactions: number | null;
  daily_interaction_limit: number | null;
  average_response_time_seconds: number | null;
}

interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  interest_note: string | null;
  pipeline_status: string | null;
  created_at: string;
  source_id: string | null;
}

interface DailyStats {
  leads_contacted: number;
  messages_sent: number;
  emails_sent: number;
  calls_made: number;
  leads_converted: number;
}

export default function AIBrokerWorkspace() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [activeBroker, setActiveBroker] = useState<AIBroker | null>(null);
  const [brokers, setBrokers] = useState<AIBroker[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    leads_contacted: 0,
    messages_sent: 0,
    emails_sent: 0,
    calls_made: 0,
    leads_converted: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/ai-broker-workspace");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch AI brokers
      const { data: brokersData, error: brokersError } = await supabase
        .from("ai_brokers")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (brokersError) throw brokersError;
      setBrokers(brokersData || []);

      if (brokersData && brokersData.length > 0) {
        setActiveBroker(brokersData[0]);
        await fetchBrokerData(brokersData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load workspace data");
    } finally {
      setLoading(false);
    }
  };

  const fetchBrokerData = async (brokerId: string) => {
    try {
      // Fetch assigned leads
      const { data: leadsData } = await supabase
        .from("crm_leads")
        .select("id, full_name, interest_note, created_at, source_id")
        .order("created_at", { ascending: false })
        .limit(50);

      // Map data to match Lead interface
      const mappedLeads: Lead[] = (leadsData || []).map((lead: any) => ({
        id: lead.id,
        full_name: lead.full_name,
        email: null,
        phone: null,
        interest_note: lead.interest_note,
        pipeline_status: null,
        created_at: lead.created_at,
        source_id: lead.source_id,
      }));

      setLeads(mappedLeads);

      // Fetch daily stats
      const today = new Date().toISOString().split("T")[0];
      const { data: statsData } = await supabase
        .from("broker_daily_stats")
        .select("*")
        .eq("broker_id", brokerId)
        .eq("stat_date", today)
        .single();

      if (statsData) {
        setDailyStats({
          leads_contacted: statsData.leads_contacted || 0,
          messages_sent: statsData.messages_sent || 0,
          emails_sent: statsData.emails_sent || 0,
          calls_made: statsData.calls_made || 0,
          leads_converted: statsData.leads_converted || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching broker data:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (activeBroker) {
      await fetchBrokerData(activeBroker.id);
    }
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleBrokerSwitch = async (broker: AIBroker) => {
    setActiveBroker(broker);
    await fetchBrokerData(broker.id);
  };

  const filteredLeads = leads.filter(
    (lead) =>
      lead.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery)
  );

  const capacityUsed = activeBroker?.current_daily_interactions || 0;
  const capacityLimit = activeBroker?.daily_interaction_limit || 150;
  const capacityPercent = Math.min((capacityUsed / capacityLimit) * 100, 100);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <BrandedLoader text="Loading..." className="min-h-screen" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-black border-b border-zinc-800 sticky top-0 lg:top-[48px] z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gold tracking-wide">
                JBJ GLOBAL REAL ESTATE
              </h1>
              <Badge variant="outline" className="border-gold/30 text-gold">
                AI Broker Workspace
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Broker Selector */}
              <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2">
                <Bot className="h-4 w-4 text-gold" />
                <select
                  value={activeBroker?.id || ""}
                  onChange={(e) => {
                    const broker = brokers.find((b) => b.id === e.target.value);
                    if (broker) handleBrokerSwitch(broker);
                  }}
                  className="bg-transparent text-white text-sm border-none focus:outline-none"
                >
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id} className="bg-zinc-900">
                      {broker.name}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Broker Profile */}
        <aside className="w-64 bg-black border-r border-zinc-800 min-h-[calc(100vh-65px)] p-4">
          {activeBroker && (
            <div className="space-y-6">
              {/* Broker Card */}
              <div className="text-center">
                {/* GLOBAL IMAGE RULE - LOCKED: No cropping, perfect centering */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-dark mx-auto mb-3 flex items-center justify-center">
                  {activeBroker.avatar_url ? (
                    <img
                      src={activeBroker.avatar_url}
                      alt={activeBroker.name}
                      className="w-full h-full rounded-full bg-zinc-950"
                      style={{ objectFit: "cover", objectPosition: "center 15%" }}
                    />
                  ) : (
                    <span className="text-black text-2xl font-bold">
                      {activeBroker.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  )}
                </div>
                <h2 className="text-white font-semibold">{activeBroker.name}</h2>
                <p className="text-gray-400 text-sm">{activeBroker.email}</p>
                <Badge className="mt-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Active
                </Badge>
              </div>

              {/* Capacity Bar */}
              <div className="bg-zinc-900 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Daily Capacity</span>
                  <span className="text-white">{capacityUsed}/{capacityLimit}</span>
                </div>
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      capacityPercent > 90
                        ? "bg-red-500"
                        : capacityPercent > 70
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Leads Today
                  </span>
                  <span className="text-white font-medium">{dailyStats.leads_contacted}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </span>
                  <span className="text-white font-medium">{dailyStats.messages_sent}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Emails
                  </span>
                  <span className="text-white font-medium">{dailyStats.emails_sent}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Calls
                  </span>
                  <span className="text-white font-medium">{dailyStats.calls_made}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Conversions
                  </span>
                  <span className="text-emerald-400 font-medium">{dailyStats.leads_converted}</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1 pt-4 border-t border-zinc-800">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                  <Users className="h-4 w-4 mr-3" />
                  My Leads
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  Conversations
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-zinc-800"
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Analytics
                </Button>
              </nav>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-zinc-950">
          <Tabs defaultValue="leads" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-zinc-900 border border-zinc-800">
                <TabsTrigger
                  value="leads"
                  className="data-[state=active]:bg-gold data-[state=active]:text-black"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Leads ({filteredLeads.length})
                </TabsTrigger>
                <TabsTrigger
                  value="conversations"
                  className="data-[state=active]:bg-gold data-[state=active]:text-black"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Conversations
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-gold data-[state=active]:text-black"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-zinc-900 border-zinc-700 text-white w-64"
                  />
                </div>
                <Button variant="outline" className="border-zinc-700 text-gray-300">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <TabsContent value="leads">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredLeads.map((lead) => (
                  <AIBrokerLeadCard
                    key={lead.id}
                    lead={lead}
                    brokerId={activeBroker?.id || ""}
                    brokerName={activeBroker?.name || ""}
                  />
                ))}

                {filteredLeads.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <Users className="h-16 w-16 text-gray-600 mb-4" />
                    <h3 className="text-white text-lg font-medium mb-2">No Leads Found</h3>
                    <p className="text-gray-400">
                      {searchQuery
                        ? "Try adjusting your search query"
                        : "Leads will appear here when assigned"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="conversations">
              <AIBrokerConversations brokerId={activeBroker?.id || ""} />
            </TabsContent>

            <TabsContent value="activity">
              <AIBrokerActivityFeed brokerId={activeBroker?.id || ""} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
