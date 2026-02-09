import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, MapPin, TrendingUp, Building, DollarSign, 
  BarChart3, Clock, AlertTriangle, Award, Loader2,
  FileText, Download, Copy, Check, Search, Target, Home, Sparkles
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAITool } from "../AIToolsProvider";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";
import AIToolGuide from "../AIToolGuide";

const DUBAI_AREAS = [
  "Downtown Dubai", "Dubai Marina", "Palm Jumeirah", "Business Bay",
  "JBR", "Dubai Hills Estate", "Arabian Ranches", "Jumeirah Village Circle",
  "Dubai Creek Harbour", "DAMAC Hills", "Al Barsha", "Jumeirah",
  "Al Furjan", "Dubai Silicon Oasis", "Motor City", "Sports City",
  "Town Square", "Meydan", "MBR City", "Dubailand",
  "Dubai South", "Production City", "Discovery Gardens", "International City",
  "Emaar Beachfront", "Bluewaters Island", "City Walk", "La Mer"
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "studio", label: "Studio" },
  { value: "commercial", label: "Commercial" },
];

const AIPropertyAnalyzerPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [area, setArea] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [compareWith, setCompareWith] = useState<string[]>([]);
  const [measurementUnit, setMeasurementUnit] = useState<"sqft" | "sqm" | "both">("sqft");
  const [currency, setCurrency] = useState<"AED" | "USD" | "EUR" | "GBP">("AED");
  const [copied, setCopied] = useState(false);

  const handleAnalyze = async () => {
    const selectedArea = area === "custom" ? customArea : area;
    
    if (!selectedArea) {
      toast.error("Please select or enter an area to analyze");
      return;
    }

    const result = await invokeTool("ai-property-analyzer", {
      area: selectedArea,
      propertyType,
      analysisType: compareWith.length > 0 ? "comparison" : "full",
      compareWith,
      measurementUnit,
      currency,
    });

    if (result.success) {
      toast.success("Analysis complete!");
    }
  };

  const copyToClipboard = () => {
    if (response?.fullAnalysis) {
      navigator.clipboard.writeText(response.fullAnalysis);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadReport = () => {
    if (!response) return;
    
    const content = `# Property Market Analysis: ${response.area}
Generated: ${new Date(response.generatedAt).toLocaleString()}
Property Type: ${response.propertyType}

${response.fullAnalysis}

---
Sources: ${response.sources?.join(", ") || "N/A"}

DISCLAIMER: ${response.disclaimer || "AI-generated analysis for informational purposes only."}
`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-analysis-${response.area?.replace(/\s+/g, "-").toLowerCase() || "report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded!");
  };

  const addCompareArea = (areaToAdd: string) => {
    if (areaToAdd && !compareWith.includes(areaToAdd) && compareWith.length < 3) {
      setCompareWith([...compareWith, areaToAdd]);
    }
  };

  const removeCompareArea = (areaToRemove: string) => {
    setCompareWith(compareWith.filter((a) => a !== areaToRemove));
  };

  return (
    <AIToolPremiumLayout
      title="AI Property Analyzer"
      subtitle="Deep market analysis powered by AI with comprehensive property insights, price trends, and investment metrics"
      icon={<Brain className="h-8 w-8 text-sky-400" />}
      accentColor="sky"
      gradientFrom="sky"
      badge="Market Intelligence"
    >
      <AIToolGuide
        description="Get comprehensive property market analysis for any Dubai area. Includes price trends, developer landscape, transaction data, and investment recommendations."
        steps={[
          "Select an area from the list or enter custom",
          "Choose property type and report options",
          "Optionally add areas for comparison",
          "Download or share the detailed report"
        ]}
        benefits={[
          "Data from Dubai Land Department",
          "Price per sqft/sqm analysis",
          "Developer and transaction insights",
          "Investment risk assessment"
        ]}
        accentColor="sky"
      />

      <div className="space-y-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="bg-sky-900/20 border-sky-500/30">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-sky-400 mb-4">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold">Analysis Parameters</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Select Area *</Label>
                  <Select value={area} onValueChange={setArea}>
                    <SelectTriggerDark className="border-sky-500/30 hover:border-sky-500/50">
                      <SelectValue placeholder="Choose an area" />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-sky-500/30 max-h-60">
                      {DUBAI_AREAS.map((a) => (
                        <SelectItemDark key={a} value={a}>
                          {a}
                        </SelectItemDark>
                      ))}
                      <SelectItemDark value="custom" className="text-sky-400">
                        ✏️ Enter Custom Area
                      </SelectItemDark>
                    </SelectContentDark>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Property Type</Label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTriggerDark className="border-sky-500/30 hover:border-sky-500/50">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-sky-500/30">
                      {PROPERTY_TYPES.map((t) => (
                        <SelectItemDark key={t.value} value={t.value}>
                          {t.label}
                        </SelectItemDark>
                      ))}
                    </SelectContentDark>
                  </Select>
                </div>
              </div>

              {area === "custom" && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Custom Area Name</Label>
                  <Input
                    placeholder="Enter area name..."
                    value={customArea}
                    onChange={(e) => setCustomArea(e.target.value)}
                    className="bg-zinc-900/50 border-sky-500/30 text-white hover:border-sky-500/50 focus:border-sky-400 transition-colors"
                  />
                </div>
              )}

              {/* Compare With */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Compare With (max 3)</Label>
                <div className="flex flex-wrap gap-2">
                  {compareWith.map((a) => (
                    <Badge
                      key={a}
                      className="bg-sky-500/20 text-sky-400 border-sky-500/30 cursor-pointer hover:bg-red-500/20 hover:text-red-400"
                      onClick={() => removeCompareArea(a)}
                    >
                      {a} ×
                    </Badge>
                  ))}
                  {compareWith.length < 3 && (
                    <Select onValueChange={addCompareArea}>
                      <SelectTriggerDark className="w-auto border-sky-500/30 text-zinc-400 text-sm h-7 px-2">
                        <span>+ Add area</span>
                      </SelectTriggerDark>
                      <SelectContentDark className="border-sky-500/30 max-h-40">
                        {DUBAI_AREAS.filter((a) => a !== area && !compareWith.includes(a)).map((a) => (
                          <SelectItemDark key={a} value={a} className="text-sm">
                            {a}
                          </SelectItemDark>
                        ))}
                      </SelectContentDark>
                    </Select>
                  )}
                </div>
              </div>

              {/* Report Options */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Unit</Label>
                  <Select value={measurementUnit} onValueChange={(v: "sqft" | "sqm" | "both") => setMeasurementUnit(v)}>
                    <SelectTriggerDark className="border-sky-500/30 hover:border-sky-500/50">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-sky-500/30">
                      <SelectItemDark value="sqft">Square Feet</SelectItemDark>
                      <SelectItemDark value="sqm">Square Meters</SelectItemDark>
                      <SelectItemDark value="both">Both</SelectItemDark>
                    </SelectContentDark>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Currency</Label>
                  <Select value={currency} onValueChange={(v: "AED" | "USD" | "EUR" | "GBP") => setCurrency(v)}>
                    <SelectTriggerDark className="border-sky-500/30 hover:border-sky-500/50">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-sky-500/30">
                      <SelectItemDark value="AED">AED (د.إ)</SelectItemDark>
                      <SelectItemDark value="USD">USD ($)</SelectItemDark>
                      <SelectItemDark value="EUR">EUR (€)</SelectItemDark>
                      <SelectItemDark value="GBP">GBP (£)</SelectItemDark>
                    </SelectContentDark>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={loading || (!area && !customArea)}
                className="w-full bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Market Data...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Analyze {compareWith.length > 0 ? "& Compare" : "Market"}
                  </>
                )}
              </Button>

              {/* Data Sources */}
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                {["Dubai Land Dept", "DXB Interact", "Property Finder", "RERA"].map((source) => (
                  <Badge key={source} variant="outline" className="text-zinc-500 border-zinc-700 text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {response ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Header */}
                <Card className="bg-sky-500/10 border-sky-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-sky-400" />
                          {response.area}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          {response.propertyType?.charAt(0).toUpperCase() + response.propertyType?.slice(1)} Analysis • 
                          {response.generatedAt && new Date(response.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="dark-outline" size="sm" onClick={copyToClipboard}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="dark-outline" size="sm" onClick={downloadReport}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Analysis Sections */}
                {response.sections && (
                  <Accordion type="single" collapsible defaultValue="overview" className="space-y-2">
                    {response.sections.areaOverview && (
                      <AccordionItem value="overview" className="border-zinc-800 bg-zinc-900/50 rounded-lg px-4">
                        <AccordionTrigger className="text-white hover:no-underline">
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-sky-400" />
                            Area Overview
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-300 whitespace-pre-wrap text-sm">
                          {response.sections.areaOverview}
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {response.sections.priceAnalysis && (
                      <AccordionItem value="price" className="border-zinc-800 bg-zinc-900/50 rounded-lg px-4">
                        <AccordionTrigger className="text-white hover:no-underline">
                          <span className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-sky-400" />
                            Price Analysis
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-300 whitespace-pre-wrap text-sm">
                          {response.sections.priceAnalysis}
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {response.sections.investmentMetrics && (
                      <AccordionItem value="investment" className="border-zinc-800 bg-zinc-900/50 rounded-lg px-4">
                        <AccordionTrigger className="text-white hover:no-underline">
                          <span className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sky-400" />
                            Investment Metrics
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-300 whitespace-pre-wrap text-sm">
                          {response.sections.investmentMetrics}
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {response.sections.recommendation && (
                      <AccordionItem value="recommendation" className="border-zinc-800 bg-zinc-900/50 rounded-lg px-4">
                        <AccordionTrigger className="text-white hover:no-underline">
                          <span className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-sky-400" />
                            Recommendation
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="text-zinc-300 whitespace-pre-wrap text-sm">
                          {response.sections.recommendation}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                )}

                {/* Full Analysis Fallback */}
                {response.fullAnalysis && !response.sections && (
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-white mb-3">Full Analysis</h4>
                      <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                        {response.fullAnalysis}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <p className="text-xs text-zinc-500 text-center">
                  {response.disclaimer || "* AI-generated analysis for informational purposes only."}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="p-6 rounded-full bg-sky-500/10 mb-4">
                  <Brain className="h-12 w-12 text-sky-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-400">Ready to Analyze</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                  Select an area to get comprehensive market analysis with price trends, developer insights, and investment recommendations
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIPropertyAnalyzerPremium;
