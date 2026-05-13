// Cards ⇄ Sheet toggle. Champagne pill, ink text, hairline gold, persists per scope.
import { useEffect, useState } from "react";
import { LayoutGrid, Sheet as SheetIcon } from "lucide-react";

export type CRMViewMode = "cards" | "sheet";

export function useCRMViewMode(scope: string, fallback: CRMViewMode = "cards") {
  const key = `jbj.crm.view.${scope}`;
  const [mode, setMode] = useState<CRMViewMode>(() => {
    try {
      const v = localStorage.getItem(key);
      return v === "sheet" || v === "cards" ? v : fallback;
    } catch { return fallback; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, mode); } catch { /* noop */ }
  }, [key, mode]);
  return [mode, setMode] as const;
}

export function ViewSwitch({
  value,
  onChange,
  className = "",
}: {
  value: CRMViewMode;
  onChange: (m: CRMViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center rounded-md border border-[#B89555]/40 bg-[#F7F2EA] p-0.5 ${className}`}
      role="tablist"
      aria-label="View mode"
    >
      {([
        { id: "cards", label: "Cards", Icon: LayoutGrid },
        { id: "sheet", label: "Sheet", Icon: SheetIcon },
      ] as const).map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[5px] transition-colors ${
              active
                ? "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60"
                : "text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default ViewSwitch;
