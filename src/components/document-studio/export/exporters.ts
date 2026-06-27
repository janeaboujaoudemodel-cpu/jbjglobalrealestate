/**
 * Document Studio exporters — real PDF and DOCX downloads.
 * Both render the locked JBJ chrome around the AI body and embed any
 * signature / stamp the user has placed on the document.
 */
import DOMPurify from "dompurify";
import { wrapWithJbjChrome } from "@/templates/jbjLockedChrome";
import type { DocumentTemplate } from "@/config/documentCatalog";

const PDF_PAGE_SCALE = 1.8;
const PDF_JPEG_QUALITY = 0.94;
const LIVE_PAGE_WIDTH = 816;
const LIVE_PAGE_HEIGHT = 1154;
const EXPORT_PAGE_BACKGROUND = "#FDFBF7";

let html2canvasLoader: Promise<(typeof import("html2canvas"))["default"]> | null = null;
let jsPdfLoader: Promise<(typeof import("jspdf"))["default"]> | null = null;

const loadHtml2Canvas = () => {
  html2canvasLoader ??= import("html2canvas").then((m) => m.default);
  return html2canvasLoader;
};

const loadJsPdf = () => {
  jsPdfLoader ??= import("jspdf").then((m) => m.default);
  return jsPdfLoader;
};

