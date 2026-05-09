/**
 * Client-side preview-PDF exporter.
 * Flattens placed signature/stamp/date/text fields onto the source PDF using pdf-lib
 * so the user can download a proof BEFORE sending for signature.
 *
 * Only data that is already known on the client is rendered:
 *   - signature/initials → owner saved asset (data URL) if available
 *   - stamp              → field.value (data URL) if available
 *   - date               → field.value or today's date
 *   - text               → field.value
 *   - checkbox           → drawn box, X if value truthy
 *
 * Fields that have no value yet are drawn as labelled placeholder boxes so the
 * recipient/owner can see exactly where they will land.
 */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PreviewField {
  id: string;
  recipientId: string;
  type: "signature" | "initials" | "date" | "text" | "checkbox" | "stamp";
  pageNumber: number;
  x: number;       // percent (0-100), top-left origin
  y: number;       // percent (0-100), top-left origin
  width: number;   // CSS px at PDF natural scale 1
  height: number;  // CSS px at PDF natural scale 1
  value?: string;
  label?: string;
}

export interface PreviewRecipient {
  id: string;
  name: string;
  email: string;
}

export interface PreviewAssets {
  /** Default signature data URL (PNG/JPEG) for the owner's signature fields */
  signatureDataUrl?: string | null;
  /** Default stamp data URL (PNG/JPEG) — derived from saved SVG when available */
  stampDataUrl?: string | null;
}

async function fileToBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

async function embedDataUrl(pdfDoc: PDFDocument, dataUrl: string) {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return null;
  const base64 = dataUrl.slice(commaIdx + 1);
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  if (dataUrl.startsWith("data:image/png")) return await pdfDoc.embedPng(bytes);
  return await pdfDoc.embedJpg(bytes);
}

export async function exportPreviewPdf(
  pdfFile: File,
  fields: PreviewField[],
  recipients: PreviewRecipient[],
  assets: PreviewAssets = {}
): Promise<Blob> {
  const srcBytes = await fileToBytes(pdfFile);
  const pdfDoc = await PDFDocument.load(srcBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const sigImg = assets.signatureDataUrl
    ? await embedDataUrl(pdfDoc, assets.signatureDataUrl).catch(() => null)
    : null;
  const stampImg = assets.stampDataUrl
    ? await embedDataUrl(pdfDoc, assets.stampDataUrl).catch(() => null)
    : null;

  const recipientById = new Map(recipients.map(r => [r.id, r]));
  const pages = pdfDoc.getPages();

  // Recipient color palette (subtle, for placeholders)
  const palette = [
    rgb(0.23, 0.51, 0.96), // blue
    rgb(0.02, 0.59, 0.41), // emerald
    rgb(0.55, 0.36, 0.96), // purple
    rgb(0.92, 0.34, 0.05), // orange
    rgb(0.93, 0.28, 0.60), // pink
  ];

  for (const f of fields) {
    const pageIdx = Math.max(0, (f.pageNumber || 1) - 1);
    if (pageIdx >= pages.length) continue;
    const page = pages[pageIdx];
    const { width: pageW, height: pageH } = page.getSize();

    const w = f.width || 160;
    const h = f.height || 36;
    const x = (f.x / 100) * pageW;
    const yTop = (f.y / 100) * pageH;
    const y = pageH - yTop - h;

    const recipient = recipientById.get(f.recipientId);
    const rIdx = recipients.findIndex(r => r.id === f.recipientId);
    const color = palette[rIdx % palette.length];

    let drawnContent = false;

    if (f.type === "signature" && sigImg) {
      const dim = sigImg.scale(1);
      const scale = Math.min(w / dim.width, h / dim.height);
      page.drawImage(sigImg, {
        x, y: y + (h - dim.height * scale) / 2,
        width: dim.width * scale, height: dim.height * scale,
      });
      drawnContent = true;
    } else if (f.type === "stamp") {
      const data = f.value || assets.stampDataUrl || null;
      const img = data ? await embedDataUrl(pdfDoc, data).catch(() => null) : null;
      if (img) {
        const dim = img.scale(1);
        const scale = Math.min(w / dim.width, h / dim.height);
        page.drawImage(img, {
          x, y: y + (h - dim.height * scale) / 2,
          width: dim.width * scale, height: dim.height * scale,
        });
        drawnContent = true;
      }
    } else if (f.type === "date" && f.value) {
      page.drawText(String(f.value), {
        x: x + 4, y: y + h / 2 - 5, size: 11, font, color: rgb(0.05, 0.05, 0.05),
      });
      drawnContent = true;
    } else if (f.type === "text" && f.value) {
      page.drawText(String(f.value), {
        x: x + 4, y: y + h / 2 - 5, size: 11, font, color: rgb(0.05, 0.05, 0.05),
      });
      drawnContent = true;
    } else if (f.type === "checkbox") {
      page.drawRectangle({
        x, y, width: w, height: h, borderWidth: 1, borderColor: rgb(0.4, 0.4, 0.4),
      });
      if (f.value) {
        page.drawText("X", { x: x + w / 2 - 4, y: y + h / 2 - 5, size: 14, font: fontBold, color: rgb(0, 0, 0) });
      }
      drawnContent = true;
    }

    if (!drawnContent) {
      // Draw labelled placeholder so reviewers see exactly where it lands
      page.drawRectangle({
        x, y, width: w, height: h,
        borderWidth: 1, borderColor: color,
        color: rgb(1, 1, 1), opacity: 0.0,
      });
      const label = `${f.label || f.type.toUpperCase()}${recipient ? ` · ${recipient.name}` : ""}`;
      page.drawText(label, {
        x: x + 4, y: y + h - 12, size: 8, font: fontBold, color,
      });
    }
  }

  // Footer banner — make it obvious this is a preview, not a final signed doc
  for (const page of pages) {
    const { width: pageW } = page.getSize();
    page.drawRectangle({
      x: 0, y: 0, width: pageW, height: 18,
      color: rgb(0.95, 0.92, 0.84),
    });
    page.drawText(
      "PREVIEW — field placement only. Not a signed document.",
      { x: 12, y: 5, size: 8, font: fontBold, color: rgb(0.45, 0.34, 0.07) }
    );
  }

  const bytes = await pdfDoc.save();
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}
