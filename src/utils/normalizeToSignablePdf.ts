/**
 * normalizeToSignablePdf
 * Converts any common contract format (PDF / image / text / html) into a
 * single signable PDF File. Used by the e-signature upload flow so users
 * can drop in screenshots, photos of contracts, .txt or .html and still get
 * a real PDF preview + field placement.
 *
 * Supported in-browser without extra deps:
 *   - application/pdf  → returned as-is
 *   - image/* (jpg/png/webp/heic/heif/gif) → embedded into a PDF page
 *   - text/plain, text/html, .md, .rtf → rendered to an A4 PDF
 *
 * DOCX / DOC are accepted at upload time but converted server-side or shown
 * with a clear message asking the user to export to PDF first.
 */

export async function normalizeToSignablePdf(file: File): Promise<File> {
  const lower = file.name.toLowerCase();
  const type = file.type;

  // 1) Already a PDF
  if (type === "application/pdf" || lower.endsWith(".pdf")) {
    return file;
  }

  // 2) Image → PDF (single page, fit-to-page)
  if (type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif|gif|tiff?)$/i.test(lower)) {
    const { jsPDF } = await import("jspdf");
    const dataUrl = await fileToDataUrl(file);
    const img = await loadImage(dataUrl);

    const pageW = 595; // A4 width pt
    const pageH = 842;
    const margin = 24;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;
    const ratio = Math.min(maxW / img.width, maxH / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;

    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const fmt = dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    pdf.addImage(dataUrl, fmt, x, y, w, h);
    const blob = pdf.output("blob");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".pdf", { type: "application/pdf" });
  }

  // 3) Text / HTML / Markdown / RTF → simple A4 PDF
  if (
    type.startsWith("text/") ||
    /\.(txt|md|markdown|html?|rtf)$/i.test(lower)
  ) {
    const text = await file.text();
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
    const margin = 48;
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    pdf.setFont("Helvetica", "normal");
    pdf.setFontSize(11);

    // Strip basic HTML tags so HTML files become legible plain text
    const plain = /\.html?$/i.test(lower) || type === "text/html"
      ? text.replace(/<style[\s\S]*?<\/style>/gi, "")
             .replace(/<script[\s\S]*?<\/script>/gi, "")
             .replace(/<[^>]+>/g, "")
             .replace(/&nbsp;/g, " ")
             .replace(/\n{3,}/g, "\n\n")
      : text;

    const lines = pdf.splitTextToSize(plain, pageW - margin * 2);
    let y = margin;
    const lineH = 14;
    for (const line of lines) {
      if (y > pageH - margin) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += lineH;
    }
    const blob = pdf.output("blob");
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".pdf", { type: "application/pdf" });
  }

  // 4) DOCX / unknown → throw a friendly error so caller can show a toast
  throw new Error(
    `${file.name}: this format can't be converted to a signable PDF in the browser. Please export it to PDF first and re-upload.`
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}
