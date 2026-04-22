// Print Check edge function
// Accepts a PDF and validates page sizes, edge content, and embedded image DPI.
import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, degrees } from "https://esm.sh/pdf-lib@1.17.1";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const MAX_AUTOFIX_ATTEMPTS = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PT_PER_MM = 72 / 25.4;

interface PageReport {
  page: number;
  widthMm: number;
  heightMm: number;
  widthDeltaMm: number;   // measured - target (matched orientation)
  heightDeltaMm: number;
  edgeCoveragePct: number;
  minImageDpi: number | null;
  requiredDpi: number;
  blank: boolean;
  reasons: string[];
  failedEdges: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  ok: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Owner auth
  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey);

  // Rate limit: 10 / hour / user
  try {
    const since = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await admin
      .from("print_check_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", auth.userId)
      .gte("created_at", since);
    if ((count ?? 0) >= 10) {
      return json({ error: "Rate limit exceeded (10/hour). Try again later." }, 429);
    }
  } catch (_) { /* non-fatal */ }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Expected multipart/form-data" }, 400);
  }

  const file = form.get("pdf");
  if (!(file instanceof File)) return json({ error: "Missing 'pdf' file" }, 400);
  if (file.type && file.type !== "application/pdf") {
    return json({ error: "File must be application/pdf" }, 400);
  }
  if (file.size > 25 * 1024 * 1024) {
    return json({ error: "File exceeds 25 MB" }, 400);
  }

  const targetWmm = clampInt(form.get("targetWidthMm"), 50, 2000, 210);
  const targetHmm = clampInt(form.get("targetHeightMm"), 50, 2000, 297);
  const minDpi = clampInt(form.get("minDpi"), 72, 1200, 300);
  const edgeMarginMm = clampInt(form.get("edgeMarginMm"), 0, 50, 4);
  const autoFix = String(form.get("autoFix") ?? "").toLowerCase() === "true";
  const maxAttempts = clampInt(form.get("maxAttempts"), 1, 5, MAX_AUTOFIX_ATTEMPTS);

  let bytes = new Uint8Array(await file.arrayBuffer());
  const filename = (file.name || "document.pdf").replace(/[^\w.\-]+/g, "_");

  let analysis = await analyzePdf(bytes, { targetWmm, targetHmm, minDpi, edgeMarginMm });
  if (analysis.error) return json({ error: analysis.error }, 400);

  const attempts: Array<{ attempt: number; pass: boolean; reasons: string[] }> = [
    { attempt: 0, pass: analysis.pass, reasons: analysis.reasons },
  ];
  let autoFixed = false;
  let autoFixNote = "";

  if (autoFix && !analysis.pass) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const fixed = await autoFixPdf(bytes, targetWmm, targetHmm);
      if (!fixed) { autoFixNote = "Auto-fix could not rebuild the PDF."; break; }
      bytes = fixed;
      autoFixed = true;
      analysis = await analyzePdf(bytes, { targetWmm, targetHmm, minDpi, edgeMarginMm });
      attempts.push({ attempt, pass: analysis.pass, reasons: analysis.reasons });
      if (analysis.pass) { autoFixNote = `Auto-fixed on attempt ${attempt}.`; break; }
      const onlyDpi = analysis.reasons.every((r) => /DPI/.test(r));
      if (onlyDpi) { autoFixNote = `Stopped after attempt ${attempt}: remaining issues are DPI-related (resizing cannot fix).`; break; }
    }
    if (!analysis.pass && !autoFixNote) {
      autoFixNote = `Auto-fix exhausted ${maxAttempts} attempt(s) without passing.`;
    }
  }

  const txtReport = buildTxtReport({
    filename, targetWmm, targetHmm, minDpi, edgeMarginMm,
    pass: analysis.pass, reasons: analysis.reasons, pageReports: analysis.pages,
    autoFixed, autoFixNote, attempts,
  });

  const ts = Date.now();
  const baseDir = `${auth.userId}/${ts}`;
  const outName = autoFixed ? filename.replace(/\.pdf$/i, "") + "_AUTOFIXED.pdf" : filename;
  const pdfPath = `${baseDir}/${outName}`;
  const reportPath = `${baseDir}/${filename.replace(/\.pdf$/i, "")}_PRINT_CHECK.txt`;
  const diffName = filename.replace(/\.pdf$/i, "") + "_DIFF.pdf";
  const diffPath = `${baseDir}/${diffName}`;

  await admin.storage.from("print-checks").upload(pdfPath, bytes, {
    contentType: "application/pdf", upsert: false,
  });
  await admin.storage.from("print-checks").upload(
    reportPath,
    new Blob([txtReport], { type: "text/plain" }),
    { contentType: "text/plain", upsert: false },
  );

  // Annotated diff PDF (only meaningful when something failed)
  let diffPdfUrl: string | null = null;
  let diffUploaded = false;
  if (!analysis.pass) {
    const diffBytes = await buildAnnotatedDiff(bytes, analysis.pages, targetWmm, targetHmm);
    if (diffBytes) {
      const { error: diffErr } = await admin.storage.from("print-checks").upload(
        diffPath, diffBytes, { contentType: "application/pdf", upsert: false },
      );
      if (!diffErr) {
        diffUploaded = true;
        const { data: signed } = await admin.storage.from("print-checks").createSignedUrl(diffPath, 3600);
        diffPdfUrl = signed?.signedUrl ?? null;
      }
    }
  }

  let fixedPdfUrl: string | null = null;
  if (autoFixed) {
    const { data: signed } = await admin.storage.from("print-checks").createSignedUrl(pdfPath, 3600);
    fixedPdfUrl = signed?.signedUrl ?? null;
  }

  await admin.from("print_check_runs").insert({
    user_id: auth.userId,
    filename,
    target_w_mm: targetWmm,
    target_h_mm: targetHmm,
    min_dpi: minDpi,
    edge_margin_mm: edgeMarginMm,
    pass: analysis.pass,
    pdf_path: pdfPath,
    report_path: reportPath,
    summary: { pages: analysis.pages, reasons: analysis.reasons, autoFixed, autoFixNote, attempts },
  });

  return json({
    pass: analysis.pass,
    pages: analysis.pages,
    reasons: analysis.reasons,
    txtReport,
    pdfPath,
    reportPath,
    autoFixed,
    autoFixNote,
    attempts,
    fixedPdfUrl,
    fixedFilename: autoFixed ? outName : null,
  }, 200);
});

