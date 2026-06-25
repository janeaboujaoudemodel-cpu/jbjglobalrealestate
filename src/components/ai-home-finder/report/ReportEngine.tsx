/**
 * AI Home Finder ReportEngine — JBJ proposal template.
 *
 * This is the single source of truth for the live preview AND the exported PDF.
 * Every page is a fixed A4 canvas, so PDF capture never slices content or creates
 * broken page gaps. Keep all report/PDF palette values in `tokens.ts` only.
 */
import React from "react";
import jbjMonogram from "@/assets/jbj-monogram-letterhead.png";
import { COMPANY_CONTACT, TRADE_LICENSE_BRAND, TRADE_LICENSE_NUMBER, TRADE_LICENSE_OFFICE } from "@/config/companyLegal";
import { getDeveloperLogoUrl, isValidDeveloperLogoUrl } from "@/utils/developerLogo";
import { proxyAnyDownloadUrl } from "@/utils/downloadProxy";
import { buildCriteriaRowsForExport, computeMatchTotals, type CriterionRow, type Verdict } from "@/components/matchmaker/MatchCriteriaTable";
import { REPORT_TOKENS as T, REPORT_PAGE_PX, TYPE, SP, PAGE_SEP_VAR, ROLE_LABELS } from "./tokens";
import type { ReportBranding } from "../ReportPreviewModal";

/** Render-mode context: lets PremiumImage opt-in to CORS only when capturing to PDF. */
const ReportModeContext = React.createContext<"preview" | "pdf">("preview");


const APP_ASSET_URLS = import.meta.glob("../../../assets/**/*.{png,jpg,jpeg,webp,avif,gif,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export interface ReportProject {
  id: string;
  slug?: string;
  name: string;
  emirate?: string | null;
  location?: string | null;
  area?: string | null;
  area_name?: string | null;
  cover_image_url?: string | null;
  feature_image_url?: string | null;
  card_image_url?: string | null;
  hero_image_url?: string | null;
  images?: { image_url: string; alt_text?: string | null; display_order?: number | null }[];
  developer?: { name?: string; logo_url?: string | null; slug?: string | null } | null;
  developer_name?: string | null;
  price_from?: number | null;
  price_to?: number | null;
  bedrooms_min?: number | null;
  bedrooms_max?: number | null;
  property_type?: string | null;
  property_type_label?: string | null;
  unit_types?: string[] | null;
  description?: string | null;
  handover_date?: string | null;
  handover_quarter?: string | null;
  handover_year?: number | null;
  construction_status?: string | null;
  payment_plan?: string | null;
  amenities?: string[] | null;
  views?: string[] | null;
}

export interface ReportEngineProps {
  mode: "preview" | "pdf";
  branding: ReportBranding;
  projects: ReportProject[];
  clientName?: string;
  clientRequirements?: Record<string, string | string[]>;
  pageIdPrefix?: string;
}

const WHITE = "#FFFFFF";
const PRICE = T.gold;
const BRAND_LINE = `${TRADE_LICENSE_BRAND} · Trade License ${TRADE_LICENSE_NUMBER}`;

const escText = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const titleCase = (value: string) => value.replace(/[-_]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

const stripHtml = (s?: string | null) =>
  escText(s || "")
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

const clamp = (s: string, max = 220) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s);

function unwrapNextImageProxy(src: string): string {
  if (!src.includes("/_next/image")) return src;
  try {
    const parsed = new URL(src);
    const inner = parsed.searchParams.get("url");
    const decoded = inner ? decodeURIComponent(inner) : "";
    return decoded.startsWith("http") ? decoded : src;
  } catch {
    return src;
  }
}

function resolveReportAsset(src?: string | null): string | undefined {
  if (!src) return undefined;
  const resolved = unwrapNextImageProxy(src.trim());
  if (!resolved) return undefined;
  if (resolved.startsWith("/src/assets/")) {
    const key = "../../../assets" + resolved.slice("/src/assets".length);
    return APP_ASSET_URLS[key] ?? resolved;
  }
  if (resolved.startsWith("src/assets/")) {
    const key = "../../../assets" + resolved.slice("src/assets".length);
    return APP_ASSET_URLS[key] ?? resolved;
  }
  if (/^https?:\/\//i.test(resolved)) {
    const proxied = proxyAnyDownloadUrl(resolved, { disposition: "inline" });
    return proxied || resolved;
  }
  return resolved;
}

const projectImage = (p: ReportProject) => {
  const ordered = [...(p.images || [])].sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999));
  return resolveReportAsset(
    p.cover_image_url ||
      ordered.find((img) => Boolean(img?.image_url))?.image_url ||
      p.hero_image_url ||
      p.card_image_url ||
      p.feature_image_url ||
      null
  );
};

const developerName = (p: ReportProject) => escText(p.developer?.name || p.developer_name || "Developer on request");
const developerLogo = (p: ReportProject) => {
  const url = getDeveloperLogoUrl(p.developer || null) || (isValidDeveloperLogoUrl(p.developer?.logo_url) ? p.developer?.logo_url : null);
  return resolveReportAsset(url || null);
};
const locationText = (p: ReportProject) => escText([p.area || p.area_name || p.location, p.emirate].filter(Boolean).join(", ")) || "Dubai, UAE";

const fmtPrice = (p: ReportProject) => {
  if (!p.price_from) return "Price on Request";
  const money = (n: number) => (n >= 1_000_000 ? `AED ${(n / 1_000_000).toFixed(1)}M` : `AED ${Math.round(n / 1000)}K`);
  if (p.price_to && p.price_to > p.price_from) return `${money(p.price_from)} – ${money(p.price_to)}`;
  return `From ${money(p.price_from)}`;
};

