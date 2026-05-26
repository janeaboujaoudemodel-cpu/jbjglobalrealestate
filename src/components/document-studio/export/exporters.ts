/**
 * Document Studio exporters — real PDF and DOCX downloads.
 * Both render the locked JBJ chrome around the AI body and embed any
 * signature / stamp the user has placed on the document.
 */
import DOMPurify from "dompurify";
import { wrapWithJbjChrome } from "@/templates/jbjLockedChrome";
import type { DocumentTemplate } from "@/config/documentCatalog";

export interface PlacedMark {
  url: string;
  /** Width in document units (px on the 816-wide canvas). */
  width: number;
  /** Optional rotation in degrees (stamps). */
  rotation?: number;
}

export interface DocumentMarks {
  signature?: PlacedMark;
  stamp?: PlacedMark;
}

function fileName(template: DocumentTemplate, ext: string) {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  return `JBJ-${template.id}-${stamp}.${ext}`;
}

/** Convert a (possibly external) image URL to a base64 data URL. */
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url, { credentials: "omit" });
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
}

/** Build the printable HTML with letterhead + body + signature/stamp + footer. */
export function buildPrintableHtml(bodyHtml: string, marks: DocumentMarks): string {
  const clean = DOMPurify.sanitize(bodyHtml);
  const sigBlock = marks.signature
    ? `<div style="margin-top:48px;"><img src="${marks.signature.url}" style="width:${marks.signature.width}px;max-width:240px;display:block;" alt="Signature" /><div style="border-top:1px solid #1A1A1A;width:240px;margin-top:4px;padding-top:6px;font-size:11px;color:#1A1A1A;opacity:.7;">Authorised signature</div></div>`
    : "";
  const stampBlock = marks.stamp
    ? `<div style="position:absolute;right:48px;bottom:96px;"><img src="${marks.stamp.url}" style="width:${marks.stamp.width}px;max-width:160px;transform:rotate(${marks.stamp.rotation ?? -8}deg);opacity:.92;" alt="Stamp" /></div>`
    : "";
  return wrapWithJbjChrome(`<div style="position:relative;">${clean}${sigBlock}${stampBlock}</div>`);
}

/* ───────────────────────── PDF (jsPDF + html2canvas) ───────────────────────── */

