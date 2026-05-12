/**
 * CRMAINextActions
 * --------------------------------------------------------------------------
 * Owner-only "What to do next" widget that asks Lovable AI for the top 5
 * most valuable next actions across the user's most recent leads.
 *
 * Cached server-side for 10 minutes (crm_ai_suggestions table) so re-renders
 * do not burn tokens. Each suggestion ships with one-click handoffs into
 * the existing CRM lead actions.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Phone, Mail, CalendarPlus, Trophy, Clock, RefreshCw } from "lucide-react";

type Action = "call" | "email" | "schedule" | "won" | "snooze";

interface Suggestion {
  leadId: string;
  reason: string;
  action: Action;
  confidence: number;
}

interface LeadLite {
  id: string;
  full_name: string | null;
  email_lower?: string | null;
  phone_e164?: string | null;
  pipeline_stage?: string | null;
  source?: string | null;
  vip?: boolean | null;
  created_at?: string | null;
}

interface Props {
  userId: string;
}

const ACTION_META: Record<Action, { label: string; Icon: typeof Phone; tone: string }> = {
  call:     { label: "Call now",      Icon: Phone,        tone: "bg-emerald-50 text-emerald-800 border-emerald-300" },
  email:    { label: "Send email",    Icon: Mail,         tone: "bg-blue-50 text-blue-800 border-blue-300" },
  schedule: { label: "Schedule",      Icon: CalendarPlus, tone: "bg-amber-50 text-amber-800 border-amber-300" },
  won:      { label: "Mark as won",   Icon: Trophy,       tone: "bg-emerald-100 text-emerald-900 border-emerald-400" },
  snooze:   { label: "Snooze",        Icon: Clock,        tone: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40" },
};

export default function CRMAINextActions({ userId }: Props) {
  const [leads, setLeads] = useState<LeadLite[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);

  // Fetch latest 50 leads (lightweight projection)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("crm_leads")
        .select("id, full_name, email_lower, phone_e164, pipeline_stage, vip, created_at, lead_source_type")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      const mapped: LeadLite[] = (data || []).map((l: any) => ({
        id: l.id,
        full_name: l.full_name,
        email_lower: l.email_lower,
        phone_e164: l.phone_e164,
        pipeline_stage: l.pipeline_stage,
        vip: l.vip,
        source: l.lead_source_type,
        created_at: l.created_at,
      }));
      setLeads(mapped);
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const requestPayload = useMemo(
    () =>
      leads.map((l) => ({
        id: l.id,
        full_name: l.full_name,
        pipeline_stage: l.pipeline_stage,
        source: l.source,
        vip: l.vip,
        created_at: l.created_at,
      })),
    [leads],
  );

  const runAI = async () => {
    if (loading || requestPayload.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeErr } = await supabase.functions.invoke("crm-ai-next-actions", {
        body: { leads: requestPayload },
      });
      if (invokeErr) throw invokeErr;
      const list: Suggestion[] = Array.isArray(data?.suggestions) ? data.suggestions : [];
      setSuggestions(list);
      setCached(!!data?.cached);
    } catch (e: any) {
      setError(e?.message || "Could not load AI suggestions");
    } finally {
      setLoading(false);
    }
  };

  // Auto-run once we have leads
  useEffect(() => {
    if (leads.length > 0 && suggestions.length === 0 && !loading && !error) {
      void runAI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads.length]);

  const leadById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads]);

  const handleAction = async (s: Suggestion) => {
    const lead = leadById.get(s.leadId);
    if (!lead) return;
    if (s.action === "call" && lead.phone_e164) {
      window.location.href = `tel:${lead.phone_e164}`;
      return;
    }
    if (s.action === "email" && lead.email_lower) {
      window.location.href = `mailto:${lead.email_lower}`;
      return;
    }
    if (s.action === "schedule") {
      window.location.href = `/owner/crm/leads/${lead.id}?action=schedule`;
      return;
    }
    if (s.action === "won") {
      try {
        await supabase.from("crm_leads").update({ pipeline_stage: "closed_won" }).eq("id", lead.id);
        setSuggestions((prev) => prev.filter((x) => x.leadId !== s.leadId));
      } catch {/* noop */}
      return;
    }
    if (s.action === "snooze") {
      setSuggestions((prev) => prev.filter((x) => x.leadId !== s.leadId));
      return;
    }
    // Fallback: open the lead
    window.location.href = `/owner/crm/leads/${lead.id}`;
  };

  return (
    <div className="rounded-xl border border-[#B89555]/35 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]/70 p-4 md:p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-purple-300 bg-gradient-to-br from-purple-100 to-fuchsia-100 text-purple-700"
            aria-hidden
          >
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <div className="text-sm font-bold text-[#1A1A1A] tracking-tight">
              AI Next Actions
              {cached && (
                <span className="ml-2 text-[10px] font-semibold uppercase text-[#1A1A1A]/55 tracking-wider">
                  Cached
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#1A1A1A]/65">
              Top {suggestions.length || "—"} highest-value next steps from your latest {leads.length} leads
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={runAI}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#EFE6D6] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Thinking…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      ) : loading && suggestions.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border border-[#B89555]/20 bg-[#FDFBF7] animate-pulse" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-xs text-[#1A1A1A]/60 italic">
          {leads.length === 0
            ? "Add or import some leads to get AI recommendations."
            : "No high-priority actions right now — your pipeline is calm."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {suggestions.map((s) => {
            const lead = leadById.get(s.leadId);
            const meta = ACTION_META[s.action] ?? ACTION_META.snooze;
            const Icon = meta.Icon;
            return (
              <div
                key={s.leadId + s.action}
                className="rounded-lg border border-[#B89555]/30 bg-[#FDFBF7] p-3 flex flex-col gap-2 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <a
                    href={lead ? `/owner/crm/leads/${lead.id}` : "#"}
                    className="text-sm font-semibold text-[#1A1A1A] hover:underline decoration-[#B89555] underline-offset-2 truncate"
                    title={lead?.full_name || "Lead"}
                  >
                    {lead?.full_name || "(unknown lead)"}
                  </a>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-[#1A1A1A]/55 whitespace-nowrap">
                    {Math.round((s.confidence || 0) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-[#1A1A1A]/80 leading-snug line-clamp-3">{s.reason}</p>
                <button
                  type="button"
                  onClick={() => handleAction(s)}
                  className={`mt-auto inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border ${meta.tone} hover:brightness-95 transition`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
