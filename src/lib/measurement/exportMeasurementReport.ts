import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface MeasurementRoom {
  name: string;
  area: number; // sq ft
  dimensions?: string;
}

export interface MeasurementReportData {
  propertyName?: string;
  propertyType?: string;
  totalArea: number; // sq ft
  rooms: MeasurementRoom[];
  confidence?: string;
  notes?: string;
}

const INK = "#1A1A1A";
const GOLD = "#B89555";
const NAVY = "#102540";
const CHAMP = "#F7F2EA";
const EMERALD = "#047857";

const sqftToSqm = (n: number) => Math.round(n * 0.0929);

export function exportMeasurementReport(data: MeasurementReportData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  /* ---------- Cover page ---------- */
  // Champagne bg
  doc.setFillColor(CHAMP);
  doc.rect(0, 0, pageW, pageH, "F");

  // Gold hairline frame
  doc.setDrawColor(GOLD);
  doc.setLineWidth(1);
  doc.rect(28, 28, pageW - 56, pageH - 56);

  // Navy band
  doc.setFillColor(NAVY);
  doc.rect(28, 28, pageW - 56, 110, "F");

  // Brand
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("JBJ GLOBAL REAL ESTATE", pageW / 2, 78, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(GOLD);
  doc.text("PROPERTY MEASUREMENT REPORT", pageW / 2, 102, { align: "center" });

  // Title block
  doc.setTextColor(INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  const title = data.propertyName?.trim() || "Unnamed Property";
  doc.text(title, pageW / 2, 230, { align: "center", maxWidth: pageW - 120 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(INK);
  const type = (data.propertyType || "Property").replace(/^\w/, (c) => c.toUpperCase());
  doc.text(type, pageW / 2, 260, { align: "center" });

  // Total area emerald block
  doc.setFillColor(EMERALD);
  doc.roundedRect(80, 320, pageW - 160, 130, 10, 10, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("TOTAL VERIFIED AREA", pageW / 2, 352, { align: "center" });
  doc.setFontSize(40);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.totalArea.toLocaleString()} sq ft`, pageW / 2, 400, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.text(`${sqftToSqm(data.totalArea).toLocaleString()} sq m`, pageW / 2, 425, { align: "center" });

  // Meta
  doc.setTextColor(INK);
  doc.setFontSize(11);
  const meta = [
    `Generated: ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    `Rooms analysed: ${data.rooms.length}`,
    `AI confidence: ${(data.confidence || "medium").toUpperCase()}`,
  ];
  meta.forEach((line, i) => {
    doc.text(line, pageW / 2, 490 + i * 18, { align: "center" });
  });

  // Footer
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.5);
  doc.line(80, pageH - 80, pageW - 80, pageH - 80);
  doc.setFontSize(9);
  doc.setTextColor(INK);
  doc.text("jbj.ae  ·  Confidential measurement report  ·  AI-assisted estimate", pageW / 2, pageH - 60, {
    align: "center",
  });

  /* ---------- Page 2: Room breakdown ---------- */
  doc.addPage();
  doc.setFillColor(CHAMP);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setDrawColor(GOLD);
  doc.setLineWidth(1);
  doc.rect(28, 28, pageW - 56, pageH - 56);

  // Header band
  doc.setFillColor(NAVY);
  doc.rect(28, 28, pageW - 56, 60, "F");
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Room Breakdown", 48, 66);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(GOLD);
  doc.text(title, pageW - 48, 66, { align: "right" });

  // Table
  autoTable(doc, {
    startY: 110,
    margin: { left: 48, right: 48 },
    head: [["Room", "Area (sq ft)", "Area (sq m)", "Estimated Dimensions"]],
    body: data.rooms.map((r) => [
      r.name,
      r.area.toLocaleString(),
      sqftToSqm(r.area).toLocaleString(),
      r.dimensions || "—",
    ]),
    foot: [
      [
        "TOTAL",
        data.totalArea.toLocaleString(),
        sqftToSqm(data.totalArea).toLocaleString(),
        "",
      ],
    ],
    theme: "grid",
    styles: { font: "helvetica", fontSize: 10, textColor: INK, lineColor: GOLD, lineWidth: 0.3, cellPadding: 8 },
    headStyles: { fillColor: NAVY, textColor: "#FFFFFF", fontStyle: "bold" },
    footStyles: { fillColor: EMERALD, textColor: "#FFFFFF", fontStyle: "bold" },
    alternateRowStyles: { fillColor: "#FDFBF7" },
  });

  // Notes
  if (data.notes) {
    const finalY = (doc as any).lastAutoTable?.finalY || 400;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(INK);
    doc.text("AI Analysis Notes", 48, finalY + 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const split = doc.splitTextToSize(data.notes, pageW - 96);
    doc.text(split, 48, finalY + 54);
  }

  // Signature block (per memory standard)
  const sigY = pageH - 130;
  doc.setDrawColor(GOLD);
  doc.setLineWidth(0.5);
  doc.line(pageW - 348, sigY, pageW - 48, sigY);
  doc.setFontSize(9);
  doc.setTextColor(INK);
  doc.text("Authorised signatory · JBJ Global Real Estate", pageW - 48, sigY + 14, { align: "right" });
  doc.text(
    `Issued ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`,
    pageW - 48,
    sigY + 28,
    { align: "right" }
  );

  // Disclaimer footer
  doc.setDrawColor(GOLD);
  doc.line(48, pageH - 70, pageW - 48, pageH - 70);
  doc.setFontSize(8);
  doc.setTextColor(INK);
  doc.text(
    "AI-assisted estimate based on user-supplied photographs. Not a substitute for a certified land or building survey.",
    pageW / 2,
    pageH - 54,
    { align: "center", maxWidth: pageW - 96 }
  );
  doc.text("jbj.ae  ·  contact@jbj.ae", pageW / 2, pageH - 40, { align: "center" });

  const safe = (data.propertyName || "report").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
  doc.save(`jbj-measurement-${safe}.pdf`);
}
