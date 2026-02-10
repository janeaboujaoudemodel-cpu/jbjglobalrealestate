import { 
  Calendar, 
  HardHat, 
  Home,
  Flag,
  Clock 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { formatDisplayDate } from "@/utils/formatDate";

interface ConstructionTimelineSectionProps {
  constructionProgress?: number | null;
  constructionStartDate?: string | null;
  expectedCompletion?: string | null;
  handoverDate?: string | null;
  projectName: string;
}

export default function ConstructionTimelineSection({
  constructionProgress,
  constructionStartDate,
  expectedCompletion,
  handoverDate,
  projectName,
}: ConstructionTimelineSectionProps) {
  // Only show if we have at least some construction data
  const hasData = constructionProgress !== null && constructionProgress !== undefined;
  if (!hasData && !constructionStartDate && !expectedCompletion) return null;

  // Validate progress: if start date is in the future, override to 0%
  let validatedProgress = constructionProgress ?? 0;
  if (constructionStartDate) {
    const startDate = new Date(constructionStartDate);
    const now = new Date();
    if (startDate > now) {
      validatedProgress = 0;
    } else if (expectedCompletion && validatedProgress > 0) {
      // Sanity check: cap progress based on elapsed time vs total timeline
      const completionDate = new Date(expectedCompletion);
      const totalDuration = completionDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      if (totalDuration > 0) {
        const maxReasonableProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100) + 10);
        if (validatedProgress > maxReasonableProgress) {
          validatedProgress = maxReasonableProgress;
        }
      }
    }
  }

  // Determine stage based on progress
  const getConstructionStage = (progress: number) => {
    if (progress === 0) return { label: "Pre-Construction", color: "bg-zinc-500" };
    if (progress < 30) return { label: "Foundation", color: "bg-orange-500" };
    if (progress < 60) return { label: "Superstructure", color: "bg-amber-500" };
    if (progress < 90) return { label: "Finishing", color: "bg-emerald-500" };
    if (progress < 100) return { label: "Final Touches", color: "bg-blue-500" };
    return { label: "Complete", color: "bg-gold" };
  };

  const stage = getConstructionStage(validatedProgress);

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <HardHat className="w-5 h-5 text-gold" />
        Construction Progress
      </h3>

      {/* Progress Bar */}
      {hasData && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${stage.color}`}>
                {stage.label}
              </span>
            </div>
            <span className="text-2xl font-bold text-gold">{validatedProgress}%</span>
          </div>
          <Progress 
            value={validatedProgress} 
            className="h-4 bg-muted"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {validatedProgress === 100 
              ? "Construction completed - ready for handover" 
              : `${100 - validatedProgress}% remaining to completion`
            }
          </p>
        </div>
      )}

      {/* Timeline Milestones */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {constructionStartDate && (
          <div className="rounded-xl border border-gold/30 bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Flag className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Construction Started</p>
                <p className="text-base font-semibold text-foreground">{formatDisplayDate(constructionStartDate)}</p>
              </div>
            </div>
          </div>
        )}

        {expectedCompletion && (
          <div className="rounded-xl border border-gold/30 bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected Completion</p>
                <p className="text-base font-semibold text-foreground">{formatDisplayDate(expectedCompletion)}</p>
              </div>
            </div>
          </div>
        )}

        {handoverDate && (
          <div className="rounded-xl border border-gold/30 bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                <Home className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Handover Date</p>
                <p className="text-base font-semibold text-foreground">{formatDisplayDate(handoverDate)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Timeline - Only show if we have dates */}
      {(constructionStartDate || expectedCompletion || handoverDate) && hasData && (
        <div className="mt-8 relative">
          {/* Timeline Line */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
          <div 
            className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-gold to-gold-light transition-all"
            style={{ width: `${validatedProgress}%` }}
          />
          
          {/* Timeline Points */}
          <div className="flex justify-between relative">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                validatedProgress > 0 ? "bg-gold text-black" : "bg-muted text-muted-foreground"
              }`}>
                <Flag className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground mt-2">Start</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                validatedProgress >= 50 ? "bg-gold text-black" : "bg-muted text-muted-foreground"
              }`}>
                <HardHat className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground mt-2">50%</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                validatedProgress >= 100 ? "bg-gold text-black" : "bg-muted text-muted-foreground"
              }`}>
                <Home className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground mt-2">Handover</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
