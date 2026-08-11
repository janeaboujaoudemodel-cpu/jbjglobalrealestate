/**
 * ThemeModeToggle — the Sun / Moon switch.
 *
 * Sun  = champagne day theme. Moon = emerald-night theme (gold becomes accent).
 * Rendered in the horizontal utility bar, the account menu and the footer.
 */
import { Moon, Sun } from "lucide-react";
import { useThemeMode } from "@/contexts/ThemeModeContext";
import { HeaderControl } from "@/components/ui/ds/HeaderControl";
import { cn } from "@/lib/utils";

export function ThemeModeToggle({
  variant = "header",
  className,
}: {
  variant?: "header" | "menu" | "footer";
  className?: string;
}) {
  const { isMoon, toggleMode } = useThemeMode();
  const label = isMoon ? "Switch to day theme" : "Switch to night theme";
  const Icon = isMoon ? Sun : Moon;

  if (variant === "header") {
    return (
      <HeaderControl
        shape="circle"
        tone="emerald"
        aria-label={label}
        title={label}
        onClick={toggleMode}
        className={className}
      >
        <Icon />
      </HeaderControl>
    );
  }

  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={toggleMode}
        aria-label={label}
        title={label}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold",
          "border border-current/40 transition-colors hover:border-[#B89555]",
          className,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{isMoon ? "Day" : "Night"}</span>
      </button>
    );
  }


  // menu row (account dropdown)
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 my-0.5 text-sm font-medium",
        className,
      )}
      style={{ background: "transparent" }}
    >
      <Icon className="w-5 h-5" strokeWidth={2.25} />
      <span>{isMoon ? "Day theme" : "Night theme"}</span>
    </button>
  );
}

export default ThemeModeToggle;
