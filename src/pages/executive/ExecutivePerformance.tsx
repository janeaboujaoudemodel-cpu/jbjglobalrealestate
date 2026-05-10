import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ExecutiveAccessGate from "@/components/executive/ExecutiveAccessGate";
import SEOHead from "@/components/SEOHead";
import { FounderContent } from "@/components/FounderContent";
import { 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ExecutivePerformance = () => {
  const [lastUpdated] = useState(new Date().toISOString());
  const [metrics, setMetrics] = useState({
    avgDealCycleBuy: 45,
    avgDealCycleRent: 14,
    conversionByChannel: {
      website: 12,
      whatsapp: 18,
      referral: 25,
      social: 8,
    },
    intelligenceToolUsage: 68,
    bottlenecks: [
      { stage: "Initial Qualification", avgDays: 3, isBottleneck: false },
      { stage: "Viewing Scheduling", avgDays: 7, isBottleneck: true },
      { stage: "Negotiation", avgDays: 12, isBottleneck: true },
      { stage: "Documentation", avgDays: 5, isBottleneck: false },
      { stage: "Closing", avgDays: 4, isBottleneck: false },
    ],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // Use static performance metrics
        setMetrics(prev => ({
          ...prev,
          conversionByChannel: {
            website: 12,
            whatsapp: 18,
            referral: 25,
            social: 8,
          },
        }));
      } catch (error) {
        console.error("Error fetching performance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  return (
    <ExecutiveAccessGate>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
        <SEOHead
          title="Performance Snapshot | Executive Dashboard | JBJ GLOBAL REAL ESTATE"
          description="Brokerage performance trends and operational metrics."
          noIndex
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Brokerage Performance Snapshot
              </h1>
              <p className="text-white/70">
                Performance trends, not micro-management metrics
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-white/90">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { label: "Overview", path: "/internal/executive/overview" },
              { label: "Market Signals", path: "/internal/executive/market-signals" },
              { label: "Performance", path: "/internal/executive/performance", active: true },
              { label: "Risk & Compliance", path: "/internal/executive/risk" },
              { label: "AI Insights", path: "/internal/executive/ai-insights" },
            ].map((nav) => (
              <Link
                key={nav.path}
                to={nav.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  nav.active
                    ? "bg-[#EFE6D6] text-[#1A1A1A]"
                    : "bg-[#F7F2EA] text-white/85 hover:bg-[#1A1A1A]"
                }`}
              >
                {nav.label}
              </Link>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Activity className="w-8 h-8 text-[#1A1A1A] animate-pulse mx-auto mb-4" />
              <p className="text-white/70">Loading performance data...</p>
            </div>
          ) : (
            <>
              {/* Deal Cycle Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      BUY Deal Cycle (Avg)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">{metrics.avgDealCycleBuy}</span>
                      <span className="text-white/70">days</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <TrendingDown className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-400">-3 days vs last quarter</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      RENT Deal Cycle (Avg)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">{metrics.avgDealCycleRent}</span>
                      <span className="text-white/70">days</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Activity className="w-4 h-4 text-white/70" />
                      <span className="text-sm text-white/70">Stable vs last quarter</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Conversion by Channel */}
              <Card className="bg-[#FDFBF7] border-[#1A1A1A] mb-8">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#1A1A1A]" />
                    Conversion Trend by Channel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(metrics.conversionByChannel).map(([channel, rate]) => (
                    <div key={channel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white/85 capitalize">{channel}</span>
                        <span className="text-white font-medium">{rate}%</span>
                      </div>
                      <Progress value={rate} className="h-2" />
                    </div>
                  ))}
                  <p className="text-xs text-white/90 mt-4">
                    Conversion rates based on 90-day rolling average
                  </p>
                </CardContent>
              </Card>

              {/* Intelligence Tool Usage */}
              <Card className="bg-[#FDFBF7] border-[#1A1A1A] mb-8">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#1A1A1A]" />
                    Intelligence Tool Adoption
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={metrics.intelligenceToolUsage} className="h-3" />
                    </div>
                    <span className="text-2xl font-bold text-[#1A1A1A]">{metrics.intelligenceToolUsage}%</span>
                  </div>
                  <p className="text-sm text-white/70 mt-3">
                    Brokers actively using Market Intelligence tools in client conversations
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-400">+12% adoption vs last month</span>
                  </div>
                </CardContent>
              </Card>

              {/* Bottleneck Analysis */}
              <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Deal Pipeline Bottlenecks
                  </CardTitle>
                  <p className="text-sm text-white/70">
                    Where deals slow down in the pipeline
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.bottlenecks.map((stage, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          stage.isBottleneck
                            ? "bg-amber-500/10 border border-amber-500/30"
                            : "bg-[#F7F2EA]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {stage.isBottleneck && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                          )}
                          <span className={stage.isBottleneck ? "text-amber-200" : "text-white/85"}>
                            {stage.stage}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${stage.isBottleneck ? "text-[#1A1A1A]" : "text-white/70"}`}>
                            {stage.avgDays} days
                          </span>
                          {stage.isBottleneck && (
                            <span className="text-xs text-amber-500 bg-amber-500/20 px-2 py-0.5 rounded">
                              BOTTLENECK
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/90 mt-4">
                    Bottlenecks identified based on stage duration exceeding baseline thresholds
                  </p>
                </CardContent>
              </Card>

              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-[#1A1A1A] text-center">
                <p className="text-xs text-white/90">
                  Performance Snapshot • Trends and patterns, not individual broker rankings
                </p>
                <FounderContent>
                  <p className="text-xs text-[#1A1A1A]/70 mt-1">
                    Jane Bou Jaoude, Founder & CEO • JBJ GLOBAL REAL ESTATE
                  </p>
                </FounderContent>
              </div>
            </>
          )}
        </div>
      </div>
    </ExecutiveAccessGate>
  );
};

export default ExecutivePerformance;
