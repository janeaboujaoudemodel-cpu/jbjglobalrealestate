/**
 * ReportEngine — single source of truth for the AI Home Finder report.
 *
 * The SAME component renders the Live Preview pane in <ReportPreviewModal>
 * AND is captured to PDF by `renderReportToPdf`. There is no other report
 * layout anywhere in the codebase.
 *
 * Pages render at REAL A4 pixel dimensions (794 × 1123 @ 96 dpi). In preview
 * mode the modal scales them down with `transform: scale(...)`; in PDF mode
 * `renderReportToPdf` mounts the same DOM offscreen at 1:1 and snapshots each
 * [data-report-page] with html2canvas. Visual output is therefore identical.
 */
import React from "react";
import jbjMonogram from "@/assets/jbj-monogram-letterhead.png";
import { REPORT_TOKENS as T, REPORT_PAGE_PX, ROLE_LABELS } from "./tokens";
import type { ReportBranding } from "../ReportPreviewModal";

export interface ReportProject {
  id: string;
  slug?: string;
  name: string;
  cover_image_url?: string | null;
  images?: { image_url: string }[];
  developer?: { name?: string; logo_url?: string | null } | null;
  price_from?: number | null;
  price_to?: number | null;
  area?: string | null;
  bedrooms_min?: number | null;
  bedrooms_max?: number | null;
  property_type?: string | null;
  description?: string | null;
  handover_quarter?: string | null;
  handover_year?: number | null;
  amenities?: string[] | null;
}

export interface ReportEngineProps {
  /** "preview" = first 2 pages only. "pdf" = full report with extended pages. */
  mode: "preview" | "pdf";
  branding: ReportBranding;
  projects: ReportProject[];
  clientName?: string;
  /** Stable id added to every page so html2canvas/print can find them. */
  pageIdPrefix?: string;
}

// ---------- helpers ----------
const fmtPrice = (p: ReportProject) => {
  if (!p.price_from) return "Price on Request";
  const lo = `AED ${(p.price_from / 1_000_000).toFixed(1)}M`;
  if (p.price_to && p.price_to > p.price_from) return `${lo} – AED ${(p.price_to / 1_000_000).toFixed(1)}M`;
  return `From ${lo}`;
};

const fmtBeds = (p: ReportProject) => {
  if (p.bedrooms_min == null && p.bedrooms_max == null) return "Bedroom mix on request";
  if (p.bedrooms_min === 0) return `Studio${p.bedrooms_max && p.bedrooms_max > 0 ? ` – ${p.bedrooms_max} BR` : ""}`;
  if (p.bedrooms_min === p.bedrooms_max) return `${p.bedrooms_min} BR`;
  return `${p.bedrooms_min ?? 0} – ${p.bedrooms_max ?? p.bedrooms_min ?? 0} BR`;
};

const fmtHandover = (p: ReportProject) => {
  if (p.handover_quarter && p.handover_year) return `${p.handover_quarter} ${p.handover_year}`;
  if (p.handover_year) return String(p.handover_year);
  return "On request";
};

const todayStr = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

/** Strip HTML tags + decode common entities for safe plain-text rendering inside the PDF. */
const stripHtml = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();