export async function exportPdf(
  bodyHtml: string, marks: DocumentMarks, template: DocumentTemplate,
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Off-screen render host at A4 width (816 px)
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = "816px";
  host.style.background = "#FDFBF7";
  host.innerHTML = buildPrintableHtml(bodyHtml, marks);
  document.body.appendChild(host);

  try {
    const canvas = await html2canvas(host, {
      backgroundColor: "#FDFBF7", scale: 2, useCORS: true, logging: false,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // A4 portrait — fit width
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    } else {
      // Multi-page: slice the long image vertically
      let position = 0;
      const pageRatio = pageH / imgH;
      const sliceCanvas = document.createElement("canvas");
      const ctx = sliceCanvas.getContext("2d")!;
      const sliceHpx = Math.floor(canvas.height * pageRatio);
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHpx;
      let yOffset = 0;
      let first = true;
      while (yOffset < canvas.height) {
        const h = Math.min(sliceHpx, canvas.height - yOffset);
        sliceCanvas.height = h;
        ctx.clearRect(0, 0, sliceCanvas.width, h);
        ctx.drawImage(canvas, 0, yOffset, canvas.width, h, 0, 0, canvas.width, h);
        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
        if (!first) pdf.addPage();
        const sH = (h * imgW) / canvas.width;
        pdf.addImage(sliceData, "JPEG", 0, 0, imgW, sH);
        first = false;
        yOffset += h;
      }
      void position;
    }
    pdf.save(fileName(template, "pdf"));
  } finally {
    document.body.removeChild(host);
  }
}

/* ───────────────────────── DOCX (docx package) ───────────────────────── */

export async function exportDocx(
  bodyHtml: string, marks: DocumentMarks, template: DocumentTemplate,
): Promise<void> {
  const docxLib = await import("docx");
  const {
    Document, Packer, Paragraph, TextRun, Header, Footer, ImageRun,
    AlignmentType, BorderStyle, HeightRule, Table, TableRow, TableCell, WidthType,
  } = docxLib as any;

  // Convert HTML body to plain text paragraphs (keep line breaks, drop tags).
  const tmp = document.createElement("div");
  tmp.innerHTML = DOMPurify.sanitize(bodyHtml);
  const paragraphs = Array.from(tmp.querySelectorAll<HTMLElement>("p, li, h1, h2, h3"))
    .map((el) => el.innerText.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) {
    paragraphs.push(tmp.innerText.trim() || "");
  }

  const bodyParas = paragraphs.map(
    (t) => new Paragraph({
      spacing: { after: 160, line: 320 },
      children: [new TextRun({ text: t, font: "Inter", size: 22, color: "1A1A1A" })],
    }),
  );

  // Signature + stamp embedded as ImageRun
  const extraChildren: any[] = [];
  if (marks.signature) {
    const data = await urlToDataUrl(marks.signature.url);
    const { w, h } = await getImageSize(data);
    const target = Math.min(220, marks.signature.width);
    const ratio = h / w;
    extraChildren.push(new Paragraph({ spacing: { before: 400 }, children: [
      new ImageRun({
        type: data.includes("image/png") ? "png" : "jpg",
        data: Uint8Array.from(atob(data.split(",")[1]), (c) => c.charCodeAt(0)),
        transformation: { width: target, height: Math.round(target * ratio) },
      } as any),
    ]}));
    extraChildren.push(new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: "1A1A1A", space: 1 } },
      children: [new TextRun({ text: "Authorised signature", font: "Inter", size: 18, color: "1A1A1A" })],
    }));
  }
  if (marks.stamp) {
    const data = await urlToDataUrl(marks.stamp.url);
    const { w, h } = await getImageSize(data);
    const target = Math.min(140, marks.stamp.width);
    const ratio = h / w;
    extraChildren.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 200 }, children: [
      new ImageRun({
        type: data.includes("image/png") ? "png" : "jpg",
        data: Uint8Array.from(atob(data.split(",")[1]), (c) => c.charCodeAt(0)),
        transformation: { width: target, height: Math.round(target * ratio) },
      } as any),
    ]}));
  }

  const header = new Header({
    children: [
      new Paragraph({
        children: [new TextRun({ text: "JBJ GLOBAL REAL ESTATE", bold: true, font: "Inter", size: 24, color: "1A1A1A" })],
      }),
      new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "B89555", space: 4 } },
        children: [new TextRun({ text: "Dubai, United Arab Emirates · contact@jbj.ae · www.jbj.ae", font: "Inter", size: 18, color: "1A1A1A" })],
      }),
    ],
  });
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "B89555", space: 4 } },
        children: [new TextRun({
          text: "JBJ GLOBAL REAL ESTATE LLC SOC · Dubai, UAE · contact@jbj.ae",
          font: "Inter", size: 16, color: "1A1A1A",
        })],
      }),
    ],
  });

  const doc = new Document({
    creator: "JBJ Global Real Estate",
    title: template.label,
    styles: { default: { document: { run: { font: "Inter", size: 22, color: "1A1A1A" } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
      headers: { default: header },
      footers: { default: footer },
      children: [...bodyParas, ...extraChildren],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName(template, "docx");
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  void Table; void TableRow; void TableCell; void WidthType; void HeightRule;
}

/* ───────────────────────── Print ───────────────────────── */

export function printDocument(bodyHtml: string, marks: DocumentMarks): void {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(buildPrintableHtml(bodyHtml, marks));
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch { /* ignore */ } }, 250);
}
