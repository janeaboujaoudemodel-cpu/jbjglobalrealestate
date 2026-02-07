import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Loader2, Copy, Check, Sparkles, 
  Building, MapPin, TrendingUp, DollarSign,
  Target, AlertTriangle, BarChart3, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAITool } from "../AIToolsProvider";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";

const AICompetitorAnalysisPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    projectName: "",
    projectDetails: "",
    competitorProjects: "",
    location: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.projectName.trim()) {
      toast.error("Please enter your project name");
      return;
    }

    const result = await invokeTool("ai-competitor-analysis", formData);

    if (result.success) {
      toast.success("Competitor analysis complete!");
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

  return (
    <AIToolPremiumLayout
      title="AI Competitor Analysis"
      subtitle="Analyze competitor properties, pricing strategies, and market positioning to gain competitive advantage"
      icon={<Users className="h-8 w-8 text-orange-400" />}
      accentColor="orange"
      gradientFrom="orange"
      badge="Market Intelligence"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-orange-400 mb-4">
                <Building className="h-5 w-5" />
                <span className="font-semibold">Project Information</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Building className="h-4 w-4 text-orange-400" />
                    Your Project Name *
                  </Label>
                  <Input
                    placeholder="Marina Heights Tower"
                    value={formData.projectName}
                    onChange={(e) => handleChange("projectName", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-400" />
                    Location
                  </Label>
                  <Input
                    placeholder="Dubai Marina"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Your Project Details</Label>
                <Textarea
                  placeholder="Describe your project: unit types, price range, amenities, unique selling points..."
                  value={formData.projectDetails}
                  onChange={(e) => handleChange("projectDetails", e.target.value)}
                  rows={4}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Competitor Projects (optional)</Label>
                <Textarea
                  placeholder="List competitor projects to analyze (one per line)..."
                  value={formData.competitorProjects}
                  onChange={(e) => handleChange("competitorProjects", e.target.value)}
                  rows={3}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Competitors...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Analyze Competition
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-zinc-900/30 border-zinc-800 p-4 text-center">
              <BarChart3 className="h-5 w-5 mx-auto mb-2 text-orange-400" />
              <p className="text-xs text-zinc-500">Price</p>
              <p className="text-sm font-semibold text-white">Comparison</p>
            </Card>
            <Card className="bg-zinc-900/30 border-zinc-800 p-4 text-center">
              <Award className="h-5 w-5 mx-auto mb-2 text-orange-400" />
              <p className="text-xs text-zinc-500">USP</p>
              <p className="text-sm font-semibold text-white">Analysis</p>
            </Card>
            <Card className="bg-zinc-900/30 border-zinc-800 p-4 text-center">
              <Target className="h-5 w-5 mx-auto mb-2 text-orange-400" />
              <p className="text-xs text-zinc-500">Market</p>
              <p className="text-sm font-semibold text-white">Position</p>
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
                {/* Market Position */}
                {response.marketPosition && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Card className="bg-orange-500/10 border-orange-500/30 p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="h-6 w-6 text-orange-400" />
                        <div>
                          <p className="text-sm text-zinc-400">Market Position</p>
                          <p className="text-xl font-bold text-orange-400">{response.marketPosition}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {response.priceComparison && (
                    <Card className="bg-zinc-900/50 border-zinc-800 p-4">
                      <DollarSign className="h-5 w-5 mb-2 text-orange-400" />
                      <p className="text-xs text-zinc-400">Price Position</p>
                      <p className="text-lg font-bold text-white">{response.priceComparison}</p>
                    </Card>
                  )}
                  {response.competitorCount && (
                    <Card className="bg-zinc-900/50 border-zinc-800 p-4">
                      <Users className="h-5 w-5 mb-2 text-orange-400" />
                      <p className="text-xs text-zinc-400">Competitors Analyzed</p>
                      <p className="text-lg font-bold text-white">{response.competitorCount}</p>
                    </Card>
                  )}
                </div>

                {/* Competitive Advantages */}
                {response.advantages && (
                  <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
                    <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Competitive Advantages
                    </h4>
                    <ul className="space-y-2">
                      {response.advantages.map((adv: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-xs text-emerald-400">
                            ✓
                          </span>
                          {adv}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Weaknesses */}
                {response.weaknesses && (
                  <Card className="bg-red-500/10 border-red-500/30 p-4">
                    <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Areas for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {response.weaknesses.map((weak: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 text-xs text-red-400">
                            !
                          </span>
                          {weak}
                        </li>
                      ))}
                    </ul>
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
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[400px] text-center"
              >
                <div className="p-6 rounded-full bg-orange-500/10 mb-4">
                  <Users className="h-12 w-12 text-orange-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-400">Ready to Analyze</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                  Enter your project details to get AI-powered competitor analysis with market positioning insights
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AICompetitorAnalysisPremium;
