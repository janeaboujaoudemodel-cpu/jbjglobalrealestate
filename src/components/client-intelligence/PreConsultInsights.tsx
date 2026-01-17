import { Lightbulb, TrendingUp, TrendingDown, Minus, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PreConsultInsightsProps {
  intent?: "buy" | "sell" | "rent";
  preferredArea?: string;
  marketConditions?: {
    trend: "up" | "stable" | "down";
    activity: "high" | "moderate" | "quiet";
  };
}

/**
 * Pre-consultation insight summary for booking pages.
 * Sets expectations and reduces friction before calls.
 * Part of Part 12 - Premium Advisory Mode.
 */
const PreConsultInsights = ({
  intent = "buy",
  preferredArea = "Dubai",
  marketConditions = { trend: "stable", activity: "moderate" },
}: PreConsultInsightsProps) => {
  const getTrendIcon = () => {
    switch (marketConditions.trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-amber-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getIntentLabel = () => {
    switch (intent) {
      case "buy":
        return "BUY";
      case "sell":
        return "SELL";
      case "rent":
        return "RENT";
      default:
        return "BUY";
    }
  };

  const getMarketContext = () => {
    const trendText =
      marketConditions.trend === "up"
        ? "showing upward activity"
        : marketConditions.trend === "down"
        ? "experiencing some softening"
        : "remaining stable";

    const activityText =
      marketConditions.activity === "high"
        ? "with active transaction volume"
        : marketConditions.activity === "quiet"
        ? "with measured transaction activity"
        : "with moderate market activity";

    return `The ${preferredArea} market is currently ${trendText}, ${activityText}.`;
  };

  const getConsultationTopics = () => {
    switch (intent) {
      case "buy":
        return [
          "Current pricing patterns in your preferred areas",
          "Available inventory matching your criteria",
          "Payment plan structures and timelines",
          "Area-specific market context",
        ];
      case "sell":
        return [
          "Current market conditions for SELL transactions",
          "Comparable recent activity in your area",
          "Preparation guidance for listing",
          "Timeline expectations",
        ];
      case "rent":
        return [
          "RENT demand dynamics in your area",
          "Current availability and pricing ranges",
          "Documentation requirements",
          "Timeline for tenant placement",
        ];
      default:
        return [];
    }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium text-foreground flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Before Your Consultation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Intent & Area Context */}
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-primary/20 text-primary border-primary/30">
            {getIntentLabel()}
          </Badge>
          <span className="text-sm text-muted-foreground">{preferredArea}</span>
          <div className="flex items-center gap-1">
            {getTrendIcon()}
            <span className="text-xs text-muted-foreground capitalize">
              {marketConditions.trend} market
            </span>
          </div>
        </div>

        {/* Market Context Summary */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {getMarketContext()} During your consultation, we can discuss how these conditions may relate to your specific requirements.
        </p>

        {/* What We'll Cover */}
        <div className="space-y-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Topics We Can Discuss
          </span>
          <ul className="space-y-2">
            {getConsultationTopics().map((topic, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                {topic}
              </li>
            ))}
          </ul>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/60 border-t border-border/30 pt-3">
          Market context is based on aggregated official data and is provided for informational purposes only.
        </p>
      </CardContent>
    </Card>
  );
};

export default PreConsultInsights;
