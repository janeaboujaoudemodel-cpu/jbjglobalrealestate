import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Loader2, Copy, Check, Sparkles, 
  ArrowUp, ArrowDown, Minus, Building, MapPin,
  Calendar, Ruler, DollarSign, Target, AlertTriangle, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

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
      icon={<TrendingUp className="h-6 w-6" />}
      accentColor="blue"
      gradientFrom="blue"
      badge="Valuation Intelligence"
    >
      {/* Form Section - FULL WIDTH */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="bg-gradient-to-br from-blue-950/40 via-zinc-900/60 to-blue-950/20 backdrop-blur-sm border border-blue-500/30 rounded-3xl p-8 md:p-10 mb-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center">
            <Building className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Property Details</h2>
            <p className="text-blue-400/70 text-sm">Enter property information for price prediction</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Location */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <MapPin className="w-4 h-4 inline mr-1 text-blue-400" />
              Location / Area <span className="text-blue-400">*</span>
            </Label>
            <Input
              placeholder="Dubai Marina, Downtown..."
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="bg-zinc-900/50 border-blue-500/30 text-white h-12 rounded-xl hover:border-blue-500/50 focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Property Type */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <Building className="w-4 h-4 inline mr-1 text-blue-400" />
              Property Type
            </Label>
            <Select value={formData.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
              <SelectTriggerDark className="h-12 rounded-xl border-blue-500/30 hover:border-blue-500/50">
                <SelectValue />
              </SelectTriggerDark>
              <SelectContentDark className="border-blue-500/30">
                <SelectItemDark value="apartment">Apartment</SelectItemDark>
                <SelectItemDark value="villa">Villa</SelectItemDark>
                <SelectItemDark value="townhouse">Townhouse</SelectItemDark>
                <SelectItemDark value="penthouse">Penthouse</SelectItemDark>
                <SelectItemDark value="studio">Studio</SelectItemDark>
              </SelectContentDark>
            </Select>
          </div>

          {/* Bedrooms */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              Bedrooms
            </Label>
            <Select value={formData.bedrooms} onValueChange={(v) => handleChange("bedrooms", v)}>
              <SelectTriggerDark className="h-12 rounded-xl border-blue-500/30 hover:border-blue-500/50">
                <SelectValue />
              </SelectTriggerDark>
              <SelectContentDark className="border-blue-500/30">
                <SelectItemDark value="studio">Studio</SelectItemDark>
                <SelectItemDark value="1">1 Bedroom</SelectItemDark>
                <SelectItemDark value="2">2 Bedrooms</SelectItemDark>
                <SelectItemDark value="3">3 Bedrooms</SelectItemDark>
                <SelectItemDark value="4">4 Bedrooms</SelectItemDark>
                <SelectItemDark value="5+">5+ Bedrooms</SelectItemDark>
              </SelectContentDark>
            </Select>
          </div>

          {/* Size */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <Ruler className="w-4 h-4 inline mr-1 text-blue-400" />
              Size (sq ft)
            </Label>
            <Input
              placeholder="1200"
              value={formData.size}
              onChange={(e) => handleChange("size", e.target.value)}
              className="bg-zinc-900/50 border-blue-500/30 text-white h-12 rounded-xl hover:border-blue-500/50 focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Developer */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              Developer (optional)
            </Label>
            <Input
              placeholder="Emaar, DAMAC..."
              value={formData.developerName}
              onChange={(e) => handleChange("developerName", e.target.value)}
              className="bg-zinc-900/50 border-blue-500/30 text-white h-12 rounded-xl hover:border-blue-500/50 focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Completion Year */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <Calendar className="w-4 h-4 inline mr-1 text-blue-400" />
              Completion Year
            </Label>
            <Input
              placeholder="2025"
              value={formData.completionYear}
              onChange={(e) => handleChange("completionYear", e.target.value)}
              className="bg-zinc-900/50 border-blue-500/30 text-white h-12 rounded-xl hover:border-blue-500/50 focus:border-blue-400 transition-colors"
            />
          </div>
        </div>

        {/* Current Price - Full Width */}
        <div className="mb-8">
          <Label className="text-zinc-300 text-sm font-medium mb-2 block">
            <DollarSign className="w-4 h-4 inline mr-1 text-blue-400" />
            Current Listed Price (AED) - Optional
          </Label>
          <Input
            placeholder="2,500,000"
            value={formData.currentPrice}
            onChange={(e) => handleChange("currentPrice", e.target.value)}
            className="bg-zinc-900/50 border-blue-500/30 text-white h-12 rounded-xl hover:border-blue-500/50 focus:border-blue-400 transition-colors"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.location}
          variant="ai-blue"
          className="w-full font-bold py-6 text-lg rounded-xl"
        >
          {loading ? (
            <>
              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Market...
            </>
          ) : (
            <>
              <TrendingUp className="w-5 h-5 mr-2" />
              Predict Price
            </>
          )}
        </Button>
      </motion.div>

      {/* Results Section - FULL WIDTH */}
      <AnimatePresence mode="wait">
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/10 border border-blue-500/40 rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-8 h-8 text-blue-400" />
                <div>
                  <h3 className="text-white text-2xl font-bold">Estimated Fair Value</h3>
                  <p className="text-blue-400/70 text-sm">{formData.location} • {formData.propertyType} • {formData.bedrooms} BR</p>
                </div>
              </div>

              {/* Main Price */}
              {response.estimatedPrice && (
                <div className="bg-blue-500/20 border border-blue-400/50 rounded-2xl p-8 text-center mb-8">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-blue-400 text-sm font-medium">AI Estimated Value</span>
                    {response.trend && getTrendIcon(response.trend)}
                  </div>
                  <p className="text-white text-5xl font-bold mb-2">
                    AED {Number(response.estimatedPrice).toLocaleString()}
                  </p>
                  {response.pricePerSqFt && (
                    <p className="text-zinc-400 text-sm">
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
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {response.confidenceScore && (
                  <div className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-4">
                    <Target className="h-5 w-5 mb-2 text-blue-400" />
                    <p className="text-blue-400/70 text-xs uppercase tracking-wider mb-1">Confidence</p>
                    <p className="text-white text-2xl font-bold">{response.confidenceScore}%</p>
                    <Progress value={response.confidenceScore} className="h-1 mt-2" />
                  </div>
                )}
                {response.marketTrend && (
                  <div className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-4">
                    <TrendingUp className="h-5 w-5 mb-2 text-blue-400" />
                    <p className="text-blue-400/70 text-xs uppercase tracking-wider mb-1">Market Trend</p>
                    <p className="text-white text-2xl font-bold capitalize">{response.marketTrend}</p>
                  </div>
                )}
                {response.comparison && (
                  <div className={`rounded-xl p-4 ${
                    response.comparison === 'overpriced' 
                      ? 'bg-red-500/10 border border-red-500/20' 
                      : response.comparison === 'underpriced'
                      ? 'bg-emerald-500/10 border border-emerald-500/20'
                      : 'bg-amber-500/10 border border-amber-500/20'
                  }`}>
                    {response.comparison === 'overpriced' && <AlertTriangle className="h-5 w-5 mb-2 text-red-400" />}
                    {response.comparison === 'underpriced' && <CheckCircle className="h-5 w-5 mb-2 text-emerald-400" />}
                    {response.comparison === 'fairly-priced' && <Target className="h-5 w-5 mb-2 text-amber-400" />}
                    <p className="text-xs uppercase tracking-wider mb-1 text-zinc-400">Valuation</p>
                    <p className={`text-lg font-bold capitalize ${
                      response.comparison === 'overpriced' ? 'text-red-400' :
                      response.comparison === 'underpriced' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>{response.comparison}</p>
                  </div>
                )}
              </div>

              {/* Full Analysis */}
              <div className="bg-zinc-900/60 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <h4 className="text-white font-semibold">Full Analysis</h4>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-zinc-400 hover:text-white">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                  {response.prediction}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-zinc-400 flex-shrink-0" />
                <div>
                  <h4 className="text-zinc-300 font-semibold mb-2">Important Disclaimer</h4>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    This is an AI-generated estimate for informational purposes only. For legal or mortgage matters, please consult licensed professionals.
                    Actual property values may vary based on specific conditions, market timing, and other factors.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AIToolPremiumLayout>
  );
};

export default AIPricePredictorPremium;