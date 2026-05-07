// Excel-style grid for the Brokerage / Developer sections.
// Sticky header, sticky first column, inline status dropdown that paints the
// cell with the same palette used by the colored XLSX export.

import { useMemo, useState } from "react";
import { statusColor, STATUS_OPTIONS } from "@/utils/crmStatusPalette";

const PAGE_SIZE = 100;

export interface ExcelGridColumn<R> {
  key: keyof R | string;
  label: string;
  width?: number;
  align?: "left" | "right" | "center";
  status?: boolean;       // render colored status cell with dropdown
  editable?: boolean;     // text-edit on double-click (notes)
  render?: (row: R) => React.ReactNode;
  // Optional per-column overrides for multi-status grids
  statusOptions?: { value: string; label: string }[];
  onStatusChange?: (row: R, next: string) => void;
}

interface Props<R extends { id: string }> {
  rows: R[];
  columns: ExcelGridColumn<R>[];
  getStatus?: (row: R) => string | undefined;
  onStatusChange?: (row: R, next: string) => void;
  onCellEdit?: (row: R, key: string, value: string) => void;
  emptyLabel?: string;
}

export function ExcelGridView<R extends { id: string }>({
  rows,
  columns,
  getStatus,
  onStatusChange,
  onCellEdit,
  emptyLabel = "No rows match the current filters.",
}: Props<R>) {
  const [editing, setEditing] = useState<{ id: string; key: string } | null>(null);
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedRows = useMemo(
    () => rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [rows, safePage],
  );

  return (
    <div className="border border-[#B89555]/40 rounded-xl overflow-hidden bg-[#FDFBF7]">
      <div className="overflow-auto max-h-[640px]">

        <table className="w-full text-sm border-collapse" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead className="sticky top-0 z-20">
            <tr>
              {columns.map((c, i) => {
                const w = c.width ?? 140;
                return (
                  <th
                    key={String(c.key)}
                    className={`bg-[#EFE6D6] text-[#1A1A1A] font-semibold text-left px-3 py-2 border-b-2 border-[#B89555] whitespace-nowrap overflow-hidden text-ellipsis ${
                      i === 0 ? "sticky left-0 z-30 bg-[#EFE6D6]" : ""
                    }`}
                    style={{ width: w, minWidth: w, maxWidth: w, textAlign: c.align ?? "left" }}
                    title={c.label}
                  >
                    {c.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} className="text-center py-8 text-[#1A1A1A]/60">{emptyLabel}</td></tr>
            )}
            {pagedRows.map((row, idx) => {
              const banded = idx % 2 === 1;
              return (
                <tr key={row.id} className={banded ? "bg-[#FAF6EE]" : "bg-white"} style={{ height: 36 }}>
                  {columns.map((c, i) => {
                    const raw = (row as any)[c.key];
                    const isFirst = i === 0;
                    const baseCls = `px-3 py-1 border-b border-[#E5DCC8] align-middle whitespace-nowrap overflow-hidden text-ellipsis ${
                      isFirst ? `sticky left-0 z-10 ${banded ? "bg-[#FAF6EE]" : "bg-white"} font-medium` : ""
                    }`;
                    const cellWidth = c.width ?? 140;

                    if (c.status) {
                      const current = getStatus ? getStatus(row) : String(raw ?? "");
                      const sc = statusColor(current);
                      const opts = c.statusOptions ?? STATUS_OPTIONS;
                      return (
                        <td key={String(c.key)} className={baseCls} style={{ width: cellWidth, minWidth: cellWidth, maxWidth: cellWidth, textAlign: "center" }}>
                          <select
                            value={current || opts[0]?.value || ""}
                            onChange={(e) => (c.onStatusChange ? c.onStatusChange(row, e.target.value) : onStatusChange?.(row, e.target.value))}
                            className="w-full px-2 py-1 rounded font-semibold text-xs border-0 outline-none cursor-pointer truncate"
                            style={{ background: sc.cssBg, color: sc.cssFg }}
                          >
                            {opts.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    const isEditing = editing?.id === row.id && editing?.key === c.key;
                    const display = c.render ? c.render(row) : (raw ?? "");
                    const titleText = typeof display === "string" || typeof display === "number" ? String(display) : String(raw ?? "");
                    return (
                      <td
                        key={String(c.key)}
                        className={baseCls}
                        style={{ width: cellWidth, minWidth: cellWidth, maxWidth: cellWidth, textAlign: c.align ?? "left" }}
                        title={titleText}
                        onDoubleClick={() => c.editable && setEditing({ id: row.id, key: String(c.key) })}
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            defaultValue={String(raw ?? "")}
                            onBlur={(e) => { onCellEdit?.(row, String(c.key), e.target.value); setEditing(null); }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); }
                              if (e.key === "Escape") setEditing(null);
                            }}
                            className="w-full px-2 py-1 border border-[#B89555] rounded text-sm bg-white"
                          />
                        ) : (
                          <span className="text-[#1A1A1A] block truncate">{display as any}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-[#1A1A1A]/70 border-t border-[#B89555]/20 bg-[#F7F2EA]">
        <span>
          Showing {rows.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–
          {Math.min(rows.length, safePage * PAGE_SIZE + PAGE_SIZE)} of {rows.length.toLocaleString()} ·
          double-click a cell to edit · status colors export to Excel.
        </span>
        {totalPages > 1 && (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2 py-1 rounded border border-[#B89555]/40 bg-white disabled:opacity-40"
            >
              ← Prev
            </button>
            <span>Page {safePage + 1} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 rounded border border-[#B89555]/40 bg-white disabled:opacity-40"
            >
              Next →
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
