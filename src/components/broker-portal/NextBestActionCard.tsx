import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Phone, MessageSquare, Mail, CalendarPlus, Trophy, Clock, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBrokerScopedLeads } from "@/hooks/useBrokerScopedLeads";

type AiSuggestion = {
  leadId: string;
  reason: string;
  action: "call" | "email" | "schedule" | "won" | "snooze";
  confidence: number;
};

const ACTION_META: Record<AiSuggestion["action"], { label: string; Icon: any }> = {
  call: { label: "Call now", Icon: Phone },
  email: { label: "Send email", Icon: Mail },
  schedule: { label: "Book viewing", Icon: CalendarPlus },
  won: { label: "Mark won", Icon: Trophy },
  snooze: { label: "Snooze", Icon: Clock },
};

/** Premium AI Next-Best-Action queue — top 5 leads the broker should touch right now. */
export default function NextBestActionCard() {
  const leads = useBrokerScopedLeads();

  // Pick the top 50 freshest leads to send the AI ranker — covers the brief
  // without burning tokens. The edge function caches by lead-id signature.
  const candidates = useMemo(() => {
    const list = (leads.data ?? []) as any[];
    return list
      .slice()
      .sort((a, b) => (new Date(b.created_at ?? 0).getTime()) - (new Date(a.created_at ?? 0).getTime()))
      .slice(0, 50)
      .map((l) => ({
        id: l.id,
        full_name: l.full_name ?? l.name ?? null,
        pipeline_stage: l.pipeline_stage ?? l.stage ?? null,
        source: l.source ?? null,
        created_at: l.created_at ?? null,
        vip: !!l.is_vip,
      }));
  }, [leads.data]);

  const ai = useQuery({
    queryKey: ["broker-nba", candidates.map((c) => c.id).join(",")],
    enabled: candidates.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("crm-ai-next-actions", {
        body: { leads: candidates },
      });
      if (error) throw error;
      const suggestions = (data?.suggestions ?? []) as AiSuggestion[];
      return suggestions.slice(0, 5);
    },
  });

  const byId = useMemo(() => {
    const m = new Map<string, any>();
    (leads.data ?? []).forEach((l: any) => m.set(l.id, l));
    return m;
  }, [leads.data]);

  const loading = leads.isLoading || ai.isLoading;
  const suggestions = ai.data ?? [];

  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-[#B89555]/35 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-5 md:p-6 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_30px_-18px_rgba(10,10,10,0.25)]">
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/55 to-transparent" />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div
            data-no-contrast-guard
            data-allow-dark-cta
            className="allow-white inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/20 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.65)]"
            style={{ backgroundImage: "var(--jj-emerald-ombre)" }}
          >
            <Sparkles className="h-3 w-3" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#FFFFFF" }}>
              AI Next-Best-Action
            </span>
          </div>
          <h2 className="mt-2.5 font-display text-lg md:text-xl font-semibold text-[#1A1A1A] tracking-tight">
            Who to touch right now
          </h2>
          <p className="text-[12px] text-[#1A1A1A]/60 mt-1">
            Ranked by recency, stage and intent. Refreshes every 5 minutes.
          </p>
        </div>
        <Link
          to="/broker/crm"
          className="hidden md:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md text-[#1A1A1A] hover:bg-[#EFE6D6] border border-[#B89555]/40 transition-colors"
        >
          Full pipeline <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-[#EFE6D6]/70 animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="text-center py-8 text-[13px] text-[#1A1A1A]/60">
          {candidates.length === 0
            ? "No leads yet — once you add or import contacts, AI will rank your next moves here."
            : "All quiet — no high-priority actions right now."}
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((s, idx) => {
            const lead = byId.get(s.leadId);
            const meta = ACTION_META[s.action] ?? ACTION_META.call;
            const Icon = meta.Icon;
            return (
              <li
                key={s.leadId}
                className="group flex items-center gap-3 rounded-xl border border-[#B89555]/30 bg-[#FDFBF7] hover:border-[#B89555]/60 hover:shadow-[0_10px_24px_-18px_rgba(10,10,10,0.35)] transition-all p-2.5 pr-3"
              >
                <span
                  data-no-contrast-guard
                  data-allow-dark-cta
                  className="allow-white shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[12px] font-bold border border-white/20 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.65)]"
                  style={{ backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF" }}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[14px] font-semibold text-[#1A1A1A] truncate">
                      {lead?.full_name || lead?.name || "Lead"}
                    </span>
                    {lead?.is_vip && (
                      <span className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#B89555]">VIP</span>
                    )}
                  </div>
                  <div className="text-[11.5px] text-[#1A1A1A]/65 leading-snug truncate">{s.reason}</div>
                </div>
                <Link
                  to={`/broker/leads/${s.leadId}`}
                  aria-label={meta.label}
                  data-no-contrast-guard
                  data-allow-dark-cta
                  className="allow-white inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-md border border-white/20 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)] hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-12px_rgba(6,78,59,0.95),0_0_16px_rgba(52,211,153,0.22)] transition-all"
                  style={{ backgroundImage: "var(--jj-emerald-ombre)", color: "#FFFFFF" }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  {meta.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
