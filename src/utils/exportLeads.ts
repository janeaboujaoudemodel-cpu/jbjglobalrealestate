// Unified export utility for the Leads & Clients workspace.
// Supports CSV, XLSX, and PDF for single / selected / all / filtered scopes.
//
// Usage:
//   import { exportLeads } from "@/utils/exportLeads";
//   await exportLeads(rows, { format: "csv", filename: "leads" });

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type LeadExportFormat = "csv" | "xlsx" | "pdf";

export interface LeadExportRow {
  [k: string]: any;
}

export interface ExportOptions {
  format: LeadExportFormat;
  filename?: string;
  /** Optional column whitelist; defaults to a sensible Leads & Clients column set. */
  columns?: { key: string; label: string }[];
}

const DEFAULT_COLUMNS: { key: string; label: string }[] = [
  { key: "full_name", label: "Lead Name" },
  { key: "lead_type", label: "Type" },
  { key: "phone_e164", label: "Phone" },
  { key: "whatsapp_e164", label: "WhatsApp" },
  { key: "email_lower", label: "Email" },
  { key: "preferred_language", label: "Language" },
  { key: "nationality", label: "Nationality" },
  { key: "country_of_residence", label: "Country" },
  { key: "budget_min", label: "Budget Min" },
  { key: "budget_max", label: "Budget Max" },
  { key: "budget_currency", label: "Currency" },
  { key: "preferred_location", label: "Preferred Location" },
  { key: "preferred_project", label: "Preferred Project" },
  { key: "property_type", label: "Property Type" },
  { key: "bedroom_requirement", label: "Bedrooms" },
  { key: "buying_purpose", label: "Purpose" },
  { key: "source", label: "Source" },
  { key: "pipeline_stage", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "lead_score_band", label: "Score" },
  { key: "last_contacted_at", label: "Last Contact" },
  { key: "next_followup_at", label: "Next Follow-up" },
  { key: "tags", label: "Tags" },
];

const cellValue = (row: LeadExportRow, key: string): string => {
  const v = row?.[key];
  if (v == null) return "";
  if (Array.isArray(v)) return v.join(", ");
  if (v instanceof Date) return v.toISOString();
  return String(v);
};

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

export async function exportLeads(
  rows: LeadExportRow[],
  opts: ExportOptions,
): Promise<void> {
  const cols = opts.columns?.length ? opts.columns : DEFAULT_COLUMNS;
  const base = opts.filename || `leads-clients-${new Date().toISOString().slice(0, 10)}`;

  if (opts.format === "csv") {
    const header = cols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
    const body = rows
      .map((r) =>
        cols
          .map((c) => `"${cellValue(r, c.key).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `${base}.csv`);
    return;
  }

  if (opts.format === "xlsx") {
    const aoa: any[][] = [cols.map((c) => c.label)];
    rows.forEach((r) => aoa.push(cols.map((c) => cellValue(r, c.key))));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads & Clients");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(
      new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `${base}.xlsx`,
    );
    return;
  }

  if (opts.format === "pdf") {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text("JBJ GLOBAL REAL ESTATE", 40, 36);
    doc.setFontSize(11);
    doc.setTextColor(120);
    doc.text(`Leads & Clients export · ${new Date().toLocaleString()}`, 40, 52);
    doc.setTextColor(0);
    autoTable(doc, {
      startY: 70,
      head: [cols.map((c) => c.label)],
      body: rows.map((r) => cols.map((c) => cellValue(r, c.key))),
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [0, 0, 0], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      margin: { left: 40, right: 40 },
    });
    doc.save(`${base}.pdf`);
    return;
  }
}
