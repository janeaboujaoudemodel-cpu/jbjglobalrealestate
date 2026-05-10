import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Award, Download, Loader2, QrCode, Share2, 
  CheckCircle, Building2, Briefcase, Trophy
} from "lucide-react";
import { toast } from "sonner";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface Certificate {
  id: string;
  certificate_number: string;
  full_name: string;
  company_score: number;
  real_estate_score: number;
  combined_score: number;
  issued_at: string;
  verification_token: string;
}

interface CertificateGeneratorProps {
  isEligible: boolean;
  existingCertificate?: Certificate | null;
  onCertificateGenerated?: (cert: Certificate) => void;
}

export function CertificateGenerator({ 
  isEligible, 
  existingCertificate,
  onCertificateGenerated 
}: CertificateGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(existingCertificate || null);

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to generate certificate");
        return;
      }

      const response = await supabase.functions.invoke("generate-certificate", {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        if (response.data.error === "Certificate already exists") {
          toast.info("You already have a certificate");
        } else if (response.data.error === "Training not complete") {
          toast.error("Please complete all training modules first");
        } else {
          throw new Error(response.data.error);
        }
        return;
      }

      setCertificate(response.data.certificate);
      onCertificateGenerated?.(response.data.certificate);
      toast.success("Certificate generated successfully!");
    } catch (error) {
      console.error("Certificate generation error:", error);
      toast.error("Failed to generate certificate");
    } finally {
      setGenerating(false);
    }
  };

  const generateQRCodeDataUrl = async (data: string): Promise<string> => {
    // Using a QR code API for simplicity
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
    const response = await fetch(qrUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  const downloadPDF = async () => {
    if (!certificate) return;
    
    setDownloading(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([842, 595]); // A4 Landscape
      const { width, height } = page.getSize();

      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      // Colors
      const gold = rgb(0.85, 0.65, 0.13);
      const black = rgb(0, 0, 0);
      const gray = rgb(0.4, 0.4, 0.4);
      const darkGray = rgb(0.2, 0.2, 0.2);

      // Border
      page.drawRectangle({
        x: 20, y: 20,
        width: width - 40, height: height - 40,
        borderColor: gold,
        borderWidth: 3,
      });

      // Inner border
      page.drawRectangle({
        x: 30, y: 30,
        width: width - 60, height: height - 60,
        borderColor: gold,
        borderWidth: 1,
      });

      // Header - Company Name
      page.drawText("JBJ GLOBAL REAL ESTATE", {
        x: width / 2 - 120,
        y: height - 80,
        size: 24,
        font: helveticaBold,
        color: gold,
      });

      // Certificate Title
      page.drawText("CERTIFICATE OF COMPLETION", {
        x: width / 2 - 180,
        y: height - 130,
        size: 28,
        font: helveticaBold,
        color: black,
      });

      // Decorative line
      page.drawLine({
        start: { x: width / 2 - 150, y: height - 145 },
        end: { x: width / 2 + 150, y: height - 145 },
        thickness: 2,
        color: gold,
      });

      // "This is to certify that"
      page.drawText("This is to certify that", {
        x: width / 2 - 70,
        y: height - 190,
        size: 14,
        font: timesItalic,
        color: gray,
      });

      // Name
      page.drawText(certificate.full_name, {
        x: width / 2 - (certificate.full_name.length * 10),
        y: height - 230,
        size: 32,
        font: helveticaBold,
        color: black,
      });

      // Underline name
      const nameWidth = certificate.full_name.length * 18;
      page.drawLine({
        start: { x: width / 2 - nameWidth / 2, y: height - 240 },
        end: { x: width / 2 + nameWidth / 2, y: height - 240 },
        thickness: 1,
        color: gold,
      });

      // Description
      page.drawText("has successfully completed the", {
        x: width / 2 - 100,
        y: height - 280,
        size: 14,
        font: timesItalic,
        color: gray,
      });

      page.drawText("Broker Partner Training Program", {
        x: width / 2 - 140,
        y: height - 310,
        size: 20,
        font: helveticaBold,
        color: black,
      });

      // Scores section
      const scoresY = height - 370;
      
      page.drawText("Training Scores:", {
        x: 100,
        y: scoresY,
        size: 12,
        font: helveticaBold,
        color: darkGray,
      });

      page.drawText(`Company Knowledge: ${certificate.company_score}%`, {
        x: 100,
        y: scoresY - 25,
        size: 11,
        font: helvetica,
        color: gray,
      });

      page.drawText(`Real Estate Basics: ${certificate.real_estate_score}%`, {
        x: 100,
        y: scoresY - 45,
        size: 11,
        font: helvetica,
        color: gray,
      });

      page.drawText(`Combined Score: ${certificate.combined_score}%`, {
        x: 100,
        y: scoresY - 65,
        size: 11,
        font: helveticaBold,
        color: gold,
      });

      // Certificate details
      const detailsY = height - 370;
      
      page.drawText("Certificate Number:", {
        x: width - 280,
        y: detailsY,
        size: 10,
        font: helvetica,
        color: gray,
      });

      page.drawText(certificate.certificate_number, {
        x: width - 280,
        y: detailsY - 15,
        size: 12,
        font: helveticaBold,
        color: black,
      });

      page.drawText("Issue Date:", {
        x: width - 280,
        y: detailsY - 45,
        size: 10,
        font: helvetica,
        color: gray,
      });

      page.drawText(new Date(certificate.issued_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }), {
        x: width - 280,
        y: detailsY - 60,
        size: 12,
        font: helveticaBold,
        color: black,
      });

      // QR Code
      const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.verification_token}`;
      const qrDataUrl = await generateQRCodeDataUrl(verificationUrl);
      const qrImageBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      
      page.drawImage(qrImage, {
        x: width - 170,
        y: 60,
        width: 80,
        height: 80,
      });

      page.drawText("Scan to verify", {
        x: width - 165,
        y: 45,
        size: 8,
        font: helvetica,
        color: gray,
      });

      // Footer - Signature area
      page.drawLine({
        start: { x: 100, y: 100 },
        end: { x: 280, y: 100 },
        thickness: 1,
        color: black,
      });

      page.drawText("Authorized Signature", {
        x: 140,
        y: 80,
        size: 10,
        font: helvetica,
        color: gray,
      });

      // Disclaimer
      page.drawText("Educational content only. Not an accredited training institute. No certificates issued.", {
        x: width / 2 - 200,
        y: 40,
        size: 7,
        font: helvetica,
        color: gray,
      });

      // Save PDF
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `JJ-Certificate-${certificate.certificate_number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Certificate downloaded!");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to download certificate");
    } finally {
      setDownloading(false);
    }
  };

  const shareVerificationLink = () => {
    if (!certificate) return;
    
    const verificationUrl = `${window.location.origin}/verify-certificate/${certificate.verification_token}`;
    navigator.clipboard.writeText(verificationUrl);
    toast.success("Verification link copied to clipboard!");
  };

  // Show existing certificate
  if (certificate) {
    return (
      <Card className="bg-gradient-to-br from-card to-gold/5 border-[#B89555]/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center">
              <Award className="h-6 w-6 text-[#1A1A1A]" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Certificate Earned!</h3>
              <p className="text-sm text-muted-foreground">{certificate.certificate_number}</p>
            </div>
            <Badge className="ml-auto bg-green-500/20 text-green-500 border-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{certificate.company_score}%</p>
              <p className="text-xs text-muted-foreground">Company</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <Briefcase className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{certificate.real_estate_score}%</p>
              <p className="text-xs text-muted-foreground">Real Estate</p>
            </div>
            <div className="text-center p-3 bg-[#EFE6D6]/10 rounded-lg border border-[#B89555]/30">
              <Trophy className="h-5 w-5 text-[#1A1A1A] mx-auto mb-1" />
              <p className="text-lg font-bold text-[#1A1A1A]">{certificate.combined_score}%</p>
              <p className="text-xs text-muted-foreground">Combined</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Issued: {new Date(certificate.issued_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </p>

          <div className="flex gap-2">
            <Button 
              onClick={downloadPDF} 
              disabled={downloading}
              className="flex-1 bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download PDF
            </Button>
            <Button 
              variant="outline" 
              onClick={shareVerificationLink}
              className="border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show generate button if eligible
  if (isEligible) {
    return (
      <Card className="bg-gradient-to-br from-gold/10 to-card border-[#B89555]/30">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#EFE6D6]/20 flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-[#1A1A1A]" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Congratulations!
          </h3>
          <p className="text-muted-foreground mb-6">
            You've completed all training modules. Generate your certificate now!
          </p>
          <Button 
            onClick={generateCertificate}
            disabled={generating}
            className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Generate Certificate
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show locked state
  return (
    <Card className="bg-muted/30 border-border">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <QrCode className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          Certificate Locked
        </h3>
        <p className="text-sm text-muted-foreground">
          Complete all training modules to unlock your certificate.
        </p>
      </CardContent>
    </Card>
  );
}
