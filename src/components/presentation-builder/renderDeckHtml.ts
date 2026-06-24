/**
 * Renders a print-ready HTML deck for a project.
 * Output is a full HTML document with embedded styles, ready for window.print() → Save as PDF.
 * Champagne / gold / ink palette only. Skips any section with no underlying data.
 */

export type DeckSectionKey =
  | "cover"
  | "highlights"
  | "location"
  | "amenities"
  | "gallery"
  | "units"
  | "paymentPlan"
  | "developer"
  | "offer"
  | "contact";

export interface DeckPresenter {
  photoDataUrl?: string;
  logoDataUrl?: string;
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  company?: string;
  clientName?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientPassport?: string;
  clientNotes?: string;
}

export interface DeckUnit {
  id: string;
  label: string;
  size?: string;
  price?: string;
  bedrooms?: string;
  floorPlanUrl?: string;
}

export interface DeckProject {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  cover_image_url?: string;
  images?: Array<{ url: string }>;
  amenities?: any[];
  area_name?: string;
  location?: string;
  emirate?: string;
  handover_date?: string;
  expected_completion?: string;
  price_from?: number;
  payment_plan?: any;
  payment_breakdown?: any;
  down_payment_percent?: number;
  developer?: { name?: string; logo_url?: string; description?: string } | string;
  usp_bullets?: string[];
  usp_headline?: string;
  unit_types?: any[];
  floor_plan_types?: any[];
  documents?: any[];
}

interface RenderArgs {
  project: DeckProject;
  presenter: DeckPresenter;
  sections: Record<DeckSectionKey, boolean>;
  units: DeckUnit[];
  salesOffer?: string;
}

const esc = (s: unknown): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fmtPrice = (n?: number) =>
  typeof n === "number" && isFinite(n) ? `AED ${n.toLocaleString()}` : "";

