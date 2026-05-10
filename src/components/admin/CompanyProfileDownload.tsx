import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, ExternalLink, Eye } from "lucide-react";
import { toast } from "sonner";
import { generateCompanyProfilePDF } from "@/utils/generateCompanyProfilePDF";
import { logExportEvent } from "@/utils/dlpExportLogger";

export const CompanyProfileDownload = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const location = useLocation();

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generateCompanyProfilePDF();

      await logExportEvent({
        exportType: "company_profile",
        exportFormat: "pdf",
        recordCount: 1,
        containsPii: false,
        fieldsExported: ["company_profile"],
      });

      toast.success("Company Profile downloaded!");
    } catch (error) {
      console.error("PDF download error:", error);
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenCleanPdf = () => {
    window.open("/documents/JBJ-Global-Real-Estate-Company-Profile.pdf", "_blank", "noopener,noreferrer");
  };

  const handleOpenPageBaseline = () => {
    const params = new URLSearchParams(location.search);
    params.set("print", "1");
    const url = `${location.pathname}?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-[#B89555]/30 bg-gradient-to-br from-champagne-light to-champagne">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
            <FileText className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div>
            <CardTitle className="text-[#1A1A1A] text-lg">Company Profile PDF</CardTitle>
            <CardDescription className="text-[#1A1A1A]/70">
              Download the official 18-page company profile
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          className="w-full bg-[#1A1A1A] hover:bg-[#1A1A1A] text-white"
          onClick={handleDownload}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Download Company Profile
        </Button>

        <Button
          variant="outline"
          className="w-full border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
          onClick={handleOpenCleanPdf}
        >
          <Eye className="w-4 h-4 mr-2" />
          Open Clean Preview (PDF)
        </Button>

        <Button
          variant="outline"
          className="w-full border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
          onClick={handleOpenPageBaseline}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Page Baseline (no chrome)
        </Button>

        <p className="text-xs text-[#1A1A1A]/70 pt-1">
          Baseline mode hides cookie banner, sidebar, header, and popups for clean visual comparison.
        </p>
      </CardContent>
    </Card>
  );
};

export default CompanyProfileDownload;
