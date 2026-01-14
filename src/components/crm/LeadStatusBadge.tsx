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

// Status groups for organized dropdowns - vivid colors
// Using YELLOW/AMBER for neutral instead of blue per user request
export const STATUS_GROUPS = {
  positive: {
    label: 'POSITIVE',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    dotColor: '#22C55E', // Green
  },
  neutral: {
    label: 'NEUTRAL',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    dotColor: '#F59E0B', // Amber/Yellow
  },
  negative: {
    label: 'NEGATIVE',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    dotColor: '#EF4444', // Red
  },
} as const;

export const PIPELINE_STATUSES: PipelineStatus[] = [
  // POSITIVE (green) - Deal progression
  { value: "interested", label: "Interested", color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-300", dotColor: "#22C55E", category: "positive" },
  { value: "qualified", label: "Qualified", color: "bg-green-500", bgColor: "bg-green-500/20", textColor: "text-green-300", dotColor: "#22C55E", category: "positive" },
  { value: "viewing", label: "Viewing Scheduled", color: "bg-emerald-600", bgColor: "bg-emerald-600/20", textColor: "text-emerald-200", dotColor: "#22C55E", category: "positive" },
  { value: "viewing_done", label: "Viewing Done", color: "bg-green-600", bgColor: "bg-green-600/20", textColor: "text-green-200", dotColor: "#22C55E", category: "positive" },
  { value: "negotiation", label: "Negotiation", color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-300", dotColor: "#22C55E", category: "positive" },
  { value: "closed_won", label: "Closed Won", color: "bg-green-600", bgColor: "bg-green-600/20", textColor: "text-green-100", dotColor: "#22C55E", category: "positive" },
  
  // NEUTRAL (yellow/amber) - New / Follow-up
  { value: "new", label: "New", color: "bg-amber-500", bgColor: "bg-amber-500/20", textColor: "text-amber-300", dotColor: "#F59E0B", category: "neutral" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500", bgColor: "bg-yellow-500/20", textColor: "text-yellow-300", dotColor: "#F59E0B", category: "neutral" },
  { value: "followup", label: "Follow-up", color: "bg-amber-400", bgColor: "bg-amber-400/20", textColor: "text-amber-300", dotColor: "#F59E0B", category: "neutral" },
  { value: "callback", label: "Callback Requested", color: "bg-yellow-400", bgColor: "bg-yellow-400/20", textColor: "text-yellow-200", dotColor: "#F59E0B", category: "neutral" },
  { value: "no_answer", label: "No Answer", color: "bg-amber-600", bgColor: "bg-amber-600/20", textColor: "text-amber-300", dotColor: "#F59E0B", category: "neutral" },
  
  // NEGATIVE (red) - Lost / DNC
  { value: "not_interested", label: "Not Interested", color: "bg-rose-500", bgColor: "bg-rose-500/20", textColor: "text-rose-300", dotColor: "#EF4444", category: "negative" },
  { value: "do_not_contact", label: "Do Not Contact", color: "bg-red-600", bgColor: "bg-red-600/20", textColor: "text-red-300", dotColor: "#EF4444", category: "negative" },
  { value: "already_bought", label: "Already Bought", color: "bg-orange-500", bgColor: "bg-orange-500/20", textColor: "text-orange-300", dotColor: "#F59E0B", category: "negative" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-500", bgColor: "bg-red-500/20", textColor: "text-red-300", dotColor: "#EF4444", category: "negative" },
  { value: "junk", label: "Junk", color: "bg-gray-500", bgColor: "bg-gray-500/20", textColor: "text-gray-300", dotColor: "#6B7280", category: "negative" },
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
    sm: "px-2.5 py-1 text-[10px]",
    md: "px-3.5 py-1.5 text-xs",
    lg: "px-5 py-2 text-sm"
  };

  // Special styling for "New" status - gold/white premium look
  const isNew = status === 'new' || !status;
  
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-bold transition-all shadow-sm",
        sizeClasses[size],
        isNew 
          ? "bg-gradient-to-r from-amber-400 via-gold to-amber-500 text-zinc-900 border border-gold/50 shadow-gold/20" 
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
            isNew ? "bg-zinc-900 ring-zinc-900/30" : "ring-current/30"
          )}
          style={!isNew ? { backgroundColor: statusInfo.dotColor } : undefined}
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
    </button>
  );
};

export default LeadStatusBadge;
