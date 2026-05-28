import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface ListLead {
  id: string;
  full_name: string;
  notes?: string | null;
  pipeline_stage?: string | null;
  source?: string | null;
  created_at: string;
  ai_score?: number | null;
}

interface Props {
  leads: ListLead[];
  selectedId?: string;
  onSelect: (id: string) => void;
  search: string;
  onSearch: (s: string) => void;
  rightSlot?: React.ReactNode;
}

function scoreClass(s?: number | null) {
  if (s == null) return "border-[#1A1A1A]/20 text-[#1A1A1A]/40";
  if (s >= 80) return "border-emerald-500 text-emerald-600";
  if (s >= 60) return "border-amber-500 text-amber-600";
  return "border-blue-500 text-blue-600";
}

export default function AssistantLeadList({ leads, selectedId, onSelect, search, onSearch, rightSlot }: Props) {
  return (
    <div className="w-full lg:w-72 shrink-0 flex flex-col border border-[#B89555]/30 rounded-2xl bg-[#FDFBF7] overflow-hidden">
      <div className="p-3 space-y-2 border-b border-[#B89555]/20">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/40" />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search leads…"
              className="pl-8 h-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40"
            />
          </div>
          {rightSlot}
        </div>
        <div className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/55">
          {leads.length} lead{leads.length === 1 ? "" : "s"}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[640px]">
        {leads.length === 0 && (
          <div className="p-6 text-sm text-[#1A1A1A]/50 text-center">No leads match these filters.</div>
        )}
        {leads.map((l) => {
          const active = l.id === selectedId;
          return (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className={`w-full text-left px-3 py-3 border-b border-[#B89555]/15 transition-colors ${
                active ? "bg-[#EFE6D6]" : "hover:bg-[#F7F2EA]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#1A1A1A] truncate">{l.full_name || "Unnamed"}</div>
                  {l.notes && (
                    <div className="text-[11px] text-[#1A1A1A]/60 line-clamp-2 mt-0.5">{l.notes}</div>
                  )}
                  <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/45 mt-1">
                    {l.pipeline_stage || "new"} {l.source ? `· ${l.source}` : ""}
                  </div>
                </div>
                <span className={`shrink-0 text-[10px] font-bold min-w-[44px] h-9 px-1.5 rounded-md border-2 grid place-items-center bg-transparent tabular-nums ${scoreClass(l.ai_score)}`}>
                  {l.ai_score != null ? `${l.ai_score}%` : "—"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
