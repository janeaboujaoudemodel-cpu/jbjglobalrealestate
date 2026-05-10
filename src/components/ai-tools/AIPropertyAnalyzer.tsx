import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, MapPin, TrendingUp, Building, DollarSign, 
  BarChart3, Clock, AlertTriangle, Award, Loader2,
  ChevronDown, ChevronUp, FileText, Download, Copy, Check,
  Search, Target, Users, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

interface AnalysisResult {
  success: boolean;
  area: string;
  propertyType: string;
  fullAnalysis: string;
  sections: {
    areaOverview: string;
    priceAnalysis: string;
    developerLandscape: string;
    transactionData: string;
    investmentMetrics: string;
    marketTiming: string;
    riskFactors: string;
    recommendation: string;
    comparison: string | null;
  };
  sources: string[];
  generatedAt: string;
  disclaimer: string;
}

const AIPropertyAnalyzer = () => {
  const [area, setArea] = useState("");
  const [customArea, setCustomArea] = useState("");
  const [propertyType, setPropertyType] = useState("apartment");
  const [compareWith, setCompareWith] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  
  // New options for measurement, currency, and language
  const [measurementUnit, setMeasurementUnit] = useState<"sqft" | "sqm" | "both">("sqft");
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jj_currency') || 'AED';
    }
    return 'AED';
  });
  const [language, setLanguage] = useState<"en" | "ar" | "ru" | "zh" | "hi">("en");

  const ALL_CURRENCIES = [
    { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham', symbol: 'AED' },
    { code: 'USD', flag: '🇺🇸', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', flag: '🇪🇺', name: 'Euro', symbol: '€' },
    { code: 'GBP', flag: '🇬🇧', name: 'British Pound', symbol: '£' },
    { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee', symbol: '₹' },
    { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal', symbol: 'SAR' },
    { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'RUB', flag: '🇷🇺', name: 'Russian Ruble', symbol: '₽' },
    { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar', symbol: 'A$' },
  ];

  const handleAnalyze = async () => {
    const selectedArea = area === "custom" ? customArea : area;
    
    if (!selectedArea) {
      toast.error("Please select or enter an area to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-property-analyzer', {
        body: { 
          area: selectedArea, 
          propertyType,
          analysisType: compareWith.length > 0 ? 'comparison' : 'full',
          compareWith,
          measurementUnit,
          currency,
          language
        }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        throw error;
      }

      setResult(data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to generate analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!result?.fullAnalysis) return;
    
    try {
      await navigator.clipboard.writeText(result.fullAnalysis);
      setCopied(true);
      toast.success("Analysis copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const downloadReport = () => {
    if (!result) return;
    
    const content = `# Property Market Analysis: ${result.area}
Generated: ${new Date(result.generatedAt).toLocaleString()}
Property Type: ${result.propertyType}

${result.fullAnalysis}

---
Sources: ${result.sources.join(', ')}

DISCLAIMER: ${result.disclaimer}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-analysis-${result.area.replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  const addCompareArea = (areaToAdd: string) => {
    if (areaToAdd && !compareWith.includes(areaToAdd) && compareWith.length < 3) {
      setCompareWith([...compareWith, areaToAdd]);
    }
  };

  const removeCompareArea = (areaToRemove: string) => {
    setCompareWith(compareWith.filter(a => a !== areaToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="bg-gradient-to-br from-zinc-900 to-black border-[#B89555]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 rounded-lg bg-[#EFE6D6]/20">
              <Brain className="w-6 h-6 text-[#1A1A1A]" />
            </div>
            AI Property Analyzer
          </CardTitle>
          <p className="text-white/70 text-sm mt-2">
            Deep market analysis powered by government data sources
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Area Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white/85">Select Area</Label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1">
                  <SelectValue placeholder="Choose an area" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A] max-h-60">
                  {DUBAI_AREAS.map((a) => (
                    <SelectItem key={a} value={a} className="text-white hover:bg-[#1A1A1A]">
                      {a}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom" className="text-[#1A1A1A] hover:bg-[#1A1A1A]">
                    ✏️ Enter Custom Area
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/85">Property Type</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A]">
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-white hover:bg-[#1A1A1A]">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Area Input */}
          {area === "custom" && (
            <div>
              <Label className="text-white/85">Custom Area Name</Label>
              <Input
                placeholder="Enter area name (e.g., Al Quoz Industrial)"
                value={customArea}
                onChange={(e) => setCustomArea(e.target.value)}
                className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1"
              />
            </div>
          )}

          {/* Compare With */}
          <div>
            <Label className="text-white/85">Compare With (Optional - max 3)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {compareWith.map((a) => (
                <Badge 
                  key={a} 
                  className="bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30 cursor-pointer hover:bg-red-500/20 hover:text-red-400"
                  onClick={() => removeCompareArea(a)}
                >
                  {a} ×
                </Badge>
              ))}
              {compareWith.length < 3 && (
                <Select onValueChange={addCompareArea}>
                  <SelectTrigger className="w-auto bg-[#1A1A1A] border-[#1A1A1A] text-white/70 text-sm h-7 px-2">
                    <span>+ Add area</span>
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A] max-h-40">
                    {DUBAI_AREAS.filter(a => a !== area && !compareWith.includes(a)).map((a) => (
                      <SelectItem key={a} value={a} className="text-white hover:bg-[#1A1A1A] text-sm">
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Report Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#1A1A1A]">
            <div>
              <Label className="text-white/85">Measurement Unit</Label>
              <Select value={measurementUnit} onValueChange={(v: "sqft" | "sqm" | "both") => setMeasurementUnit(v)}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A]">
                  <SelectItem value="sqft" className="text-white hover:bg-[#1A1A1A]">Square Feet (sq ft)</SelectItem>
                  <SelectItem value="sqm" className="text-white hover:bg-[#1A1A1A]">Square Meters (m²)</SelectItem>
                  <SelectItem value="both" className="text-white hover:bg-[#1A1A1A]">Both (sq ft & m²)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/85">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1">
                  <SelectValue>
                    {(() => {
                      const c = ALL_CURRENCIES.find(x => x.code === currency) || ALL_CURRENCIES[0];
                      return <span>{c.flag} {c.code} — {c.name}</span>;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A] max-h-60">
                  {ALL_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-white hover:bg-[#1A1A1A]">
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span className="font-medium">{c.code}</span>
                        <span className="text-white/70 text-xs">— {c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white/85">Report Language</Label>
              <Select value={language} onValueChange={(v: "en" | "ar" | "ru" | "zh" | "hi") => setLanguage(v)}>
                <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A]">
                  <SelectItem value="en" className="text-white hover:bg-[#1A1A1A]">English</SelectItem>
                  <SelectItem value="ar" className="text-white hover:bg-[#1A1A1A]">العربية (Arabic)</SelectItem>
                  <SelectItem value="ru" className="text-white hover:bg-[#1A1A1A]">Русский (Russian)</SelectItem>
                  <SelectItem value="zh" className="text-white hover:bg-[#1A1A1A]">中文 (Chinese)</SelectItem>
                  <SelectItem value="hi" className="text-white hover:bg-[#1A1A1A]">हिन्दी (Hindi)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!area && !customArea)}
            className="w-full bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-bold py-6 hover:shadow-lg hover:shadow-gold/30"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Market Data...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Analyze {compareWith.length > 0 ? `& Compare` : 'Market'}
              </>
            )}
          </Button>

          {/* Data Sources */}
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {["Dubai Land Dept", "DXB Interact", "Property Finder", "RERA"].map((source) => (
              <Badge key={source} variant="outline" className="text-white/90 border-[#1A1A1A] text-xs">
                {source}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Header */}
            <Card className="bg-gradient-to-br from-gold/10 to-transparent border-[#B89555]/30">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <MapPin className="w-6 h-6 text-[#1A1A1A]" />
                      {result.area}
                    </h2>
                    <p className="text-white/70 text-sm mt-1">
                      {result.propertyType.charAt(0).toUpperCase() + result.propertyType.slice(1)} Analysis • 
                      Generated {new Date(result.generatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="border-[#1A1A1A] text-white/85 hover:bg-[#1A1A1A]"
                    >
                      {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadReport}
                      className="border-[#1A1A1A] text-white/85 hover:bg-[#1A1A1A]"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Sections */}
            <Accordion type="single" collapsible defaultValue="overview" className="space-y-2">
              <AccordionItem value="overview" className="border-[#1A1A1A] bg-[#FDFBF7]/50 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1A1A1A]" />
                    Area Overview
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-white/85 whitespace-pre-wrap">
                  {result.sections.areaOverview || "Not available"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="price" className="border-[#1A1A1A] bg-[#FDFBF7]/50 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#1A1A1A]" />
                    Price Analysis
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-white/85 whitespace-pre-wrap">
                  {result.sections.priceAnalysis || "Not available"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="developers" className="border-[#1A1A1A] bg-[#FDFBF7]/50 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#1A1A1A]" />
                    Developer Landscape
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-white/85 whitespace-pre-wrap">
                  {result.sections.developerLandscape || "Not available"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="transactions" className="border-[#1A1A1A] bg-[#FDFBF7]/50 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#1A1A1A]" />
                    Transaction Data
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-white/85 whitespace-pre-wrap">
                  {result.sections.transactionData || "Not available"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="investment" className="border-[#1A1A1A] bg-[#FDFBF7]/50 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#1A1A1A]" />
                    Investment Metrics
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-white/85 whitespace-pre-wrap">
                  {result.sections.investmentMetrics || "Not available"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="timing" className="border-[#1A1A1A] bg-[#FDFBF7]/50 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#1A1A1A]" />
                    Market Timing
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-white/85 whitespace-pre-wrap">
                  {result.sections.marketTiming || "Not available"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="risks" className="border-[#1A1A1A] bg-[#FDFBF7]/50 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    Risk Factors
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-white/85 whitespace-pre-wrap">
                  {result.sections.riskFactors || "Not available"}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="recommendation" className="border-[#1A1A1A] bg-gradient-to-br from-gold/10 to-transparent rounded-lg px-4">
                <AccordionTrigger className="text-white hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#1A1A1A]" />
                    Recommendation
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-white/85 whitespace-pre-wrap">
                  {result.sections.recommendation || "Not available"}
                </AccordionContent>
              </AccordionItem>

              {result.sections.comparison && (
                <AccordionItem value="comparison" className="border-[#1A1A1A] bg-[#FDFBF7]/50 rounded-lg px-4">
                  <AccordionTrigger className="text-white hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#1A1A1A]" />
                      Area Comparison
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/85 whitespace-pre-wrap">
                    {result.sections.comparison}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Disclaimer */}
            <Card className="bg-[#FDFBF7]/30 border-[#1A1A1A]">
              <CardContent className="p-4">
                <p className="text-xs text-white/90 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {result.disclaimer}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.sources.map((source) => (
                    <Badge key={source} variant="outline" className="text-white/90 border-[#1A1A1A] text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIPropertyAnalyzer;
