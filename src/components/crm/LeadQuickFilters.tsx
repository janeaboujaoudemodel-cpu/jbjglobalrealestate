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
    color: "text-black",
    bgColor: "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] hover:from-[#F5F0E6] hover:to-[#E8DCC8] border-gold/30",
    statuses: [] 
  },
  { 
    id: "new", 
    label: "New", 
    icon: Star, 
    color: "text-black",
    bgColor: "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] hover:from-[#F5F0E6] hover:to-[#E8DCC8] border-gold/30",
    statuses: ["new"] 
  },
  { 
    id: "hot", 
    label: "Hot Leads", 
    icon: TrendingUp, 
    color: "text-emerald-700",
    bgColor: "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] hover:from-[#F5F0E6] hover:to-[#E8DCC8] border-gold/30",
    statuses: ["interested", "qualified", "negotiation"] 
  },
  { 
    id: "followup", 
    label: "Follow-up", 
    icon: Clock, 
    color: "text-black",
    bgColor: "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] hover:from-[#F5F0E6] hover:to-[#E8DCC8] border-gold/30",
    statuses: ["no_answer", "callback", "followup"] 
  },
  { 
    id: "closed_won", 
    label: "Won", 
    icon: CheckCircle, 
    color: "text-emerald-700",
    bgColor: "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] hover:from-[#F5F0E6] hover:to-[#E8DCC8] border-gold/30",
    statuses: ["closed_won"] 
  },
  { 
    id: "lost", 
    label: "Lost", 
    icon: XCircle, 
    color: "text-red-700",
    bgColor: "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] hover:from-[#F5F0E6] hover:to-[#E8DCC8] border-gold/30",
    statuses: ["not_interested", "closed_lost", "do_not_contact"] 
  },
  { 
    id: "junk", 
    label: "Invalid", 
    icon: Trash2, 
    color: "text-red-700",
    bgColor: "bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] hover:from-[#F5F0E6] hover:to-[#E8DCC8] border-gold/30",
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
                  isActive ? "bg-gold text-black" : "bg-gold/20 text-black"
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
