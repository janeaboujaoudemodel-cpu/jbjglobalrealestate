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

const EMERALD = '#064E3B';
const INK = '#1A1A1A';

// Status groups for organized dropdowns - locked to the JBJ Emerald/Gold system.
export const STATUS_GROUPS = {
  positive: {
    label: 'POSITIVE',
    color: 'text-[#064E3B]',
    bgColor: 'bg-[#FDFBF7]',
    dotColor: EMERALD,
  },
  neutral: {
    label: 'NEUTRAL',
    color: 'text-[#1A1A1A]',
    bgColor: 'bg-[#FDFBF7]',
    dotColor: INK,
  },
  negative: {
    label: 'NEGATIVE',
    color: 'text-[#1A1A1A]',
    bgColor: 'bg-[#FDFBF7]',
    dotColor: INK,
  },
} as const;

// GLOBAL STATUS LIST - These EXACT statuses must be used everywhere
// No alternative lists, no shortened versions, no duplicates
export const PIPELINE_STATUSES: PipelineStatus[] = [
  { value: "hot", label: "Hot", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  { value: "vip", label: "VIP", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  // POSITIVE (green) - Deal progression
  { value: "interested", label: "Interested", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  { value: "qualified", label: "Qualified", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  { value: "viewing", label: "Viewing Scheduled", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  { value: "viewing_done", label: "Viewing Done", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  { value: "negotiation", label: "Negotiation", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  { value: "offer_sent", label: "Offer Sent", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  { value: "closed_won", label: "Closed Won", color: "bg-[#064E3B]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#064E3B]", dotColor: "#FFFFFF", category: "positive" },
  { value: "already_bought", label: "Already Bought", color: "bg-[#FDFBF7]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "neutral" },

  // NEUTRAL (blue) - New / Follow-up / Pending
  { value: "new", label: "New", color: "bg-[#FDFBF7]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "neutral" },
  { value: "contacted", label: "Contacted", color: "bg-[#FDFBF7]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "neutral" },
  { value: "followup", label: "Follow-up", color: "bg-[#FDFBF7]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "neutral" },
  { value: "callback", label: "Call Back", color: "bg-[#FDFBF7]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "neutral" },
  { value: "no_answer", label: "No Response", color: "bg-[#1A1A1A]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "negative" },
  { value: "on_hold", label: "On Hold", color: "bg-[#FDFBF7]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "neutral" },

  // NEUTRAL - Lifecycle states
  { value: "assigned", label: "Assigned", color: "bg-[#FDFBF7]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "neutral" },
  { value: "archived", label: "Archived", color: "bg-[#FDFBF7]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "neutral" },

  // NEGATIVE (red) - Lost / DNC / Invalid / Deleted
  { value: "not_interested", label: "Not Interested", color: "bg-[#1A1A1A]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "negative" },
  { value: "closed_lost", label: "Lost", color: "bg-[#1A1A1A]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "negative" },
  { value: "do_not_contact", label: "Do Not Contact", color: "bg-[#1A1A1A]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "negative" },
  { value: "junk", label: "Invalid Lead", color: "bg-[#1A1A1A]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "negative" },
  { value: "deleted", label: "Deleted", color: "bg-[#1A1A1A]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "negative" },
  { value: "permanently_erased", label: "Permanently Erased", color: "bg-[#1A1A1A]", bgColor: "bg-[#FDFBF7]", textColor: "text-[#1A1A1A]", dotColor: INK, category: "negative" },
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

  const isEmeraldStatus = statusInfo.category === 'positive' || statusInfo.color.includes('#064E3B') || statusInfo.color.includes('emerald');
  const toneClass = isEmeraldStatus
    ? 'allow-white bg-[#064E3B] text-white border-transparent'
    : 'bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/35';
  
  const Component = onClick ? 'button' : 'span';
  
  return (
    <Component
      onClick={onClick}
      disabled={onClick ? false : undefined}
      data-surface={isEmeraldStatus ? "emerald" : undefined}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border font-bold transition-all whitespace-nowrap",
        sizeClasses[size],
        toneClass,
        onClick && "jj-hover-emerald hover:shadow-sm cursor-pointer",
        !onClick && "cursor-default",
        className,
      )}
    >
      {showDot && !isEmeraldStatus && (
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