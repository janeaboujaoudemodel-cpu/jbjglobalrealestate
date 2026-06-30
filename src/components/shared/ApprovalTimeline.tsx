import { CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ApprovalStep {
  name: string;
  title: string;
  photoUrl?: string;
  status: "pending" | "approved" | "rejected" | "in_review";
  rejectionReason?: string;
  timestamp?: string;
}

interface ApprovalTimelineProps {
  steps: ApprovalStep[];
  className?: string;
}

const STEP_STYLES = {
  pending: {
    border: "border-[#B89555]/30",
    bg: "bg-[#B89555]/10",
    icon: Clock,
    iconColor: "text-[#1A1A1A]/70",
    label: "Pending",
    badgeClass: "bg-[#B89555]/10 text-[#1A1A1A]/70 border-[#B89555]/30",
  },
  in_review: {
    border: "border-amber-400/40",
    bg: "bg-amber-500/10",
    icon: Clock,
    iconColor: "text-[#1A1A1A]",
    label: "In Review",
    badgeClass: "bg-amber-500/10 text-[#1A1A1A] border-amber-500/30",
  },
  approved: {
    border: "border-[color:var(--emerald-1)]/30/40",
    bg: "jj-surface-emerald-soft",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    label: "Approved",
    badgeClass: "jj-surface-emerald-soft text-emerald-500 border-[color:var(--emerald-1)]/30/30",
  },
  rejected: {
    border: "border-red-500/40",
    bg: "bg-red-500/10",
    icon: XCircle,
    iconColor: "text-red-500",
    label: "Rejected",
    badgeClass: "bg-red-500/10 text-red-500 border-red-500/30",
  },
};

/** Default 3-step JBJ approval workflow */
export const JBJ_APPROVAL_STEPS: ApprovalStep[] = [
  {
    name: "Sarah Al-Mansouri",
    title: "Admin Reviewer",
    photoUrl: undefined,
    status: "pending",
  },
  {
    name: "David Chen",
    title: "Managing Director",
    photoUrl: undefined,
    status: "pending",
  },
  {
    name: "Jane Bou Jaoude",
    title: "Founder & CEO",
    photoUrl: undefined,
    status: "pending",
  },
];

export default function ApprovalTimeline({ steps, className }: ApprovalTimelineProps) {
  const allApproved = steps.every((s) => s.status === "approved");
  const hasRejection = steps.some((s) => s.status === "rejected");

  return (
    <div className={cn("space-y-0", className)}>
      {steps.map((step, idx) => {
        const style = STEP_STYLES[step.status];
        const Icon = style.icon;
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} className="relative flex gap-4">
            {/* Vertical connector line */}
            {!isLast && (
              <div className="absolute left-[23px] top-[52px] w-0.5 h-[calc(100%-20px)] bg-gradient-to-b from-[hsl(36,30%,70%)]/40 to-transparent" />
            )}

            {/* Avatar / icon circle */}
            <div className={cn("relative z-10 flex-shrink-0 w-[48px] h-[48px] rounded-full border-2 flex items-center justify-center", style.border, style.bg)}>
              {step.photoUrl ? (
                <img src={step.photoUrl} alt={step.name} className="w-full h-full rounded-full object-cover"  loading="lazy" decoding="async" />
              ) : (
                <span className="text-sm font-bold text-[hsl(36,30%,70%)]">
                  {step.name.split(" ").map((n) => n[0]).join("")}
                </span>
              )}
              {/* Status indicator dot */}
              <div className={cn("absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center", style.bg)}>
                <Icon className={cn("w-3 h-3", style.iconColor)} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground">{step.name}</span>
                <span className="text-xs text-muted-foreground">· {step.title}</span>
                <Badge className={cn("text-[10px] h-5", style.badgeClass)}>{style.label}</Badge>
              </div>
              {step.timestamp && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{step.timestamp}</p>
              )}
              {step.status === "rejected" && step.rejectionReason && (
                <div className="mt-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-red-500">Reason for Rejection</p>
                      <p className="text-xs text-muted-foreground mt-1">{step.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Final status */}
      {allApproved && (
        <div className="flex items-center gap-3 p-4 rounded-xl jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/30">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          <div>
            <p className="font-semibold text-sm text-emerald-500">Congratulations!</p>
            <p className="text-xs text-muted-foreground">Your submission has been fully approved.</p>
          </div>
        </div>
      )}
      {hasRejection && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <XCircle className="w-6 h-6 text-red-500" />
          <div>
            <p className="font-semibold text-sm text-red-500">Action Required</p>
            <p className="text-xs text-muted-foreground">Please review the rejection reason above, fix the issues, and resubmit.</p>
          </div>
        </div>
      )}
    </div>
  );
}
