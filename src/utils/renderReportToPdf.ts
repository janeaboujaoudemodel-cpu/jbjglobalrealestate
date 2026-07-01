/**
 * renderReportToPdf — captures the SAME ReportEngine that the Live Preview
 * renders into a multi-page A4 PDF using html2canvas + jsPDF.
 *
 * There is no parallel jsPDF layout. If the preview looks different from the
 * exported PDF, fix the React component — never branch the layout here.
 */
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ReportEngine,
  type ReportEngineProps,
  type ReportProject,
} from "@/components/ai-home-finder/report/ReportEngine";
import { PAGE_SEP_VAR, REPORT_PAGE_PX } from "@/components/ai-home-finder/report/tokens";
import type { ReportBranding } from "@/components/ai-home-finder/ReportPreviewModal";

// 1:1 A4 pixels are already the exact report design size (794×1123 @ 96dpi).
// Higher scales were the root cause of 2–3 minute exports on full reports.
const EXPORT_SCALE = 1;
const EXPORT_BACKGROUND = "#FDFBF7";

export interface RenderReportOptions {
  branding: ReportBranding;
  projects: ReportProject[];
  clientName?: string;
  clientRequirements?: Record<string, string | string[]>;
  filename?: string;
}

const waitForFonts = async () => {
  try {
    if ((document as any).fonts?.ready) {
      await (document as any).fonts.ready;
    }
  } catch {
    /* ignore */
  }
};

const waitForImages = (root: HTMLElement, timeoutMs = 1800) =>
  Promise.all(
    Array.from(root.querySelectorAll("img")).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          // hard cap so a broken/cross-origin image never blocks export
          setTimeout(done, timeoutMs);
        })
    )
  );

const makeFilename = (filename?: string) => {
  const sessionId =
    new URLSearchParams(window.location.search).get("session") || "session";
  return filename || `JBJ-AI-Recommendations-${sessionId}-${Date.now()}.pdf`;
};

const findLivePreviewRoot = () => {
  const modalRoot = document.getElementById("jbj-aihf-preview-root");
  const reportRoot = document.querySelector<HTMLElement>(
    "#jbj-report-contrast-lock-preview[data-report-root]"
  );
  if (!modalRoot || !reportRoot || !modalRoot.contains(reportRoot)) return null;
  return reportRoot;
};

const prepareLivePreviewForCapture = async <T,>(
  reportRoot: HTMLElement,
  fn: () => Promise<T>
) => {
  const host = reportRoot.parentElement as HTMLElement | null;
  if (!host) return fn();

  const previousStyle = host.getAttribute("style");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.top = "0";
  host.style.width = `${REPORT_PAGE_PX.width}px`;
  host.style.transform = "none";
  host.style.transformOrigin = "top left";
  host.style.pointerEvents = "none";
  host.style.zIndex = "-1";
  host.style.setProperty(PAGE_SEP_VAR, "0px");
  host.style.setProperty("--jbj-report-page-shadow", "none");

  await new Promise<void>((r) =>
    requestAnimationFrame(() => requestAnimationFrame(() => r()))
  );

  try {
    return await fn();
  } finally {
    if (previousStyle == null) host.removeAttribute("style");
    else host.setAttribute("style", previousStyle);
  }
};

const addCanvasPageToPdf = (
  pdf: jsPDF,
  sourceCanvas: HTMLCanvasElement,
  sourceY: number,
  pageIndex: number
) => {
  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = Math.round(REPORT_PAGE_PX.width * EXPORT_SCALE);
  pageCanvas.height = Math.round(REPORT_PAGE_PX.height * EXPORT_SCALE);
  const ctx = pageCanvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not create report page canvas");
  ctx.fillStyle = EXPORT_BACKGROUND;
  ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  ctx.drawImage(
    sourceCanvas,
    0,
    sourceY,
    pageCanvas.width,
    pageCanvas.height,
    0,
    0,
    pageCanvas.width,
    pageCanvas.height
  );

  const pdfW = REPORT_PAGE_PX.width;
  const pdfH = REPORT_PAGE_PX.height;
  if (pageIndex > 0) pdf.addPage();
  // PNG keeps exact brand colors; JPEG was shifting emerald/champagne boxes.
  pdf.addImage(pageCanvas.toDataURL("image/png"), "PNG", 0, 0, pdfW, pdfH, undefined, "FAST");
};

