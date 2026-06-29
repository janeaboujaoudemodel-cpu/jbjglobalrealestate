/**
 * Broker-native Deals & Commissions view.
 *
 * Surfaces the broker's OWN leads (assigned_broker_id = auth.uid()) that have
 * progressed past the early-pipeline stages, with derived deal value, status,
 * and projected commission. Read-only on purpose — owners manage commissions
 * elsewhere. Never redirects into the company CRM.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Handshake, TrendingUp, Wallet, Clock, CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import BrokerEmptyState from "@/components/broker-portal/BrokerEmptyState";
import { IconTile } from "@/components/ui/icon-tile";

type DealRow = {
  id: string;
  full_name: string;
  pipeline_stage: string | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string | null;
  preferred_project: string | null;
  preferred_location: string | null;
  property_type: string | null;
  updated_at: string;
};

const ACTIVE_STAGES = ["qualified", "viewing", "offer", "negotiation", "deposit"];
const WON_STAGES = ["closed_won", "won", "closed"];
const LOST_STAGES = ["closed_lost", "lost", "dropped"];

const STAGE_LABEL: Record<string, string> = {
  qualified: "Qualified",
  viewing: "Viewing",
  offer: "Offer made",
  negotiation: "Negotiation",
  deposit: "Deposit",
  closed_won: "Closed — won",
  won: "Closed — won",
  closed: "Closed",
  closed_lost: "Closed — lost",
  lost: "Lost",
  dropped: "Dropped",
};

const COMMISSION_RATE = 0.02; // 2% projected — display-only

function formatMoney(value: number, currency = "AED") {
  if (!Number.isFinite(value) || value <= 0) return "—";
  try {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${Math.round(value).toLocaleString()}`;
  }
}

function dealValueOf(r: DealRow): number {
  if (r.budget_max && r.budget_max > 0) return Number(r.budget_max);
  if (r.budget_min && r.budget_min > 0) return Number(r.budget_min);
  return 0;
}

interface Props {
  /** "deals" shows full pipeline + commission; "commissions" focuses on won + projected payouts. */
  variant?: "deals" | "commissions";
}

export default function BrokerDealsPage({ variant = "deals" }: Props) {
  const { user } = useAuth();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["broker-deals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_leads")
        .select(
          "id, full_name, pipeline_stage, budget_min, budget_max, budget_currency, preferred_project, preferred_location, property_type, updated_at",
        )
        .eq("assigned_broker_id", user!.id)
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as DealRow[];
    },
  });

  const { active, won, lost, totals } = useMemo(() => {
    const active: DealRow[] = [];
    const won: DealRow[] = [];
    const lost: DealRow[] = [];
    for (const r of rows) {
      const s = (r.pipeline_stage || "").toLowerCase();
      if (WON_STAGES.includes(s)) won.push(r);
      else if (LOST_STAGES.includes(s)) lost.push(r);
      else if (ACTIVE_STAGES.includes(s)) active.push(r);
    }
    const sum = (arr: DealRow[]) => arr.reduce((acc, r) => acc + dealValueOf(r), 0);
    const projected = sum(active);
    const earned = sum(won);
    return {
      active,
      won,
      lost,
      totals: {
        projected,
        earned,
        projectedCommission: projected * COMMISSION_RATE,
        earnedCommission: earned * COMMISSION_RATE,
        winRate:
          won.length + lost.length === 0
            ? 0
            : Math.round((won.length / (won.length + lost.length)) * 100),
      },
    };
  }, [rows]);

  const isCommissions = variant === "commissions";
  const title = "Deals & Commission";
  const description =
    "Your unified pipeline of every deal you've initiated and the projected commission per stage. Numbers populate the moment your first assigned lead reaches the qualified stage — JBJ owner finalises every payout.";

  return (
    <div className="space-y-8">
      <SEOHead title={`${title} | Broker Portal | JBJ`} noIndex />

      {/* Header */}
      <header className="space-y-2">
        <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
          <Handshake className="w-3 h-3 mr-1" /> Broker Portal
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight">{title}</h1>
        <p className="text-[#1A1A1A]/70 max-w-2xl">{description}</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Kpi
          icon={TrendingUp}
          label="Active pipeline"
          value={formatMoney(totals.projected)}
          sub={`${active.length} deal${active.length === 1 ? "" : "s"}`}
        />
        <Kpi
          icon={Wallet}
          label="Projected commission"
          value={formatMoney(totals.projectedCommission)}
          sub={`@ ${(COMMISSION_RATE * 100).toFixed(0)}% indicative`}
        />
        <Kpi
          icon={CheckCircle2}
          label="Earned (won)"
          value={formatMoney(totals.earnedCommission)}
          sub={`${won.length} closed deal${won.length === 1 ? "" : "s"}`}
        />
        <Kpi
          icon={Clock}
          label="Win rate"
          value={`${totals.winRate}%`}
          sub={`${won.length} won · ${lost.length} lost`}
        />
      </div>

      {/* Active deals */}
      <DealsTable
        heading={isCommissions ? "Pending — projected payouts" : "Active deals"}
        rows={active}
        loading={isLoading}
        emptyTitle={
          isCommissions ? "No projected payouts yet" : "No active deals yet"
        }
        emptyDescription={
          "Deals appear here automatically once a lead assigned to you moves into the qualified, viewing, offer, negotiation or deposit stage."
        }
      />

      {/* Won deals */}
      {won.length > 0 && (
        <DealsTable heading="Closed — won" rows={won} loading={false} muted />
      )}

      {/* Lost (only on deals view to keep commissions clean) */}
      {!isCommissions && lost.length > 0 && (
        <DealsTable heading="Closed — lost" rows={lost} loading={false} muted />
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 p-5" data-gold-hairline>
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/65">
        <IconTile icon={Icon} tone="emerald" size="sm" className="!h-9 !w-9 !rounded-xl" iconClassName="!h-4 !w-4" />
        {label}
      </div>
      <div className="mt-3 text-2xl md:text-3xl font-bold text-[#1A1A1A] tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-[#1A1A1A]/60">{sub}</div>}
    </div>
  );
}

