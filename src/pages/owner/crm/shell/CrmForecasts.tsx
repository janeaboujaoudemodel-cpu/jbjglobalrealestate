import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Download,
  Filter,
  Info,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

/**
 * Phase 18 — Forecasts.
 * Zoho-parity quota tracking: period switcher, KPI ribbon,
 * quota-vs-achieved per rep, stage waterfall, and pipeline coverage.
 * Standalone (mock data). White ink on emerald, black ink on champagne.
 */

type Period = "Q1" | "Q2" | "Q3" | "Q4" | "FY";

type RepRow = {
  id: string;
  name: string;
  role: string;
  quota: number;      // AED
  committed: number;
  bestCase: number;
  closed: number;
  pipeline: number;
};

const CURRENCY = (n: number) =>
  new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", maximumFractionDigits: 0 }).format(n);

const PCT = (num: number, den: number) =>
  den > 0 ? Math.round((num / den) * 100) : 0;

const REPS: Record<Period, RepRow[]> = {
  Q1: [
    { id: "1", name: "Jane Bishop",   role: "Founder",     quota: 4_500_000, committed: 3_800_000, bestCase: 4_900_000, closed: 3_150_000, pipeline: 6_200_000 },
    { id: "2", name: "Aisha Mubarak", role: "Senior Advisor", quota: 3_200_000, committed: 2_400_000, bestCase: 3_100_000, closed: 1_950_000, pipeline: 4_100_000 },
    { id: "3", name: "Nada Karam",    role: "Sales Advisor",  quota: 2_400_000, committed: 1_600_000, bestCase: 2_200_000, closed: 1_180_000, pipeline: 3_450_000 },
    { id: "4", name: "Omar Farouk",   role: "Broker Liaison",  quota: 2_000_000, committed: 1_450_000, bestCase: 1_950_000, closed:   980_000, pipeline: 2_900_000 },
    { id: "5", name: "Lina Habib",    role: "Investor Desk",  quota: 3_600_000, committed: 3_050_000, bestCase: 3_900_000, closed: 2_650_000, pipeline: 5_800_000 },
  ],
  Q2: [
    { id: "1", name: "Jane Bishop",   role: "Founder",     quota: 4_800_000, committed: 2_100_000, bestCase: 3_400_000, closed:   980_000, pipeline: 5_900_000 },
    { id: "2", name: "Aisha Mubarak", role: "Senior Advisor", quota: 3_400_000, committed: 1_600_000, bestCase: 2_500_000, closed:   720_000, pipeline: 4_800_000 },
    { id: "3", name: "Nada Karam",    role: "Sales Advisor",  quota: 2_600_000, committed: 1_100_000, bestCase: 1_900_000, closed:   540_000, pipeline: 3_900_000 },
    { id: "4", name: "Omar Farouk",   role: "Broker Liaison",  quota: 2_200_000, committed:   950_000, bestCase: 1_600_000, closed:   410_000, pipeline: 3_100_000 },
    { id: "5", name: "Lina Habib",    role: "Investor Desk",  quota: 3_800_000, committed: 1_950_000, bestCase: 3_000_000, closed:   890_000, pipeline: 6_200_000 },
  ],
  Q3: [], Q4: [], FY: [],
};
REPS.Q3 = REPS.Q2.map((r) => ({ ...r, closed: 0, committed: Math.round(r.committed * 0.4), bestCase: Math.round(r.bestCase * 0.55) }));
REPS.Q4 = REPS.Q2.map((r) => ({ ...r, closed: 0, committed: Math.round(r.committed * 0.15), bestCase: Math.round(r.bestCase * 0.3) }));
REPS.FY = REPS.Q1.map((r, i) => {
  const q1 = REPS.Q1[i], q2 = REPS.Q2[i], q3 = REPS.Q3[i], q4 = REPS.Q4[i];
  return {
    ...r,
    quota: q1.quota + q2.quota + q3.quota + q4.quota,
    committed: q1.committed + q2.committed + q3.committed + q4.committed,
    bestCase: q1.bestCase + q2.bestCase + q3.bestCase + q4.bestCase,
    closed: q1.closed + q2.closed + q3.closed + q4.closed,
    pipeline: q1.pipeline + q2.pipeline + q3.pipeline + q4.pipeline,
  };
});

const STAGE_WATERFALL = [
  { label: "Qualification", value: 12_400_000 },
  { label: "Needs Analysis", value: 9_800_000 },
  { label: "Proposal", value: 7_200_000 },
  { label: "Negotiation", value: 5_600_000 },
  { label: "Commit", value: 4_100_000 },
  { label: "Closed Won", value: 2_950_000 },
];

