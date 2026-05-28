import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface LeadFilters {
  stage?: string;
  source?: string;
  hasNote?: boolean;
  period?: "all" | "today" | "7d" | "30d";
}

const STAGES = ["all", "new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const PERIODS: { value: LeadFilters["period"]; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

interface Props {
  value: LeadFilters;
  onChange: (v: LeadFilters) => void;
  sourceOptions: string[];
}

export default function LeadFiltersPopover({ value, onChange, sourceOptions }: Props) {
  const [open, setOpen] = useState(false);
  const active = Object.entries(value).filter(([, v]) => v && v !== "all" && v !== false).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-[#B89555]/40 text-sm text-[#1A1A1A] hover:border-[#B89555] bg-[#FDFBF7]"
        >
          <Filter className="h-4 w-4" />
          Filter
          {active > 0 && (
            <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-md border border-[#B89555] text-[#1A1A1A] px-1">
              {active}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 bg-[#FDFBF7] border-[#B89555]/40">
        <div className="space-y-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/60 mb-2">Pipeline stage</div>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => onChange({ ...value, stage: s === "all" ? undefined : s })}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                    (value.stage ?? "all") === s
                      ? "border-[#B89555] bg-[#EFE6D6] text-[#1A1A1A] font-semibold"
                      : "border-[#B89555]/30 text-[#1A1A1A]/70 hover:border-[#B89555]/60"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>

          {sourceOptions.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/60 mb-2">Source</div>
              <select
                value={value.source ?? ""}
                onChange={(e) => onChange({ ...value, source: e.target.value || undefined })}
                className="w-full h-9 px-2.5 rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] text-sm text-[#1A1A1A]"
              >
                <option value="">All sources</option>
                {sourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/60 mb-2">Period</div>
            <div className="flex flex-wrap gap-1.5">
              {PERIODS.map(p => (
                <button
                  key={p.value}
                  onClick={() => onChange({ ...value, period: p.value })}
                  className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                    (value.period ?? "all") === p.value
                      ? "border-[#B89555] bg-[#EFE6D6] text-[#1A1A1A] font-semibold"
                      : "border-[#B89555]/30 text-[#1A1A1A]/70 hover:border-[#B89555]/60"
                  }`}
                >{p.label}</button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#1A1A1A]">
            <input
              type="checkbox"
              checked={!!value.hasNote}
              onChange={(e) => onChange({ ...value, hasNote: e.target.checked || undefined })}
              className="accent-[#B89555]"
            />
            Only leads with notes
          </label>

          {active > 0 && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="inline-flex items-center gap-1.5 text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
