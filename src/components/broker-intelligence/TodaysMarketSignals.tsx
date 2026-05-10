import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, MapPin, Clock, AlertTriangle, Zap } from "lucide-react";
import { DUBAI_AREAS_MARKET_DATA } from "@/config/open-data-config";

interface MarketSignal {
  area: string;
  signalType: "rent_demand" | "price_momentum" | "supply_alert" | "opportunity";
  strength: "high" | "medium" | "low";
  direction: "up" | "down" | "stable";
  message: string;
  actionHint: string;
}

export function TodaysMarketSignals() {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    // Generate signals from market data
    const generatedSignals: MarketSignal[] = [];

    DUBAI_AREAS_MARKET_DATA.forEach((area) => {
      // Rent demand signals
      if (area.rentalIndex > 130) {
        generatedSignals.push({
          area: area.area,
          signalType: "rent_demand",
          strength: "high",
          direction: "up",
          message: `Strong rent demand in ${area.area}`,
          actionHint: "Prioritize qualified tenants; prepare landlords for faster decisions",
        });
      }

      // Price momentum
      if (area.yoyChange > 8) {
        generatedSignals.push({
          area: area.area,
          signalType: "price_momentum",
          strength: "high",
          direction: "up",
          message: `Price momentum accelerating (+${area.yoyChange}% YoY)`,
          actionHint: "Focus on value drivers over headline pricing",
        });
      }

      // Supply alerts
      if (area.supplyScore < 40) {
        generatedSignals.push({
          area: area.area,
          signalType: "supply_alert",
          strength: "high",
          direction: "down",
          message: `Limited inventory in ${area.area}`,
          actionHint: "Set buyer expectations; emphasize urgency appropriately",
        });
      }

      // Opportunities
      if (area.demandScore > 80 && area.supplyScore < 50) {
        generatedSignals.push({
          area: area.area,
          signalType: "opportunity",
          strength: "high",
          direction: "up",
          message: `Demand outpacing supply in ${area.area}`,
          actionHint: "Faster deal velocity expected; maintain pipeline focus",
        });
      }
    });

    // Sort by strength and limit to top signals
    const sortedSignals = generatedSignals
      .sort((a, b) => {
        const strengthOrder = { high: 0, medium: 1, low: 2 };
        return strengthOrder[a.strength] - strengthOrder[b.strength];
      })
      .slice(0, 8);

    setSignals(sortedSignals);
    setLastUpdated(new Date().toLocaleTimeString("en-AE", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const getSignalIcon = (type: MarketSignal["signalType"]) => {
    switch (type) {
      case "rent_demand":
        return <Activity className="w-4 h-4" />;
      case "price_momentum":
        return <TrendingUp className="w-4 h-4" />;
      case "supply_alert":
        return <AlertTriangle className="w-4 h-4" />;
      case "opportunity":
        return <Zap className="w-4 h-4" />;
    }
  };

  const getStrengthBadge = (strength: MarketSignal["strength"]) => {
    switch (strength) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">High</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30 text-xs">Medium</Badge>;
      case "low":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Low</Badge>;
    }
  };

  const getSignalTypeBadge = (type: MarketSignal["signalType"]) => {
    switch (type) {
      case "rent_demand":
        return <Badge variant="outline" className="text-blue-400 border-blue-400/30 text-xs">Rent</Badge>;
      case "price_momentum":
        return <Badge variant="outline" className="text-emerald-400 border-emerald-400/30 text-xs">Price</Badge>;
      case "supply_alert":
        return <Badge variant="outline" className="text-[#1A1A1A] border-amber-400/30 text-xs">Supply</Badge>;
      case "opportunity":
        return <Badge variant="outline" className="text-[#1A1A1A] border-[#B89555]/30 text-xs">Opportunity</Badge>;
    }
  };

  return (
    <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#1A1A1A]" />
            Today's Market Signals
          </CardTitle>
          <div className="flex items-center gap-2 text-white/90 text-xs">
            <Clock className="w-3 h-3" />
            Updated {lastUpdated}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {signals.length === 0 ? (
          <div className="text-center py-8 text-white/90">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No active signals today</p>
          </div>
        ) : (
          signals.map((signal, index) => (
            <div
              key={index}
              className="bg-[#1A1A1A]/50 rounded-lg p-3 border border-[#1A1A1A]/50 hover:border-[#B89555]/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${
                    signal.signalType === "opportunity" ? "bg-[#EFE6D6]/10 text-[#1A1A1A]" :
                    signal.signalType === "supply_alert" ? "bg-amber-500/10 text-[#1A1A1A]" :
                    signal.signalType === "rent_demand" ? "bg-blue-500/10 text-blue-400" :
                    "bg-emerald-500/10 text-emerald-400"
                  }`}>
                    {getSignalIcon(signal.signalType)}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-white/90" />
                    <span className="text-white font-medium text-sm">{signal.area}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getSignalTypeBadge(signal.signalType)}
                  {getStrengthBadge(signal.strength)}
                </div>
              </div>
              <p className="text-white/85 text-sm mb-2">{signal.message}</p>
              <p className="text-white/90 text-xs italic">
                💡 {signal.actionHint}
              </p>
            </div>
          ))
        )}

        <div className="pt-3 border-t border-[#1A1A1A]">
          <p className="text-[#1A1A1A]/70 text-xs text-center">
            Internal signals based on aggregated Open Data · Descriptive only, not advice
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default TodaysMarketSignals;
