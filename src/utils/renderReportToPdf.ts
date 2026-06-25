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
import { REPORT_PAGE_PX } from "@/components/ai-home-finder/report/tokens";
import type { ReportBranding } from "@/components/ai-home-finder/ReportPreviewModal";

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

const waitForImages = (root: HTMLElement) =>
  Promise.all(
    Array.from(root.querySelectorAll("img")).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) return resolve();
          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
          // hard cap so a broken/cross-origin image never blocks export
          setTimeout(done, 4000);
        })
    )
  );

/**
 * Render <ReportEngine mode="pdf" /> offscreen and export to PDF.
 * Returns { blob, filename } so callers can download, attach, or upload.
 */
export async function renderReportToPdf(
  opts: RenderReportOptions
): Promise<{ blob: Blob; filename: string } | null> {
  if (!opts.projects?.length) return null;

  // Offscreen mount — kept on-screen at -10000px so html2canvas can paint
  // styles correctly (display:none / visibility:hidden break it).
  const host = document.createElement("div");
  host.setAttribute("data-report-export-host", "");
  host.style.cssText = [
    "position:fixed",
    "left:-10000px",
    "top:0",
    `width:${REPORT_PAGE_PX.width}px`,
    "pointer-events:none",
    "z-index:-1",
    "background:transparent",
  ].join(";");
  document.body.appendChild(host);

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
    await waitForImages(host);

    const pages = Array.from(host.querySelectorAll<HTMLElement>("[data-report-page]"));
    if (!pages.length) throw new Error("No report pages rendered");

    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#FDFBF7",
        logging: false,
        windowWidth: REPORT_PAGE_PX.width,
        windowHeight: REPORT_PAGE_PX.height,
      });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      if (i > 0) pdf.addPage();
      // Stretch to the full A4 sheet — both sides target the same aspect (A4),
      // so the on-screen and printed proportions stay equal.
      pdf.addImage(img, "JPEG", 0, 0, pdfW, pdfH, undefined, "FAST");
    }

    const sessionId =
      new URLSearchParams(window.location.search).get("session") || "session";
    const filename =
      opts.filename || `JBJ-AI-Recommendations-${sessionId}-${Date.now()}.pdf`;
    const blob = pdf.output("blob");
    return { blob, filename };
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
