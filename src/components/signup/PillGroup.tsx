import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  columns?: number;
}

export default function PillGroup({ options, value, onChange }: Props) {
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-[#B89555]/35 p-4 md:p-5 bg-white">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => toggle(o)}
            className={cn(
              "group inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-full border",
              "transition-all duration-200 ease-out will-change-transform",
              "active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/30",
              active
                ? "bg-[#064E3B] border-[#064E3B] text-white shadow-[0_6px_14px_-6px_rgba(6,78,59,0.45)]"
                : "bg-white border-[#B89555]/45 text-[#1A1A1A] hover:border-[#064E3B] hover:-translate-y-0.5 hover:shadow-[0_4px_10px_-4px_rgba(6,78,59,0.18)]"
            )}
          >
            <Check
              className={cn(
                "w-3 h-3 transition-all duration-200",
                active ? "opacity-100 scale-100" : "opacity-0 -ml-1 scale-75"
              )}
            />
            <span>{o}</span>
          </button>
        );
      })}
    </div>
  );
}
