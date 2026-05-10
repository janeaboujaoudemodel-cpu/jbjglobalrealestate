import { cn } from "@/lib/utils";

export interface PipelineStatus {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  dotColor: string;
  category: 'positive' | 'neutral' | 'negative';
}

// Status groups for organized dropdowns - standardized colors
// POSITIVE = Green, NEUTRAL = Blue, NEGATIVE = Red
export const STATUS_GROUPS = {
  positive: {
    label: 'POSITIVE',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    dotColor: '#22C55E', // Green
  },
  neutral: {
    label: 'NEUTRAL',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    dotColor: '#3B82F6', // Blue
  },
  negative: {
    label: 'NEGATIVE',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    dotColor: '#DC2626', // Red
  },
} as const;

// GLOBAL STATUS LIST - These EXACT statuses must be used everywhere
// No alternative lists, no shortened versions, no duplicates
export const PIPELINE_STATUSES: PipelineStatus[] = [
  // HOT — orange (high-temperature lead)
  { value: "hot", label: "Hot", color: "bg-orange-500", bgColor: "bg-orange-500/20", textColor: "text-orange-700", dotColor: "#F97316", category: "positive" },
  // VIP — yellow (premium tier)
  { value: "vip", label: "VIP", color: "bg-amber-400", bgColor: "bg-amber-400/25", textColor: "text-amber-800", dotColor: "#F59E0B", category: "positive" },
  // POSITIVE (green) - Deal progression
  { value: "interested", label: "Interested", color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-700", dotColor: "#22C55E", category: "positive" },
  { value: "qualified", label: "Qualified", color: "bg-green-500", bgColor: "bg-green-500/20", textColor: "text-green-300", dotColor: "#22C55E", category: "positive" },
  { value: "viewing", label: "Viewing Scheduled", color: "bg-emerald-600", bgColor: "bg-emerald-600/20", textColor: "text-emerald-200", dotColor: "#22C55E", category: "positive" },
  { value: "viewing_done", label: "Viewing Done", color: "bg-green-600", bgColor: "bg-green-600/20", textColor: "text-green-200", dotColor: "#22C55E", category: "positive" },
  { value: "negotiation", label: "Negotiation", color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-300", dotColor: "#22C55E", category: "positive" },
  { value: "offer_sent", label: "Offer Sent", color: "bg-emerald-400", bgColor: "bg-emerald-400/20", textColor: "text-emerald-300", dotColor: "#22C55E", category: "positive" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-600", bgColor: "bg-green-600/20", textColor: "text-green-100", dotColor: "#22C55E", category: "positive" },
  { value: "already_bought", label: "Already Bought", color: "bg-blue-500", bgColor: "bg-blue-500/25", textColor: "text-blue-700", dotColor: "#3B82F6", category: "neutral" },
  
  // NEUTRAL (blue) - New / Follow-up / Pending
  { value: "new", label: "New", color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-300", dotColor: "#3B82F6", category: "neutral" },
  { value: "contacted", label: "Contacted", color: "bg-blue-400", bgColor: "bg-blue-400/20", textColor: "text-blue-300", dotColor: "#3B82F6", category: "neutral" },
  { value: "followup", label: "Follow-up", color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-300", dotColor: "#3B82F6", category: "neutral" },
  { value: "callback", label: "Call Back", color: "bg-blue-400", bgColor: "bg-blue-400/20", textColor: "text-blue-200", dotColor: "#3B82F6", category: "neutral" },
  { value: "no_answer", label: "No Response", color: "bg-rose-800", bgColor: "bg-rose-800/20", textColor: "text-rose-900", dotColor: "#9F1239", category: "negative" },
  { value: "on_hold", label: "On Hold", color: "bg-blue-300", bgColor: "bg-blue-300/20", textColor: "text-blue-200", dotColor: "#93C5FD", category: "neutral" },
  
  // NEUTRAL (blue) - Lifecycle states
  { value: "assigned", label: "Assigned", color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-300", dotColor: "#3B82F6", category: "neutral" },
  { value: "archived", label: "Archived", color: "bg-slate-400", bgColor: "bg-slate-400/20", textColor: "text-slate-300", dotColor: "#94A3B8", category: "neutral" },

  // NEGATIVE (red) - Lost / DNC / Invalid / Deleted
  { value: "not_interested", label: "Not Interested", color: "bg-red-500", bgColor: "bg-red-500/20", textColor: "text-red-300", dotColor: "#DC2626", category: "negative" },
  { value: "closed_lost", label: "Lost", color: "bg-red-500", bgColor: "bg-red-500/20", textColor: "text-red-300", dotColor: "#DC2626", category: "negative" },
  { value: "do_not_contact", label: "Do Not Contact", color: "bg-red-600", bgColor: "bg-red-600/20", textColor: "text-red-300", dotColor: "#DC2626", category: "negative" },
  { value: "junk", label: "Invalid Lead", color: "bg-red-400", bgColor: "bg-red-400/20", textColor: "text-red-300", dotColor: "#DC2626", category: "negative" },
  { value: "deleted", label: "Deleted", color: "bg-red-700", bgColor: "bg-red-700/20", textColor: "text-red-200", dotColor: "#B91C1C", category: "negative" },
  { value: "permanently_erased", label: "Permanently Erased", color: "bg-red-900", bgColor: "bg-red-900/20", textColor: "text-red-100", dotColor: "#7F1D1D", category: "negative" },
];

export const getStatusInfo = (status: string | undefined): PipelineStatus => {
  return PIPELINE_STATUSES.find(s => s.value === status) || PIPELINE_STATUSES.find(s => s.value === 'new')!;
};

interface LeadStatusBadgeProps {
  status: string | undefined;
  onClick?: () => void;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LeadStatusBadge = ({ 
  status, 
  onClick, 
  showDot = true, 
  size = 'md',
  className 
}: LeadStatusBadgeProps) => {
  const statusInfo = getStatusInfo(status);
  
  const sizeClasses = {
    sm: "px-2 py-1 text-[10px]",
    md: "px-3 py-1.5 text-xs",
    lg: "px-4 py-2 text-sm"
  };

  // Special styling for "New" status - blue neutral theme
  const isNew = status === 'new' || !status;
  
  const Component = onClick ? 'button' : 'span';
  
  return (
    <Component
      onClick={onClick}
      disabled={onClick ? false : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition-all shadow-sm whitespace-nowrap",
        sizeClasses[size],
        isNew
          ? "bg-blue-500/15 text-blue-700 border border-blue-400/30"
          : cn(statusInfo.bgColor, statusInfo.textColor, "border border-current/20"),
        onClick && "hover:shadow-md cursor-pointer group",
        !onClick && "cursor-default",
        className,
      )}
    >
      {showDot && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-black/5"
          style={{ backgroundColor: statusInfo.dotColor }}
        />
      )}
      <span className="font-semibold tracking-wide uppercase text-[inherit]">
        {statusInfo.label}
      </span>
      {onClick && (
        <svg
          className="w-3 h-3 opacity-70 transition-transform group-hover:translate-y-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </Component>
  );
};

export default LeadStatusBadge;