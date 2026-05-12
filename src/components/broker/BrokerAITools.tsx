import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  Plus,
  X,
  Bot,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
} from "lucide-react";

interface Subscription {
  id: string;
  tier: string;
  status: string;
  ai_credits_used: number;
  ai_credits_limit: number | null;
}

interface Project {
  id: string;
  name: string;
  location: string | null;
  price_from: number | null;
  price_to: number | null;
  developer_id: string | null;
}

interface BrokerAIToolsProps {
  subscription: Subscription;
}

export default function BrokerAITools({ subscription }: BrokerAIToolsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [recommendationType, setRecommendationType] = useState<"ai" | "manual">("ai");

  const canUseAI = subscription.ai_credits_limit === null || 
    subscription.ai_credits_used < subscription.ai_credits_limit;

  const creditsRemaining = subscription.ai_credits_limit !== null
    ? subscription.ai_credits_limit - subscription.ai_credits_used
    : "Unlimited";

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchProjects();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchProjects = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, location, price_from, price_to, developer_id")
        .ilike("name", `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Error searching projects:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addProject = (project: Project) => {
    if (selectedProjects.find(p => p.id === project.id)) {
      toast.error("Project already added");
      return;
    }
    if (selectedProjects.length >= 3) {
      toast.error("Maximum 3 projects for comparison");
      return;
    }
    setSelectedProjects([...selectedProjects, project]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeProject = (projectId: string) => {
    setSelectedProjects(selectedProjects.filter(p => p.id !== projectId));
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (selectedProjects.length < 2) {
      toast.error("Please select at least 2 projects to compare");
      return;
    }

    if (!canUseAI) {
      toast.error("You've reached your AI credits limit. Please upgrade your plan.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Call the compare-projects edge function
      const { data, error } = await supabase.functions.invoke("compare-projects", {
        body: {
          projectIds: selectedProjects.map(p => p.id),
          includeRecommendation: recommendationType === "ai",
        },
      });

      if (error) throw error;

      setAnalysisResult(data.comparison || data.analysis);

      // Update AI credits used
      await supabase
        .from("broker_subscriptions")
        .update({ ai_credits_used: subscription.ai_credits_used + 1 })
        .eq("id", subscription.id);

      toast.success("AI analysis complete!");
    } catch (error) {
      console.error("Error analyzing projects:", error);
      toast.error("Failed to analyze. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "N/A";
    return `AED ${(price / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="space-y-8">
      {/* Credits Display */}
      <div className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <div>
            <p className="text-white font-medium">AI Credits Remaining</p>
            <p className="text-white/70 text-sm">
              {typeof creditsRemaining === "number" 
                ? `${creditsRemaining} analyses left this month`
                : "Unlimited analyses"}
            </p>
          </div>
        </div>
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-lg px-4 py-2">
          {creditsRemaining}
        </Badge>
      </div>

      {/* Search Section */}
      <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#1A1A1A]" />
          Select Properties to Compare
        </h3>
        
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project name..."
            className="bg-[#1A1A1A] border-[#1A1A1A] text-white"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#1A1A1A]" />
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 border border-[#1A1A1A] rounded-lg overflow-hidden">
            {searchResults.map((project) => (
              <button
                key={project.id}
                onClick={() => addProject(project)}
                className="w-full flex items-center justify-between p-4 hover:bg-[#1A1A1A] transition-colors border-b border-[#1A1A1A] last:border-0 text-left"
              >
                <div>
                  <p className="text-white font-medium">{project.name}</p>
                  <p className="text-white/70 text-sm">{project.location}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-sm">
                    {formatPrice(project.price_from)} - {formatPrice(project.price_to)}
                  </span>
                  <Plus className="w-5 h-5 text-[#1A1A1A]" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Projects */}
      {selectedProjects.length > 0 && (
        <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#1A1A1A]" />
            Properties to Compare ({selectedProjects.length}/3)
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {selectedProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-[#1A1A1A]/50 border border-[#1A1A1A] rounded-lg p-4"
              >
                <button
                  onClick={() => removeProject(project.id)}
                  className="absolute top-2 right-2 p-1 hover:bg-[#1A1A1A] rounded transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>
                <Badge className="bg-[#EFE6D6]/20 text-[#1A1A1A] mb-2">{index + 1}</Badge>
                <p className="text-white font-medium">{project.name}</p>
                <p className="text-white/70 text-sm">{project.location}</p>
                <p className="text-[#1A1A1A] text-sm mt-2">
                  {formatPrice(project.price_from)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Type */}
      {selectedProjects.length >= 2 && (
        <div className="bg-[#FDFBF7]/50 border border-[#1A1A1A] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#1A1A1A]" />
            Recommendation Type
          </h3>

          <RadioGroup 
            value={recommendationType} 
            onValueChange={(v) => setRecommendationType(v as "ai" | "manual")}
            className="space-y-3"
          >
            <label className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all ${
              recommendationType === "ai" ? "border-purple-500 bg-purple-500/10" : "border-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}>
              <RadioGroupItem value="ai" className="mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">AI Recommendation</span>
                  <Badge className="bg-purple-500/20 text-purple-400">Recommended</Badge>
                </div>
                <p className="text-white/70 text-sm mt-1">
                  AI will analyze all properties and recommend the best option for your client based on 
                  location, developer reputation, price value, and investment potential.
                </p>
              </div>
            </label>

            <label className={`flex items-start gap-3 cursor-pointer rounded-xl border-2 p-4 transition-all ${
              recommendationType === "manual" ? "border-[#B89555] bg-[#EFE6D6]/10" : "border-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}>
              <RadioGroupItem value="manual" className="mt-1" />
              <div>
                <span className="text-white font-medium">Manual Selection</span>
                <p className="text-white/70 text-sm mt-1">
                  Get comparison data only. You choose which property to recommend to your client.
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>
      )}

      {/* Analyze Button */}
      {selectedProjects.length >= 2 && (
        <div className="flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !canUseAI}
            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:brightness-110 py-6 px-8 text-lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Properties...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Comparison
              </>
            )}
          </Button>
        </div>
      )}

      {/* Analysis Result */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold text-white">AI Analysis Complete</h3>
          </div>
          
          <div className="prose prose-invert max-w-none">
            <div className="text-white/85 whitespace-pre-wrap">
              {analysisResult.split('\n').map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* No Credits Warning */}
      {!canUseAI && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h4 className="text-amber-200 font-medium mb-2">AI Credits Exhausted</h4>
              <p className="text-amber-200/70 text-sm mb-4">
                You've used all your AI credits for this month. Upgrade to a higher tier for more credits 
                or wait until next month.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <a
                  href="https://wa.me/971547167107?text=Hi%2C%20I%20want%20to%20upgrade%20my%20Broker%20Toolkit%20subscription"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#1A1A1A] hover:text-amber-300"
                >
                  <Phone className="w-4 h-4" />
                  Contact to Upgrade
                </a>
                <a
                  href="mailto:CONTACT@JBJ.AE"
                  className="flex items-center gap-2 text-[#1A1A1A] hover:text-amber-300"
                >
                  <Mail className="w-4 h-4" />
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
