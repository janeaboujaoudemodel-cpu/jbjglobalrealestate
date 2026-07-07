import { Building2, Layers, Home, CalendarCheck, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/utils/formatDate";
import { isPublicStatus, getProjectStatus } from "@/utils/projectStatus";

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
  // Synced status (single source of truth = handover_date)
  const synced = getProjectStatus({
    handover_date: handoverDate,
    status_label: statusLabel,
    availability_status: availabilityStatus,
  });
  // Only show a status pill when the raw value is a public-friendly label
  // (hides internal admin states like "pending", "draft", etc.)
  const rawStatus = statusLabel || availabilityStatus;
  const publicPillLabel = isPublicStatus(rawStatus) ? rawStatus : (synced.isReady ? "Ready" : null);

  const facts = [
    {
      icon: Home,
      label: "Property Type",
      value: propertyType || null,
      show: !!propertyType
    },
    {
      icon: Building2,
      label: "Total Units",
      value: totalUnits ? `${totalUnits} Units` : null,
      show: !!totalUnits && totalUnits > 4
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
      value: synced.label !== "TBA" ? synced.label : formatDisplayDate(handoverDate),
      show: !!handoverDate || synced.isReady
    },
  ].filter(f => f.show && f.value);

  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-red-50 text-red-600 border-red-200";
    const s = status.toLowerCase();
    if (s.includes("available") || s.includes("selling")) return "jj-surface-emerald-soft text-emerald-400 border-[color:var(--emerald-1)]/30/30";
    if (s.includes("limited") || s.includes("few")) return "bg-amber-500/20 text-[#1A1A1A] border-amber-500/30";
    if (s.includes("sold") || s.includes("out")) return "bg-red-500/20 text-red-400 border-red-500/30";
    if (s.includes("launch") || s.includes("soon") || s.includes("new")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30";
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
        {/* Status Badge - only render public-friendly labels (no leaking "pending" etc.) */}
        {publicPillLabel && (
          <Badge
            className={`px-3 py-1.5 text-sm font-medium border ${getStatusColor(publicPillLabel)}`}
          >
            <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
            {publicPillLabel}
          </Badge>
        )}

        {/* Divider */}
        {publicPillLabel && facts.length > 0 && (
          <div className="w-px h-6 bg-border" />
        )}

        {/* Quick Facts */}
        {facts.map((fact, idx) => (
          <div 
            key={idx} 
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#B89555]/20 bg-card"
          >
            <fact.icon className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
            <div className="flex flex-col">
              {fact.label ? (
                <span className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/80 font-medium leading-none">{fact.label}</span>
              ) : null}
              <span className="text-sm font-medium text-foreground">{fact.value}</span>
            </div>
          </div>
        ))}

        {/* Last Updated */}
        {updatedAt && (
          <>
            <div className="w-px h-6 bg-border" />
            <div className="flex items-center gap-1.5 text-xs text-[#1A1A1A]/70 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated: {formatDate(updatedAt)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