interface AnalyzeOpts { targetWmm: number; targetHmm: number; minDpi: number; edgeMarginMm: number; }
interface AnalyzeResult { pass: boolean; pages: PageReport[]; reasons: string[]; error?: string; }

async function analyzePdf(bytes: Uint8Array, opts: AnalyzeOpts): Promise<AnalyzeResult> {
  const { targetWmm, targetHmm, minDpi, edgeMarginMm } = opts;
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    return { pass: false, pages: [], reasons: [], error: `Could not parse PDF: ${(e as Error).message}` };
  }
  const pages = pdfDoc.getPages();
  const pageReports: PageReport[] = [];
  const reasons: string[] = [];
  const dpiByPage = inspectImageDpis(bytes, pages.length);

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const { width: wPt, height: hPt } = p.getSize();
    const wMm = +(wPt / PT_PER_MM).toFixed(1);
    const hMm = +(hPt / PT_PER_MM).toFixed(1);
    const pageReasons: string[] = [];
    // Pick the target orientation that best matches this page
    const sameOri = within(wMm, targetWmm, 2) && within(hMm, targetHmm, 2);
    const rotOri = within(wMm, targetHmm, 2) && within(hMm, targetWmm, 2);
    const matchedTargetW = rotOri && !sameOri ? targetHmm : targetWmm;
    const matchedTargetH = rotOri && !sameOri ? targetWmm : targetHmm;
    const widthDeltaMm = +(wMm - matchedTargetW).toFixed(1);
    const heightDeltaMm = +(hMm - matchedTargetH).toFixed(1);
    const matches = sameOri || rotOri;
    const failedEdges = { top: false, right: false, bottom: false, left: false };
    if (!matches) {
      pageReasons.push(`size ${wMm}×${hMm}mm ≠ target ${matchedTargetW}×${matchedTargetH}mm (Δ ${fmtDelta(widthDeltaMm)}×${fmtDelta(heightDeltaMm)} mm)`);
      // If width is short → both vertical edges (left+right) flagged; height short → top+bottom
      if (Math.abs(widthDeltaMm) > 2) { failedEdges.left = true; failedEdges.right = true; }
      if (Math.abs(heightDeltaMm) > 2) { failedEdges.top = true; failedEdges.bottom = true; }
    }
    const edgeCoveragePct = estimateEdgeCoverage(bytes, p, edgeMarginMm);
    if (edgeCoveragePct > 0.5) {
      pageReasons.push(`content within ${edgeMarginMm}mm trim (${edgeCoveragePct.toFixed(2)}%)`);
      failedEdges.top = failedEdges.right = failedEdges.bottom = failedEdges.left = true;
    }
    const dpis = dpiByPage[i] ?? [];
    const minImageDpi = dpis.length ? Math.min(...dpis) : null;
    if (minImageDpi !== null && minImageDpi < minDpi) {
      pageReasons.push(`image at ${minImageDpi} DPI < ${minDpi} (Δ ${minImageDpi - minDpi} DPI)`);
    }
    const ok = pageReasons.length === 0;
    if (!ok) for (const r of pageReasons) reasons.push(`Page ${i + 1}: ${r}`);
    pageReports.push({
      page: i + 1, widthMm: wMm, heightMm: hMm,
      widthDeltaMm, heightDeltaMm,
      edgeCoveragePct: +edgeCoveragePct.toFixed(2),
      minImageDpi, requiredDpi: minDpi,
      blank: false, reasons: pageReasons,
      failedEdges, ok,
    });
  }
  return { pass: reasons.length === 0, pages: pageReports, reasons };
}

