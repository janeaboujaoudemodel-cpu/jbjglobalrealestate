// Brokerage CRM exports — premium colored XLSX (ExcelJS), PDF (jsPDF), CSV.
// Status cells are filled with the same palette used in the in-app Excel View
// so leadership reports look identical to what owners see on screen.

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { statusColor, BRAND } from "./crmStatusPalette";

export type BrokerageExportFormat = "csv" | "xlsx" | "pdf";

export interface BrokerageExportRow {
  rank: number;
  company_name: string;
  emirate: string;
  office_location: string;
  website: string;
  instagram: string;
  phone: string;
  whatsapp: string;
  email: string;
  primary_contact_name: string;
  agency_status: string;
  outreach_status: string;
  last_message_at: string;
  next_followup_at: string;
  attempt_count: number | string;
  deal_count: number | string;
  estimated_agents: number | string;
  active_brokers: number | string;
  inquiries: number | string;
  rating: number | string;
  notes: string;
}

interface ColDef {
  key: keyof BrokerageExportRow;
  label: string;
  width: number;
  numeric?: boolean;
  status?: boolean;
}

const COLUMNS: ColDef[] = [
  { key: "rank",             label: "Rank",            width: 6,  numeric: true },
  { key: "company_name",     label: "Agency",          width: 34 },
  { key: "emirate",          label: "Emirate",         width: 14 },
  { key: "office_location",  label: "Office",          width: 28 },
  { key: "phone",            label: "Phone",           width: 18 },
  { key: "whatsapp",         label: "WhatsApp",        width: 16 },
  { key: "email",            label: "Email",           width: 28 },
  { key: "website",          label: "Website",         width: 26 },
  { key: "instagram",        label: "Instagram",       width: 22 },
  { key: "crm_status",       label: "Status",          width: 20, status: true },
  { key: "outreach_stage",   label: "Outreach stage",  width: 18 },
  { key: "last_message_at",  label: "Last message",    width: 14 },
  { key: "next_followup_at", label: "Next follow-up",  width: 14 },
  { key: "attempt_count",    label: "Attempts",        width: 9,  numeric: true },
  { key: "deal_count",       label: "Deals",           width: 9,  numeric: true },
  { key: "estimated_agents", label: "Agents",          width: 9,  numeric: true },
  { key: "rating",           label: "Rating",          width: 9,  numeric: true },
  { key: "notes",            label: "Notes",           width: 38 },
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

const baseName = () =>
  `jbj-uae-real-estate-agencies-${new Date().toISOString().slice(0, 10)}`;

async function buildXlsx(rows: BrokerageExportRow[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "JBJ GLOBAL REAL ESTATE";
  wb.created = new Date();
  const ws = wb.addWorksheet("Agencies", {
    views: [{ state: "frozen", ySplit: 4, xSplit: 2 }],
  });

  // Title block (rows 1-3)
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "JBJ GLOBAL REAL ESTATE — UAE Brokerage Tracker";
  titleCell.font = { name: "Inter", size: 16, bold: true, color: { argb: "FF" + BRAND.ink } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.champagne } };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, COLUMNS.length);
  const subCell = ws.getCell(2, 1);
  subCell.value = `Generated ${new Date().toLocaleString()} · ${rows.length} agencies`;
  subCell.font = { name: "Inter", size: 10, italic: true, color: { argb: "FF555555" } };
  subCell.alignment = { horizontal: "left" };

  // Gold hairline row
  ws.mergeCells(3, 1, 3, COLUMNS.length);
  const goldCell = ws.getCell(3, 1);
  goldCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.gold } };
  ws.getRow(3).height = 3;

  // Header row 4
  const headerRow = ws.getRow(4);
  COLUMNS.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.label;
    cell.font = { name: "Inter", bold: true, color: { argb: "FF" + BRAND.ink }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.champagne } };
    cell.alignment = { vertical: "middle", horizontal: c.numeric ? "right" : "left", wrapText: false };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF" + BRAND.gold } },
      top:    { style: "thin",   color: { argb: "FFE5DCC8" } },
    };
  });
  headerRow.height = 22;

  COLUMNS.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });

  // Data rows
  rows.forEach((r, idx) => {
    const rowIndex = idx + 5;
    const excelRow = ws.getRow(rowIndex);
    const banded = idx % 2 === 1;
    COLUMNS.forEach((c, i) => {
      const cell = excelRow.getCell(i + 1);
      const v = r[c.key];
      cell.value = c.numeric && v !== "—" && v !== "" && v != null ? Number(v) || 0 : (v ?? "");
      cell.font = { name: "Inter", size: 10, color: { argb: "FF" + BRAND.ink } };
      cell.alignment = { vertical: "middle", horizontal: c.numeric ? "right" : "left", wrapText: c.key === "notes" };
      if (banded) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.band } };
      }
      cell.border = { bottom: { style: "hair", color: { argb: "FFE5DCC8" } } };
      if (c.numeric) cell.numFmt = "#,##0";
      if (c.status) {
        const sc = statusColor(String(v ?? ""));
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + sc.bg } };
        cell.font = { name: "Inter", size: 10, bold: true, color: { argb: "FF" + sc.fg } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      }
    });
  });

  // Auto-filter
  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4 + rows.length, column: COLUMNS.length },
  };

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function exportBrokerages(
  rows: BrokerageExportRow[],
  format: BrokerageExportFormat,
): Promise<void> {
  const filename = baseName();

  if (format === "csv") {
    const head = COLUMNS.map((c) => `"${c.label}"`).join(",");
    const body = rows
      .map((r) =>
        COLUMNS.map((c) => {
          const v = r[c.key] == null ? "" : String(r[c.key]);
          return `"${v.replace(/"/g, '""')}"`;
        }).join(","),
      )
      .join("\n");
    triggerDownload(
      new Blob([`\ufeff${head}\n${body}`], { type: "text/csv;charset=utf-8;" }),
      `${filename}.csv`,
    );
    return;
  }

  if (format === "xlsx") {
    const blob = await buildXlsx(rows);
    triggerDownload(blob, `${filename}.xlsx`);
    return;
  }

  if (format === "pdf") {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
    doc.setFillColor("#" + BRAND.champagne);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 56, "F");
    doc.setTextColor("#" + BRAND.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("JBJ GLOBAL REAL ESTATE — UAE Brokerage Tracker", 32, 32);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} agencies`, 32, 48);
    doc.setDrawColor("#" + BRAND.gold);
    doc.setLineWidth(1.2);
    doc.line(0, 56, doc.internal.pageSize.getWidth(), 56);

    autoTable(doc, {
      startY: 68,
      head: [COLUMNS.map((c) => c.label)],
      body: rows.map((r) => COLUMNS.map((c) => String(r[c.key] ?? ""))),
      styles: { font: "helvetica", fontSize: 7, cellPadding: 3, textColor: "#" + BRAND.ink },
      headStyles: { fillColor: "#" + BRAND.champagne, textColor: "#" + BRAND.ink, fontStyle: "bold", lineWidth: { bottom: 1.2 } as any, lineColor: "#" + BRAND.gold },
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
