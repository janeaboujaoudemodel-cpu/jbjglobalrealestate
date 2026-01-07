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
  { value: "new", label: "New", color: "bg-blue-500", bgColor: "bg-blue-600/30", textColor: "text-blue-300", category: "neutral" },
  
  // Positive progression
  { value: "contacted", label: "Contacted", color: "bg-cyan-500", bgColor: "bg-cyan-600/30", textColor: "text-cyan-300", category: "neutral" },
  { value: "interested", label: "Interested", color: "bg-emerald-500", bgColor: "bg-emerald-600/30", textColor: "text-emerald-300", category: "positive" },
  { value: "qualified", label: "Qualified", color: "bg-green-500", bgColor: "bg-green-600/30", textColor: "text-green-300", category: "positive" },
  { value: "viewing", label: "Viewing Scheduled", color: "bg-purple-500", bgColor: "bg-purple-600/30", textColor: "text-purple-300", category: "positive" },
  { value: "viewing_done", label: "Viewing Done", color: "bg-violet-500", bgColor: "bg-violet-600/30", textColor: "text-violet-300", category: "positive" },
  { value: "negotiation", label: "Negotiation", color: "bg-orange-500", bgColor: "bg-orange-600/30", textColor: "text-orange-300", category: "positive" },
  { value: "closed_won", label: "Closed Won", color: "bg-emerald-600", bgColor: "bg-emerald-700/40", textColor: "text-emerald-200", category: "positive" },
  
  // Warning / Follow-up needed
  { value: "no_answer", label: "No Answer", color: "bg-amber-500", bgColor: "bg-amber-600/30", textColor: "text-amber-300", category: "warning" },
  { value: "callback", label: "Callback Requested", color: "bg-yellow-500", bgColor: "bg-yellow-600/30", textColor: "text-yellow-300", category: "warning" },
  { value: "followup", label: "Follow-up", color: "bg-sky-500", bgColor: "bg-sky-600/30", textColor: "text-sky-300", category: "warning" },
  
  // Negative / Lost
  { value: "not_interested", label: "Not Interested", color: "bg-rose-500", bgColor: "bg-rose-600/30", textColor: "text-rose-300", category: "negative" },
  { value: "do_not_contact", label: "Do Not Contact", color: "bg-red-600", bgColor: "bg-red-700/30", textColor: "text-red-300", category: "negative" },
  { value: "already_bought", label: "Already Bought", color: "bg-slate-500", bgColor: "bg-slate-600/30", textColor: "text-slate-300", category: "negative" },
  { value: "closed_lost", label: "Closed Lost", color: "bg-red-500", bgColor: "bg-red-600/30", textColor: "text-red-300", category: "negative" },
  { value: "junk", label: "Junk", color: "bg-gray-500", bgColor: "bg-gray-600/30", textColor: "text-gray-300", category: "negative" },
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
        "inline-flex items-center gap-1.5 rounded-full font-bold transition-all shadow-lg",
        sizeClasses[size],
        statusInfo.color,
        "text-white",
        "border-2 border-white/30",
        onClick && "hover:scale-105 hover:shadow-xl cursor-pointer",
        !onClick && "cursor-default",
        className
      )}
    >
      {showDot && (
        <span className="w-2.5 h-2.5 rounded-full bg-white/40 ring-2 ring-white/50" />
      )}
      <span className="font-bold tracking-wide text-white drop-shadow-sm">{statusInfo.label}</span>
    </button>
  );
};

export default LeadStatusBadge;
