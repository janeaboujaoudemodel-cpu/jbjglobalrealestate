// BrokerageCombobox — typeahead picker for crm_brokerages.
// Writes both `current_company` (display text) and `current_brokerage_id` (FK).
// Champagne tokens, ink text, 1px gold hairline. No solid gold fills.
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, Plus, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BrokerageOption {
  id: string;
  company_name: string;
  rera_license: string | null;
  office_location: string | null;
}

interface Props {
  value: string;                      // free-text fallback (current_company)
  brokerageId: string | null;         // FK
  onChange: (next: { value: string; brokerageId: string | null }) => void;
  label?: string;
  placeholder?: string;
}

export function BrokerageCombobox({
  value,
  brokerageId,
  onChange,
  label = "Current company",
  placeholder = "Type to search brokerages…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<BrokerageOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const debRef = useRef<number | undefined>(undefined);

  useEffect(() => { setQuery(value || ""); }, [value]);

  useEffect(() => {
    if (!open) return;
    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        let q = supabase
          .from("crm_brokerages")
          .select("id, company_name, rera_license, office_location")
          .order("company_name", { ascending: true })
          .limit(8);
        const term = query.trim();
        if (term.length >= 1) q = q.ilike("company_name", `%${term}%`);
        const { data, error } = await q;
        if (error) throw error;
        setResults((data ?? []) as BrokerageOption[]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => { if (debRef.current) window.clearTimeout(debRef.current); };
  }, [query, open]);

  const exactMatch = useMemo(
    () => results.find((r) => r.company_name.trim().toLowerCase() === query.trim().toLowerCase()),
    [results, query],
  );

  const choose = (opt: BrokerageOption) => {
    onChange({ value: opt.company_name, brokerageId: opt.id });
    setQuery(opt.company_name);
    setOpen(false);
  };

  const useFreeText = () => {
    onChange({ value: query.trim(), brokerageId: null });
    setOpen(false);
  };

  const createNew = async () => {
    const name = query.trim();
    if (!name) { toast.error("Type a brokerage name first"); return; }
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const { data, error } = await (supabase as any)
        .from("crm_brokerages")
        .insert({ owner_id: user.id, company_name: name, status: "lead" })
        .select("id, company_name, rera_license, office_location")
        .single();
      if (error) throw error;
      toast.success(`Created brokerage "${name}"`);
      choose(data as BrokerageOption);
    } catch (e: any) {
      toast.error(e?.message || "Could not create brokerage");
    } finally {
      setCreating(false);
    }
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
            <span className={value ? "" : "text-[#1A1A1A]/50"}>
              {value || placeholder}
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
              placeholder="Search brokerages…"
              className="h-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
            />
          </div>
          <div
            className="max-h-72 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {loading ? (
              <div className="px-3 py-6 flex items-center justify-center text-sm text-[#1A1A1A]/60">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching…
              </div>
            ) : results.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#1A1A1A]/60">No matches.</div>
            ) : (
              results.map((opt) => {
                const selected = brokerageId === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => choose(opt)}
                    className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#EFE6D6] flex items-start gap-2 border-l-2 border-transparent hover:border-[#B89555]"
                  >
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selected ? "opacity-100 text-[#1A1A1A]" : "opacity-0"}`}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{opt.company_name}</span>
                      {(opt.rera_license || opt.office_location) && (
                        <span className="block truncate text-xs text-[#1A1A1A]/60">
                          {[opt.rera_license, opt.office_location].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-[#B89555]/20 p-2 flex flex-col gap-1">
            {query.trim() && !exactMatch && (
              <Button
                type="button"
                onClick={createNew}
                disabled={creating}
                variant="gold"
                size="sm"
                className="w-full justify-start"
              >
                {creating
                  ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Creating…</>
                  : <><Plus className="w-3.5 h-3.5 mr-2" />Create &ldquo;{query.trim()}&rdquo;</>}
              </Button>
            )}
            {query.trim() && (
              <button
                type="button"
                onClick={useFreeText}
                className="w-full text-left px-2 py-1.5 text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] rounded"
              >
                Use as free text (no brokerage record)
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
