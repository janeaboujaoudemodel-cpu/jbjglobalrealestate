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
    dotColor: '#EF4444', // Red
  },
} as const;

// GLOBAL STATUS LIST - These EXACT statuses must be used everywhere
// No alternative lists, no shortened versions, no duplicates
export const PIPELINE_STATUSES: PipelineStatus[] = [
  // POSITIVE (green) - Deal progression
  { value: "interested", label: "Interested", color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-300", dotColor: "#22C55E", category: "positive" },
  { value: "qualified", label: "Qualified", color: "bg-green-500", bgColor: "bg-green-500/20", textColor: "text-green-300", dotColor: "#22C55E", category: "positive" },
  { value: "viewing", label: "Viewing Scheduled", color: "bg-emerald-600", bgColor: "bg-emerald-600/20", textColor: "text-emerald-200", dotColor: "#22C55E", category: "positive" },
  { value: "viewing_done", label: "Viewing Done", color: "bg-green-600", bgColor: "bg-green-600/20", textColor: "text-green-200", dotColor: "#22C55E", category: "positive" },
  { value: "negotiation", label: "Negotiation", color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-300", dotColor: "#22C55E", category: "positive" },
  { value: "offer_sent", label: "Offer Sent", color: "bg-emerald-400", bgColor: "bg-emerald-400/20", textColor: "text-emerald-300", dotColor: "#22C55E", category: "positive" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-600", bgColor: "bg-green-600/20", textColor: "text-green-100", dotColor: "#22C55E", category: "positive" },
  { value: "already_bought", label: "Already Bought", color: "bg-green-700", bgColor: "bg-green-700/20", textColor: "text-green-200", dotColor: "#16A34A", category: "positive" },
  
  // NEUTRAL (blue) - New / Follow-up / Pending
  { value: "new", label: "New", color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-300", dotColor: "#3B82F6", category: "neutral" },
  { value: "contacted", label: "Contacted", color: "bg-blue-400", bgColor: "bg-blue-400/20", textColor: "text-blue-300", dotColor: "#3B82F6", category: "neutral" },
  { value: "followup", label: "Follow-up", color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-300", dotColor: "#3B82F6", category: "neutral" },
  { value: "callback", label: "Call Back", color: "bg-blue-400", bgColor: "bg-blue-400/20", textColor: "text-blue-200", dotColor: "#3B82F6", category: "neutral" },
  { value: "no_answer", label: "No Response", color: "bg-blue-600", bgColor: "bg-blue-600/20", textColor: "text-blue-300", dotColor: "#3B82F6", category: "neutral" },
  { value: "on_hold", label: "On Hold", color: "bg-blue-300", bgColor: "bg-blue-300/20", textColor: "text-blue-200", dotColor: "#93C5FD", category: "neutral" },
  
  // NEGATIVE (red) - Lost / DNC / Invalid
  { value: "not_interested", label: "Not Interested", color: "bg-red-500", bgColor: "bg-red-500/20", textColor: "text-red-300", dotColor: "#EF4444", category: "negative" },
  { value: "closed_lost", label: "Lost", color: "bg-red-500", bgColor: "bg-red-500/20", textColor: "text-red-300", dotColor: "#EF4444", category: "negative" },
  { value: "do_not_contact", label: "Do Not Contact", color: "bg-red-600", bgColor: "bg-red-600/20", textColor: "text-red-300", dotColor: "#EF4444", category: "negative" },
  { value: "junk", label: "Invalid Lead", color: "bg-red-400", bgColor: "bg-red-400/20", textColor: "text-red-300", dotColor: "#EF4444", category: "negative" },
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
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all shadow-sm",
        sizeClasses[size],
        isNew 
          ? "bg-blue-500/20 text-blue-300 border border-blue-400/30" 
          : cn(statusInfo.bgColor, statusInfo.textColor, "border border-current/20"),
        onClick && "hover:scale-105 hover:shadow-md cursor-pointer group",
        !onClick && "cursor-default",
        className
      )}
    >
      {showDot && (
        <span 
          className={cn(
            "w-2 h-2 rounded-full ring-2",
            "ring-current/30"
          )}
          style={{ backgroundColor: statusInfo.dotColor }}
        />
      )}
      <span className="font-bold tracking-wide uppercase text-center">
        {statusInfo.label}
      </span>
      {onClick && (
        <svg 
          className={cn(
            "w-3 h-3 transition-transform",
            isNew ? "text-zinc-800" : "text-current/70",
            "group-hover:translate-y-0.5"
          )} 
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