const fmtBeds = (p: ReportProject) => {
  if (p.bedrooms_min == null && p.bedrooms_max == null) return "Bedroom mix on request";
  const min = p.bedrooms_min ?? p.bedrooms_max ?? 0;
  const max = p.bedrooms_max ?? min;
  if (min === 0) return `Studio${max > 0 ? ` – ${max} BR` : ""}`;
  if (min === max) return `${min} BR`;
  return `${min} – ${max} BR`;
};

const fmtHandover = (p: ReportProject) => {
  if (p.handover_quarter && p.handover_year) return `${p.handover_quarter} ${p.handover_year}`;
  if (p.handover_year) return String(p.handover_year);
  if (p.handover_date) return p.handover_date;
  return p.construction_status || "On request";
};

const fmtType = (p: ReportProject) => p.property_type_label || p.property_type || p.unit_types?.slice(0, 2).join(" / ") || "Off-plan property";
const todayStr = () => new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

const requirementLabels: Record<string, string> = {
  property_type: "Property type",
  purpose: "Primary purpose",
  budget: "Budget range",
  bedrooms: "Bedrooms",
  emirate: "Preferred emirate",
  areas: "Preferred areas",
  location_type: "Location profile",
  views_and_features: "Views & features",
  timeline: "Timeline",
  payment_preference: "Payment structure",
};

const answerLabels: Record<string, string> = {
  apartment: "Apartment / Flat",
  villa: "Villa",
  townhouse: "Townhouse",
  penthouse: "Penthouse",
  plot: "Plot / Land",
  retail: "Retail / Commercial",
  investment: "Investment",
  living: "Personal Residence",
  both: "Both Investment & Living",
  rental: "Rental Income",
  "under-1m": "Under AED 1M",
  "1m-2m": "AED 1M – 2M",
  "2m-5m": "AED 2M – 5M",
  "5m-10m": "AED 5M – 10M",
  "10m-plus": "AED 10M+",
  studio: "Studio",
  "1br": "1 Bedroom",
  "2br": "2 Bedrooms",
  "3br": "3 Bedrooms",
  "4br-plus": "4+ Bedrooms",
  dubai: "Dubai",
  "abu-dhabi": "Abu Dhabi",
  sharjah: "Sharjah",
  "ras-al-khaimah": "Ras Al Khaimah",
  ajman: "Ajman",
  fujairah: "Fujairah",
  "umm-al-quwain": "Umm Al Quwain",
  any: "Open to any emirate",
  downtown: "Downtown Dubai",
  marina: "Dubai Marina",
  palm: "Palm Jumeirah",
  "business-bay": "Business Bay",
  "creek-harbour": "Dubai Creek Harbour",
  hills: "Dubai Hills Estate",
  "arabian-ranches": "Arabian Ranches",
  other: "Other Areas",
  beachfront: "Beachfront / Waterfront",
  "city-center": "City Center / Downtown",
  "golf-community": "Golf Course Community",
  suburban: "Suburban / Family Area",
  flexible: "Flexible",
  "sea-view": "Sea / Water View",
  "city-view": "City / Skyline View",
  "private-pool": "Private Pool",
  "private-garden": "Private Garden",
  "maid-room": "Maid's Room",
  balcony: "Large Balcony / Terrace",
  ready: "Ready to Move",
  "2025": "2025",
  "2026": "2026",
  "2027-plus": "2027 or Later",
  cash: "Full Cash Payment",
  "payment-plan": "Developer Payment Plan",
  mortgage: "Bank Mortgage",
};

function displayAnswer(value: string | string[]) {
  const values = Array.isArray(value) ? value : [value];
  return values.map((v) => answerLabels[v] || titleCase(v)).join(", ");
}

function buildRequirementItems(answers?: Record<string, string | string[]>) {
  if (!answers) return [];
  return Object.entries(answers)
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Boolean(value)))
    .map(([key, value]) => ({ label: requirementLabels[key] || titleCase(key), value: displayAnswer(value) }))
    .slice(0, 10);
}

function recommendationVerdict(rows: CriterionRow[], projectIndex: number) {
  if (!rows.length) return { label: ["Best overall fit", "Strong alternative", "Additional option"][projectIndex] || "Recommended", detail: "Ranked by price, location, developer profile, and purchase suitability." };
  const totals = computeMatchTotals(rows, projectIndex);
  const score = totals.total ? Math.round(((totals.match + totals.close * 0.55) / totals.total) * 100) : 0;
  return {
    label: projectIndex === 0 ? "Recommended lead option" : projectIndex === 1 ? "Strong comparable option" : "Portfolio alternative",
    detail: `${totals.match}/${totals.total} exact matches · ${totals.close} close · ${score}% weighted fit`,
  };
}

function PlainText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <span style={{ color: T.ink, WebkitTextFillColor: T.ink, ...style }}>{children}</span>;
}

