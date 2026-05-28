import { ToolTheme } from "./toolThemes";

/** Thin accent-tinted divider between sections inside a PremiumToolShell. */
export const ToolSectionDivider = ({
  theme,
  className = "",
}: {
  theme: ToolTheme;
  className?: string;
}) => (
  <div
    aria-hidden
    className={`my-8 md:my-10 h-px w-full ${className}`}
    style={{
      background: `linear-gradient(90deg, transparent, ${theme.accent}55, transparent)`,
    }}
  />
);

export default ToolSectionDivider;
