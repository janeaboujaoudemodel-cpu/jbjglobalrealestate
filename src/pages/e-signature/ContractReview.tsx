import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Scale, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import ContractAnalyzer from "@/components/e-signature/ContractAnalyzer";

export default function ContractReview() {
  const navigate = useNavigate();
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [documentText, setDocumentText] = useState<string | null>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file");
      return;
    }

    setPdfFile(file);
    const url = URL.createObjectURL(file);
    setPdfUrl(url);

    // Try to extract text from PDF
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // Basic text extraction from PDF binary
        const text = reader.result as string;
        // Extract readable text between stream markers
        const textContent = text
          .replace(/[\x00-\x1F\x7F-\xFF]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (textContent.length > 100) {
          setDocumentText(textContent.substring(0, 80000));
        }
      } catch {
        console.warn("Could not extract text from PDF");
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Premium Page Header — aligned with sidebar logo divider */}
      <div className="bg-black border-b border-gold/20">
        <div className="max-w-5xl mx-auto px-6 flex items-end h-[84px] pb-4 gap-4">
          <Button variant="ghost" onClick={() => navigate("/e-signature")} className="text-gold hover:text-gold/80 hover:bg-gold/10 mb-0.5">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-gold" />
            <h1 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Contract <span className="text-gold">Review</span>
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-0 mb-0 mt-0 rounded-none border-0 bg-[linear-gradient(135deg,hsl(var(--champagne-1)),hsl(var(--champagne-2)),hsl(var(--champagne-3)))]">
        <div className="max-w-5xl mx-auto p-6 space-y-6">
          <p className="text-muted-foreground">AI-powered contract analysis with risk assessment and multilingual translation</p>

          {/* Upload Section */}
          {!pdfFile && (
            <Card className="border-2 border-dashed border-[hsl(var(--gold)/.3)]">
              <CardContent className="p-8">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Upload a contract to analyze</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF files supported, up to 50MB
                  </p>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </CardContent>
            </Card>
          )}

          {/* Document Preview + Analyzer */}
          {pdfFile && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PDF Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {pdfFile.name}
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setPdfFile(null);
                      setPdfUrl(null);
                      setDocumentText(null);
                    }}
                  >
                    Change File
                  </Button>
                </div>
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <iframe
                      src={`${pdfUrl}#toolbar=0`}
                      className="w-full border-0"
                      style={{ height: "700px" }}
                      title="Contract Preview"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Analyzer */}
              <div>
                <ContractAnalyzer
                  documentUrl={pdfUrl || undefined}
                  documentName={pdfFile.name}
                  documentText={documentText || undefined}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
