import { ReactNode } from "react";
import { TOOL_CARD_BG, TOOL_WHITE_BORDER, ToolTheme } from "./toolThemes";

interface ToolCardProps {
  children: ReactNode;
  theme?: ToolTheme;
  /** Use accent-tinted edge instead of plain gold hairline */
  accentEdge?: boolean;
  className?: string;
}

/**
 * Standard champagne card shell used across tool pages.
 * Ink text on champagne surface, 1px gold hairline by default,
 * optional accent-tinted edge driven by the tool theme.
 */
export const ToolCard = ({
  children,
  theme,
  accentEdge,
  className = "",
}: ToolCardProps) => {
  const border =
    accentEdge && theme ? `1px solid ${theme.accentBorder}` : `1px solid ${TOOL_GOLD}55`;

  return (
    <div
      className={`rounded-2xl p-6 md:p-7 ${className}`}
      style={{
        background: TOOL_CARD_BG,
        border,
        boxShadow:
          "0 10px 30px -18px rgba(0,0,0,0.18), 0 0 0 1px rgba(184,149,85,0.05) inset",
      }}
    >
      {children}
    </div>
  );
};
