import { Building2, ChevronDown, MoreHorizontal, RefreshCw, ArrowUpDown, SlidersHorizontal } from "lucide-react";

/**
 * JBJ CRM Home Dashboard
 * Standard CRM dashboard layout: welcome row, KPI tiles, tasks + meetings tables,
 * today's leads + closing deals tables, pipeline funnel.
 * Standalone — no external CRM dependency.
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
          <h1>Welcome JBJ GLOBAL REAL ESTATE</h1>
        </div>
        <div className="jc-home__welcome-right">
          <button type="button" className="jc-icon-btn" aria-label="Refresh"><RefreshCw size={16} /></button>
          <button type="button" className="jc-org-picker">
            <span>JBJ GLOBAL REAL EST…</span>
            <ChevronDown size={16} />
          </button>
          <button type="button" className="jc-icon-btn" aria-label="More"><MoreHorizontal size={18} /></button>
        </div>
      </header>

      {/* KPI tiles */}
      <section className="jc-kpi-row" aria-label="Key metrics">
        <KpiTile label="My Open Deals" value="0" />
        <KpiTile label="My Untouched Deals" value="0" />
        <KpiTile label="My Calls Today" value="0" />
        <KpiTile label="My Leads" value="0" />
      </section>

      {/* Tasks + Meetings */}
      <section className="jc-widget-row">
        <ListWidget
          title="My Open Tasks"
          columns={["Subject", "Due Date", "Status"]}
          empty="No Tasks found."
        />
        <ListWidget
          title="My Meetings"
          columns={["Title", "From", "To"]}
          empty="No Meetings found."
        />
      </section>

      {/* Leads + Deals closing */}
      <section className="jc-widget-row">
        <ListWidget
          title="Today's Leads"
          columns={["Lead Name", "Company", "Email"]}
          empty="No Leads found."
        />
        <ListWidget
          title="My Deals Closing This Month"
          columns={["Deal Name", "Amount", "Stage"]}
          empty="No Deals found."
        />
      </section>

      {/* Pipeline funnel */}
      <section className="jc-widget-row">
        <div className="jc-widget jc-widget--tall">
          <div className="jc-widget__head">
            <h3>My Pipeline Deals By Stage</h3>
          </div>
          <div className="jc-funnel-empty">
            <svg width="120" height="90" viewBox="0 0 120 90" fill="none" aria-hidden="true">
              <path d="M8 12 L112 12 L92 42 L92 70 L28 70 L28 42 Z" stroke="#CBD2E1" strokeWidth="1.5" fill="none" />
              <line x1="28" y1="42" x2="92" y2="42" stroke="#CBD2E1" strokeWidth="1" />
            </svg>
            <p>No data available</p>
          </div>
        </div>
        <div className="jc-widget jc-widget--tall jc-widget--placeholder" aria-hidden="true" />
      </section>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <article className="jc-kpi">
      <header className="jc-kpi__head">{label}</header>
      <div className="jc-kpi__value">{value}</div>
      <footer className="jc-kpi__foot" aria-hidden="true" />
    </article>
  );
}

function ListWidget({ title, columns, empty }: { title: string; columns: string[]; empty: string }) {
  return (
    <div className="jc-widget">
      <div className="jc-widget__head">
        <h3>{title}</h3>
      </div>
      <div className="jc-widget__toolbar">
        <button type="button" className="jc-widget__sort">
          <ArrowUpDown size={13} /> Sort
        </button>
      </div>
      <div className="jc-widget__table" role="table">
        <div className="jc-widget__thead" role="row">
          {columns.map((c) => (
            <div key={c} className="jc-widget__th" role="columnheader">{c}</div>
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
