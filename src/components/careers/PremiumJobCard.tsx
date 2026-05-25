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
      className={`group relative rounded-2xl border bg-[linear-gradient(180deg,rgba(253,251,247,0.98),rgba(247,242,234,0.94))] p-6 cursor-pointer transition-all overflow-hidden ${
        selected
          ? "border-[#102540] shadow-[0_0_0_3px_rgba(16,37,64,0.14),0_22px_44px_-28px_rgba(16,37,64,0.5)]"
          : "border-[#B89555]/60 shadow-[0_12px_28px_-24px_rgba(16,37,64,0.22)] hover:-translate-y-[3px] hover:border-[#B89555] hover:shadow-[0_24px_48px_-28px_rgba(16,37,64,0.38),0_0_0_1px_rgba(184,149,85,0.4)]"
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
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="font-semibold text-lg md:text-[1.22rem] leading-snug text-[#102540] tracking-tight">
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
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map((t) => {
              const cfg = TAG_STYLES[t];
              const Icon = cfg.icon;
              return (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${cfg.bg} ${cfg.ring} ${cfg.text}`}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] mb-4">
          <span className="inline-flex items-center gap-1.5 text-[#1A1A1A]/82 font-medium">
            <Briefcase className="w-3.5 h-3.5 text-[#102540]" />
            {department}
          </span>
          {location && (
            <span className="inline-flex items-center gap-1.5 text-[#1A1A1A]/82 font-medium">
              <MapPin className="w-3.5 h-3.5 text-[#102540]" />
              {location}
            </span>
          )}
          {isCommissionBased || isBrokerRole ? (
            <span className="rounded-full border border-[#B89555]/55 bg-[#F7F2EA] px-2 py-0.5 font-semibold text-[#8B5E1A]">Commission Basis</span>
          ) : null}
          {level && (
            <span className="inline-flex items-center text-[#1A1A1A]/76">
              · {level}
            </span>
          )}
          {category && (
            <span className="inline-flex items-center text-[#1A1A1A]/76">
              · {category}
            </span>
          )}
        </div>

        {description && (
          <p className="text-[13px] md:text-[13.5px] text-[#1A1A1A]/82 leading-relaxed line-clamp-3 mb-5">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#B89555]/28">
          <span className="text-[10px] tracking-[0.12em] uppercase font-semibold text-[#102540]/72 pt-3">
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
            className="h-10 !bg-[#102540] hover:!bg-[#1a3d63] !text-white border border-[#B89555]/70 rounded-xl px-5 font-semibold shadow-[0_12px_22px_-10px_rgba(16,37,64,0.62),inset_0_1px_0_rgba(255,255,255,0.18)] hover:shadow-[0_18px_28px_-12px_rgba(16,37,64,0.68),inset_0_1px_0_rgba(255,255,255,0.18)] active:translate-y-[1px] active:shadow-[0_4px_10px_-4px_rgba(16,37,64,0.4),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all"
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
