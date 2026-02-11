import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileBarChart, Loader2, Copy, Check, Sparkles, TrendingUp,
  TrendingDown, BarChart3, PieChart, Download, Calendar,
  Building, MapPin, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const AIMarketReportPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    location: "",
    propertyType: "all",
    timeframe: "quarterly",
    focus: "general",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.location.trim()) {
      toast.error("Please enter a location");
      return;
    }

    const result = await invokeTool("ai-market-report", formData);

    if (result.success) {
      toast.success("Market report generated!");
    }
  };

  const copyToClipboard = () => {
    if (response?.report) {
      navigator.clipboard.writeText(response.report);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadReport = () => {
    if (!response?.report) return;
    
    const content = `# Market Report: ${formData.location}
Generated: ${new Date().toLocaleDateString()}

${response.summary ? `## Executive Summary\n${response.summary}\n\n` : ""}
## Full Report
${response.report}

---
* AI-generated report for informational purposes only.
`;
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `market-report-${formData.location.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  return (
    <AIToolPremiumLayout
      title="AI Market Report"
      subtitle="Generate comprehensive market analysis reports with trends, forecasts, and investment insights for Dubai real estate"
      icon={<FileBarChart className="h-8 w-8 text-indigo-400" />}
      accentColor="indigo"
      gradientFrom="indigo"
      badge="Market Intelligence"
      showFinancialDisclaimer
    >
      <AIToolGuide
        description="Generate professional market analysis reports backed by AI. Perfect for client presentations, investment decisions, and staying ahead of market trends."
        steps={[
          "Enter the location or area to analyze",
          "Select property type and timeframe",
          "Choose your report focus (investment, rental, etc.)",
          "Download or copy the generated report"
        ]}
        benefits={[
          "Data-driven market insights",
          "Trend analysis and forecasts",
          "Investment recommendations",
          "Exportable professional reports"
        ]}
        accentColor="indigo"
      />

      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-indigo-900/20 border-indigo-500/30">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-indigo-400 mb-4">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold">Report Parameters</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Location / Area *</Label>
                  <Input
                    placeholder="Dubai Marina, Palm Jumeirah, Downtown..."
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="bg-zinc-900/50 border-indigo-500/30 text-white hover:border-indigo-500/50 focus:border-indigo-400 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Property Type</Label>
                  <Select value={formData.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
                      <SelectTriggerDark className="border-indigo-500/30 hover:border-indigo-500/50">
                        <SelectValue />
                      </SelectTriggerDark>
                      <SelectContentDark className="border-indigo-500/30">
                        <SelectItemDark value="all">All Properties</SelectItemDark>
                        <SelectItemDark value="residential">Residential</SelectItemDark>
                        <SelectItemDark value="commercial">Commercial</SelectItemDark>
                        <SelectItemDark value="off-plan">Off-Plan</SelectItemDark>
                        <SelectItemDark value="luxury">Luxury Segment</SelectItemDark>
                      </SelectContentDark>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Timeframe</Label>
                    <Select value={formData.timeframe} onValueChange={(v) => handleChange("timeframe", v)}>
                      <SelectTriggerDark className="border-indigo-500/30 hover:border-indigo-500/50">
                        <SelectValue />
                      </SelectTriggerDark>
                      <SelectContentDark className="border-indigo-500/30">
                        <SelectItemDark value="monthly">Monthly</SelectItemDark>
                        <SelectItemDark value="quarterly">Quarterly</SelectItemDark>
                        <SelectItemDark value="yearly">Yearly</SelectItemDark>
                        <SelectItemDark value="5-year">5-Year Outlook</SelectItemDark>
                      </SelectContentDark>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Report Focus</Label>
                  <Select value={formData.focus} onValueChange={(v) => handleChange("focus", v)}>
                    <SelectTriggerDark className="border-indigo-500/30 hover:border-indigo-500/50">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-indigo-500/30">
                      <SelectItemDark value="general">📊 General Overview</SelectItemDark>
                      <SelectItemDark value="investment">💰 Investment Analysis</SelectItemDark>
                      <SelectItemDark value="rental">🏠 Rental Market</SelectItemDark>
                      <SelectItemDark value="development">🏗️ New Developments</SelectItemDark>
                      <SelectItemDark value="price-trends">📈 Price Trends</SelectItemDark>
                    </SelectContentDark>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Report...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Market Report
                  </>
                )}
              </Button>
            </CardContent>
        </Card>

        {/* Report Indicators */}
        <div className="grid grid-cols-3 gap-3">
            <Card className="bg-indigo-900/20 border-indigo-500/30 p-4 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-indigo-400" />
              <p className="text-xs text-zinc-500">Trend</p>
              <p className="text-sm font-semibold text-white">Analysis</p>
            </Card>
            <Card className="bg-indigo-900/20 border-indigo-500/30 p-4 text-center">
              <PieChart className="h-5 w-5 mx-auto mb-2 text-indigo-400" />
              <p className="text-xs text-zinc-500">Market</p>
              <p className="text-sm font-semibold text-white">Share</p>
            </Card>
            <Card className="bg-indigo-900/20 border-indigo-500/30 p-4 text-center">
              <Target className="h-5 w-5 mx-auto mb-2 text-indigo-400" />
              <p className="text-xs text-zinc-500">Investment</p>
              <p className="text-sm font-semibold text-white">Insights</p>
            </Card>
        </div>

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
                {/* Market Outlook Badge */}
                {response.outlook && (
                  <Card className={`p-4 ${
                    response.outlook === "bullish" 
                      ? "bg-emerald-500/10 border-emerald-500/30" 
                      : response.outlook === "bearish"
                      ? "bg-red-500/10 border-red-500/30"
                      : "bg-amber-500/10 border-amber-500/30"
                  }`}>
                    <div className="flex items-center gap-3">
                      {response.outlook === "bullish" ? (
                        <TrendingUp className="h-6 w-6 text-emerald-400" />
                      ) : response.outlook === "bearish" ? (
                        <TrendingDown className="h-6 w-6 text-red-400" />
                      ) : (
                        <BarChart3 className="h-6 w-6 text-amber-400" />
                      )}
                      <div>
                        <p className="text-xs text-zinc-400">Market Outlook</p>
                        <p className={`text-lg font-bold capitalize ${
                          response.outlook === "bullish" ? "text-emerald-400" :
                          response.outlook === "bearish" ? "text-red-400" : "text-amber-400"
                        }`}>
                          {response.outlook}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Executive Summary */}
                {response.summary && (
                  <Card className="bg-indigo-500/10 border-indigo-500/30">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <FileBarChart className="h-4 w-4 text-indigo-400" />
                        Executive Summary
                      </h4>
                      <p className="text-sm text-zinc-300">{response.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Full Report */}
                <Card className="bg-indigo-900/20 border-indigo-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Full Report</h4>
                      <div className="flex gap-2">
                        <Button variant="dark-outline" size="sm" onClick={copyToClipboard}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="dark-outline" size="sm" onClick={downloadReport}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[500px] overflow-y-auto">
                      {response.report}
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-zinc-500 text-center">
                  * AI-generated report. For investment decisions, consult with licensed professionals.
                </p>
              </motion.div>
            ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-6 rounded-full bg-indigo-500/10 mb-4">
                <FileBarChart className="h-12 w-12 text-indigo-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Analyze</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Enter a location to generate comprehensive market insights with trends and investment recommendations
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIMarketReportPremium;
