import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { generateCompanyProfilePDF } from "@/utils/generateCompanyProfilePDF";

export const CompanyProfileDownload = () => {
  const [isGeneratingStandard, setIsGeneratingStandard] = useState(false);
  const [isGeneratingWithFounder, setIsGeneratingWithFounder] = useState(false);

  const handleDownload = async (includeFounder: boolean) => {
    const setter = includeFounder ? setIsGeneratingWithFounder : setIsGeneratingStandard;
    setter(true);
    try {
      await generateCompanyProfilePDF(includeFounder);
      toast.success(`Company Profile ${includeFounder ? "(With Founder)" : "(Standard)"} downloaded!`);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setter(false);
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
              Download the company profile in PDF format
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full bg-black hover:bg-zinc-800 text-white"
          onClick={() => handleDownload(false)}
          disabled={isGeneratingStandard || isGeneratingWithFounder}
        >
          {isGeneratingStandard ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Download Standard (No Founder)
        </Button>
        <Button
          variant="outline"
          className="w-full border-2 border-gold/50 text-black hover:bg-gold/10"
          onClick={() => handleDownload(true)}
          disabled={isGeneratingStandard || isGeneratingWithFounder}
        >
          {isGeneratingWithFounder ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <User className="w-4 h-4 mr-2" />
          )}
          Download With Founder Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default CompanyProfileDownload;
