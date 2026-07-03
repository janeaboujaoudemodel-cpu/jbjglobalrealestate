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
      accentColor="emerald"
      gradientFrom="emerald"
      badge="Market Intelligence"
      showFinancialDisclaimer
    >
      {/* Form Section */}
      <motion.div
        data-allow-color
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
        className="bg-gradient-to-br from-emerald-950/40 via-zinc-900/60 to-emerald-950/20 backdrop-blur-sm border border-emerald-500/30 rounded-3xl p-8 md:p-10 mb-8"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <Building className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold">Project Information</h2>
            <p className="text-emerald-300/70 text-sm">Enter your project details for competitive analysis</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Project Name */}
          <div>
            <Label className="text-white/85 text-sm font-medium mb-2 block">
              <Building className="w-4 h-4 inline mr-1 text-emerald-300" />
              Your Project Name <span className="text-emerald-300">*</span>
            </Label>
            <Input
              placeholder="Marina Heights Tower"
              value={formData.projectName}
              onChange={(e) => handleChange("projectName", e.target.value)}
              className="bg-emerald-950/40 border-emerald-500/30 text-white h-12 rounded-xl hover:border-emerald-500/50 focus:border-emerald-300 transition-colors"
            />
          </div>

          {/* Location */}
          <div>
            <Label className="text-white/85 text-sm font-medium mb-2 block">
              <MapPin className="w-4 h-4 inline mr-1 text-emerald-300" />
              Location
            </Label>
            <Input
              placeholder="Dubai Marina"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="bg-emerald-950/40 border-emerald-500/30 text-white h-12 rounded-xl hover:border-emerald-500/50 focus:border-emerald-300 transition-colors"
            />
          </div>
        </div>

        {/* Project Details */}
        <div className="mb-6">
          <Label className="text-white/85 text-sm font-medium mb-2 block">
            Your Project Details
          </Label>
          <Textarea
            placeholder="Describe your project: unit types, price range, amenities, unique selling points..."
            value={formData.projectDetails}
            onChange={(e) => handleChange("projectDetails", e.target.value)}
            rows={4}
            className="bg-emerald-950/40 border-emerald-500/30 text-white rounded-xl hover:border-emerald-500/50 focus:border-emerald-300 transition-colors"
          />
        </div>

        {/* Competitor Projects */}
        <div className="mb-8">
          <Label className="text-white/85 text-sm font-medium mb-2 block">
            Competitor Projects (optional)
          </Label>
          <Textarea
            placeholder="List competitor projects to analyze (one per line)..."
            value={formData.competitorProjects}
            onChange={(e) => handleChange("competitorProjects", e.target.value)}
            rows={3}
            className="bg-emerald-950/40 border-emerald-500/30 text-white rounded-xl hover:border-emerald-500/50 focus:border-emerald-300 transition-colors"
          />
        </div>

        <Button
          data-allow-color
          onClick={handleSubmit}
          disabled={loading || !formData.projectName}
          className="w-full font-bold py-6 text-lg rounded-xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-950 hover:from-emerald-600 hover:via-emerald-500 hover:to-emerald-900 text-white"
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
            <div data-allow-color className="bg-gradient-to-br from-emerald-950/80 via-emerald-900/40 to-black border border-emerald-500/40 rounded-3xl p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-8 h-8 text-emerald-300" />
                <div>
                  <h3 className="text-white text-2xl font-bold">Competitive Analysis Results</h3>
                  <p className="text-emerald-300/70 text-sm">{formData.projectName} • {formData.location}</p>
                </div>
              </div>

              {/* Market Position */}
              {response.marketPosition && (
                <div className="bg-emerald-500/20 border border-emerald-300/50 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-emerald-300" />
                    <div>
                      <p className="text-sm text-white/70">Market Position</p>
                      <p className="text-2xl font-bold text-emerald-300">{response.marketPosition}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {response.priceComparison && (
                  <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4">
                    <DollarSign className="h-5 w-5 mb-2 text-emerald-300" />
                    <p className="text-emerald-300/70 text-xs uppercase tracking-wider mb-1">Price Position</p>
                    <p className="text-white text-lg font-bold">{response.priceComparison}</p>
                  </div>
                )}
                {response.competitorCount && (
                  <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4">
                    <Users className="h-5 w-5 mb-2 text-emerald-300" />
                    <p className="text-emerald-300/70 text-xs uppercase tracking-wider mb-1">Competitors Analyzed</p>
                    <p className="text-white text-lg font-bold">{response.competitorCount}</p>
                  </div>
                )}
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-4">
                  <BarChart3 className="h-5 w-5 mb-2 text-emerald-300" />
                  <p className="text-emerald-300/70 text-xs uppercase tracking-wider mb-1">Market</p>
                  <p className="text-white text-lg font-bold">Analysis</p>
                </div>
              </div>

              {/* Competitive Advantages */}
              {response.advantages && response.advantages.length > 0 && (
                <div className="jj-surface-emerald-soft border border-[color:var(--emerald-1)]/30/30 rounded-xl p-6 mb-6">
                  <h4 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Competitive Advantages
                  </h4>
                  <ul className="space-y-2">
                    {response.advantages.map((adv: string, i: number) => (
                      <li key={i} className="text-sm text-white/85 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full jj-surface-emerald-soft flex items-center justify-center flex-shrink-0 text-xs text-emerald-400">
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
                      <li key={i} className="text-sm text-white/85 flex items-start gap-2">
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
              <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-300" />
                    <h4 className="text-white font-semibold">Full Analysis</h4>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-white/70 hover:text-white">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="bg-[#1A1A1A]/50 p-4 rounded-lg text-white/85 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                  {response.analysis}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-[#1A1A1A]/50 border border-[#1A1A1A] rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-white/70 flex-shrink-0" />
                <div>
                  <h4 className="text-white/85 font-semibold mb-2">Important Disclaimer</h4>
                  <p className="text-white/70 text-sm leading-relaxed">
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
