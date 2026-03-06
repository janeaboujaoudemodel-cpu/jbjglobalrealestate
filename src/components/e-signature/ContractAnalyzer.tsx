import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scale,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Globe,
  Loader2,
  FileText,
  Info,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RiskItem {
  severity: "high" | "medium" | "low";
  clause: string;
  explanation: string;
  recommendation: string;
}

interface AnalysisResult {
  summary: string;
  overall_risk: "high" | "medium" | "low";
  risks: RiskItem[];
  key_terms: string[];
  missing_clauses: string[];
  recommendations: string[];
}

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "Arabic", flag: "🇦🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "fa", name: "Farsi", flag: "🇮🇷" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
];

const riskColors = {
  high: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", badge: "bg-red-100 text-red-800" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", badge: "bg-amber-100 text-amber-800" },
  low: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-800" },
};

interface ContractAnalyzerProps {
  documentUrl?: string;
  documentName?: string;
  /** Raw text content of the document if available */
  documentText?: string;
}

export default function ContractAnalyzer({
  documentUrl,
  documentName,
  documentText,
}: ContractAnalyzerProps) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [translatedAnalysis, setTranslatedAnalysis] = useState<AnalysisResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleAnalyze = async () => {
    if (!documentUrl && !documentText) {
      toast.error("No document available for analysis");
      return;
    }
    setIsAnalyzing(true);
    setAnalysis(null);
    setTranslatedAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("esign-contract-analyzer", {
        body: {
          document_url: documentUrl,
          document_text: documentText,
          document_name: documentName,
          language: "en",
        },
      });

      if (error) throw error;
      if (data?.analysis) {
        setAnalysis(data.analysis);
        toast.success("Contract analysis complete");
      } else {
        throw new Error("No analysis returned");
      }
    } catch (err: any) {
      console.error("Contract analysis error:", err);
      toast.error(err.message || "Failed to analyze contract");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranslate = async () => {
    if (!analysis || selectedLanguage === "en") return;

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("esign-contract-analyzer", {
        body: {
          document_url: documentUrl,
          document_text: documentText,
          document_name: documentName,
          language: selectedLanguage,
          existing_analysis: analysis,
        },
      });

      if (error) throw error;
      if (data?.analysis) {
        setTranslatedAnalysis(data.analysis);
        const lang = LANGUAGES.find((l) => l.code === selectedLanguage);
        toast.success(`Translated to ${lang?.name}`);
      }
    } catch (err: any) {
      toast.error("Translation failed");
    } finally {
      setIsTranslating(false);
    }
  };

  const displayAnalysis = translatedAnalysis || analysis;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-900">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Contract Lawyer</h3>
            <p className="text-xs text-muted-foreground">
              Risk analysis, clause review & multilingual translation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {analysis && (
            <div className="flex items-center gap-2">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-[160px] h-9 text-sm bg-white/80 border-[hsl(var(--gold)/.2)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                variant="outline"
                onClick={handleTranslate}
                disabled={isTranslating || selectedLanguage === "en"}
                className="h-9"
              >
                {isTranslating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Globe className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white h-9"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Scale className="w-4 h-4 mr-2" />
                {analysis ? "Re-Analyze" : "Analyze Contract"}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      )}

      {/* Analysis Results */}
      {displayAnalysis && !isAnalyzing && (
        <div className="space-y-4">
          {/* Overall Risk */}
          <Card className={`border-2 ${riskColors[displayAnalysis.overall_risk].border}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <Shield className={`w-6 h-6 ${riskColors[displayAnalysis.overall_risk].text}`} />
                <div>
                  <span className="font-semibold text-foreground">Overall Risk Level</span>
                  <Badge className={`ml-2 ${riskColors[displayAnalysis.overall_risk].badge}`}>
                    {displayAnalysis.overall_risk.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{displayAnalysis.summary}</p>
            </CardContent>
          </Card>

          {/* Risk Items */}
          {displayAnalysis.risks.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Risk Assessment ({displayAnalysis.risks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {displayAnalysis.risks.map((risk, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${riskColors[risk.severity].border} ${riskColors[risk.severity].bg}`}
                  >
                    <div className="flex items-start gap-2">
                      {risk.severity === "high" ? (
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      ) : risk.severity === "medium" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      ) : (
                        <Info className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${riskColors[risk.severity].text}`}>
                          {risk.clause}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{risk.explanation}</p>
                        <p className="text-xs font-medium mt-2">
                          Recommendation: {risk.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Missing Clauses */}
          {displayAnalysis.missing_clauses.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Missing Clauses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {displayAnalysis.missing_clauses.map((clause, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{clause}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Key Terms */}
          {displayAnalysis.key_terms.length > 0 && (
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Key Terms Identified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {displayAnalysis.key_terms.map((term, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {term}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {displayAnalysis.recommendations.length > 0 && (
            <Card className="border-border bg-[hsl(var(--gold)/.03)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[hsl(var(--gold))]" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 list-decimal list-inside">
                  {displayAnalysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground">
                      {rec}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <Card className="border-dashed border-2 border-[hsl(var(--gold)/.2)]">
          <CardContent className="p-8 text-center">
            <Scale className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Click "Analyze Contract" to get AI-powered legal analysis, risk assessment, and recommendations before signing.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
