// Developer registry exports — premium colored XLSX / PDF / CSV.
// Same visual language as the brokerage exporter (champagne + gold + status fills).

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { statusColor, BRAND } from "./crmStatusPalette";

export type DeveloperExportFormat = "csv" | "xlsx" | "pdf";

export interface DeveloperExportRow {
  rank: number;
  developer_name: string;
  status: string;
  developer_email: string;
  phone: string;
  emirate: string;
  agency_code: string;
  registration_date: string;
  expiry_date: string;
  attended_briefing: string;
  briefing_date: string;
  notes: string;
}

interface ColDef {
  key: keyof DeveloperExportRow;
  label: string;
  width: number;
  numeric?: boolean;
  status?: boolean;
}

const COLUMNS: ColDef[] = [
  { key: "rank",              label: "Rank",              width: 6, numeric: true },
  { key: "developer_name",    label: "Developer",         width: 34 },
  { key: "status",            label: "Status",            width: 22, status: true },
  { key: "developer_email",   label: "Email",             width: 28 },
  { key: "phone",             label: "Phone",             width: 18 },
  { key: "emirate",           label: "Emirate",           width: 14 },
  { key: "agency_code",       label: "Agency code",       width: 16 },
  { key: "registration_date", label: "Registered",        width: 14 },
  { key: "expiry_date",       label: "Expiry",            width: 14 },
  { key: "attended_briefing", label: "Attended briefing", width: 16, status: true },
  { key: "briefing_date",     label: "Briefing date",     width: 14 },
  { key: "notes",             label: "Notes",             width: 40 },
];

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const baseName = () => `jbj-developer-registry-${new Date().toISOString().slice(0, 10)}`;

async function buildXlsx(rows: DeveloperExportRow[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "JBJ GLOBAL REAL ESTATE";
  const ws = wb.addWorksheet("Developers", { views: [{ state: "frozen", ySplit: 4, xSplit: 2 }] });

  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const t = ws.getCell(1, 1);
  t.value = "JBJ GLOBAL REAL ESTATE — Developer Registry";
  t.font = { name: "Inter", size: 16, bold: true, color: { argb: "FF" + BRAND.ink } };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.champagne } };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, COLUMNS.length);
  ws.getCell(2, 1).value = `Generated ${new Date().toLocaleString()} · ${rows.length} developers`;
  ws.getCell(2, 1).font = { name: "Inter", size: 10, italic: true, color: { argb: "FF555555" } };

  ws.mergeCells(3, 1, 3, COLUMNS.length);
  ws.getCell(3, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.gold } };
  ws.getRow(3).height = 3;

  const header = ws.getRow(4);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.label;
    cell.font = { name: "Inter", bold: true, size: 11, color: { argb: "FF" + BRAND.ink } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.champagne } };
    cell.alignment = { horizontal: c.numeric ? "right" : "left", vertical: "middle" };
    cell.border = { bottom: { style: "medium", color: { argb: "FF" + BRAND.gold } } };
  });
  header.height = 22;
  COLUMNS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });

  rows.forEach((r, idx) => {
    const row = ws.getRow(idx + 5);
    const banded = idx % 2 === 1;
    COLUMNS.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const v = r[c.key];
      cell.value = c.numeric && v !== "" && v != null ? Number(v) || 0 : (v ?? "");
      cell.font = { name: "Inter", size: 10, color: { argb: "FF" + BRAND.ink } };
      cell.alignment = { vertical: "middle", horizontal: c.numeric ? "right" : "left", wrapText: c.key === "notes" };
      if (banded) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.band } };
      cell.border = { bottom: { style: "hair", color: { argb: "FFE5DCC8" } } };
      if (c.numeric) cell.numFmt = "#,##0";
      if (c.status) {
        const sc = statusColor(String(v ?? ""));
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + sc.bg } };
        cell.font = { name: "Inter", size: 10, bold: true, color: { argb: "FF" + sc.fg } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      }
    });
  });

  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: COLUMNS.length } };
  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function exportDevelopers(rows: DeveloperExportRow[], format: DeveloperExportFormat) {
  const filename = baseName();

  if (format === "csv") {
    const head = COLUMNS.map((c) => `"${c.label}"`).join(",");
    const body = rows.map((r) =>
      COLUMNS.map((c) => `"${String(r[c.key] ?? "").replace(/"/g, '""')}"`).join(","),
    ).join("\n");
    triggerDownload(new Blob([`\ufeff${head}\n${body}`], { type: "text/csv;charset=utf-8;" }), `${filename}.csv`);
    return;
  }
  if (format === "xlsx") { triggerDownload(await buildXlsx(rows), `${filename}.xlsx`); return; }
  if (format === "pdf") {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
    doc.setFillColor("#" + BRAND.champagne);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 56, "F");
    doc.setTextColor("#" + BRAND.ink);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("JBJ GLOBAL REAL ESTATE — Developer Registry", 32, 32);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} developers`, 32, 48);
    doc.setDrawColor("#" + BRAND.gold); doc.setLineWidth(1.2);
    doc.line(0, 56, doc.internal.pageSize.getWidth(), 56);
    autoTable(doc, {
      startY: 68,
      head: [COLUMNS.map((c) => c.label)],
      body: rows.map((r) => COLUMNS.map((c) => String(r[c.key] ?? ""))),
      styles: { font: "helvetica", fontSize: 8, cellPadding: 3, textColor: "#" + BRAND.ink },
      headStyles: { fillColor: "#" + BRAND.champagne, textColor: "#" + BRAND.ink, fontStyle: "bold" },
      alternateRowStyles: { fillColor: "#" + BRAND.band },
      didParseCell: (data: any) => {
        if (data.section !== "body") return;
        const colDef = COLUMNS[data.column.index];
        if (colDef?.status) {
          const sc = statusColor(String(data.cell.raw ?? ""));
          data.cell.styles.fillColor = "#" + sc.bg;
          data.cell.styles.textColor = "#" + sc.fg;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.halign = "center";
        }
        if (colDef?.numeric) data.cell.styles.halign = "right";
      },
    });
    doc.save(`${filename}.pdf`);
  }
}