function DealsTable({
  heading,
  rows,
  loading,
  muted,
  emptyTitle,
  emptyDescription,
}: {
  heading: string;
  rows: DealRow[];
  loading: boolean;
  muted?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[#1A1A1A]/70">{heading}</h2>
        <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 p-10 grid place-items-center" data-gold-hairline>
          <div className="w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full animate-spin" />
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    if (!emptyTitle) return null;
    return (
      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-[0.22em] text-[#1A1A1A]/70">{heading}</h2>
        <BrokerEmptyState
          icon={<Handshake className="h-4 w-4" />}
          title={emptyTitle}
          description={emptyDescription || ""}
        />
      </section>
    );
  }


  return (
    <section className="space-y-3">
      <h2
        className={
          "text-xs uppercase tracking-[0.22em] " +
          (muted ? "text-[#1A1A1A]/55" : "text-[#1A1A1A]/70")
        }
      >
        {heading}
      </h2>
      <div className="rounded-2xl overflow-hidden border border-[#B89555]/30 bg-[#F7F2EA]" data-gold-hairline>
        <table className="w-full text-sm">
          <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Client</th>
              <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Project / Area</th>
              <th className="text-left font-semibold px-4 py-3">Stage</th>
              <th className="text-right font-semibold px-4 py-3">Deal value</th>
              <th className="text-right font-semibold px-4 py-3">Projected commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const dv = dealValueOf(r);
              const currency = r.budget_currency || "AED";
              const stage = (r.pipeline_stage || "").toLowerCase();
              return (
                <tr key={r.id} className="border-t border-[#B89555]/20">
                  <td className="px-4 py-3 text-[#1A1A1A] font-medium">{r.full_name}</td>
                  <td className="px-4 py-3 text-[#1A1A1A]/75 hidden md:table-cell">
                    {r.preferred_project || r.preferred_location || (
                      <span className="text-[#1A1A1A]/40">—</span>
                    )}
                    {r.property_type && (
                      <div className="text-[11px] text-[#1A1A1A]/55">{r.property_type}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/45">
                      {STAGE_LABEL[stage] || stage || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A] tabular-nums">
                    {formatMoney(dv, currency)}
                  </td>
                  <td className="px-4 py-3 text-right text-[#1A1A1A] font-semibold tabular-nums">
                    {dv > 0 ? formatMoney(dv * COMMISSION_RATE, currency) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
