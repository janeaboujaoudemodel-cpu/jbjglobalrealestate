import { TrendingUp, TrendingDown, Minus, Clock, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClientMarketContextProps {
  areaName: string;
  trendDirection?: "up" | "stable" | "down";
  rentDemandLevel?: "high" | "moderate" | "balanced";
  lastUpdated?: string;
  compact?: boolean;
}

/**
 * Client-facing Market Context panel for property pages.
 * Shows educational, neutral market insights without predictions or advice.
 * Part of Part 12 - Premium Advisory Mode.
 */
const ClientMarketContext = ({
  areaName,
  trendDirection = "stable",
  rentDemandLevel = "moderate",
  lastUpdated = new Date().toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  }),
  compact = false,
}: ClientMarketContextProps) => {
  const getTrendIcon = () => {
    switch (trendDirection) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-amber-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTrendLabel = () => {
    switch (trendDirection) {
      case "up":
        return "Upward trend";
      case "down":
        return "Softening";
      default:
        return "Stable";
    }
  };

  const getDemandBadge = () => {
    switch (rentDemandLevel) {
      case "high":
        return (
          <Badge variant="outline" className="border-emerald-500 text-emerald-500 bg-emerald-500/10 font-medium">
            High RENT demand
          </Badge>
        );
      case "balanced":
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500 bg-amber-500/10 font-medium">
            Balanced market
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-[#B89555] text-[#1A1A1A] bg-[#EFE6D6]/10 font-medium">
            Moderate demand
          </Badge>
        );
    }
  };

  const getContextNarrative = () => {
    const demandText =
      rentDemandLevel === "high"
        ? "consistent tenant activity"
        : rentDemandLevel === "balanced"
        ? "balanced supply and demand"
        : "steady market conditions";

    const trendText =
      trendDirection === "up"
        ? "upward movement in values"
        : trendDirection === "down"
        ? "some softening in pricing"
        : "stable pricing patterns";

    return `Recent data for ${areaName} indicates ${trendText}, supported by ${demandText}. This context can help inform timing and expectations.`;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
        {getTrendIcon()}
        <span className="text-sm text-muted-foreground">{getTrendLabel()}</span>
        {getDemandBadge()}
      </div>
    );
  }

  return (
    <Card className="bg-[#FDFBF7] border-2 border-[#B89555]/30 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-[#1A1A1A] flex items-center gap-2">
            Market Context
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
            <Info className="w-4 h-4 text-[#1A1A1A]" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-[#1A1A1A] border-[#1A1A1A]">
                  <p className="text-xs text-white">
                    Insights based on aggregated official data. Provided for informational purposes only.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <div className="flex items-center gap-1 text-xs text-[#1A1A1A]/70 bg-[#F7F2EA] px-2 py-1 rounded-full">
            <Clock className="w-3 h-3 text-[#1A1A1A]" />
            <span className="font-medium">Updated {lastUpdated}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend & Demand Summary */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-[#F7F2EA] px-3 py-2 rounded-lg">
            {getTrendIcon()}
            <span className="text-sm text-[#1A1A1A] font-medium">{getTrendLabel()}</span>
          </div>
          {getDemandBadge()}
        </div>

        {/* Plain-English Context */}
        <p className="text-sm text-[#1A1A1A]/70 leading-relaxed">
          {getContextNarrative()}
        </p>

        {/* Mandatory Disclaimer */}
        <p className="text-[10px] text-[#1A1A1A]/70 border-t border-[#B89555]/30 pt-3">
          Insights are based on aggregated official data and are provided for informational purposes only.
          This does not constitute financial, investment, or legal advice.{" "}
          <Link to="/contact" className="text-[#1A1A1A] hover:underline">Contact our team</Link> for professional guidance.
        </p>
      </CardContent>
    </Card>
  );
};

export default ClientMarketContext;
