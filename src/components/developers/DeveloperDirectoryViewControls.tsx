import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

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

/** Public directory layout controls. Audit diagnostics remain owner-only. */
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
  const chip =
    "h-8 px-3 rounded-md text-[11px] font-semibold uppercase transition-colors";
  const active = "jj-pill-emerald-metallic allow-white border-0 text-primary-foreground";
  const idle = "border-border bg-background text-foreground hover:border-primary hover:bg-accent";

  return (
    <div
      data-directory-controls="true"
      className="mx-3 sm:mx-4 mb-6 rounded-md border border-border bg-card px-3 py-3 flex flex-wrap items-center gap-x-4 gap-y-3"
    >
      <span className="text-[10px] font-bold uppercase text-muted-foreground">
        View
      </span>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm"
          type="button"
          onClick={() => onViewChange("grid")}
          className={`${chip} inline-flex items-center gap-1.5 ${view === "grid" ? active : idle}`}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Grid
        </Button>
        <Button variant="outline" size="sm"
          type="button"
          onClick={() => onViewChange("list")}
          className={`${chip} inline-flex items-center gap-1.5 ${view === "list" ? active : idle}`}
        >
          <List className="w-3.5 h-3.5" /> List
        </Button>
      </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground">
            Per row
          </span>
          {COLUMN_OPTIONS.map((option) => (
            <Button variant="outline" size="sm"
              key={option}
              type="button"
              onClick={() => onColumnsChange(option)}
              className={`${chip} !px-2.5 ${columns === option ? active : idle}`}
            >
              {option}
            </Button>
          ))}
        </div>

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase text-muted-foreground">
          Per page
        </span>
        {PER_PAGE_OPTIONS.map((option) => (
          <Button variant="outline" size="sm"
            key={option}
            type="button"
            onClick={() => onPerPageChange(option)}
            className={`${chip} !px-2.5 ${perPage === option ? active : idle}`}
          >
            {option === 0 ? "All" : option}
          </Button>
        ))}
      </div>

      {showAuditData ? <Button variant="outline" size="sm"
        type="button"
        onClick={() => onAuditOnlyChange(!auditOnly)}
        className={`${chip} ${auditOnly ? active : idle}`}
      >
        Needs media only
      </Button> : null}

      {showAuditData ? <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px] font-semibold text-foreground">
        <span>{total} shown</span>
        <span className="text-muted-foreground">{missingLogo} missing logo</span>
        <span className="text-muted-foreground">{missingCover} missing photo</span>
      </div> : null}
    </div>
  );
};

export default DeveloperDirectoryViewControls;