const captureReportRootToPdf = async (
  reportRoot: HTMLElement,
  pages: HTMLElement[],
  filename: string
): Promise<{ blob: Blob; filename: string }> => {
  const pdf = new jsPDF({
    unit: "px",
    format: [REPORT_PAGE_PX.width, REPORT_PAGE_PX.height],
    orientation: "portrait",
    hotfixes: ["px_scaling"],
  });

  // One DOM capture, then slice into A4 pages. Capturing each page separately
  // makes html2canvas re-clone/re-parse the entire modal N times and caused
  // minute-long exports. This keeps PDF output identical to the preview while
  // reducing work to a single render pass.
  const totalHeight = REPORT_PAGE_PX.height * pages.length;
  const canvas = await html2canvas(reportRoot, {
    scale: EXPORT_SCALE,
    useCORS: true,
    allowTaint: false,
    backgroundColor: EXPORT_BACKGROUND,
    logging: false,
    imageTimeout: 1800,
    removeContainer: true,
    width: REPORT_PAGE_PX.width,
    height: totalHeight,
    windowWidth: REPORT_PAGE_PX.width,
    windowHeight: totalHeight,
  });

  for (let i = 0; i < pages.length; i++) {
    addCanvasPageToPdf(pdf, canvas, i * REPORT_PAGE_PX.height * EXPORT_SCALE, i);
  }

  return { blob: pdf.output("blob"), filename };
};

/**
 * Render <ReportEngine mode="pdf" /> offscreen and export to PDF.
 * Returns { blob, filename } so callers can download, attach, or upload.
 */
export async function renderReportToPdf(
  opts: RenderReportOptions
): Promise<{ blob: Blob; filename: string } | null> {
  if (!opts.projects?.length) return null;

  const filename = makeFilename(opts.filename);

  // Fast path: capture the already-rendered Live Preview the user is looking at.
  // This avoids mounting a second React tree, avoids re-loading every image, and
  // guarantees the downloaded PDF uses the exact same CSS cascade and colors.
  const livePreviewRoot = findLivePreviewRoot();
  if (livePreviewRoot) {
    const pages = Array.from(
      livePreviewRoot.querySelectorAll<HTMLElement>("[data-report-page]")
    );
    if (pages.length) {
      await waitForFonts();
      await waitForImages(livePreviewRoot, 900);
      return prepareLivePreviewForCapture(livePreviewRoot, () =>
        captureReportRootToPdf(livePreviewRoot, pages, filename)
      );
    }
  }

  // Offscreen mount — kept on-screen at -10000px so html2canvas can paint
  // styles correctly (display:none / visibility:hidden break it).
  //
  // CRITICAL: Mount INSIDE the preview modal root when it exists so the exact
  // same CSS cascade (id-scoped overrides + inherited contrast guards) applies
  // to the PDF tree as to the on-screen Live Preview. Without this the PDF
  // renders with different colors than what the user just approved.
  const host = document.createElement("div");
  host.setAttribute("data-report-export-host", "");
  // Mirror the preview modal's guard-suppression attributes so global
  // contrast/champagne guards behave identically for both trees.
  host.setAttribute("data-no-contrast-guard", "");
  host.setAttribute("data-aihf-preview", "");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${REPORT_PAGE_PX.width}px`,
    "pointer-events:none",
    "z-index:-1",
    "background:transparent",
  ].join(";");
  const previewRoot = document.getElementById("jbj-aihf-preview-root");
  (previewRoot || document.body).appendChild(host);

  let root: Root | null = null;
  try {
    root = createRoot(host);
    root.render(
      createElement(ReportEngine, {
        mode: "pdf",
        branding: opts.branding,
        projects: opts.projects,
        clientName: opts.clientName,
        clientRequirements: opts.clientRequirements,
        pageIdPrefix: "pdf",
      } as ReportEngineProps)
    );

    // Two RAFs + microtask let React commit + layout flush before capture
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r()))
    );
    await waitForFonts();
    await waitForImages(host, 1800);

    const pages = Array.from(host.querySelectorAll<HTMLElement>("[data-report-page]"));
    if (!pages.length) throw new Error("No report pages rendered");
    return captureReportRootToPdf(host, pages, filename);
  } finally {
    try {
      root?.unmount();
    } catch {
      /* ignore */
    }
    host.remove();
  }
}

export default renderReportToPdf;