function PremiumImage({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = React.useState(false);
  if (!src || failed) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: T.raised,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.muted,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        Project image pending
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      crossOrigin="anonymous"
      loading="eager"
      decoding="sync"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

function OfficialDeveloperLogo({ project, size = 52 }: { project: ReportProject; size?: number }) {
  const logo = developerLogo(project);
  if (!logo) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: WHITE,
        border: `1px solid ${T.goldHair}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 5,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <img
        src={logo}
        alt={`${developerName(project)} logo`}
        crossOrigin="anonymous"
        loading="eager"
        decoding="sync"
        style={{ maxWidth: "100%", maxHeight: "100%", width: "auto", height: "auto", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}

function PageFrame({
  id,
  children,
  pageLabel,
  section,
  branding,
}: {
  id: string;
  children: React.ReactNode;
  pageLabel: string;
  section: string;
  branding: ReportBranding;
}) {
  return (
    <div
      data-report-page
      data-report-template="ai-home-finder-jbj-proposal"
      id={id}
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
        flexShrink: 0,
      }}
    >
      <PageHeader pageLabel={pageLabel} section={section} branding={branding} />
      <main style={{ flex: 1, minHeight: 0, padding: "24px 42px 18px", boxSizing: "border-box", overflow: "hidden" }}>{children}</main>
      <PageFooter branding={branding} />
    </div>
  );
}

function PageHeader({ pageLabel, section, branding }: { pageLabel: string; section: string; branding: ReportBranding }) {
  const uploadedLogo = (branding.mode === "both" || branding.mode === "logo") && branding.logoDataUrl;
  return (
    <header
      data-no-contrast-guard
      data-surface="emerald"
      data-on-dark
      style={{
        height: 90,
        padding: "13px 42px",
        boxSizing: "border-box",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundImage: T.emeraldGradient,
        backgroundColor: T.emeraldDeep,
        borderBottom: `1px solid ${T.gold}`,
        color: WHITE,
        WebkitTextFillColor: WHITE,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div
          style={{
            height: 64,
            width: 64,
            borderRadius: 6,
            background: WHITE,
            border: `1px solid ${T.gold}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            padding: uploadedLogo ? 5 : 0,
            flexShrink: 0,
          }}
        >
          <img
            src={uploadedLogo ? branding.logoDataUrl : jbjMonogram}
            alt={uploadedLogo ? "Report logo" : "JBJ Global Real Estate"}
            crossOrigin="anonymous"
            loading="eager"
            decoding="sync"
            style={{ width: uploadedLogo ? "100%" : 62, height: uploadedLogo ? "100%" : 62, objectFit: "contain", display: "block" }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.13em", color: WHITE, WebkitTextFillColor: WHITE, whiteSpace: "nowrap" }}>
            {TRADE_LICENSE_BRAND}
          </div>
          <div style={{ marginTop: 5, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ height: 1, width: 28, background: T.gold, display: "inline-block" }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: WHITE, WebkitTextFillColor: WHITE }}>
              {section}
            </span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: WHITE, WebkitTextFillColor: WHITE }}>{pageLabel}</div>
        <div style={{ fontSize: 10, marginTop: 4, color: WHITE, WebkitTextFillColor: WHITE, opacity: 0.86 }}>{todayStr()}</div>
      </div>
    </header>
  );
}

function PageFooter({ branding }: { branding: ReportBranding }) {
  const contact = [branding.phone || COMPANY_CONTACT.phone, branding.email || COMPANY_CONTACT.email, branding.website || COMPANY_CONTACT.website].filter(Boolean).join(" · ");
  return (
    <footer
      style={{
        height: 44,
        padding: "9px 42px",
        boxSizing: "border-box",
        flexShrink: 0,
        fontSize: 9.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        background: T.surface,
        color: T.ink,
        borderTop: `1px solid ${T.gold}`,
      }}
    >
      <span style={{ color: T.ink, WebkitTextFillColor: T.ink, fontWeight: 700, letterSpacing: "0.04em" }}>{BRAND_LINE}</span>
      <span style={{ color: T.ink, WebkitTextFillColor: T.ink, textAlign: "right", maxWidth: 380, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact}</span>
    </footer>
  );
}

function SectionEyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 900,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: light ? WHITE : T.emerald,
        WebkitTextFillColor: light ? WHITE : T.emerald,
        marginBottom: 7,
      }}
    >
      {children}
    </div>
  );
}

