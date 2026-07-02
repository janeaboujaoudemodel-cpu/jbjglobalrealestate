import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { CRM_DEFAULT_SECTION, CRM_MODULE_MAP } from "./modules";

/**
 * JBJ CRM — Standard Module List View (Phase 3)
 * Mirrors Zoho's list-view chrome: view picker, records counter, primary
 * "Create" CTA, actions menu, filter rail, sortable header, empty state.
 * Data-agnostic: renders empty state until per-module data sources land.
 */

type ColumnDef = { key: string; label: string; width?: string };

const DEFAULT_COLUMNS: ColumnDef[] = [
  { key: "name", label: "Name" },
  { key: "owner", label: "Record Owner" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "created", label: "Created Time" },
];

const MODULE_COLUMNS: Record<string, ColumnDef[]> = {
  leads: [
    { key: "name", label: "Lead Name" },
    { key: "company", label: "Company" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "source", label: "Lead Source" },
    { key: "owner", label: "Lead Owner" },
  ],
  contacts: [
    { key: "name", label: "Contact Name" },
    { key: "account", label: "Account Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "owner", label: "Contact Owner" },
  ],
  accounts: [
    { key: "name", label: "Account Name" },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website" },
    { key: "type", label: "Account Type" },
    { key: "owner", label: "Account Owner" },
  ],
  deals: [
    { key: "name", label: "Deal Name" },
    { key: "amount", label: "Amount" },
    { key: "stage", label: "Stage" },
    { key: "close", label: "Closing Date" },
    { key: "owner", label: "Deal Owner" },
  ],
  tasks: [
    { key: "subject", label: "Subject" },
    { key: "due", label: "Due Date" },
    { key: "status", label: "Status" },
    { key: "priority", label: "Priority" },
    { key: "owner", label: "Task Owner" },
  ],
  meetings: [
    { key: "title", label: "Title" },
    { key: "from", label: "From" },
    { key: "to", label: "To" },
    { key: "location", label: "Location" },
    { key: "owner", label: "Host" },
  ],
  calls: [
    { key: "subject", label: "Subject" },
    { key: "type", label: "Call Type" },
    { key: "start", label: "Call Start Time" },
    { key: "duration", label: "Duration" },
    { key: "owner", label: "Call Owner" },
  ],
  products: [
    { key: "name", label: "Product Name" },
    { key: "code", label: "Product Code" },
    { key: "category", label: "Category" },
    { key: "price", label: "Unit Price" },
    { key: "active", label: "Active" },
  ],
  quotes: [
    { key: "subject", label: "Quote Subject" },
    { key: "account", label: "Account Name" },
    { key: "stage", label: "Quote Stage" },
    { key: "total", label: "Grand Total" },
    { key: "owner", label: "Quote Owner" },
  ],
  invoices: [
    { key: "subject", label: "Invoice Subject" },
    { key: "account", label: "Account Name" },
    { key: "status", label: "Status" },
    { key: "total", label: "Grand Total" },
    { key: "due", label: "Due Date" },
  ],
};

const columnsFor = (slug: string): ColumnDef[] => MODULE_COLUMNS[slug] ?? DEFAULT_COLUMNS;

function ModuleListView({ slug, label, section }: { slug: string; label: string; section: string }) {
  const columns = useMemo(() => columnsFor(slug), [slug]);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const plural = /s$/.test(label) ? label : `${label}s`;
  const navigate = useNavigate();
  const goCreate = () => navigate(`/owner/crm/jbj/${section}/new`);

  return (
    <div className="jc-list" data-no-contrast-guard>
      <div className="jc-list__toolbar">
        <button type="button" className="jc-view-picker">
          <span>All {plural}</span>
          <ChevronDown size={15} />
        </button>
        <span className="jc-list__count">0 Records</span>
        <div className="jc-list__spacer" />
        <button type="button" className="jc-list__icon" aria-label="Search"><Search size={16} /></button>
        <button type="button" className="jc-list__icon" aria-label="Refresh"><RefreshCw size={16} /></button>
        <button type="button" className="jc-list__actions">
          Actions <ChevronDown size={13} />
        </button>
        <button type="button" className="jc-list__cta" onClick={goCreate}>
          <Plus size={15} /> Create {label}
        </button>
        <button type="button" className="jc-list__icon" aria-label="More"><MoreHorizontal size={18} /></button>
      </div>

      <div className="jc-list__body" data-filters={filtersOpen ? "open" : "closed"}>
        <aside className="jc-list__filters" aria-label="Filters">
          <header className="jc-list__filters-head">
            <button
              type="button"
              className="jc-list__filters-toggle"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              <Filter size={14} /> Filter {plural} by
              <ChevronRight size={14} className="jc-list__filters-caret" data-open={filtersOpen} />
            </button>
          </header>
          <div className="jc-list__filters-group">
            <div className="jc-list__filters-title">System Defined Filters</div>
            <ul>
              <li>Touched Records</li>
              <li>Untouched Records</li>
              <li>Record Action</li>
              <li>Related Records Action</li>
            </ul>
          </div>
          <div className="jc-list__filters-group">
            <div className="jc-list__filters-title">Filter By Fields</div>
            <ul>
              <li>Owner</li>
              <li>Created Time</li>
              <li>Modified Time</li>
              <li>Tag</li>
            </ul>
          </div>
        </aside>

        <section className="jc-list__table" role="table" aria-label={`${plural} table`}>
          <div className="jc-list__thead" role="row">
            <div className="jc-list__th jc-list__th--check" role="columnheader">
              <input type="checkbox" aria-label={`Select all ${plural}`} />
            </div>
            {columns.map((c) => (
              <div key={c.key} className="jc-list__th" role="columnheader">
                {c.label}
              </div>
            ))}
            <div className="jc-list__th jc-list__th--tools" role="columnheader">
              <SlidersHorizontal size={14} />
            </div>
          </div>

          <div className="jc-list__empty" role="row">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
              <rect x="10" y="16" width="52" height="40" rx="4" stroke="#CBD2E1" strokeWidth="1.6" />
              <path d="M18 28h36M18 36h36M18 44h24" stroke="#CBD2E1" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <h3>No {plural} found</h3>
            <p>Create your first {label.toLowerCase()} to get started.</p>
            <button type="button" className="jc-list__cta" onClick={goCreate}>
              <Plus size={15} /> Create {label}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProjectIllustration({ variant }: { variant: "connect" | "track" | "deliver" }) {
  if (variant === "connect") {
    return (
      <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <rect x="31" y="12" width="126" height="70" rx="18" />
          <path d="M53 54c28 16 35-17 54-7 15 8 28-11 50-17" />
          <circle cx="203" cy="78" r="33" />
          <rect x="256" y="13" width="103" height="72" rx="16" />
          <path d="M280 35h42m-42 17h42m-42 17h32" />
          <path d="M313 30v-9h28v13" />
          <circle cx="331" cy="57" r="8" />
          <path d="M316 80c5-18 29-18 34 0" />
        </g>
      </svg>
    );
  }
  if (variant === "track") {
    return (
      <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <circle cx="80" cy="54" r="31" />
          <path d="M60 91h40c12 0 20 9 20 21v48H40v-48c0-12 8-21 20-21z" />
          <rect x="243" y="14" width="80" height="55" rx="11" />
          <rect x="259" y="82" width="55" height="56" rx="9" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 360 170" aria-hidden="true" className="jc-project-illo">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
        <circle cx="180" cy="65" r="54" />
        <path d="M148 58l30 28 51-50" stroke="var(--jbjcrm-emerald-line)" strokeWidth="5" />
      </g>
    </svg>
  );
}

function ProjectsIntro() {
  return (
    <section className="jc-projects-screen" aria-label="Projects introduction">
      <div className="jc-projects-copy">
        <h2>Unified Sales and Project Management</h2>
        <p>A smarter way to bridge the gap between sales and<br />project tracking. <button type="button">Learn More</button></p>
      </div>
      <div className="jc-projects-grid">
        <article className="jc-project-step"><ProjectIllustration variant="connect" /><h3>Connect</h3><p>Integrate JBJ Projects to create and associate<br />projects in JBJ CRM.</p></article>
        <article className="jc-project-step"><ProjectIllustration variant="track" /><h3>Track</h3><p>Stay on top of your tasks and milestones.</p></article>
        <article className="jc-project-step"><ProjectIllustration variant="deliver" /><h3>Deliver</h3><p>Execute customer projects on time, every time.</p></article>
      </div>
      <div className="jc-projects-cta">
        <button type="button" className="jc-get-started">Get Started</button>
        <button type="button" className="jc-hide-tab">Don't show this tab again.</button>
      </div>
    </section>
  );
}

export default function CrmModulePage() {
  const { section = CRM_DEFAULT_SECTION } = useParams();
  const mod = CRM_MODULE_MAP[section];
  const slug = mod?.slug ?? section;

  if (slug === "projects") return <ProjectsIntro />;

  return <ModuleListView slug={slug} label={mod?.label ?? section} />;
}
