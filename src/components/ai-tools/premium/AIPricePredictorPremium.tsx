import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Loader2, Copy, Check, Sparkles, 
  ArrowUp, ArrowDown, Minus, Building, MapPin,
  Calendar, Ruler, DollarSign, Target, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAITool } from "../AIToolsProvider";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";

const AIPricePredictorPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    location: "",
    propertyType: "apartment",
    bedrooms: "2",
    size: "",
    developerName: "",
    completionYear: "",
    currentPrice: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.location.trim()) {
      toast.error("Please enter the location");
      return;
    }

    const result = await invokeTool("ai-price-predictor", formData);

    if (result.success) {
      toast.success("Price prediction complete!");
    }
  };

  const copyToClipboard = () => {
    if (response?.prediction) {
      navigator.clipboard.writeText(response.prediction);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend?.toLowerCase().includes("up") || trend?.toLowerCase().includes("increase")) {
      return <ArrowUp className="h-5 w-5 text-emerald-400" />;
    }
    if (trend?.toLowerCase().includes("down") || trend?.toLowerCase().includes("decrease")) {
      return <ArrowDown className="h-5 w-5 text-red-400" />;
    }
    return <Minus className="h-5 w-5 text-amber-400" />;
  };

  return (
    <AIToolPremiumLayout
      title="AI Price Predictor"
      subtitle="Get AI-powered property valuations with market trend analysis and future price forecasts for Dubai real estate"
      icon={<TrendingUp className="h-8 w-8 text-blue-400" />}
      accentColor="blue"
      gradientFrom="blue"
      badge="Valuation Intelligence"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-blue-400 mb-4">
                <Building className="h-5 w-5" />
                <span className="font-semibold">Property Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-400" />
                    Location / Area *
                  </Label>
                  <Input
                    placeholder="Dubai Marina, Downtown..."
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Building className="h-4 w-4 text-blue-400" />
                    Property Type
                  </Label>
                  <Select value={formData.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Bedrooms</Label>
                  <Select value={formData.bedrooms} onValueChange={(v) => handleChange("bedrooms", v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4 Bedrooms</SelectItem>
                      <SelectItem value="5+">5+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-blue-400" />
                    Size (sq ft)
                  </Label>
                  <Input
                    placeholder="1200"
                    value={formData.size}
                    onChange={(e) => handleChange("size", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Developer (optional)</Label>
                  <Input
                    placeholder="Emaar, DAMAC..."
                    value={formData.developerName}
                    onChange={(e) => handleChange("developerName", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    Completion Year
                  </Label>
                  <Input
                    placeholder="2025"
                    value={formData.completionYear}
                    onChange={(e) => handleChange("completionYear", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-400" />
                    Current Listed Price (AED)
                  </Label>
                  <Input
                    placeholder="2,500,000"
                    value={formData.currentPrice}
                    onChange={(e) => handleChange("currentPrice", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Market...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Predict Price
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Data Sources */}
          <div className="flex flex-wrap gap-2 justify-center">
            {["Dubai Land Dept", "DXB Interact", "Market Data"].map((source) => (
              <Badge key={source} variant="outline" className="text-zinc-500 border-zinc-700">
                {source}
              </Badge>
            ))}
          </div>
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
                {/* Estimated Price */}
                {response.estimatedPrice && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Card className="bg-blue-500/10 border-blue-500/30 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-zinc-400">Estimated Fair Value</span>
                        {response.trend && getTrendIcon(response.trend)}
                      </div>
                      <p className="text-4xl font-bold text-blue-400">
                        AED {Number(response.estimatedPrice).toLocaleString()}
                      </p>
                      {response.pricePerSqFt && (
                        <p className="text-sm text-zinc-400 mt-2">
                          AED {Number(response.pricePerSqFt).toLocaleString()} per sq ft
                        </p>
                      )}
                      {response.priceRange && (
                        <div className="mt-4 pt-4 border-t border-blue-500/20">
                          <p className="text-xs text-zinc-500">Price Range</p>
                          <p className="text-sm text-zinc-300">
                            AED {response.priceRange.min?.toLocaleString()} - {response.priceRange.max?.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {response.confidenceScore && (
                    <Card className="bg-zinc-900/50 border-zinc-800 p-4">
                      <Target className="h-5 w-5 mb-2 text-blue-400" />
                      <p className="text-xs text-zinc-400">Confidence</p>
                      <p className="text-xl font-bold text-white">{response.confidenceScore}%</p>
                      <Progress value={response.confidenceScore} className="h-1 mt-2" />
                    </Card>
                  )}
                  {response.marketTrend && (
                    <Card className="bg-zinc-900/50 border-zinc-800 p-4">
                      <TrendingUp className="h-5 w-5 mb-2 text-blue-400" />
                      <p className="text-xs text-zinc-400">Market Trend</p>
                      <p className="text-xl font-bold text-white capitalize">{response.marketTrend}</p>
                    </Card>
                  )}
                </div>

                {/* Valuation Comparison */}
                {response.comparison && (
                  <Card className="bg-zinc-900/50 border-zinc-800 p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-400" />
                      Valuation Analysis
                    </h4>
                    <div className={`p-3 rounded-lg ${
                      response.comparison === 'overpriced' 
                        ? 'bg-red-500/10 border border-red-500/20' 
                        : response.comparison === 'underpriced'
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'bg-amber-500/10 border border-amber-500/20'
                    }`}>
                      <p className={`text-sm ${
                        response.comparison === 'overpriced' ? 'text-red-400' :
                        response.comparison === 'underpriced' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {response.comparison === 'overpriced' && <AlertTriangle className="h-4 w-4 inline mr-1" />}
                        Property is {response.comparison} compared to market value
                      </p>
                    </div>
                  </Card>
                )}

                {/* Full Analysis */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Full Analysis</h4>
                      <Button variant="outline" size="sm" onClick={copyToClipboard} className="border-zinc-700">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                      {response.prediction}
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-zinc-500 text-center">
                  * AI-generated estimate. For legal or mortgage matters, consult licensed professionals.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[400px] text-center"
              >
                <div className="p-6 rounded-full bg-blue-500/10 mb-4">
                  <TrendingUp className="h-12 w-12 text-blue-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-400">Ready to Predict</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                  Enter property details to get AI-powered price predictions with market trend analysis
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIPricePredictorPremium;