const PERIODS: Period[] = ["Q1", "Q2", "Q3", "Q4", "FY"];

export default function CrmForecasts() {
  const [period, setPeriod] = useState<Period>("Q2");
  const rows = REPS[period];

  const totals = useMemo(() => {
    const acc = { quota: 0, committed: 0, bestCase: 0, closed: 0, pipeline: 0 };
    rows.forEach((r) => {
      acc.quota += r.quota;
      acc.committed += r.committed;
      acc.bestCase += r.bestCase;
      acc.closed += r.closed;
      acc.pipeline += r.pipeline;
    });
    return acc;
  }, [rows]);

  const maxStage = Math.max(...STAGE_WATERFALL.map((s) => s.value));

  return (
    <div className="jc-fc">
      {/* Header */}
      <header className="jc-fc__head">
        <div>
          <h2 className="jc-fc__title">Forecasts</h2>
          <p className="jc-fc__sub">
            Track quota attainment, commit vs best-case, and pipeline coverage across the sales team.
          </p>
        </div>
        <div className="jc-fc__head-actions">
          <div className="jc-fc__periods" role="tablist" aria-label="Forecast period">
            {PERIODS.map((p) => (
              <button
                key={p}
                role="tab"
                type="button"
                aria-selected={period === p}
                data-active={period === p || undefined}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <button type="button" className="jc-fc__chip"><Filter size={15} /> Filter</button>
          <button type="button" className="jc-fc__chip"><Download size={15} /> Export</button>
          <button type="button" className="jc-fc__chip jc-fc__chip--primary"><Plus size={15} /> New forecast</button>
        </div>
      </header>

      {/* KPI ribbon */}
      <section className="jc-fc__kpis" aria-label="Forecast summary">
        <KpiTile label="Quota" value={CURRENCY(totals.quota)} accent="champagne" icon={<Target size={17} />} />
        <KpiTile
          label="Closed"
          value={CURRENCY(totals.closed)}
          hint={`${PCT(totals.closed, totals.quota)}% of quota`}
          accent="emerald"
          icon={<TrendingUp size={17} />}
        />
        <KpiTile
          label="Commit"
          value={CURRENCY(totals.committed)}
          hint={`${PCT(totals.committed, totals.quota)}% of quota`}
          accent="emerald"
          icon={<Sparkles size={17} />}
        />
        <KpiTile
          label="Best case"
          value={CURRENCY(totals.bestCase)}
          hint={`${PCT(totals.bestCase, totals.quota)}% of quota`}
          accent="champagne"
          icon={<ArrowUpRight size={17} />}
        />
        <KpiTile
          label="Pipeline coverage"
          value={`${(totals.pipeline / Math.max(1, totals.quota - totals.closed)).toFixed(1)}×`}
          hint={CURRENCY(totals.pipeline)}
          accent="champagne"
          icon={<Users size={17} />}
        />
      </section>

      {/* Rep table */}
      <section className="jc-fc__panel" aria-label="Quota vs achievement by rep">
        <div className="jc-fc__panel-head">
          <h3>Attainment by rep — {period}</h3>
          <span className="jc-fc__hint"><Info size={13} /> Bar shows Closed / Commit / Best-case as a share of quota</span>
        </div>
        <div className="jc-fc__reptable" role="table">
          <div className="jc-fc__reprow jc-fc__reprow--head" role="row">
            <div>Owner</div>
            <div className="jc-fc__num">Quota</div>
            <div className="jc-fc__num">Closed</div>
            <div className="jc-fc__num">Commit</div>
            <div className="jc-fc__num">Best case</div>
            <div>Attainment</div>
            <div className="jc-fc__num">Pipeline</div>
          </div>
          {rows.map((r) => {
            const closedPct = Math.min(100, PCT(r.closed, r.quota));
            const commitPct = Math.min(100, PCT(r.committed, r.quota));
            const bestPct   = Math.min(100, PCT(r.bestCase, r.quota));
            const coverage = (r.pipeline / Math.max(1, r.quota - r.closed)).toFixed(1);
            const attained = PCT(r.closed, r.quota);
            return (
              <div className="jc-fc__reprow" role="row" key={r.id}>
                <div className="jc-fc__owner">
                  <span className="jc-fc__avatar" aria-hidden>{r.name.split(" ").map((s) => s[0]).slice(0,2).join("")}</span>
                  <div>
                    <div className="jc-fc__owner-name">{r.name}</div>
                    <div className="jc-fc__owner-role">{r.role}</div>
                  </div>
                </div>
                <div className="jc-fc__num">{CURRENCY(r.quota)}</div>
                <div className="jc-fc__num jc-fc__num--emerald">{CURRENCY(r.closed)}</div>
                <div className="jc-fc__num">{CURRENCY(r.committed)}</div>
                <div className="jc-fc__num">{CURRENCY(r.bestCase)}</div>
                <div>
                  <div className="jc-fc__bar" title={`${attained}% attained`}>
                    <span className="jc-fc__bar-best" style={{ width: `${bestPct}%` }} />
                    <span className="jc-fc__bar-commit" style={{ width: `${commitPct}%` }} />
                    <span className="jc-fc__bar-closed" style={{ width: `${closedPct}%` }} />
                  </div>
                  <div className="jc-fc__bar-meta">
                    <span>{attained}% attained</span>
                    <span>·</span>
                    <span>{coverage}× coverage</span>
                  </div>
                </div>
                <div className="jc-fc__num">{CURRENCY(r.pipeline)}</div>
              </div>
            );
          })}
          <div className="jc-fc__reprow jc-fc__reprow--total" role="row">
            <div>Team total</div>
            <div className="jc-fc__num">{CURRENCY(totals.quota)}</div>
            <div className="jc-fc__num jc-fc__num--emerald">{CURRENCY(totals.closed)}</div>
            <div className="jc-fc__num">{CURRENCY(totals.committed)}</div>
            <div className="jc-fc__num">{CURRENCY(totals.bestCase)}</div>
            <div className="jc-fc__num">{PCT(totals.closed, totals.quota)}%</div>
            <div className="jc-fc__num">{CURRENCY(totals.pipeline)}</div>
          </div>
        </div>
      </section>

      {/* Stage waterfall + coverage */}
      <section className="jc-fc__grid2">
        <div className="jc-fc__panel">
          <div className="jc-fc__panel-head">
            <h3>Pipeline stage waterfall</h3>
            <button type="button" className="jc-fc__link">Open pipeline <ChevronDown size={14} /></button>
          </div>
          <div className="jc-fc__waterfall">
            {STAGE_WATERFALL.map((s) => {
              const w = Math.max(6, Math.round((s.value / maxStage) * 100));
              return (
                <div key={s.label} className="jc-fc__wf-row">
                  <div className="jc-fc__wf-label">{s.label}</div>
                  <div className="jc-fc__wf-track">
                    <span className="jc-fc__wf-fill" style={{ width: `${w}%` }} />
                  </div>
                  <div className="jc-fc__wf-value">{CURRENCY(s.value)}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="jc-fc__panel">
          <div className="jc-fc__panel-head">
            <h3>Coverage health</h3>
          </div>
          <ul className="jc-fc__health">
            <li>
              <span className="jc-fc__dot jc-fc__dot--em" />
              <div>
                <strong>Healthy coverage</strong>
                <p>Pipeline &gt;= 3× remaining quota. Team is on track for the period.</p>
              </div>
              <span className="jc-fc__health-tag jc-fc__health-tag--em">{PCT(totals.pipeline, Math.max(1, totals.quota - totals.closed))}%</span>
            </li>
            <li>
              <span className="jc-fc__dot jc-fc__dot--amber" />
              <div>
                <strong>Watchlist</strong>
                <p>2 reps below 60% commit-to-quota. Zia recommends a coaching session this week.</p>
              </div>
              <span className="jc-fc__health-tag jc-fc__health-tag--amber">2 reps</span>
            </li>
            <li>
              <span className="jc-fc__dot jc-fc__dot--gold" />
              <div>
                <strong>Slipped deals</strong>
                <p>AED 1.2M forecast to close last period rolled forward. Review reasons in the record log.</p>
              </div>
              <span className="jc-fc__health-tag">3 deals</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function KpiTile({
  label, value, hint, accent, icon,
}: {
  label: string; value: string; hint?: string;
  accent: "emerald" | "champagne";
  icon: React.ReactNode;
}) {
  return (
    <div className="jc-fc__kpi" data-accent={accent}>
      <div className="jc-fc__kpi-icon">{icon}</div>
      <div className="jc-fc__kpi-label">{label}</div>
      <div className="jc-fc__kpi-value">{value}</div>
      {hint && <div className="jc-fc__kpi-hint">{hint}</div>}
    </div>
  );
}
