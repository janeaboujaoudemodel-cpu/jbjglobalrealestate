import {
  Building2,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  ArrowUpDown,
  SlidersHorizontal,
  Plus,
} from "lucide-react";

/**
 * JBJ CRM — Home Dashboard (Phase 2)
 * Standalone. Mirrors Zoho CRM home rhythm: welcome bar, KPI row,
 * widget grid (Tasks / Meetings / Leads / Deals) and pipeline funnel.
 * All colors bound to JBJ tokens.
 */
export default function CrmHome() {
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
          <button type="button" className="jc-home__ghost" aria-label="Refresh">
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
        <KpiTile label="My Open Deals" value="0" sub="Active pipeline" />
        <KpiTile label="My Untouched Deals" value="0" sub="No activity in 7d" />
        <KpiTile label="My Calls Today" value="0" sub="Scheduled + logged" />
        <KpiTile label="My Leads" value="0" sub="Assigned to me" />
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
        <ListWidget
          title="Today's Leads"
          scope="All Leads"
          columns={["Lead Name", "Company", "Email"]}
          empty="No Leads found."
        />
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
