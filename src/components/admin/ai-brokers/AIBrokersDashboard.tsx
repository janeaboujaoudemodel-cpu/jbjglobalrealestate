import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Users,
  Settings,
  Shield,
  BarChart3,
  Bot,
  RefreshCw,
  Loader2,
  PieChart,
} from "lucide-react";
import { AIBrokerCard } from "./AIBrokerCard";
import { AIBrokerEditDialog } from "./AIBrokerEditDialog";
import { AIBrokerStatsDialog } from "./AIBrokerStatsDialog";
import { LeadAssignmentRulesPanel } from "./LeadAssignmentRulesPanel";
import { MessageFiltersPanel } from "./MessageFiltersPanel";
import { PipelineAnalyticsPanel } from "./PipelineAnalyticsPanel";
import type { AIBroker } from "./types";

export function AIBrokersDashboard() {
  const [brokers, setBrokers] = useState<AIBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingBroker, setEditingBroker] = useState<AIBroker | null>(null);
  const [viewingStatsId, setViewingStatsId] = useState<string | null>(null);
  const [viewingStatsBrokerName, setViewingStatsBrokerName] = useState("");

  useEffect(() => {
    fetchBrokers();
  }, []);

  const fetchBrokers = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_brokers")
        .select("*")
        .order("name");

      if (error) throw error;
      setBrokers(data || []);
    } catch (error) {
      console.error("Error fetching brokers:", error);
      toast.error("Failed to load AI brokers");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBrokers();
    setRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleStatusChange = async (
    brokerId: string,
    status: "active" | "paused"
  ) => {
    try {
      const { error } = await supabase
        .from("ai_brokers")
        .update({ status })
        .eq("id", brokerId);

      if (error) throw error;

      setBrokers((prev) =>
        prev.map((b) => (b.id === brokerId ? { ...b, status } : b))
      );
      toast.success(`Broker ${status === "active" ? "activated" : "paused"}`);
    } catch (error) {
      toast.error("Failed to update broker status");
    }
  };

  const handleEditBroker = (broker: AIBroker) => {
    setEditingBroker(broker);
  };

  const handleSaveBroker = async (brokerData: Partial<AIBroker>) => {
    if (!brokerData.id) return;

    try {
      const { error } = await supabase
        .from("ai_brokers")
        .update({
          name: brokerData.name,
          email: brokerData.email,
          phone: brokerData.phone,
          bio: brokerData.bio,
          avatar_url: brokerData.avatar_url,
          personality_prompt: brokerData.personality_prompt,
          specialization: brokerData.specialization,
          languages: brokerData.languages,
          daily_interaction_limit: brokerData.daily_interaction_limit,
          response_delay_min_seconds: brokerData.response_delay_min_seconds,
          response_delay_max_seconds: brokerData.response_delay_max_seconds,
          working_hours_start: brokerData.working_hours_start,
          working_hours_end: brokerData.working_hours_end,
          working_days: brokerData.working_days,
        })
        .eq("id", brokerData.id);

      if (error) throw error;

      setBrokers((prev) =>
        prev.map((b) =>
          b.id === brokerData.id ? { ...b, ...brokerData } : b
        )
      );
      setEditingBroker(null);
      toast.success("Broker settings updated");
    } catch (error) {
      toast.error("Failed to update broker");
    }
  };

  const handleViewStats = (brokerId: string) => {
    const broker = brokers.find((b) => b.id === brokerId);
    if (broker) {
      setViewingStatsId(brokerId);
      setViewingStatsBrokerName(broker.name);
    }
  };

  // Calculate summary stats
  const totalLeads = brokers.reduce(
    (sum, b) => sum + (b.total_leads_handled || 0),
    0
  );
  const totalConversions = brokers.reduce(
    (sum, b) => sum + (b.total_conversions || 0),
    0
  );
  const activeBrokers = brokers.filter((b) => b.status === "active").length;
  const avgConversionRate =
    totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : "0";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="h-8 w-8 text-gold" />
          <div>
            <h1 className="text-white text-2xl font-bold">AI Brokers</h1>
            <p className="text-gray-400 text-sm">
              Manage your virtual sales team
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="border-zinc-700 text-gray-300 hover:bg-zinc-800"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Bot className="h-4 w-4" />
              <span className="text-sm">Active Brokers</span>
            </div>
            <p className="text-white text-2xl font-bold">
              {activeBrokers}
              <span className="text-gray-500 text-sm font-normal">
                /{brokers.length}
              </span>
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Total Leads Handled</span>
            </div>
            <p className="text-white text-2xl font-bold">
              {totalLeads.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">Total Conversions</span>
            </div>
            <p className="text-white text-2xl font-bold">
              {totalConversions.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm">Avg Conversion Rate</span>
            </div>
            <p className="text-white text-2xl font-bold">{avgConversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="brokers" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger
            value="brokers"
            className="data-[state=active]:bg-gold data-[state=active]:text-black"
          >
            <Bot className="h-4 w-4 mr-2" />
            Brokers
          </TabsTrigger>
          <TabsTrigger
            value="pipelines"
            className="data-[state=active]:bg-gold data-[state=active]:text-black"
          >
            <PieChart className="h-4 w-4 mr-2" />
            Pipeline Analytics
          </TabsTrigger>
          <TabsTrigger
            value="assignment"
            className="data-[state=active]:bg-gold data-[state=active]:text-black"
          >
            <Settings className="h-4 w-4 mr-2" />
            Lead Assignment
          </TabsTrigger>
          <TabsTrigger
            value="filters"
            className="data-[state=active]:bg-gold data-[state=active]:text-black"
          >
            <Shield className="h-4 w-4 mr-2" />
            Message Filters
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brokers" className="space-y-6">
          {brokers.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bot className="h-16 w-16 text-gray-600 mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">
                  No AI Brokers Configured
                </h3>
                <p className="text-gray-400 text-center max-w-md">
                  AI brokers haven't been set up yet. They will appear here once
                  configured in the database.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {brokers.map((broker) => (
                <AIBrokerCard
                  key={broker.id}
                  broker={broker}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditBroker}
                  onViewStats={handleViewStats}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipelines">
          <PipelineAnalyticsPanel />
        </TabsContent>

        <TabsContent value="assignment">
          <LeadAssignmentRulesPanel />
        </TabsContent>

        <TabsContent value="filters">
          <MessageFiltersPanel />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <AIBrokerEditDialog
        broker={editingBroker}
        open={!!editingBroker}
        onOpenChange={(open) => !open && setEditingBroker(null)}
        onSave={handleSaveBroker}
      />

      {/* Stats Dialog */}
      <AIBrokerStatsDialog
        brokerId={viewingStatsId}
        brokerName={viewingStatsBrokerName}
        open={!!viewingStatsId}
        onOpenChange={(open) => !open && setViewingStatsId(null)}
      />
    </div>
  );
}
