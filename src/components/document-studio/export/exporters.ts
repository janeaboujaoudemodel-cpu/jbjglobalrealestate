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

/* ───────────────────────── Shared HTML → Canvas render ───────────────────────── */

/**
 * Capture the LIVE preview page in-place. The page is already a hard
 * 816×N rectangle (where N = 1154 × pageCount), with header + body + footer
 * laid out in a flex column. We strip ONLY the on-screen scale transform
 * (so html2canvas captures the page at its true 816-px width) and restore
 * everything in a try/finally so the preview is untouched.
 */
async function renderElementCanvas(el: HTMLElement, scale = 1.6): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");

  const prev = {
    transform: el.style.transform,
    transformOrigin: el.style.transformOrigin,
    boxShadow: el.style.boxShadow,
    borderRadius: el.style.borderRadius,
  };
  const hidden: { node: HTMLElement; prevDisplay: string }[] = [];
  const styled: { node: HTMLElement; overflow: string; textOverflow: string; marginTop: string; paddingTop: string }[] = [];
  const hideNode = (node: HTMLElement) => {
    if (hidden.some((entry) => entry.node === node)) return;
    hidden.push({ node, prevDisplay: node.style.display });
    node.style.display = "none";
  };
  const touchExportStyle = (node: HTMLElement) => {
    if (styled.some((entry) => entry.node === node)) return;
    styled.push({
      node,
      overflow: node.style.overflow,
      textOverflow: node.style.textOverflow,
      marginTop: node.style.marginTop,
      paddingTop: node.style.paddingTop,
    });
  };
  el.querySelectorAll<HTMLElement>('[aria-label="Remove field"],[data-drag-guide="true"]').forEach((n) => {
    hideNode(n);
  });
  el.querySelectorAll<HTMLElement>('[data-sig-detail-rows="1"],[data-sig-detail-rows="1"] *').forEach((n) => {
    touchExportStyle(n);
    n.style.overflow = "visible";
    n.style.textOverflow = "clip";
  });
  el.querySelectorAll<HTMLElement>('[data-signature-block="1"]').forEach((block) => {
    touchExportStyle(block);
    block.style.marginTop = "0";
    block.style.paddingTop = "14px";
  });
  el.querySelectorAll<HTMLElement>("[data-removable-field]").forEach((row) => {
    const valueCell = row.querySelector<HTMLElement>("[data-field-value-cell]");
    const probe = valueCell || row;
    const hasValue = (probe.textContent || "").replace(/×/g, "").replace(/\u00a0/g, " ").trim().length > 0;
    if (!hasValue) hideNode(row);
  });
  el.querySelectorAll<HTMLTableElement>("table").forEach((table) => {
    const visibleRows = Array.from(table.querySelectorAll<HTMLElement>("tbody tr")).filter((row) => row.style.display !== "none");
    if (visibleRows.length === 0 && table.querySelector("tbody")) hideNode(table);
  });
  if (!el.querySelector('[data-pdf-section="commission"]:not([style*="display: none"]),[data-pdf-section="comp-commission"]:not([style*="display: none"])')) {
    el.querySelectorAll<HTMLElement>('[data-pdf-section="commission-note"]').forEach(hideNode);
  }

  el.style.transform = "none";
  el.style.transformOrigin = "top left";
  el.style.boxShadow = "none";
  el.style.borderRadius = "0";

  const widthPx = el.offsetWidth || 816;
  const heightPx = el.offsetHeight || 1154;

  try {
    return await html2canvas(el, {
      backgroundColor: "#FDFBF7",
      scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 4000,
      removeContainer: true,
      width: widthPx,
      height: heightPx,
      windowWidth: widthPx,
      windowHeight: heightPx,
      ignoreElements: (e) =>
        e.tagName === "SCRIPT" ||
        (e instanceof HTMLElement &&
          (e.getAttribute("aria-label") === "Remove field" ||
            e.getAttribute("data-drag-guide") === "true")),
    });
  } finally {
    el.style.transform = prev.transform;
    el.style.transformOrigin = prev.transformOrigin;
    el.style.boxShadow = prev.boxShadow;
    el.style.borderRadius = prev.borderRadius;
    hidden.forEach(({ node, prevDisplay }) => { node.style.display = prevDisplay; });
    styled.forEach(({ node, overflow, textOverflow, marginTop, paddingTop }) => {
      node.style.overflow = overflow;
      node.style.textOverflow = textOverflow;
      node.style.marginTop = marginTop;
      node.style.paddingTop = paddingTop;
    });
  }
}

// Yield to the browser between heavy operations so the UI doesn't appear "stuck".
const yieldToUi = () => new Promise<void>((resolve) => {
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
  else setTimeout(resolve, 0);
});

