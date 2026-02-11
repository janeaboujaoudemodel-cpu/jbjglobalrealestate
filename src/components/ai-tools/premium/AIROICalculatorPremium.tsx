import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Loader2, Copy, Check, Sparkles, TrendingUp, 
  DollarSign, Percent, Target, AlertTriangle, ChevronRight,
  BarChart3, PiggyBank, Building, MapPin, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
import { Link } from "react-router-dom";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const AIROICalculatorPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    propertyPrice: "",
    downPayment: "",
    expectedRent: "",
    location: "",
    propertyType: "apartment",
    holdingPeriod: "5",
    additionalCosts: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.propertyPrice || !formData.location) {
      toast.error("Please enter purchase price and location");
      return;
    }

    const result = await invokeTool("ai-roi-calculator", {
      propertyPrice: formData.propertyPrice,
      downPayment: formData.downPayment,
      expectedRent: formData.expectedRent,
      location: formData.location,
      propertyType: formData.propertyType,
      holdingPeriod: formData.holdingPeriod,
      additionalCosts: formData.additionalCosts,
    });

    if (result.success) {
      toast.success("ROI analysis complete!");
    }
  };

  const copyToClipboard = () => {
    if (response?.analysis) {
      navigator.clipboard.writeText(response.analysis);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  return (
    <AIToolPremiumLayout
      title="AI ROI Calculator"
      subtitle="Calculate investment returns with AI-powered projections, market analysis, and risk assessment for Dubai real estate"
      icon={<Calculator className="h-6 w-6" />}
      accentColor="emerald"
      gradientFrom="emerald"
      badge="Investment Intelligence"
      showFinancialDisclaimer
    >
      {/* Form Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-emerald-950/20 backdrop-blur-sm border border-emerald-500/30 rounded-3xl p-8 md:p-10 mb-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <Building className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Property Details</h2>
            <p className="text-emerald-400/70 text-sm">Enter investment information for ROI analysis</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Purchase Price */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <DollarSign className="w-4 h-4 inline mr-1 text-emerald-400" />
              Purchase Price (AED) <span className="text-emerald-400">*</span>
            </Label>
            <Input
              value={formData.propertyPrice}
              onChange={(e) => handleChange("propertyPrice", e.target.value)}
              placeholder="2,500,000"
              className="bg-zinc-900/50 border-emerald-500/30 text-white h-12 rounded-xl hover:border-emerald-500/50 focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Down Payment */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <Percent className="w-4 h-4 inline mr-1 text-emerald-400" />
              Down Payment (AED)
            </Label>
            <Input
              value={formData.downPayment}
              onChange={(e) => handleChange("downPayment", e.target.value)}
              placeholder="500,000"
              className="bg-zinc-900/50 border-emerald-500/30 text-white h-12 rounded-xl hover:border-emerald-500/50 focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Expected Rent */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <PiggyBank className="w-4 h-4 inline mr-1 text-emerald-400" />
              Expected Annual Rent (AED)
            </Label>
            <Input
              value={formData.expectedRent}
              onChange={(e) => handleChange("expectedRent", e.target.value)}
              placeholder="120,000"
              className="bg-zinc-900/50 border-emerald-500/30 text-white h-12 rounded-xl hover:border-emerald-500/50 focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Location */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <MapPin className="w-4 h-4 inline mr-1 text-emerald-400" />
              Location <span className="text-emerald-400">*</span>
            </Label>
            <Input
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Dubai Marina"
              className="bg-zinc-900/50 border-emerald-500/30 text-white h-12 rounded-xl hover:border-emerald-500/50 focus:border-emerald-400 transition-colors"
            />
          </div>

          {/* Property Type */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <Building className="w-4 h-4 inline mr-1 text-emerald-400" />
              Property Type
            </Label>
            <Select value={formData.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
              <SelectTriggerDark className="h-12 rounded-xl border-emerald-500/30 hover:border-emerald-500/50">
                <SelectValue />
              </SelectTriggerDark>
              <SelectContentDark className="border-emerald-500/30">
                <SelectItemDark value="apartment">Apartment</SelectItemDark>
                <SelectItemDark value="villa">Villa</SelectItemDark>
                <SelectItemDark value="townhouse">Townhouse</SelectItemDark>
                <SelectItemDark value="penthouse">Penthouse</SelectItemDark>
                <SelectItemDark value="commercial">Commercial</SelectItemDark>
              </SelectContentDark>
            </Select>
          </div>

          {/* Holding Period */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              Holding Period
            </Label>
            <Select value={formData.holdingPeriod} onValueChange={(v) => handleChange("holdingPeriod", v)}>
              <SelectTriggerDark className="h-12 rounded-xl border-emerald-500/30 hover:border-emerald-500/50">
                <SelectValue />
              </SelectTriggerDark>
              <SelectContentDark className="border-emerald-500/30">
                <SelectItemDark value="1">1 Year</SelectItemDark>
                <SelectItemDark value="3">3 Years</SelectItemDark>
                <SelectItemDark value="5">5 Years</SelectItemDark>
                <SelectItemDark value="10">10 Years</SelectItemDark>
                <SelectItemDark value="15">15 Years</SelectItemDark>
              </SelectContentDark>
            </Select>
          </div>
        </div>

        {/* Additional Costs */}
        <div className="mb-8">
          <Label className="text-zinc-300 text-sm font-medium mb-2 block">
            Additional Annual Costs (AED) - Optional
          </Label>
          <Input
            value={formData.additionalCosts}
            onChange={(e) => handleChange("additionalCosts", e.target.value)}
            placeholder="Service charges, maintenance, etc."
            className="bg-zinc-900/50 border-emerald-500/30 text-white h-12 rounded-xl hover:border-emerald-500/50 focus:border-emerald-400 transition-colors"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.propertyPrice || !formData.location}
          variant="ai-emerald"
          className="w-full font-bold py-6 text-lg rounded-xl"
        >
          {loading ? (
            <>
              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Investment...
            </>
          ) : (
            <>
              <Calculator className="w-5 h-5 mr-2" />
              Calculate ROI
            </>
          )}
        </Button>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-600/10 border border-emerald-500/40 rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
                <div>
                  <h3 className="text-white text-2xl font-bold">Investment Analysis Results</h3>
                  <p className="text-emerald-400/70 text-sm">{formData.location} • {formData.propertyType}</p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {response.roi && (
                  <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <p className="text-zinc-400 text-sm mb-2">Total ROI</p>
                    <p className="text-emerald-400 text-4xl font-bold">{response.roi}%</p>
                    <p className="text-zinc-500 text-xs mt-1">over {formData.holdingPeriod} years</p>
                  </div>
                )}
                {response.netYield && (
                  <div className="bg-emerald-500/20 border border-emerald-400/50 rounded-2xl p-6 text-center">
                    <p className="text-emerald-400 text-sm mb-2 font-medium">Net Yield</p>
                    <p className="text-white text-4xl font-bold">{response.netYield}%</p>
                    <p className="text-zinc-400 text-xs mt-1">annual return</p>
                  </div>
                )}
                {response.appreciation && (
                  <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-6 text-center">
                    <p className="text-zinc-400 text-sm mb-2">Est. Appreciation</p>
                    <p className="text-emerald-400 text-4xl font-bold">{response.appreciation}%</p>
                    <p className="text-zinc-500 text-xs mt-1">projected growth</p>
                  </div>
                )}
              </div>

              {/* Confidence Score */}
              {response.confidenceScore && (
                <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-emerald-400/70 text-xs uppercase tracking-wider">AI Confidence Score</p>
                    <p className={`text-lg font-semibold ${getConfidenceColor(response.confidenceScore)}`}>
                      {response.confidenceScore}%
                    </p>
                  </div>
                  <Progress value={response.confidenceScore} className="h-2" />
                </div>
              )}

              {/* Risk Level */}
              {response.riskLevel && (
                <div className={`rounded-xl p-4 mb-6 ${
                  response.riskLevel === 'high' 
                    ? 'bg-red-500/10 border border-red-500/20' 
                    : response.riskLevel === 'medium'
                    ? 'bg-amber-500/10 border border-amber-500/20'
                    : 'bg-emerald-500/10 border border-emerald-500/20'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${
                      response.riskLevel === 'high' ? 'text-red-400' :
                      response.riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                    }`} />
                    <span className="font-semibold text-white capitalize">{response.riskLevel} Risk</span>
                  </div>
                  {response.riskFactors && (
                    <ul className="mt-2 space-y-1">
                      {response.riskFactors.map((factor: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* AI Insights */}
              <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-white font-semibold">AI Investment Insights</h4>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-zinc-400 text-sm">Full Analysis</span>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-zinc-400 hover:text-white">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                  {response.analysis}
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
                    This analysis is AI-generated for informational purposes only. Does not constitute financial advice.{" "}
                    <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
                    Past performance does not guarantee future results. Market conditions can change rapidly.
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

export default AIROICalculatorPremium;