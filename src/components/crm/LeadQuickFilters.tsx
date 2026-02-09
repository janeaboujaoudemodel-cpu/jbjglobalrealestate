import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Inbox, 
  Phone, 
  Trash2, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickFilter {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  statuses: string[];
}

const QUICK_FILTERS: QuickFilter[] = [
  { 
    id: "all", 
    label: "All Leads", 
    icon: Inbox, 
    color: "text-zinc-700",
    bgColor: "bg-zinc-100 hover:bg-zinc-200 border-zinc-300",
    statuses: [] 
  },
  { 
    id: "new", 
    label: "New", 
    icon: Star, 
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    statuses: ["new"] 
  },
  { 
    id: "hot", 
    label: "Hot Leads", 
    icon: TrendingUp, 
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
    statuses: ["interested", "qualified", "negotiation"] 
  },
  { 
    id: "followup", 
    label: "Follow-up", 
    icon: Clock, 
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    statuses: ["no_answer", "callback", "followup"] 
  },
  { 
    id: "closed_won", 
    label: "Won", 
    icon: CheckCircle, 
    color: "text-green-600",
    bgColor: "bg-green-50 hover:bg-green-100 border-green-200",
    statuses: ["closed_won"] 
  },
  { 
    id: "lost", 
    label: "Lost", 
    icon: XCircle, 
    color: "text-red-600",
    bgColor: "bg-red-50 hover:bg-red-100 border-red-200",
    statuses: ["not_interested", "closed_lost", "do_not_contact"] 
  },
  { 
    id: "junk", 
    label: "Invalid", 
    icon: Trash2, 
    color: "text-red-500",
    bgColor: "bg-red-50 hover:bg-red-100 border-red-200",
    statuses: ["junk"] 
  },
];

interface LeadQuickFiltersProps {
  activeFilter: string;
  onChange: (filter: string, statuses: string[]) => void;
  counts?: Record<string, number>;
}

const LeadQuickFilters = ({ activeFilter, onChange, counts = {} }: LeadQuickFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        const count = filter.id === "all" 
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : filter.statuses.reduce((sum, s) => sum + (counts[s] || 0), 0);
        
        return (
          <Button
            key={filter.id}
            variant="outline"
            size="sm"
            onClick={() => onChange(filter.id, filter.statuses)}
            className={cn(
              "border transition-all duration-200 font-semibold",
              filter.bgColor,
              isActive && "ring-2 ring-gold ring-offset-2 ring-offset-white"
            )}
          >
            <filter.icon className={cn("h-4 w-4 mr-1.5", filter.color)} />
            <span className={filter.color}>{filter.label}</span>
            {count > 0 && (
              <Badge 
                variant="secondary" 
                className={cn(
                  "ml-2 text-xs font-bold",
                  isActive ? "bg-gold text-black" : "bg-zinc-200 text-zinc-700"
                )}
              >
                {count}
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default LeadQuickFilters;
