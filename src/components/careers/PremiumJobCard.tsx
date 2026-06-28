import { CheckCircle, MapPin, Star, Flame, Award, Briefcase, Lock, Pause, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export type JobCardTag =
  | "top-opportunity"
  | "urgent"
  | "most-applied"
  | "premium"
  | "partner"
  | "featured";

export type JobStatus = "open" | "urgent" | "paused" | "closed" | "hidden";

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
  status?: JobStatus;
  isFeatured?: boolean;
  applicationsCount?: number;
  applicationCap?: number | null;
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
    icon: Award,
    bg: "bg-[#F7F2EA]",
    ring: "border-[#B89555]",
    text: "text-[#1A1A1A]",
  },
  urgent: {
    label: "Urgent Hiring",
    icon: Flame,
    bg: "bg-[#FEF3F2]",
    ring: "border-[#C04A2B]/60",
    text: "text-[#1A1A1A]",
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
    text: "text-[#1A1A1A]",
  },
  partner: {
    label: "Partner",
    icon: Star,
    bg: "bg-[image:var(--jj-emerald-ombre)]",
    ring: "border-transparent",
    text: "!text-white",
  },
  featured: {
    label: "Featured",
    icon: Star,
    bg: "bg-[image:var(--jj-emerald-ombre)]",
    ring: "border-transparent",
    text: "!text-white",
  },
};

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
  status = "open",
  isFeatured = false,
  applicationsCount = 0,
  applicationCap = null,
  selected,
  onApply,
  onSelect,
}: PremiumJobCardProps) {
  const limitReached =
    applicationCap !== null && applicationCap !== undefined && applicationsCount >= applicationCap;

  // Derived applyability
  const isOpenForApply =
    (status === "open" || status === "urgent") && !limitReached;

  // CTA copy + icon
  let ctaLabel = selected ? "Selected" : "Apply";
  let CtaIcon: any = selected ? CheckCircle : null;
  if (!isOpenForApply) {
    if (status === "closed") { ctaLabel = "Position Closed"; CtaIcon = XCircle; }
    else if (status === "paused") { ctaLabel = "Hiring Paused"; CtaIcon = Pause; }
    else if (limitReached) { ctaLabel = "Application Limit Reached"; CtaIcon = Lock; }
  }

  // Effective tag list — augment with real status / featured signals
  const computedTags: JobCardTag[] = [...tags];
  if (isFeatured && !computedTags.includes("featured")) computedTags.unshift("featured");
  if (status === "urgent" && !computedTags.includes("urgent")) computedTags.unshift("urgent");

  return (
    <div
      onClick={() => isOpenForApply && onSelect?.(id)}
      data-careers-job-card
      data-surface="champagne"
      className={`group careers-card-strong relative rounded-2xl border p-6 transition-all overflow-hidden ${
        isOpenForApply ? "cursor-pointer" : "cursor-default"
      } ${
        selected
          ? "border-[#B89555] shadow-[0_0_0_3px_rgba(184,149,85,0.18),0_30px_54px_-32px_rgba(184,149,85,0.45)]"
          : isOpenForApply
            ? "hover:-translate-y-[3px]"
            : ""
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background:
            "radial-gradient(140% 80% at 0% 0%, rgba(184,149,85,0.10), transparent 50%)",
        }}
      />

      {/* Closed/paused/limit overlay strip */}
      {!isOpenForApply && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#1A1A1A]/70" aria-hidden />
      )}

      <div className="relative">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="font-semibold text-lg md:text-[1.22rem] leading-snug text-[#1A1A1A] tracking-tight">
            {title}
          </h4>
          {selected && isOpenForApply && (
            <span
              data-no-contrast-guard
              data-surface="emerald"
              data-emerald-icon-surface
              className="allow-white flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#B89555]/70 shadow-[0_2px_8px_-2px_rgba(6,78,59,0.45)]"
              style={{ backgroundImage: "var(--jj-emerald-ombre)", backgroundColor: "#064E3B" }}
              aria-label="Selected"
            >
              <CheckCircle className="w-3.5 h-3.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF", fill: "none" }} />
            </span>
          )}
        </div>

        {(computedTags.length > 0 || limitReached) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {computedTags.map((t) => {
              const cfg = TAG_STYLES[t];
              const Icon = cfg.icon;
              const isDarkTag = t === "featured" || t === "partner";
              return (
                <span
                  key={t}
                  data-jbj-label
                  data-careers-partner-label={t === "partner" ? "true" : undefined}
                  data-surface={isDarkTag ? "emerald" : "champagne"}
                  data-no-contrast-guard={isDarkTag ? "true" : undefined}
                  data-allow-dark-cta={isDarkTag ? "true" : undefined}
                  className={`inline-flex min-h-[28px] items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] ${cfg.bg} ${cfg.ring} ${cfg.text} ${isDarkTag ? "allow-white" : ""}`}
                  style={isDarkTag ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}
                >
                  <Icon
                    data-careers-icon={isDarkTag ? undefined : "tag"}
                    data-careers-ink-icon={isDarkTag ? undefined : "true"}
                    className={`w-3.5 h-3.5 shrink-0 ${isDarkTag ? "allow-white" : ""}`}
                    strokeWidth={2.75}
                    style={isDarkTag ? { color: "#FFFFFF", stroke: "#FFFFFF", fill: t === "partner" ? "#FFFFFF" : "none" } : { color: "#1A1A1A", stroke: "#1A1A1A", fill: "none" }}
                  />
                  <span className={isDarkTag ? "allow-white" : ""} style={isDarkTag ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}>{cfg.label}</span>
                </span>
              );
            })}
            {limitReached && (
              <span className="inline-flex min-h-[26px] items-center gap-1.5 rounded-full border border-[#1A1A1A]/40 bg-[#EFE6D6] px-3 py-1 text-[10px] font-semibold text-[#1A1A1A]">
                <Users className="w-3 h-3" /> Application Limit Reached
              </span>
            )}
            {status === "paused" && (
              <span className="inline-flex min-h-[26px] items-center gap-1.5 rounded-full border border-[#1A1A1A]/40 bg-[#EFE6D6] px-3 py-1 text-[10px] font-semibold text-[#1A1A1A]">
                <Pause className="w-3 h-3" /> Paused
              </span>
            )}
            {status === "closed" && (
              <span className="inline-flex min-h-[26px] items-center gap-1.5 rounded-full border border-[#1A1A1A]/40 bg-[#EFE6D6] px-3 py-1 text-[10px] font-semibold text-[#1A1A1A]">
                <XCircle className="w-3 h-3" /> Closed
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] mb-4">
          <span data-careers-ink-row="department" className="inline-flex items-center gap-1.5 text-[#1A1A1A] font-semibold">
            <Briefcase data-careers-icon="department" data-careers-ink-icon="true" className="w-4 h-4 shrink-0" strokeWidth={2.75} style={{ color: "#1A1A1A", stroke: "#1A1A1A", fill: "none" }} aria-hidden />
            {department}
          </span>
          {location && (
            <span data-careers-ink-row="location" className="inline-flex items-center gap-1.5 text-[#1A1A1A] font-semibold">
              <MapPin data-careers-icon="location" data-careers-ink-icon="true" className="w-4 h-4 shrink-0" strokeWidth={2.75} style={{ color: "#1A1A1A", stroke: "#1A1A1A", fill: "none" }} aria-hidden />
              {location}
            </span>
          )}

          {isCommissionBased || isBrokerRole ? (
            <span className="inline-flex min-h-[26px] items-center rounded-full border border-[#BFA46A] bg-[#EDE1CD] px-3 py-1 font-semibold text-[#5E4314] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">Commission Basis</span>
          ) : null}
          {applicationCap ? (
            <span className="inline-flex items-center text-[#1A1A1A]/86">
              · {applicationsCount}/{applicationCap} applicants
            </span>
          ) : null}
          {level && <span className="inline-flex items-center text-[#1A1A1A]/86">· {level}</span>}
          {category && <span className="inline-flex items-center text-[#1A1A1A]/86">· {category}</span>}
        </div>

        {description && (
          <p className="text-[13px] md:text-[13.5px] text-[#1A1A1A] leading-relaxed line-clamp-3 mb-5">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#BFA46A]/60">
            <span className="text-[10px] tracking-[0.12em] uppercase font-semibold text-[#1A1A1A] pt-3">
            JBJ GLOBAL REAL ESTATE · Dubai
          </span>
          {isOpenForApply ? (
            <Button
              type="button"
              size="sm"
              data-surface="emerald"
              data-allow-dark-cta
              data-no-contrast-guard
              data-careers-apply-cta
              className={`jj-cta-emerald jj-pill-emerald-metallic allow-white min-h-11 rounded-xl px-5 py-2 font-semibold border-transparent active:translate-y-[1px] transition-all ${selected ? "ring-2 ring-[#064E3B]/30" : ""}`}
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              onClick={(e) => {
                e.stopPropagation();
                if (selected) onSelect?.(id);
                else onApply(id);
              }}
            >
              {CtaIcon ? (
                <CtaIcon className="w-3.5 h-3.5 mr-1.5" />
              ) : null}
              <span>{ctaLabel}</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              disabled
              aria-disabled="true"
              className="min-h-10 rounded-xl px-5 font-semibold bg-[#EFE6D6] text-[#1A1A1A]/70 border border-[#B89555]/60 cursor-not-allowed hover:bg-[#EFE6D6]"
            >
              {CtaIcon ? <CtaIcon className="w-3.5 h-3.5 mr-1.5" /> : null}
              {ctaLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
