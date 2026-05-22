import { cn } from "@/lib/utils";

type SectionDividerProps = {
  className?: string;
  fullWidth?: boolean;
  bg?: string;
  variant?: "default" | "champagne" | "ornament" | "none";
};

/**
 * Premium section divider — editorial restraint.
 *
 * Default: a single centered gold diamond ornament with tight vertical
 * breathing room. No full-width hairline (which read as a cheap gray
 * line on champagne). Sections now visually connect cleanly.
 *
 * variant="none" renders nothing — useful where two sections should
 * truly butt together with no ornament at all.
 */
export function SectionDivider({ className, variant = "ornament" }: SectionDividerProps) {
  if (variant === "none") return null;

  return (
    <div
      className={cn("flex items-center justify-center py-3 md:py-4", className)}
      aria-hidden="true"
      data-no-contrast-guard
    >
      <span
        className="inline-block w-[5px] h-[5px] rotate-45"
        style={{
          background: "transparent",
          border: "1px solid #B89555",
          boxShadow: "0 0 0 1px rgba(184,149,85,0.18)",
        }}
      />
    </div>
  );
}
