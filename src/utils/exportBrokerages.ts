// Brokerage CRM exports — premium colored XLSX (ExcelJS), PDF (jsPDF), CSV.
// Now supports dynamic column selection so users can include/exclude e.g. admin
// or broker contact details per export.

import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { statusColor, BRAND } from "./crmStatusPalette";

export type BrokerageExportFormat = "csv" | "xlsx" | "pdf";

export interface BrokerageExportRow {
  rank: number;
  company_name: string;
  name_arabic?: string;
  dld_office_number?: string;
  emirate: string;
  office_location: string;
  website: string;
  instagram: string;
  phone: string;
  whatsapp: string;
  email: string;
  primary_contact_name: string;
  admin_contact_name?: string;
  admin_contact_phone?: string;
  admin_contact_email?: string;
  broker_contact_name?: string;
  broker_contact_phone?: string;
  broker_contact_email?: string;
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
  ai_summary?: string;
}

interface ColDef {
  key: keyof BrokerageExportRow;
  label: string;
  group: string;
  width: number;
  numeric?: boolean;
  status?: boolean;
  defaultOn?: boolean;
}

export const BROKERAGE_EXPORT_COLUMNS: ColDef[] = [
  { key: "rank",                 label: "Rank",            group: "General",         width: 6,  numeric: true, defaultOn: true },
  { key: "company_name",         label: "Agency",          group: "General",         width: 34, defaultOn: true },
  { key: "name_arabic",          label: "Agency (Arabic)", group: "General",         width: 28, defaultOn: false },
  { key: "dld_office_number",    label: "DLD office #",    group: "General",         width: 12, defaultOn: true },
  { key: "emirate",              label: "Emirate",         group: "General",         width: 14, defaultOn: true },
  { key: "office_location",      label: "Office address",  group: "General",         width: 28, defaultOn: true },

  { key: "website",              label: "Website",         group: "Public contact",  width: 24, defaultOn: true },
  { key: "instagram",            label: "Instagram",       group: "Public contact",  width: 20, defaultOn: true },
  { key: "phone",                label: "Phone",           group: "Public contact",  width: 18, defaultOn: true },
  { key: "whatsapp",             label: "WhatsApp",        group: "Public contact",  width: 16, defaultOn: true },
  { key: "email",                label: "Email",           group: "Public contact",  width: 28, defaultOn: true },
  { key: "primary_contact_name", label: "Primary contact", group: "Public contact",  width: 22, defaultOn: true },

  { key: "admin_contact_name",   label: "Admin name",      group: "Admin contact",   width: 22, defaultOn: false },
  { key: "admin_contact_phone",  label: "Admin phone",     group: "Admin contact",   width: 18, defaultOn: false },
  { key: "admin_contact_email",  label: "Admin email",     group: "Admin contact",   width: 26, defaultOn: false },

  { key: "broker_contact_name",  label: "Broker name",     group: "Broker contact",  width: 22, defaultOn: false },
  { key: "broker_contact_phone", label: "Broker phone",    group: "Broker contact",  width: 18, defaultOn: false },
  { key: "broker_contact_email", label: "Broker email",    group: "Broker contact",  width: 26, defaultOn: false },

  { key: "agency_status",        label: "Agency status",   group: "Status",          width: 18, status: true, defaultOn: true },
  { key: "outreach_status",      label: "Outreach status", group: "Status",          width: 18, status: true, defaultOn: true },
  { key: "last_message_at",      label: "Last message",    group: "Status",          width: 14, defaultOn: true },
  { key: "next_followup_at",     label: "Next follow-up",  group: "Status",          width: 14, defaultOn: true },

  { key: "attempt_count",        label: "Attempts",        group: "Metrics",         width: 9,  numeric: true, defaultOn: true },
  { key: "deal_count",           label: "Deals",           group: "Metrics",         width: 9,  numeric: true, defaultOn: true },
  { key: "estimated_agents",     label: "Agents",          group: "Metrics",         width: 9,  numeric: true, defaultOn: true },
  { key: "active_brokers",       label: "Active brokers",  group: "Metrics",         width: 11, numeric: true, defaultOn: true },
  { key: "inquiries",            label: "Inquiries",       group: "Metrics",         width: 10, numeric: true, defaultOn: true },
  { key: "rating",               label: "Rating",          group: "Metrics",         width: 9,  numeric: true, defaultOn: false },

  { key: "notes",                label: "Notes",           group: "Internal",        width: 38, defaultOn: false },
  { key: "ai_summary",           label: "AI summary",      group: "Internal",        width: 38, defaultOn: false },
];

