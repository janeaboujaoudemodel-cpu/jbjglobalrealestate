import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/** Draw text that wraps at maxWidth; returns the y position after the last line. */
function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  { font, size, color, maxWidth, lineHeight }: {
    font: any; size: number; color: any; maxWidth: number; lineHeight: number;
  }
) {
  const words = text.split(" ");
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      page.drawText(line, { x, y, size, font, color });
      y -= lineHeight;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x, y, size, font, color });
    y -= lineHeight;
  }
  return y;
}

/** Embed a PNG/JPEG/DataURL signature image into the pdf page and draw it. */
async function embedSignatureImage(
  pdfDoc: PDFDocument,
  page: any,
  dataUrl: string,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number
) {
  try {
    // dataUrl may be "data:image/png;base64,..." or "data:image/jpeg;base64,..."
    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) return;
    const base64 = dataUrl.slice(commaIdx + 1);
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    let img;
    if (dataUrl.startsWith("data:image/png")) {
      img = await pdfDoc.embedPng(bytes);
    } else {
      img = await pdfDoc.embedJpg(bytes);
    }

    const { width: iw, height: ih } = img.scale(1);
    const scale = Math.min(maxWidth / iw, maxHeight / ih, 1);
    page.drawImage(img, {
      x,
      y: y - ih * scale,
      width: iw * scale,
      height: ih * scale,
    });
  } catch (err) {
    console.error("Failed to embed signature image:", err);
  }
}

// ---------------------------------------------------------------------------
// Audit trail PDF builder
// ---------------------------------------------------------------------------