export const preloadExportLibraries = () => {
  void Promise.all([loadHtml2Canvas(), loadJsPdf()]);
};

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
async function renderElementCanvas(el: HTMLElement, scale = PDF_PAGE_SCALE): Promise<HTMLCanvasElement> {
  const html2canvas = await loadHtml2Canvas();

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
      foreignObjectRendering: true,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 1800,
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

async function renderPageCanvasWithMirrorFallback(el: HTMLElement, scale = PDF_PAGE_SCALE): Promise<HTMLCanvasElement> {
  try {
    return await renderElementCanvas(el, scale);
  } catch (error) {
    const message = String((error as Error)?.message || error || "");
    if (!/cloned iframe|Unable to find element/i.test(message)) throw error;

    // html2canvas can occasionally lose the source node when a transformed
    // page is captured inside the live editor overlay. Clone the exact page
    // node into the same document, keep all classes/inline styles/assets, and
    // capture that mirror instead. This preserves preview pixels while making
    // export deterministic instead of failing/stalling.
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.left = "-10000px";
    clone.style.top = "0";
    clone.style.width = `${el.offsetWidth || 816}px`;
    clone.style.height = `${el.offsetHeight || 1154}px`;
    clone.style.transform = "none";
    clone.style.transformOrigin = "top left";
    clone.style.opacity = "1";
    clone.style.pointerEvents = "none";
    document.body.appendChild(clone);
    try {
      return await renderElementCanvas(clone, scale);
    } finally {
      clone.remove();
    }
  }
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const ratio = Math.max(w / iw, h / ih);
  const sw = w / ratio;
  const sh = h / ratio;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}

function drawImageContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const iw = img.naturalWidth || img.width || 1;
  const ih = img.naturalHeight || img.height || 1;
  const ratio = Math.min(w / iw, h / ih);
  const dw = iw * ratio;
  const dh = ih * ratio;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

async function cloneImagesIntoCanvas(sourceCanvas: HTMLCanvasElement, page: HTMLElement): Promise<boolean> {
  const images = Array.from(page.querySelectorAll<HTMLImageElement>("img"))
    .filter((img) => {
      const src = img.currentSrc || img.src;
      if (!src || /^data:image\/svg\+xml/i.test(src)) return false;
      const rect = img.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  if (!images.length) return false;

  const pageRect = page.getBoundingClientRect();
  const ctx = sourceCanvas.getContext("2d");
  if (!ctx) return false;
  const sx = sourceCanvas.width / (page.offsetWidth || LIVE_PAGE_WIDTH);
  const sy = sourceCanvas.height / (page.offsetHeight || LIVE_PAGE_HEIGHT);
  let painted = false;

  for (const img of images) {
    try {
      if (!img.complete || !img.naturalWidth) {
        await new Promise<void>((resolve) => {
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          setTimeout(done, 350);
        });
      }
      if (!img.naturalWidth) continue;
      const r = img.getBoundingClientRect();
      const x = (r.left - pageRect.left) * sx;
      const y = (r.top - pageRect.top) * sy;
      const w = r.width * sx;
      const h = r.height * sy;
      ctx.save();
      ctx.globalAlpha = Number(getComputedStyle(img).opacity || "1") || 1;
      const transform = getComputedStyle(img).transform;
      if (transform && transform !== "none") {
        ctx.translate(x + w / 2, y + h / 2);
        try {
          const matrix = new DOMMatrixReadOnly(transform);
          ctx.transform(matrix.a, matrix.b, matrix.c, matrix.d, 0, 0);
        } catch { /* ignore invalid CSS transform */ }
        ctx.translate(-w / 2, -h / 2);
        const fit = getComputedStyle(img).objectFit;
        if (fit === "cover") drawImageCover(ctx, img, 0, 0, w, h);
        else drawImageContain(ctx, img, 0, 0, w, h);
      } else {
        const fit = getComputedStyle(img).objectFit;
        if (fit === "cover") drawImageCover(ctx, img, x, y, w, h);
        else drawImageContain(ctx, img, x, y, w, h);
      }
      ctx.restore();
      painted = true;
    } catch {
      try { ctx.restore(); } catch { /* ignore */ }
    }
  }
  return painted;
}

async function renderFastPageCanvas(page: HTMLElement, scale = PDF_PAGE_SCALE): Promise<HTMLCanvasElement> {
  const html2canvas = await loadHtml2Canvas();

  // Capture a visible fixed clone instead of the live page. Capturing the live
  // pages directly is unreliable once pages 2+ are below/above the viewport: in
  // Chromium html2canvas can crop the source to a transparent rectangle, which
  // then becomes an all-white/all-black PDF page after JPEG encoding. The clone
  // keeps the preview untouched while giving html2canvas a stable 816×1154 target
  // at (0,0) for every page.
  const widthPx = page.offsetWidth || LIVE_PAGE_WIDTH;
  const heightPx = page.offsetHeight || LIVE_PAGE_HEIGHT;
  const stage = document.createElement("div");
  const clone = page.cloneNode(true) as HTMLElement;
  stage.setAttribute("data-export-page-stage", "true");
  stage.style.cssText = [
    "position:fixed",
    "left:-20000px",
    "top:0",
    `width:${widthPx}px`,
    `height:${heightPx}px`,
    `background:${EXPORT_PAGE_BACKGROUND}`,
    "overflow:hidden",
    "pointer-events:none",
    "z-index:2147483000",
  ].join(";");
  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";
  clone.style.boxShadow = "none";
  clone.style.borderRadius = "0";
  clone.style.margin = "0";
  clone.style.width = `${widthPx}px`;
  clone.style.height = `${heightPx}px`;
  clone.style.background = EXPORT_PAGE_BACKGROUND;
  clone.querySelectorAll<HTMLElement>("[data-page-export-ignore]").forEach((node) => node.remove());
  // html2canvas has blend/filter edge cases that can turn transparent PNG layers
  // into a solid black page during rasterisation. The live preview still keeps
  // its premium blend mode; the export clone uses normal blending at the same
  // opacity so the watermark/stamp remain visible without corrupting the page.
  clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
    const style = node.style as CSSStyleDeclaration;
    if (style.mixBlendMode && style.mixBlendMode !== "normal") style.mixBlendMode = "normal";
  });
  stage.appendChild(clone);
  document.body.appendChild(stage);
  try {
    const footerIconOverlays = prepareFooterIconsForMeasuredExport(clone, clone);
    await yieldToUi();
    const canvas = await html2canvas(clone, {
      backgroundColor: EXPORT_PAGE_BACKGROUND,
      scale,
      foreignObjectRendering: false,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 2200,
      removeContainer: true,
      width: widthPx,
      height: heightPx,
      windowWidth: widthPx,
      windowHeight: heightPx,
      ignoreElements: (e) =>
        e.tagName === "SCRIPT" ||
        (e instanceof HTMLElement &&
          (e.getAttribute("aria-label") === "Remove field" ||
            e.getAttribute("aria-label") === "Change mark" ||
            e.getAttribute("aria-label") === "Resize mark" ||
            e.getAttribute("aria-label") === "Unlock mark" ||
            e.getAttribute("aria-label") === "Lock mark" ||
            e.getAttribute("data-drag-guide") === "true" ||
            e.hasAttribute("data-page-export-ignore") ||
            !!e.closest("[data-page-export-ignore]"))),
    });
    if (isCanvasVisuallyBlank(canvas)) {
      canvas.width = 0; canvas.height = 0;
      const fallbackCanvas = await renderElementCanvas(clone, scale);
      drawFooterIconOverlays(fallbackCanvas, footerIconOverlays, clone);
      return fallbackCanvas;
    }
    drawFooterIconOverlays(canvas, footerIconOverlays, clone);
    return canvas;
  } finally {
    stage.remove();
  }
}

function isCanvasVisuallyBlank(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx || canvas.width < 2 || canvas.height < 2) return true;
  const stepX = Math.max(1, Math.floor(canvas.width / 24));
  const stepY = Math.max(1, Math.floor(canvas.height / 32));
  let sampled = 0;
  let ink = 0;
  for (let y = Math.floor(stepY / 2); y < canvas.height; y += stepY) {
    for (let x = Math.floor(stepX / 2); x < canvas.width; x += stepX) {
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      sampled += 1;
      if (a > 12 && (r < 244 || g < 240 || b < 232)) ink += 1;
      if (ink >= 8) return false;
    }
  }
  return sampled > 0;
}

