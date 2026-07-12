import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export type ExportFormat = "pdf" | "png" | "jpg" | "pptx";
export type ExportTheme = "white" | "emerald";

const EMERALD = "#064E3B";
const EMERALD_DEEP = "#042C1C";
const CHAMPAGNE = "#B89555";

const captureNode = async (node: HTMLElement, theme: ExportTheme): Promise<HTMLCanvasElement> => {
  return await html2canvas(node, {
    backgroundColor: theme === "emerald" ? EMERALD_DEEP : "#FFFFFF",
    scale: 2,
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
    windowHeight: node.scrollHeight,
  });
};

const download = (dataUrl: string, filename: string) => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const applyThemeOverlay = (node: HTMLElement, theme: ExportTheme) => {
  const prevBg = node.style.background;
  const prevBgImg = node.style.backgroundImage;
  if (theme === "white") {
    node.style.background = "#FFFFFF";
    node.style.backgroundImage = "none";
    node.setAttribute("data-export-theme", "white");
  } else {
    node.setAttribute("data-export-theme", "emerald");
  }
  return () => {
    node.style.background = prevBg;
    node.style.backgroundImage = prevBgImg;
    node.removeAttribute("data-export-theme");
  };
};

export interface ExportOptions {
  filename?: string;
  theme: ExportTheme;
  projects: Array<{ name: string; developer?: string; location?: string; price?: string; url?: string }>;
  meta?: { client?: string; preparedBy?: string };
}

export async function exportComparison(
  targetSelector: string,
  format: ExportFormat,
  options: ExportOptions,
): Promise<void> {
  const node = document.querySelector(targetSelector) as HTMLElement | null;
  if (!node) throw new Error("Comparison content not found");

  const restore = applyThemeOverlay(node, options.theme);
  const baseName = options.filename || `JBJ-Comparison-${options.theme}-${Date.now()}`;

  try {
    if (format === "pptx") {
      await exportPptx(node, baseName, options);
      return;
    }

    const canvas = await captureNode(node, options.theme);

    if (format === "png") {
      download(canvas.toDataURL("image/png"), `${baseName}.png`);
      return;
    }
    if (format === "jpg") {
      download(canvas.toDataURL("image/jpeg", 0.95), `${baseName}.jpg`);
      return;
    }
    if (format === "pdf") {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      // Fill background for theme
      pdf.setFillColor(options.theme === "emerald" ? EMERALD_DEEP : "#FFFFFF");
      pdf.rect(0, 0, canvas.width, canvas.height, "F");
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      // Listing links footer
      if (options.projects.length) {
        pdf.setFontSize(10);
        pdf.setTextColor(options.theme === "emerald" ? "#FFFFFF" : "#1A1A1A");
      }
      pdf.save(`${baseName}.pdf`);
      return;
    }
  } finally {
    restore();
  }
}

async function exportPptx(node: HTMLElement, baseName: string, options: ExportOptions) {
  const canvas = await captureNode(node, options.theme);
  const dataUrl = canvas.toDataURL("image/png");
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  const bg = options.theme === "emerald" ? EMERALD_DEEP : "FFFFFF";

  // Cover slide
  const cover = pptx.addSlide();
  cover.background = { color: bg };
  cover.addText("JBJ GLOBAL REAL ESTATE", {
    x: 0.5, y: 2.6, w: 12.33, h: 0.6, fontSize: 24, bold: true, color: options.theme === "emerald" ? "FFFFFF" : "064E3B", align: "center", fontFace: "Georgia",
  });
  cover.addText("AI Property Comparison Report", {
    x: 0.5, y: 3.3, w: 12.33, h: 0.6, fontSize: 32, bold: true, color: options.theme === "emerald" ? CHAMPAGNE.replace("#","") : "1A1A1A", align: "center", fontFace: "Georgia",
  });
  cover.addText(options.projects.map(p => p.name).join("  •  "), {
    x: 0.5, y: 4.2, w: 12.33, h: 0.5, fontSize: 14, color: options.theme === "emerald" ? "FFFFFF" : "064E3B", align: "center",
  });
  cover.addText(new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }), {
    x: 0.5, y: 6.6, w: 12.33, h: 0.3, fontSize: 11, color: options.theme === "emerald" ? "FFFFFF" : "5a5246", align: "center",
  });

  // Comparison snapshot
  const slide = pptx.addSlide();
  slide.background = { color: bg };
  const ratio = canvas.height / canvas.width;
  const w = 12.33;
  const h = Math.min(6.5, w * ratio);
  slide.addImage({ data: dataUrl, x: 0.5, y: (7.5 - h) / 2, w, h });

  // Listings slide
  if (options.projects.length) {
    const links = pptx.addSlide();
    links.background = { color: bg };
    links.addText("Property Listings", {
      x: 0.5, y: 0.4, w: 12.33, h: 0.6, fontSize: 24, bold: true,
      color: options.theme === "emerald" ? "FFFFFF" : "064E3B", fontFace: "Georgia",
    });
    options.projects.forEach((p, i) => {
      const y = 1.2 + i * 0.55;
      links.addText(
        [
          { text: `${p.name}`, options: { bold: true, color: options.theme === "emerald" ? "FFFFFF" : "1A1A1A" } },
          { text: `  —  ${p.developer || ""} · ${p.location || ""} · ${p.price || ""}`, options: { color: options.theme === "emerald" ? "E8E8E8" : "5a5246" } },
        ] as any,
        { x: 0.5, y, w: 12.33, h: 0.4, fontSize: 12 },
      );
      if (p.url) {
        links.addText(p.url, {
          x: 0.5, y: y + 0.28, w: 12.33, h: 0.3, fontSize: 10,
          color: options.theme === "emerald" ? CHAMPAGNE.replace("#","") : "064E3B",
          hyperlink: { url: p.url },
        });
      }
    });
  }

  await pptx.writeFile({ fileName: `${baseName}.pptx` });
}