async function buildAuditTrailPdf(envelope: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 595; // A4 width in points
  const PAGE_H = 842;
  const MARGIN = 48;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const GOLD = rgb(...Object.values(hexToRgb("#b8860b")) as [number, number, number]);
  const DARK = rgb(0.1, 0.1, 0.1);
  const GRAY = rgb(0.45, 0.45, 0.45);
  const LIGHT_GRAY = rgb(0.92, 0.92, 0.92);
  const GREEN = rgb(0.13, 0.65, 0.27);

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN + 40) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
    }
  }

  // ── Header bar ──────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: PAGE_H - 80, width: PAGE_W, height: 80, color: GOLD });
  page.drawText("JBJ Global Real Estate", {
    x: MARGIN, y: PAGE_H - 32, size: 18, font: fontBold, color: rgb(1, 1, 1),
  });
  page.drawText("Electronic Signature Certificate & Audit Trail", {
    x: MARGIN, y: PAGE_H - 52, size: 10, font: fontRegular, color: rgb(1, 1, 0.85),
  });

  y = PAGE_H - 100;

  // ── Document info box ────────────────────────────────────────────────────
  page.drawRectangle({ x: MARGIN, y: y - 70, width: CONTENT_W, height: 74, color: rgb(0.97, 0.96, 0.94) });
  page.drawLine({ start: { x: MARGIN, y: y - 70 + 74 }, end: { x: MARGIN + CONTENT_W, y: y - 70 + 74 }, thickness: 1.5, color: GOLD });

  const completedAt = envelope.completed_at ? new Date(envelope.completed_at) : new Date();

  const infoY = y - 20;
  page.drawText("Document:", { x: MARGIN + 12, y: infoY, size: 9, font: fontBold, color: GRAY });
  page.drawText(envelope.name || envelope.document_filename || "Untitled", {
    x: MARGIN + 75, y: infoY, size: 9, font: fontRegular, color: DARK,
  });
  page.drawText("Envelope ID:", { x: MARGIN + 12, y: infoY - 16, size: 9, font: fontBold, color: GRAY });
  page.drawText(envelope.id, { x: MARGIN + 75, y: infoY - 16, size: 8, font: fontRegular, color: DARK });
  page.drawText("Completed:", { x: MARGIN + 12, y: infoY - 32, size: 9, font: fontBold, color: GRAY });
  page.drawText(completedAt.toUTCString(), { x: MARGIN + 75, y: infoY - 32, size: 9, font: fontRegular, color: DARK });
  page.drawText("Sender:", { x: MARGIN + 12, y: infoY - 48, size: 9, font: fontBold, color: GRAY });
  page.drawText(`${envelope.sender_name} <${envelope.sender_email}>`, {
    x: MARGIN + 75, y: infoY - 48, size: 9, font: fontRegular, color: DARK,
  });

  y = y - 70 - 20;

  // ── Section: Signer records ──────────────────────────────────────────────
  page.drawText("SIGNER RECORDS", {
    x: MARGIN, y, size: 10, font: fontBold, color: GOLD,
  });
  page.drawLine({ start: { x: MARGIN, y: y - 6 }, end: { x: MARGIN + CONTENT_W, y: y - 6 }, thickness: 0.75, color: GOLD });
  y -= 22;

  const recipients: any[] = envelope.esign_recipients || [];

  for (const [idx, r] of recipients.entries()) {
    const signerBlockHeight = r.signature_data ? 200 : 120;
    ensureSpace(signerBlockHeight);

    // Signer header
    page.drawRectangle({ x: MARGIN, y: y - 14, width: CONTENT_W, height: 18, color: LIGHT_GRAY });
    page.drawText(`Signer ${idx + 1}: ${r.name}`, {
      x: MARGIN + 8, y: y - 10, size: 9, font: fontBold, color: DARK,
    });
    const statusLabel = r.status === "signed" ? "✔  SIGNED" : r.status?.toUpperCase() || "PENDING";
    page.drawText(statusLabel, {
      x: MARGIN + CONTENT_W - 70, y: y - 10, size: 9, font: fontBold,
      color: r.status === "signed" ? GREEN : GRAY,
    });
    y -= 22;

    // Signer details
    const details: [string, string][] = [
      ["Email", r.email || "—"],
      ["Role", r.role || "Signer"],
      ["Signing Order", String(r.signing_order ?? idx + 1)],
    ];
    if (r.signed_at) {
      details.push(["Signed At", new Date(r.signed_at).toUTCString()]);
    }
    if (r.signed_ip_address) {
      details.push(["IP Address", r.signed_ip_address]);
    }
    if (r.signed_user_agent) {
      // Truncate long UA strings
      const ua = r.signed_user_agent.length > 90
        ? r.signed_user_agent.slice(0, 90) + "…"
        : r.signed_user_agent;
      details.push(["User Agent", ua]);
    }
    if (r.viewed_at) {
      details.push(["First Viewed", new Date(r.viewed_at).toUTCString()]);
    }

    for (const [label, value] of details) {
      ensureSpace(16);
      page.drawText(`${label}:`, { x: MARGIN + 12, y, size: 8, font: fontBold, color: GRAY });
      y = drawWrappedText(page, value, MARGIN + 100, y, {
        font: fontRegular, size: 8, color: DARK, maxWidth: CONTENT_W - 110, lineHeight: 12,
      });
    }

    // Signature image
    if (r.signature_data) {
      ensureSpace(130);
      y -= 6;
      page.drawText("Signature:", { x: MARGIN + 12, y, size: 8, font: fontBold, color: GRAY });
      y -= 8;
      // Draw border box
      page.drawRectangle({
        x: MARGIN + 12, y: y - 100, width: 220, height: 100,
        borderColor: LIGHT_GRAY, borderWidth: 1, color: rgb(1, 1, 1),
      });
      await embedSignatureImage(pdfDoc, page, r.signature_data, MARGIN + 14, y - 2, 216, 96);
      y -= 110;
    }

    // Initials image (if any)
    if (r.initials_data) {
      ensureSpace(90);
      y -= 4;
      page.drawText("Initials:", { x: MARGIN + 12, y, size: 8, font: fontBold, color: GRAY });
      y -= 8;
      page.drawRectangle({
        x: MARGIN + 12, y: y - 60, width: 120, height: 60,
        borderColor: LIGHT_GRAY, borderWidth: 1, color: rgb(1, 1, 1),
      });
      await embedSignatureImage(pdfDoc, page, r.initials_data, MARGIN + 14, y - 2, 116, 56);
      y -= 72;
    }

    y -= 18; // gap between signers
  }

  // ── Section: Audit log ───────────────────────────────────────────────────
  ensureSpace(60);
  y -= 10;
  page.drawText("AUDIT LOG", { x: MARGIN, y, size: 10, font: fontBold, color: GOLD });
  page.drawLine({ start: { x: MARGIN, y: y - 6 }, end: { x: MARGIN + CONTENT_W, y: y - 6 }, thickness: 0.75, color: GOLD });
  y -= 20;

  const auditLogs: any[] = (envelope.esign_audit_log || []).sort(
    (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  if (auditLogs.length === 0) {
    page.drawText("No audit events recorded.", { x: MARGIN + 12, y, size: 9, font: fontRegular, color: GRAY });
    y -= 16;
  }

  for (const log of auditLogs) {
    ensureSpace(36);
    const ts = new Date(log.created_at).toUTCString();
    page.drawText(ts, { x: MARGIN + 12, y, size: 7.5, font: fontBold, color: GRAY });
    if (log.ip_address) {
      page.drawText(`IP: ${log.ip_address}`, {
        x: MARGIN + CONTENT_W - 130, y, size: 7.5, font: fontRegular, color: GRAY,
      });
    }
    y -= 13;
    y = drawWrappedText(page, log.description || log.action, MARGIN + 20, y, {
      font: fontRegular, size: 8, color: DARK, maxWidth: CONTENT_W - 30, lineHeight: 12,
    });
    y -= 6;
  }

  // ── Footer on every page ─────────────────────────────────────────────────
  const totalPages = pdfDoc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const p = pdfDoc.getPage(i);
    p.drawLine({ start: { x: MARGIN, y: 38 }, end: { x: PAGE_W - MARGIN, y: 38 }, thickness: 0.5, color: LIGHT_GRAY });
    p.drawText("This certificate is generated automatically and constitutes a legally binding electronic record.", {
      x: MARGIN, y: 24, size: 6.5, font: fontRegular, color: GRAY,
    });
    p.drawText(`Page ${i + 1} of ${totalPages}  |  © ${new Date().getFullYear()} JBJ Global Real Estate`, {
      x: PAGE_W - MARGIN - 180, y: 24, size: 6.5, font: fontRegular, color: GRAY,
    });
  }

  return pdfDoc.save();
}

