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
            ? "linear-gradient(135deg, #053D2F 0%, #031F18 48%, #010806 100%)"
            : "linear-gradient(135deg, rgba(5,61,47,0.74) 0%, rgba(3,31,24,0.82) 58%, rgba(1,8,6,0.88) 100%)",
          border: active
            ? "1px solid rgba(255,255,255,0.34)"
            : "1px solid rgba(255,255,255,0.28)",
          boxShadow: active
            ? "0 0 0 1px rgba(255,255,255,0.16), 0 14px 30px -18px rgba(0,0,0,0.86), inset 0 1px 0 rgba(255,255,255,0.18)"
            : "inset 0 1px 0 rgba(255,255,255,0.10)",
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
        background: "linear-gradient(135deg, #053D2F 0%, #031F18 58%, #010806 100%)",
        border: "1px solid rgba(255,255,255,0.26)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
      }}
      role="tablist"
      aria-label="Comparison mode"
    >
      <Btn value="projects" icon={Building} label="Compare Projects" />
      <Btn value="units" icon={LayoutGrid} label="Compare Units" />
    </div>
  );
}
