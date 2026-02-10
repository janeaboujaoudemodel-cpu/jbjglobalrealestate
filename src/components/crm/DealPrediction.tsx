import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, Clock, Target, AlertTriangle, CheckCircle2, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: string;
  full_name: string;
  created_at: string;
  source: string | null;
}

interface DealPredictionProps {
  lead: Lead;
  currentStatus: string;
  activities?: any[];
}

interface Prediction {
  closeProbability: number;
  estimatedDays: number;
  stage: 'discovery' | 'qualification' | 'proposal' | 'negotiation' | 'closing';
  riskLevel: 'low' | 'medium' | 'high';
  nextBestAction: string;
  blockers: string[];
}

const STAGE_WEIGHTS = {
  new: { stage: 'discovery' as const, baseProb: 10 },
  contacted: { stage: 'discovery' as const, baseProb: 20 },
  interested: { stage: 'qualification' as const, baseProb: 35 },
  qualified: { stage: 'proposal' as const, baseProb: 50 },
  meeting_scheduled: { stage: 'proposal' as const, baseProb: 55 },
  proposal_sent: { stage: 'proposal' as const, baseProb: 60 },
  negotiation: { stage: 'negotiation' as const, baseProb: 70 },
  closed_won: { stage: 'closing' as const, baseProb: 100 },
  closed_lost: { stage: 'closing' as const, baseProb: 0 },
};

const DealPrediction = ({ lead, currentStatus, activities = [] }: DealPredictionProps) => {
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  useEffect(() => {
    calculatePrediction();
  }, [lead, currentStatus, activities]);

  const calculatePrediction = () => {
    const stageInfo = STAGE_WEIGHTS[currentStatus as keyof typeof STAGE_WEIGHTS] || STAGE_WEIGHTS.new;
    
    // Calculate activity-based modifiers
    const callCount = activities.filter(a => a.activity_type === 'call').length;
    const whatsappCount = activities.filter(a => a.activity_type === 'whatsapp_click').length;
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const lastActivityDays = activities.length > 0
      ? Math.floor((Date.now() - new Date(activities[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
      : daysSinceCreated;

    // Adjust probability based on engagement
    let engagementBonus = 0;
    if (callCount >= 3) engagementBonus += 10;
    else if (callCount >= 1) engagementBonus += 5;
    if (whatsappCount >= 5) engagementBonus += 5;

    // Reduce probability for stale leads
    let stalePenalty = 0;
    if (lastActivityDays > 14) stalePenalty = 10;
    if (lastActivityDays > 30) stalePenalty = 25;
    if (lastActivityDays > 60) stalePenalty = 40;

    // Calculate final probability
    let closeProbability = Math.min(100, Math.max(0, 
      stageInfo.baseProb + engagementBonus - stalePenalty
    ));

    // Estimate days to close
    let estimatedDays = 30;
    if (stageInfo.stage === 'discovery') estimatedDays = 60;
    else if (stageInfo.stage === 'qualification') estimatedDays = 45;
    else if (stageInfo.stage === 'proposal') estimatedDays = 30;
    else if (stageInfo.stage === 'negotiation') estimatedDays = 14;
    else if (stageInfo.stage === 'closing') estimatedDays = 7;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (stalePenalty > 20 || closeProbability < 30) riskLevel = 'high';
    else if (stalePenalty > 10 || closeProbability < 50) riskLevel = 'medium';

    // Determine next best action
    let nextBestAction = "Schedule a follow-up call";
    if (lastActivityDays > 7) nextBestAction = "Re-engage with WhatsApp message";
    if (currentStatus === 'new') nextBestAction = "Make initial contact call";
    if (currentStatus === 'qualified') nextBestAction = "Prepare and send proposal";
    if (currentStatus === 'negotiation') nextBestAction = "Address concerns and close";

    // Identify blockers
    const blockers: string[] = [];
    if (lastActivityDays > 14) blockers.push("No recent activity");
    if (callCount === 0) blockers.push("No calls made yet");
    if (activities.length < 3) blockers.push("Limited engagement history");

    setPrediction({
      closeProbability,
      estimatedDays,
      stage: stageInfo.stage,
      riskLevel,
      nextBestAction,
      blockers
    });
  };

  if (!prediction) return null;

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return "text-emerald-400";
    if (prob >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium Risk</Badge>;
      case 'high':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Risk</Badge>;
      default:
        return null;
    }
  };

  const stages = ['discovery', 'qualification', 'proposal', 'negotiation', 'closing'];
  const currentStageIndex = stages.indexOf(prediction.stage);

  return (
    <Card className="border border-zinc-800 bg-zinc-900/80 shadow-lg shadow-black/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-white">
            <div className="p-1.5 rounded-lg bg-gold/20 border border-gold/30">
              <Target className="h-5 w-5 text-gold" />
            </div>
            Deal Prediction
          </CardTitle>
          {getRiskBadge(prediction.riskLevel)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Close Probability */}
        <div className="text-center py-4 bg-zinc-800/50 rounded-xl border border-zinc-700">
          <div className={cn("text-4xl font-bold", getProbabilityColor(prediction.closeProbability))}>
            {prediction.closeProbability}%
          </div>
          <p className="text-sm text-zinc-400 mt-1">Close Probability</p>
        </div>

        {/* Sales Stage Progress */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-300">Sales Stage</p>
          <div className="flex gap-1">
            {stages.map((stage, i) => (
              <div
                key={stage}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all",
                  i <= currentStageIndex 
                    ? "bg-gold shadow-[0_2px_8px_rgba(200,167,102,0.4)]" 
                    : "bg-zinc-700"
                )}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 capitalize text-center">
            {prediction.stage}
          </p>
        </div>

        {/* Estimated Timeline */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
          <Clock className="h-5 w-5 text-gold" />
          <div>
            <p className="text-sm font-medium text-white">
              Est. {prediction.estimatedDays} days to close
            </p>
            <p className="text-xs text-zinc-400">
              Based on current engagement
            </p>
          </div>
        </div>

        {/* Next Best Action */}
        <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-gold" />
            <span className="text-sm font-semibold text-gold">Next Best Action</span>
          </div>
          <p className="text-sm text-zinc-300">{prediction.nextBestAction}</p>
        </div>

        {/* Blockers */}
        {prediction.blockers.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Potential Blockers
            </p>
            {prediction.blockers.map((blocker, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-zinc-400">
                <XCircle className="h-3 w-3 text-red-500" />
                {blocker}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DealPrediction;
