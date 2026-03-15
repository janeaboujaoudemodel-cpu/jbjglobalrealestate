import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { generateCompanyProfilePDF } from "@/utils/generateCompanyProfilePDF";
import { logExportEvent } from "@/utils/dlpExportLogger";

export const CompanyProfileDownload = () => {
  const [isGenerating, setIsGenerating] = useState(false);

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

  return (
    <Card className="border-gold/30 bg-gradient-to-br from-champagne-light to-champagne">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center">
            <FileText className="w-5 h-5 text-gold" />
          </div>
          <div>
            <CardTitle className="text-black text-lg">Company Profile PDF</CardTitle>
            <CardDescription className="text-zinc-600">
              Download the official 18-page company profile
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full bg-black hover:bg-zinc-800 text-white"
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
      </CardContent>
    </Card>
  );
};

export default CompanyProfileDownload;
