/**
 * Dev-only harness page used to compare the on-screen Live Preview of the
 * AI Home Finder report against the actual exported PDF. Drives a Playwright
 * script that samples computed colors of:
 *   - the role chip ("Broker")
 *   - the page subtitle
 *   - the active "include in report" pill (modal control)
 *   - the report-scope dots (inside the emerald block on page 1)
 * Then triggers the PDF export, exposes the rendered PDF on `window.__pdfBlob`,
 * and lets the harness compare pixel colors at the same positions.
 *
 * Mounted only when `import.meta.env.DEV` is true.
 */
import React, { useState } from "react";
import { ReportEngine, type ReportProject } from "@/components/ai-home-finder/report/ReportEngine";
import type { ReportBranding } from "@/components/ai-home-finder/ReportPreviewModal";
import { renderReportToPdf } from "@/utils/renderReportToPdf";

const FIXTURE_BRANDING: ReportBranding = {
  role: "broker",
  mode: "both",
  name: "Jane Broker",
  salutation: "Ms.",
  companyName: "JBJ Global Real Estate",
  phone: "+971 50 000 0000",
  whatsapp: "+971 50 000 0000",
  email: "jane@jbj.ae",
  website: "https://jbj.ae",
  license: "TEST-LIC-0001",
};

const FIXTURE_PROJECTS: ReportProject[] = [
  {
    id: "p1",
    name: "Boulevard Heights",
    cover_image_url: null,
    area: "Downtown Dubai",
    location: "Downtown Dubai",
    emirate: "Dubai",
    developer_name: "Emaar",
    price_from: 3_800_000,
    price_to: null,
    bedrooms_min: null,
    bedrooms_max: null,
    handover_date: "2028-12-31",
    payment_plan: "60/40",
  },
  {
    id: "p2",
    name: "Pinewood Village",
    area: "Jumeirah Golf Estates",
    location: "Jumeirah Golf Estates",
    emirate: "Dubai",
    developer_name: "Wasl",
    price_from: 5_600_000,
    price_to: null,
    bedrooms_min: null,
    bedrooms_max: null,
    handover_date: "Ready",
    construction_status: "Ready",
    payment_plan: "50/50",
  },
  {
    id: "p3",
    name: "North 43 Serviced Residences",
    area: "Jumeirah Village Circle (JVC)",
    location: "Jumeirah Village Circle (JVC)",
    emirate: "Dubai",
    developer_name: "Avenew Development",
    price_from: 1_900_000,
    price_to: null,
    bedrooms_min: null,
    bedrooms_max: null,
    handover_date: "Ready",
    construction_status: "Ready",
  },
];

const FIXTURE_REQUIREMENTS = {
  property_type: "apartment",
  purpose: "investment",
  budget: "under-1m",
  bedrooms: "studio",
  areas: ["other", "downtown"],
  location_type: ["beachfront"],
  views_and_features: ["balcony"],
  timeline: "2027-plus",
  payment_preference: "flexible",
};

export default function ReportContrastHarness() {
  const [includeMode, setIncludeMode] = useState<"both" | "photo" | "logo" | "none">("both");
  const [status, setStatus] = useState("");

  async function exportPdf() {
    setStatus("rendering…");
    const out = await renderReportToPdf({
      branding: { ...FIXTURE_BRANDING, mode: includeMode },
      projects: FIXTURE_PROJECTS,
      clientName: "Test Client",
      clientRequirements: FIXTURE_REQUIREMENTS,
    });
    if (!out) {
      setStatus("no pdf");
      return;
    }
    (window as any).__pdfBlob = out.blob;
    (window as any).__pdfArrayBuffer = await out.blob.arrayBuffer();
    setStatus(`pdf ready (${out.blob.size} bytes)`);
  }

  const includeOptions: Array<{ v: typeof includeMode; label: string }> = [
    { v: "both", label: "Photo + Logo" },
    { v: "photo", label: "Photo" },
    { v: "logo", label: "Logo" },
    { v: "none", label: "Name only" },
  ];

  return (
    <div style={{ background: "#FDFBF7", minHeight: "100vh", padding: 24, fontFamily: "Inter, sans-serif" }}>
      <h1 style={{ color: "#1A1A1A", fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
        Report Contrast Harness <span style={{ color: "#5a5246", fontSize: 12 }}>(dev only)</span>
      </h1>

      {/* Modal-side controls — exact same data-attrs the real ReportPreviewModal uses */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <span
          data-aihf-role-chip
          data-testid="harness-role-chip"
          className="allow-white"
          style={{
            background: "linear-gradient(135deg,#064E3B 0%,#042c1c 100%)",
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Broker
        </span>

        {includeOptions.map((opt) => {
          const active = includeMode === opt.v;
          return (
            <button
              key={opt.v}
              data-aihf-include-btn
              data-active={active ? "true" : "false"}
              data-testid={`harness-include-${opt.v}`}
              className={active ? "allow-white" : ""}
              onClick={() => setIncludeMode(opt.v)}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg,#064E3B 0%,#042c1c 100%)",
                      color: "#FFFFFF",
                      WebkitTextFillColor: "#FFFFFF",
                      border: "1px solid #B89555",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                    }
                  : {
                      background: "#F7F2EA",
                      color: "#1A1A1A",
                      border: "1px solid rgba(184,149,85,0.45)",
                      padding: "8px 14px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                    }
              }
            >
              {opt.label}
            </button>
          );
        })}

        <button
          data-testid="harness-export-pdf"
          onClick={exportPdf}
          style={{
            marginLeft: "auto",
            background: "linear-gradient(135deg,#064E3B 0%,#042c1c 100%)",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 800,
            border: "1px solid #B89555",
          }}
        >
          Export PDF
        </button>
        <span data-testid="harness-status" style={{ color: "#1A1A1A", fontSize: 12 }}>{status}</span>
      </div>

      {/* Live preview — same engine that renderReportToPdf rasterizes */}
      <div id="harness-preview-root" style={{ display: "flex", justifyContent: "center" }}>
        <ReportEngine
          mode="preview"
          branding={{ ...FIXTURE_BRANDING, mode: includeMode }}
          projects={FIXTURE_PROJECTS}
          clientName="Test Client"
          clientRequirements={FIXTURE_REQUIREMENTS}
          pageIdPrefix="preview"
        />
      </div>
    </div>
  );
}
