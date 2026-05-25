import { CheckCircle2, User, Briefcase, FileText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepStatus {
  id: string;
  label: string;
  done: boolean;
  icon: React.ReactNode;
}

interface ApplicationProgressProps {
  steps: StepStatus[];
  activeStep?: number;
  onStepClick?: (index: number) => void;
}

export function ApplicationProgress({ steps, activeStep, onStepClick }: ApplicationProgressProps) {
  const total = steps.length;
  const completed = steps.filter((s) => s.done).length;
  // Wizard-aware progress: reflect both the step the user is on AND
  // the sections they've actually completed. Never shows 0 once you're
  // past step 1, and never shows 100 until every section is valid.
  const validityPct = (completed / total) * 100;
  const wizardFloor =
    typeof activeStep === "number"
      ? ((activeStep + 0.5) / total) * 100
      : 0;
  const raw = Math.max(validityPct, wizardFloor);
  const pct = Math.min(100, Math.max(completed === total ? 100 : 5, Math.round(raw)));



  return (
    <div className="rounded-2xl border-2 border-[#102540] bg-gradient-to-br from-[#FDFBF7] to-[#F7F2EA] p-5 shadow-[0_6px_20px_-10px_rgba(16,37,64,0.25)]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#102540]/70">
            Application Progress
          </p>
          <p className="text-sm font-semibold text-[#1A1A1A] mt-0.5">
            {typeof activeStep === "number"
              ? `Step ${activeStep + 1} of ${steps.length} — ${steps[activeStep]?.label}`
              : `${completed} of ${steps.length} sections complete`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#102540] leading-none">{pct}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#102540]/10 mb-4">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#102540] via-[#1a3d63] to-[#102540] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Step pills */}
      <div className="flex flex-wrap gap-2">
        {steps.map((s, idx) => {
          const isActive = activeStep === idx;
          const clickable = !!onStepClick;
          const Tag: any = clickable ? "button" : "div";
          return (
            <Tag
              key={s.id}
              type={clickable ? "button" : undefined}
              onClick={clickable ? () => onStepClick!(idx) : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                clickable && "cursor-pointer hover:-translate-y-0.5",
                isActive
                  ? "border-[#102540] bg-[#102540] text-white shadow-[0_4px_14px_-6px_rgba(16,37,64,0.55)]"
                  : s.done
                  ? "border-emerald-600/40 bg-emerald-50 text-emerald-800"
                  : "border-[#102540]/25 bg-[#FDFBF7] text-[#102540]/80"
              )}
              data-allow-dark-cta={isActive ? "" : undefined}
              data-no-contrast-guard={isActive ? "" : undefined}
            >
              {s.done && !isActive ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <span className="grid h-3.5 w-3.5 place-items-center">{s.icon}</span>
              )}
              <span>
                <span className="opacity-70 mr-1">{idx + 1}.</span>
                {s.label}
              </span>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}

export const STEP_ICONS = {
  user: <User className="h-3 w-3" />,
  briefcase: <Briefcase className="h-3 w-3" />,
  file: <FileText className="h-3 w-3" />,
  shield: <ShieldCheck className="h-3 w-3" />,
};

export default ApplicationProgress;
