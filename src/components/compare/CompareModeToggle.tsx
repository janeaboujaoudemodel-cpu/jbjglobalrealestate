import { Building, LayoutGrid } from "lucide-react";

interface Props {
  mode: "projects" | "units";
  onChange: (m: "projects" | "units") => void;
}

/** Glass pill segmented control for the /compare top toggle (sits on dark CompareAIShell). */
export default function CompareModeToggle({ mode, onChange }: Props) {
  const Btn = ({ value, icon: Icon, label }: { value: "projects" | "units"; icon: typeof Building; label: string }) => {
    const active = mode === value;
    return (
      <button
        type="button"
        onClick={() => onChange(value)}
        data-no-contrast-guard
        data-allow-dark-cta
        className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
        style={{
          color: "#FFFFFF",
          background: active
            ? "linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #EC4899 100%)"
            : "rgba(255,255,255,0.06)",
          border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.15)",
          boxShadow: active ? "0 6px 24px rgba(124,58,237,0.4)" : "none",
        }}
      >
        <Icon className="w-4 h-4" style={{ color: "#FFFFFF" }} />
        {label}
      </button>
    );
  };

  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-full"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
      role="tablist"
      aria-label="Comparison mode"
    >
      <Btn value="projects" icon={Building} label="Compare Projects" />
      <Btn value="units" icon={LayoutGrid} label="Compare Units" />
    </div>
  );
}
