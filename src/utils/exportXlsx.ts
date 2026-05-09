/**
 * exportXlsx — premium branded Excel exporter for the CRM.
 *
 * Output:
 *   • Big branded title block (JBJ GLOBAL REAL ESTATE)
 *   • Subtitle: section + optional date range
 *   • Generated-on stamp
 *   • Wide auto-fit columns, frozen header row, autofilter, wrapped text
 *   • Champagne-themed header row with bold ink text
 */
import * as XLSX from "xlsx";

export interface PremiumXlsxOptions {
  title?: string;            // e.g. "JBJ GLOBAL REAL ESTATE"
  subtitle?: string;         // e.g. "CRM Leads · Investors"
  dateRange?: { from?: string | Date | null; to?: string | Date | null } | null;
  sheetName?: string;
  filename: string;          // without extension
  /** Optional explicit column ordering / labels. Falls back to row keys. */
  columns?: { key: string; label: string; width?: number }[];
}

const fmtDate = (d: any): string => {
  if (!d) return "";
  try {
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) return String(d);
    return date.toLocaleDateString();
  } catch {
    return String(d);
  }
};

const cellValue = (row: Record<string, any>, key: string): string => {
  const v = row?.[key];
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (v instanceof Date) return v.toLocaleString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
};

export function exportRowsToXlsx(
  rows: Record<string, any>[],
  filename: string,
  sheetName = "Sheet1",
) {
  // Backwards-compatible signature used by existing callers — routes through
  // the premium exporter so every CRM download gets the same upgraded layout.
  return exportPremiumXlsx(rows, {
    filename,
    sheetName,
    title: "JBJ GLOBAL REAL ESTATE",
    subtitle: sheetName,
  });
}

export function exportPremiumXlsx(
  rows: Record<string, any>[],
  opts: PremiumXlsxOptions,
) {
  const title = opts.title ?? "JBJ GLOBAL REAL ESTATE";
  const subtitle = opts.subtitle ?? "CRM Export";
  const sheetName = (opts.sheetName ?? "CRM").slice(0, 31);
  const stamp = new Date().toISOString().slice(0, 10);

  // Resolve columns
  const cols =
    opts.columns?.length
      ? opts.columns
      : rows.length
      ? Object.keys(rows[0]).map((k) => ({
          key: k,
          label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        }))
      : [{ key: "value", label: "Value" }];

  const dateRangeLine = opts.dateRange
    ? `Date range: ${fmtDate(opts.dateRange.from) || "—"} → ${
        fmtDate(opts.dateRange.to) || "—"
      }`
    : "";

  // Build sheet rows
  const aoa: any[][] = [];
  aoa.push([title]);                                // Row 1: brand
  aoa.push([subtitle]);                             // Row 2: section
  aoa.push([`Generated: ${new Date().toLocaleString()}`]); // Row 3: date stamp
  if (dateRangeLine) aoa.push([dateRangeLine]);     // Row 4: optional range
  aoa.push([`Total records: ${rows.length}`]);
  aoa.push([]);                                     // Spacer

  const headerRowIdx = aoa.length;                  // 0-based row of headers
  aoa.push(cols.map((c) => c.label));
  rows.forEach((r) => aoa.push(cols.map((c) => cellValue(r, c.key))));

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths — generous defaults so titles/values are readable without resizing.
  ws["!cols"] = cols.map((c) => ({ wch: Math.max(18, (c as any).width ?? 22) }));

  // Merge brand/title rows across all columns.
  const lastCol = Math.max(0, cols.length - 1);
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
    ...(dateRangeLine
      ? [{ s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } }]
      : []),
    { s: { r: dateRangeLine ? 4 : 3, c: 0 }, e: { r: dateRangeLine ? 4 : 3, c: lastCol } },
  ];

  // Style branded header rows + column header (xlsx ignores some styles
  // without the pro build, but Excel/Numbers honour widths, freeze, and filter).
  const setStyle = (addr: string, style: any) => {
    if (ws[addr]) ws[addr].s = style;
  };

  setStyle("A1", {
    font: { bold: true, sz: 18, color: { rgb: "1A1A1A" } },
    alignment: { horizontal: "left", vertical: "center" },
    fill: { fgColor: { rgb: "EFE6D6" } },
  });
  setStyle("A2", {
    font: { bold: true, sz: 13, color: { rgb: "1A1A1A" } },
    alignment: { horizontal: "left" },
    fill: { fgColor: { rgb: "F7F2EA" } },
  });
  setStyle("A3", { font: { sz: 10, color: { rgb: "555555" } } });
  if (dateRangeLine) setStyle("A4", { font: { sz: 10, color: { rgb: "555555" } } });

  // Style header row cells
  cols.forEach((_, i) => {
    const addr = XLSX.utils.encode_cell({ r: headerRowIdx, c: i });
    setStyle(addr, {
      font: { bold: true, sz: 12, color: { rgb: "1A1A1A" } },
      fill: { fgColor: { rgb: "EFE6D6" } },
      alignment: { horizontal: "left", vertical: "center", wrapText: true },
      border: {
        bottom: { style: "medium", color: { rgb: "B89555" } },
      },
    });
  });

  // Freeze panes below the header row so it stays visible while scrolling.
  ws["!freeze"] = { xSplit: 0, ySplit: headerRowIdx + 1 };
  (ws as any)["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: headerRowIdx, c: 0 },
      e: { r: aoa.length - 1, c: lastCol },
    }),
  };

  // Set row heights for the brand/title rows.
  ws["!rows"] = [
    { hpt: 28 }, { hpt: 20 }, { hpt: 16 },
    ...(dateRangeLine ? [{ hpt: 16 }] : []),
    { hpt: 16 }, { hpt: 8 },
    { hpt: 22 }, // header row
  ];

  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: subtitle,
    Author: "JBJ GLOBAL REAL ESTATE",
    CreatedDate: new Date(),
  };
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${opts.filename}-${stamp}.xlsx`);
}
