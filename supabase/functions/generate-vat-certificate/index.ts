// Generate a JBJ-branded VAT certificate as PDF (server-side via jsPDF compatible HTML)
// Returns base64 + uploads to template-outputs bucket.

import { createClient } from "npm:@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@2.5.2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  recipient_name?: string;
  recipient_company?: string;
  trn_number?: string;
  effective_date?: string;
  signature_image_b64?: string; // optional pre-applied signature
  stamp_image_b64?: string;     // optional pre-applied stamp
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireOwnerAuth(req, corsHeaders);
  if (auth.response) return auth.response;

  const body = (await req.json()) as Body;
  const recipient = body.recipient_name || "To Whom It May Concern";
  const company = body.recipient_company || "";
  const trn = body.trn_number || "100123456789012"; // owner can edit later
  const effective = body.effective_date || new Date().toISOString().split("T")[0];

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header band
  doc.setFillColor(26, 26, 26);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(247, 242, 234);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("JBJ GLOBAL REAL ESTATE", 40, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Premier Real Estate Brokerage  •  Dubai, United Arab Emirates", 40, 65);
  doc.text("contact@jbj.ae  •  www.jbj.ae", 40, 80);

  // Gold hairline
  doc.setDrawColor(184, 149, 85);
  doc.setLineWidth(1.4);
  doc.line(40, 100, W - 40, 100);

  // Title
  doc.setTextColor(26, 26, 26);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("VAT CERTIFICATE", W / 2, 150, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`Issued: ${new Date().toLocaleDateString()}`, W / 2, 170, { align: "center" });

  // Body
  doc.setFontSize(12);
  doc.setTextColor(26, 26, 26);
  let y = 220;
  const lh = 22;

  doc.setFont("helvetica", "bold");
  doc.text("To:", 60, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${recipient}${company ? ` — ${company}` : ""}`, 100, y);
  y += lh;

  doc.setFont("helvetica", "bold");
  doc.text("Subject:", 60, y);
  doc.setFont("helvetica", "normal");
  doc.text("Confirmation of VAT Registration", 130, y);
  y += lh * 1.5;

  const para = `This is to certify that JBJ GLOBAL REAL ESTATE is duly registered for Value Added Tax (VAT) with the Federal Tax Authority of the United Arab Emirates.`;
  const lines1 = doc.splitTextToSize(para, W - 120);
  doc.text(lines1, 60, y);
  y += lines1.length * lh;

  doc.setFont("helvetica", "bold");
  doc.text("Tax Registration Number (TRN):", 60, y);
  doc.setFont("helvetica", "normal");
  doc.text(trn, 280, y);
  y += lh;

  doc.setFont("helvetica", "bold");
  doc.text("Effective From:", 60, y);
  doc.setFont("helvetica", "normal");
  doc.text(effective, 180, y);
  y += lh * 1.5;

  const para2 = `This certificate is issued at the request of the named recipient for record-keeping and commercial verification purposes. For any verification, kindly contact us at contact@jbj.ae.`;
  const lines2 = doc.splitTextToSize(para2, W - 120);
  doc.text(lines2, 60, y);
  y += lines2.length * lh + 30;

  // Signature & Stamp anchors
  const sigY = H - 220;
  doc.setDrawColor(184, 149, 85);
  doc.setLineWidth(0.8);
  // Signature box
  doc.line(60, sigY + 70, 260, sigY + 70);
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Signature", 60, sigY + 85);
  // Stamp box
  doc.rect(W - 220, sigY, 160, 100);
  doc.text("Official Stamp", W - 220, sigY + 115);

  // If signature/stamp images supplied, drop them in
  if (body.signature_image_b64) {
    try { doc.addImage(body.signature_image_b64, "PNG", 60, sigY + 5, 200, 60); } catch { /* ignore */ }
  }
  if (body.stamp_image_b64) {
    try { doc.addImage(body.stamp_image_b64, "PNG", W - 215, sigY + 5, 150, 90); } catch { /* ignore */ }
  }

  // Footer
  doc.setFillColor(26, 26, 26);
  doc.rect(0, H - 50, W, 50, "F");
  doc.setTextColor(247, 242, 234);
  doc.setFontSize(9);
  doc.text("JBJ GLOBAL REAL ESTATE  •  Licensed Brokerage, Dubai UAE  •  contact@jbj.ae", W / 2, H - 25, { align: "center" });

  const pdfBytes = doc.output("arraybuffer");
  const pdfBuffer = new Uint8Array(pdfBytes);

  // Upload to storage
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const filename = `vat-${Date.now()}.pdf`;
  const path = `${auth.userId}/${filename}`;
  await supabase.storage.from("template-outputs").upload(path, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  const { data: signed } = await supabase.storage
    .from("template-outputs")
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  // base64 for direct download in UI
  let bin = "";
  pdfBuffer.forEach((b) => { bin += String.fromCharCode(b); });
  const b64 = btoa(bin);

  return new Response(
    JSON.stringify({
      ok: true,
      filename,
      path,
      signed_url: signed?.signedUrl ?? null,
      pdf_base64: b64,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
