import { useQuery } from "@tanstack/react-query";
import { Building2, Layers, Home, CalendarCheck, Sparkles, Clock } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";
import { isPublicStatus, getProjectStatus } from "@/utils/projectStatus";
import { supabase } from "@/integrations/supabase/client";

interface QuickFactsBarProps {
  projectId?: string;
  propertyType?: string | null;
  totalUnits?: number | null;
  floors?: number | null;
  availabilityStatus?: string | null;
  statusLabel?: string | null;
  saleStatus?: string | null;
  handoverDate?: string | null;
  updatedAt?: string | null;
  /** When true, show the "Updated" chip. Public visitors never see it — the
   *  owner sees the timestamp inside the gold-star OwnerProvenanceCard. */
  showUpdated?: boolean;
}

/**
 * Premium "at-a-glance" strip shown just below the hero.
 *
 * Rules (LOCKED — see mem://features/project-detail/provenance-and-updated-standard):
 *  • Status pill (Off-plan / Ready) uses the emerald brand gradient.
 *  • Handover, Property type and Updated share the same champagne-card look.
 *  • Updated timestamp is the MAX of `projects.updated_at` and the most recent
 *    `admin_edit_log` entry for this project — so any manual/AI edit made
 *    through the admin surfaces is reflected immediately, not the stale row
 *    timestamp.
 *  • Never render the same "Updated" chip twice on the page.
 */
export default function QuickFactsBar({
  projectId,
  propertyType,
  totalUnits,
  floors,
  availabilityStatus,
  statusLabel,
  saleStatus,
  handoverDate,
  updatedAt,
  showUpdated = false,
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

  // Pull the most recent admin-edit-log entry so the "Updated" chip reflects
  // real activity, not the stale `projects.updated_at` column.
  const { data: lastLogAt } = useQuery({
    queryKey: ["project-last-activity", projectId],
    enabled: !!projectId,
    staleTime: 30_000,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("admin_edit_log" as any)
        .select("created_at")
        .eq("entity_type", "project")
        .eq("entity_id", projectId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return (data as any)?.created_at ?? null;
    },
  });

  const effectiveUpdatedAt = (() => {
    const a = updatedAt ? new Date(updatedAt).getTime() : 0;
    const b = lastLogAt ? new Date(lastLogAt).getTime() : 0;
    const t = Math.max(a, b);
    return t > 0 ? new Date(t).toISOString() : null;
  })();

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

  const formatUpdated = (iso?: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      const mins = Math.floor((Date.now() - d.getTime()) / 60000);
      if (mins < 1) return "just now";
      if (mins < 60) return `${mins} min ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-stretch gap-3">
        {/* Off-plan / Ready — emerald brand pill, not a chip */}
        {publicPillLabel && (
          <div
            data-surface="emerald"
            data-no-contrast-guard
            className="allow-white inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border border-black/25 shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, #064E3B 0%, #042C1C 55%, #010806 100%)",
              color: "#FFFFFF",
              boxShadow: "0 10px 24px -14px rgba(4,44,28,0.75)",
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: "#F5E7C4" }} />
            <span style={{ color: "#FFFFFF" }}>{publicPillLabel}</span>
          </div>
        )}

        {/* Fact cards */}
        {facts.map((fact, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 rounded-xl border border-[#B89555]/50 bg-[#FDFBF7] px-4 py-3 shadow-sm min-w-[180px]"
          >
            <div className="w-8 h-8 rounded-lg bg-[#EFE6D6] flex items-center justify-center flex-shrink-0">
              <fact.icon className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 font-semibold leading-none">
                {fact.label}
              </span>
              <span className="mt-1 text-sm font-semibold text-[#1A1A1A] truncate">
                {fact.value}
              </span>
            </div>
          </div>
        ))}

        {/* Updated — owner-only chip. Public visitors don't see it here;
            the owner sees the full timestamp inside OwnerProvenanceCard's gold star. */}
        {showUpdated && effectiveUpdatedAt && (
          <div className="flex items-center gap-3 rounded-xl border border-[#B89555]/40 bg-[#F7F2EA] px-4 py-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[#064E3B]" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#1A1A1A]/60 font-semibold leading-none">
                Updated
              </span>
              <span className="mt-1 text-sm font-semibold text-[#1A1A1A]">
                {formatUpdated(effectiveUpdatedAt)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
