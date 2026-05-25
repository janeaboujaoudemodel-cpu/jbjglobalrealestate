import { CheckCircle, MapPin, Star, Flame, TrendingUp, Award, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

export type JobCardTag =
  | "top-opportunity"
  | "urgent"
  | "most-applied"
  | "premium"
  | "partner";

interface PremiumJobCardProps {
  id: string;
  title: string;
  department: string;
  location?: string | null;
  description?: string | null;
  employmentType?: string;
  isBrokerRole?: boolean;
  isCommissionBased?: boolean;
  level?: string;
  category?: string;
  tags?: JobCardTag[];
  selected: boolean;
  onApply: (id: string) => void;
  onSelect?: (id: string) => void;
}

const TAG_STYLES: Record<
  JobCardTag,
  { label: string; icon: any; bg: string; ring: string; text: string }
> = {
  "top-opportunity": {
    label: "Top Opportunity",
    icon: TrendingUp,
    bg: "bg-[#F7F2EA]",
    ring: "border-[#B89555]",
    text: "text-[#1A1A1A]",
  },
  urgent: {
    label: "Urgent Hiring",
    icon: Flame,
    bg: "bg-[#FEF3F2]",
    ring: "border-[#C04A2B]/60",
    text: "text-[#C04A2B]",
  },
  "most-applied": {
    label: "Most Applied",
    icon: Award,
    bg: "bg-[#F7F2EA]",
    ring: "border-[#B89555]",
    text: "text-[#1A1A1A]",
  },
  premium: {
    label: "Premium Position",
    icon: Star,
    bg: "bg-[#F7F2EA]",
    ring: "border-[#B89555]",
    text: "text-[#B89555]",
  },
  partner: {
    label: "Partner",
    icon: Star,
    bg: "bg-[#F7F2EA]",
    ring: "border-[#B89555]",
    text: "text-[#B89555]",
  },
};

/**
 * Premium luxury job card.
 * - Champagne raised surface, gold hairline border
 * - Hover: subtle lift + soft navy glow ring
 * - Optional status tags (Top, Urgent, Most Applied, Premium, Partner)
 * - Apply CTA: solid navy 3D button
 */
export default function PremiumJobCard({
  id,
  title,
  department,
  location,
  description,
  isBrokerRole,
  isCommissionBased,
  level,
  category,
  tags = [],
  selected,
  onApply,
  onSelect,
}: PremiumJobCardProps) {
  return (
    <div
      onClick={() => onSelect?.(id)}
      className={`group relative rounded-2xl border bg-[#FDFBF7] p-5 cursor-pointer transition-all overflow-hidden ${
        selected
          ? "border-[#102540] shadow-[0_0_0_3px_rgba(16,37,64,0.18),0_16px_32px_-22px_rgba(16,37,64,0.45)]"
          : "border-[#B89555]/55 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] hover:-translate-y-[2px] hover:border-[#B89555] hover:shadow-[0_18px_38px_-22px_rgba(16,37,64,0.35),0_0_0_1px_rgba(184,149,85,0.45)]"
      }`}
    >
      {/* Hover glow accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            "radial-gradient(140% 80% at 0% 0%, rgba(184,149,85,0.10), transparent 50%)",
        }}
      />

      <div className="relative">
        {/* Title row + selected check */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="font-semibold text-base md:text-lg leading-snug text-[#102540] tracking-tight">
            {title}
          </h4>
          {selected && (
            <span
              data-no-contrast-guard
              className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#102540] border border-[#B89555]/60"
              aria-label="Selected"
            >
              <CheckCircle className="w-4 h-4 allow-white" style={{ color: "#FFFFFF" }} />
            </span>
          )}
        </div>

        {/* Tag row */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tags.map((t) => {
              const cfg = TAG_STYLES[t];
              const Icon = cfg.icon;
              return (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cfg.bg} ${cfg.ring} ${cfg.text}`}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] mb-3">
          <span className="inline-flex items-center gap-1 text-[#1A1A1A]/75">
            <Briefcase className="w-3 h-3 text-[#1A1A1A]/65" />
            {department}
          </span>
          {location && (
            <span className="inline-flex items-center gap-1 text-[#1A1A1A]/75">
              <MapPin className="w-3 h-3 text-[#1A1A1A]/65" />
              {location}
            </span>
          )}
          {isCommissionBased || isBrokerRole ? (
            <span className="font-semibold text-[#B45309]">Commission Basis</span>
          ) : null}
          {level && (
            <span className="inline-flex items-center text-[#1A1A1A]/70">
              · {level}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center text-[#1A1A1A]/70">
              · {category}
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs md:text-[13px] text-[#1A1A1A]/75 leading-relaxed line-clamp-2 mb-4">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[10px] tracking-[0.12em] uppercase font-semibold text-[#1A1A1A]/55">
            JBJ Global · Dubai
          </span>
          <Button
            type="button"
            size="sm"
            data-allow-dark-cta
            data-no-contrast-guard
            onClick={(e) => {
              e.stopPropagation();
              onApply(id);
            }}
            className="!bg-[#102540] hover:!bg-[#1a3d63] !text-white border border-[#B89555]/70 rounded-lg px-5 font-semibold shadow-[0_6px_14px_-4px_rgba(16,37,64,0.45),inset_0_1px_0_rgba(255,255,255,0.18)] active:translate-y-[1px] active:shadow-[0_2px_6px_-2px_rgba(16,37,64,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all"
          >
            {selected ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 mr-1.5 allow-white" style={{ color: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF" }}>Selected</span>
              </>
            ) : (
              <span className="allow-white" style={{ color: "#FFFFFF" }}>Apply</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
