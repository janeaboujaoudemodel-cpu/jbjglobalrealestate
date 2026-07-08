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

  const startDate = constructionStartDate ? new Date(constructionStartDate) : null;
  const now = new Date();

  const monthDelta = startDate
    ? (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth())
    : null;
  const startsInFuture = Boolean(startDate && startDate > now);
  const startedThisMonth = Boolean(startDate && monthDelta === 0 && !startsInFuture);
  const monthsSinceStart = monthDelta !== null && monthDelta > 0 ? monthDelta : 0;

  const elapsedLabel = (() => {
    if (!startDate) return null;
    if (startsInFuture) {
      const futureMonths = Math.max(1, Math.abs(monthDelta ?? 0));
      return futureMonths === 1 ? "Starts next month" : `Starts in ${futureMonths} months`;
    }
    if (startedThisMonth) return "This month it started";
    if (monthsSinceStart < 12) return `${monthsSinceStart} month${monthsSinceStart === 1 ? "" : "s"} since start`;
    const years = Math.floor(monthsSinceStart / 12);
    const months = monthsSinceStart % 12;
    return `${years} year${years === 1 ? "" : "s"}${months ? ` ${months} month${months === 1 ? "" : "s"}` : ""} since start`;
  })();

  // Validate progress: if start date is in the future, override to 0%
  let validatedProgress = constructionProgress ?? 0;
  if (constructionStartDate) {
    if (startsInFuture) {
      validatedProgress = 0;
    } else if (expectedCompletion) {
      // Sanity check: cap progress based on elapsed time vs total timeline
      const completionDate = new Date(expectedCompletion);
      const totalDuration = completionDate.getTime() - (startDate?.getTime() ?? 0);
      const elapsed = now.getTime() - (startDate?.getTime() ?? now.getTime());
      if (totalDuration > 0) {
        const maxReasonableProgress = Math.min(100, Math.round((elapsed / totalDuration) * 100) + 10);
        if (validatedProgress > maxReasonableProgress) {
          validatedProgress = maxReasonableProgress;
        }
      }
    }
  }
  validatedProgress = Math.max(0, Math.min(100, Math.round(validatedProgress)));
  const timelineFillPercent = startsInFuture ? 0 : Math.max(validatedProgress, startDate ? 8 : 0);

  // Determine stage based on progress. Never use emerald pills with dark text.
  const getConstructionStage = (progress: number) => {
    if (startsInFuture) return { label: "Pre-construction", className: "jj-emerald-action allow-white border-transparent" };
    if (progress === 0) return { label: startedThisMonth ? "Started this month" : "Construction started", className: "jj-emerald-action allow-white border-transparent" };
    if (progress < 30) return { label: "Foundation works", className: "jj-emerald-action allow-white border-transparent" };
    if (progress < 60) return { label: "Superstructure", className: "jj-emerald-action allow-white border-transparent" };
    if (progress < 90) return { label: "Finishing", className: "jj-emerald-action allow-white border-transparent" };
    if (progress < 100) return { label: "Final touches", className: "jj-emerald-action allow-white border-transparent" };
    return { label: "Complete", className: "jj-emerald-action allow-white border-transparent" };
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
              <span data-no-contrast-guard data-emerald-action="true" className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${stage.className}`} style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                <CircleDot className="h-3.5 w-3.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                {stage.label}
              </span>
              {elapsedLabel && (
                <span data-no-contrast-guard className="inline-flex items-center gap-1.5 rounded-full border border-[#B89555]/55 bg-[#FDFBF7] px-3 py-1 text-xs font-semibold" style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}>
                  <Clock className="h-3.5 w-3.5" style={{ color: "#064E3B", stroke: "#064E3B" }} />
                  {elapsedLabel}
                </span>
              )}

            </div>
            <span className="text-2xl font-bold text-[#1A1A1A]">{validatedProgress}%</span>
          </div>
          <Progress 
            value={validatedProgress} 
            className="h-4 bg-muted"
            data-started={startDate && !startsInFuture ? "true" : undefined}
            style={{ ["--jj-progress-visual-value" as never]: `${timelineFillPercent}%`, ["--jj-progress-bg" as never]: "#FFFFFF" }}
          />
          <p className="text-xs font-medium text-[#1A1A1A]/75 mt-2">
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
          <div className="rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] flex items-center justify-center">
                <Flag className="w-5 h-5 text-[#064E3B]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]/70">{startedThisMonth ? "Started this month" : "Construction started"}</p>
                <p className="text-base font-semibold text-foreground">{formatDisplayDate(constructionStartDate)}</p>
              </div>
            </div>
          </div>
        )}

        {expectedCompletion && (
          <div className="rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[#064E3B]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]/70">Expected completion</p>
                <p className="text-base font-semibold text-foreground">{formatDisplayDate(expectedCompletion)}</p>
              </div>
            </div>
          </div>
        )}

        {handoverDate && (
          <div className="rounded-xl border border-[#B89555]/35 bg-[#FDFBF7] p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full border border-[#B89555]/40 bg-[#F7F2EA] flex items-center justify-center">
                <Home className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A]/70">Handover date</p>
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
          <div className="absolute top-4 left-0 h-0.5 bg-[#064E3B] transition-all" style={{ width: `${timelineFillPercent}%` }} />
          
          {/* Timeline Points */}
          <div className="flex justify-between relative">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center z-10 ${
 startDate && !startsInFuture ? "jj-emerald-action allow-white border-transparent text-white" : "bg-[#F7F2EA] border-[#B89555]/35 text-[#1A1A1A]/60"
 }`}>
                <Flag className="w-4 h-4" style={startDate && !startsInFuture ? { color: "#FFFFFF", stroke: "#FFFFFF" } : undefined} />
              </div>
              <span className="text-xs text-muted-foreground mt-2">{startedThisMonth ? "Started this month" : startsInFuture ? "Pre-construction" : "Started"}</span>
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
