import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, Loader2, Copy, Check, Sparkles, 
  School, Hospital, ShoppingBag, Train, Star,
  Building, Trees, Sun, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useAITool } from "../AIToolsProvider";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";

const AINeighborhoodInsightsPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!location.trim()) {
      toast.error("Please enter a location");
      return;
    }

    const result = await invokeTool("ai-neighborhood-insights", {
      location,
      interests,
    });

    if (result.success) {
      toast.success("Neighborhood analysis complete!");
    }
  };

  const copyToClipboard = () => {
    if (response?.insights) {
      navigator.clipboard.writeText(response.insights);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const amenityIcons: Record<string, any> = {
    schools: School,
    healthcare: Hospital,
    shopping: ShoppingBag,
    transport: Train,
    parks: Trees,
    safety: Shield,
  };

  return (
    <AIToolPremiumLayout
      title="AI Neighborhood Insights"
      subtitle="Get comprehensive neighborhood analysis including amenities, lifestyle, investment potential, and livability scores"
      icon={<MapPin className="h-8 w-8 text-teal-400" />}
      accentColor="teal"
      gradientFrom="teal"
      badge="Location Intelligence"
      showFinancialDisclaimer
    >
      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-teal-900/20 border-teal-500/30">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-teal-400 mb-4">
                <MapPin className="h-5 w-5" />
                <span className="font-semibold">Location Details</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-teal-400" />
                    Location / Neighborhood *
                  </Label>
                  <Input
                    placeholder="Dubai Marina, JBR, Downtown Dubai..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="bg-zinc-900/50 border-teal-500/30 text-white hover:border-teal-500/50 focus:border-teal-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Specific Interests (optional)</Label>
                  <Textarea
                    placeholder="Schools, healthcare facilities, nightlife, beach access, family-friendly..."
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    rows={3}
                    className="bg-zinc-900/50 border-teal-500/30 text-white hover:border-teal-500/50 focus:border-teal-400 transition-colors"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Analyzing Neighborhood...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Get Insights
                  </>
                )}
              </Button>
            </CardContent>
        </Card>

        {/* Quick Categories */}
        <div className="grid grid-cols-3 gap-3">
            <Card className="bg-teal-900/20 border-teal-500/30 p-4 text-center">
              <School className="h-5 w-5 mx-auto mb-2 text-teal-400" />
              <p className="text-xs text-zinc-500">Education</p>
              <p className="text-sm font-semibold text-white">Schools</p>
            </Card>
            <Card className="bg-teal-900/20 border-teal-500/30 p-4 text-center">
              <Hospital className="h-5 w-5 mx-auto mb-2 text-teal-400" />
              <p className="text-xs text-zinc-500">Healthcare</p>
              <p className="text-sm font-semibold text-white">Facilities</p>
            </Card>
            <Card className="bg-teal-900/20 border-teal-500/30 p-4 text-center">
              <Train className="h-5 w-5 mx-auto mb-2 text-teal-400" />
              <p className="text-xs text-zinc-500">Transport</p>
              <p className="text-sm font-semibold text-white">Access</p>
            </Card>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {response ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Neighborhood Score */}
                {response.score && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Card className="bg-teal-500/10 border-teal-500/30 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-zinc-400">Neighborhood Score</p>
                          <p className="text-4xl font-bold text-teal-400">{response.score}/10</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= Math.round(response.score / 2)
                                  ? "text-teal-400 fill-teal-400"
                                  : "text-zinc-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <Progress value={response.score * 10} className="h-2" />
                    </Card>
                  </motion.div>
                )}

                {/* Highlights Grid */}
                {response.highlights && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(response.highlights).map(([key, value]: [string, any]) => {
                      const Icon = amenityIcons[key] || Building;
                      return (
                        <motion.div
                          key={key}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                        >
                          <Card className="bg-teal-900/20 border-teal-500/30 p-4">
                            <Icon className="h-5 w-5 mb-2 text-teal-400" />
                            <p className="text-xs text-zinc-400 capitalize">{key}</p>
                            <p className="text-lg font-bold text-white">{value}</p>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Lifestyle Indicators */}
                {response.lifestyle && (
                  <Card className="bg-teal-900/20 border-teal-500/30 p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Sun className="h-4 w-4 text-teal-400" />
                      Lifestyle Indicators
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {response.lifestyle.map((item: string, i: number) => (
                        <Badge key={i} className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Investment Potential */}
                {response.investmentPotential && (
                  <Card className={`p-4 ${
                    response.investmentPotential === 'high' 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : response.investmentPotential === 'medium'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Building className={`h-5 w-5 ${
                        response.investmentPotential === 'high' ? 'text-emerald-400' :
                        response.investmentPotential === 'medium' ? 'text-amber-400' : 'text-zinc-400'
                      }`} />
                      <span className="font-semibold text-white">Investment Potential: </span>
                      <span className={`capitalize ${
                        response.investmentPotential === 'high' ? 'text-emerald-400' :
                        response.investmentPotential === 'medium' ? 'text-amber-400' : 'text-zinc-400'
                      }`}>{response.investmentPotential}</span>
                    </div>
                  </Card>
                )}

                {/* Full Analysis */}
                <Card className="bg-teal-900/20 border-teal-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Full Analysis</h4>
                      <Button variant="dark-outline" size="sm" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                      {response.insights}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-6 rounded-full bg-teal-500/10 mb-4">
                <MapPin className="h-12 w-12 text-teal-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Explore</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Enter a location to get AI-powered neighborhood insights with livability scores
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AINeighborhoodInsightsPremium;