// ---------- shared chrome ----------
function PageFrame({
  id,
  children,
  pageLabel,
  branding,
}: {
  id: string;
  children: React.ReactNode;
  pageLabel: string;
  branding: ReportBranding;
}) {
  return (
    <div
      data-report-page
      id={id}
      className="report-page"
      style={{
        width: REPORT_PAGE_PX.width,
        height: REPORT_PAGE_PX.height,
        background: T.page,
        color: T.ink,
        fontFamily: T.font,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <PageHeader pageLabel={pageLabel} branding={branding} />
      <div style={{ flex: 1, minHeight: 0, padding: "28px 40px", boxSizing: "border-box" }}>
        {children}
      </div>
      <PageFooter branding={branding} />
    </div>
  );
}

function PageHeader({ pageLabel, branding }: { pageLabel: string; branding: ReportBranding }) {
  const showLogo = (branding.mode === "both" || branding.mode === "logo") && branding.logoDataUrl;
  return (
    <div
      data-no-contrast-guard
      data-surface="emerald"
      data-on-dark
      style={{
        padding: "20px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundImage: T.emeraldGradient,
        backgroundColor: T.emeraldDeep,
        borderBottom: `1px solid ${T.gold}`,
        color: "#FFFFFF",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {showLogo ? (
          <img
            src={branding.logoDataUrl}
            alt=""
            crossOrigin="anonymous"
            style={{ height: 64, width: 64, borderRadius: 6, background: "#fff", objectFit: "contain", padding: 4 }}
          />
        ) : (
          <div
            style={{
              height: 64,
              width: 64,
              borderRadius: 6,
              background: "#FFFFFF",
              border: `1px solid ${T.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img src={jbjMonogram} alt="JBJ" style={{ height: 58, width: 58, objectFit: "contain" }} />
          </div>
        )}
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1.5, color: "#FFFFFF" }}>
            JBJ GLOBAL REAL ESTATE
          </div>
          <div style={{ fontSize: 11, color: "#A7F3D0", marginTop: 2 }}>{pageLabel}</div>
        </div>
      </div>
      <div style={{ fontSize: 11, opacity: 0.92, color: "#FFFFFF" }}>{todayStr()}</div>
    </div>
  );
}

function PageFooter({ branding }: { branding: ReportBranding }) {
  return (
    <div
      style={{
        padding: "12px 40px",
        fontSize: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: T.surface,
        color: T.ink,
        borderTop: `1px solid ${T.gold}`,
      }}
    >
      <span style={{ color: T.ink }}>Powered by JBJ Global Real Estate — Dubai, UAE</span>
      <span style={{ color: T.emerald, fontWeight: 600 }}>{branding.website || "www.jbj.ae"}</span>
    </div>
  );
}

// ---------- PAGE 1 — Cover + AI selections ----------
function CoverPage({
  branding,
  projects,
  clientName,
  pageIdPrefix,
}: {
  branding: ReportBranding;
  projects: ReportProject[];
  clientName?: string;
  pageIdPrefix: string;
}) {
  const showPhoto = (branding.mode === "both" || branding.mode === "photo") && branding.photoDataUrl;
  const showBrandingStrip = branding.mode !== "none";
  const isInvestor = branding.role === "investor";
  const displayName = (clientName || branding.name || "").trim();

  return (
    <PageFrame
      id={`${pageIdPrefix}-page-1`}
      pageLabel="AI Home Finder — Personalized Report"
      branding={branding}
    >
      {/* Salutation / Prepared-by strip */}
      {showBrandingStrip && isInvestor && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "16px 0 18px 0",
            borderBottom: `1px solid ${T.goldHair}`,
            marginBottom: 18,
          }}
        >
          {showPhoto ? (
            <img
              src={branding.photoDataUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                height: 72,
                width: 72,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${T.gold}`,
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                height: 72,
                width: 72,
                borderRadius: "50%",
                background: T.raised,
                border: `2px solid ${T.gold}`,
                color: T.ink,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              {(displayName || "C").charAt(0).toUpperCase()}
            </div>
          )}
          <div style={{ lineHeight: 1.3 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                fontWeight: 700,
                color: T.emerald,
              }}
            >
              Curated personally for
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.ink, marginTop: 4 }}>
              {`${branding.salutation || "Mr."} ${displayName || "Valued Client"}`.trim()}
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
              A bespoke selection presented by JBJ Global Real Estate
            </div>
          </div>
        </div>
      )}
      {showBrandingStrip && !isInvestor && (
        <div
          style={{
            display: "flex",
            gap: 14,
            padding: "14px 0",
            borderBottom: `1px solid ${T.goldHair}`,
            marginBottom: 18,
          }}
        >
          {showPhoto && (
            <img
              src={branding.photoDataUrl}
              alt=""
              crossOrigin="anonymous"
              style={{
                height: 60,
                width: 60,
                borderRadius: "50%",
                objectFit: "cover",
                border: `2px solid ${T.gold}`,
              }}
            />
          )}
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                fontWeight: 700,
                color: T.emerald,
              }}
            >
              Prepared by — {ROLE_LABELS[branding.role]}
            </div>
            {branding.name && <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{branding.name}</div>}
            {branding.companyName && <div style={{ color: T.ink }}>{branding.companyName}</div>}
            {(branding.phone || branding.email) && (
              <div style={{ color: T.muted }}>{[branding.phone, branding.email].filter(Boolean).join("  •  ")}</div>
            )}
            {(branding.whatsapp || branding.website) && (
              <div style={{ color: T.muted }}>
                {[branding.whatsapp && `WhatsApp: ${branding.whatsapp}`, branding.website].filter(Boolean).join("  •  ")}
              </div>
            )}
            {branding.address && <div style={{ color: T.muted }}>{branding.address}</div>}
            {branding.license && <div style={{ color: T.muted }}>{branding.license}</div>}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.ink, margin: "0 0 14px 0" }}>
        Your AI-Selected Properties
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {projects.slice(0, 3).map((p, i) => (
          <div
            key={p.id}
            style={{
              display: "flex",
              gap: 14,
              padding: 10,
              borderRadius: 6,
              background: T.surface,
              border: `1px solid ${T.goldHair}`,
            }}
          >
            <div
              style={{
                width: 140,
                height: 96,
                borderRadius: 4,
                background: T.raised,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {(p.cover_image_url || p.images?.[0]?.image_url) && (
                <img
                  src={p.cover_image_url || p.images?.[0]?.image_url}
                  alt=""
                  crossOrigin="anonymous"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: T.gold, letterSpacing: 1 }}>
                RANK #{i + 1}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: T.ink,
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {p.name}
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 1 }}>
                {[p.developer?.name, p.area].filter(Boolean).join(" • ")}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#B45309", marginTop: 4 }}>
                {fmtPrice(p)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 10, marginTop: 18, color: T.muted, fontStyle: "italic" }}>
        The full report continues with a per-property comparison, deep analysis, and a closing summary.
      </p>
    </PageFrame>
  );
}

// ---------- PAGE 2 — Property comparison ----------
function ComparisonPage({
  branding,
  projects,
  pageIdPrefix,
}: {
  branding: ReportBranding;
  projects: ReportProject[];
  pageIdPrefix: string;
}) {
  const rows: { label: string; value: (p: ReportProject) => string }[] = [
    { label: "Price", value: (p) => fmtPrice(p) },
    { label: "Developer", value: (p) => p.developer?.name || "—" },
    { label: "Area", value: (p) => p.area || "—" },
    { label: "Bedrooms", value: (p) => fmtBeds(p) },
    { label: "Type", value: (p) => p.property_type || "Off-Plan" },
    { label: "Handover", value: (p) => fmtHandover(p) },
  ];

  const top3 = projects.slice(0, 3);

  return (
    <PageFrame
      id={`${pageIdPrefix}-page-2`}
      pageLabel="Page 2 · Property Comparison"
      branding={branding}
    >
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.ink, margin: "0 0 6px 0" }}>
        How each property matches your requirements
      </h2>
      <p style={{ fontSize: 11, color: T.muted, margin: "0 0 16px 0" }}>
        Side-by-side comparison of the top three picks from your AI-curated shortlist.
      </p>

      <div style={{ overflow: "hidden", borderRadius: 8, border: `1px solid ${T.goldHair}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.raised }}>
              <th
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  fontWeight: 800,
                  color: T.ink,
                  borderBottom: `1px solid ${T.goldHair}`,
                  width: "22%",
                }}
              >
                Criteria
              </th>
              {top3.map((p, i) => (
                <th
                  key={p.id}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    fontWeight: 800,
                    color: T.ink,
                    borderBottom: `1px solid ${T.goldHair}`,
                  }}
                >
                  #{i + 1} {p.name.length > 22 ? p.name.slice(0, 20) + "…" : p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.label} style={{ background: ri % 2 ? T.surface : "#FFFFFF" }}>
                <td
                  style={{
                    padding: "10px 12px",
                    fontWeight: 700,
                    color: T.ink,
                    borderTop: `1px solid ${T.goldHair}`,
                  }}
                >
                  {row.label}
                </td>
                {top3.map((p) => (
                  <td
                    key={p.id}
                    style={{
                      padding: "10px 12px",
                      color: T.muted,
                      borderTop: `1px solid ${T.goldHair}`,
                    }}
                  >
                    {row.value(p)}
                  </td>
                ))}
              </tr>
            ))}
            <tr data-no-contrast-guard data-surface="emerald" data-on-dark>
              <td
                data-no-contrast-guard
                data-on-dark
                style={{
                  padding: "12px",
                  fontWeight: 800,
                  background: T.emerald,
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                }}
              >
                Match summary
              </td>
              {top3.map((p, i) => (
                <td
                  key={p.id}
                  data-no-contrast-guard
                  data-on-dark
                  style={{
                    padding: "12px",
                    fontWeight: 800,
                    background: T.emerald,
                    color: "#FFFFFF",
                    WebkitTextFillColor: "#FFFFFF",
                  }}
                >
                  {["Best fit", "Strong fit", "Good fit"][i] || "Fit"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 10, marginTop: 14, color: T.muted, fontStyle: "italic" }}>
        Match scoring is computed from your AI-Home-Finder brief: budget alignment, location preference,
        property type, bedroom mix, and developer reputation.
      </p>
    </PageFrame>
  );
}

// ---------- PAGE N — Per-property deep dive (PDF only) ----------
function PropertyDetailPage({
  branding,
  project,
  index,
  pageIdPrefix,
}: {
  branding: ReportBranding;
  project: ReportProject;
  index: number;
  pageIdPrefix: string;
}) {
  const cover = project.cover_image_url || project.images?.[0]?.image_url;
  const amenities = (project.amenities || []).filter(Boolean).slice(0, 12);
  const description = stripHtml(project.description || "");

  return (
    <PageFrame
      id={`${pageIdPrefix}-page-detail-${index}`}
      pageLabel={`Page ${index + 3} · Property #${index + 1}`}
      branding={branding}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            background: T.emerald,
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 1,
            borderRadius: 999,
          }}
        >
          RANK #{index + 1}
        </span>
        <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>
          {[project.developer?.name, project.area].filter(Boolean).join(" • ")}
        </span>
      </div>

      <h2 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: "0 0 12px 0", lineHeight: 1.15 }}>
        {project.name}
      </h2>

      {cover && (
        <div
          style={{
            width: "100%",
            height: 240,
            borderRadius: 8,
            overflow: "hidden",
            background: T.raised,
            marginBottom: 16,
            border: `1px solid ${T.goldHair}`,
          }}
        >
          <img
            src={cover}
            alt=""
            crossOrigin="anonymous"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[
          { label: "Price", value: fmtPrice(project), accent: true },
          { label: "Bedrooms", value: fmtBeds(project) },
          { label: "Handover", value: fmtHandover(project) },
        ].map((f) => (
          <div
            key={f.label}
            style={{
              padding: "10px 12px",
              borderRadius: 6,
              background: T.surface,
              border: `1px solid ${T.goldHair}`,
            }}
          >
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: T.muted, fontWeight: 700 }}>
              {f.label}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                marginTop: 4,
                color: f.accent ? "#B45309" : T.ink,
              }}
            >
              {f.value}
            </div>
          </div>
        ))}
      </div>

      {description && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T.emerald, margin: "0 0 6px 0", letterSpacing: 0.5 }}>
            OVERVIEW
          </h3>
          <p style={{ fontSize: 12, color: T.ink, lineHeight: 1.6, margin: 0 }}>
            {description.length > 800 ? description.slice(0, 780).trimEnd() + "…" : description}
          </p>
        </div>
      )}

      {amenities.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: T.emerald, margin: "0 0 8px 0", letterSpacing: 0.5 }}>
            KEY AMENITIES
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {amenities.map((a) => (
              <span
                key={a}
                style={{
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: T.surface,
                  border: `1px solid ${T.goldHair}`,
                  color: T.ink,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 16,
          padding: 14,
          borderRadius: 8,
          background: T.surface,
          border: `1px solid ${T.goldHair}`,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 800, color: T.emerald, margin: "0 0 6px 0", letterSpacing: 0.5 }}>
          INVESTMENT NOTE
        </h3>
        <p style={{ fontSize: 11, color: T.ink, lineHeight: 1.6, margin: 0 }}>
          {project.developer?.name || "This developer"}'s track record in {project.area || "this community"},
          combined with the off-plan payment plan flexibility, makes this a strong candidate for both end-users
          and capital-appreciation focused investors. Your JBJ consultant can model exact ROI, rental yield
          projections, and payment schedule against your liquidity profile.
        </p>
      </div>
    </PageFrame>
  );
}

// ---------- Closing page (PDF only) ----------
function ClosingPage({
  branding,
  pageIdPrefix,
}: {
  branding: ReportBranding;
  pageIdPrefix: string;
}) {
  return (
    <PageFrame
      id={`${pageIdPrefix}-page-closing`}
      pageLabel="Next steps with JBJ"
      branding={branding}
    >
      <h2 style={{ fontSize: 26, fontWeight: 800, color: T.ink, margin: "0 0 12px 0" }}>
        Ready to take the next step?
      </h2>
      <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: 600 }}>
        Your JBJ Global Real Estate consultant is ready to walk you through these recommendations, arrange
        viewings, negotiate exclusive incentives with developers, and structure the payment plan that best
        fits your portfolio.
      </p>

      <div
        style={{
          padding: 22,
          borderRadius: 10,
          backgroundImage: T.emeraldGradient,
          backgroundColor: T.emerald,
          color: "#FFFFFF",
          marginBottom: 20,
          border: `1px solid ${T.gold}`,
        }}
        data-no-contrast-guard
        data-surface="emerald"
        data-on-dark
      >
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "#A7F3D0", fontWeight: 700 }}>
          Speak with JBJ
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", margin: "8px 0 4px 0" }}>
          CONTACT@JBJ.AE
        </div>
        <div style={{ fontSize: 13, color: "#FFFFFF", opacity: 0.92 }}>
          Dubai, UAE · www.jbj.ae · Reply within 24 hours
        </div>
      </div>

      <div
        style={{
          padding: 16,
          borderRadius: 8,
          background: T.surface,
          border: `1px solid ${T.goldHair}`,
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 800, color: T.emerald, margin: "0 0 8px 0", letterSpacing: 0.5 }}>
          WHAT WE'LL COVER
        </h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: T.ink, fontSize: 12, lineHeight: 1.8 }}>
          <li>Detailed walkthrough of each shortlisted project, including floor plans</li>
          <li>Comparative ROI &amp; rental-yield modelling for your budget</li>
          <li>Developer-direct payment plan options and exclusive incentives</li>
          <li>Site visits or virtual tours at your convenience</li>
          <li>Mortgage and structuring guidance via our partner network</li>
        </ul>
      </div>

      <p style={{ fontSize: 10, color: T.muted, fontStyle: "italic", marginTop: 18 }}>
        Prepared for {branding.name || "Valued Client"} by JBJ Global Real Estate. All figures are indicative
        and subject to developer confirmation at point of reservation.
      </p>
    </PageFrame>
  );
}

// ---------- Engine ----------
export function ReportEngine({
  mode,
  branding,
  projects,
  clientName,
  pageIdPrefix = "report",
}: ReportEngineProps) {
  const safeProjects = projects.slice(0, 3);
  const showExtended = mode === "pdf";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <CoverPage
        branding={branding}
        projects={safeProjects}
        clientName={clientName}
        pageIdPrefix={pageIdPrefix}
      />
      <ComparisonPage branding={branding} projects={safeProjects} pageIdPrefix={pageIdPrefix} />
      {showExtended &&
        safeProjects.map((p, i) => (
          <PropertyDetailPage
            key={p.id}
            branding={branding}
            project={p}
            index={i}
            pageIdPrefix={pageIdPrefix}
          />
        ))}
      {showExtended && <ClosingPage branding={branding} pageIdPrefix={pageIdPrefix} />}
    </div>
  );
}

export default ReportEngine;
