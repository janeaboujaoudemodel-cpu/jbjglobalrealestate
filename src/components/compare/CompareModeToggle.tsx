import { Building, LayoutGrid } from "lucide-react";

interface Props {
  mode: "projects" | "units";
  onChange: (m: "projects" | "units") => void;
}

/** Champagne segmented control for the /compare top toggle. */
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
        onClick={() => onChange(value)}
        className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
        style={{
          color: active ? "#FFFFFF" : "#1A1A1A",
          background: active ? "#0A0A0A" : "#FDFBF7",
          border: active
            ? "1px solid rgba(184,149,85,0.7)"
            : "1px solid rgba(184,149,85,0.45)",
          boxShadow: active
            ? "0 6px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "inset 0 1px 0 rgba(255,255,255,0.6)",
        }}
        {...(active ? { "data-allow-dark-cta": true } : {})}
      >
        <Icon className="w-4 h-4" style={{ color: active ? "#FFFFFF" : "#B89555" }} />
        {label}
      </button>
    );
  };

  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-full"
      style={{
        background: "#F7F2EA",
        border: "1px solid rgba(184,149,85,0.45)",
      }}
      role="tablist"
      aria-label="Comparison mode"
    >
      <Btn value="projects" icon={Building} label="Compare Projects" />
      <Btn value="units" icon={LayoutGrid} label="Compare Units" />
    </div>
  );
}