type FooterIconKind = "location" | "phone" | "mail" | "globe";

type FooterIconOverlay = {
  kind: FooterIconKind;
  x: number;
  y: number;
  size: number;
};

function prepareFooterIconsForMeasuredExport(root: HTMLElement, captureRoot: HTMLElement): FooterIconOverlay[] {
  const rootRect = captureRoot.getBoundingClientRect();
  const overlays: FooterIconOverlay[] = [];
  root.querySelectorAll<HTMLElement>('[data-jbj-locked-footer="true"]').forEach((footer) => {
    Array.from(footer.querySelectorAll<SVGElement>("svg")).forEach((svg) => {
      const wrapper = svg.parentElement as HTMLElement | null;
      if (wrapper) {
        const row = wrapper.parentElement as HTMLElement | null;
        const kind = inferFooterIconKindFromSvg(svg) || inferFooterIconKind((row?.textContent || "").trim());

        const wrapperRect = wrapper.getBoundingClientRect();
        const siblingText = Array.from(row?.children || []).find((child) => {
          if (child === wrapper) return false;
          const text = (child.textContent || "").trim();
          return text.length > 0;
        }) as HTMLElement | undefined;
        const textRect = (siblingText || row || wrapper).getBoundingClientRect();
        const iconSize = 12;
        overlays.push({
          kind,
          x: wrapperRect.left - rootRect.left,
          // Do not rely on SVG/flex baselines inside html2canvas. Hide the SVG
          // and paint the icon directly on the captured page canvas using the
          // adjacent text line-box center from the cloned DOM. This is export-
          // only and leaves the live preview completely untouched.
          y: textRect.top - rootRect.top + (textRect.height - iconSize) / 2,
          size: iconSize,
        });

        wrapper.style.width = "12px";
        wrapper.style.height = "14px";
        wrapper.style.minWidth = "12px";
        wrapper.style.maxWidth = "12px";
        wrapper.style.lineHeight = "14px";
        wrapper.style.display = "block";
        wrapper.style.position = "relative";
        wrapper.style.overflow = "visible";
        wrapper.style.flex = "0 0 12px";
        wrapper.style.verticalAlign = "top";
        wrapper.replaceChildren();
      }
    });
  });
  return overlays;
}

function drawFooterIconOverlays(canvas: HTMLCanvasElement, overlays: FooterIconOverlay[], captureRoot: HTMLElement): void {
  if (!overlays.length) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const sx = canvas.width / (captureRoot.offsetWidth || LIVE_PAGE_WIDTH);
  const sy = canvas.height / (captureRoot.offsetHeight || LIVE_PAGE_HEIGHT);
  overlays.forEach((overlay) => {
    drawPremiumFooterIcon(ctx, overlay.kind, overlay.x, overlay.y, overlay.size, sx, sy);
  });
}

function inferFooterIconKind(text: string): FooterIconKind {
  const value = text.toLowerCase();
  if (/office|port saeed|deira|dubai|uae/.test(value) && !value.includes("+") && !value.includes("@")) return "location";
  if (value.includes("www") || value.includes(".ae")) return "globe";
  if (value.includes("@")) return "mail";
  if (value.includes("+") || /\d{2,}/.test(value)) return "phone";
  return "location";
}

function inferFooterIconKindFromSvg(svg: SVGElement): FooterIconKind | null {
  const html = svg.outerHTML;
  if (html.includes("M8 14.25s5-4.45")) return "location";
  if (html.includes("M4.08 2.05")) return "phone";
  if (html.includes("<rect") && html.includes("M2.55 4.55")) return "mail";
  if (html.includes("<ellipse") && html.includes("M2.15 8h11.7")) return "globe";
  return null;
}

