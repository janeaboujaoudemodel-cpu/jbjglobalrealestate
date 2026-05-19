/**
 * UnifiedBrokerPicker
 * ------------------------------------------------------------------
 * Single picker that surfaces TWO distinct sources without merging
 * their identities:
 *
 *   1. "Broker"     — canonical crm_brokers row (broker_id = crm_brokers.id)
 *   2. "Pre-invite" — broker-shaped crm_leads row not yet promoted
 *                     (lead_id = crm_leads.id)
 *
 * The caller receives a discriminated union and MUST handle both
 * branches. We never collide crm_brokers.id with crm_leads.id.
 *
 * Backed by:
 *   - public.vw_crm_broker_overview         (source = "broker")
 *   - public.vw_crm_broker_pre_invite_leads (source = "pre_invite")
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Loader2, UserCircle2, UserPlus2, Check, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UnifiedBrokerSelection =
  | {
      source: "broker";
      broker_id: string;
      name: string;
      email: string | null;
      company: string | null;
      subscription_tier: string | null;
      verification_status: string | null;
    }
  | {
      source: "pre_invite";
      lead_id: string;
      name: string;
      email: string | null;
      company: string | null;
    };

type Row = UnifiedBrokerSelection & { _key: string };

interface Props {
  value: UnifiedBrokerSelection | null;
  onChange: (next: UnifiedBrokerSelection | null) => void;
  label?: string;
  placeholder?: string;
  /** Restrict to one source only — defaults to both. */
  allow?: Array<"broker" | "pre_invite">;
}

export function UnifiedBrokerPicker({
  value,
  onChange,
  label = "Broker",
  placeholder = "Search canonical brokers or pre-invite leads…",
  allow = ["broker", "pre_invite"],
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!open) return;
    if (debRef.current) window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const term = query.trim();
        const out: Row[] = [];

        if (allow.includes("broker")) {
          let q = supabase
            .from("vw_crm_broker_overview")
            .select(
              "broker_id, broker_name, broker_email, broker_company, subscription_tier, verification_status",
            )
            .order("broker_name", { ascending: true })
            .limit(15);
          if (term) q = q.or(`broker_name.ilike.%${term}%,broker_email.ilike.%${term}%`);
          const { data } = await q;
          (data ?? []).forEach((r: any) =>
            out.push({
              _key: `broker:${r.broker_id}`,
              source: "broker",
              broker_id: r.broker_id,
              name: r.broker_name ?? "—",
              email: r.broker_email,
              company: r.broker_company,
              subscription_tier: r.subscription_tier,
              verification_status: r.verification_status,
            }),
          );
        }

        if (allow.includes("pre_invite")) {
          let q = supabase
            .from("vw_crm_broker_pre_invite_leads")
            .select("lead_id, lead_name, lead_email, lead_company")
            .order("lead_name", { ascending: true })
            .limit(15);
          if (term) q = q.or(`lead_name.ilike.%${term}%,lead_email.ilike.%${term}%`);
          const { data } = await q;
          (data ?? []).forEach((r: any) =>
            out.push({
              _key: `pre_invite:${r.lead_id}`,
              source: "pre_invite",
              lead_id: r.lead_id,
              name: r.lead_name ?? "—",
              email: r.lead_email,
              company: r.lead_company,
            }),
          );
        }

        setRows(out);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debRef.current) window.clearTimeout(debRef.current);
    };
  }, [query, open, allow]);

  const selectedKey = useMemo(() => {
    if (!value) return null;
    return value.source === "broker"
      ? `broker:${value.broker_id}`
      : `pre_invite:${value.lead_id}`;
  }, [value]);

  const displayLabel = value?.name ?? "";

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
              {value?.source === "pre_invite" ? (
                <UserPlus2 className="w-4 h-4 text-[#1A1A1A]/60 flex-shrink-0" />
              ) : (
                <UserCircle2 className="w-4 h-4 text-[#1A1A1A]/60 flex-shrink-0" />
              )}
              <span className={`truncate ${displayLabel ? "" : "text-[#1A1A1A]/50"}`}>
                {displayLabel || placeholder}
              </span>
              {value ? <SourcePill source={value.source} /> : null}
            </span>
            <ChevronDown className="w-4 h-4 text-[#1A1A1A]/60 flex-shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 bg-[#FDFBF7] border border-[#B89555]/35 shadow-lg crm-scope"
          align="start"
        >
          <div className="p-2 border-b border-[#B89555]/20">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="h-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-6 flex items-center justify-center text-sm text-[#1A1A1A]/60">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching…
              </div>
            ) : rows.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#1A1A1A]/60">No matches.</div>
            ) : (
              rows.map((r) => {
                const selected = selectedKey === r._key;
                return (
                  <button
                    key={r._key}
                    type="button"
                    onClick={() => {
                      // Strip _key before propagating.
                      const { _key, ...sel } = r;
                      onChange(sel as UnifiedBrokerSelection);
                      setOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#EFE6D6] flex items-start gap-2 border-l-2 border-transparent hover:border-[#B89555]"
                  >
                    <Check
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selected ? "opacity-100" : "opacity-0"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="block truncate font-medium">{r.name}</span>
                        <SourcePill source={r.source} />
                      </span>
                      {(r.company || r.email) && (
                        <span className="block truncate text-xs text-[#1A1A1A]/60">
                          {[r.company, r.email].filter(Boolean).join(" · ")}
                        </span>
                      )}
                      {r.source === "broker" && (r.subscription_tier || r.verification_status) && (
                        <span className="block truncate text-[10px] text-[#1A1A1A]/55 mt-0.5">
                          {[
                            r.subscription_tier && `tier: ${r.subscription_tier}`,
                            r.verification_status && `verif: ${r.verification_status}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
          {value && (
            <div className="border-t border-[#B89555]/20 p-2">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6] rounded"
              >
                Clear selection
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SourcePill({ source }: { source: "broker" | "pre_invite" }) {
  if (source === "broker") {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555] whitespace-nowrap">
        Broker
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/60 whitespace-nowrap">
      Pre-invite
    </span>
  );
}

export default UnifiedBrokerPicker;
