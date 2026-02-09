import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageSquareReply, Loader2, Copy, Check, Sparkles, 
  Target, Shield, Lightbulb, Heart, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

const AIObjectionHandlerPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [objection, setObjection] = useState("");
  const [context, setContext] = useState("");
  const [propertyType, setPropertyType] = useState("luxury-apartment");
  const [leadProfile, setLeadProfile] = useState("serious-buyer");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!objection.trim()) {
      toast.error("Please enter the buyer objection");
      return;
    }

    const result = await invokeTool("ai-objection-handler", {
      objection,
      context,
      propertyType,
      leadProfile,
    });

    if (result.success) {
      toast.success("Response generated successfully!");
    }
  };

  const copyToClipboard = () => {
    if (response?.response) {
      navigator.clipboard.writeText(response.response);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AIToolPremiumLayout
      title="AI Objection Handler"
      subtitle="Get expert responses to buyer objections with empathetic, value-focused messaging that converts"
      icon={<MessageSquareReply className="h-8 w-8 text-rose-400" />}
      accentColor="rose"
      gradientFrom="rose"
      badge="Sales Intelligence"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-rose-900/20 border-rose-500/30">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-rose-400 mb-4">
                <MessageSquareReply className="h-5 w-5" />
                <span className="font-semibold">Objection Details</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    Buyer Objection *
                  </Label>
                  <Textarea
                    placeholder="e.g., 'The price is too high compared to other properties in the area'"
                    value={objection}
                    onChange={(e) => setObjection(e.target.value)}
                    rows={4}
                    className="bg-zinc-900/50 border-rose-500/30 text-white hover:border-rose-500/50 focus:border-rose-400 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Property Type</Label>
                    <Select value={propertyType} onValueChange={setPropertyType}>
                      <SelectTriggerDark className="border-rose-500/30 hover:border-rose-500/50">
                        <SelectValue />
                      </SelectTriggerDark>
                      <SelectContentDark className="border-rose-500/30">
                        <SelectItemDark value="luxury-apartment">Luxury Apartment</SelectItemDark>
                        <SelectItemDark value="villa">Villa</SelectItemDark>
                        <SelectItemDark value="penthouse">Penthouse</SelectItemDark>
                        <SelectItemDark value="townhouse">Townhouse</SelectItemDark>
                        <SelectItemDark value="off-plan">Off-Plan</SelectItemDark>
                        <SelectItemDark value="commercial">Commercial</SelectItemDark>
                      </SelectContentDark>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-300">Lead Profile</Label>
                    <Select value={leadProfile} onValueChange={setLeadProfile}>
                      <SelectTriggerDark className="border-rose-500/30 hover:border-rose-500/50">
                        <SelectValue />
                      </SelectTriggerDark>
                      <SelectContentDark className="border-rose-500/30">
                        <SelectItemDark value="serious-buyer">Serious Buyer</SelectItemDark>
                        <SelectItemDark value="first-time-buyer">First-Time Buyer</SelectItemDark>
                        <SelectItemDark value="investor">Investor</SelectItemDark>
                        <SelectItemDark value="relocating">Relocating</SelectItemDark>
                        <SelectItemDark value="upgrade-buyer">Upgrade Buyer</SelectItemDark>
                        <SelectItemDark value="hesitant">Hesitant Buyer</SelectItemDark>
                      </SelectContentDark>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Additional Context (optional)</Label>
                  <Textarea
                    placeholder="Any additional context about the conversation or lead..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={2}
                    className="bg-zinc-900/50 border-rose-500/30 text-white hover:border-rose-500/50 focus:border-rose-400 transition-colors"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                variant="ai-rose"
                className="w-full font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Response...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Response
                  </>
                )}
              </Button>
            </CardContent>
        </Card>

        {/* Response Strategy */}
        <div className="grid grid-cols-3 gap-3">
            <Card className="bg-rose-900/20 border-rose-500/30 p-4 text-center">
              <Heart className="h-5 w-5 mx-auto mb-2 text-rose-400" />
              <p className="text-xs text-zinc-500">Empathy</p>
              <p className="text-sm font-semibold text-white">First</p>
            </Card>
            <Card className="bg-rose-900/20 border-rose-500/30 p-4 text-center">
              <Target className="h-5 w-5 mx-auto mb-2 text-rose-400" />
              <p className="text-xs text-zinc-500">Value</p>
              <p className="text-sm font-semibold text-white">Focused</p>
            </Card>
            <Card className="bg-rose-900/20 border-rose-500/30 p-4 text-center">
              <Shield className="h-5 w-5 mx-auto mb-2 text-rose-400" />
              <p className="text-xs text-zinc-500">Trust</p>
              <p className="text-sm font-semibold text-white">Building</p>
            </Card>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {response?.response ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Objection Category */}
                {response.category && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Card className="bg-rose-500/10 border-rose-500/30 p-4">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-rose-400" />
                        <span className="text-sm text-zinc-400">Objection Type:</span>
                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30">
                          {response.category}
                        </Badge>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Response Confidence */}
                {response.confidenceScore && (
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-rose-900/20 border-rose-500/30 p-4">
                      <p className="text-xs text-zinc-400">Response Confidence</p>
                      <p className="text-xl font-bold text-rose-400">{response.confidenceScore}%</p>
                    </Card>
                    {response.difficulty && (
                      <Card className="bg-zinc-900/50 border-zinc-800 p-4">
                        <p className="text-xs text-zinc-400">Objection Difficulty</p>
                        <p className="text-xl font-bold text-white capitalize">{response.difficulty}</p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Key Points */}
                {response.keyPoints && (
                  <Card className="bg-rose-900/20 border-rose-500/30 p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-rose-400" />
                      Key Points to Emphasize
                    </h4>
                    <ul className="space-y-2">
                      {response.keyPoints.map((point: string, i: number) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0 text-xs text-rose-400">
                            {i + 1}
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Full Response */}
                <Card className="bg-rose-900/20 border-rose-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">AI Response</h4>
                      <Button variant="outline" size="sm" onClick={copyToClipboard} className="border-zinc-700">
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                      {response.response}
                    </div>
                  </CardContent>
                </Card>

                {/* Alternative Approaches */}
                {response.alternatives && (
                  <Card className="bg-rose-900/20 border-rose-500/30 p-4">
                    <h4 className="font-semibold text-white mb-3">Alternative Approaches</h4>
                    <div className="space-y-2">
                      {response.alternatives.map((alt: string, i: number) => (
                        <div key={i} className="bg-zinc-800/50 p-3 rounded-lg text-sm text-zinc-300">
                          <span className="text-xs text-zinc-500">Option {i + 1}:</span>
                          <p className="mt-1">{alt}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-6 rounded-full bg-rose-500/10 mb-4">
                <MessageSquareReply className="h-12 w-12 text-rose-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Respond</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Enter a buyer objection to get AI-powered response suggestions with empathy-first approach
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIObjectionHandlerPremium;
