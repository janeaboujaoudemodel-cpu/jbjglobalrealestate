import { Building2, Layers, Home, CalendarCheck, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/utils/formatDate";

interface QuickFactsBarProps {
  propertyType?: string | null;
  totalUnits?: number | null;
  floors?: number | null;
  availabilityStatus?: string | null;
  statusLabel?: string | null;
  handoverDate?: string | null;
  updatedAt?: string | null;
}

export default function QuickFactsBar({
  propertyType,
  totalUnits,
  floors,
  availabilityStatus,
  statusLabel,
  handoverDate,
  updatedAt,
}: QuickFactsBarProps) {
  const facts = [
    { 
      icon: Home, 
      label: "Property Type", 
      value: propertyType || "Mixed Use",
      show: true 
    },
    { 
      icon: Building2, 
      label: "Total Units", 
      value: totalUnits ? `${totalUnits} Units` : null,
      show: !!totalUnits 
    },
    { 
      icon: Layers, 
      label: "Floors", 
      value: floors ? `${floors} Floors` : null,
      show: !!floors 
    },
    { 
      icon: CalendarCheck, 
      label: "Handover", 
      value: formatDisplayDate(handoverDate),
      show: !!handoverDate 
    },
  ].filter(f => f.show);

  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-muted text-muted-foreground";
    const s = status.toLowerCase();
    if (s.includes("available") || s.includes("selling")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (s.includes("limited") || s.includes("few")) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    if (s.includes("sold") || s.includes("out")) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (s.includes("launch") || s.includes("soon") || s.includes("new")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-gold/20 text-gold border-gold/30";
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center gap-3 min-w-max">
        {/* Status Badge */}
        {(statusLabel || availabilityStatus) && (
          <Badge 
            className={`px-3 py-1.5 text-sm font-medium border ${getStatusColor(statusLabel || availabilityStatus)}`}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            {statusLabel || availabilityStatus}
          </Badge>
        )}

        {/* Divider */}
        {(statusLabel || availabilityStatus) && facts.length > 0 && (
          <div className="w-px h-6 bg-border" />
        )}

        {/* Quick Facts */}
        {facts.map((fact, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gold/20 bg-card"
          >
            <fact.icon className="w-4 h-4 text-gold flex-shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">{fact.label}</span>
              <span className="text-sm font-medium text-foreground">{fact.value}</span>
            </div>
          </div>
        ))}

        {/* Last Updated */}
        {updatedAt && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated: {formatDate(updatedAt)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
