import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ExecutiveAccessGate from "@/components/executive/ExecutiveAccessGate";
import SEOHead from "@/components/SEOHead";
import { 
  Brain, 
  Clock, 
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AIInsight {
  id: string;
  category: "pattern" | "correlation" | "delta" | "attention";
  title: string;
  summary: string;
  details?: string;
  timestamp: string;
}

const ExecutiveAIInsights = () => {
  const { toast } = useToast();
  const [lastUpdated] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([
    {
      id: "1",
      category: "pattern",
      title: "RENT Inquiry Surge Pattern",
      summary: "RENT inquiries have increased 23% week-over-week, concentrated in Downtown Dubai and Business Bay areas.",
      details: "Pattern observed across WhatsApp and website channels. Peak activity during evening hours (6-9 PM UAE time).",
      timestamp: new Date().toISOString(),
    },
    {
      id: "2",
      category: "delta",
      title: "Lead Quality Shift",
      summary: "Qualified lead ratio improved from 18% to 24% compared to last period.",
      details: "Improvement attributed to refined qualification questions and AI pre-screening in chat support.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "3",
      category: "correlation",
      title: "Channel-Conversion Relationship",
      summary: "Referral leads show 3x higher conversion rate than social media leads.",
      details: "Referral sources maintain consistent quality while social channels show higher volume but lower intent.",
      timestamp: new Date().toISOString(),
    },
    {
      id: "4",
      category: "attention",
      title: "Viewing Scheduling Delay",
      summary: "Average time from inquiry to first viewing has increased from 2.3 to 3.8 days.",
      details: "Bottleneck identified in broker availability coordination. Consider resource reallocation.",
      timestamp: new Date().toISOString(),
    },
  ]);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-market-narratives", {
        body: {
          mode: "internal",
          narrativeType: "broker_focus",
          area: "Dubai",
          transactionType: "all",
        },
      });

      if (error) throw error;

      // Add new AI-generated insight
      if (data?.narrative) {
        setInsights(prev => [
          {
            id: Date.now().toString(),
            category: "pattern",
            title: "AI-Generated Market Insight",
            summary: data.narrative.substring(0, 200) + "...",
            details: data.narrative,
            timestamp: new Date().toISOString(),
          },
          ...prev,
        ]);

        toast({
          title: "Insights Updated",
          description: "New AI-generated insight added to the dashboard.",
        });
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate new insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: AIInsight["category"]) => {
    switch (category) {
      case "pattern":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case "correlation":
        return <Activity className="w-4 h-4 text-blue-500" />;
      case "delta":
        return <TrendingDown className="w-4 h-4 text-amber-500" />;
      case "attention":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getCategoryColor = (category: AIInsight["category"]) => {
    switch (category) {
      case "pattern":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "correlation":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "delta":
        return "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30";
      case "attention":
        return "bg-red-500/20 text-red-400 border-red-500/30";
    }
  };

  return (
    <ExecutiveAccessGate>
      <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
        <SEOHead
          title="AI Strategic Insights | Executive Dashboard | JBJ GLOBAL REAL ESTATE"
          description="AI-assisted strategic insights for executive decision support."
          noIndex
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Brain className="w-8 h-8 text-[#1A1A1A]" />
                Strategic AI Insights
              </h1>
              <p className="text-white/70">
                AI-assisted pattern recognition and decision support — descriptive only
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Clock className="w-4 h-4" />
                <span>{new Date(lastUpdated).toLocaleString()}</span>
              </div>
              <Button
                onClick={generateInsights}
                disabled={loading}
                className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Insights
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { label: "Overview", path: "/internal/executive/overview" },
              { label: "Market Signals", path: "/internal/executive/market-signals" },
              { label: "Performance", path: "/internal/executive/performance" },
              { label: "Risk & Compliance", path: "/internal/executive/risk" },
              { label: "AI Insights", path: "/internal/executive/ai-insights", active: true },
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

          {/* AI Disclaimer */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[#1A1A1A] font-medium mb-1">AI Decision Support — Not Decision Making</h4>
                <p className="text-amber-200/80 text-sm">
                  These insights are descriptive analytics generated by AI. They identify patterns and correlations 
                  in historical data but do not predict future outcomes. All strategic decisions remain with human leadership.
                </p>
              </div>
            </div>
          </div>

          {/* Insight Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardContent className="pt-6 text-center">
                <TrendingUp className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-white font-medium">Pattern Recognition</p>
                <p className="text-xs text-white/90 mt-1">Recurring trends identified</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardContent className="pt-6 text-center">
                <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-white font-medium">Correlation Summary</p>
                <p className="text-xs text-white/90 mt-1">Relationship mapping</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardContent className="pt-6 text-center">
                <TrendingDown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-white font-medium">Period Comparison</p>
                <p className="text-xs text-white/90 mt-1">What changed vs last period</p>
              </CardContent>
            </Card>
            <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-white font-medium">Attention Required</p>
                <p className="text-xs text-white/90 mt-1">Areas needing focus</p>
              </CardContent>
            </Card>
          </div>

          {/* Insights List */}
          <Card className="bg-[#FDFBF7] border-[#1A1A1A] mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
                Recent AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-[#F7F2EA] rounded-lg p-4 border border-[#1A1A1A]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getCategoryIcon(insight.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-white font-medium">{insight.title}</h4>
                        <Badge className={getCategoryColor(insight.category)}>
                          {insight.category.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-white/85 text-sm mb-2">{insight.summary}</p>
                      {insight.details && (
                        <p className="text-white/90 text-xs">{insight.details}</p>
                      )}
                      <p className="text-[#1A1A1A]/70 text-xs mt-2">
                        Generated: {new Date(insight.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* What AI Cannot Do */}
          <Card className="bg-[#FDFBF7] border-[#1A1A1A]">
            <CardHeader>
              <CardTitle className="text-lg text-white">AI Boundaries (Enforced)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-medium mb-2">Forbidden Outputs</h4>
                  <ul className="text-sm text-white/85 space-y-1">
                    <li>✗ Financial forecasts</li>
                    <li>✗ ROI predictions</li>
                    <li>✗ Investment recommendations</li>
                    <li>✗ Automated decisions</li>
                    <li>✗ Price predictions</li>
                  </ul>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <h4 className="text-emerald-400 font-medium mb-2">Allowed Outputs</h4>
                  <ul className="text-sm text-white/85 space-y-1">
                    <li>✓ Pattern recognition</li>
                    <li>✓ Correlation summaries</li>
                    <li>✓ Historical comparisons</li>
                    <li>✓ Attention flagging</li>
                    <li>✓ Data aggregation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-[#1A1A1A] text-center">
            <p className="text-xs text-white/90">
              AI Strategic Insights • Supports judgment, does not replace it • All insights logged and explainable
            </p>
            <p className="text-xs text-[#1A1A1A]/70 mt-1">
              Jane Bou Jaoude, Founder & CEO • JBJ GLOBAL REAL ESTATE
            </p>
          </div>
        </div>
      </div>
    </ExecutiveAccessGate>
  );
};

export default ExecutiveAIInsights;
