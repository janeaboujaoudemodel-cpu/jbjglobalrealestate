import { cn } from "@/lib/utils";

export interface PipelineStatus {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  category: 'positive' | 'neutral' | 'warning' | 'negative';
}

export const PIPELINE_STATUSES: PipelineStatus[] = [
  // Neutral / New
  { value: "new", label: "New", color: "bg-blue-500", bgColor: "bg-blue-500/20", textColor: "text-blue-400", category: "neutral" },
  
  // Positive progression
  { value: "contacted", label: "Contacted", color: "bg-cyan-500", bgColor: "bg-cyan-500/20", textColor: "text-cyan-400", category: "neutral" },
  { value: "interested", label: "Interested", color: "bg-emerald-500", bgColor: "bg-emerald-500/20", textColor: "text-emerald-400", category: "positive" },
  { value: "qualified", label: "Qualified", color: "bg-green-500", bgColor: "bg-green-500/20", textColor: "text-green-400", category: "positive" },
  { value: "viewing", label: "Viewing Scheduled", color: "bg-purple-500", bgColor: "bg-purple-500/20", textColor: "text-purple-400", category: "positive" },
  { value: "viewing_done", label: "Viewing Done", color: "bg-violet-500", bgColor: "bg-violet-500/20", textColor: "text-violet-400", category: "positive" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-500", bgColor: "bg-orange-500/20", textColor: "text-orange-400", category: "positive" },
  { value: "closed_won", label: "Closed Won", color: "bg-emerald-600", bgColor: "bg-emerald-600/20", textColor: "text-emerald-300", category: "positive" },
  
  // Warning / Follow-up needed
  { value: "no_answer", label: "No Answer", color: "bg-amber-500", bgColor: "bg-amber-500/20", textColor: "text-amber-400", category: "warning" },
  { value: "callback", label: "Callback Requested", color: "bg-yellow-500", bgColor: "bg-yellow-500/20", textColor: "text-yellow-400", category: "warning" },
  { value: "followup", label: "Follow-up", color: "bg-sky-500", bgColor: "bg-sky-500/20", textColor: "text-sky-400", category: "warning" },
  
  // Negative / Lost
  { value: "not_interested", label: "Not Interested", color: "bg-rose-500", bgColor: "bg-rose-500/20", textColor: "text-rose-400", category: "negative" },
  { value: "do_not_contact", label: "Do Not Contact", color: "bg-red-600", bgColor: "bg-red-600/20", textColor: "text-red-400", category: "negative" },
  { value: "already_bought", label: "Already Bought", color: "bg-slate-500", bgColor: "bg-slate-500/20", textColor: "text-slate-400", category: "negative" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-500", bgColor: "bg-red-500/20", textColor: "text-red-400", category: "negative" },
  { value: "junk", label: "Junk", color: "bg-gray-500", bgColor: "bg-gray-500/20", textColor: "text-gray-400", category: "negative" },
];

export const getStatusInfo = (status: string | undefined): PipelineStatus => {
  return PIPELINE_STATUSES.find(s => s.value === status) || PIPELINE_STATUSES[0];
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
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-all",
        sizeClasses[size],
        statusInfo.bgColor,
        statusInfo.textColor,
        "border border-current/20",
        onClick && "hover:scale-105 hover:shadow-lg cursor-pointer",
        !onClick && "cursor-default",
        className
      )}
    >
      {showDot && (
        <span className={cn("w-2 h-2 rounded-full", statusInfo.color)} />
      )}
      <span className="font-semibold">{statusInfo.label}</span>
    </button>
  );
};

export default LeadStatusBadge;
