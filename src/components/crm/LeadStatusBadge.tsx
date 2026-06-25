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
    bgColor: 'jj-surface-emerald-soft',
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
  { value: "hot", label: "Hot", color: "bg-orange-500", bgColor: "bg-orange-500/15", textColor: "text-orange-700", dotColor: "#F97316", category: "positive" },
  // VIP — yellow/amber (premium tier)
  { value: "vip", label: "VIP", color: "bg-amber-400", bgColor: "bg-amber-400/25", textColor: "text-amber-800", dotColor: "#F59E0B", category: "positive" },
  // POSITIVE (green) - Deal progression
  { value: "interested", label: "Interested", color: "jj-surface-emerald", bgColor: "jj-surface-emerald/15", textColor: "text-[color:var(--emerald-1)]", dotColor: "#10B981", category: "positive" },
  { value: "qualified", label: "Qualified", color: "jj-surface-emerald", bgColor: "jj-surface-emerald/15", textColor: "text-[color:var(--emerald-1)]", dotColor: "#10B981", category: "positive" },
  { value: "viewing", label: "Viewing Scheduled", color: "jj-surface-emerald", bgColor: "jj-surface-emerald/15", textColor: "text-[color:var(--emerald-1)]", dotColor: "#059669", category: "positive" },
  { value: "viewing_done", label: "Viewing Done", color: "jj-surface-emerald", bgColor: "jj-surface-emerald/15", textColor: "text-[color:var(--emerald-1)]", dotColor: "#059669", category: "positive" },
  { value: "negotiation", label: "Negotiation", color: "jj-surface-emerald", bgColor: "jj-surface-emerald/15", textColor: "text-[color:var(--emerald-1)]", dotColor: "#10B981", category: "positive" },
  { value: "offer_sent", label: "Offer Sent", color: "jj-surface-emerald", bgColor: "jj-surface-emerald/15", textColor: "text-[color:var(--emerald-1)]", dotColor: "#10B981", category: "positive" },
  { value: "closed_won", label: "Closed Won", color: "jj-surface-emerald", bgColor: "jj-surface-emerald-soft", textColor: "text-[color:var(--emerald-1)]", dotColor: "#047857", category: "positive" },
  // ALREADY BOUGHT — blue
  { value: "already_bought", label: "Already Bought", color: "bg-blue-500", bgColor: "bg-blue-500/15", textColor: "text-blue-700", dotColor: "#2563EB", category: "neutral" },

  // NEUTRAL (blue) - New / Follow-up / Pending
  { value: "new", label: "New", color: "bg-blue-500", bgColor: "bg-blue-500/15", textColor: "text-blue-700", dotColor: "#3B82F6", category: "neutral" },
  { value: "contacted", label: "Contacted", color: "bg-blue-400", bgColor: "bg-blue-400/15", textColor: "text-blue-700", dotColor: "#3B82F6", category: "neutral" },
  { value: "followup", label: "Follow-up", color: "bg-blue-500", bgColor: "bg-blue-500/15", textColor: "text-blue-700", dotColor: "#3B82F6", category: "neutral" },
  { value: "callback", label: "Call Back", color: "bg-blue-400", bgColor: "bg-blue-400/15", textColor: "text-blue-700", dotColor: "#3B82F6", category: "neutral" },
  // NO RESPONSE — dark red
  { value: "no_answer", label: "No Response", color: "bg-rose-800", bgColor: "bg-rose-800/15", textColor: "text-rose-900", dotColor: "#9F1239", category: "negative" },
  { value: "on_hold", label: "On Hold", color: "bg-blue-300", bgColor: "bg-blue-300/15", textColor: "text-blue-700", dotColor: "#60A5FA", category: "neutral" },

  // NEUTRAL - Lifecycle states
  { value: "assigned", label: "Assigned", color: "bg-blue-500", bgColor: "bg-blue-500/15", textColor: "text-blue-700", dotColor: "#3B82F6", category: "neutral" },
  { value: "archived", label: "Archived", color: "bg-[#F7F2EA]", bgColor: "bg-[#F7F2EA]/15", textColor: "text-[#1A1A1A]/80", dotColor: "#94A3B8", category: "neutral" },

  // NEGATIVE (red) - Lost / DNC / Invalid / Deleted
  { value: "not_interested", label: "Not Interested", color: "bg-red-500", bgColor: "bg-red-500/15", textColor: "text-red-700", dotColor: "#DC2626", category: "negative" },
  { value: "closed_lost", label: "Lost", color: "bg-red-500", bgColor: "bg-red-500/15", textColor: "text-red-700", dotColor: "#DC2626", category: "negative" },
  { value: "do_not_contact", label: "Do Not Contact", color: "bg-red-600", bgColor: "bg-red-600/15", textColor: "text-red-800", dotColor: "#B91C1C", category: "negative" },
  // JUNK — red
  { value: "junk", label: "Invalid Lead", color: "bg-red-500", bgColor: "bg-red-500/15", textColor: "text-red-700", dotColor: "#DC2626", category: "negative" },
  { value: "deleted", label: "Deleted", color: "bg-red-700", bgColor: "bg-red-700/15", textColor: "text-red-800", dotColor: "#B91C1C", category: "negative" },
  { value: "permanently_erased", label: "Permanently Erased", color: "bg-red-900", bgColor: "bg-red-900/15", textColor: "text-red-900", dotColor: "#7F1D1D", category: "negative" },
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

  const toneClass =
    statusInfo.category === 'positive'
      ? 'jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30'
      : statusInfo.category === 'negative'
        ? 'bg-red-50 text-red-800 border-red-200'
        : 'bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/35';
  
  const Component = onClick ? 'button' : 'span';
  
  return (
    <Component
      onClick={onClick}
      disabled={onClick ? false : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full font-bold transition-all whitespace-nowrap",
        sizeClasses[size],
        toneClass,
        onClick && "hover:shadow-sm cursor-pointer",
        !onClick && "cursor-default",
        className,
      )}
    >
      {showDot && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusInfo.dotColor }}
        />
      )}
      <span className="font-semibold tracking-wide uppercase text-[inherit]">
        {statusInfo.label}
      </span>
    </Component>
  );
};

export default LeadStatusBadge;