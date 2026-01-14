import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, TrendingUp, Target, Award, 
  ArrowUpRight, ArrowDownRight, Briefcase
} from "lucide-react";

interface DealStats {
  totalPipeline: number;
  wonDeals: number;
  lostDeals: number;
  conversionRate: number;
  averageDealSize: number;
  forecastedRevenue: number;
  stageBreakdown: { stage: string; value: number; count: number }[];
}

interface DealValueTrackerProps {
  userId: string;
}

const DealValueTracker = ({ userId }: DealValueTrackerProps) => {
  const [stats, setStats] = useState<DealStats>({
    totalPipeline: 0,
    wonDeals: 0,
    lostDeals: 0,
    conversionRate: 0,
    averageDealSize: 0,
    forecastedRevenue: 0,
    stageBreakdown: []
  });
  const [loading, setLoading] = useState(true);

  // Average deal value assumption (could be stored per lead in the future)
  const AVERAGE_DEAL_VALUE_AED = 2500000; // 2.5M AED average property value

  useEffect(() => {
    calculateStats();
  }, [userId]);

  const calculateStats = async () => {
    setLoading(true);
    try {
      // Fetch all lead states for this user
      const { data: statesData } = await supabase
        .from("crm_lead_state_per_user")
        .select("pipeline_status, lead_id")
        .eq("user_id", userId);

      // Handle empty data gracefully
      if (!statesData || statesData.length === 0) {
        setStats({
          totalPipeline: 0,
          wonDeals: 0,
          lostDeals: 0,
          conversionRate: 0,
          averageDealSize: AVERAGE_DEAL_VALUE_AED,
          forecastedRevenue: 0,
          stageBreakdown: []
        });
        setLoading(false);
        return;
      }

      // Count by status
      const statusCounts: Record<string, number> = {};
      statesData.forEach(state => {
        const status = state.pipeline_status || "new";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const wonCount = statusCounts["won"] || 0;
      const lostCount = statusCounts["lost"] || 0;
      const totalClosed = wonCount + lostCount;
      
      // Calculate probability weights for each stage
      const stageProbabilities: Record<string, number> = {
        "new": 0.05,
        "contacted": 0.10,
        "interested": 0.25,
        "qualified": 0.40,
        "proposal": 0.60,
        "negotiation": 0.80,
        "viewing_scheduled": 0.50,
        "documents_requested": 0.70,
        "won": 1.0,
        "lost": 0,
        "junk": 0,
        "no_answer": 0.05,
        "callback": 0.15,
        "not_interested": 0,
        "wrong_number": 0,
        "duplicate": 0
      };

      // Calculate pipeline value and stage breakdown
      let totalPipelineValue = 0;
      let forecastedValue = 0;
      const stageBreakdown: { stage: string; value: number; count: number }[] = [];

      Object.entries(statusCounts).forEach(([status, count]) => {
        if (status !== "won" && status !== "lost" && status !== "junk") {
          const stageValue = count * AVERAGE_DEAL_VALUE_AED;
          const probability = stageProbabilities[status] || 0.1;
          
          totalPipelineValue += stageValue;
          forecastedValue += stageValue * probability;

          stageBreakdown.push({
            stage: status,
            value: stageValue,
            count
          });
        }
      });

      // Sort by value descending
      stageBreakdown.sort((a, b) => b.value - a.value);

      setStats({
        totalPipeline: totalPipelineValue,
        wonDeals: wonCount,
        lostDeals: lostCount,
        conversionRate: totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0,
        averageDealSize: AVERAGE_DEAL_VALUE_AED,
        forecastedRevenue: forecastedValue,
        stageBreakdown: stageBreakdown.slice(0, 5)
      });
    } catch (err) {
      console.error("Failed to calculate deal stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `AED ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `AED ${(value / 1000).toFixed(0)}K`;
    }
    return `AED ${value.toFixed(0)}`;
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      "new": "bg-blue-500",
      "contacted": "bg-cyan-500",
      "interested": "bg-emerald-500",
      "qualified": "bg-green-500",
      "proposal": "bg-amber-500",
      "negotiation": "bg-orange-500",
      "viewing_scheduled": "bg-purple-500",
      "documents_requested": "bg-pink-500"
    };
    return colors[stage] || "bg-gray-500";
  };

  if (loading) {
    return (
      <Card className="border-border bg-white">
        <CardContent className="py-8 text-center text-zinc-600">
          Calculating pipeline...
        </CardContent>
      </Card>
    );
  }

  // Empty state when no data
  const hasNoData = stats.totalPipeline === 0 && stats.wonDeals === 0 && stats.lostDeals === 0;

  return (
    <div className="space-y-4">
      {/* Empty State Message */}
      {hasNoData && (
        <Card className="border-border bg-white">
          <CardContent className="py-8 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p className="text-zinc-800 font-semibold mb-1">No active data yet</p>
            <p className="text-zinc-500 text-sm">Start adding leads to see your pipeline metrics.</p>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Row - evenly aligned with consistent height */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Value */}
        <Card className="border-zinc-200 bg-white shadow-lg h-full">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-gold/20">
                <Briefcase className="h-5 w-5 text-gold" />
              </div>
              <Badge variant="outline" className="text-xs border-gold/30 text-gold px-3 py-1">
                Pipeline
              </Badge>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight flex-1">
              {hasNoData ? "—" : formatCurrency(stats.totalPipeline)}
            </p>
            <p className="text-xs text-zinc-500 mt-2">Total active deals</p>
          </CardContent>
        </Card>

        {/* Forecasted */}
        <Card className="border-zinc-200 bg-white shadow-lg h-full">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-600 px-3 py-1">
                Forecast
              </Badge>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-emerald-600 tracking-tight flex-1">
              {hasNoData ? "—" : formatCurrency(stats.forecastedRevenue)}
            </p>
            <p className="text-xs text-zinc-500 mt-2">Weighted probability</p>
          </CardContent>
        </Card>

        {/* Conversion */}
        <Card className="border-zinc-200 bg-white shadow-lg h-full">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-amber-500/20">
                <Target className="h-5 w-5 text-amber-500" />
              </div>
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-600 px-3 py-1">
                Conversion
              </Badge>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-amber-600 tracking-tight flex-1">
              {hasNoData ? "—" : `${stats.conversionRate.toFixed(1)}%`}
            </p>
            <p className="text-xs text-zinc-500 mt-2">Won vs Lost</p>
          </CardContent>
        </Card>

        {/* Won Deals */}
        <Card className="border-zinc-200 bg-white shadow-lg h-full">
          <CardContent className="p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <Award className="h-5 w-5 text-green-500" />
              </div>
              <Badge variant="outline" className="text-xs border-green-500/30 text-green-600 px-3 py-1">
                Won
              </Badge>
            </div>
            <div className="flex items-baseline gap-2 flex-1">
              <p className="text-2xl md:text-3xl font-bold text-green-600 tracking-tight">{stats.wonDeals}</p>
              <span className="text-sm text-red-500 font-medium">/ {stats.lostDeals} lost</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Closed deals</p>
          </CardContent>
        </Card>
      </div>

      {/* Stage Breakdown */}
      <Card className="border-zinc-200 bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-zinc-900 font-bold text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pipeline by Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.stageBreakdown.length === 0 ? (
            <div className="text-center text-zinc-500 py-4">
              No active deals in pipeline
            </div>
          ) : (
            <div className="space-y-3">
              {stats.stageBreakdown.map((stage, index) => {
                const percentage = (stage.value / stats.totalPipeline) * 100;
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${getStageColor(stage.stage)}`} />
                        <span className="text-sm font-medium text-zinc-800 capitalize">
                          {stage.stage.replace(/_/g, " ")}
                        </span>
                        <Badge variant="secondary" className="text-xs bg-zinc-100 text-zinc-700">
                          {stage.count} leads
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-zinc-900">
                        {formatCurrency(stage.value)}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DealValueTracker;
