import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Loader2, Copy, Check, Sparkles, TrendingUp, 
  DollarSign, Percent, Target, AlertTriangle, ChevronRight,
  BarChart3, PiggyBank, Building
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

    // Map to backend expected fields
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
      icon={<Calculator className="h-8 w-8 text-emerald-400" />}
      accentColor="emerald"
      gradientFrom="emerald"
      badge="Investment Intelligence"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <Building className="h-5 w-5" />
                <span className="font-semibold">Property Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Purchase Price (AED) *</Label>
                  <Input
                    placeholder="2,500,000"
                    value={formData.propertyPrice}
                    onChange={(e) => handleChange("propertyPrice", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Down Payment (AED)</Label>
                  <Input
                    placeholder="500,000"
                    value={formData.downPayment}
                    onChange={(e) => handleChange("downPayment", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Expected Annual Rent (AED)</Label>
                  <Input
                    placeholder="120,000"
                    value={formData.expectedRent}
                    onChange={(e) => handleChange("expectedRent", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Location *</Label>
                  <Input
                    placeholder="Dubai Marina"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Property Type</Label>
                  <Select value={formData.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="penthouse">Penthouse</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Holding Period</Label>
                  <Select value={formData.holdingPeriod} onValueChange={(v) => handleChange("holdingPeriod", v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="1">1 Year</SelectItem>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                      <SelectItem value="10">10 Years</SelectItem>
                      <SelectItem value="15">15 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Additional Annual Costs (AED)</Label>
                <Input
                  placeholder="Service charges, maintenance, etc."
                  value={formData.additionalCosts}
                  onChange={(e) => handleChange("additionalCosts", e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Investment...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Calculate ROI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats Preview */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-zinc-900/30 border-zinc-800 p-4 text-center">
              <PiggyBank className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs text-zinc-500">Tax-Free</p>
              <p className="text-sm font-semibold text-white">Income</p>
            </Card>
            <Card className="bg-zinc-900/30 border-zinc-800 p-4 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs text-zinc-500">Market</p>
              <p className="text-sm font-semibold text-white">Analysis</p>
            </Card>
            <Card className="bg-zinc-900/30 border-zinc-800 p-4 text-center">
              <Target className="h-5 w-5 mx-auto mb-2 text-emerald-400" />
              <p className="text-xs text-zinc-500">Risk</p>
              <p className="text-sm font-semibold text-white">Assessment</p>
            </Card>
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
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  {response.roi && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
                        <TrendingUp className="h-5 w-5 mb-2 text-emerald-400" />
                        <p className="text-xs text-zinc-400">Total ROI</p>
                        <p className="text-2xl font-bold text-emerald-400">{response.roi}%</p>
                      </Card>
                    </motion.div>
                  )}
                  {response.netYield && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                        <Percent className="h-5 w-5 mb-2 text-blue-400" />
                        <p className="text-xs text-zinc-400">Net Yield</p>
                        <p className="text-2xl font-bold text-blue-400">{response.netYield}%</p>
                      </Card>
                    </motion.div>
                  )}
                  {response.appreciation && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="bg-purple-500/10 border-purple-500/30 p-4">
                        <DollarSign className="h-5 w-5 mb-2 text-purple-400" />
                        <p className="text-xs text-zinc-400">Est. Appreciation</p>
                        <p className="text-2xl font-bold text-purple-400">{response.appreciation}%</p>
                      </Card>
                    </motion.div>
                  )}
                </div>

                {/* Confidence Score */}
                {response.confidenceScore && (
                  <Card className="bg-zinc-900/50 border-zinc-800 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-zinc-400">AI Confidence Score</span>
                      <span className={`text-lg font-bold ${getConfidenceColor(response.confidenceScore)}`}>
                        {response.confidenceScore}%
                      </span>
                    </div>
                    <Progress value={response.confidenceScore} className="h-2" />
                  </Card>
                )}

                {/* Risk Assessment */}
                {response.riskLevel && (
                  <Card className={`p-4 ${
                    response.riskLevel === 'high' 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : response.riskLevel === 'medium'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/30'
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
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                      {response.analysis}
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-zinc-500 text-center">
                  * AI-generated projection. For legal or mortgage matters, we can connect you with licensed partners.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[400px] text-center"
              >
                <div className="p-6 rounded-full bg-emerald-500/10 mb-4">
                  <Calculator className="h-12 w-12 text-emerald-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-400">Ready to Calculate</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                  Enter your property details to get AI-powered ROI projections with market insights and risk analysis
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIROICalculatorPremium;
