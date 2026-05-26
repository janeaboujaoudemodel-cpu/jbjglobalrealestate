/**
 * ApplicantStatusPill — premium, luxury-recruitment status pill.
 *
 * Single source of truth for the full 10-status applicant lifecycle plus
 * a small set of legacy aliases ('pending', 'flagged').
 *
 * Palette is deliberately muted (champagne / muted gold / muted navy /
 * muted emerald / muted burgundy / warm neutral) — never bright startup
 * colours and never gold text (faded-gold prohibition). All text is
 * ink (#1A1A1A) or muted navy (#102540) on tinted champagne surfaces
 * with a 1px hairline border.
 */
import { cn } from "@/lib/utils";
import {
  Sparkles,
  FileText,
  Clock,
  Star,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Archive,
  Lock,
  type LucideIcon,
} from "lucide-react";

export type ApplicantStatus =
  | "new_application"
  | "cv_received"
  | "pending_review"
  | "shortlisted"
  | "interview_scheduled"
  | "interview_completed"
  | "approved"
  | "rejected"
  | "kept_in_records"
  | "position_closed"
  // legacy / fallthrough
  | "pending"
  | "flagged"
  | string;

export interface ApplicantStatusMeta {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for bg + text + border. Muted, ink-on-champagne family. */
  className: string;
  /** Short uppercase chip used in dense rows. */
  short: string;
  /** Sort weight for kanban ordering (low = early in funnel). */
  order: number;
}

// Canonical 10-status map + legacy aliases.
export const APPLICANT_STATUS_META: Record<string, ApplicantStatusMeta> = {
  new_application: {
    id: "new_application",
    label: "New Application",
    short: "NEW",
    icon: Sparkles,
    order: 10,
    className:
      "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60",
  },
  cv_received: {
    id: "cv_received",
    label: "CV Received",
    short: "CV",
    icon: FileText,
    order: 20,
    className:
      "bg-[#F2EAD3] text-[#1A1A1A] border-[#B89555]/50",
  },
  pending_review: {
    id: "pending_review",
    label: "Pending Review",
    short: "REVIEW",
    icon: Clock,
    order: 30,
    className:
      "bg-[#F4ECDB] text-[#1A1A1A] border-[#B89555]/40",
  },
  // legacy alias for old enum value "pending"
  pending: {
    id: "pending",
    label: "Pending Review",
    short: "REVIEW",
    icon: Clock,
    order: 30,
    className:
      "bg-[#F4ECDB] text-[#1A1A1A] border-[#B89555]/40",
  },
  shortlisted: {
    id: "shortlisted",
    label: "Shortlisted",
    short: "SHORT",
    icon: Star,
    order: 40,
    className:
      "bg-[#EBE1C8] text-[#1A1A1A] border-[#B89555]",
  },
  interview_scheduled: {
    id: "interview_scheduled",
    label: "Interview Scheduled",
    short: "SCHED",
    icon: CalendarClock,
    order: 50,
    className:
      "bg-[#E4EAF2] text-[#102540] border-[#102540]/30",
  },
  interview_completed: {
    id: "interview_completed",
    label: "Interview Completed",
    short: "DONE",
    icon: CheckCheck,
    order: 60,
    className:
      "bg-[#D6E0EE] text-[#102540] border-[#102540]/40",
  },
  approved: {
    id: "approved",
    label: "Approved",
    short: "APPR",
    icon: CheckCircle2,
    order: 70,
    className:
      "bg-[#E5EEE5] text-[#1F5132] border-[#1F5132]/30",
  },
  rejected: {
    id: "rejected",
    label: "Rejected",
    short: "REJ",
    icon: XCircle,
    order: 80,
    className:
      "bg-[#F1E1E1] text-[#7A2E2E] border-[#7A2E2E]/25",
  },
  kept_in_records: {
    id: "kept_in_records",
    label: "Kept in Records",
    short: "KEEP",
    icon: Archive,
    order: 90,
    className:
      "bg-[#ECE6DA] text-[#1A1A1A] border-[#1A1A1A]/15",
  },
  position_closed: {
    id: "position_closed",
    label: "Position Closed",
    short: "CLOSED",
    icon: Lock,
    order: 100,
    className:
      "bg-[#E1DCD0] text-[#1A1A1A]/75 border-[#1A1A1A]/20",
  },
  flagged: {
    id: "flagged",
    label: "Flagged",
    short: "FLAG",
    icon: XCircle,
    order: 35,
    className:
      "bg-[#F1E1E1] text-[#7A2E2E] border-[#7A2E2E]/25",
  },
};

/** Canonical 10-status ordering used by tabs / stats. */
export const APPLICANT_STATUS_ORDER: string[] = [
  "new_application",
  "cv_received",
  "pending_review",
  "shortlisted",
  "interview_scheduled",
  "interview_completed",
  "approved",
  "rejected",
  "kept_in_records",
  "position_closed",
];

export function getApplicantStatusMeta(status?: string | null): ApplicantStatusMeta {
  if (!status) return APPLICANT_STATUS_META.new_application;
  return (
    APPLICANT_STATUS_META[status] ?? {
      id: status,
      label: status
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
      short: status.slice(0, 4).toUpperCase(),
      icon: Sparkles,
      order: 999,
      className: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40",
    }
  );
}

interface Props {
  status?: string | null;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function ApplicantStatusPill({
  status,
  size = "md",
  showIcon = true,
  className,
}: Props) {
  const meta = getApplicantStatusMeta(status);
  const Icon = meta.icon;
  const sizing =
    size === "sm"
      ? "text-[10px] leading-none px-2 py-1 gap-1"
      : "text-[11px] leading-none px-2.5 py-1.5 gap-1.5";
  return (
    <span
      data-no-contrast-guard
      className={cn(
        "inline-flex items-center rounded-full border font-semibold tracking-[0.02em] whitespace-nowrap",
        sizing,
        meta.className,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3" strokeWidth={2.25} />}
      <span>{meta.label}</span>
    </span>
  );
}

export default ApplicantStatusPill;
