import { Link } from "react-router-dom";
import {
  Building2,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import { useOwnerCrmLeads, type OwnerCrmLead } from "@/hooks/useOwnerCrmLeads";
import { useCrmHomeKpis, formatKpi } from "@/hooks/useCrmHomeKpis";

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
        <LeadsWidget rows={todaysLeads.length > 0 ? todaysLeads : leads.slice(0, 5)} loading={loading} />
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

function KpiTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <article className="jc-kpi">
      <header className="jc-kpi__head">{label}</header>
      <div className="jc-kpi__value">{value}</div>
      <div className="jc-kpi__sub">{sub}</div>
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
