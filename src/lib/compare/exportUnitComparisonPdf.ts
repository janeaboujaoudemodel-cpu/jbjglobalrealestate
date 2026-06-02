/**
 * Branded PDF export for the Unit Comparison tool.
 *
 * Owner (JBJ) — branding is locked: "JBJ GLOBAL REAL ESTATE", gold/navy palette,
 * no broker overrides allowed.
 * Broker — may pass `broker` overrides (name, brokerage, phone, email, logo).
 */
import jsPDF from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import { BRAND } from "@/lib/brand-tokens";
import { UNIT_FIELDS, type UnitFieldId } from "@/lib/compare/unitFieldsConfig";
import { buildSchedule, type PlanRule } from "@/lib/payment-plan/buildSchedule";
import type { UnitDraft } from "@/components/compare/units/AddUnitDialog";
import type { PickedProject } from "@/components/compare/units/ProjectPicker";

export interface BrokerBranding {
  name?: string;
  brokerage?: string;
  phone?: string;
  email?: string;
}

export interface ExportOpts {
  project: PickedProject;
  units: UnitDraft[];
  visible: UnitFieldId[];
  sharedPlan: PlanRule[] | null;
  unitPlans: Record<string, PlanRule[]>;
  /** "owner" = JBJ-locked branding. "broker" = broker overrides allowed. */
  mode: "owner" | "broker";
  client?: { name?: string; email?: string };
  broker?: BrokerBranding;
}

const fmt = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 });
const aed = (n: number | null | undefined) =>
  n == null ? "—" : `AED ${fmt.format(n)}`;

function cellValue(
  id: UnitFieldId,
  u: UnitDraft,
  project: PickedProject,
  sch: ReturnType<typeof buildSchedule>,
  downPct: number | null,
): string {
  switch (id) {
    case "label": return u.label || "—";
    case "bedrooms": return u.bedrooms === "studio" ? "Studio" : `${u.bedrooms} BR`;
    case "size": return u.sizeSqft ? `${fmt.format(u.sizeSqft)} sqft` : "—";
    case "price": return aed(u.priceAED);
    case "pricePerSqft": return u.sizeSqft ? `AED ${fmt.format(u.priceAED / u.sizeSqft)}` : "—";
    case "view": return u.view || "—";
    case "floor": return u.floor || "—";
    case "unitNumber": return u.unitNumber || "—";
    case "projectName": return project.name;
    case "developer": return project.developer?.name || "—";
    case "location":
    case "community": return project.location || "—";
    case "handover": return project.handover_date || "—";
    case "downPaymentPct": return downPct != null ? `${downPct}%` : "—";
    case "monthlyInstallment": return aed(sch.totals.monthlyInstallmentAED);
    case "installmentsCount": return String(sch.totals.installmentsCount);
    case "duringConstructionAED": return aed(sch.totals.duringConstructionAED);
    case "postHandoverAED": return aed(sch.totals.postHandoverAED);
    case "firstPaymentDate": return sch.totals.firstPaymentDate || "—";
    case "lastPaymentDate": return sch.totals.lastPaymentDate || "—";
    case "developerFounded": return project.developer?.founded_year?.toString() || "—";
    case "developerFounder": return project.developer?.ceo_name || "—";
    case "developerDelivered": return project.developer?.completed_projects?.toString() || "—";
    case "developerActive": return project.developer?.offplan_projects?.toString() || "—";
    case "dldFee": return u.priceAED ? aed(u.priceAED * 0.04) : "—";
    default: return "—";
  }
}

