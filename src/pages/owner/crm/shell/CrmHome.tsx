import { Link } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
  Sparkles,
  Flame,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useOwnerCrmLeads, type OwnerCrmLead } from "@/hooks/useOwnerCrmLeads";
import { useCrmHomeKpis, formatKpi } from "@/hooks/useCrmHomeKpis";
import LeadCallButton from "@/components/crm/LeadCallButton";

/**
 * JBJ CRM — Home Dashboard
 * Mirrors Zoho CRM home structure pixel-for-pixel (welcome bar → KPI row →
 * two ListWidget rows → funnel + activity), painted with JBJ tokens only.
 */
export default function CrmHome() {
  const { rows: leads, loading: leadsLoading } = useOwnerCrmLeads(200);
  const { kpis, loading: kpisLoading, error: kpisError, refresh } = useCrmHomeKpis();

  const todaysLeads = leads.filter((l) => {
    const created = new Date(l.created_at).getTime();
    const dubaiOffsetMs = 4 * 60 * 60 * 1000;
    const dubaiNow = new Date(Date.now() + dubaiOffsetMs);
    dubaiNow.setUTCHours(0, 0, 0, 0);
    const startOfTodayDubai = dubaiNow.getTime() - dubaiOffsetMs;
    return created >= startOfTodayDubai;
  });

  return (
    <div className="jc-home" data-no-contrast-guard>
      {/* Welcome row */}
      <header className="jc-home__welcome">
        <div className="jc-home__welcome-left">
          <div className="jc-home__welcome-icon" aria-hidden="true">
            <Building2 size={22} />
          </div>
          <div className="jc-home__welcome-copy">
            <h1>Welcome JBJ GLOBAL REAL ESTATE</h1>
            <p>Here's what's happening across your workspace today.</p>
          </div>
        </div>
        <div className="jc-home__welcome-right">
          <button
            type="button"
            className="jc-home__ghost"
            aria-label="Refresh metrics"
            onClick={refresh}
          >
            <RefreshCw size={15} />
          </button>
          <button type="button" className="jc-org-picker">
            <span>JBJ GLOBAL REAL EST…</span>
            <ChevronDown size={16} />
          </button>
          <button type="button" className="jc-home__ghost" aria-label="More">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* Today's Focus — Zoho-style daily action strip (Phase 5) */}
      <TodaysFocus leads={leads} todaysLeads={todaysLeads} loading={leadsLoading} />



      {/* KPI tiles */}
      <section className="jc-kpi-row" aria-label="Key metrics">
        <KpiTile
          label="My Open Deals"
          value={kpis.openDeals}
          sub="Active pipeline"
          loading={kpisLoading}
          error={!!kpisError}
        />
        <KpiTile
          label="My Untouched Leads"
          value={kpis.untouchedLeads}
          sub="No activity in 7d"
          loading={kpisLoading}
          error={!!kpisError}
        />
        <KpiTile
          label="Today's Leads"
          value={kpis.todaysLeads}
          sub="Captured today (Asia/Dubai)"
          loading={kpisLoading}
          error={!!kpisError}
        />
        <KpiTile
          label="My Leads"
          value={kpis.myLeads}
          sub="Assigned to me"
          loading={kpisLoading}
          error={!!kpisError}
        />
      </section>

      {/* Tasks + Meetings */}
      <section className="jc-widget-row">
        <ListWidget
          title="My Open Tasks"
          scope="All Open Tasks"
          columns={["Subject", "Due Date", "Status"]}
          empty="No Tasks found."
        />
        <ListWidget
          title="My Meetings"
          scope="Today's Meetings"
          columns={["Title", "From", "To"]}
          empty="No Meetings found."
        />
      </section>

      {/* Leads + Deals closing */}
      <section className="jc-widget-row">
        <LeadsWidget rows={todaysLeads.length > 0 ? todaysLeads : leads.slice(0, 5)} loading={leadsLoading} />
        <ListWidget
          title="My Deals Closing This Month"
          scope="This Month"
          columns={["Deal Name", "Amount", "Stage"]}
          empty="No Deals found."
        />
      </section>

      {/* Pipeline funnel */}
      <section className="jc-widget-row">
        <div className="jc-widget jc-widget--tall">
          <div className="jc-widget__head">
            <h3>My Pipeline Deals By Stage</h3>
            <button type="button" className="jc-widget__scope">
              Pipeline <ChevronDown size={13} />
            </button>
          </div>
          <div className="jc-funnel-empty">
            <svg width="140" height="104" viewBox="0 0 120 90" fill="none" aria-hidden="true">
              <path d="M8 12 L112 12 L92 42 L92 70 L28 70 L28 42 Z" stroke="#CBD2E1" strokeWidth="1.5" fill="none" />
              <line x1="28" y1="42" x2="92" y2="42" stroke="#CBD2E1" strokeWidth="1" />
            </svg>
            <p>No data available</p>
          </div>
        </div>
        <div className="jc-widget jc-widget--tall">
          <div className="jc-widget__head">
            <h3>Recent Activities</h3>
            <button type="button" className="jc-widget__scope">
              Last 7 days <ChevronDown size={13} />
            </button>
          </div>
          <div className="jc-widget__empty jc-widget__empty--lg">Nothing to show here yet.</div>
        </div>
      </section>
    </div>
  );
}

