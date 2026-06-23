import * as React from "react";
import { cn } from "@/lib/utils";
import { EmeraldDot } from "@/components/ui/emerald/EmeraldDot";

/**
 * StatusTimeline — single primitive for every back-office stage/timeline strip
 * (Lead status, applicant flow, broker lifecycle, etc.).
 *
 * Rules (locked):
 *  - Emerald dot per step (active = filled emerald, idle = gold-hairline ring,
 *    complete = filled emerald).
 *  - Gold-champagne label under the dot. No background, no chip, no frame.
 *  - Thin gold hairline connecting the dots.
 *  - Pages must NOT add their own border/bg/rounded wrappers. The wrapper is
 *    a bare flex row, intentionally framework-less.
 */

export type StatusTimelineStep = {
  key: string;
  label: string;
  state?: "idle" | "active" | "complete";
};

export interface StatusTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: StatusTimelineStep[];
  /** Optional override; default detects last `complete` then `active` */
  activeKey?: string;
}

export const StatusTimeline = React.forwardRef<HTMLDivElement, StatusTimelineProps>(
  ({ steps, activeKey, className, ...rest }, ref) => {
    const resolved = React.useMemo(() => {
      if (!activeKey) return steps;
      let seenActive = false;
      return steps.map((s) => {
        if (s.key === activeKey) {
          seenActive = true;
          return { ...s, state: "active" as const };
        }
        return { ...s, state: seenActive ? ("idle" as const) : ("complete" as const) };
      });
    }, [steps, activeKey]);

    return (
      <div
        ref={ref}
        data-bk-timeline=""
        className={cn(
          "flex items-start justify-between w-full gap-2 px-1 py-3",
          // No card frame, no shadow, no border, no background.
          className,
        )}
        {...rest}
      >
        {resolved.map((step, i) => {
          const state = step.state ?? "idle";
          const isLast = i === resolved.length - 1;
          return (
            <div key={step.key} className="flex-1 min-w-0 flex flex-col items-center relative">
              {/* connector hairline (skip on last) */}
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute top-[7px] left-1/2 right-[-50%] h-px"
                  style={{ background: "rgba(184, 149, 85, 0.45)" }}
                />
              )}

              {state === "idle" ? (
                <span
                  className="relative inline-block w-3.5 h-3.5 rounded-full"
                  style={{
                    background: "#FDFBF7",
                    boxShadow: "inset 0 0 0 1.5px rgba(184, 149, 85, 0.55)",
                  }}
                />
              ) : (
                <EmeraldDot
                  size={14}
                  className={cn("relative", state === "active" && "ring-2 ring-[color:var(--bk-emerald,#064E3B)]/30")}
                />
              )}

              <span
                className={cn(
                  "mt-2 text-[11px] tracking-wide uppercase text-center truncate w-full",
                  state === "active"
                    ? "font-semibold text-[color:var(--bk-ink,#1A1A1A)]"
                    : state === "complete"
                      ? "text-[color:var(--bk-emerald,#064E3B)]"
                      : "text-[color:var(--bk-gold,#B89555)]",
                )}
                title={step.label}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  },
);
StatusTimeline.displayName = "StatusTimeline";

export default StatusTimeline;
