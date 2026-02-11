import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileSearch, Loader2, Copy, Check, Sparkles, AlertTriangle,
  CheckCircle, Info, Shield, Scale, FileText, AlertOctagon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import { useAITool } from "../AIToolsProvider";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";
import AIToolGuide from "../AIToolGuide";

const CONTRACT_TYPES = [
  { value: "sale", label: "Sale & Purchase Agreement (SPA)", icon: "📝" },
  { value: "mou", label: "Memorandum of Understanding", icon: "🤝" },
  { value: "tenancy", label: "Tenancy Contract", icon: "🏠" },
  { value: "agency", label: "Agency Agreement", icon: "🏢" },
  { value: "reservation", label: "Reservation Agreement", icon: "📋" },
  { value: "other", label: "Other", icon: "📄" },
];

const AIContractReviewerPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("sale");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!contractText.trim()) {
      toast.error("Please paste the contract text");
      return;
    }

    const result = await invokeTool("ai-contract-reviewer", {
      contractText,
      contractType,
    });

    if (result.success) {
      toast.success("Contract review complete!");
    }
  };

  const copyToClipboard = () => {
    if (response?.review) {
      navigator.clipboard.writeText(response.review);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "high": return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", icon: AlertOctagon };
      case "medium": return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", icon: AlertTriangle };
      default: return { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", icon: CheckCircle };
    }
  };

  return (
    <AIToolPremiumLayout
      title="AI Contract Reviewer"
      subtitle="Review real estate contracts for key terms, risks, and areas of concern with AI-powered legal analysis"
      icon={<FileSearch className="h-8 w-8 text-red-400" />}
      accentColor="red"
      gradientFrom="red"
      badge="Legal Analysis"
      showFinancialDisclaimer
    >
      {/* Legal Disclaimer - Always Visible */}
      <Card className="bg-red-500/10 border-red-500/30 mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400 mb-1">Legal Disclaimer</p>
              <p className="text-sm text-zinc-300">
                This AI review is for <strong>informational purposes only</strong> and does not constitute legal advice. 
                Always consult a qualified legal professional before signing any contract.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AIToolGuide
        description="Paste your contract text for AI analysis. Get risk assessments, key term identification, and areas of concern highlighted automatically."
        steps={[
          "Select the contract type",
          "Paste the full contract text",
          "Click Review to analyze",
          "Review flagged concerns and key terms"
        ]}
        benefits={[
          "Risk level assessment",
          "Key terms extraction",
          "Concern flagging",
          "Clause-by-clause analysis"
        ]}
        accentColor="red"
      />

      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-red-400 mb-4">
                <Scale className="h-5 w-5" />
                <span className="font-semibold">Contract Details</span>
              </div>

              {/* Contract Type */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTriggerDark className="border-red-500/30 hover:border-red-500/50">
                  <SelectValue />
                </SelectTriggerDark>
                <SelectContentDark className="border-red-500/30">
                  {CONTRACT_TYPES.map((type) => (
                    <SelectItemDark key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItemDark>
                  ))}
                </SelectContentDark>
              </Select>
              </div>

              {/* Contract Text */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Contract Text *</Label>
                <Textarea
                  placeholder="Paste your contract text here for review..."
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="bg-zinc-900/50 border-red-500/30 text-white hover:border-red-500/50 focus:border-red-400 transition-colors min-h-[300px] font-mono text-sm"
                />
                <p className="text-xs text-zinc-500">{contractText.length} characters</p>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Reviewing Contract...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Review Contract
                  </>
                )}
              </Button>
            </CardContent>
        </Card>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {response ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Risk Level */}
                {response.riskLevel && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {(() => {
                      const risk = getRiskColor(response.riskLevel);
                      const RiskIcon = risk.icon;
                      return (
                        <Card className={`${risk.bg} ${risk.border} border`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <RiskIcon className={`h-8 w-8 ${risk.text}`} />
                              <div>
                                <p className="text-xs text-zinc-400">Overall Risk Level</p>
                                <p className={`text-2xl font-bold capitalize ${risk.text}`}>
                                  {response.riskLevel}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </motion.div>
                )}

                {/* Key Terms */}
                {response.keyTerms && response.keyTerms.length > 0 && (
                  <Card className="bg-red-900/20 border-red-500/30">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        Key Terms Identified
                      </h4>
                      <ul className="space-y-2">
                        {response.keyTerms.map((term: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm bg-zinc-800/50 p-2 rounded">
                            <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <span className="text-zinc-300">
                              <strong className="text-white">{term.term}:</strong> {term.value}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Concerns */}
                {response.concerns && response.concerns.length > 0 && (
                  <Card className="bg-amber-500/10 border-amber-500/30">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                        Areas of Concern ({response.concerns.length})
                      </h4>
                      <ul className="space-y-2">
                        {response.concerns.map((concern: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-amber-500/30 flex items-center justify-center flex-shrink-0 text-xs text-amber-400 font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-zinc-300">{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Full Review */}
                <Card className="bg-red-900/20 border-red-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <FileText className="h-4 w-4 text-red-400" />
                        Full Review
                      </h4>
                      <Button variant="dark-outline" size="sm" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                      {response.review}
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-zinc-500 text-center">
                  * AI-generated review for informational purposes only. Consult a legal professional for advice.
                </p>
              </motion.div>
            ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-6 rounded-full bg-red-500/10 mb-4">
                <FileSearch className="h-12 w-12 text-red-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Review</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Paste your contract text to get AI-powered analysis with risk assessment and key term identification
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIContractReviewerPremium;
