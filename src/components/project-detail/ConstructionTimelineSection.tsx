import { HardHat, Home, Flag, Clock, CircleDot } from "lucide-react";
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

  const startDate = constructionStartDate ? new Date(constructionStartDate) : null;
  const now = new Date();
  const startedThisMonth = Boolean(
    startDate &&
      startDate.getFullYear() === now.getFullYear() &&
      startDate.getMonth() === now.getMonth()
  );

  // Determine stage based on progress. Never use emerald pills with dark text.
  const getConstructionStage = (progress: number) => {
    if (progress === 0) return { label: startedThisMonth ? "Started this month" : "Pre-construction", className: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/55" };
    if (progress < 30) return { label: "Foundation", className: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/55" };
    if (progress < 60) return { label: "Superstructure", className: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/55" };
    if (progress < 90) return { label: "Finishing", className: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/55" };
    if (progress < 100) return { label: "Final touches", className: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/55" };
    return { label: "Complete", className: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/55" };
  };

  const stage = getConstructionStage(validatedProgress);

  return (
    <div className="jj-card-inner">
      <h3 className="text-h3-sm font-medium text-foreground flex items-center gap-2 mb-6">
        <HardHat className="w-5 h-5 text-[#1A1A1A]" />
        Construction Progress
      </h3>

      {/* Progress Bar */}
      {hasData && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <span data-no-contrast-guard className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${stage.className}`} style={{ color: "#1A1A1A" }}>
                <CircleDot className="h-3.5 w-3.5" style={{ color: "#064E3B" }} />
                {stage.label}
              </span>
              {startedThisMonth && (
                <span data-no-contrast-guard className="inline-flex items-center gap-1.5 rounded-full border border-[#B89555]/45 bg-[#F7F2EA] px-3 py-1 text-xs font-semibold" style={{ color: "#1A1A1A" }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: "#064E3B" }} />
                  This month it started
                </span>
              )}

            </div>
            <span className="text-2xl font-bold text-[#1A1A1A]">{validatedProgress}%</span>
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
          <div className="rounded-xl border border-[#B89555]/30 bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] flex items-center justify-center">
                <Flag className="w-5 h-5 text-[#064E3B]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{startedThisMonth ? "Started This Month" : "Construction Started"}</p>
                <p className="text-base font-semibold text-foreground">{formatDisplayDate(constructionStartDate)}</p>
              </div>
            </div>
          </div>
        )}

        {expectedCompletion && (
          <div className="rounded-xl border border-[#B89555]/30 bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#064E3B]" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expected Completion</p>
                <p className="text-base font-semibold text-foreground">{formatDisplayDate(expectedCompletion)}</p>
              </div>
            </div>
          </div>
        )}

        {handoverDate && (
          <div className="rounded-xl border border-[#B89555]/30 bg-card p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] flex items-center justify-center">
                <Home className="w-5 h-5 text-[#1A1A1A]" />
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
          <div className="absolute top-4 left-0 h-0.5 bg-[#064E3B] transition-all" style={{ width: `${validatedProgress}%` }} />
          
          {/* Timeline Points */}
          <div className="flex justify-between relative">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center z-10 ${
 startedThisMonth || validatedProgress > 0 ? "bg-[#FDFBF7] border-[#064E3B] text-[#064E3B]" : "bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]/60"
 }`}>
                <Flag className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground mt-2">{startedThisMonth ? "Started this month" : "Start"}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
 validatedProgress >= 50 ? "bg-[#EFE6D6] text-[#1A1A1A]" : "bg-muted text-muted-foreground"
 }`}>
                <HardHat className="w-4 h-4" />
              </div>
              <span className="text-xs text-muted-foreground mt-2">50%</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
 validatedProgress >= 100 ? "bg-[#EFE6D6] text-[#1A1A1A]" : "bg-muted text-muted-foreground"
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
