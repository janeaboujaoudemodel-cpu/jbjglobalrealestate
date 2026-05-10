// BrokerCombobox — typeahead picker for crm_brokers.
// Writes both broker_name_text (display) and assigned_broker_id (FK).
// Free-text fallback when no broker record exists yet.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Check, UserCircle2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export interface BrokerOption {
  id: string;
  full_name: string;
  current_company: string | null;
  email_lower: string | null;
  phone_e164: string | null;
}

interface Props {
  value: string;                       // free-text broker_name_text
  brokerId: string | null;             // FK assigned_broker_id
  onChange: (next: { value: string; brokerId: string | null }) => void;
  label?: string;
  placeholder?: string;
}

export function BrokerCombobox({
  value,
  brokerId,
  onChange,
  label = "Assigned broker",
  placeholder = "Type to search brokers…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<BrokerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debRef = useRef<number | undefined>(undefined);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    if (!open) return;
    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        let q = supabase
          .from("crm_brokers")
          .select("id, full_name, current_company, email_lower, phone_e164")
          .order("full_name", { ascending: true })
          .limit(10);
        const term = query.trim();
        if (term.length >= 1) q = q.ilike("full_name", `%${term}%`);
        const { data, error } = await q;
        if (error) throw error;
        setResults((data ?? []) as BrokerOption[]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => { if (debRef.current) window.clearTimeout(debRef.current); };
  }, [query, open]);

  const exactMatch = useMemo(
    () => results.find((r) => (r.full_name || "").trim().toLowerCase() === query.trim().toLowerCase()),
    [results, query],
  );

  const choose = (opt: BrokerOption) => {
    onChange({ value: opt.full_name, brokerId: opt.id });
    setQuery(opt.full_name);
    setOpen(false);
  };

  const useFreeText = () => {
    onChange({ value: query.trim(), brokerId: null });
    setOpen(false);
  };

  return (
    <div>
      {label ? <Label className="text-xs text-[#1A1A1A]/70">{label}</Label> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-1 w-full h-10 flex items-center justify-between gap-2 px-3 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] text-sm text-[#1A1A1A] hover:bg-[#EFE6D6] transition"
          >
            <span className="flex items-center gap-2 min-w-0">
              <UserCircle2 className="w-4 h-4 text-[#1A1A1A]/60 flex-shrink-0" />
              <span className={`truncate ${value ? "" : "text-[#1A1A1A]/50"}`}>
                {value || placeholder}
              </span>
            </span>
            <ChevronDown className="w-4 h-4 text-[#1A1A1A]/60 flex-shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#FDFBF7] border border-[#B89555]/35 shadow-lg"
          align="start"
        >
          <div className="p-2 border-b border-[#B89555]/20">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brokers by name…"
              className="h-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
            />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-6 flex items-center justify-center text-sm text-[#1A1A1A]/60">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#1A1A1A]/60">
                No broker matches. You can save it as free text below.
              </div>
            ) : (
              results.map((opt) => {
                const selected = brokerId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => choose(opt)}
                    className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#EFE6D6] flex items-start gap-2 border-l-2 border-transparent hover:border-[#B89555]"
                  >
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selected ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{opt.full_name}</span>
                      {(opt.current_company || opt.email_lower) && (
                        <span className="block truncate text-xs text-[#1A1A1A]/60">
                          {[opt.current_company, opt.email_lower].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {query.trim() && !exactMatch && (
            <div className="border-t border-[#B89555]/20 p-2">
              <button
                type="button"
                onClick={useFreeText}
                className="w-full text-left px-2 py-1.5 text-xs text-[#1A1A1A]/80 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] rounded"
              >
                Save as free text: <span className="font-semibold">"{query.trim()}"</span>
                <span className="block text-[10px] text-[#1A1A1A]/55 mt-0.5">
                  Will link automatically when this broker is added to the CRM.
                </span>
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
