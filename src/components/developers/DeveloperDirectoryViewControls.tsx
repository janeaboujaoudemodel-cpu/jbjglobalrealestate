import { LayoutGrid, List } from "lucide-react";

export type DirectoryViewMode = "grid" | "list";

interface Props {
  view: DirectoryViewMode;
  onViewChange: (view: DirectoryViewMode) => void;
  columns: number;
  onColumnsChange: (columns: number) => void;
  perPage: number;
  onPerPageChange: (perPage: number) => void;
  total: number;
  missingLogo: number;
  missingCover: number;
  auditOnly: boolean;
  onAuditOnlyChange: (value: boolean) => void;
  showAuditData?: boolean;
}

const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6, 8];
const PER_PAGE_OPTIONS = [24, 48, 96, 0];

/**
 * PASS 278 — VIEW DENSITY RAIL (LOCKED GEOMETRY)
 * Mode buttons match the sidebar Collapse control (42px tall, rounded-lg,
 * gold hairline, emerald ombré). Count chips are TRUE circles (42×42,
 * aspect-square, rounded-full) — never vertically squeezed ovals.
 */
const DeveloperDirectoryViewControls = ({
  view,
  onViewChange,
  columns,
  onColumnsChange,
  perPage,
  onPerPageChange,
  total,
  missingLogo,
  missingCover,
  auditOnly,
  onAuditOnlyChange,
  showAuditData = false,
}: Props) => {
  const label =
    "text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap";

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
          data-on-dark
          data-allow-dark-cta
          data-active={view === "grid" ? "true" : "false"}
          className={view === "grid" ? "allow-white" : undefined}
          onClick={() => onViewChange("grid")}
        >
          <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={2.2} />
          <span>Grid</span>
        </button>
        <button
          type="button"
          data-view-mode-button="true"
          data-on-dark
          data-allow-dark-cta
          data-active={view === "list" ? "true" : "false"}
          className={view === "list" ? "allow-white" : undefined}
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
        <button
          type="button"
          data-view-mode-button="true"
          data-on-dark
          data-allow-dark-cta
          data-active={auditOnly ? "true" : "false"}
          className={auditOnly ? "allow-white" : undefined}
          onClick={() => onAuditOnlyChange(!auditOnly)}
        >
          <span>Needs media only</span>
        </button>
      ) : null}

      {showAuditData ? (
        <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] font-semibold text-foreground">
          <span>{total} shown</span>
          <span className="text-muted-foreground">{missingLogo} missing logo</span>
          <span className="text-muted-foreground">{missingCover} missing photo</span>
        </div>
      ) : null}
    </div>
  );
};

export default DeveloperDirectoryViewControls;
