import { toast } from "sonner";
import type { ProfileData, Template, LogoPosition, LogoPageMode, TemplateConfig } from "./companyProfileTypes";
import { TEMPLATES } from "./companyProfileTypes";

export async function exportCompanyProfilePDF({
  data, template, logoUrl, logoSize, logoPosition, logoPageMode,
}: {
  data: ProfileData;
  template: Template;
  logoUrl: string;
  logoSize: number;
  logoPosition: LogoPosition;
  logoPageMode: LogoPageMode;
}) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const cfg = TEMPLATES.find(t => t.id === template)!;
  const W = 595, H = 842;
  const pdfDoc = await PDFDocument.create();
  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  function hexToRgb(h: string) {
    const c = (h || "#000000").replace("#", "").padEnd(6, "0");
    return rgb(parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255);
  }

  const ac       = hexToRgb(cfg.accent);
  const white    = rgb(1, 1, 1);
  const dark     = rgb(0.05, 0.05, 0.05);
  const bodyGray = rgb(0.25, 0.25, 0.25);
  const lightGray = rgb(0.45, 0.45, 0.45);
  const coverBgRgb = hexToRgb(cfg.coverBg);
  const contentBgRgb = hexToRgb(cfg.contentBg);
  const isClean = template === "clean" || template === "cover_letter" || template === "copyright";
  const isPremium = template === "premium";
  const coverTextIsLight = cfg.coverTextColor === "#ffffff";

  let embeddedLogo: any = null;
  if (logoUrl) {
    try {
      if (logoUrl.startsWith("data:image/png")) {
        const bytes = Uint8Array.from(atob(logoUrl.split(",")[1]), c => c.charCodeAt(0));
        embeddedLogo = await pdfDoc.embedPng(bytes);
      } else if (logoUrl.startsWith("data:image/jpeg") || logoUrl.startsWith("data:image/jpg")) {
        const bytes = Uint8Array.from(atob(logoUrl.split(",")[1]), c => c.charCodeAt(0));
        embeddedLogo = await pdfDoc.embedJpg(bytes);
      } else if (logoUrl.startsWith("http")) {
        const res = await fetch(logoUrl);
        const buf = await res.arrayBuffer();
        embeddedLogo = res.headers.get("content-type")?.includes("png")
          ? await pdfDoc.embedPng(new Uint8Array(buf))
          : await pdfDoc.embedJpg(new Uint8Array(buf));
      }
    } catch { /* logo embed failed silently */ }
  }

  function drawLogo(page: any, size: number, isContent = false) {
    if (!embeddedLogo) return;
    const lSize = Math.min(size, isContent ? 60 : 90);
    const pad = 40;
    let x = W - lSize - pad;
    let y2 = H - lSize - pad;
    if (logoPosition === "top-left")     { x = pad;            y2 = H - lSize - pad; }
    if (logoPosition === "top-center")   { x = W/2 - lSize/2;  y2 = H - lSize - pad; }
    if (logoPosition === "top-right")    { x = W - lSize - pad; y2 = H - lSize - pad; }
    if (logoPosition === "bottom-left")  { x = pad;            y2 = pad; }
    if (logoPosition === "bottom-right") { x = W - lSize - pad; y2 = pad; }
    page.drawImage(embeddedLogo, { x, y: y2, width: lSize, height: lSize });
  }

  // ─ Cover Page ─
  const cover = pdfDoc.addPage([W, H]);
  cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: coverBgRgb });
  cover.drawRectangle({ x: 0, y: H - 5, width: W, height: 5, color: ac });
  const showLogoOnCover = embeddedLogo && (logoPageMode === "all" || logoPageMode === "cover-only");
  if (showLogoOnCover) drawLogo(cover, logoSize);
  const coverTextColor = coverTextIsLight ? white : dark;
  cover.drawText("COMPANY PROFILE", { x: 50, y: H - 90, size: 8, font: bold, color: ac });
  cover.drawText(data.companyName.slice(0, 40), { x: 50, y: H - 145, size: 30, font: bold, color: coverTextColor });
  if (data.tagline) cover.drawText(data.tagline.slice(0, 60), { x: 50, y: H - 178, size: 12, font: regular, color: coverTextIsLight ? rgb(0.8, 0.8, 0.8) : lightGray });
  cover.drawLine({ start: { x: 50, y: H - 200 }, end: { x: 250, y: H - 200 }, thickness: 2, color: ac });
  if (data.website) cover.drawText(data.website, { x: 50, y: 50, size: 8, font: regular, color: coverTextIsLight ? rgb(0.6, 0.6, 0.6) : lightGray });

  // ─ Content Pages ─
  let currentPage = pdfDoc.addPage([W, H]);
  currentPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: contentBgRgb });
  currentPage.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: ac });
  let y = H - 60;

  const showLogoOnContent = embeddedLogo && (logoPageMode === "all" || logoPageMode === "content-only");
  if (showLogoOnContent) drawLogo(currentPage, logoSize, true);

  function ensureSpace(needed: number) {
    if (y - needed < 60) {
      currentPage = pdfDoc.addPage([W, H]);
      currentPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: contentBgRgb });
      currentPage.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: ac });
      if (showLogoOnContent) drawLogo(currentPage, logoSize, true);
      y = H - 60;
    }
  }
  function drawSectionHeader(title: string) {
    ensureSpace(30);
    currentPage.drawText(title.toUpperCase(), { x: 50, y: y + 5, size: 8, font: bold, color: ac });
    currentPage.drawLine({ start: { x: 50, y: y - 2 }, end: { x: W - 50, y: y - 2 }, thickness: 0.75, color: ac, opacity: 0.25 });
    y -= 22;
  }
  function drawWrappedText(text: string, xOffset = 50, maxWidth = W - 100, fontSize = 9, color = bodyGray, lineH = 14) {
    const words = text.split(" ");
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      const w = regular.widthOfTextAtSize(test, fontSize);
      if (w > maxWidth && line) {
        ensureSpace(lineH + 4);
        currentPage.drawText(line, { x: xOffset, y, size: fontSize, font: regular, color });
        y -= lineH; line = word;
      } else { line = test; }
    }
    if (line) { ensureSpace(lineH + 4); currentPage.drawText(line, { x: xOffset, y, size: fontSize, font: regular, color }); y -= lineH; }
    y -= 6;
  }

  if (data.aboutUs) { drawSectionHeader("About Us"); drawWrappedText(data.aboutUs); y -= 10; }
  const activeServices = data.services.filter(s => s.title);
  if (activeServices.length) {
    drawSectionHeader("Our Services");
    activeServices.forEach((s, i) => {
      const bullet = isPremium ? "◆" : `${i + 1}.`;
      ensureSpace(18);
      currentPage.drawText(`${bullet} ${s.title}`, { x: 50, y, size: 10, font: bold, color: dark });
      y -= 15;
      if (s.description) { drawWrappedText(s.description, 62, W - 112, 9, lightGray, 13); }
      y -= 4;
    });
    y -= 6;
  }
  const activeTeam = data.team.filter(m => m.name);
  if (activeTeam.length) {
    drawSectionHeader("Our Team");
    activeTeam.forEach(m => {
      ensureSpace(16);
      currentPage.drawText(m.role ? `${m.name}  —  ${m.role}` : m.name, { x: 50, y, size: 9, font: regular, color: dark });
      y -= 15;
    });
    y -= 6;
  }
  const contacts = [
    { label: "Phone", val: data.phone }, { label: "Email", val: data.email },
    { label: "Website", val: data.website }, { label: "Address", val: data.address },
    { label: "LinkedIn", val: data.linkedin }, { label: "Instagram", val: data.instagram },
  ].filter(c => c.val);
  if (contacts.length) {
    drawSectionHeader("Contact Us");
    contacts.forEach(({ label, val }) => {
      ensureSpace(16);
      currentPage.drawText(`${label}:`, { x: 50, y, size: 8.5, font: bold, color: ac });
      currentPage.drawText(val.slice(0, 70), { x: 120, y, size: 8.5, font: regular, color: bodyGray });
      y -= 15;
    });
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `${data.companyName.replace(/\s+/g, "-")}-profile.pdf`; a.click();
  URL.revokeObjectURL(url);
  toast.success("Company profile PDF exported!");
}
