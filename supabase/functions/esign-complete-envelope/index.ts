import { corsHeaders, getCorsHeaders, corsJsonResponse, corsErrorResponse } from "../_shared/cors-utils.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

import { PDFDocument, rgb, StandardFonts } from "npm:pdf-lib@1.17.1";

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
          ...(certificateUrl ? { certificate_url: certificateUrl } : {}),
        })
        .eq("id", existingDoc.id);
    } else {
      const { error: signedDocError } = await supabase
        .from("esign_signed_documents")
        .insert({
          envelope_id: envelope.id,
          document_url: envelope.document_url,
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
        signed_document_url: envelope.document_url,
      })
      .eq("id", envelope.id);

    // ── Send completion emails ─────────────────────────────────────────────
    // Use direct fetch to Resend global API
    const baseUrl = Deno.env.get("SITE_URL") || "https://jbj.ae";

    const completionEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f6f1;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="margin: 0; color: #b8860b; font-size: 28px;">JBJ Global Real Estate</h1>
            </td>
          </tr>
          <tr>
            <td style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">✓</span>
                </div>
              </div>
              <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; text-align: center;">Document Signed!</h2>
              <p style="color: #666; line-height: 1.6; margin-bottom: 24px; text-align: center;">
                All parties have signed the document. Your signed copy is now ready.
              </p>
              <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-weight: 600; color: #1a1a1a;">📄 ${envelope.name}</p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
                  Completed on ${new Date(envelope.completed_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; color: #1a1a1a; font-size: 16px;">Signers:</h3>
                ${envelope.esign_recipients.map((r: any) => `
                  <div style="display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                    <span style="color: #22c55e; margin-right: 8px;">✓</span>
                    <span style="color: #1a1a1a;">${r.name}</span>
                    <span style="color: #999; margin-left: 8px;">(${r.email})</span>
                  </div>
                `).join('')}
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${baseUrl}/e-signature/${envelope.id}" style="display: inline-block; background: linear-gradient(135deg, #b8860b, #d4a83a); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  View Signed Document
                </a>
              </div>
              ${certificateUrl ? `
              <div style="text-align: center; margin-top: 16px;">
                <a href="${certificateUrl}" style="display: inline-block; background: white; border: 2px solid #b8860b; color: #b8860b; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; font-size: 14px;">
                  📋 Download Audit Certificate
                </a>
              </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">This document has been electronically signed and is legally binding.</p>
              <p style="color: #999; font-size: 12px; margin: 8px 0 0 0;">© ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const allEmails = [
      envelope.sender_email,
      ...envelope.esign_recipients.map((r: any) => r.email),
    ];

    if (resendApiKey) {
      for (const email of allEmails) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "JBJ E-Signature <contact@jbj.ae>",
              to: [email],
              subject: `Signed: ${envelope.name}`,
              html: completionEmailHtml,
            }),
          });
          const resData = await res.json();
          if (!res.ok) console.error("Resend API error:", JSON.stringify(resData));
        } catch (emailError) {
          console.error("Failed to send completion email to", email, emailError);
        }
      }
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