function strokePath(ctx: CanvasRenderingContext2D, d: string) {
  try {
    ctx.stroke(new Path2D(d));
  } catch {
    // Path2D SVG strings are supported in Chromium; ignore only if a legacy
    // engine cannot parse the path. The other footer icons still draw.
  }
}

function drawPremiumFooterIcon(
  ctx: CanvasRenderingContext2D,
  kind: FooterIconKind,
  x: number,
  y: number,
  size: number,
  sx: number,
  sy: number,
) {
  ctx.save();
  ctx.translate(x * sx, y * sy);
  ctx.scale(sx, sy);
  ctx.scale(size / 16, size / 16);
  ctx.strokeStyle = "#B89555";
  ctx.fillStyle = "transparent";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 1.25;

  if (kind === "location") {
    ctx.lineWidth = 1.35;
    strokePath(ctx, "M8 14.25s5-4.45 5-8.05A5 5 0 0 0 3 6.2c0 3.6 5 8.05 5 8.05Z");
    ctx.beginPath();
    ctx.lineWidth = 1.2;
    ctx.arc(8, 6.25, 1.72, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === "phone") {
    ctx.lineWidth = 1.35;
    strokePath(ctx, "M4.08 2.05 5.9 4.5c.3.4.24.96-.13 1.3l-.9.83a.56.56 0 0 0-.12.66 9.05 9.05 0 0 0 3.96 3.96c.23.11.5.06.66-.12l.83-.9a.96.96 0 0 1 1.3-.13l2.45 1.82c.43.32.52.93.2 1.36l-.63.84c-.56.75-1.54 1.05-2.43.75-4.6-1.53-8.4-5.33-9.93-9.93-.3-.89 0-1.87.75-2.43l.84-.63c.43-.32 1.04-.23 1.36.2Z");
  } else if (kind === "mail") {
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(1.75, 3.5, 12.5, 9, 1.35);
    else ctx.rect(1.75, 3.5, 12.5, 9);
    ctx.stroke();
    ctx.lineWidth = 1.25;
    strokePath(ctx, "M2.55 4.55 8 8.42l5.45-3.87");
  } else {
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(8, 8, 6.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.ellipse(8, 8, 2.55, 6.15, 0, 0, Math.PI * 2);
    ctx.stroke();
    strokePath(ctx, "M2.15 8h11.7M3.75 4.55h8.5M3.75 11.45h8.5");
  }
  ctx.restore();
}

async function renderLivePagesStackCanvas(pages: HTMLElement[], scale = PDF_PAGE_SCALE): Promise<HTMLCanvasElement> {
  const html2canvas = await loadHtml2Canvas();
  const pageW = pages[0]?.offsetWidth || LIVE_PAGE_WIDTH;
  const pageH = pages[0]?.offsetHeight || LIVE_PAGE_HEIGHT;
  const totalH = pageH * pages.length;
  const host = document.createElement("div");
  host.setAttribute("data-export-stack", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-20000px",
    "top:0",
    `width:${pageW}px`,
    `height:${totalH}px`,
    `background:${EXPORT_PAGE_BACKGROUND}`,
    "overflow:hidden",
    "pointer-events:none",
    "z-index:2147483000",
  ].join(";");

  pages.forEach((page) => {
    const clone = page.cloneNode(true) as HTMLElement;
    clone.style.transform = "none";
    clone.style.transformOrigin = "top left";
    clone.style.boxShadow = "none";
    clone.style.borderRadius = "0";
    clone.style.border = "0";
    clone.style.margin = "0";
    clone.style.width = `${pageW}px`;
    clone.style.height = `${pageH}px`;
    clone.style.position = "relative";
    clone.style.background = EXPORT_PAGE_BACKGROUND;
    clone.querySelectorAll<HTMLElement>("[data-page-export-ignore]").forEach((node) => node.remove());
    clone.querySelectorAll<HTMLElement>("*").forEach((node) => {
      const style = node.style as CSSStyleDeclaration;
      if (style.mixBlendMode && style.mixBlendMode !== "normal") style.mixBlendMode = "normal";
    });
    host.appendChild(clone);
  });

  document.body.appendChild(host);
  try {
    replaceFooterSvgsWithCanvasForExport(host);
    await yieldToUi();
    const canvas = await html2canvas(host, {
      backgroundColor: EXPORT_PAGE_BACKGROUND,
      scale,
      foreignObjectRendering: false,
      useCORS: true,
      allowTaint: false,
      logging: false,
      imageTimeout: 2200,
      removeContainer: true,
      width: pageW,
      height: totalH,
      windowWidth: pageW,
      windowHeight: totalH,
      ignoreElements: (e) =>
        e.tagName === "SCRIPT" ||
        (e instanceof HTMLElement &&
          (e.getAttribute("aria-label") === "Remove field" ||
            e.getAttribute("aria-label") === "Change mark" ||
            e.getAttribute("aria-label") === "Resize mark" ||
            e.getAttribute("aria-label") === "Unlock mark" ||
            e.getAttribute("aria-label") === "Lock mark" ||
            e.getAttribute("data-drag-guide") === "true" ||
            e.hasAttribute("data-page-export-ignore") ||
            !!e.closest("[data-page-export-ignore]"))),
    });
    if (isCanvasVisuallyBlank(canvas)) throw new Error("Fast stacked capture was blank");
    return canvas;
  } finally {
    host.remove();
  }
}

// Yield to the browser between heavy operations so the UI doesn't appear "stuck".
const yieldToUi = () => new Promise<void>((resolve) => {
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => resolve());
  else setTimeout(resolve, 0);
});

const canvasToJpegBytes = (canvas: HTMLCanvasElement, quality = PDF_JPEG_QUALITY) =>
  new Promise<Uint8Array>((resolve) => {
    // JPEG has no alpha channel. If html2canvas leaves any transparent pixels,
    // browsers encode them as black. Flatten first onto the JBJ paper color so
    // a transparent capture can never become a black PDF page.
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = EXPORT_PAGE_BACKGROUND;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);

    out.toBlob(async (blob) => {
      if (blob) {
        resolve(new Uint8Array(await blob.arrayBuffer()));
        out.width = 0; out.height = 0;
        return;
      }
      const dataUrl = out.toDataURL("image/jpeg", quality);
      const binary = atob(dataUrl.split(",")[1] || "");
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      resolve(bytes);
      out.width = 0; out.height = 0;
    }, "image/jpeg", quality);
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
  const [jsPDF] = await Promise.all([loadJsPdf(), loadHtml2Canvas()]);

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

    onProgress?.(0, livePages.length);
    let usedStack = false;
    if (livePages.length > 1) {
      try {
        const stack = await renderLivePagesStackCanvas(livePages, PDF_PAGE_SCALE);
        const pageSliceH = Math.round(stack.height / livePages.length);
        const slice = document.createElement("canvas");
        slice.width = stack.width;
        slice.height = pageSliceH;
        const ctx = slice.getContext("2d")!;
        for (let i = 0; i < livePages.length; i += 1) {
          onProgress?.(i, livePages.length);
          ctx.fillStyle = EXPORT_PAGE_BACKGROUND;
          ctx.fillRect(0, 0, slice.width, slice.height);
          ctx.drawImage(stack, 0, i * pageSliceH, stack.width, pageSliceH, 0, 0, slice.width, slice.height);
          if (isCanvasVisuallyBlank(slice)) throw new Error(`Fast stacked capture produced a blank page ${i + 1}`);
          const data = await canvasToJpegBytes(slice);
          if (i > 0) pdf.addPage();
          pdf.addImage(data, "JPEG", 0, 0, A4_W, A4_H, undefined, "FAST");
          await yieldToUi();
        }
        slice.width = 0; slice.height = 0;
        stack.width = 0; stack.height = 0;
        usedStack = true;
      } catch (error) {
        console.warn("[DocumentStudio] fast stacked export fallback", error);
      }
    }

    if (!usedStack) {
      for (let i = 0; i < livePages.length; i += 1) {
        onProgress?.(i, livePages.length);
        await yieldToUi();
        const canvas = await renderFastPageCanvas(livePages[i], PDF_PAGE_SCALE).catch(() =>
          renderPageCanvasWithMirrorFallback(livePages[i], PDF_PAGE_SCALE),
        );
        const data = await canvasToJpegBytes(canvas);
        canvas.width = 0; canvas.height = 0;
        if (i > 0) pdf.addPage();
        pdf.addImage(data, "JPEG", 0, 0, A4_W, A4_H, undefined, "FAST");
      }
    }

    onProgress?.(livePages.length, livePages.length);

    const blob = pdf.output("blob");
    triggerDownload(blob, fileName(template, "pdf"));
    return blob;
  }

  // Collect logical block boundaries from the live DOM BEFORE rasterising,
  // so we can avoid slicing through tables / signatures / terms items.
  const SCALE = PDF_PAGE_SCALE; // matches renderElementCanvas
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

    const sliceData = await canvasToJpegBytes(sliceCanvas, PDF_JPEG_QUALITY);
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
