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
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => toggle(o)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              active
                ? "bg-[#064E3B] border-[#064E3B] text-white"
                : "bg-white border-[#B89555]/40 text-[#1A1A1A] hover:border-[#064E3B]"
            )}
          >
            {active && <Check className="inline w-3 h-3 mr-1" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}
