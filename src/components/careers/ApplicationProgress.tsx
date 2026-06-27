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
      ? ((activeStep + 1) / total) * 100
      : 0;
  const raw = Math.max(validityPct, wizardFloor);
  // Cap at 95% until every section is actually valid — hits 100% only on full completion.
  const pct =
    completed === total
      ? 100
      : Math.min(95, Math.max(5, Math.round(raw)));



  return (
    <div className="rounded-2xl border border-[#047857]/25 bg-[linear-gradient(180deg,rgba(253,251,247,0.98),rgba(247,242,234,0.96))] p-5 shadow-[0_18px_42px_-30px_rgba(6,78,59,0.18)]">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#047857]">
            Application Progress
          </p>
          <p
            className="text-sm font-semibold text-[#1A1A1A] mt-0.5"
            translate="no"
            data-no-translate="true"
          >
            {typeof activeStep === "number" ? (
              <>
                <span translate="no">Step {activeStep + 1} of {steps.length}</span>
                <span className="text-[#1A1A1A]/60"> — </span>
                <span translate="no" data-no-translate="true">{steps[activeStep]?.label}</span>
              </>
            ) : (
              <span translate="no">{completed} of {steps.length} sections complete</span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-[#047857] leading-none">{pct}%</p>
        </div>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-[#047857]/20 bg-[#047857]/10 mb-4 shadow-inner">
        <div
          className="absolute left-0 top-0 h-full rounded-full shadow-[0_6px_16px_-8px_rgba(6,78,59,0.55)] transition-all duration-500"
          style={{ width: `${pct}%`, background: 'linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)' }}
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
                "flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-semibold transition-all",
                clickable && "cursor-pointer hover:-translate-y-0.5",
                isActive
                  ? "careers-pill-active allow-white data-[allow-dark-cta]:text-white"
                  : "careers-pill-inactive hover:border-[#BFA46A] hover:shadow-[0_14px_22px_-18px_rgba(7,27,51,0.4)]"
              )}

              style={isActive ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}
              data-allow-dark-cta={isActive ? "" : undefined}
              data-no-contrast-guard={isActive ? "" : undefined}
            >
              {s.done && !isActive ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0A0A0A]" />
              ) : (
                <span className="grid h-4.5 w-4.5 place-items-center text-[#1A1A1A]" style={isActive ? { color: "#FFFFFF" } : undefined}>{s.icon}</span>
              )}
              <span style={isActive ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}>
                <span className="mr-1">{idx + 1}.</span>
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
