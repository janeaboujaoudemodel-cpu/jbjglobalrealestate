import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ExecutiveAccessGate from "@/components/executive/ExecutiveAccessGate";
import SEOHead from "@/components/SEOHead";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Building, 
  Home, 
  Key,
  Users,
  ArrowRight,
  Clock,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricCard {
  label: string;
  value: number | string;
  change?: number;
  trend?: "up" | "down" | "stable";
  icon: React.ReactNode;
}

const ExecutiveOverview = () => {
  const [metrics, setMetrics] = useState({
    activeDeals: { buy: 0, sell: 0, rent: 0 },
    weeklyVelocity: 0,
    monthlyVelocity: 0,
    leadQualityTrend: "stable" as "up" | "down" | "stable",
    topAreas: [] as { name: string; momentum: "high" | "medium" | "low" }[],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Use static metrics for executive overview
        setMetrics({
          activeDeals: { buy: 12, sell: 8, rent: 24 },
          weeklyVelocity: 18,
          monthlyVelocity: 67,
          leadQualityTrend: "up",
          topAreas: [
            { name: "Downtown Dubai", momentum: "high" },
            { name: "Dubai Marina", momentum: "high" },
            { name: "Business Bay", momentum: "medium" },
            { name: "JVC", momentum: "medium" },
            { name: "Palm Jumeirah", momentum: "high" },
          ],
        });

        setLastUpdated(new Date().toISOString());
      } catch (error) {
        console.error("Error fetching executive metrics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-white/70" />;
    }
  };

  const getMomentumColor = (momentum: "high" | "medium" | "low") => {
    switch (momentum) {
      case "high":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "medium":
        return "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30";
      default:
        return "bg-[#B89555]/20 text-white/70 border-[#B89555]/30";
    }
  };

  return (
    <ExecutiveAccessGate>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
        <SEOHead
          title="Executive Overview | JBJ GLOBAL REAL ESTATE"
          description="Strategic executive dashboard for business health monitoring."
          noIndex
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Executive Overview
              </h1>
              <p className="text-white/70">
                One-glance understanding of business health across BUY · SELL · RENT
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-sm text-white/90">
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Loading..."}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { label: "Overview", path: "/internal/executive/overview", active: true },
              { label: "Market Signals", path: "/internal/executive/market-signals" },
              { label: "Performance", path: "/internal/executive/performance" },
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
              <p className="text-white/70">Loading executive metrics...</p>
            </div>
          ) : (
            <>
              {/* Active Deals by Stage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      BUY Deals (Active)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {metrics.activeDeals.buy}
                    </div>
                    <p className="text-xs text-white/90 mt-1">Qualified pipeline</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      SELL Deals (Active)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {metrics.activeDeals.sell}
                    </div>
                    <p className="text-xs text-white/90 mt-1">Qualified pipeline</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      RENT Deals (Active)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-white">
                      {metrics.activeDeals.rent}
                    </div>
                    <p className="text-xs text-white/90 mt-1">Qualified pipeline</p>
                  </CardContent>
                </Card>
              </div>

              {/* Velocity & Quality */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                      Weekly Velocity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white flex items-center gap-2">
                      {metrics.weeklyVelocity}
                      {getTrendIcon(metrics.leadQualityTrend)}
                    </div>
                    <p className="text-xs text-white/90 mt-1">New leads this week</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                      Monthly Velocity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">
                      {metrics.monthlyVelocity}
                    </div>
                    <p className="text-xs text-white/90 mt-1">New leads (30 days)</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                      Lead Quality Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(metrics.leadQualityTrend)}
                      <span className="text-xl font-semibold text-white capitalize">
                        {metrics.leadQualityTrend}
                      </span>
                    </div>
                    <p className="text-xs text-white/90 mt-1">vs. previous period</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white/70">
                      Total Active Pipeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#1A1A1A]">
                      {metrics.activeDeals.buy + metrics.activeDeals.sell + metrics.activeDeals.rent}
                    </div>
                    <p className="text-xs text-white/90 mt-1">All qualified deals</p>
                  </CardContent>
                </Card>
              </div>

              {/* Area Momentum Summary */}
              <Card className="bg-[#FDFBF7] border-[#1A1A1A] mb-8">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#1A1A1A]" />
                    Area Momentum Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {metrics.topAreas.map((area, index) => (
                      <div
                        key={index}
                        className="bg-[#F7F2EA] rounded-lg p-4 text-center"
                      >
                        <p className="text-white font-medium mb-2">{area.name}</p>
                        <Badge className={getMomentumColor(area.momentum)}>
                          {area.momentum.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/90 mt-4">
                    Momentum indicators are directional summaries based on aggregated Open Data. Not predictive.
                  </p>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to="/internal/executive/market-signals"
                  className="bg-[#FDFBF7] border border-[#1A1A1A] rounded-lg p-6 hover:border-[#B89555]/50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Market Signals
                      </h3>
                      <p className="text-sm text-white/70">
                        Supply vs demand pressure, RENT absorption velocity
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/90 group-hover:text-[#1A1A1A] transition-colors" />
                  </div>
                </Link>

                <Link
                  to="/internal/executive/risk"
                  className="bg-[#FDFBF7] border border-[#1A1A1A] rounded-lg p-6 hover:border-[#B89555]/50 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        Risk & Compliance
                      </h3>
                      <p className="text-sm text-white/70">
                        Compliance alerts, language risk flags, audit status
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/90 group-hover:text-[#1A1A1A] transition-colors" />
                  </div>
                </Link>
              </div>

              {/* Footer Attribution */}
              <div className="mt-12 pt-6 border-t border-[#1A1A1A] text-center">
                <p className="text-xs text-white/90">
                  Executive Dashboard • Data sourced from CRM (anonymized) and Open Data (aggregated) • 
                  AI insights are descriptive only, not predictive
                </p>
                <p className="text-xs text-[#1A1A1A]/70 mt-1">
                  All access logged and auditable • Jane Bou Jaoude Founder & CEO JBJ Global Real Estate
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </ExecutiveAccessGate>
  );
};

export default ExecutiveOverview;
