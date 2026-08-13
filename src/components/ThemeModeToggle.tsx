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
          "border border-current/40 transition-colors hover:border-current",
          className,
        )}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{isMoon ? "Day" : "Night"}</span>
      </button>
    );
  }


  // menu row (account dropdown) — a segmented Sun / Moon control so the
  // active skin is always visible instead of a single ambiguous label.
  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn("flex w-full items-center gap-1 rounded-md px-1.5 py-1 my-0.5", className)}
    >
      {([
        { key: "sun", Icon: Sun, text: "Day", active: !isMoon },
        { key: "moon", Icon: Moon, text: "Night", active: isMoon },

      ] as const).map((opt) => (
        <button
          key={opt.key}
          type="button"
          aria-pressed={opt.active}
          onClick={() => {
            if (!opt.active) toggleMode();
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-semibold transition-colors",
            opt.active
              ? "bg-primary text-primary-foreground"
              : "bg-transparent opacity-70 hover:opacity-100",
          )}
        >
          <opt.Icon className="w-4 h-4" strokeWidth={2.25} />
          <span className="whitespace-nowrap">{opt.text}</span>
        </button>
      ))}
    </div>
  );
}

export default ThemeModeToggle;