export const BROKERAGE_EXPORT_PRESETS = [
  {
    name: "Internal full",
    columns: BROKERAGE_EXPORT_COLUMNS.map((c) => c.key as string),
  },
  {
    name: "Public sheet (no internal contacts)",
    columns: BROKERAGE_EXPORT_COLUMNS
      .filter((c) => !["Admin contact", "Broker contact", "Internal"].includes(c.group))
      .map((c) => c.key as string),
  },
  {
    name: "Without broker contacts",
    columns: BROKERAGE_EXPORT_COLUMNS
      .filter((c) => c.group !== "Broker contact" && (c.defaultOn || c.group === "Admin contact"))
      .map((c) => c.key as string),
  },
  {
    name: "Without admin contacts",
    columns: BROKERAGE_EXPORT_COLUMNS
      .filter((c) => c.group !== "Admin contact" && (c.defaultOn || c.group === "Broker contact"))
      .map((c) => c.key as string),
  },
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

function pickColumns(keys?: string[]): ColDef[] {
  if (!keys || !keys.length) return BROKERAGE_EXPORT_COLUMNS.filter((c) => c.defaultOn);
  const map = new Map(BROKERAGE_EXPORT_COLUMNS.map((c) => [c.key as string, c]));
  return keys.map((k) => map.get(k)).filter(Boolean) as ColDef[];
}

async function buildXlsx(rows: BrokerageExportRow[], cols: ColDef[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "JBJ GLOBAL REAL ESTATE";
  wb.created = new Date();
  const ws = wb.addWorksheet("Agencies", {
    views: [{ state: "frozen", ySplit: 4, xSplit: 2 }],
  });

  ws.mergeCells(1, 1, 1, cols.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = "JBJ GLOBAL REAL ESTATE — UAE Brokerage Tracker";
  titleCell.font = { name: "Inter", size: 16, bold: true, color: { argb: "FF" + BRAND.ink } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.champagne } };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, cols.length);
  const subCell = ws.getCell(2, 1);
  subCell.value = `Generated ${new Date().toLocaleString()} · ${rows.length} agencies · ${cols.length} columns`;
  subCell.font = { name: "Inter", size: 10, italic: true, color: { argb: "FF555555" } };
  subCell.alignment = { horizontal: "left" };

  ws.mergeCells(3, 1, 3, cols.length);
  const goldCell = ws.getCell(3, 1);
  goldCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.gold } };
  ws.getRow(3).height = 3;

  const headerRow = ws.getRow(4);
  cols.forEach((c, i) => {
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

  cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });

  rows.forEach((r, idx) => {
    const rowIndex = idx + 5;
    const excelRow = ws.getRow(rowIndex);
    const banded = idx % 2 === 1;
    cols.forEach((c, i) => {
      const cell = excelRow.getCell(i + 1);
      const v = (r as any)[c.key];
      cell.value = c.numeric && v !== "—" && v !== "" && v != null ? Number(v) || 0 : (v ?? "");
      cell.font = { name: "Inter", size: 10, color: { argb: "FF" + BRAND.ink } };
      cell.alignment = { vertical: "middle", horizontal: c.numeric ? "right" : "left", wrapText: c.key === "notes" || c.key === "ai_summary" };
      if (banded) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + BRAND.band } };
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

  ws.autoFilter = {
    from: { row: 4, column: 1 },
    to: { row: 4 + rows.length, column: cols.length },
  };

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function exportBrokerages(
  rows: BrokerageExportRow[],
  format: BrokerageExportFormat,
  columnKeys?: string[],
): Promise<void> {
  const filename = baseName();
  const cols = pickColumns(columnKeys);

  if (format === "csv") {
    const head = cols.map((c) => `"${c.label}"`).join(",");
    const body = rows
      .map((r) =>
        cols.map((c) => {
          const v = (r as any)[c.key] == null ? "" : String((r as any)[c.key]);
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
    const blob = await buildXlsx(rows, cols);
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
    doc.text(`Generated ${new Date().toLocaleString()} · ${rows.length} agencies · ${cols.length} columns`, 32, 48);
    doc.setDrawColor("#" + BRAND.gold);
    doc.setLineWidth(1.2);
    doc.line(0, 56, doc.internal.pageSize.getWidth(), 56);

    autoTable(doc, {
      startY: 68,
      head: [cols.map((c) => c.label)],
      body: rows.map((r) => cols.map((c) => String((r as any)[c.key] ?? ""))),
      styles: { font: "helvetica", fontSize: 7, cellPadding: 3, textColor: "#" + BRAND.ink },
      headStyles: { fillColor: "#" + BRAND.champagne, textColor: "#" + BRAND.ink, fontStyle: "bold", lineWidth: { bottom: 1.2 } as any, lineColor: "#" + BRAND.gold },
      alternateRowStyles: { fillColor: "#" + BRAND.band },
      didParseCell: (data: any) => {
        if (data.section !== "body") return;
        const colDef = cols[data.column.index];
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