/** Off-screen chrome render (fallback when no live element is provided). */
async function renderHostCanvas(bodyHtml: string, marks: DocumentMarks) {
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:816px;background:#FDFBF7;color:#1A1A1A;font-family:Inter,system-ui,sans-serif;";
  host.innerHTML = buildPrintableHtml(bodyHtml, marks);
  document.body.appendChild(host);
  try {
    return await renderElementCanvas(host);
  } finally {
    if (host.parentNode) document.body.removeChild(host);
  }
}

/* ───────────────────────── PDF (jsPDF) ───────────────────────── */

export async function exportPdf(
  bodyHtml: string, marks: DocumentMarks, template: DocumentTemplate,
  sourceElement?: HTMLElement | null,
  onProgress?: (done: number, total: number) => void,
): Promise<Blob> {
  const { default: jsPDF } = await import("jspdf");

  const livePages = sourceElement
    ? Array.from(sourceElement.querySelectorAll<HTMLElement>('[data-document-page="true"]'))
    : [];

  const triggerDownload = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { document.body.removeChild(a); } catch { /* ignore */ }
      URL.revokeObjectURL(url);
    }, 1500);
  };

  if (livePages.length > 0) {
    const A4_W = 210;
    const A4_H = 297;
    const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });

    for (let i = 0; i < livePages.length; i += 1) {
      onProgress?.(i, livePages.length);
      const canvas = await renderElementCanvas(livePages[i]);
      const data = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage();
      pdf.addImage(data, "JPEG", 0, 0, A4_W, A4_H);
    }
    onProgress?.(livePages.length, livePages.length);

    const blob = pdf.output("blob");
    triggerDownload(blob, fileName(template, "pdf"));
    return blob;
  }

  // Collect logical block boundaries from the live DOM BEFORE rasterising,
  // so we can avoid slicing through tables / signatures / terms items.
  const SCALE = 2; // matches renderElementCanvas
  const sectionBottomsCss: number[] = [];
  if (sourceElement) {
    const rootTop = sourceElement.getBoundingClientRect().top;
    sourceElement.querySelectorAll<HTMLElement>("[data-pdf-section]").forEach((el) => {
      const r = el.getBoundingClientRect();
      sectionBottomsCss.push(r.bottom - rootTop);
    });
    sectionBottomsCss.sort((a, b) => a - b);
  }

  const canvas = sourceElement
    ? await renderElementCanvas(sourceElement)
    : await renderHostCanvas(bodyHtml, marks);

  const sectionBottoms = sectionBottomsCss.map((y) => Math.round(y * SCALE));

  const A4_W = 210;
  const A4_H = 297;
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });

  const sliceHpx = Math.round((canvas.width * A4_H) / A4_W);
  const sliceCanvas = document.createElement("canvas");
  const ctx = sliceCanvas.getContext("2d")!;
  sliceCanvas.width = canvas.width;
  // Always render onto a FULL A4 page (whitespace fills any gap left by an
  // early break). This is what stops tables from being cropped mid-row.
  sliceCanvas.height = sliceHpx;

  const MIN_PROGRESS = Math.round(sliceHpx * 0.25);
  let yOffset = 0;
  let first = true;

  while (yOffset < canvas.height) {
    const naturalEnd = Math.min(yOffset + sliceHpx, canvas.height);
    let cut = naturalEnd;
    if (naturalEnd < canvas.height) {
      // Find the largest section-bottom that fits inside this page.
      let best = -1;
      for (const b of sectionBottoms) {
        if (b > yOffset + MIN_PROGRESS && b <= naturalEnd) best = b;
        else if (b > naturalEnd) break;
      }
      if (best > 0) cut = best;
    }
    const h = cut - yOffset;

    ctx.fillStyle = "#FDFBF7";
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(canvas, 0, yOffset, canvas.width, h, 0, 0, canvas.width, h);

    const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
    if (!first) pdf.addPage();
    pdf.addImage(sliceData, "JPEG", 0, 0, A4_W, A4_H);
    first = false;
    yOffset = cut;
  }
  const blob = pdf.output("blob");
  triggerDownload(blob, fileName(template, "pdf"));
  return blob;
}



/* ───────────────────────── PNG ───────────────────────── */

export async function exportPng(
  bodyHtml: string, marks: DocumentMarks, template: DocumentTemplate,
  sourceElement?: HTMLElement | null,
): Promise<void> {
  const canvas = sourceElement
    ? await renderElementCanvas(sourceElement)
    : await renderHostCanvas(bodyHtml, marks);
  const dataUrl = canvas.toDataURL("image/png");
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName(template, "png");
  document.body.appendChild(a); a.click(); a.remove();
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
      properties: {
        page: {
          size: { width: 11906, height: 16838, orientation: "portrait" },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
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
