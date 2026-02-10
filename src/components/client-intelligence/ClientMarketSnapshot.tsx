import { TrendingUp, TrendingDown, Minus, BarChart3, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HistoricalDataPoint {
  period: string;
  value: number;
}

interface ClientMarketSnapshotProps {
  areaName: string;
  buyTrend?: "up" | "stable" | "down";
  sellActivity?: "active" | "moderate" | "quiet";
  rentDemand?: "high" | "moderate" | "balanced";
  supplyLevel?: number; // 0-100 scale
  demandLevel?: number; // 0-100 scale
  historicalData?: HistoricalDataPoint[];
  lastUpdated?: string;
}

/**
 * Client-facing Market Snapshot module for area/community pages.
 * Educational, neutral presentation with expand/collapse for details.
 * Part of Part 12 - Premium Advisory Mode.
 */
const ClientMarketSnapshot = ({
  areaName,
  buyTrend = "stable",
  sellActivity = "moderate",
  rentDemand = "moderate",
  supplyLevel = 50,
  demandLevel = 60,
  historicalData,
  lastUpdated = new Date().toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  }),
}: ClientMarketSnapshotProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTrendIcon = (trend: "up" | "stable" | "down") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-amber-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActivityBadge = (level: string) => {
    switch (level) {
      case "active":
      case "high":
        return (
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 text-xs">
            Active
          </Badge>
        );
      case "quiet":
      case "balanced":
        return (
          <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 text-xs">
            Balanced
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-muted-foreground/50 text-muted-foreground bg-muted/20 text-xs">
            Moderate
          </Badge>
        );
    }
  };

  const getWhatThisMeans = () => {
    const buyContext =
      buyTrend === "up"
        ? "BUY activity has shown upward movement recently"
        : buyTrend === "down"
        ? "BUY activity has softened somewhat"
        : "BUY activity remains stable";

    const rentContext =
      rentDemand === "high"
        ? "RENT demand is currently elevated, indicating tenant interest"
        : rentDemand === "balanced"
        ? "RENT demand is balanced with available supply"
        : "RENT demand is at moderate levels";

    const balanceContext =
      demandLevel > supplyLevel + 15
        ? "Overall, demand appears to exceed current supply in this area."
        : supplyLevel > demandLevel + 15
        ? "Supply currently meets or exceeds demand in this area."
        : "Supply and demand appear relatively balanced.";

    return `${buyContext}. ${rentContext}. ${balanceContext}`;
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Market Snapshot: {areaName}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Educational overview based on aggregated official data.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">BUY Trend</span>
            <div className="flex items-center gap-2">
              {getTrendIcon(buyTrend)}
              <span className="text-sm text-foreground capitalize">{buyTrend}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">SELL Activity</span>
            <div className="flex items-center gap-2">
              {getActivityBadge(sellActivity)}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">RENT Demand</span>
            <div className="flex items-center gap-2">
              {getActivityBadge(rentDemand)}
            </div>
          </div>
        </div>

        {/* Supply/Demand Balance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Supply Level</span>
            <span className="text-foreground">{supplyLevel}%</span>
          </div>
          <Progress value={supplyLevel} className="h-2" />
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Demand Level</span>
            <span className="text-foreground">{demandLevel}%</span>
          </div>
          <Progress value={demandLevel} className="h-2" />
        </div>

        {/* What This Means - Collapsible */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors w-full justify-between py-2 border-t border-border/30">
            <span>What does this mean?</span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getWhatThisMeans()}
            </p>
            
            {/* Historical Context if available */}
            {historicalData && historicalData.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                  Historical Trend
                </span>
                <div className="flex items-end gap-1 h-12">
                  {historicalData.map((point, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex-1 bg-primary/30 rounded-sm min-w-[8px] cursor-help"
                            style={{ height: `${(point.value / 100) * 100}%` }}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{point.period}: {point.value}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Mandatory Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 border-t border-border/30 pt-3">
          Insights are based on aggregated official data and are provided for informational purposes only.
          This does not constitute financial, investment, or legal advice.{" "}
          <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
        </p>
      </CardContent>
    </Card>
  );
};

export default ClientMarketSnapshot;
