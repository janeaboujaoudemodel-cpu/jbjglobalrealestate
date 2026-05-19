/**
 * BrokerStatusBadge — single unified lifecycle badge for brokers and grants.
 *
 * Replaces the old dual invitation/grant badges and the black-fill "Revoked" /
 * "Blocked" pills. JBJ champagne palette only — no black or blue fills, gold
 * survives only as 1px hairline (per the No-Gold-Fills standard).
 *
 * States: active | pending | suspended | revoked | blocked | expired
 */
import { cn } from "@/lib/utils";
import {
  CheckCircle2, Clock, PauseCircle, XCircle, Ban, AlarmClockOff,
} from "lucide-react";

export type BrokerLifecycleState =
  | "active"
  | "pending"
  | "suspended"
  | "revoked"
  | "blocked"
  | "expired";

const MAP: Record<BrokerLifecycleState, { label: string; cls: string; Icon: any }> = {
  active:    { label: "Active",    cls: "bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]",      Icon: CheckCircle2 },
  pending:   { label: "Pending",   cls: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60",   Icon: Clock },
  suspended: { label: "Suspended", cls: "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/50",   Icon: PauseCircle },
  revoked:   { label: "Revoked",   cls: "bg-[#F7F2EA] text-[#1A1A1A]/80 border-[#B89555]/40", Icon: XCircle },
  blocked:   { label: "Blocked",   cls: "bg-[#F7F2EA] text-[#1A1A1A]/80 border-[#B89555]/40", Icon: Ban },
  expired:   { label: "Expired",   cls: "bg-[#F7F2EA] text-[#1A1A1A]/60 border-[#B89555]/30", Icon: AlarmClockOff },
};

export function BrokerStatusBadge({
  state,
  label,
  className,
  showIcon = true,
}: {
  state: BrokerLifecycleState;
  label?: string;
  className?: string;
  showIcon?: boolean;
}) {
  const cfg = MAP[state];
  const Icon = cfg.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap",
        cfg.cls,
        className,
      )}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      {label ?? cfg.label}
    </span>
  );
}

/** Derive a single lifecycle state from grant + broker raw fields. */
export function deriveBrokerLifecycle(opts: {
  blocked_at?: string | null;
  revoked_at?: string | null;
  suspended_at?: string | null;
  expires_at?: string | null;
  invitation_status?: string | null;
  activated_at?: string | null;
}): BrokerLifecycleState {
  if (opts.blocked_at) return "blocked";
  if (opts.revoked_at) return "revoked";
  if (opts.suspended_at) return "suspended";
  if (opts.expires_at && new Date(opts.expires_at) < new Date()) return "expired";
  if (opts.invitation_status === "expired") return "expired";
  if (opts.invitation_status === "revoked") return "revoked";
  if (opts.activated_at) return "active";
  if (
    opts.invitation_status === "invited" ||
    opts.invitation_status === "otp_sent" ||
    opts.invitation_status === "pending"
  ) return "pending";
  return "active";
}

export default BrokerStatusBadge;
