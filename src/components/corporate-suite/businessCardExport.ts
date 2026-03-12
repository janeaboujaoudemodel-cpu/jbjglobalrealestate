import {
  type CardData, type Template, type QrPosition,
  buildQrUrl,
} from "./businessCardTypes";
import type { LandingPageData } from "@/components/corporate-suite/DigitalLandingPageEditor";

// ─── PDF Export ───────────────────────────────────────────────────────────────
export async function exportCardAsPDF(
  data: CardData,
  template: Template,
  frontPrimary: string,
  frontSecondary: string,
  frontAccent: string,
  backPrimary: string,
  backSecondary: string,
  qrEnabled: boolean,
  qrData: string,
  qrColor: string,
  qrBgColor: string,
  qrSize: number,
  qrPosition: QrPosition,
) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");

  const W = 252, H = 144;
  const pdfDoc = await PDFDocument.create();
  const frontPage = pdfDoc.addPage([W, H]);
  const backPage  = pdfDoc.addPage([W, H]);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica     = await pdfDoc.embedFont(StandardFonts.Helvetica);

  function hex(h: string) {
    const c = h.replace("#", "");
    return rgb(parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255);
  }

  const pc    = hex(frontPrimary);
  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const gray  = rgb(0.45, 0.45, 0.45);
  const lgray = rgb(0.65, 0.65, 0.65);
  const name    = data.name    || "Your Name";
  const title   = data.title   || "Job Title";
  const company = data.company || "Company Name";
  const fp = frontPage;

  if (template === "modern" || template === "ai-design") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: pc });
    fp.drawText(company.toUpperCase(), { x: 16, y: H - 28, size: 6.5, font: helveticaBold, color: white, opacity: 0.6 });
    fp.drawText(name,    { x: 16, y: H - 50, size: 14, font: helveticaBold, color: white });
    fp.drawText(title,   { x: 16, y: H - 65, size: 8,  font: helvetica,     color: white, opacity: 0.8 });
    let cy = 26;
    if (data.phone)   { fp.drawText(data.phone,   { x: 16, y: cy, size: 7, font: helvetica, color: white, opacity: 0.75 }); cy += 12; }
    if (data.email)   { fp.drawText(data.email,   { x: 16, y: cy, size: 7, font: helvetica, color: white, opacity: 0.75 }); cy += 12; }
    if (data.website) { fp.drawText(data.website, { x: 16, y: cy, size: 7, font: helvetica, color: white, opacity: 0.75 }); }
  } else if (template === "classic") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: white });
    fp.drawRectangle({ x: 0, y: 0, width: 5, height: H, color: pc });
    fp.drawText(name,   { x: 20, y: H - 36, size: 13, font: helveticaBold, color: pc });
    fp.drawText(title,  { x: 20, y: H - 50, size: 8,  font: helvetica,     color: gray });
    fp.drawText(company.toUpperCase(), { x: 20, y: H - 63, size: 6.5, font: helveticaBold, color: lgray });
    fp.drawLine({ start: { x: 20, y: 52 }, end: { x: W - 16, y: 52 }, thickness: 0.6, color: pc, opacity: 0.2 });
    let cy2 = 40;
    if (data.phone)   { fp.drawText(data.phone,   { x: 20, y: cy2, size: 7, font: helvetica, color: gray }); cy2 -= 11; }
    if (data.email)   { fp.drawText(data.email,   { x: 20, y: cy2, size: 7, font: helvetica, color: gray }); cy2 -= 11; }
    if (data.website) { fp.drawText(data.website, { x: 20, y: cy2, size: 7, font: helvetica, color: pc  }); }
  } else if (template === "minimal") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.98, 0.98, 0.98) });
    fp.drawText(name,   { x: 24, y: H - 44, size: 15, font: helvetica, color: black });
    fp.drawLine({ start: { x: 24, y: H - 52 }, end: { x: 52, y: H - 52 }, thickness: 2, color: pc });
    fp.drawText(`${title} · ${company}`, { x: 24, y: H - 65, size: 7.5, font: helvetica, color: gray });
    let cy3 = 38;
    if (data.email)   { fp.drawText(data.email,   { x: 24, y: cy3, size: 7, font: helvetica, color: lgray }); cy3 -= 11; }
    if (data.phone)   { fp.drawText(data.phone,   { x: 24, y: cy3, size: 7, font: helvetica, color: lgray }); cy3 -= 11; }
    if (data.website) { fp.drawText(data.website, { x: 24, y: cy3, size: 7, font: helvetica, color: pc   }); }
  } else if (template === "bold") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.04, 0.04, 0.04) });
    fp.drawRectangle({ x: 0, y: H - 3, width: W, height: 3, color: pc });
    fp.drawText(name.toUpperCase(),  { x: 16, y: H - 38, size: 14, font: helveticaBold, color: pc });
    fp.drawText(title.toUpperCase(), { x: 16, y: H - 52, size: 7,  font: helveticaBold, color: lgray });
    fp.drawText(company.toUpperCase(), { x: 16, y: 38, size: 6, font: helveticaBold, color: rgb(0.35, 0.35, 0.35) });
    let cy4 = 26;
    if (data.phone) { fp.drawText(data.phone, { x: 16, y: cy4, size: 7, font: helvetica, color: rgb(0.75, 0.75, 0.75) }); cy4 -= 11; }
    if (data.email) { fp.drawText(data.email, { x: 16, y: cy4, size: 7, font: helvetica, color: rgb(0.75, 0.75, 0.75) }); }
  } else if (template === "creative") {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: white });
    fp.drawEllipse({ x: W - 20, y: H - 20, xScale: 70, yScale: 70, color: pc, opacity: 0.08 });
    fp.drawText(name,    { x: 20, y: H - 46, size: 13, font: helveticaBold, color: black });
    fp.drawText(title,   { x: 20, y: H - 59, size: 8,  font: helvetica,     color: pc  });
    fp.drawText(company, { x: 20, y: H - 71, size: 7,  font: helvetica,     color: lgray });
    let cy5 = 34;
    if (data.email) { fp.drawText(data.email, { x: 20, y: cy5, size: 7, font: helvetica, color: gray }); cy5 -= 11; }
    if (data.phone) { fp.drawText(data.phone, { x: 20, y: cy5, size: 7, font: helvetica, color: gray }); }
  } else {
    fp.drawRectangle({ x: 0, y: 0, width: W, height: H, color: pc });
    fp.drawRectangle({ x: 0, y: 0, width: W, height: 30, color: rgb(0, 0, 0), opacity: 0.18 });
    fp.drawText(company.toUpperCase(), { x: 18, y: H - 30, size: 6, font: helveticaBold, color: white, opacity: 0.5 });
    fp.drawText(name,  { x: 18, y: H - 56, size: 14, font: helveticaBold, color: white });
    fp.drawText(title, { x: 18, y: H - 70, size: 8.5, font: helvetica, color: white, opacity: 0.8 });
    fp.drawLine({ start: { x: 0, y: 32 }, end: { x: W, y: 32 }, thickness: 0.5, color: white, opacity: 0.25 });
    const items = [data.phone, data.email, data.website].filter(Boolean);
    let cx = 18;
    items.forEach(item => {
      if (!item) return;
      fp.drawText(item, { x: cx, y: 13, size: 7, font: helvetica, color: white, opacity: 0.7 });
      cx += helvetica.widthOfTextAtSize(item, 7) + 16;
    });
  }

  // Embed QR on front
  if (qrEnabled && qrData) {
    try {
      const qrImgUrl = buildQrUrl(qrData, qrColor, qrBgColor, qrSize);
      const resp = await fetch(qrImgUrl);
      const arrBuf = await resp.arrayBuffer();
      const qrImg = await pdfDoc.embedPng(arrBuf);
      const qrPt = (qrSize / 96) * 72;
      const positions: Record<QrPosition, { x: number; y: number }> = {
        "bottom-right": { x: W - qrPt - 8, y: 8 },
        "bottom-left":  { x: 8,             y: 8 },
        "top-right":    { x: W - qrPt - 8, y: H - qrPt - 8 },
        "top-left":     { x: 8,             y: H - qrPt - 8 },
        "center":       { x: W / 2 - qrPt / 2, y: H / 2 - qrPt / 2 },
      };
      const pos = positions[qrPosition];
      fp.drawImage(qrImg, { x: pos.x, y: pos.y, width: qrPt, height: qrPt });
    } catch (err) {
      console.warn("QR embed failed:", err);
    }
  }

  // Back page
  const bpc = hex(backPrimary);
  const bsc = hex(backSecondary);
  backPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: bpc });
  if (data.company) {
    const bkText = data.company.toUpperCase();
    backPage.drawText(bkText, {
      x: W / 2 - helveticaBold.widthOfTextAtSize(bkText, 20) / 2,
      y: H / 2 - 8,
      size: 20, font: helveticaBold, color: bsc, opacity: 0.12,
    });
  }
  if (data.website) {
    backPage.drawText(data.website, {
      x: W - 16 - helvetica.widthOfTextAtSize(data.website, 7),
      y: 12,
      size: 7, font: helvetica, color: bsc, opacity: 0.35,
    });
  }

  // Embed QR on back page
  if (qrEnabled && qrData) {
    try {
      const qrImgUrl = buildQrUrl(qrData, qrColor, qrBgColor, qrSize);
      const resp = await fetch(qrImgUrl);
      const arrBuf = await resp.arrayBuffer();
      const qrImg = await pdfDoc.embedPng(arrBuf);
      const qrPt = (qrSize / 96) * 72;
      const positions: Record<QrPosition, { x: number; y: number }> = {
        "bottom-right": { x: W - qrPt - 8, y: 8 },
        "bottom-left":  { x: 8,             y: 8 },
        "top-right":    { x: W - qrPt - 8, y: H - qrPt - 8 },
        "top-left":     { x: 8,             y: H - qrPt - 8 },
        "center":       { x: W / 2 - qrPt / 2, y: H / 2 - qrPt / 2 },
      };
      const pos = positions[qrPosition];
      backPage.drawImage(qrImg, { x: pos.x, y: pos.y, width: qrPt, height: qrPt });
    } catch (err) {
      console.warn("QR back page embed failed:", err);
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `business-card-${(data.name || "card").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── HTML Export ──────────────────────────────────────────────────────────────
export function exportDigitalCardAsHtml(
  data: CardData,
  template: Template,
  primary: string,
  secondary: string,
  accent: string,
  fontFamily: string,
  fontWeight: string,
  fontStyle: string,
  nameFontSize: number | null,
  landingPage?: LandingPageData,
): void {
  const name    = data.name    || "Your Name";
  const title   = data.title   || "Job Title";
  const company = data.company || "Company Name";

  const vcf = [
    "BEGIN:VCARD", "VERSION:3.0",
    `FN:${name}`, `ORG:${company}`, `TITLE:${title}`,
    data.phone   ? `TEL:${data.phone}`    : "",
    data.email   ? `EMAIL:${data.email}`  : "",
    data.website ? `URL:${data.website}`  : "",
    data.address ? `ADR:;;${data.address};;;;` : "",
    "END:VCARD",
  ].filter(Boolean).join("\n");
  const vcfB64 = btoa(unescape(encodeURIComponent(vcf)));

  const templateStyles: Record<Template, string> = {
    modern:    `background:linear-gradient(135deg,${primary} 0%,${primary}dd 100%);color:${secondary};`,
    classic:   `background:#ffffff;color:#111;border-left:6px solid ${primary};`,
    minimal:   `background:#fafafa;color:#111;`,
    bold:      `background:#0a0a0a;color:${primary};`,
    creative:  `background:#ffffff;color:#111;`,
    corporate: `background:linear-gradient(135deg,${primary} 0%,${primary}cc 100%);color:${secondary};`,
    "ai-design":`background:linear-gradient(135deg,${primary} 0%,${primary}dd 100%);color:${secondary};`,
  };

  const cardStyle = templateStyles[template] || templateStyles.modern;
  const nameColor = template === "bold" ? primary : (template === "classic" || template === "minimal" || template === "creative") ? "#111" : secondary;
  const titleColor = template === "classic" ? "#555" : template === "minimal" ? "#666" : template === "bold" ? "#aaa" : `${secondary}cc`;
  const companyColor = template === "classic" ? "#999" : template === "minimal" ? "#999" : template === "bold" ? "#444" : `${secondary}99`;

  const ctaBg = "#C8A766";
  const ctaText = "#fff";

  const nameParts = name.trim().split(/\s+/);
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (nameParts[0]?.[0] || "?").toUpperCase();

  const pwaIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="${primary}"/><text x="256" y="300" text-anchor="middle" font-family="${fontFamily}" font-size="200" font-weight="700" fill="#ffffff">${initials}</text></svg>`;
  const pwaIconDataUri = `data:image/svg+xml;base64,${btoa(pwaIconSvg)}`;

  const pwaManifest = JSON.stringify({
    name: `${name} — Digital Card`,
    short_name: `${initials} Card`,
    start_url: ".",
    display: "standalone",
    background_color: primary,
    theme_color: primary,
    icons: [{ src: pwaIconDataUri, sizes: "any", type: "image/svg+xml" }]
  });
  const pwaManifestDataUri = `data:application/json;base64,${btoa(pwaManifest)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<meta name="theme-color" content="${primary}"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="description" content="Digital business card for ${name} — ${title} at ${company}"/>
<title>${name} — Digital Card</title>
<link rel="apple-touch-icon" href="${pwaIconDataUri}"/>
<link rel="manifest" href="${pwaManifestDataUri}"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:24px 16px 48px;background:linear-gradient(160deg,#0f0f0f 0%,#1a1a1a 60%,#111 100%);font-family:${fontFamily};color:#fff}
.wrapper{width:100%;max-width:400px;display:flex;flex-direction:column;gap:20px}
.card{width:100%;aspect-ratio:9/16;border-radius:24px;padding:32px 24px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 20px 60px rgba(0,0,0,0.5);position:relative;overflow:hidden;${cardStyle}}
.card-top{}
.card-name{font-size:${nameFontSize || 22}px;font-weight:${fontWeight};font-style:${fontStyle};color:${nameColor};line-height:1.2;margin-bottom:6px}
.card-title{font-size:13px;font-weight:500;color:${titleColor};margin-bottom:4px}
.card-company{font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${companyColor}}
.card-bottom{display:flex;flex-direction:column;gap:6px}
.card-contact{font-size:11px;opacity:0.75;color:inherit}
.actions{display:flex;flex-direction:column;gap:10px}
.action-row{display:flex;align-items:center;gap:14px;background:#ffffff0d;border:1px solid #ffffff15;border-radius:14px;padding:14px 18px;text-decoration:none;color:#fff;font-size:14px;font-weight:500;transition:background 0.15s}
.action-row:hover{background:#ffffff1a}
.action-icon{width:36px;height:36px;border-radius:10px;background:${primary}33;border:1px solid ${primary}55;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}
.save-btn{width:100%;padding:18px;background:${ctaBg};color:${ctaText};font-size:16px;font-weight:700;border:none;border-radius:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 24px ${ctaBg}66;transition:opacity 0.15s}
.save-btn:hover{opacity:0.9}
.footer{text-align:center;font-size:11px;color:#ffffff33;padding-top:8px}
.footer a{color:#ffffff44;text-decoration:none}
.lp-section{margin-top:24px}
.lp-heading{font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff55;margin-bottom:12px}
.lp-bio{font-size:14px;line-height:1.6;color:#ffffffcc;background:#ffffff08;border:1px solid #ffffff12;border-radius:16px;padding:20px}
.social-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.social-chip{display:flex;flex-direction:column;align-items:center;gap:6px;background:#ffffff0d;border:1px solid #ffffff15;border-radius:14px;padding:14px 8px;text-decoration:none;color:#fff;font-size:11px;transition:background 0.15s}
.social-chip:hover{background:#ffffff1a}
.social-chip .s-icon{font-size:22px}
.social-chip .s-label{font-size:10px;opacity:0.6;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%}
.featured-scroll{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch}
.featured-card{min-width:220px;border-radius:16px;overflow:hidden;background:#ffffff0d;border:1px solid #ffffff15;text-decoration:none;color:#fff;flex-shrink:0;transition:transform 0.15s}
.featured-card:hover{transform:scale(1.02)}
.featured-img{width:100%;height:130px;object-fit:cover;background:#ffffff12}
.featured-body{padding:14px}
.featured-body h3{font-size:14px;font-weight:600;margin-bottom:4px}
.featured-body p{font-size:11px;opacity:0.6}
.testimonials-row{display:flex;gap:12px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch}
.testimonial-card{min-width:240px;background:#ffffff0d;border:1px solid #ffffff15;border-radius:16px;padding:18px;flex-shrink:0}
.testimonial-card .t-text{font-size:13px;line-height:1.5;color:#ffffffcc;margin-bottom:10px;font-style:italic}
.testimonial-card .t-author{font-size:11px;font-weight:600;color:#ffffffaa}
.testimonial-card .t-role{font-size:10px;color:#ffffff55}
${template==="minimal"?`.card-name{color:#111!important}.card{box-shadow:0 20px 60px rgba(0,0,0,0.3);}`:""}
${template==="bold"?`.card-name{text-transform:uppercase;letter-spacing:0.04em}`:""}
</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="card-top">
      <div class="card-name">${name}</div>
      <div class="card-title">${title}</div>
      <div class="card-company">${company}</div>
    </div>
    <div class="card-bottom">
      ${data.phone   ? `<div class="card-contact">📞 ${data.phone}</div>` : ""}
      ${data.email   ? `<div class="card-contact">✉ ${data.email}</div>` : ""}
      ${data.website ? `<div class="card-contact">🌐 ${data.website}</div>` : ""}
      ${data.address ? `<div class="card-contact">📍 ${data.address}</div>` : ""}
    </div>
  </div>

  <div class="actions">
    ${data.phone   ? `<a href="tel:${data.phone}" class="action-row"><span class="action-icon">📞</span><span>${data.phone}</span></a>` : ""}
    ${data.email   ? `<a href="mailto:${data.email}" class="action-row"><span class="action-icon">✉</span><span>${data.email}</span></a>` : ""}
    ${data.website ? `<a href="${data.website.startsWith("http") ? data.website : "https://"+data.website}" target="_blank" rel="noopener" class="action-row"><span class="action-icon">🌐</span><span>${data.website}</span></a>` : ""}
    ${data.address ? `<a href="https://maps.google.com/?q=${encodeURIComponent(data.address)}" target="_blank" rel="noopener" class="action-row"><span class="action-icon">📍</span><span>${data.address}</span></a>` : ""}

    <button class="save-btn" onclick="saveContact()">
      <span>💾</span><span>Save Contact</span>
    </button>
  </div>

  ${landingPage?.heroBio ? `<div class="lp-section"><div class="lp-heading">About</div><div class="lp-bio">${landingPage.heroBio.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br/>")}</div></div>` : ""}

  ${landingPage?.socialLinks && landingPage.socialLinks.length > 0 ? `<div class="lp-section"><div class="lp-heading">Connect</div><div class="social-grid">${landingPage.socialLinks.map(s => `<a href="${s.url.startsWith("http") ? s.url : "https://"+s.url}" target="_blank" rel="noopener" class="social-chip"><span class="s-icon">${s.icon}</span><span class="s-label">${s.platform}</span></a>`).join("")}</div></div>` : ""}

  ${landingPage?.featuredCards && landingPage.featuredCards.length > 0 ? `<div class="lp-section"><div class="lp-heading">Featured</div><div class="featured-scroll">${landingPage.featuredCards.map(c => {
    const tag = c.link ? "a" : "div";
    const href = c.link ? ` href="${c.link.startsWith("http") ? c.link : "https://"+c.link}" target="_blank" rel="noopener"` : "";
    return `<${tag}${href} class="featured-card">${c.imageUrl ? `<img class="featured-img" src="${c.imageUrl}" alt="${c.title.replace(/"/g,"&quot;")}"/>` : `<div class="featured-img"></div>`}<div class="featured-body"><h3>${c.title}</h3>${c.subtitle ? `<p>${c.subtitle}</p>` : ""}</div></${tag}>`;
  }).join("")}</div></div>` : ""}

  ${landingPage?.testimonials && landingPage.testimonials.length > 0 ? `<div class="lp-section"><div class="lp-heading">What Clients Say</div><div class="testimonials-row">${landingPage.testimonials.map(t => `<div class="testimonial-card"><div class="t-text">"${t.text.replace(/</g,"&lt;").replace(/>/g,"&gt;")}"</div><div class="t-author">${t.name}</div>${t.role ? `<div class="t-role">${t.role}</div>` : ""}</div>`).join("")}</div></div>` : ""}

  <p class="footer">Built with <a href="/" target="_blank">JBJ Business Card Designer</a></p>
</div>
<script>
function saveContact(){
  var b64="${vcfB64}";
  var bin=atob(b64);var bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  var blob=new Blob([bytes],{type:"text/vcard;charset=utf-8"});
  var url=URL.createObjectURL(blob);
  var a=document.createElement("a");
  a.href=url;a.download="${(name).replace(/[^a-zA-Z0-9]/g, "-")}.vcf";
  document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(url);document.body.removeChild(a);},1000);
}
if('serviceWorker' in navigator){var sw='self.addEventListener("fetch",function(e){e.respondWith(fetch(e.request))})';var blob=new Blob([sw],{type:"application/javascript"});navigator.serviceWorker.register(URL.createObjectURL(blob)).catch(function(){});}
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `${(name).toLowerCase().replace(/\s+/g, "-")}-digital-card.html`;
  a.click();
  URL.revokeObjectURL(url);
}
