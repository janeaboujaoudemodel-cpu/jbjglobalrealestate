import { ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { TOOL_WHITE_BORDER, ToolTheme } from "./toolThemes";

interface PrimaryCTAProps {
  theme: ToolTheme;
  onClick?: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  children: ReactNode;
  type?: "button" | "submit";
  className?: string;
}

/**
 * Primary CTA used by tool pages. Ombré gradient (accent → ink)
 * with white text and a 1px white hairline. Hover reverses the
 * gradient direction (ink → accent) so it stays premium, never
 * a flat saturated fill.
 */
export const PrimaryCTA = ({
  theme,
  onClick,
  disabled,
  icon: Icon,
  children,
  type = "button",
  className = "",
}: PrimaryCTAProps) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      data-allow-dark-cta
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = theme.ctaHover;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = theme.ctaGradient;
      }}
      className={`group inline-flex items-center justify-center gap-2 w-full px-8 py-5 rounded-xl text-base md:text-lg font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        background: theme.ctaGradient,
        border: `1px solid ${TOOL_WHITE_BORDER}`,
        boxShadow:
          "0 10px 30px -10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{children}</span>
    </button>
  );
};
