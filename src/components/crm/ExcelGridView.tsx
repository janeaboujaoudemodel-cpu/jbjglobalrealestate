// Excel-style grid for the Brokerage / Developer sections.
// Sticky header, sticky first column, inline status dropdown that paints the
// cell with the same palette used by the colored XLSX export.

import { useState } from "react";
import { statusColor, STATUS_OPTIONS } from "@/utils/crmStatusPalette";

export interface ExcelGridColumn<R> {
  key: keyof R | string;
  label: string;
  width?: number;
  align?: "left" | "right" | "center";
  status?: boolean;       // render colored status cell with dropdown
  editable?: boolean;     // text-edit on double-click (notes)
  render?: (row: R) => React.ReactNode;
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

  return (
    <div className="border border-[#B89555]/40 rounded-xl overflow-hidden bg-[#FDFBF7]">
      <div className="overflow-auto max-h-[640px]">
        <table className="w-full text-sm border-collapse" style={{ fontFamily: "Inter, sans-serif" }}>
          <thead className="sticky top-0 z-20">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={String(c.key)}
                  className={`bg-[#EFE6D6] text-[#1A1A1A] font-semibold text-left px-3 py-2 border-b-2 border-[#B89555] ${
                    i === 0 ? "sticky left-0 z-30 bg-[#EFE6D6]" : ""
                  }`}
                  style={{ minWidth: c.width ?? 140, textAlign: c.align ?? "left" }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={columns.length} className="text-center py-8 text-[#1A1A1A]/60">{emptyLabel}</td></tr>
            )}
            {rows.map((row, idx) => {
              const banded = idx % 2 === 1;
              return (
                <tr key={row.id} className={banded ? "bg-[#FAF6EE]" : "bg-white"}>
                  {columns.map((c, i) => {
                    const raw = (row as any)[c.key];
                    const isFirst = i === 0;
                    const baseCls = `px-3 py-1.5 border-b border-[#E5DCC8] align-middle ${
                      isFirst ? `sticky left-0 z-10 ${banded ? "bg-[#FAF6EE]" : "bg-white"} font-medium` : ""
                    }`;

                    if (c.status) {
                      const current = getStatus ? getStatus(row) : String(raw ?? "");
                      const sc = statusColor(current);
                      return (
                        <td key={String(c.key)} className={baseCls} style={{ textAlign: "center" }}>
                          <select
                            value={current || "not_started"}
                            onChange={(e) => onStatusChange?.(row, e.target.value)}
                            className="w-full px-2 py-1 rounded font-semibold text-xs border-0 outline-none cursor-pointer"
                            style={{ background: sc.cssBg, color: sc.cssFg }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                      );
                    }

                    const isEditing = editing?.id === row.id && editing?.key === c.key;
                    const display = c.render ? c.render(row) : (raw ?? "");
                    return (
                      <td
                        key={String(c.key)}
                        className={baseCls}
                        style={{ textAlign: c.align ?? "left" }}
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
                          <span className="text-[#1A1A1A]">{display as any}</span>
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
      <div className="px-3 py-2 text-[11px] text-[#1A1A1A]/60 border-t border-[#B89555]/20 bg-[#F7F2EA]">
        Tip: change a status to recolor the row · double-click a notes cell to edit · matching colors export to Excel.
      </div>
    </div>
  );
}