const baseStyles = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #FDFBF7; color: #1A1A1A; font-family: 'Inter', -apple-system, system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .slide { width: 297mm; height: 210mm; padding: 18mm 20mm; page-break-after: always; position: relative; overflow: hidden; background: #FDFBF7; display: flex; flex-direction: column; }
  .slide:last-child { page-break-after: auto; }
  .slide-surface { background: #F7F2EA; }
  .slide-dark { background: #0A0A0A; color: #FFFFFF; }
  .gold-hairline { border: 1px solid rgba(184,149,85,0.45); }
  .kicker { font-size: 11px; letter-spacing: 0.32em; text-transform: uppercase; color: rgba(26,26,26,0.55); margin-bottom: 8px; }
  .slide-dark .kicker { color: rgba(255,255,255,0.55); }
  h1.title { font-size: 44px; line-height: 1.08; letter-spacing: -0.02em; margin: 0 0 14px; font-weight: 600; }
  h2.title { font-size: 32px; line-height: 1.1; letter-spacing: -0.015em; margin: 0 0 12px; font-weight: 600; }
  .lead { font-size: 14px; line-height: 1.55; color: rgba(26,26,26,0.78); max-width: 200mm; }
  .slide-dark .lead { color: rgba(255,255,255,0.8); }
  .gold-rule { width: 64px; height: 1px; background: #B89555; margin: 10px 0 16px; }
  .footer-strip { position: absolute; left: 20mm; right: 20mm; bottom: 12mm; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: rgba(26,26,26,0.55); letter-spacing: 0.18em; text-transform: uppercase; border-top: 1px solid rgba(184,149,85,0.35); padding-top: 8px; }
  .slide-dark .footer-strip { color: rgba(255,255,255,0.55); border-top-color: rgba(184,149,85,0.4); }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16mm; flex: 1; }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; }
  .stat { padding: 14px; background: #FDFBF7; border: 1px solid rgba(184,149,85,0.3); border-radius: 8px; }
  .stat .v { font-size: 22px; font-weight: 700; color: #1A1A1A; }
  .stat .l { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(26,26,26,0.55); margin-top: 4px; }
  .unit-card { background: #FDFBF7; border: 1px solid rgba(184,149,85,0.4); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
  .unit-card img { width: 100%; height: 110px; object-fit: contain; background: #F7F2EA; border-radius: 6px; }
  .amenity-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: #EFE6D6; border: 1px solid rgba(184,149,85,0.4); border-radius: 999px; font-size: 12px; color: #1A1A1A; margin: 0 6px 6px 0; }
  .gallery-img { width: 100%; height: 65mm; object-fit: cover; border-radius: 8px; border: 1px solid rgba(184,149,85,0.3); }
  .cover-photo { position: absolute; inset: 0; background-size: cover; background-position: center; }
  .cover-scrim { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,10,10,0.25) 0%, rgba(10,10,10,0.65) 60%, rgba(10,10,10,0.92) 100%); }
  .cover-content { position: relative; z-index: 2; color: #FFFFFF; margin-top: auto; max-width: 200mm; }
  .cover-content .kicker { color: rgba(255,255,255,0.8); }
  .cover-content h1 { color: #FFFFFF; font-size: 56px; }
  .cover-content .lead { color: rgba(255,255,255,0.85); }
  .brand-mark { display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px; border: 1px solid rgba(184,149,85,0.55); border-radius: 6px; background: rgba(8,12,20,0.78); color: #FFF; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; }
  .brand-mark img { width: 28px; height: 28px; object-fit: contain; border-radius: 4px; background: rgba(255,255,255,0.08); }
  .brand-mark .gold { color: #F3D98A; font-weight: 800; }
  .presenter-card { display: flex; gap: 14px; align-items: center; padding: 16px; background: #FDFBF7; border: 1px solid rgba(184,149,85,0.4); border-radius: 10px; }
  .presenter-card img { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(184,149,85,0.5); }
  .contact-row { display: flex; gap: 18px; flex-wrap: wrap; font-size: 13px; color: #1A1A1A; }
  .contact-row .k { font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; color: rgba(26,26,26,0.55); margin-bottom: 2px; }
  .client-card { margin-top: 16px; padding: 14px; background: #F7F2EA; border: 1px solid rgba(184,149,85,0.34); border-radius: 10px; }
  ul.bullets { list-style: none; padding: 0; margin: 0; }
  ul.bullets li { position: relative; padding-left: 18px; margin-bottom: 8px; font-size: 14px; line-height: 1.5; color: #1A1A1A; }
  ul.bullets li::before { content: "•"; color: #B89555; position: absolute; left: 0; font-weight: 700; }
  @page { size: 297mm 210mm; margin: 0; }
  @media print { body { background: #FDFBF7; } }
`;

function coverSlide(project: DeckProject, presenter: DeckPresenter): string {
  const company = presenter.company || "JBJ Global Real Estate";
  const cover = project.cover_image_url || project.images?.[0]?.url || "";
  return `
    <section class="slide" style="padding:0;">
      ${cover ? `<div class="cover-photo" style="background-image:url('${esc(cover)}');"></div><div class="cover-scrim"></div>` : `<div class="cover-photo" style="background:#0A0A0A;"></div>`}
      <div class="cover-content" style="position:absolute; left:20mm; right:20mm; bottom:24mm;">
        <div class="brand-mark">${presenter.logoDataUrl ? `<img src="${esc(presenter.logoDataUrl)}" alt="" />` : `<span class="gold">JBJ</span>`}<span>${esc(company)}</span></div>
        <div class="kicker" style="margin-top:18px;">Project Presentation</div>
        <h1 class="title">${esc(project.name)}</h1>
        ${project.area_name || project.location ? `<div class="lead">${esc(project.area_name || project.location)}${project.emirate ? ` · ${esc(project.emirate)}` : ""}</div>` : ""}
      </div>
    </section>`;
}

function highlightsSlide(project: DeckProject): string | null {
  const stats: Array<[string, string]> = [];
  if (project.price_from) stats.push(["Starting price", fmtPrice(project.price_from)]);
  if (project.handover_date || project.expected_completion) stats.push(["Handover", esc(project.handover_date || project.expected_completion)]);
  if (project.down_payment_percent) stats.push(["Down payment", `${project.down_payment_percent}%`]);
  const devName = typeof project.developer === "string" ? project.developer : project.developer?.name;
  if (devName) stats.push(["Developer", esc(devName)]);
  const bullets = (project.usp_bullets || []).slice(0, 6);
  if (stats.length === 0 && bullets.length === 0 && !project.description) return null;
  return `
    <section class="slide">
      <div class="kicker">Highlights</div>
      <h2 class="title">${esc(project.usp_headline || `Why ${project.name}`)}</h2>
      <div class="gold-rule"></div>
      ${project.description ? `<p class="lead" style="margin-bottom:16px;">${esc(project.description).slice(0, 600)}</p>` : ""}
      ${stats.length ? `<div class="grid-4" style="margin-bottom:16px;">${stats.map(([l, v]) => `<div class="stat"><div class="v">${v}</div><div class="l">${esc(l)}</div></div>`).join("")}</div>` : ""}
      ${bullets.length ? `<ul class="bullets">${bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

function locationSlide(project: DeckProject): string | null {
  if (!project.area_name && !project.location) return null;
  return `
    <section class="slide slide-surface">
      <div class="kicker">Location</div>
      <h2 class="title">${esc(project.area_name || project.location)}</h2>
      <div class="gold-rule"></div>
      ${project.emirate ? `<p class="lead">${esc(project.emirate)}</p>` : ""}
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

function amenitiesSlide(project: DeckProject): string | null {
  const list = (project.amenities || []).map((a: any) => (typeof a === "string" ? a : a.name || a.label)).filter(Boolean);
  if (list.length === 0) return null;
  return `
    <section class="slide">
      <div class="kicker">Amenities</div>
      <h2 class="title">Resident lifestyle</h2>
      <div class="gold-rule"></div>
      <div>${list.slice(0, 28).map((a) => `<span class="amenity-pill">${esc(a)}</span>`).join("")}</div>
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

function gallerySlide(project: DeckProject): string | null {
  const imgs = (project.images || []).map((i) => i.url).filter(Boolean).slice(0, 4);
  if (imgs.length === 0) return null;
  return `
    <section class="slide slide-surface">
      <div class="kicker">Gallery</div>
      <h2 class="title">Visuals</h2>
      <div class="gold-rule"></div>
      <div class="grid-2" style="grid-template-columns:repeat(2,1fr); gap:6mm;">
        ${imgs.map((u) => `<img class="gallery-img" src="${esc(u)}" alt="" />`).join("")}
      </div>
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

function unitsSlide(units: DeckUnit[], project: DeckProject): string | null {
  if (units.length === 0) return null;
  return `
    <section class="slide">
      <div class="kicker">Selected units</div>
      <h2 class="title">Floor plans & pricing</h2>
      <div class="gold-rule"></div>
      <div class="grid-3" style="grid-template-columns:repeat(${Math.min(units.length, 3)},1fr);">
        ${units.slice(0, 6).map((u) => `
          <div class="unit-card">
            ${u.floorPlanUrl ? `<img src="${esc(u.floorPlanUrl)}" alt="" />` : ""}
            <div style="font-size:14px; font-weight:600;">${esc(u.label)}</div>
            <div style="font-size:11px; color:rgba(26,26,26,0.7);">${[u.bedrooms && `${esc(u.bedrooms)} BR`, esc(u.size || ""), esc(u.price || "")].filter(Boolean).join(" · ")}</div>
          </div>
        `).join("")}
      </div>
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

function paymentPlanSlide(project: DeckProject): string | null {
  const pp = project.payment_plan;
  const breakdown = project.payment_breakdown;
  let rows: Array<[string, string]> = [];
  if (Array.isArray(breakdown)) {
    rows = breakdown.map((r: any) => [r.label || r.milestone || r.name || "", r.percent != null ? `${r.percent}%` : (r.value || "")]);
  } else if (pp && typeof pp === "object") {
    rows = Object.entries(pp).map(([k, v]) => [k.replace(/_/g, " "), String(v)]);
  }
  rows = rows.filter(([l, v]) => l && v);
  if (rows.length === 0 && !project.down_payment_percent) return null;
  return `
    <section class="slide slide-surface">
      <div class="kicker">Payment plan</div>
      <h2 class="title">Schedule</h2>
      <div class="gold-rule"></div>
      <div class="grid-3" style="grid-template-columns:repeat(3,1fr);">
        ${rows.slice(0, 9).map(([l, v]) => `<div class="stat"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("")}
      </div>
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

function developerSlide(project: DeckProject): string | null {
  const dev = project.developer;
  if (!dev) return null;
  const name = typeof dev === "string" ? dev : dev.name;
  const logo = typeof dev === "object" ? dev.logo_url : undefined;
  const desc = typeof dev === "object" ? dev.description : undefined;
  if (!name) return null;
  return `
    <section class="slide">
      <div class="kicker">Developer</div>
      <h2 class="title">${esc(name)}</h2>
      <div class="gold-rule"></div>
      <div style="display:flex; gap:16mm; align-items:flex-start;">
        ${logo ? `<img src="${esc(logo)}" alt="" style="max-width:60mm; max-height:40mm; object-fit:contain; background:#F7F2EA; padding:8px; border:1px solid rgba(184,149,85,0.3); border-radius:8px;" />` : ""}
        ${desc ? `<p class="lead" style="flex:1;">${esc(desc).slice(0, 800)}</p>` : ""}
      </div>
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

function offerSlide(project: DeckProject, offer?: string): string | null {
  if (!offer) return null;
  return `
    <section class="slide slide-dark">
      <div class="kicker">Exclusive offer</div>
      <h1 class="title" style="color:#F3D98A;">${esc(offer)}</h1>
      <div class="gold-rule" style="background:#B89555;"></div>
      <p class="lead">Reserved through JBJ Global Real Estate. Subject to developer terms.</p>
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

function contactSlide(project: DeckProject, presenter: DeckPresenter): string | null {
  const clientRows: Array<[string, string | undefined]> = [
    ["Client name", presenter.clientName],
    ["Client phone", presenter.clientPhone],
    ["Address", presenter.clientAddress],
    ["Passport / ID", presenter.clientPassport],
    ["Notes", presenter.clientNotes],
  ].filter(([, value]) => Boolean(value?.trim())) as Array<[string, string]>;
  const hasAny = presenter.name || presenter.email || presenter.phone || presenter.whatsapp || clientRows.length > 0;
  if (!hasAny) return null;
  const company = presenter.company || "JBJ Global Real Estate";
  return `
    <section class="slide">
      <div class="kicker">Your contact</div>
      <h2 class="title">Speak with your advisor</h2>
      <div class="gold-rule"></div>
      <div class="presenter-card">
        ${presenter.photoDataUrl ? `<img src="${esc(presenter.photoDataUrl)}" alt="" />` : ""}
        <div style="flex:1;">
          ${presenter.name ? `<div style="font-size:20px; font-weight:600;">${esc(presenter.name)}</div>` : ""}
          ${presenter.title ? `<div style="font-size:13px; color:rgba(26,26,26,0.7); margin-top:2px;">${esc(presenter.title)}</div>` : ""}
          <div style="font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#B89555; margin-top:6px;">${esc(company)}</div>
        </div>
      </div>
      <div class="contact-row" style="margin-top:18px;">
        ${presenter.email ? `<div><div class="k">Email</div>${esc(presenter.email)}</div>` : ""}
        ${presenter.phone ? `<div><div class="k">Phone</div>${esc(presenter.phone)}</div>` : ""}
        ${presenter.whatsapp ? `<div><div class="k">WhatsApp</div>${esc(presenter.whatsapp)}</div>` : ""}
      </div>
      ${clientRows.length ? `<div class="client-card"><div class="k" style="margin-bottom:8px;">Client details</div><div class="contact-row">${clientRows.map(([label, value]) => `<div><div class="k">${esc(label)}</div>${esc(value)}</div>`).join("")}</div></div>` : ""}
      <div class="footer-strip"><span>JBJ Global Real Estate</span><span>${esc(project.name)}</span></div>
    </section>`;
}

export function renderProjectDeckHtml(args: RenderArgs): string {
  const { project, presenter, sections, units, salesOffer } = args;
  const parts: Array<string | null> = [];
  if (sections.cover) parts.push(coverSlide(project, presenter));
  if (sections.highlights) parts.push(highlightsSlide(project));
  if (sections.location) parts.push(locationSlide(project));
  if (sections.amenities) parts.push(amenitiesSlide(project));
  if (sections.gallery) parts.push(gallerySlide(project));
  if (sections.units) parts.push(unitsSlide(units, project));
  if (sections.paymentPlan) parts.push(paymentPlanSlide(project));
  if (sections.developer) parts.push(developerSlide(project));
  if (sections.offer) parts.push(offerSlide(project, salesOffer));
  if (sections.contact) parts.push(contactSlide(project, presenter));
  const body = parts.filter(Boolean).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(project.name)} — Presentation</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${baseStyles}</style>
</head>
<body>
${body}
</body>
</html>`;
}
