import { toast } from "sonner";
import { type CVData, type Template, TEMPLATES, buildCVQrUrl } from "./cvResumeTypes";

// ─── PDF Export ───────────────────────────────────────────────────────────────
export async function exportCVAsPDF(
  data: CVData,
  template: Template,
  options?: { qrEnabled?: boolean; qrData?: string; qrColor?: string; qrSize?: number }
) {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const W = 595, H = 842;
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([W, H]);

  const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic  = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  function hex(h: string) {
    const c = h.replace("#", "");
    return rgb(parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255);
  }

  const cfg    = TEMPLATES.find(t => t.id === template)!;
  const accent = hex(cfg.accent);
  const white  = rgb(1,1,1);
  const black  = rgb(0,0,0);
  const gray   = rgb(0.43,0.43,0.43);
  const lgray  = rgb(0.62,0.62,0.62);
  const dkgray = rgb(0.22,0.22,0.22);

  const name    = data.name  || "Your Name";
  const title   = data.title || "Professional Title";
  const contact = [data.email, data.phone, data.location, data.linkedin].filter(Boolean).join("  |  ");

  function drawText(text: string, opts: { x: number; y: number; size: number; font?: typeof bold; color?: ReturnType<typeof rgb>; maxWidth?: number; lineHeight?: number }) {
    const f   = opts.font  || regular;
    const clr = opts.color || black;
    const w   = opts.maxWidth;
    if (!w) {
      page.drawText(text, { x: opts.x, y: opts.y, size: opts.size, font: f, color: clr });
      return opts.y - (opts.lineHeight || opts.size + 3);
    }
    const words = text.split(" ");
    let line = "", y = opts.y;
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (f.widthOfTextAtSize(test, opts.size) > w && line) {
        page.drawText(line, { x: opts.x, y, size: opts.size, font: f, color: clr });
        y -= opts.lineHeight || opts.size + 3;
        line = word;
      } else { line = test; }
    }
    if (line) { page.drawText(line, { x: opts.x, y, size: opts.size, font: f, color: clr }); y -= opts.lineHeight || opts.size + 3; }
    return y;
  }

  function sectionHeader(label: string, y: number, x = 40, w = W - 80) {
    page.drawLine({ start: { x, y: y - 2 }, end: { x: x + w, y: y - 2 }, thickness: 0.6, color: accent, opacity: 0.4 });
    page.drawText(label.toUpperCase(), { x, y, size: 8, font: bold, color: accent });
    return y - 16;
  }

  if (template === "executive" || template === "timeline") {
    const sideW = 160;
    page.drawRectangle({ x: 0, y: 0, width: sideW, height: H, color: hex(cfg.accent) });
    page.drawEllipse({ x: sideW / 2, y: H - 60, xScale: 26, yScale: 26, color: rgb(1,1,1), opacity: 0.15 });
    page.drawText(name.charAt(0), { x: sideW/2 - 8, y: H - 68, size: 20, font: bold, color: white });
    let sY = H - 110;
    page.drawText("CONTACT", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 });
    sY -= 14;
    [data.email, data.phone, data.location].filter(Boolean).forEach(c => { page.drawText(c!, { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8, maxWidth: sideW - 24 } as any); sY -= 13; });
    sY -= 8;
    if (data.skills) { page.drawText("SKILLS", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 }); sY -= 14; data.skills.split(",").forEach(s => { page.drawText(s.trim(), { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8 }); sY -= 12; }); }
    if (data.languages) { sY -= 6; page.drawText("LANGUAGES", { x: 16, y: sY, size: 7, font: bold, color: white, opacity: 0.5 }); sY -= 14; page.drawText(data.languages, { x: 16, y: sY, size: 7.5, font: regular, color: white, opacity: 0.8 }); }
    const mx = sideW + 24, mw = W - mx - 24;
    let my = H - 48;
    page.drawText(name,  { x: mx, y: my, size: 22, font: bold, color: accent });  my -= 20;
    page.drawText(title, { x: mx, y: my, size: 10, font: italic, color: gray });  my -= 24;
    if (data.summary) { my = sectionHeader("Summary", my, mx, mw); my = drawText(data.summary, { x: mx, y: my, size: 9, color: gray, maxWidth: mw, lineHeight: 14 }); my -= 10; }
    if (data.experience.some(e => e.title)) { my = sectionHeader("Experience", my, mx, mw); data.experience.filter(e => e.title).forEach(exp => { if (my < 60) return; page.drawText(exp.title, { x: mx, y: my, size: 9.5, font: bold, color: dkgray }); page.drawText(exp.period, { x: W - 60, y: my, size: 8, font: regular, color: lgray }); my -= 13; page.drawText(exp.company, { x: mx, y: my, size: 8.5, font: italic, color: accent }); my -= 12; if (exp.description) { my = drawText(exp.description, { x: mx, y: my, size: 8.5, color: gray, maxWidth: mw, lineHeight: 13 }); } my -= 8; }); }
    if (data.education.some(e => e.degree)) { my = sectionHeader("Education", my, mx, mw); data.education.filter(e => e.degree).forEach(edu => { if (my < 60) return; page.drawText(edu.degree, { x: mx, y: my, size: 9.5, font: bold, color: dkgray }); page.drawText(edu.year, { x: W - 60, y: my, size: 8, font: regular, color: lgray }); my -= 13; page.drawText(edu.institution, { x: mx, y: my, size: 8.5, font: regular, color: gray }); my -= 14; }); }
  } else if (template === "modern" || template === "bold" || template === "twocol") {
    page.drawRectangle({ x: 0, y: H - 110, width: W, height: 110, color: accent });
    page.drawText(name, { x: 36, y: H - 52, size: 24, font: bold, color: white });
    page.drawText(title, { x: 36, y: H - 72, size: 10, font: regular, color: white, opacity: 0.8 });
    page.drawText(contact, { x: 36, y: H - 92, size: 8, font: regular, color: white, opacity: 0.65 });
    const mx = 36, mw = W - 230, sx = W - 185, sw = 170;
    let my = H - 130, sy = H - 130;
    if (data.summary) { my = sectionHeader("Summary", my, mx, mw - mx); my = drawText(data.summary, { x: mx, y: my, size: 9, color: gray, maxWidth: mw - mx, lineHeight: 14 }); my -= 10; }
    if (data.experience.some(e => e.title)) { my = sectionHeader("Experience", my, mx, mw - mx); data.experience.filter(e => e.title).forEach(exp => { if (my < 60) return; page.drawText(exp.title, { x: mx, y: my, size: 9.5, font: bold, color: dkgray }); page.drawText(exp.period, { x: mw - 40, y: my, size: 7.5, font: regular, color: lgray }); my -= 13; page.drawText(exp.company, { x: mx, y: my, size: 8.5, font: italic, color: accent }); my -= 12; if (exp.description) { my = drawText(exp.description, { x: mx, y: my, size: 8.5, color: gray, maxWidth: mw - mx, lineHeight: 13 }); } my -= 8; }); }
    if (data.education.some(e => e.degree)) { my = sectionHeader("Education", my, mx, mw - mx); data.education.filter(e => e.degree).forEach(edu => { if (my < 60) return; page.drawText(edu.degree, { x: mx, y: my, size: 9.5, font: bold, color: dkgray }); page.drawText(edu.year, { x: mw - 40, y: my, size: 7.5, font: regular, color: lgray }); my -= 13; page.drawText(edu.institution, { x: mx, y: my, size: 8.5, font: regular, color: gray }); my -= 14; }); }
    if (data.skills) { sy = sectionHeader("Skills", sy, sx, sw); data.skills.split(",").forEach(s => { page.drawText(s.trim(), { x: sx, y: sy, size: 8, font: regular, color: accent }); sy -= 16; }); }
    if (data.languages) { sy = sectionHeader("Languages", sy, sx, sw); data.languages.split(",").forEach(l => { page.drawText(l.trim(), { x: sx, y: sy, size: 8.5, font: regular, color: gray }); sy -= 13; }); }
  } else {
    let y = H - 48;
    const nameW = bold.widthOfTextAtSize(name, 24);
    page.drawText(name,  { x: (W - nameW) / 2, y, size: 24, font: bold, color: black }); y -= 22;
    const titleW = italic.widthOfTextAtSize(title, 10);
    page.drawText(title, { x: (W - titleW) / 2, y, size: 10, font: italic, color: gray }); y -= 14;
    const cW = regular.widthOfTextAtSize(contact, 8);
    page.drawText(contact, { x: (W - cW) / 2, y, size: 8, font: regular, color: lgray }); y -= 10;
    page.drawLine({ start: { x: 36, y }, end: { x: W - 36, y }, thickness: 1.5, color: black }); y -= 20;
    const mx = 36, mw = W - 72;
    if (data.summary) { y = sectionHeader("Profile", y, mx, mw); y = drawText(data.summary, { x: mx, y, size: 9.5, color: dkgray, maxWidth: mw, lineHeight: 15 }); y -= 10; }
    if (data.experience.some(e => e.title)) { y = sectionHeader("Experience", y, mx, mw); data.experience.filter(e => e.title).forEach(exp => { if (y < 60) return; page.drawText(exp.title, { x: mx, y, size: 10, font: bold, color: black }); page.drawText(exp.period, { x: W - 80, y, size: 8, font: regular, color: lgray }); y -= 14; page.drawText(exp.company, { x: mx, y, size: 9, font: italic, color: gray }); y -= 13; if (exp.description) { y = drawText(exp.description, { x: mx, y, size: 9, color: dkgray, maxWidth: mw, lineHeight: 14 }); } y -= 8; }); }
    if (data.education.some(e => e.degree)) { y = sectionHeader("Education", y, mx, mw); data.education.filter(e => e.degree).forEach(edu => { if (y < 60) return; page.drawText(edu.degree, { x: mx, y, size: 10, font: bold, color: black }); page.drawText(edu.year, { x: W - 80, y, size: 8, font: regular, color: lgray }); y -= 14; page.drawText(edu.institution, { x: mx, y, size: 9, font: italic, color: gray }); y -= 14; }); }
    if (data.skills) { y -= 4; page.drawLine({ start: { x: 36, y }, end: { x: W - 36, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) }); y -= 16; page.drawText("CORE SKILLS", { x: 36, y, size: 8, font: bold, color: black }); y -= 13; page.drawText(data.skills, { x: 36, y, size: 9, font: regular, color: dkgray }); }
  }

  // Embed QR code in PDF if enabled
  if (options?.qrEnabled && options?.qrData) {
    try {
      const qrImgUrl = buildCVQrUrl(options.qrData, options.qrColor || "#000000", 200);
      const resp = await fetch(qrImgUrl);
      const buf  = await resp.arrayBuffer();
      const qrPdfImage = await pdfDoc.embedPng(new Uint8Array(buf));
      const qrPx = Math.max(48, Math.min(120, options.qrSize ?? 64));
      page.drawImage(qrPdfImage, { x: W - qrPx - 20, y: 16, width: qrPx, height: qrPx });
      const c = (options.qrColor || "#9ca3af").replace("#", "");
      const qrClr = rgb(parseInt(c.slice(0,2),16)/255, parseInt(c.slice(2,4),16)/255, parseInt(c.slice(4,6),16)/255);
      page.drawText("SCAN TO CONNECT", { x: W - qrPx - 20, y: qrPx + 22, size: 6, font: bold, color: qrClr, opacity: 0.6 });
    } catch {
      // Silent fail
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `cv-${(data.name || "resume").toLowerCase().replace(/\s+/g, "-")}.pdf`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── Export as Image (PNG / JPEG) ─────────────────────────────────────────────
export async function exportCVAsImage(format: "png" | "jpeg") {
  const previewEl = document.getElementById("cv-preview-target");
  if (!previewEl) { toast.error("Preview not found"); return; }
  try {
    const { default: html2canvas } = await import("html2canvas" as any);
    const canvas = await (html2canvas as any)(previewEl, { scale: 3, useCORS: true, backgroundColor: "#ffffff" });
    const link = document.createElement("a");
    link.download = `cv.${format}`;
    link.href = canvas.toDataURL(format === "jpeg" ? "image/jpeg" : "image/png", 0.95);
    link.click();
  } catch {
    toast.error("Image export failed — PDF export is always available.");
  }
}
