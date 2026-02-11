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
import { Textarea } from "@/components/ui/textarea";
import { useAITool } from "../AIToolsProvider";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

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
      icon={<Users className="h-6 w-6" />}
      accentColor="orange"
      gradientFrom="orange"
      badge="Market Intelligence"
      showFinancialDisclaimer
    >
      {/* Form Section */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="bg-gradient-to-br from-orange-950/40 via-zinc-900/60 to-orange-950/20 backdrop-blur-sm border border-orange-500/30 rounded-3xl p-8 md:p-10 mb-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/40 flex items-center justify-center">
            <Building className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Project Information</h2>
            <p className="text-orange-400/70 text-sm">Enter your project details for competitive analysis</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Project Name */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <Building className="w-4 h-4 inline mr-1 text-orange-400" />
              Your Project Name <span className="text-orange-400">*</span>
            </Label>
            <Input
              placeholder="Marina Heights Tower"
              value={formData.projectName}
              onChange={(e) => handleChange("projectName", e.target.value)}
              className="bg-zinc-900/50 border-orange-500/30 text-white h-12 rounded-xl hover:border-orange-500/50 focus:border-orange-400 transition-colors"
            />
          </div>

          {/* Location */}
          <div>
            <Label className="text-zinc-300 text-sm font-medium mb-2 block">
              <MapPin className="w-4 h-4 inline mr-1 text-orange-400" />
              Location
            </Label>
            <Input
              placeholder="Dubai Marina"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="bg-zinc-900/50 border-orange-500/30 text-white h-12 rounded-xl hover:border-orange-500/50 focus:border-orange-400 transition-colors"
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="mb-6">
          <Label className="text-zinc-300 text-sm font-medium mb-2 block">
            Your Project Details
          </Label>
          <Textarea
            placeholder="Describe your project: unit types, price range, amenities, unique selling points..."
            value={formData.projectDetails}
            onChange={(e) => handleChange("projectDetails", e.target.value)}
            rows={4}
            className="bg-zinc-900/50 border-orange-500/30 text-white rounded-xl hover:border-orange-500/50 focus:border-orange-400 transition-colors"
          />
        </div>

        {/* Competitor Projects */}
        <div className="mb-8">
          <Label className="text-zinc-300 text-sm font-medium mb-2 block">
            Competitor Projects (optional)
          </Label>
          <Textarea
            placeholder="List competitor projects to analyze (one per line)..."
            value={formData.competitorProjects}
            onChange={(e) => handleChange("competitorProjects", e.target.value)}
            rows={3}
            className="bg-zinc-900/50 border-orange-500/30 text-white rounded-xl hover:border-orange-500/50 focus:border-orange-400 transition-colors"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !formData.projectName}
          variant="ai-orange"
          className="w-full font-bold py-6 text-lg rounded-xl"
        >
          {loading ? (
            <>
              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
              Analyzing Competitors...
            </>
          ) : (
            <>
              <Users className="w-5 h-5 mr-2" />
              Analyze Competition
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
            <div className="bg-gradient-to-br from-orange-500/15 to-orange-600/10 border border-orange-500/40 rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-8 h-8 text-orange-400" />
                <div>
                  <h3 className="text-white text-2xl font-bold">Competitive Analysis Results</h3>
                  <p className="text-orange-400/70 text-sm">{formData.projectName} • {formData.location}</p>
                </div>
              </div>

              {/* Market Position */}
              {response.marketPosition && (
                <div className="bg-orange-500/20 border border-orange-400/50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-orange-400" />
                    <div>
                      <p className="text-sm text-zinc-400">Market Position</p>
                      <p className="text-2xl font-bold text-orange-400">{response.marketPosition}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {response.priceComparison && (
                  <div className="bg-zinc-900/60 border border-orange-500/20 rounded-xl p-4">
                    <DollarSign className="h-5 w-5 mb-2 text-orange-400" />
                    <p className="text-orange-400/70 text-xs uppercase tracking-wider mb-1">Price Position</p>
                    <p className="text-white text-lg font-bold">{response.priceComparison}</p>
                  </div>
                )}
                {response.competitorCount && (
                  <div className="bg-zinc-900/60 border border-orange-500/20 rounded-xl p-4">
                    <Users className="h-5 w-5 mb-2 text-orange-400" />
                    <p className="text-orange-400/70 text-xs uppercase tracking-wider mb-1">Competitors Analyzed</p>
                    <p className="text-white text-lg font-bold">{response.competitorCount}</p>
                  </div>
                )}
                <div className="bg-zinc-900/60 border border-orange-500/20 rounded-xl p-4">
                  <BarChart3 className="h-5 w-5 mb-2 text-orange-400" />
                  <p className="text-orange-400/70 text-xs uppercase tracking-wider mb-1">Market</p>
                  <p className="text-white text-lg font-bold">Analysis</p>
                </div>
              </div>

              {/* Competitive Advantages */}
              {response.advantages && response.advantages.length > 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-6">
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
                </div>
              )}

              {/* Weaknesses */}
              {response.weaknesses && response.weaknesses.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
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
                </div>
              )}

              {/* Full Analysis */}
              <div className="bg-zinc-900/60 border border-orange-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    <h4 className="text-white font-semibold">Full Analysis</h4>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-zinc-400 hover:text-white">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
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
                    This analysis is AI-generated for informational purposes only. Market conditions and competitor strategies change frequently.
                    Always conduct your own due diligence and consult with market experts.
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

export default AICompetitorAnalysisPremium;