function FieldCard({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div style={{ padding: "11px 12px", borderRadius: 7, background: T.surface, border: `1px solid ${T.goldHair}`, minHeight: 62 }}>
      <div style={{ fontSize: 8.8, textTransform: "uppercase", letterSpacing: "0.12em", color: T.muted, WebkitTextFillColor: T.muted, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 900, color: accent ? PRICE : T.ink, WebkitTextFillColor: accent ? PRICE : T.ink, marginTop: 5, lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function CoverPage({ branding, projects, clientName, pageIdPrefix, requirements }: { branding: ReportBranding; projects: ReportProject[]; clientName?: string; pageIdPrefix: string; requirements: Array<{ label: string; value: string }> }) {
  const displayName = escText(clientName || branding.name || "Valued Client");
  const isInvestor = branding.role === "investor";
  const greeting = isInvestor ? `Curated personally for ${branding.salutation || "Mr."} ${displayName}` : `Prepared for ${displayName}`;
  const hero = projects[0];
  return (
    <PageFrame id={`${pageIdPrefix}-cover`} pageLabel="Cover" section="AI Home Finder Proposal" branding={branding}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 236px", gap: 22, height: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <SectionEyebrow>Private client proposal</SectionEyebrow>
          <h1 style={{ fontSize: 40, lineHeight: 1.02, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink, margin: "0 0 12px", letterSpacing: 0 }}>
            AI Home Finder<br />Recommendation Report
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: T.ink, WebkitTextFillColor: T.ink, margin: "0 0 20px", maxWidth: 440 }}>
            {greeting}. A focused shortlist of developer-direct property options prepared as a premium JBJ business proposal.
          </p>

          <div data-no-contrast-guard data-on-dark style={{ backgroundImage: T.emeraldGradient, backgroundColor: T.emeraldDeep, borderRadius: 9, border: `1px solid ${T.gold}`, padding: 18, color: WHITE, WebkitTextFillColor: WHITE, marginBottom: 18 }}>
            <SectionEyebrow light>Report scope</SectionEyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
              {["Client requirements", "Matched properties", "Comparison matrix", "Consultant next steps"].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, color: WHITE, WebkitTextFillColor: WHITE }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: T.gold, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: WHITE, WebkitTextFillColor: WHITE }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginBottom: 16 }}>
            {(requirements.length ? requirements.slice(0, 6) : [
              { label: "Brief", value: "Purchase-focused property search" },
              { label: "Market", value: "Dubai, UAE" },
              { label: "Selection", value: "Top 3 recommendations" },
              { label: "Prepared by", value: TRADE_LICENSE_BRAND },
            ]).map((r) => <FieldCard key={r.label} label={r.label} value={r.value} />)}
          </div>

          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${T.goldHair}` }}>
            <div style={{ fontSize: 10, color: T.muted, WebkitTextFillColor: T.muted, lineHeight: 1.6 }}>
              {TRADE_LICENSE_OFFICE} · {COMPANY_CONTACT.phone} · {COMPANY_CONTACT.email}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ height: 350, borderRadius: 9, overflow: "hidden", border: `1px solid ${T.gold}`, background: T.raised }}>
            <PremiumImage src={hero ? projectImage(hero) : undefined} alt={hero?.name || "JBJ selected property"} />
          </div>
          <div style={{ padding: 14, borderRadius: 9, background: T.surface, border: `1px solid ${T.goldHair}` }}>
            <SectionEyebrow>Lead recommendation</SectionEyebrow>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.15, color: T.ink, WebkitTextFillColor: T.ink }}>{hero?.name || "Property shortlist"}</div>
            <div style={{ marginTop: 6, fontSize: 11, color: T.muted, WebkitTextFillColor: T.muted }}>{hero ? `${developerName(hero)} · ${locationText(hero)}` : "Prepared by JBJ"}</div>
            <div style={{ marginTop: 10, fontSize: 15, fontWeight: 900, color: PRICE, WebkitTextFillColor: PRICE }}>{hero ? fmtPrice(hero) : "Private proposal"}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
            {projects.slice(0, 3).map((p, i) => (
              <div key={p.id} style={{ height: 76, borderRadius: 7, overflow: "hidden", position: "relative", border: `1px solid ${T.goldHair}` }}>
                <PremiumImage src={projectImage(p)} alt={p.name} />
                <div data-no-contrast-guard data-on-dark style={{ position: "absolute", left: 6, top: 6, width: 22, height: 22, borderRadius: 999, backgroundImage: T.emeraldGradient, color: WHITE, WebkitTextFillColor: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageFrame>
  );
}

function ClientRequirementsPage({ branding, pageIdPrefix, requirements, projects }: { branding: ReportBranding; pageIdPrefix: string; requirements: Array<{ label: string; value: string }>; projects: ReportProject[] }) {
  const requirementSet = requirements.length ? requirements : [
    { label: "Search mandate", value: "Find the strongest purchase options based on availability, location, budget and end-user/investor fit." },
    { label: "Selection count", value: `${projects.length} matched properties` },
    { label: "Due diligence", value: "Developer profile, payment flexibility, location quality and resale potential." },
  ];
  return (
    <PageFrame id={`${pageIdPrefix}-requirements`} pageLabel="Client requirements" section="Client Brief" branding={branding}>
      <SectionEyebrow>Client requirements</SectionEyebrow>
      <h2 style={{ fontSize: 29, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink, margin: "0 0 9px" }}>The purchase brief we matched against</h2>
      <p style={{ fontSize: 12.5, color: T.muted, WebkitTextFillColor: T.muted, lineHeight: 1.55, margin: "0 0 20px", maxWidth: 620 }}>
        The report prioritizes fit to the submitted AI Home Finder preferences, then checks each property against developer quality, price logic, delivery timeline, and practical next steps.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12, marginBottom: 18 }}>
        {requirementSet.slice(0, 10).map((r) => <FieldCard key={r.label} label={r.label} value={r.value} />)}
      </div>
      <div data-no-contrast-guard data-on-dark style={{ backgroundImage: T.emeraldGradient, backgroundColor: T.emeraldDeep, borderRadius: 10, border: `1px solid ${T.gold}`, padding: 18, color: WHITE, WebkitTextFillColor: WHITE }}>
        <SectionEyebrow light>JBJ selection method</SectionEyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[
            ["1", "Filter", "Remove sold-out, leasing or unsuitable inventory."],
            ["2", "Rank", "Score against budget, bedroom mix, location and timeline."],
            ["3", "Curate", "Present a balanced shortlist with practical consultant actions."],
          ].map(([n, h, d]) => (
            <div key={n} style={{ color: WHITE, WebkitTextFillColor: WHITE }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: WHITE, WebkitTextFillColor: WHITE }}>{n}</div>
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 900, color: WHITE, WebkitTextFillColor: WHITE }}>{h}</div>
              <div style={{ marginTop: 5, fontSize: 11, lineHeight: 1.5, color: WHITE, WebkitTextFillColor: WHITE, opacity: 0.92 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {projects.map((p, i) => (
          <div key={p.id} style={{ borderRadius: 8, background: T.surface, border: `1px solid ${T.goldHair}`, padding: 12 }}>
            <div style={{ fontSize: 9, color: T.emerald, WebkitTextFillColor: T.emerald, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>Option #{i + 1}</div>
            <div style={{ marginTop: 5, fontSize: 13, lineHeight: 1.25, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink }}>{p.name}</div>
            <div style={{ marginTop: 5, fontSize: 10.5, color: T.muted, WebkitTextFillColor: T.muted }}>{fmtPrice(p)}</div>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}

function MatchedPropertiesPage({ branding, projects, pageIdPrefix, criteriaRows }: { branding: ReportBranding; projects: ReportProject[]; pageIdPrefix: string; criteriaRows: CriterionRow[] }) {
  return (
    <PageFrame id={`${pageIdPrefix}-matched-properties`} pageLabel="Matched properties" section="Shortlist" branding={branding}>
      <SectionEyebrow>Matched properties</SectionEyebrow>
      <h2 style={{ fontSize: 29, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink, margin: "0 0 15px" }}>Top options selected for this client</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {projects.map((p, i) => {
          const verdict = recommendationVerdict(criteriaRows, i);
          return (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "224px 1fr", gap: 16, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.goldHair}`, background: T.surface, minHeight: 178 }}>
              <div style={{ position: "relative", background: T.raised }}>
                <PremiumImage src={projectImage(p)} alt={p.name} />
                <div data-no-contrast-guard data-on-dark style={{ position: "absolute", left: 12, top: 12, minWidth: 72, height: 28, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: T.emeraldGradient, color: WHITE, WebkitTextFillColor: WHITE, fontSize: 10, fontWeight: 900, letterSpacing: "0.08em" }}>RANK #{i + 1}</div>
              </div>
              <div style={{ padding: "16px 16px 14px 0", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
                  <OfficialDeveloperLogo project={p} size={46} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 20, lineHeight: 1.12, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, WebkitTextFillColor: T.muted, marginTop: 3 }}>{developerName(p)} · {locationText(p)}</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                  <FieldCard label="Price" value={fmtPrice(p)} accent />
                  <FieldCard label="Bedrooms" value={fmtBeds(p)} />
                  <FieldCard label="Handover" value={fmtHandover(p)} />
                  <FieldCard label="Type" value={fmtType(p)} />
                </div>
                <div style={{ borderTop: `1px solid ${T.goldHair}`, paddingTop: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: T.emerald, WebkitTextFillColor: T.emerald }}>{verdict.label}</div>
                  <div style={{ fontSize: 11.2, lineHeight: 1.45, color: T.ink, WebkitTextFillColor: T.ink, marginTop: 3 }}>{verdict.detail}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageFrame>
  );
}

