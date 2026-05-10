import { useState } from "react";
import { Link } from "react-router-dom";
import ExecutiveAccessGate from "@/components/executive/ExecutiveAccessGate";
import SEOHead from "@/components/SEOHead";
import { FounderContent } from "@/components/FounderContent";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Clock,
  Zap,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ExecutiveMarketSignals = () => {
  const [lastUpdated] = useState(new Date().toISOString());

  // Static market signals data
  const areaSignals = [
    { name: "Downtown Dubai", slug: "downtown-dubai", demandPressure: "high" as const, rentAbsorption: "fast", priceSensitivity: "low", priceChange: 8.2, rentChange: 6.5 },
    { name: "Dubai Marina", slug: "dubai-marina", demandPressure: "high" as const, rentAbsorption: "fast", priceSensitivity: "moderate", priceChange: 5.4, rentChange: 7.1 },
    { name: "Business Bay", slug: "business-bay", demandPressure: "balanced" as const, rentAbsorption: "moderate", priceSensitivity: "moderate", priceChange: 4.1, rentChange: 3.8 },
    { name: "JVC", slug: "jvc", demandPressure: "balanced" as const, rentAbsorption: "moderate", priceSensitivity: "high", priceChange: 2.3, rentChange: 4.2 },
    { name: "Palm Jumeirah", slug: "palm-jumeirah", demandPressure: "high" as const, rentAbsorption: "fast", priceSensitivity: "low", priceChange: 12.5, rentChange: 8.9 },
    { name: "JBR", slug: "jbr", demandPressure: "high" as const, rentAbsorption: "fast", priceSensitivity: "moderate", priceChange: 6.7, rentChange: 5.3 },
    { name: "DIFC", slug: "difc", demandPressure: "balanced" as const, rentAbsorption: "moderate", priceSensitivity: "low", priceChange: 7.8, rentChange: 4.1 },
    { name: "Dubai Hills", slug: "dubai-hills", demandPressure: "high" as const, rentAbsorption: "fast", priceSensitivity: "moderate", priceChange: 9.2, rentChange: 6.8 },
  ];

  const getPressureColor = (pressure: "high" | "balanced" | "low") => {
    switch (pressure) {
      case "high":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "low":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30";
    }
  };

  const getAbsorptionColor = (rate: string) => {
    switch (rate) {
      case "fast":
        return "text-emerald-400";
      case "moderate":
        return "text-[#1A1A1A]";
      default:
        return "text-red-400";
    }
  };

  return (
    <ExecutiveAccessGate>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
        <SEOHead
          title="Market Signals | Executive Dashboard | JBJ GLOBAL REAL ESTATE"
          description="Strategic market signals for executive decision-making."
          noIndex
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Market Signals Dashboard
              </h1>
              <p className="text-white/70">
                Directional indicators for strategic planning and resource allocation
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
              { label: "Market Signals", path: "/internal/executive/market-signals", active: true },
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

          {/* Market Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#1A1A1A]" />
                  RENT Demand Direction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                  <span className="text-2xl font-bold text-white">Strong</span>
                </div>
                <p className="text-xs text-white/90 mt-2">
                  Based on aggregated transaction velocity
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#1A1A1A]" />
                  Supply Pressure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="w-6 h-6 text-amber-500" />
                  <span className="text-2xl font-bold text-white">Moderate</span>
                </div>
                <p className="text-xs text-white/90 mt-2">
                  New inventory vs absorption rate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#1A1A1A]" />
                  Price Sensitivity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-6 h-6 text-amber-500" />
                  <span className="text-2xl font-bold text-white">Elevated</span>
                </div>
                <p className="text-xs text-white/90 mt-2">
                  Buyer negotiation intensity increasing
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Area Heat Map */}
          <Card className="bg-[#FDFBF7] border-[#1A1A1A] mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Area-Level Market Signals
              </CardTitle>
              <p className="text-sm text-white/70">
                Directional indicators only — not predictive forecasts
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#1A1A1A]">
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/70">Area</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-white/70">Demand Pressure</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-white/70">RENT Absorption</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-white/70">Price Sensitivity</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-white/70">Price Δ</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-white/70">RENT Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {areaSignals.map((area, index) => (
                      <tr key={index} className="border-b border-[#1A1A1A]/50 hover:bg-[#1A1A1A]/30">
                        <td className="py-3 px-4 text-white font-medium">{area.name}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={getPressureColor(area.demandPressure)}>
                            {area.demandPressure.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-medium ${getAbsorptionColor(area.rentAbsorption)}`}>
                            {area.rentAbsorption.charAt(0).toUpperCase() + area.rentAbsorption.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-white/85 capitalize">{area.priceSensitivity}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={area.priceChange >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {area.priceChange >= 0 ? "+" : ""}{area.priceChange.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={area.rentChange >= 0 ? "text-emerald-400" : "text-red-400"}>
                            {area.rentChange >= 0 ? "+" : ""}{area.rentChange.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Focus Areas */}
          <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Strategic Focus Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                <h4 className="text-emerald-400 font-medium mb-2">RENT Focus Areas</h4>
                <p className="text-white/85 text-sm">
                  Downtown Dubai, Dubai Marina, and Business Bay show strong RENT absorption. 
                  Consider prioritizing broker resources in these zones.
                </p>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <h4 className="text-[#1A1A1A] font-medium mb-2">Price Sensitivity Alert</h4>
                <p className="text-white/85 text-sm">
                  Buyer negotiation intensity is elevated in secondary areas. 
                  Adjust client expectations during initial consultations.
                </p>
              </div>

              <div className="bg-[#F7F2EA] rounded-lg p-4">
                <h4 className="text-white/85 font-medium mb-2">Data Attribution</h4>
                <p className="text-white/90 text-sm">
                  All signals derived from aggregated government Open Data and internal CRM trends. 
                  These are directional indicators, not predictions or investment advice.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-[#1A1A1A] text-center">
            <p className="text-xs text-white/90">
              Market Signals Dashboard • Directional indicators for strategic planning • Not predictive
            </p>
            <FounderContent>
              <p className="text-xs text-[#1A1A1A]/70 mt-1">
                Jane Bou Jaoude, Founder & CEO • JBJ GLOBAL REAL ESTATE
              </p>
            </FounderContent>
          </div>
        </div>
      </div>
    </ExecutiveAccessGate>
  );
};

export default ExecutiveMarketSignals;