function TodaysFocus({
  leads,
  todaysLeads,
  loading,
}: {
  leads: OwnerCrmLead[];
  todaysLeads: OwnerCrmLead[];
  loading: boolean;
}) {
  const unassigned = leads.filter((l) => !l.owner_user_id);
  const unassignedToday = todaysLeads.filter((l) => !l.owner_user_id);
  const dayMs = 24 * 60 * 60 * 1000;
  const stale = unassigned.filter(
    (l) => Date.now() - new Date(l.created_at).getTime() > dayMs,
  );
  const hotList = unassignedToday.slice(0, 5);

  return (
    <section
      aria-label="Today's focus"
      data-surface="emerald"
      data-on-dark
      data-no-contrast-guard
      className="jc-todays-focus"
      style={{
        margin: "0 0 20px",
        borderRadius: 14,
        overflow: "hidden",
        background:
          "linear-gradient(180deg,#064E3B 0%,#042c1c 60%,#000 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ padding: "18px 20px 14px" }} data-surface="emerald" data-on-dark>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: "rgba(212,175,55,0.15)",
                border: "1px solid rgba(212,175,55,0.4)",
                display: "grid", placeItems: "center",
                color: "#D4AF37",
              }}
              aria-hidden="true"
            >
              <Sparkles size={17} />
            </div>
            <div>
              <h2 style={{ color: "#fff", fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
                Today's Focus
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12.5, margin: "2px 0 0" }}>
                Unassigned leads and AI-suggested next actions.
              </p>
            </div>
          </div>
          <Link
            to="/owner/data-hub"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 8,
              background: "#D4AF37", color: "#0a0a0a",
              fontSize: 13, fontWeight: 600, textDecoration: "none",
            }}
          >
            Distribute now <ArrowRight size={14} />
          </Link>
        </div>

        <div
          style={{
            marginTop: 14,
            display: "grid",
            gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          }}
          data-surface="emerald"
          data-on-dark
        >
          <FocusTile
            icon={<Flame size={14} />}
            label="Unassigned pool"
            value={loading ? "…" : unassigned.length}
            hint="Awaiting broker assignment"
            to="/owner/data-hub"
          />
          <FocusTile
            icon={<Sparkles size={14} />}
            label="New today"
            value={loading ? "…" : unassignedToday.length}
            hint="Captured in the last 24h"
            to="/owner/data-hub"
          />
          <FocusTile
            icon={<Clock size={14} />}
            label="Stale > 24h"
            value={loading ? "…" : stale.length}
            hint="Unassigned longer than a day"
            to="/owner/data-hub"
          />
        </div>

        {hotList.length > 0 && (
          <div style={{ marginTop: 14 }} data-surface="emerald" data-on-dark>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Suggested next actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {hotList.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "9px 12px", borderRadius: 8,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  data-surface="emerald"
                  data-on-dark
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.full_name || "Unnamed lead"}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11.5 }}>
                      {l.source || "Direct"} · {l.company_name || l.email || "—"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <LeadCallButton
                      lead={{ id: l.id, full_name: l.full_name, phone: l.phone, email: l.email }}
                      className="h-7 !text-white !border-[rgba(212,175,55,0.4)] !bg-transparent hover:!bg-white/10"
                    />
                    <Link
                      to="/owner/data-hub"
                      style={{
                        color: "#D4AF37", fontSize: 12, fontWeight: 600,
                        textDecoration: "none", padding: "4px 10px",
                        borderRadius: 6, border: "1px solid rgba(212,175,55,0.35)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Assign
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FocusTile({
  icon,
  label,
  value,
  hint,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      data-surface="emerald"
      data-on-dark
      style={{
        display: "block",
        padding: "12px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.7)", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        <span style={{ color: "#D4AF37" }}>{icon}</span>
        {label}
      </div>
      <div style={{ color: "#fff", fontSize: 26, fontWeight: 600, marginTop: 4, letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11.5, marginTop: 2 }}>{hint}</div>
    </Link>
  );
}

function KpiTile({
  label,
  value,
  sub,
  loading,
  error,
}: {
  label: string;
  value: number;
  sub: string;
  loading?: boolean;
  error?: boolean;
}) {
  const isEmpty = !loading && !error && value === 0;
  return (
    <article
      className="jc-kpi"
      data-state={loading ? "loading" : error ? "error" : isEmpty ? "empty" : "ready"}
    >
      <header className="jc-kpi__head">{label}</header>
      <div className="jc-kpi__value">
        {loading ? (
          <span className="jc-kpi__skeleton" aria-hidden="true" />
        ) : error ? (
          <span className="jc-kpi__error" title="Failed to load">—</span>
        ) : (
          formatKpi(value)
        )}
        <span className="sr-only">
          {loading ? "Loading" : error ? "Error loading metric" : `${value} records`}
        </span>
      </div>
      <div className="jc-kpi__sub">
        {loading ? "Loading…" : error ? "Unable to load" : isEmpty ? "No records yet" : sub}
      </div>
      <footer className="jc-kpi__foot" aria-hidden="true" />
    </article>
  );
}

function LeadsWidget({ rows, loading }: { rows: OwnerCrmLead[]; loading: boolean }) {
  const columns = ["Lead Name", "Company", "Email"];
  return (
    <div className="jc-widget">
      <div className="jc-widget__head">
        <h3>Today's Leads</h3>
        <div className="jc-widget__head-actions">
          <button type="button" className="jc-widget__scope">
            All Leads <ChevronDown size={13} />
          </button>
          <Link to="/owner/crm/jbj/leads/new" className="jc-widget__icon" aria-label="Add lead">
            <Plus size={14} />
          </Link>
        </div>
      </div>
      <div className="jc-widget__toolbar">
        <button type="button" className="jc-widget__sort">
          <ArrowUpDown size={13} /> Sort
        </button>
        <Link className="jc-widget__viewall" to="/owner/crm/jbj/leads">
          View All
        </Link>
      </div>
      <div className="jc-widget__table" role="table">
        <div className="jc-widget__thead" role="row">
          {columns.map((c) => (
            <div key={c} className="jc-widget__th" role="columnheader">
              {c}
            </div>
          ))}
          <div className="jc-widget__th jc-widget__th--tools" role="columnheader">
            <SlidersHorizontal size={13} />
          </div>
        </div>
        {loading ? (
          <div className="jc-widget__empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="jc-widget__empty">No Leads found.</div>
        ) : (
          <div className="jc-widget__tbody">
            {rows.slice(0, 5).map((l) => (
              <Link
                key={l.id}
                to={`/owner/crm/jbj/leads/${l.id}`}
                className="jc-widget__tr"
                role="row"
              >
                <div className="jc-widget__td jc-widget__td--link">{l.full_name || "—"}</div>
                <div className="jc-widget__td">{l.company_name || "—"}</div>
                <div className="jc-widget__td">{l.email || "—"}</div>
                <div className="jc-widget__td jc-widget__td--tools" />
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="jc-widget__foot">
        <span className="jc-widget__foot-label">Total Records</span>
        <span className="jc-widget__foot-value">{loading ? "…" : rows.length}</span>
      </div>
    </div>
  );
}

function ListWidget({
  title,
  scope,
  columns,
  empty,
}: {
  title: string;
  scope: string;
  columns: string[];
  empty: string;
}) {
  return (
    <div className="jc-widget">
      <div className="jc-widget__head">
        <h3>{title}</h3>
        <div className="jc-widget__head-actions">
          <button type="button" className="jc-widget__scope">
            {scope} <ChevronDown size={13} />
          </button>
          <button type="button" className="jc-widget__icon" aria-label="Add">
            <Plus size={14} />
          </button>
        </div>
      </div>
      <div className="jc-widget__toolbar">
        <button type="button" className="jc-widget__sort">
          <ArrowUpDown size={13} /> Sort
        </button>
        <a className="jc-widget__viewall" href="#">
          View All
        </a>
      </div>
      <div className="jc-widget__table" role="table">
        <div className="jc-widget__thead" role="row">
          {columns.map((c) => (
            <div key={c} className="jc-widget__th" role="columnheader">
              {c}
            </div>
          ))}
          <div className="jc-widget__th jc-widget__th--tools" role="columnheader">
            <SlidersHorizontal size={13} />
          </div>
        </div>
        <div className="jc-widget__empty">{empty}</div>
      </div>
      <div className="jc-widget__foot">
        <span className="jc-widget__foot-label">Total Records</span>
        <span className="jc-widget__foot-value">0</span>
      </div>
    </div>
  );
}
