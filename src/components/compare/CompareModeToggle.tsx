import { Building, LayoutGrid } from "lucide-react";

interface Props {
  mode: "projects" | "units";
  onChange: (m: "projects" | "units") => void;
}

/** Emerald segmented control for the /compare top toggle. */
export default function CompareModeToggle({ mode, onChange }: Props) {
  const Btn = ({
    value,
    icon: Icon,
    label,
  }: {
    value: "projects" | "units";
    icon: typeof Building;
    label: string;
  }) => {
    const active = mode === value;
    return (
      <button
        type="button"
        data-compare-mode-toggle-button
        data-compare-mode-active={active ? "true" : "false"}
        data-surface="emerald"
        data-on-dark="true"
        data-no-contrast-guard
        onClick={() => onChange(value)}
        className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
        style={{
          color: "#FFFFFF",
          WebkitTextFillColor: "#FFFFFF",
          background: active
            ? "linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)"
            : "rgba(255,255,255,0.12)",
          border: active
            ? "1px solid rgba(255,255,255,0.34)"
            : "1px solid rgba(255,255,255,0.28)",
          boxShadow: active
            ? "0 10px 24px -14px rgba(6,78,59,0.72), inset 0 1px 0 rgba(255,255,255,0.16)"
            : "inset 0 1px 0 rgba(255,255,255,0.12)",
        }}
        {...(active ? { "data-allow-dark-cta": true, "data-cta": "dark" } : {})}
      >
        <Icon className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
        <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{label}</span>
      </button>
    );
  };

  return (
    <div
      data-compare-mode-toggle
      data-surface="emerald"
      data-on-dark="true"
      className="inline-flex items-center gap-1 p-1 rounded-full"
      style={{
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.26)",
      }}
      role="tablist"
      aria-label="Comparison mode"
    >
      <Btn value="projects" icon={Building} label="Compare Projects" />
      <Btn value="units" icon={LayoutGrid} label="Compare Units" />
    </div>
  );
}