// ---------------------------------------------------------------------------
// Flatten signed fields onto the original PDF
// ---------------------------------------------------------------------------

async function fetchBytes(url: string): Promise<Uint8Array> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch ${url}: ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
}

async function embedDataUrl(pdfDoc: PDFDocument, dataUrl: string) {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return null;
  const base64 = dataUrl.slice(commaIdx + 1);
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  if (dataUrl.startsWith("data:image/png")) return await pdfDoc.embedPng(bytes);
  return await pdfDoc.embedJpg(bytes);
}

/**
 * Flatten placed esign_fields onto the source PDF.
 * Field coordinates: x/y are percent (0-100) from top-left; width/height in CSS px
 * at the PDF's natural viewport scale = 1.
 */
async function buildSignedPdf(
  envelope: any,
  fields: any[],
  recipients: any[],
): Promise<Uint8Array | null> {
  try {
    const srcBytes = await fetchBytes(envelope.document_url);
    const pdfDoc = await PDFDocument.load(srcBytes);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Cache embedded signature/initials per recipient
    const sigCache = new Map<string, any>();
    const initCache = new Map<string, any>();
    for (const r of recipients) {
      if (r.signature_data) {
        try { sigCache.set(r.id, await embedDataUrl(pdfDoc, r.signature_data)); } catch {}
      }
      if (r.initials_data) {
        try { initCache.set(r.id, await embedDataUrl(pdfDoc, r.initials_data)); } catch {}
      }
    }

    const recipientById = new Map(recipients.map((r: any) => [r.id, r]));
    const pages = pdfDoc.getPages();

    // Reference HTML viewport used by the renderer (html2canvas @ 794px wide, A4 ratio).
    const REF_W = 794;
    const REF_H = 1123;

    for (const f of fields) {
      const pageIdx = Math.max(0, (f.page_number || 1) - 1);
      if (pageIdx >= pages.length) continue;
      const page = pages[pageIdx];
      const { width: pageW, height: pageH } = page.getSize();

      const rawX = Number(f.x_position) || 0;
      const rawY = Number(f.y_position) || 0;
      const rawW = Number(f.width) || 160;
      const rawH = Number(f.height) || 36;

      // Legacy fields stored x/y as raw pixels on the reference viewport (values
      // typically > 100). Modern fields store them as percentages 0-100. Detect
      // and normalise so both render in the right place.
      const isLegacyPx = rawX > 100 || rawY > 100;
      const xPct = isLegacyPx ? (rawX / REF_W) * 100 : rawX;
      const yPct = isLegacyPx ? (rawY / REF_H) * 100 : rawY;

      // Width/height stored in CSS px on the reference viewport — scale to PDF points.
      const w = (rawW / REF_W) * pageW;
      const h = (rawH / REF_H) * pageH;

      const x = (xPct / 100) * pageW;
      const yTop = (yPct / 100) * pageH;
      const y = pageH - yTop - h;

      const recipient = recipientById.get(f.recipient_id);
      const type = f.field_type;

      if (type === "signature" && recipient && sigCache.get(recipient.id)) {
        const img = sigCache.get(recipient.id)!;
        const dim = img.scale(1);
        const scale = Math.min(w / dim.width, h / dim.height);
        page.drawImage(img, {
          x,
          y: y + (h - dim.height * scale) / 2,
          width: dim.width * scale,
          height: dim.height * scale,
        });
      } else if (type === "initials" && recipient && initCache.get(recipient.id)) {
        const img = initCache.get(recipient.id)!;
        const dim = img.scale(1);
        const scale = Math.min(w / dim.width, h / dim.height);
        page.drawImage(img, {
          x,
          y: y + (h - dim.height * scale) / 2,
          width: dim.width * scale,
          height: dim.height * scale,
        });
      } else if (type === "stamp" && f.field_value) {
        // Stamp may be stored as data URL in field_value
        try {
          const img = await embedDataUrl(pdfDoc, f.field_value);
          if (img) {
            const dim = img.scale(1);
            const scale = Math.min(w / dim.width, h / dim.height);
            page.drawImage(img, {
              x, y: y + (h - dim.height * scale) / 2,
              width: dim.width * scale, height: dim.height * scale,
            });
          }
        } catch {}
      } else if (type === "date") {
        const value = f.field_value || (recipient?.signed_at
          ? new Date(recipient.signed_at).toLocaleDateString("en-GB")
          : new Date().toLocaleDateString("en-GB"));
        page.drawText(String(value), {
          x: x + 4, y: y + h / 2 - 5, size: 11, font: fontRegular, color: rgb(0.05, 0.05, 0.05),
        });
      } else if (type === "checkbox") {
        if (f.is_completed || f.field_value) {
          page.drawText("X", {
            x: x + w / 2 - 4, y: y + h / 2 - 5, size: 14, font: fontBold, color: rgb(0, 0, 0),
          });
        }
        page.drawRectangle({
          x, y, width: w, height: h, borderWidth: 1, borderColor: rgb(0.4, 0.4, 0.4),
        });
      } else if (type === "text" || f.field_value) {
        page.drawText(String(f.field_value || ""), {
          x: x + 4, y: y + h / 2 - 5, size: 11, font: fontRegular, color: rgb(0.05, 0.05, 0.05),
        });
      }
    }

    return await pdfDoc.save();
  } catch (err) {
    console.error("buildSignedPdf failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(origin) });
  }

  try {
    const { envelope_id } = await req.json();

    if (!envelope_id) {
      return corsErrorResponse("envelope_id is required", 400, origin);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch envelope with all related data including audit log
    const { data: envelope, error: envelopeError } = await supabase
      .from("esign_envelopes")
      .select(`
        *,
        esign_recipients (*),
        esign_audit_log (*)
      `)
      .eq("id", envelope_id)
      .single();

    if (envelopeError || !envelope) {
      return corsErrorResponse("Envelope not found", 404, origin);
    }

    // ── Build audit trail PDF ──────────────────────────────────────────────
    let certificateUrl: string | null = null;
    try {
      const pdfBytes = await buildAuditTrailPdf(envelope);
      const filename = `certificate_${envelope_id}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("esign-certificates")
        .upload(filename, pdfBytes, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.error("Failed to upload certificate PDF:", uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from("esign-certificates")
          .getPublicUrl(filename);
        certificateUrl = urlData?.publicUrl ?? null;
      }
    } catch (pdfErr) {
      console.error("Failed to generate audit trail PDF:", pdfErr);
    }

    // Generate certificate data
    const certificateData = {
      document_name: envelope.name,
      envelope_id: envelope.id,
      completed_at: envelope.completed_at || new Date().toISOString(),
      signers: envelope.esign_recipients.map((r: any) => ({
        name: r.name,
        email: r.email,
        signed_at: r.signed_at,
        ip_address: r.signed_ip_address,
      })),
      sender: {
        name: envelope.sender_name,
        email: envelope.sender_email,
      },
    };

    // ── Build flattened signed PDF ─────────────────────────────────────────
    let signedDocumentUrl: string | null = null;
    try {
      const { data: fields } = await supabase
        .from("esign_fields")
        .select("*")
        .eq("envelope_id", envelope.id);

      const signedBytes = await buildSignedPdf(envelope, fields || [], envelope.esign_recipients);
      if (signedBytes) {
        const signedFilename = `signed_${envelope.id}.pdf`;
        const { error: upErr } = await supabase.storage
          .from("esign-certificates")
          .upload(signedFilename, signedBytes, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (upErr) {
          console.error("Failed to upload signed PDF:", upErr);
        } else {
          const { data: urlData } = supabase.storage
            .from("esign-certificates")
            .getPublicUrl(signedFilename);
          signedDocumentUrl = urlData?.publicUrl ?? null;
        }
      }
    } catch (signErr) {
      console.error("Failed to flatten signed PDF:", signErr);
    }

    // Create or update signed document record
    const { data: existingDoc } = await supabase
      .from("esign_signed_documents")
      .select("id")
      .eq("envelope_id", envelope.id)
      .maybeSingle();

    if (existingDoc) {
      await supabase
        .from("esign_signed_documents")
        .update({
          certificate_data: certificateData,
          ...(signedDocumentUrl ? { document_url: signedDocumentUrl } : {}),
          ...(certificateUrl ? { certificate_url: certificateUrl } : {}),
        })
        .eq("id", existingDoc.id);
    } else {
      const { error: signedDocError } = await supabase
        .from("esign_signed_documents")
        .insert({
          envelope_id: envelope.id,
          document_url: signedDocumentUrl || envelope.document_url,
          document_filename: `signed_${envelope.document_filename}`,
          certificate_data: certificateData,
          ...(certificateUrl ? { certificate_url: certificateUrl } : {}),
        });

      if (signedDocError) {
        console.error("Failed to create signed document record:", signedDocError);
      }
    }

    // Update envelope with signed document URL and certificate URL
    await supabase
      .from("esign_envelopes")
      .update({
        signed_document_url: signedDocumentUrl || envelope.document_url,
      })
      .eq("id", envelope.id);

    // ── Send completion emails (premium JBJ champagne/gold) ──────────────
    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";
    const docNumber = (envelope.metadata as any)?.doc_number || "";
    const completedDate = new Date(envelope.completed_at || Date.now())
      .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

    const premiumShell = (innerHtml: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#FDFBF7;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr><td align="center" style="padding:40px 20px;">
      <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;">
        <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-radius:14px 14px 0 0;padding:22px 28px;border-bottom:none;">
          <table role="presentation" style="width:100%;border-collapse:collapse;"><tr>
            <td style="font-size:20px;font-weight:700;letter-spacing:.18em;color:#1A1A1A;">JBJ GLOBAL REAL ESTATE</td>
            <td align="right" style="font-size:10px;letter-spacing:.16em;color:#1A1A1A;opacity:.7;">${docNumber ? `DOC NO. <strong style="opacity:1;">${docNumber}</strong>` : ""}</td>
          </tr></table>
          <div style="height:1px;background:#B89555;margin-top:14px;"></div>
        </td></tr>
        <tr><td style="background:#ffffff;border-left:1px solid #B89555;border-right:1px solid #B89555;padding:36px;">${innerHtml}</td></tr>
        <tr><td style="background:#F7F2EA;border:1px solid #B89555;border-top:none;border-radius:0 0 14px 14px;padding:18px 28px;">
          <div style="height:1px;background:#B89555;margin-bottom:14px;"></div>
          <table role="presentation" style="width:100%;border-collapse:collapse;font-size:11px;color:#1A1A1A;"><tr>
            <td style="opacity:.85;"><strong style="letter-spacing:.14em;">JBJ GLOBAL REAL ESTATE</strong><br/><span style="opacity:.7;">Private Office · Dubai, UAE</span></td>
            <td align="center" style="opacity:.85;">CONTACT@JBJ.AE<br/>WWW.JBJ.AE</td>
            <td align="right" style="opacity:.85;">+971 54 716 7107</td>
          </tr></table>
        </td></tr>
        <tr><td style="text-align:center;padding-top:14px;font-size:11px;color:#1A1A1A;opacity:.55;">© ${new Date().getFullYear()} JBJ Global Real Estate · Electronically signed &amp; legally binding</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const buttons = `
      <div style="text-align:center;margin:32px 0 12px;">
        <a href="${baseUrl}/e-signature/${envelope.id}" style="display:inline-block;background:#1A1A1A;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:14px;letter-spacing:.06em;border:1px solid #B89555;">VIEW SIGNED DOCUMENT</a>
      </div>
      ${certificateUrl ? `<div style="text-align:center;margin-top:8px;">
        <a href="${certificateUrl}" style="display:inline-block;background:#FDFBF7;color:#1A1A1A;text-decoration:none;padding:10px 24px;border-radius:10px;font-weight:600;font-size:12px;letter-spacing:.06em;border:1px solid #B89555;">📋 DOWNLOAD AUDIT CERTIFICATE</a>
      </div>` : ""}`;

    if (resendApiKey) {
      // 1) Premium "Thank you" email — to each signer
      for (const r of envelope.esign_recipients) {
        const signerInner = `
          <div style="text-align:center;margin-bottom:20px;">
            <div style="display:inline-block;width:56px;height:56px;background:#10b981;border-radius:50%;line-height:56px;color:#fff;font-size:28px;">✓</div>
          </div>
          <h2 style="margin:0 0 12px;color:#1A1A1A;font-size:22px;font-weight:700;text-align:center;">Thank you for signing</h2>
          <p style="color:#1A1A1A;line-height:1.7;font-size:14px;text-align:center;margin:0 0 8px;">Dear ${r.name},</p>
          <p style="color:#1A1A1A;line-height:1.7;font-size:14px;margin:0 0 18px;">
            We have received your signature on <strong>${envelope.name}</strong>. The fully executed document is now legally binding and a signed copy is attached for your records below.
          </p>
          <p style="color:#1A1A1A;line-height:1.7;font-size:14px;margin:0 0 18px;">
            Our team will review the agreement and reach out shortly should anything require your attention. Should you have any questions, simply reply to this email or contact us at <a href="mailto:contact@jbj.ae" style="color:#1A1A1A;">contact@jbj.ae</a>.
          </p>
          <div style="background:#F7F2EA;border:1px solid #B89555;border-radius:10px;padding:16px;margin:20px 0;">
            <p style="margin:0;font-weight:600;color:#1A1A1A;font-size:13px;">📄 ${envelope.name}${docNumber ? ` · ${docNumber}` : ""}</p>
            <p style="margin:6px 0 0;color:#1A1A1A;opacity:.75;font-size:12px;">Completed ${completedDate}</p>
          </div>
          ${buttons}
          <p style="color:#1A1A1A;opacity:.6;font-size:12px;text-align:center;margin:24px 0 0;">With appreciation,<br/><strong>JBJ Global Real Estate</strong></p>`;
        try {
          const res = await quotaGuardedFetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "JBJ Global Real Estate <contact@jbj.ae>",
              to: [r.email],
              subject: `✓ Thank you — your signed copy of ${envelope.name}`,
              html: premiumShell(signerInner),
            }),
          });
          const resData = await res.json();
          if (!res.ok) console.error("Resend signer email error:", JSON.stringify(resData));
        } catch (e) { console.error("Failed signer email", r.email, e); }
      }

      // 2) Owner notification — to sender + contact@jbj.ae
      const signerName = envelope.esign_recipients[0]?.name || "Recipient";
      const ownerInner = `
        <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px;font-weight:700;">Document signed</h2>
        <p style="color:#1A1A1A;line-height:1.7;font-size:14px;margin:0 0 16px;">
          <strong>${envelope.name}</strong>${docNumber ? ` · ${docNumber}` : ""} has been signed by <strong>${signerName}</strong> on ${completedDate}.
        </p>
        <div style="background:#F7F2EA;border:1px solid #B89555;border-radius:10px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 8px;font-weight:600;color:#1A1A1A;font-size:13px;">Signers</p>
          ${envelope.esign_recipients.map((r: any) => `
            <div style="padding:6px 0;border-bottom:1px solid #B89555;border-bottom-style:dotted;color:#1A1A1A;font-size:13px;">
              <span style="color:#10b981;">✓</span> <strong>${r.name}</strong> <span style="opacity:.6;">${r.email}</span>
            </div>`).join("")}
        </div>
        ${buttons}`;
      const ownerRecipients = Array.from(new Set([envelope.sender_email, "contact@jbj.ae"].filter(Boolean)));
      for (const email of ownerRecipients) {
        try {
          const res = await quotaGuardedFetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "JBJ E-Signature <contact@jbj.ae>",
              to: [email],
              subject: `Signed: ${envelope.name} by ${signerName}`,
              html: premiumShell(ownerInner),
            }),
          });
          const resData = await res.json();
          if (!res.ok) console.error("Resend owner email error:", JSON.stringify(resData));
        } catch (e) { console.error("Failed owner email", email, e); }
      }
    }

    // ── In-app notification for the sender (bell + inbox + popup task) ──
    try {
      const signerName = envelope.esign_recipients[0]?.name || "Recipient";
      const signerEmail = envelope.esign_recipients[0]?.email || "";
      const { data: senderUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", envelope.sender_email)
        .maybeSingle();
      const senderId = senderUser?.id;
      if (senderId) {
        await supabase.from("notifications").insert({
          user_id: senderId,
          title: `${signerName} signed ${envelope.name}`,
          body: `Signed on ${completedDate}. Tap to view the signed document.`,
          notification_type: "esign_signed",
          action_url: `/e-signature/${envelope.id}`,
          metadata: {
            envelope_id: envelope.id,
            signer_name: signerName,
            signer_email: signerEmail,
            signed_document_url: signedDocumentUrl,
            certificate_url: certificateUrl,
          },
        });
      }
    } catch (notifErr) {
      console.error("Failed to insert owner notification:", notifErr);
    }

    return corsJsonResponse({
      success: true,
      message: "Envelope completed successfully",
      certificate_url: certificateUrl,
    }, origin);

  } catch (error: any) {
    console.error("Error in esign-complete-envelope:", error);
    return corsErrorResponse(error.message || "Internal server error", 500, origin);
  }
});
