import { LayoutGrid, List } from "lucide-react";

export type DirectoryViewMode = "grid" | "list";
export type DirectoryAuditFilter = "all" | "missing_logo" | "missing_photo" | "missing_both";

interface Props {
  view: DirectoryViewMode;
  onViewChange: (view: DirectoryViewMode) => void;
  columns: number;
  onColumnsChange: (columns: number) => void;
  perPage: number;
  onPerPageChange: (perPage: number) => void;
  total: number;
  canonicalTotal: number;
  missingLogo: number;
  missingCover: number;
  missingBoth: number;
  auditFilter: DirectoryAuditFilter;
  onAuditFilterChange: (value: DirectoryAuditFilter) => void;
  showAuditData?: boolean;
}

const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6, 8];
const PER_PAGE_OPTIONS = [24, 48, 96, 0];

/**
 * PASS 278 — VIEW DENSITY RAIL (LOCKED GEOMETRY)
 * Mode buttons match the sidebar Collapse control (42px tall, rounded-lg,
 * gold hairline, emerald ombré). Count chips are TRUE circles (42×42,
 * aspect-square, rounded-full) — never vertically squeezed ovals.
 *
 * PASS 279 — OWNER MEDIA AUDIT BUCKETS (LOCKED)
 * The owner rail exposes four MUTUALLY PRECISE buckets, never one blurred
 * "needs media" mixture: Total, Missing logo only, Missing photo only,
 * Missing both. Each chip filters to exactly what its label says.
 */
const DeveloperDirectoryViewControls = ({
  view,
  onViewChange,
  columns,
  onColumnsChange,
  perPage,
  onPerPageChange,
  total,
  canonicalTotal,
  missingLogo,
  missingCover,
  missingBoth,
  auditFilter,
  onAuditFilterChange,
  showAuditData = false,
}: Props) => {
  const label =
    "text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap";

  const auditButtons: { key: DirectoryAuditFilter; text: string; count: number }[] = [
    { key: "all", text: "All developers", count: canonicalTotal },
    { key: "missing_logo", text: "Missing logo only", count: missingLogo },
    { key: "missing_photo", text: "Missing photo only", count: missingCover },
    { key: "missing_both", text: "Missing both", count: missingBoth },
  ];

  return (
    <div
      data-directory-controls="true"
      data-view-density-rail="true"
      className="mx-3 sm:mx-4 mb-6 rounded-lg border border-border bg-card px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-3"
    >
      <span className={label}>View</span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          data-view-mode-button="true"
          data-active={view === "grid" ? "true" : "false"}
          className={view === "grid" ? "allow-white" : undefined}
          data-on-dark={view === "grid" ? "" : undefined}
          onClick={() => onViewChange("grid")}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          <span>Grid</span>
        </button>
        <button
          type="button"
          data-view-mode-button="true"
          data-active={view === "list" ? "true" : "false"}
          className={view === "list" ? "allow-white" : undefined}
          data-on-dark={view === "list" ? "" : undefined}
          onClick={() => onViewChange("list")}
        >
          <List className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          <span>List</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={label}>Per row</span>
        {COLUMN_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            data-count-chip="true"
            data-numeric="true"
            data-active={columns === option ? "true" : "false"}
            onClick={() => onColumnsChange(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={label}>Per page</span>
        {PER_PAGE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            data-count-chip="true"
            data-numeric={option === 0 ? undefined : "true"}
            data-active={perPage === option ? "true" : "false"}
            onClick={() => onPerPageChange(option)}
          >
            {option === 0 ? "All" : option}
          </button>
        ))}
      </div>

      {showAuditData ? (
        <div className="w-full flex flex-col gap-2 border-t border-border pt-3">
          <span className={label}>Media audit</span>
          <div className="flex flex-wrap items-center gap-2">
            {auditButtons.map((item) => (
              <button
                key={item.key}
                type="button"
                data-view-mode-button="true"
                data-active={auditFilter === item.key ? "true" : "false"}
                className={auditFilter === item.key ? "allow-white" : undefined}
                data-on-dark={auditFilter === item.key ? "" : undefined}
                onClick={() => onAuditFilterChange(item.key)}
              >
                <span>
                  {item.text} · {item.count}
                </span>
              </button>
            ))}
            <span className="ml-auto text-[11px] font-semibold text-foreground">
              {total} shown
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DeveloperDirectoryViewControls;
