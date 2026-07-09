import { CATEGORIES, CrmCategory } from "./constants";
import { cn } from "@/lib/utils";

interface Props {
  value: CrmCategory | null;
  onChange: (v: CrmCategory) => void;
}

export default function CategoryStep({ value, onChange }: Props) {
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#0d3a2b]">Who are you?</h2>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Choose the profile that best describes you. We'll tailor the next steps.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            style={{ display: "block", textAlign: "left" }}
            className={cn(
              "w-full p-4 rounded-md border transition-all",
              value === c.value
                ? "bg-[#064E3B] text-white border-[#064E3B] shadow-lg"
                : "bg-white border-[#B89555]/40 hover:border-[#064E3B]"
            )}
          >
            <div className="font-serif text-lg leading-tight">{c.label}</div>
            <div className={cn(
              "text-xs mt-1",
              value === c.value ? "text-white/80" : "text-[#1A1A1A]/60"
            )}>{c.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
