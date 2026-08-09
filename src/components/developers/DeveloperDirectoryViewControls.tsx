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
}

const COLUMN_OPTIONS = [2, 3, 4, 5, 6];
const PER_PAGE_OPTIONS = [24, 48, 96, 0];

/**
 * Owner-only directory inspection rail. Lets the owner switch between the
 * public card grid and a dense audit list, choose how many cards render per
 * row, and isolate the records that still need a logo or a cover photo.
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
}: Props) => {
  const chip =
    "h-8 px-3 rounded-lg text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors";
  const active = "text-white border-0";
  const activeStyle = {
    background: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000000 100%)",
  } as const;
  const idle = "text-[#0A0A0A] bg-white border border-[#B89555]/40 hover:border-[#B89555]";

  return (
    <div
      data-owner-directory-controls="true"
      className="mx-3 sm:mx-4 mb-6 rounded-xl border border-[#B89555]/40 bg-white px-3 py-3 flex flex-wrap items-center gap-x-4 gap-y-3"
    >
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6D2F]">
        Owner view
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onViewChange("grid")}
          className={`${chip} inline-flex items-center gap-1.5 ${view === "grid" ? active : idle}`}
          style={view === "grid" ? activeStyle : undefined}
        >
          <LayoutGrid className="w-3.5 h-3.5" /> Grid
        </button>
        <button
          type="button"
          onClick={() => onViewChange("list")}
          className={`${chip} inline-flex items-center gap-1.5 ${view === "list" ? active : idle}`}
          style={view === "list" ? activeStyle : undefined}
        >
          <List className="w-3.5 h-3.5" /> List
        </button>
      </div>

      {view === "grid" ? (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A0A0A]/60">
            Per row
          </span>
          {COLUMN_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onColumnsChange(option)}
              className={`${chip} !px-2.5 ${columns === option ? active : idle}`}
              style={columns === option ? activeStyle : undefined}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0A0A0A]/60">
          Per page
        </span>
        {PER_PAGE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onPerPageChange(option)}
            className={`${chip} !px-2.5 ${perPage === option ? active : idle}`}
            style={perPage === option ? activeStyle : undefined}
          >
            {option === 0 ? "All" : option}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAuditOnlyChange(!auditOnly)}
        className={`${chip} ${auditOnly ? active : idle}`}
        style={auditOnly ? activeStyle : undefined}
      >
        Needs media only
      </button>

      <div className="ml-auto flex items-center gap-3 text-[11px] font-semibold text-[#0A0A0A]">
        <span>{total} shown</span>
        <span className="text-[#8A6D2F]">{missingLogo} missing logo</span>
        <span className="text-[#8A6D2F]">{missingCover} missing photo</span>
      </div>
    </div>
  );
};

export default DeveloperDirectoryViewControls;