const verdictCopy: Record<Verdict, { label: string; tone: string }> = {
  match: { label: "Match", tone: T.emerald },
  close: { label: "Close", tone: T.gold },
  miss: { label: "Review", tone: T.muted },
};

function ComparisonPage({ branding, projects, pageIdPrefix, criteriaRows }: { branding: ReportBranding; projects: ReportProject[]; pageIdPrefix: string; criteriaRows: CriterionRow[] }) {
  const top3 = projects.slice(0, 3);
  const baseRows = [
    { label: "Price", userPick: "Commercial", cells: top3.map((p) => ({ verdict: "match" as Verdict, value: fmtPrice(p) })) },
    { label: "Developer", userPick: "Official developer", cells: top3.map((p) => ({ verdict: "match" as Verdict, value: developerName(p) })) },
    { label: "Location", userPick: "Preferred market", cells: top3.map((p) => ({ verdict: "close" as Verdict, value: locationText(p) })) },
    { label: "Bedrooms", userPick: "Client mix", cells: top3.map((p) => ({ verdict: "close" as Verdict, value: fmtBeds(p) })) },
    { label: "Handover", userPick: "Timeline", cells: top3.map((p) => ({ verdict: "close" as Verdict, value: fmtHandover(p) })) },
  ];
  const rows = (criteriaRows.length ? criteriaRows : baseRows).slice(0, 8);
  const totals = rows.length ? top3.map((_, i) => computeMatchTotals(rows as CriterionRow[], i)) : [];

  return (
    <PageFrame id={`${pageIdPrefix}-comparison`} pageLabel="Comparison matrix" section="Comparison" branding={branding}>
      <SectionEyebrow>Options comparison</SectionEyebrow>
      <h2 style={{ fontSize: 28, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink, margin: "0 0 13px" }}>Side-by-side decision matrix</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {top3.map((p, i) => (
          <div key={p.id} style={{ background: T.surface, border: `1px solid ${T.goldHair}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ height: 92, background: T.raised, position: "relative" }}>
              <PremiumImage src={projectImage(p)} alt={p.name} />
              <div data-no-contrast-guard data-on-dark style={{ position: "absolute", left: 8, top: 8, width: 26, height: 26, borderRadius: 999, backgroundImage: T.emeraldGradient, color: WHITE, WebkitTextFillColor: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{i + 1}</div>
            </div>
            <div style={{ padding: "9px 10px" }}>
              <div style={{ fontSize: 12.5, lineHeight: 1.2, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink }}>{clamp(p.name, 42)}</div>
              <div style={{ marginTop: 4, fontSize: 10, color: T.muted, WebkitTextFillColor: T.muted }}>{fmtPrice(p)}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.goldHair}` }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 10.6 }}>
          <thead>
            <tr style={{ background: T.raised }}>
              <th style={{ width: 132, textAlign: "left", padding: "9px", color: T.ink, WebkitTextFillColor: T.ink, fontWeight: 900, borderBottom: `1px solid ${T.goldHair}` }}>Requirement</th>
              {top3.map((p, i) => <th key={p.id} style={{ textAlign: "left", padding: "9px", color: T.ink, WebkitTextFillColor: T.ink, fontWeight: 900, borderBottom: `1px solid ${T.goldHair}` }}>#{i + 1} {clamp(p.name, 24)}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.label} style={{ background: ri % 2 ? T.surface : WHITE }}>
                <td style={{ padding: "8px 9px", verticalAlign: "top", borderTop: `1px solid ${T.goldHair}` }}>
                  <div style={{ fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink }}>{row.label}</div>
                  <div style={{ marginTop: 2, fontSize: 9.2, lineHeight: 1.25, color: T.muted, WebkitTextFillColor: T.muted }}>{clamp(row.userPick, 46)}</div>
                </td>
                {top3.map((p, i) => {
                  const cell = row.cells[i] || { verdict: "close" as Verdict, value: "On request" };
                  const v = verdictCopy[cell.verdict];
                  return (
                    <td key={p.id} style={{ padding: "8px 9px", verticalAlign: "top", borderTop: `1px solid ${T.goldHair}` }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 999, padding: "2px 7px", border: `1px solid ${v.tone}`, color: v.tone, WebkitTextFillColor: v.tone, fontSize: 8.8, fontWeight: 900, marginBottom: 4 }}>{v.label}</div>
                      <div style={{ color: T.ink, WebkitTextFillColor: T.ink, lineHeight: 1.28, fontWeight: 700 }}>{clamp(cell.value, 60)}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr data-no-contrast-guard data-on-dark>
              <td style={{ backgroundImage: T.emeraldGradient, backgroundColor: T.emeraldDeep, color: WHITE, WebkitTextFillColor: WHITE, padding: 10, fontWeight: 900 }}>Match summary</td>
              {totals.map((t, i) => <td key={i} style={{ backgroundImage: T.emeraldGradient, backgroundColor: T.emeraldDeep, color: WHITE, WebkitTextFillColor: WHITE, padding: 10, fontWeight: 900 }}>{i === 0 ? "Lead option" : "Comparable"} · {t.match}/{t.total} match</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </PageFrame>
  );
}

function PropertyDetailPage({ branding, project, index, pageIdPrefix, criteriaRows }: { branding: ReportBranding; project: ReportProject; index: number; pageIdPrefix: string; criteriaRows: CriterionRow[] }) {
  const description = clamp(stripHtml(project.description), 620);
  const amenities = (project.amenities || []).filter(Boolean).slice(0, 10);
  const views = (project.views || []).filter(Boolean).slice(0, 4);
  const verdict = recommendationVerdict(criteriaRows, index);
  return (
    <PageFrame id={`${pageIdPrefix}-property-${index + 1}`} pageLabel={`Property #${index + 1}`} section="Property Detail" branding={branding}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 252px", gap: 18, height: "100%" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div data-no-contrast-guard data-on-dark style={{ width: 82, height: 28, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: T.emeraldGradient, color: WHITE, WebkitTextFillColor: WHITE, fontSize: 10, fontWeight: 900, letterSpacing: "0.08em" }}>RANK #{index + 1}</div>
            <PlainText style={{ fontSize: 11, color: T.muted, WebkitTextFillColor: T.muted, fontWeight: 700 }}>{developerName(project)} · {locationText(project)}</PlainText>
          </div>
          <h2 style={{ fontSize: 30, lineHeight: 1.08, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink, margin: "0 0 12px" }}>{project.name}</h2>
          <div style={{ height: 246, borderRadius: 9, overflow: "hidden", background: T.raised, border: `1px solid ${T.goldHair}`, marginBottom: 13 }}>
            <PremiumImage src={projectImage(project)} alt={project.name} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 13 }}>
            <FieldCard label="Price" value={fmtPrice(project)} accent />
            <FieldCard label="Beds" value={fmtBeds(project)} />
            <FieldCard label="Handover" value={fmtHandover(project)} />
            <FieldCard label="Type" value={fmtType(project)} />
          </div>
          <div style={{ padding: 14, borderRadius: 9, background: WHITE, border: `1px solid ${T.goldHair}`, marginBottom: 12 }}>
            <SectionEyebrow>Overview</SectionEyebrow>
            <p style={{ fontSize: 11.4, lineHeight: 1.55, color: T.ink, WebkitTextFillColor: T.ink, margin: 0 }}>{description || `${project.name} is included as a suitable option in the shortlist based on the submitted search criteria, developer profile, and availability fit.`}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: 13, borderRadius: 8, background: T.surface, border: `1px solid ${T.goldHair}` }}>
              <SectionEyebrow>Why it matches</SectionEyebrow>
              <p style={{ fontSize: 11, lineHeight: 1.5, color: T.ink, WebkitTextFillColor: T.ink, margin: 0 }}>{verdict.label}. {verdict.detail}</p>
            </div>
            <div style={{ padding: 13, borderRadius: 8, background: T.surface, border: `1px solid ${T.goldHair}` }}>
              <SectionEyebrow>Next check</SectionEyebrow>
              <p style={{ fontSize: 11, lineHeight: 1.5, color: T.ink, WebkitTextFillColor: T.ink, margin: 0 }}>Confirm live availability, payment plan, floor/view premiums, service charges, and reservation terms with the developer.</p>
            </div>
          </div>
        </div>
        <aside style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ borderRadius: 9, background: T.surface, border: `1px solid ${T.goldHair}`, padding: 14 }}>
            <SectionEyebrow>Developer</SectionEyebrow>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 54 }}>
              <OfficialDeveloperLogo project={project} size={54} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 900, lineHeight: 1.2, color: T.ink, WebkitTextFillColor: T.ink }}>{developerName(project)}</div>
                {!developerLogo(project) && <div style={{ fontSize: 9.5, marginTop: 4, color: T.muted, WebkitTextFillColor: T.muted }}>Official logo not provided in backend</div>}
              </div>
            </div>
          </div>
          <div data-no-contrast-guard data-on-dark style={{ borderRadius: 9, backgroundImage: T.emeraldGradient, backgroundColor: T.emeraldDeep, border: `1px solid ${T.gold}`, padding: 15, color: WHITE, WebkitTextFillColor: WHITE }}>
            <SectionEyebrow light>AI recommendation</SectionEyebrow>
            <div style={{ fontSize: 18, lineHeight: 1.15, fontWeight: 900, color: WHITE, WebkitTextFillColor: WHITE }}>{verdict.label}</div>
            <p style={{ margin: "8px 0 0", fontSize: 11, lineHeight: 1.55, color: WHITE, WebkitTextFillColor: WHITE }}>{verdict.detail}. JBJ should verify final unit mix and pricing before reservation.</p>
          </div>
          <div style={{ borderRadius: 9, background: WHITE, border: `1px solid ${T.goldHair}`, padding: 13 }}>
            <SectionEyebrow>Key amenities</SectionEyebrow>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(amenities.length ? amenities : ["Amenities on request", ...views]).slice(0, 10).map((a) => (
                <span key={a} style={{ borderRadius: 999, border: `1px solid ${T.goldHair}`, background: T.surface, padding: "5px 8px", fontSize: 10, fontWeight: 800, color: T.ink, WebkitTextFillColor: T.ink }}>{a}</span>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: 9, background: T.surface, border: `1px solid ${T.goldHair}`, padding: 13 }}>
            <SectionEyebrow>Consultant action</SectionEyebrow>
            <ol style={{ margin: 0, paddingLeft: 17, fontSize: 10.7, lineHeight: 1.7, color: T.ink, WebkitTextFillColor: T.ink }}>
              <li>Request current unit availability.</li>
              <li>Confirm payment-plan milestones.</li>
              <li>Compare view/floor premiums.</li>
              <li>Reserve only after due diligence.</li>
            </ol>
          </div>
        </aside>
      </div>
    </PageFrame>
  );
}

