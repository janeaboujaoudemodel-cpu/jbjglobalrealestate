import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Link2, FileDown, Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PortfolioExportProps {
  investorName?: string;
  assetCount: number;
  currentGrouping: string;
}

export default function PortfolioExport({ investorName, assetCount, currentGrouping }: PortfolioExportProps) {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    // Simulate PDF generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGeneratingPdf(false);
    toast({
      title: "PDF Generated",
      description: "Your portfolio summary has been downloaded.",
    });
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    // Simulate link generation
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGeneratingLink(false);
    toast({
      title: "Shareable Link Created",
      description: "Link copied to clipboard. Valid for 7 days.",
    });
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Download className="w-5 h-5 text-[#1A1A1A]" />
          Portfolio Summary Export
        </h2>
        <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30">
          <Star className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">
        Generate a clean portfolio summary for your records or to share with advisors.
      </p>

      <Card className="border-2 border-[#B89555]/30">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* PDF Export */}
            <div className="p-4 border border-[#B89555]/20 rounded-lg bg-gradient-to-br from-gold/5 to-transparent">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[#EFE6D6]/20 rounded-lg flex items-center justify-center">
                  <FileDown className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">PDF Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    Download a formatted PDF with your portfolio overview
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>Includes:</p>
                <ul className="list-disc list-inside pl-2">
                  <li>Investor name (optional)</li>
                  <li>Portfolio list ({assetCount} assets)</li>
                  <li>Current grouping: {currentGrouping}</li>
                  <li>Date generated</li>
                </ul>
              </div>
              <Button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                className="w-full gap-2"
                variant="primary"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>

            {/* Shareable Link */}
            <div className="p-4 border border-[#B89555]/20 rounded-lg bg-gradient-to-br from-gold/5 to-transparent">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-[#EFE6D6]/20 rounded-lg flex items-center justify-center">
                  <Link2 className="w-5 h-5 text-[#1A1A1A]" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Shareable Link</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a secure link to share with your advisor
                  </p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-4 space-y-1">
                <p>Features:</p>
                <ul className="list-disc list-inside pl-2">
                  <li>Password protected (optional)</li>
                  <li>Expires after 7 days</li>
                  <li>Track views</li>
                  <li>Revoke access anytime</li>
                </ul>
              </div>
              <Button
                onClick={handleGenerateLink}
                disabled={isGeneratingLink}
                variant="secondary"
                className="w-full gap-2"
              >
                {isGeneratingLink ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Generate Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* No Forecasts Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mt-4 pt-4 border-t border-border/50">
            Portfolio summaries contain factual data only. No forecasts or promises are included.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