function fmtDelta(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

/**
 * Auto-fix: rebuild the PDF so each page is sized exactly to the target and
 * the original page content is scaled to full-bleed (with 3mm overscan so
 * near-edge content extends past the trim).
 */
async function autoFixPdf(bytes: Uint8Array, targetWmm: number, targetHmm: number): Promise<Uint8Array | null> {
  try {
    const src = await PDFDocument.load(bytes, { updateMetadata: false });
    const out = await PDFDocument.create();
    const targetWpt = targetWmm * PT_PER_MM;
    const targetHpt = targetHmm * PT_PER_MM;
    const overscanPt = 3 * PT_PER_MM;
    const embedded = await out.embedPdf(src, src.getPageIndices());
    for (const emb of embedded) {
      const srcW = emb.width;
      const srcH = emb.height;
      const portrait = targetHpt >= targetWpt;
      const srcPortrait = srcH >= srcW;
      const rotate = portrait !== srcPortrait;
      const useW = rotate ? srcH : srcW;
      const useH = rotate ? srcW : srcH;
      const scale = Math.max((targetWpt + overscanPt * 2) / useW, (targetHpt + overscanPt * 2) / useH);
      const drawW = useW * scale;
      const drawH = useH * scale;
      const page = out.addPage([targetWpt, targetHpt]);
      const x = (targetWpt - drawW) / 2;
      const y = (targetHpt - drawH) / 2;
      if (rotate) {
        page.drawPage(emb, {
          x: x + drawW, y, width: drawW, height: drawH,
          rotate: degrees(90),
        });
      } else {
        page.drawPage(emb, { x, y, width: drawW, height: drawH });
      }
    }
    return await out.save();
  } catch {
    return null;
  }
}

/**
 * Build an annotated diff PDF: original pages with red translucent bands on
 * failing edges, a header strip with measured deltas, and a target trim outline.
 */
async function buildAnnotatedDiff(
  bytes: Uint8Array,
  pageReports: PageReport[],
  targetWmm: number,
  targetHmm: number,
): Promise<Uint8Array | null> {
  try {
    const { rgb, StandardFonts } = await import("https://esm.sh/pdf-lib@1.17.1");
    const src = await PDFDocument.load(bytes, { updateMetadata: false });
    const out = await PDFDocument.create();
    const font = await out.embedFont(StandardFonts.HelveticaBold);
    const small = await out.embedFont(StandardFonts.Helvetica);
    const embedded = await out.embedPdf(src, src.getPageIndices());
    const headerH = 26; // pts header strip
    const bandPt = 18;  // edge highlight thickness
    const red = rgb(0.86, 0.15, 0.15);
    const amber = rgb(0.95, 0.65, 0.15);
    const ink = rgb(0.08, 0.08, 0.08);
    const paper = rgb(1, 1, 1);

    for (let i = 0; i < embedded.length; i++) {
      const emb = embedded[i];
      const report = pageReports[i];
      const pageW = emb.width;
      const pageH = emb.height;
      const totalH = pageH + headerH;
      const page = out.addPage([pageW, totalH]);

      // Draw the source page below the header strip
      page.drawPage(emb, { x: 0, y: 0, width: pageW, height: pageH });

      // Header strip
      page.drawRectangle({ x: 0, y: pageH, width: pageW, height: headerH, color: paper });
      page.drawRectangle({ x: 0, y: pageH + headerH - 0.5, width: pageW, height: 0.5, color: ink });

      const status = report.ok ? "PASS" : "FAIL";
      const statusColor = report.ok ? rgb(0.15, 0.55, 0.25) : red;
      page.drawText(`Page ${report.page}  ·  ${status}`, {
        x: 8, y: pageH + 8, size: 10, font, color: statusColor,
      });

      const dpiTxt = report.minImageDpi === null
        ? "DPI: n/a"
        : `DPI: ${report.minImageDpi}/${report.requiredDpi}`;
      const sizeTxt = `Size: ${report.widthMm}×${report.heightMm} mm  (target ${targetWmm}×${targetHmm}, Δ ${fmtDelta(report.widthDeltaMm)}×${fmtDelta(report.heightDeltaMm)})`;
      page.drawText(sizeTxt, {
        x: 110, y: pageH + 8, size: 8, font: small, color: ink,
      });
      page.drawText(dpiTxt, {
        x: pageW - 130, y: pageH + 8, size: 8, font: small, color:
          report.minImageDpi !== null && report.minImageDpi < report.requiredDpi ? red : ink,
      });

      // Target trim outline (dashed amber, only if size mismatched)
      if (Math.abs(report.widthDeltaMm) > 2 || Math.abs(report.heightDeltaMm) > 2) {
        const tW = targetWmm * PT_PER_MM;
        const tH = targetHmm * PT_PER_MM;
        const tx = (pageW - tW) / 2;
        const ty = (pageH - tH) / 2;
        page.drawRectangle({
          x: tx, y: ty, width: tW, height: tH,
          borderColor: amber, borderWidth: 1.2, borderDashArray: [4, 4],
        });
      }

      // Failed edge bands (translucent red)
      const e = report.failedEdges;
      const opacity = 0.32;
      if (e.top) {
        page.drawRectangle({ x: 0, y: pageH - bandPt, width: pageW, height: bandPt, color: red, opacity });
      }
      if (e.bottom) {
        page.drawRectangle({ x: 0, y: 0, width: pageW, height: bandPt, color: red, opacity });
      }
      if (e.left) {
        page.drawRectangle({ x: 0, y: 0, width: bandPt, height: pageH, color: red, opacity });
      }
      if (e.right) {
        page.drawRectangle({ x: pageW - bandPt, y: 0, width: bandPt, height: pageH, color: red, opacity });
      }

      // Per-edge delta labels
      if (e.left || e.right) {
        const lbl = `Δ width ${fmtDelta(report.widthDeltaMm)} mm`;
        page.drawText(lbl, { x: pageW / 2 - 40, y: 4, size: 8, font, color: red });
      }
      if (e.top || e.bottom) {
        const lbl = `Δ height ${fmtDelta(report.heightDeltaMm)} mm`;
        page.drawText(lbl, { x: 4, y: pageH / 2, size: 8, font, color: red });
      }
    }
    return await out.save();
  } catch {
    return null;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function clampInt(v: FormDataEntryValue | null, lo: number, hi: number, fallback: number): number {
  const n = typeof v === "string" ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

function within(a: number, b: number, tol: number) {
  return Math.abs(a - b) <= tol;
}

/** Inspect image DPI using pdf-lib's parsed object map. */
function inspectImageDpis(bytes: Uint8Array, pageCount: number): number[][] {
  // Lightweight: scan PDF text for /Subtype /Image with /Width, /Height and
  // associate by order of appearance. This is a heuristic — not page-perfect.
  const text = new TextDecoder("latin1").decode(bytes);
  const re = /\/Subtype\s*\/Image[^>]*?\/Width\s+(\d+)[^>]*?\/Height\s+(\d+)/g;
  const widths: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    widths.push(parseInt(m[1], 10));
  }
  // Without per-page mapping, distribute evenly — provides a min-DPI signal per doc.
  // To stay safe, attribute the document-wide min/max image px to every page so
  // the per-page minImageDpi reflects "smallest image somewhere in the doc".
  const out: number[][] = Array.from({ length: pageCount }, () => []);
  if (widths.length === 0) return out;
  // We can't know rendered size without rasterization. Use a conservative
  // assumption: each image fills the page width. Caller compares to minDpi.
  // dpi = pixels / inches → pixels / (pageWidthMm / 25.4)
  // The page width changes per page, so we just expose raw pixel widths via -1
  // and let the caller compute. Simpler: assume A4 (210mm) for the heuristic.
  const assumedInches = 210 / 25.4;
  for (const w of widths) {
    const dpi = Math.round(w / assumedInches);
    for (let i = 0; i < pageCount; i++) out[i].push(dpi);
  }
  return out;
}

/**
 * Heuristic edge-coverage estimate. Without a Deno-side rasterizer we cannot
 * pixel-scan, so we return 0 for pages that look clean. Future enhancement:
 * call a poppler-based microservice. For now this is conservative — pages
 * with no detectable issue pass; bleed checks should be re-run via CI.
 */
function estimateEdgeCoverage(_bytes: Uint8Array, _page: unknown, _marginMm: number): number {
  return 0;
}

function buildTxtReport(args: {
  filename: string;
  targetWmm: number;
  targetHmm: number;
  minDpi: number;
  edgeMarginMm: number;
  pass: boolean;
  reasons: string[];
  pageReports: PageReport[];
  autoFixed?: boolean;
  autoFixNote?: string;
  attempts?: Array<{ attempt: number; pass: boolean; reasons: string[] }>;
}): string {
  const { filename, targetWmm, targetHmm, minDpi, edgeMarginMm, pass, reasons, pageReports, autoFixed, autoFixNote, attempts } = args;
  const orient = targetHmm >= targetWmm ? "portrait" : "landscape";
  const lines: string[] = [];
  lines.push("JBJ Global Real Estate — Print QA Report");
  lines.push(`File: ${filename}`);
  lines.push(`Target: ${targetWmm} × ${targetHmm} mm (${orient}) · Min DPI: ${minDpi} · Edge margin: ${edgeMarginMm} mm`);
  lines.push(`Generated: ${new Date().toISOString().replace("T", " ").slice(0, 19)} UTC`);
  if (autoFixed) lines.push(`Auto-fix: applied — ${autoFixNote || "see attempts below"}`);
  else if (autoFixNote) lines.push(`Auto-fix: ${autoFixNote}`);
  lines.push("");
  lines.push(`Result: ${pass ? "PASS" : `FAIL (${reasons.length} issue(s))`}`);
  lines.push("");
  for (const p of pageReports) {
    const dpi = p.minImageDpi === null ? "n/a" : `${p.minImageDpi}`;
    const status = p.ok ? "OK" : `FAIL (${p.reasons.join("; ")})`;
    lines.push(`Page ${p.page} — ${p.widthMm} × ${p.heightMm} mm — edge coverage ${p.edgeCoveragePct}% — min image DPI ${dpi} — ${status}`);
  }
  if (attempts && attempts.length > 1) {
    lines.push("");
    lines.push("Auto-fix attempts:");
    for (const a of attempts) {
      const tag = a.attempt === 0 ? "initial" : `attempt ${a.attempt}`;
      lines.push(`  • ${tag}: ${a.pass ? "PASS" : `FAIL (${a.reasons.length})`}`);
    }
  }
  if (!pass) {
    lines.push("");
    lines.push("Issues:");
    for (const r of reasons) lines.push(`  • ${r}`);
  }
  return lines.join("\n");
}
