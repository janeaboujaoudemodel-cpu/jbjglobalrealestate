/**
 * EmailChipInput — multi-email chip field
 * Champagne + gold theme, Inter only, no blue/silver.
 */
import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  required?: boolean;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export function EmailChipInput({ label, values, onChange, placeholder, required }: Props) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim().replace(/,$/, "");
    if (!v) return;
    if (!isEmail(v)) return;
    if (values.includes(v)) { setDraft(""); return; }
    onChange([...values, v]);
    setDraft("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        commit();
      }
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-[#1A1A1A] flex items-center gap-1">
        {label}
        {required && <span className="text-[#1A1A1A]/50">*</span>}
      </label>
      <div
        className={cn(
          "mt-1 min-h-[40px] flex flex-wrap items-center gap-1.5 px-2 py-1.5",
          "bg-[#FDFBF7] border border-[#B89555]/40 rounded-md",
          "focus-within:ring-2 focus-within:ring-[#B89555]/40 focus-within:border-[#B89555]",
        )}
      >
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-[#EFE6D6] border border-[#B89555]/40 text-xs text-[#1A1A1A]"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="ml-0.5 p-0.5 rounded hover:bg-[#B89555]/20 text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
              aria-label={`Remove ${v}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKey}
          onBlur={commit}
          placeholder={values.length ? "" : placeholder || "name@example.com"}
          className="flex-1 min-w-[140px] bg-transparent outline-none text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40"
        />
        {draft.trim() && isEmail(draft) && (
          <button
            type="button"
            onClick={commit}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border border-[#B89555]/40 bg-[#FDFBF7] hover:bg-[#EFE6D6] text-[#1A1A1A]"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>
    </div>
  );
}

export default EmailChipInput;
