import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, MapPin, Home, Building2, Info } from "lucide-react";
import { DUBAI_AREAS_MARKET_DATA } from "@/config/open-data-config";

interface LeadMarketContextProps {
  leadArea?: string;
  leadIntent?: "buy" | "sell" | "rent";
  compact?: boolean;
}

export function LeadMarketContext({ leadArea, leadIntent = "buy", compact = false }: LeadMarketContextProps) {
  const areaData = useMemo(() => {
    if (!leadArea) return null;
    
    // Find matching area (fuzzy match)
    return DUBAI_AREAS_MARKET_DATA.find(
      (a) => a.area.toLowerCase().includes(leadArea.toLowerCase()) ||
             leadArea.toLowerCase().includes(a.area.toLowerCase())
    ) || null;
  }, [leadArea]);

  const getContextNarrative = () => {
    if (!areaData) return null;

    const demandSupplyRatio = areaData.demandScore / areaData.supplyScore;
    
    if (leadIntent === "rent") {
      if (areaData.rentalIndex > 130) {
        return {
          summary: "Strong rent demand",
          detail: "High rental activity in this area. Tenants should be prepared to move quickly. Landlords may have multiple inquiries.",
          urgency: "high"
        };
      } else if (areaData.rentalIndex > 110) {
        return {
          summary: "Moderate rent demand",
          detail: "Balanced rental market. Standard negotiation timelines apply. Focus on property fit over urgency.",
          urgency: "medium"
        };
      } else {
        return {
          summary: "Softer rent market",
          detail: "Tenants have more options. Highlight value and terms flexibility. Landlords may consider incentives.",
          urgency: "low"
        };
      }
    } else if (leadIntent === "buy") {
      if (demandSupplyRatio > 1.5) {
        return {
          summary: "Competitive buyer market",
          detail: "Strong demand with limited inventory. Buyers should be decision-ready. Sellers may see multiple offers.",
          urgency: "high"
        };
      } else if (demandSupplyRatio > 0.8) {
        return {
          summary: "Balanced market",
          detail: "Healthy supply-demand dynamics. Standard negotiation expected. Focus on property value proposition.",
          urgency: "medium"
        };
      } else {
        return {
          summary: "Buyer-favorable conditions",
          detail: "More inventory available. Buyers can take time for due diligence. Pricing flexibility may exist.",
          urgency: "low"
        };
      }
    } else {
      // Sell intent
      if (demandSupplyRatio > 1.5) {
        return {
          summary: "Strong seller position",
          detail: "High demand relative to supply. Sellers can expect good activity. Price conversations should be confident.",
          urgency: "high"
        };
      } else {
        return {
          summary: "Standard market conditions",
          detail: "Normal market dynamics. Realistic pricing expectations important. Focus on property differentiation.",
          urgency: "medium"
        };
      }
    }
  };

  const contextNarrative = getContextNarrative();

  if (!areaData || !contextNarrative) {
    return (
      <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
        <CardContent className="p-4 text-center">
          <Info className="w-6 h-6 text-[#1A1A1A]/70 mx-auto mb-2" />
          <p className="text-white/90 text-sm">
            {leadArea ? `No market data available for "${leadArea}"` : "Select a location to view market context"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-white/70" />;
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "high":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Activity</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Moderate</Badge>;
      default:
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Relaxed</Badge>;
    }
  };

  if (compact) {
    return (
      <div className="bg-[#1A1A1A]/50 rounded-lg p-3 border border-[#1A1A1A]/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1A1A1A]" />
            <span className="text-white font-medium text-sm">{areaData.area}</span>
          </div>
          {getUrgencyBadge(contextNarrative.urgency)}
        </div>
        <p className="text-white/70 text-xs">{contextNarrative.summary}</p>
      </div>
    );
  }

  return (
    <Card className="bg-[#FDFBF7]/50 border-[#1A1A1A]">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#1A1A1A]" />
          Market Context: {areaData.area}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">{contextNarrative.summary}</span>
          {getUrgencyBadge(contextNarrative.urgency)}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A]/50 rounded-lg p-3 text-center">
            <p className="text-white/90 text-xs mb-1">Price Trend</p>
            <div className="flex items-center justify-center gap-1">
              {getTrendIcon(areaData.yoyChange)}
              <span className={`font-semibold ${areaData.yoyChange > 0 ? "text-emerald-400" : "text-red-400"}`}>
                {areaData.yoyChange > 0 ? "+" : ""}{areaData.yoyChange}%
              </span>
            </div>
          </div>
          <div className="bg-[#1A1A1A]/50 rounded-lg p-3 text-center">
            <p className="text-white/90 text-xs mb-1">Demand</p>
            <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 mt-1">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full" 
                style={{ width: `${areaData.demandScore}%` }}
              />
            </div>
            <span className="text-white text-xs">{areaData.demandScore}%</span>
          </div>
          <div className="bg-[#1A1A1A]/50 rounded-lg p-3 text-center">
            <p className="text-white/90 text-xs mb-1">Supply</p>
            <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 mt-1">
              <div 
                className="bg-amber-500 h-1.5 rounded-full" 
                style={{ width: `${areaData.supplyScore}%` }}
              />
            </div>
            <span className="text-white text-xs">{areaData.supplyScore}%</span>
          </div>
        </div>

        {/* Broker Guidance */}
        <div className="bg-[#EFE6D6]/5 border border-[#B89555]/20 rounded-lg p-3">
          <p className="text-white/85 text-sm">{contextNarrative.detail}</p>
        </div>

        {/* Disclaimer */}
        <p className="text-[#1A1A1A]/70 text-xs">
          Market context based on aggregated Open Data · For internal broker use only
        </p>
      </CardContent>
    </Card>
  );
}

export default LeadMarketContext;
