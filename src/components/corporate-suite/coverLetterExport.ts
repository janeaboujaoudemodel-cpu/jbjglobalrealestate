import type { FormData, TemplateConfig } from "./coverLetterTypes";
import type { StampSignatureData } from "./DocumentStampIntegration";
import type { HeaderFooterSettings } from "./DocumentHeaderFooterBuilder";

export async function exportCoverLetterPDF(
  form: FormData,
  letter: string,
  effectiveTemplate: TemplateConfig,
  logoUrl: string,
  stampData: StampSignatureData,
  headerFooter: HeaderFooterSettings,
): Promise<Blob> {
  const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };
  const accent = hexToRgb(effectiveTemplate.accentColor);
  const dark = rgb(0.22, 0.22, 0.22);
  const mid = rgb(0.45, 0.45, 0.45);
  const light = rgb(0.7, 0.7, 0.7);

  const { width, height } = page.getSize();
  const margin = 56;
  const contentW = width - margin * 2;
  let y = height - margin;

  // Header band
  const hBandH = 80;
  const hBandY = height - hBandH;
  page.drawRectangle({
    x: 0, y: hBandY, width, height: hBandH,
    color: hexToRgb(effectiveTemplate.headerBg === "#ffffff" ? "#f9fafb" : effectiveTemplate.headerBg),
  });
  page.drawRectangle({ x: 0, y: hBandY, width, height: 2, color: accent });

  const headerName = headerFooter.showHeader && headerFooter.companyName
    ? headerFooter.companyName
    : (form.yourName || "Your Name");
  page.drawText(headerName, { x: margin, y: hBandY + 48, font: boldFont, size: 20, color: accent });

  if (form.yourTitle && !headerFooter.showHeader) {
    page.drawText(form.yourTitle.toUpperCase(), { x: margin, y: hBandY + 30, font: regularFont, size: 8, color: accent, opacity: 0.6 });
  }

  const contactParts = [form.yourEmail, form.yourPhone].filter(Boolean).join("   |   ");
  if (contactParts) {
    page.drawText(contactParts, { x: margin, y: hBandY + 12, font: regularFont, size: 8, color: mid });
  }

  if (logoUrl) {
    try {
      const resp = await fetch(logoUrl);
      const buf = await resp.arrayBuffer();
      let img;
      try { img = await pdfDoc.embedPng(buf); } catch { img = await pdfDoc.embedJpg(buf); }
      const dims = img.scale(0.25);
      page.drawImage(img, { x: width - margin - dims.width, y: hBandY + (hBandH - dims.height) / 2, width: dims.width, height: dims.height });
    } catch { /* skip */ }
  }

  y = hBandY - 28;

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  page.drawText(today, { x: margin, y, font: regularFont, size: 9, color: light });
  y -= 22;

  const salutation = form.recipientName ? `Dear ${form.recipientName},` : "Dear Hiring Manager,";
  page.drawText(salutation, { x: margin, y, font: regularFont, size: 11, color: dark });
  y -= 14;

  if (form.jobTitle && form.companyName) {
    page.drawText(`Re: ${form.jobTitle} — ${form.companyName}`, { x: margin, y, font: italicFont, size: 9, color: mid });
    y -= 20;
  } else { y -= 10; }

  const wrapText = (text: string, font: typeof regularFont, size: number, maxW: number): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const word of words) {
      const test = cur ? `${cur} ${word}` : word;
      if (font.widthOfTextAtSize(test, size) > maxW) { if (cur) lines.push(cur); cur = word; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  };

  const paraSize = 10.5;
  const lineH = 16;
  const paras = letter.split(/\n{2,}/).filter(Boolean);
  for (const para of paras) {
    const lines = wrapText(para.trim(), regularFont, paraSize, contentW);
    for (const line of lines) {
      page.drawText(line, { x: margin, y, font: regularFont, size: paraSize, color: dark });
      y -= lineH;
    }
    y -= 10;
  }

  y -= 4;
  page.drawText("Yours sincerely,", { x: margin, y, font: regularFont, size: 10.5, color: dark });
  y -= 14;

  if (stampData.signatureUrl) {
    try {
      const sigBytes = await fetch(stampData.signatureUrl).then(r => r.arrayBuffer());
      const sigImage = await pdfDoc.embedPng(sigBytes);
      const sigH = 40;
      const sigW = Math.round(sigH * (sigImage.width / sigImage.height));
      page.drawImage(sigImage, { x: margin, y: y - sigH + 6, width: sigW, height: sigH });
      y -= sigH + 6;
    } catch {
      page.drawLine({ start: { x: margin, y }, end: { x: margin + 140, y }, thickness: 0.8, color: accent });
      y -= 14;
    }
  } else {
    page.drawLine({ start: { x: margin, y }, end: { x: margin + 140, y }, thickness: 0.8, color: accent });
    y -= 14;
  }

  page.drawText(form.yourName || "Your Name", { x: margin, y, font: boldFont, size: 12, color: accent });
  if (form.yourTitle) { y -= 14; page.drawText(form.yourTitle, { x: margin, y, font: regularFont, size: 9, color: mid }); }

  // Footer
  if (headerFooter.showFooter && headerFooter.copyrightText) {
    page.drawText(headerFooter.copyrightText, { x: margin, y: 30, font: regularFont, size: 7, color: light });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
}
