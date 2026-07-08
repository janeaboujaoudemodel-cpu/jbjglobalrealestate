import { Building2, Layers, Home, CalendarCheck, Sparkles } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";
import { isPublicStatus, getProjectStatus } from "@/utils/projectStatus";

interface QuickFactsBarProps {
  propertyType?: string | null;
  totalUnits?: number | null;
  floors?: number | null;
  availabilityStatus?: string | null;
  statusLabel?: string | null;
  saleStatus?: string | null;
  handoverDate?: string | null;
}

/**
 * Premium "at-a-glance" strip shown just below the hero.
 *
 * Rules (LOCKED — see mem://features/project-detail/provenance-and-updated-standard):
 *  • Status pill (Off-plan / Ready) uses the emerald brand gradient.
 *  • Handover and Property type share the same champagne-card look.
 *  • Updated timestamps do not render in this public strap; owner provenance
 *    owns that UI inside the gold-star card only.
 */
export default function QuickFactsBar({
  propertyType,
  totalUnits,
  floors,
  availabilityStatus,
  statusLabel,
  saleStatus,
  handoverDate,
}: QuickFactsBarProps) {
  const synced = getProjectStatus({
    handover_date: handoverDate,
    status_label: statusLabel || saleStatus,
    availability_status: availabilityStatus,
  });

  const rawStatus = saleStatus || statusLabel || availabilityStatus;
  const isOffPlan = saleStatus?.toLowerCase().includes("off");
  const publicPillLabel = isOffPlan
    ? "Off-plan"
    : isPublicStatus(rawStatus)
      ? rawStatus
      : synced.isReady
        ? "Ready"
        : null;

  const facts = [
    {
      icon: Home,
      label: "Property type",
      value: propertyType || null,
      show: !!propertyType,
    },
    {
      icon: Building2,
      label: "Total units",
      value: totalUnits ? `${totalUnits}` : null,
      show: !!totalUnits && totalUnits > 4,
    },
    {
      icon: Layers,
      label: "Floors",
      value: floors ? `${floors}` : null,
      show: !!floors,
    },
    {
      icon: CalendarCheck,
      label: "Handover",
      value: synced.label !== "TBA" ? synced.label : formatDisplayDate(handoverDate),
      show: !!handoverDate || synced.isReady,
    },
  ].filter((f) => f.show && f.value);

  return (
    <div className="w-full min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 items-stretch">
        {/* Off-plan / Ready — equal-height status card, aligned with the strap cards. */}
        {publicPillLabel && (
          <div
            data-surface="emerald"
            data-no-contrast-guard
            className="allow-white flex min-w-0 items-center gap-3 rounded-xl px-4 py-3 min-h-[56px] text-sm font-semibold border border-black/25 shadow-sm overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)",
              color: "#FFFFFF",
              boxShadow: "0 10px 24px -14px rgba(4,44,28,0.75)",
            }}
          >
            <span className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4" style={{ color: "#F5E7C4" }} />
            </span>
            <span className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere] leading-tight" style={{ color: "#FFFFFF" }}>{publicPillLabel}</span>
          </div>
        )}

        {/* Fact cards */}
        {facts.map((fact, idx) => (
          <div
            key={idx}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-[#B89555]/50 bg-[#FDFBF7] px-4 py-3 min-h-[56px] shadow-sm overflow-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EFE6D6] flex items-center justify-center flex-shrink-0">
              <fact.icon className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-[0.16em] text-[#1A1A1A]/60 font-semibold leading-none whitespace-normal break-words">
                {fact.label}
              </span>
              <span className="mt-1 text-sm font-semibold text-[#1A1A1A] whitespace-normal break-words [overflow-wrap:anywhere] leading-tight">
                {fact.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