function AiRecommendationSummaryPage({ branding, projects, pageIdPrefix, criteriaRows }: { branding: ReportBranding; projects: ReportProject[]; pageIdPrefix: string; criteriaRows: CriterionRow[] }) {
  const lead = projects[0];
  return (
    <PageFrame id={`${pageIdPrefix}-ai-summary`} pageLabel="AI summary" section="Recommendation" branding={branding}>
      <SectionEyebrow>AI recommendation summary</SectionEyebrow>
      <h2 style={{ fontSize: 30, lineHeight: 1.1, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink, margin: "0 0 14px" }}>Recommended route for the client</h2>
      <div data-no-contrast-guard data-on-dark style={{ backgroundImage: T.emeraldGradient, backgroundColor: T.emeraldDeep, borderRadius: 10, border: `1px solid ${T.gold}`, padding: 20, color: WHITE, WebkitTextFillColor: WHITE, marginBottom: 16 }}>
        <SectionEyebrow light>Lead recommendation</SectionEyebrow>
        <div style={{ fontSize: 25, lineHeight: 1.12, fontWeight: 900, color: WHITE, WebkitTextFillColor: WHITE }}>{lead?.name || "Top matched option"}</div>
        <p style={{ margin: "10px 0 0", fontSize: 12.4, lineHeight: 1.6, color: WHITE, WebkitTextFillColor: WHITE, maxWidth: 620 }}>
          Start with the lead option, then use the remaining properties as negotiating and comparison leverage. The recommendation should be validated against live unit availability and developer payment terms before booking.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {projects.map((p, i) => {
          const verdict = recommendationVerdict(criteriaRows, i);
          return (
            <div key={p.id} style={{ borderRadius: 9, background: T.surface, border: `1px solid ${T.goldHair}`, overflow: "hidden" }}>
              <div style={{ height: 120, background: T.raised }}><PremiumImage src={projectImage(p)} alt={p.name} /></div>
              <div style={{ padding: 12 }}>
                <div style={{ fontSize: 9, color: T.emerald, WebkitTextFillColor: T.emerald, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.14em" }}>Option #{i + 1}</div>
                <div style={{ marginTop: 5, fontSize: 14.5, lineHeight: 1.2, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink }}>{p.name}</div>
                <div style={{ marginTop: 6, fontSize: 10.5, color: T.muted, WebkitTextFillColor: T.muted }}>{verdict.detail}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ borderRadius: 9, background: WHITE, border: `1px solid ${T.goldHair}`, padding: 16 }}>
          <SectionEyebrow>Commercial guidance</SectionEyebrow>
          <p style={{ fontSize: 11.5, lineHeight: 1.65, color: T.ink, WebkitTextFillColor: T.ink, margin: 0 }}>Use this report as the opening analysis, not the final purchase instruction. JBJ should request official availability, floor plans, service-charge guidance and payment schedules before the client commits.</p>
        </div>
        <div style={{ borderRadius: 9, background: WHITE, border: `1px solid ${T.goldHair}`, padding: 16 }}>
          <SectionEyebrow>Risk control</SectionEyebrow>
          <p style={{ fontSize: 11.5, lineHeight: 1.65, color: T.ink, WebkitTextFillColor: T.ink, margin: 0 }}>Avoid sold-out inventory, secondary-source claims, incomplete brochures and fake developer assets. Only official backend logos and real project imagery are used in this pack.</p>
        </div>
      </div>
    </PageFrame>
  );
}

function ContactPage({ branding, pageIdPrefix }: { branding: ReportBranding; pageIdPrefix: string }) {
  const showPhoto = (branding.mode === "both" || branding.mode === "photo") && branding.photoDataUrl;
  const profileRows = [
    ["Name", branding.name || TRADE_LICENSE_BRAND],
    ["Company", branding.companyName || TRADE_LICENSE_BRAND],
    ["Role", ROLE_LABELS[branding.role]],
    ["Phone", branding.phone || COMPANY_CONTACT.phone],
    ["WhatsApp", branding.whatsapp || branding.phone || COMPANY_CONTACT.phone],
    ["Email", branding.email || COMPANY_CONTACT.email],
    ["Website", branding.website || COMPANY_CONTACT.website],
    ["License", branding.license || `Trade License ${TRADE_LICENSE_NUMBER}`],
    ["Office", branding.address || TRADE_LICENSE_OFFICE],
    ["Social", branding.socials || "JBJ official channels"],
  ];
  return (
    <PageFrame id={`${pageIdPrefix}-contact`} pageLabel="Contact" section="Next Steps" branding={branding}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 20, height: "100%" }}>
        <div>
          <SectionEyebrow>Contact / consultant page</SectionEyebrow>
          <h2 style={{ fontSize: 32, lineHeight: 1.08, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink, margin: "0 0 14px" }}>Move from shortlist to verified opportunity</h2>
          <p style={{ fontSize: 12.5, lineHeight: 1.65, color: T.muted, WebkitTextFillColor: T.muted, margin: "0 0 18px" }}>The next stage is consultant-led due diligence: confirm official stock, compare live payment plans, inspect views/floor premiums, and reserve only after the client approves the final commercial terms.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              ["1", "Confirm availability", "Request current developer inventory and pricing."],
              ["2", "Shortlist units", "Compare size, floor, view and premium."],
              ["3", "Model cashflow", "Review payment plan and mortgage path."],
              ["4", "Reserve", "Proceed only after signed client approval."],
            ].map(([n, h, d]) => (
              <div key={n} style={{ padding: 14, borderRadius: 9, background: T.surface, border: `1px solid ${T.goldHair}` }}>
                <div style={{ width: 28, height: 28, borderRadius: 999, background: T.raised, border: `1px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink }}>{n}</div>
                <div style={{ marginTop: 9, fontSize: 13.5, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink }}>{h}</div>
                <div style={{ marginTop: 4, fontSize: 10.8, lineHeight: 1.45, color: T.muted, WebkitTextFillColor: T.muted }}>{d}</div>
              </div>
            ))}
          </div>
          <div data-no-contrast-guard data-on-dark style={{ borderRadius: 10, backgroundImage: T.emeraldGradient, backgroundColor: T.emeraldDeep, border: `1px solid ${T.gold}`, padding: 18, color: WHITE, WebkitTextFillColor: WHITE }}>
            <SectionEyebrow light>JBJ Global Real Estate</SectionEyebrow>
            <div style={{ fontSize: 22, fontWeight: 900, color: WHITE, WebkitTextFillColor: WHITE }}>{COMPANY_CONTACT.email}</div>
            <div style={{ marginTop: 6, fontSize: 12, color: WHITE, WebkitTextFillColor: WHITE }}>{COMPANY_CONTACT.phone} · {COMPANY_CONTACT.website}</div>
          </div>
        </div>
        <aside style={{ borderRadius: 10, background: T.surface, border: `1px solid ${T.goldHair}`, padding: 16, alignSelf: "start" }}>
          <SectionEyebrow>Prepared by</SectionEyebrow>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            {showPhoto ? <img src={branding.photoDataUrl} alt="Prepared by" crossOrigin="anonymous" loading="eager" decoding="sync" style={{ width: 68, height: 68, borderRadius: 999, objectFit: "cover", border: `2px solid ${T.gold}` }} /> : <div style={{ width: 68, height: 68, borderRadius: 999, background: T.raised, border: `2px solid ${T.gold}`, display: "flex", alignItems: "center", justifyContent: "center" }}><img src={jbjMonogram} alt="JBJ" style={{ width: 58, height: 58, objectFit: "contain" }} /></div>}
            <div>
              <div style={{ fontSize: 15, lineHeight: 1.2, fontWeight: 900, color: T.ink, WebkitTextFillColor: T.ink }}>{branding.name || TRADE_LICENSE_BRAND}</div>
              <div style={{ marginTop: 4, fontSize: 10.5, color: T.muted, WebkitTextFillColor: T.muted }}>{ROLE_LABELS[branding.role]}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {profileRows.map(([label, value]) => (
              <div key={label} style={{ paddingBottom: 7, borderBottom: `1px solid ${T.goldHair}` }}>
                <div style={{ fontSize: 8.5, textTransform: "uppercase", letterSpacing: "0.13em", color: T.muted, WebkitTextFillColor: T.muted, fontWeight: 900 }}>{label}</div>
                <div style={{ marginTop: 3, fontSize: 11.2, lineHeight: 1.35, color: T.ink, WebkitTextFillColor: T.ink, fontWeight: 700, wordBreak: "break-word" }}>{value}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </PageFrame>
  );
}

export function ReportEngine({ mode, branding, projects, clientName, clientRequirements, pageIdPrefix = "report" }: ReportEngineProps) {
  void mode;
  const safeProjects = projects.slice(0, 3);
  const requirements = buildRequirementItems(clientRequirements);
  const criteriaRows = clientRequirements ? buildCriteriaRowsForExport(clientRequirements, safeProjects as any[]) : [];

  return (
    <div data-report-root data-no-contrast-guard style={{ display: "flex", flexDirection: "column", gap: 24, background: T.page, color: T.ink, WebkitTextFillColor: T.ink }}>
      <style>{`
        [data-report-root], [data-report-root] * { box-sizing: border-box; }
        [data-report-root] [data-on-dark],
        [data-report-root] [data-on-dark] * {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        [data-report-root] [data-on-dark] svg,
        [data-report-root] [data-on-dark] svg * {
          stroke: #FFFFFF !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        [data-report-root] :where(table,thead,tbody,tr,td,th,p,span,div,h1,h2,h3,li,ol):not([data-on-dark]):not([data-on-dark] *) {
          text-shadow: none !important;
        }
      `}</style>
      <CoverPage branding={branding} projects={safeProjects} clientName={clientName} pageIdPrefix={pageIdPrefix} requirements={requirements} />
      <ClientRequirementsPage branding={branding} pageIdPrefix={pageIdPrefix} requirements={requirements} projects={safeProjects} />
      <MatchedPropertiesPage branding={branding} projects={safeProjects} pageIdPrefix={pageIdPrefix} criteriaRows={criteriaRows} />
      <ComparisonPage branding={branding} projects={safeProjects} pageIdPrefix={pageIdPrefix} criteriaRows={criteriaRows} />
      {safeProjects.map((p, i) => <PropertyDetailPage key={p.id} branding={branding} project={p} index={i} pageIdPrefix={pageIdPrefix} criteriaRows={criteriaRows} />)}
      <AiRecommendationSummaryPage branding={branding} projects={safeProjects} pageIdPrefix={pageIdPrefix} criteriaRows={criteriaRows} />
      <ContactPage branding={branding} pageIdPrefix={pageIdPrefix} />
    </div>
  );
}

export default ReportEngine;