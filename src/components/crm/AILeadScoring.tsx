import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  nationality: string | null;
  current_location_country: string | null;
  source: string | null;
  created_at: string;
}

interface AILeadScoringProps {
  lead: Lead;
  activities?: any[];
  onScoreUpdate?: (score: number) => void;
}

interface LeadScore {
  overall: number;
  engagement: number;
  profile: number;
  timing: number;
  recommendation: string;
  insights: string[];
}

const AILeadScoring = ({ lead, activities = [], onScoreUpdate }: AILeadScoringProps) => {
  const [score, setScore] = useState<LeadScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");

  useEffect(() => {
    calculateScore();
  }, [lead, activities]);

  const calculateScore = async () => {
    setLoading(true);
    try {
      // Engagement score (0-100) based on activity
      const callCount = activities.filter(a => a.activity_type === 'call').length;
      const whatsappCount = activities.filter(a => a.activity_type === 'whatsapp_click').length;
      const emailCount = activities.filter(a => a.activity_type === 'email_click').length;
      const noteCount = activities.filter(a => a.activity_type === 'note').length;
      
      const engagementScore = Math.min(100, 
        callCount * 20 + whatsappCount * 15 + emailCount * 10 + noteCount * 5
      );

      // Profile score (0-100) based on completeness
      let profileScore = 0;
      if (lead.email_lower) profileScore += 25;
      if (lead.phone_e164) profileScore += 25;
      if (lead.nationality) profileScore += 20;
      if (lead.current_location_country) profileScore += 15;
      if (lead.source) profileScore += 15;

      // Timing score (0-100) based on recency
      const daysSinceCreated = Math.floor(
        (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      const recentActivity = activities.length > 0 
        ? Math.floor((Date.now() - new Date(activities[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
        : daysSinceCreated;
      
      let timingScore = 100;
      if (recentActivity > 7) timingScore -= 20;
      if (recentActivity > 14) timingScore -= 20;
      if (recentActivity > 30) timingScore -= 30;
      timingScore = Math.max(0, timingScore);

      // Overall weighted score
      const overall = Math.round(
        engagementScore * 0.4 + profileScore * 0.3 + timingScore * 0.3
      );

      // Generate insights
      const insights: string[] = [];
      if (engagementScore >= 60) {
        insights.push("🔥 High engagement - prioritize this lead");
      } else if (engagementScore < 20) {
        insights.push("⚠️ Low engagement - needs more follow-up");
      }
      
      if (profileScore < 50) {
        insights.push("📋 Incomplete profile - gather more information");
      }
      
      if (timingScore < 50) {
        insights.push("⏰ Stale lead - re-engage soon");
      }
      
      if (callCount > 3) {
        insights.push("📞 Multiple calls - strong interest indicated");
      }

      // Generate recommendation
      let recommendation = "";
      if (overall >= 80) {
        recommendation = "Hot Lead - Close the deal!";
      } else if (overall >= 60) {
        recommendation = "Warm Lead - Schedule follow-up";
      } else if (overall >= 40) {
        recommendation = "Cool Lead - Nurture with content";
      } else {
        recommendation = "Cold Lead - Re-qualification needed";
      }

      const newScore: LeadScore = {
        overall,
        engagement: engagementScore,
        profile: profileScore,
        timing: timingScore,
        recommendation,
        insights
      };

      setScore(newScore);
      onScoreUpdate?.(overall);
      
      // Persist AI score to database for analytics
      supabase.from("crm_leads").update({ 
        ai_score: overall, 
        ai_score_updated_at: new Date().toISOString() 
      } as any).eq("id", lead.id).then(() => {});
    } catch (err) {
      console.error("Failed to calculate score:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lead-analysis', {
        body: {
          lead,
          activities,
          score
        }
      });

      if (error) throw error;
      setAiAnalysis(data.analysis || "Unable to generate analysis");
      toast.success("AI analysis generated");
    } catch (err) {
      console.error("AI analysis failed:", err);
      // Fallback to basic analysis
      setAiAnalysis(
        `Based on the lead's profile and engagement history, ${lead.full_name} shows ` +
        `${score?.overall && score.overall >= 60 ? 'strong' : 'moderate'} potential. ` +
        `Focus on ${score?.timing && score.timing < 50 ? 're-engagement' : 'continued nurturing'} ` +
        `to move this lead through the pipeline.`
      );
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-emerald-400";
    if (value >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreBg = (value: number) => {
    if (value >= 80) return "bg-green-500";
    if (value >= 60) return "bg-emerald-400";
    if (value >= 40) return "bg-amber-400";
    return "bg-red-400";
  };

  if (!score) {
    return (
      <Card className="border-border">
        <CardContent className="py-6 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Calculating score...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-gold/30 bg-gradient-to-br from-[hsl(40,33%,98%)]/95 to-[hsl(36,25%,88%)]/80 shadow-[0_8px_30px_rgba(200,167,102,0.12)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            AI Lead Score
          </CardTitle>
          <Badge 
            className={`text-lg px-3 py-1 ${getScoreBg(score.overall)} text-white`}
          >
            {score.overall}/100
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score breakdown */}
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Engagement</span>
              <span className={getScoreColor(score.engagement)}>{score.engagement}%</span>
            </div>
            <Progress value={score.engagement} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Profile Completeness</span>
              <span className={getScoreColor(score.profile)}>{score.profile}%</span>
            </div>
            <Progress value={score.profile} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Timing</span>
              <span className={getScoreColor(score.timing)}>{score.timing}%</span>
            </div>
            <Progress value={score.timing} className="h-2" />
          </div>
        </div>

        {/* Recommendation */}
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`h-4 w-4 ${getScoreColor(score.overall)}`} />
            <span className="font-semibold text-foreground">{score.recommendation}</span>
          </div>
        </div>

        {/* Insights */}
        {score.insights.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Quick Insights</p>
            {score.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}

        {/* AI Analysis */}
        {aiAnalysis && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-foreground">{aiAnalysis}</p>
          </div>
        )}

        <Button 
          onClick={generateAIAnalysis} 
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {loading ? "Analyzing..." : "Generate AI Insights"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AILeadScoring;