export function exportUnitComparisonPdf(opts: ExportOpts): void {
  const { project, units, visible, sharedPlan, unitPlans, mode, client, broker } = opts;

  if (!units.length) throw new Error("Add at least one unit before exporting.");

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // ===== COVER PAGE =====
  doc.setFillColor(BRAND.blue);
  doc.rect(0, 0, pageW, pageH, "F");

  // gold hairline frame
  doc.setDrawColor(BRAND.gold);
  doc.setLineWidth(1);
  doc.rect(40, 40, pageW - 80, pageH - 80);

  // brand wordmark
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  const brandHeader =
    mode === "broker" && broker?.brokerage ? broker.brokerage : "JBJ GLOBAL REAL ESTATE";
  doc.text(brandHeader, pageW / 2, 130, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.gold);
  doc.text("UNIT COMPARISON REPORT", pageW / 2, 152, { align: "center" });

  // project title
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.text(project.name, pageW / 2, pageH / 2 - 30, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(BRAND.gold);
  const subline = [project.developer?.name, project.location].filter(Boolean).join("  ·  ");
  if (subline) doc.text(subline, pageW / 2, pageH / 2 - 4, { align: "center" });

  doc.setFontSize(11);
  doc.setTextColor("#FFFFFF");
  doc.text(`${units.length} unit${units.length > 1 ? "s" : ""} compared`, pageW / 2, pageH / 2 + 22, {
    align: "center",
  });

  // prepared for / by
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
  doc.setFontSize(9);
  doc.setTextColor("#FFFFFF");
  if (client?.name) doc.text(`Prepared for: ${client.name}`, pageW / 2, pageH - 130, { align: "center" });
  if (client?.email) doc.text(client.email, pageW / 2, pageH - 116, { align: "center" });

  const preparedBy =
    broker?.name || (mode === "owner" ? "JBJ Advisory Team" : null);
  if (preparedBy) doc.text(`Prepared by: ${preparedBy}`, pageW / 2, pageH - 92, { align: "center" });
  const contact = [broker?.phone, broker?.email].filter(Boolean).join("  ·  ");
  if (contact) doc.text(contact, pageW / 2, pageH - 78, { align: "center" });

  doc.setTextColor(BRAND.gold);
  doc.text(today, pageW / 2, pageH - 56, { align: "center" });

  // ===== TABLE PAGE =====
  doc.addPage();

  // Header band — navy
  doc.setFillColor(BRAND.blue);
  doc.rect(0, 0, pageW, 70, "F");
  doc.setDrawColor(BRAND.gold);
  doc.setLineWidth(1);
  doc.line(0, 70, pageW, 70);

  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(brandHeader, 32, 32);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(BRAND.gold);
  doc.text("Unit Comparison Report", 32, 52);

  // Right side — date + project
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(9);
  doc.text(today, pageW - 32, 32, { align: "right" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(project.name, pageW - 32, 52, { align: "right" });

  let cursorY = 92;
  if (client?.name || client?.email || broker?.name || broker?.phone || broker?.email) {
    doc.setFillColor(BRAND.surface);
    doc.setDrawColor(BRAND.goldRing);
    doc.roundedRect(32, cursorY - 14, pageW - 64, 50, 6, 6, "FD");

    doc.setTextColor(BRAND.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    if (client?.name) {
      doc.text(`Prepared for: ${client.name}`, 48, cursorY);
      if (client.email) {
        doc.setFont("helvetica", "normal");
        doc.text(client.email, 48, cursorY + 14);
      }
    }
    if (broker?.name || broker?.phone || broker?.email) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const xR = pageW / 2 + 20;
      doc.text(
        `Prepared by: ${broker.name || (mode === "owner" ? "JBJ Advisory Team" : "")}`,
        xR, cursorY,
      );
      doc.setFont("helvetica", "normal");
      const contact = [broker.phone, broker.email].filter(Boolean).join("  ·  ");
      if (contact) doc.text(contact, xR, cursorY + 14);
    }
    cursorY += 50;
  }

  // Build table
  const visibleFields = UNIT_FIELDS.filter((f) => visible.includes(f.id));
  const groups = ["Unit", "Project", "Payment plan", "Developer", "Investor metrics"] as const;

  const computed = units.map((u) => {
    const rules = sharedPlan ?? unitPlans[u.id] ?? [];
    const sch = buildSchedule({
      totalPriceAED: u.priceAED,
      handoverDate:
        project.handover_date ||
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2).toISOString(),
      rules,
    });
    const downPct = rules.find((r) => r.kind === "down_payment")?.pct ?? null;
    return { u, sch, downPct };
  });

  const head = [
    [
      "Field",
      ...computed.map(
        ({ u }) => u.label || (u.bedrooms === "studio" ? "Studio" : `${u.bedrooms} BR`),
      ),
    ],
  ];

  const body: RowInput[] = [];
  for (const g of groups) {
    const rows = visibleFields.filter((f) => f.group === g);
    if (!rows.length) continue;
    body.push([
      {
        content: g.toUpperCase(),
        colSpan: computed.length + 1,
        styles: {
          fillColor: BRAND.raised,
          textColor: BRAND.gold,
          fontStyle: "bold",
          fontSize: 8,
        },
      },
    ]);
    for (const f of rows) {
      body.push([
        { content: f.label, styles: { fontStyle: "bold", textColor: BRAND.ink } },
        ...computed.map((c) => ({
          content: cellValue(f.id, c.u, project, c.sch, c.downPct),
          styles: { textColor: BRAND.ink as string },
        })),
      ]);
    }
  }

  autoTable(doc, {
    head,
    body,
    startY: cursorY + 8,
    margin: { left: 32, right: 32, bottom: 60 },
    theme: "grid",
    headStyles: {
      fillColor: BRAND.blue,
      textColor: "#FFFFFF",
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: { fontSize: 9, cellPadding: 6 },
    alternateRowStyles: { fillColor: BRAND.page },
    styles: { lineColor: BRAND.goldFaint, lineWidth: 0.4 },
  });

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(BRAND.gold);
    doc.setLineWidth(0.6);
    doc.line(32, pageH - 38, pageW - 32, pageH - 38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(BRAND.ink);
    const left =
      mode === "broker" && broker?.brokerage
        ? `${broker.brokerage}  ·  Powered by JBJ GLOBAL REAL ESTATE`
        : "JBJ GLOBAL REAL ESTATE  ·  www.jbj.ae";
    doc.text(left, 32, pageH - 22);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 32, pageH - 22, { align: "right" });

    doc.setFontSize(7);
    doc.setTextColor("#666666");
    doc.text(
      "Indicative only. Pricing, availability and payment plans are subject to change. Not legal, tax or investment advice.",
      pageW / 2,
      pageH - 10,
      { align: "center" },
    );
  }

  const fname = `Unit-Comparison_${project.name.replace(/\s+/g, "-")}_${Date.now()}.pdf`;
  doc.save(fname);
}
