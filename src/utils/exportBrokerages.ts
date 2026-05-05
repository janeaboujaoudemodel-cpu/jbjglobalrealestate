// Brokerage CRM exports — CSV / XLSX / PDF
// Used by the Relationships → Brokerages section so the owner can send a
// professional agency tracker to company leadership.

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  crm_status: string;
  outreach_stage: string;
  last_message_at: string;
  next_followup_at: string;
  attempt_count: number | string;
  deal_count: number | string;
  estimated_agents: number | string;
  rating: number | string;
  notes: string;
}

const COLUMNS: { key: keyof BrokerageExportRow; label: string; width?: number }[] = [
  { key: "rank", label: "Rank", width: 6 },
  { key: "company_name", label: "Agency", width: 32 },
  { key: "emirate", label: "Emirate", width: 14 },
  { key: "office_location", label: "Office", width: 28 },
  { key: "phone", label: "Phone", width: 18 },
  { key: "whatsapp", label: "WhatsApp", width: 16 },
  { key: "email", label: "Email", width: 26 },
  { key: "website", label: "Website", width: 26 },
  { key: "instagram", label: "Instagram", width: 22 },
  { key: "crm_status", label: "Status", width: 18 },
  { key: "outreach_stage", label: "Outreach", width: 16 },
  { key: "last_message_at", label: "Last Message", width: 14 },
  { key: "next_followup_at", label: "Next Follow-up", width: 14 },
  { key: "attempt_count", label: "Attempts", width: 8 },
  { key: "deal_count", label: "Deals", width: 8 },
  { key: "estimated_agents", label: "Agents", width: 8 },
  { key: "rating", label: "Rating", width: 8 },
  { key: "notes", label: "Notes", width: 30 },
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

export function exportBrokerages(
  rows: BrokerageExportRow[],
  format: BrokerageExportFormat,
): void {
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
      new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8;" }),
      `${filename}.csv`,
    );
    return;
  }

  if (format === "xlsx") {
    const aoa: any[][] = [COLUMNS.map((c) => c.label)];
    rows.forEach((r) => aoa.push(COLUMNS.map((c) => r[c.key] ?? "")));
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = COLUMNS.map((c) => ({ wch: c.width ?? 14 }));
    // Style header row (bold-ish via cell formatting markers — supported by Excel)
    const range = XLSX.utils.decode_range(ws["!ref"]!);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      const cell = ws[addr];
      if (cell) cell.s = { font: { bold: true } };
    }
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: "JBJ Global Real Estate — UAE Agency Tracker",
      Author: "JBJ GLOBAL REAL ESTATE",
      CreatedDate: new Date(),
    };
    XLSX.utils.book_append_sheet(wb, ws, "UAE Agencies");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(
      new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `${filename}.xlsx`,
    );
    return;
  }

  if (format === "pdf") {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a3" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("JBJ GLOBAL REAL ESTATE", 40, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(
      `UAE Real Estate Agency Tracker  ·  ${rows.length} agencies  ·  ${new Date().toLocaleString()}`,
      40,
      52,
    );
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 70,
      head: [COLUMNS.map((c) => c.label)],
      body: rows.map((r) => COLUMNS.map((c) => String(r[c.key] ?? ""))),
      styles: { fontSize: 7.5, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [26, 26, 26], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 242, 234] },
      columnStyles: { 0: { cellWidth: 28, halign: "center" } },
      margin: { left: 24, right: 24, bottom: 30 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          `JBJ GLOBAL REAL ESTATE  ·  Confidential  ·  Page ${data.pageNumber} / ${pageCount}`,
          40,
          doc.internal.pageSize.getHeight() - 14,
        );
        doc.setTextColor(0);
      },
    });
    doc.save(`${filename}.pdf`);
  }
}
