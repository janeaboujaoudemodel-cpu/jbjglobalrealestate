/**
 * Branded Dubai Market Intelligence PDF report (JBJ GLOBAL REAL ESTATE).
 * Date-range customizable. Pulls live data from the same source the dashboard renders.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const GOLD: [number, number, number] = [184, 149, 85];
const INK: [number, number, number] = [26, 26, 26];
const CHAMPAGNE: [number, number, number] = [253, 251, 247];
const EMERALD: [number, number, number] = [30, 95, 63];
const NAVY: [number, number, number] = [31, 58, 95];

export interface DldReportInput {
  ytd: any;
  topAreas: { area: string; transactions: number; change: string }[];
  topNationalities: { country: string; percentage: number; flag?: string }[];
  areaNationalities?: Record<string, { country: string; flag?: string; percentage: number }[]>;
  rangeFrom: Date;
  rangeTo: Date;
  lastUpdated?: string | null;
}

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

// Strip emoji / non-Latin glyphs (jsPDF default font cannot render them).
const sanitize = (s: string) => s.replace(/[^\x00-\x7F]/g, "").trim();

export function generateDldReportPdf(input: DldReportInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // ── Letterhead ─────────────────────────────────────────────────────
  doc.setFillColor(...INK);
  doc.rect(0, 0, W, 86, "F");
  doc.setTextColor(...GOLD);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("JBJ GLOBAL REAL ESTATE", 40, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(245, 240, 230);
  doc.text("Institutional Real Estate Intelligence  |  Dubai, UAE", 40, 56);
  doc.text("www.jbj.ae   |   investors@jbj.ae", 40, 70);

  // Gold hairline under header
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);
  doc.line(40, 90, W - 40, 90);

  // ── Title block ────────────────────────────────────────────────────
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Dubai Market Intelligence Report", 40, 124);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Reporting period: ${fmtDate(input.rangeFrom)}  to  ${fmtDate(input.rangeTo)}`,
    40,
    142,
  );
  doc.text(
    `Generated: ${fmtDate(new Date())}` +
      (input.lastUpdated ? `   |   Data last synced: ${fmtDate(new Date(input.lastUpdated))}` : ""),
    40,
    156,
  );

  // ── Headline KPI ───────────────────────────────────────────────────
  doc.setFillColor(...CHAMPAGNE);
  doc.setDrawColor(...GOLD);
  doc.roundedRect(40, 174, W - 80, 78, 6, 6, "FD");

  const kpis = [
    { label: "YTD Volume", value: String(input.ytd.value ?? "—"), color: EMERALD },
    {
      label: "Transactions",
      value: Number(input.ytd.transactions ?? 0).toLocaleString(),
      color: NAVY,
    },
    { label: "YoY Growth", value: String(input.ytd.growth ?? "—"), color: EMERALD },
    {
      label: "Off-Plan Share",
      value:
        input.ytd.transactions
          ? `${Math.round((input.ytd.offPlan / input.ytd.transactions) * 100)}%`
          : "—",
      color: NAVY,
    },
  ];
  const colW = (W - 80) / kpis.length;
  kpis.forEach((k, i) => {
    const x = 40 + i * colW + colW / 2;
    doc.setTextColor(120, 110, 90);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(k.label.toUpperCase(), x, 196, { align: "center" });
    doc.setTextColor(...k.color);
    doc.setFontSize(18);
    doc.text(k.value, x, 224, { align: "center" });
  });

  // ── Transaction split ──────────────────────────────────────────────
  autoTable(doc, {
    startY: 274,
    head: [["Transaction Composition", "Volume", "Share"]],
    body: [
      [
        "Off-Plan Sales",
        Number(input.ytd.offPlan ?? 0).toLocaleString(),
        `${Math.round(((input.ytd.offPlan ?? 0) / (input.ytd.transactions || 1)) * 100)}%`,
      ],
      [
        "Secondary Sales",
        Number(input.ytd.secondary ?? 0).toLocaleString(),
        `${Math.round(((input.ytd.secondary ?? 0) / (input.ytd.transactions || 1)) * 100)}%`,
      ],
      [
        "Cash Deals",
        Number(input.ytd.cash ?? 0).toLocaleString(),
        `${Math.round(((input.ytd.cash ?? 0) / (input.ytd.transactions || 1)) * 100)}%`,
      ],
      [
        "Mortgage Deals",
        Number(input.ytd.mortgage ?? 0).toLocaleString(),
        `${Math.round(((input.ytd.mortgage ?? 0) / (input.ytd.transactions || 1)) * 100)}%`,
      ],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, textColor: INK },
    headStyles: { fillColor: INK, textColor: GOLD, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 242, 234] },
    margin: { left: 40, right: 40 },
  });

  // ── Top 10 Areas ───────────────────────────────────────────────────
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 22,
    head: [["#", "Top 10 Areas by Transactions", "Transactions", "YoY"]],
    body: input.topAreas
      .slice(0, 10)
      .map((a, i) => [
        String(i + 1),
        a.area,
        a.transactions.toLocaleString(),
        a.change,
      ]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, textColor: INK },
    headStyles: { fillColor: INK, textColor: GOLD, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 242, 234] },
    margin: { left: 40, right: 40 },
  });

  // ── Top 10 Nationalities ───────────────────────────────────────────
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 22,
    head: [["#", "Top 10 Buyer Nationalities", "Share"]],
    body: input.topNationalities
      .slice(0, 10)
      .map((n, i) => [String(i + 1), sanitize(n.country), `${n.percentage}%`]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, textColor: INK },
    headStyles: { fillColor: INK, textColor: GOLD, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 242, 234] },
    margin: { left: 40, right: 40 },
  });

  // ── Per-area Top 5 Nationalities ───────────────────────────────────
  if (input.areaNationalities && Object.keys(input.areaNationalities).length) {
    doc.addPage();
    doc.setFillColor(...INK);
    doc.rect(0, 0, W, 50, "F");
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Top 5 Buyer Nationalities per Area", 40, 32);

    const body: string[][] = [];
    Object.entries(input.areaNationalities).forEach(([area, list]) => {
      const cells = list
        .slice(0, 5)
        .map((n) => `${sanitize(n.country)} ${n.percentage}%`)
        .join("   |   ");
      body.push([area, cells]);
    });

    autoTable(doc, {
      startY: 70,
      head: [["Area", "Top 5 Buyer Nationalities"]],
      body,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, textColor: INK, cellPadding: 6 },
      headStyles: { fillColor: INK, textColor: GOLD, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [247, 242, 234] },
      columnStyles: { 0: { cellWidth: 150, fontStyle: "bold" } },
      margin: { left: 40, right: 40 },
    });
  }

  // ── Footer on every page ───────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.4);
    doc.line(40, H - 50, W - 40, H - 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    doc.text(
      "Sources: Dubai Land Department (DLD), RERA, DXB Interact, Property Monitor.",
      40,
      H - 34,
    );
    doc.text(
      "For informational purposes only. Does not constitute financial, legal or tax advice.",
      40,
      H - 22,
    );
    doc.text(`Page ${p} of ${pageCount}`, W - 40, H - 22, { align: "right" });
    doc.setTextColor(...GOLD);
    doc.setFont("helvetica", "bold");
    doc.text("JBJ GLOBAL REAL ESTATE", W - 40, H - 34, { align: "right" });
  }

  const tag = `${input.rangeFrom.toISOString().slice(0, 10)}_to_${input.rangeTo
    .toISOString()
    .slice(0, 10)}`;
  doc.save(`JBJ_Dubai_Market_Intelligence_${tag}.pdf`);
}
