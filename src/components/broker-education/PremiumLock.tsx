import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Premium lock badge — champagne disc, 1px gold hairline, faceted shine,
 * and a small ink lock glyph. Used everywhere a lock appears in the
 * JBJ Broker Academy so the visual language is consistent and luxurious.
 */
export function PremiumLockBadge({
  size = "md",
  className,
  title,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  title?: string;
}) {
  const dims =
    size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-11 h-11";
  const icon =
    size === "sm" ? "w-3.5 h-3.5" : size === "lg" ? "w-6 h-6" : "w-5 h-5";

  return (
    <span
      aria-label={title ?? "Locked"}
      title={title ?? "Locked"}
      data-no-contrast-guard
      className={cn(
        "relative inline-grid place-items-center rounded-full",
        "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]",
        "border border-[#B89555]/65 ring-1 ring-[#B89555]/25 ring-offset-1 ring-offset-[#F7F2EA]",
        "shadow-[0_6px_18px_rgba(184,149,85,0.28),inset_0_1px_0_rgba(255,255,255,0.85)]",
        dims,
        className
      )}
    >
      {/* faceted top-light shine */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(120% 70% at 30% 18%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 55%)",
        }}
      />
      <Lock
        className={cn(icon, "relative")}
        strokeWidth={2.1}
        style={{ color: "#1A1A1A" }}
      />
    </span>
  );
}

/**
 * Full-card premium lock overlay — soft champagne wash, gold hairline,
 * centered PremiumLockBadge with caption. Apply over a relatively-positioned
 * card to render an elegant "locked" state.
 */
export function PremiumLockOverlay({
  title = "Locked",
  caption,
  size = "md",
  rounded = "rounded-2xl",
}: {
  title?: string;
  caption?: string;
  size?: "sm" | "md" | "lg";
  rounded?: string;
}) {
  return (
    <div
      data-no-contrast-guard
      className={cn(
        "absolute inset-0 z-20 pointer-events-none",
        "flex flex-col items-center justify-center gap-2.5",
        "border border-[#B89555]/45",
        rounded
      )}
      style={{
        background:
          "linear-gradient(180deg, rgba(253,251,247,0.78) 0%, rgba(247,242,234,0.92) 100%)",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
      }}
    >
      <PremiumLockBadge size={size} title={title} />
      <div className="text-center px-4">
        <div className="text-[11px] uppercase tracking-[0.22em] text-[#1A1A1A] font-semibold">
          {title}
        </div>
        {caption && (
          <p className="mt-1 text-xs text-[#1A1A1A]/70 max-w-[24ch] mx-auto leading-snug">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
