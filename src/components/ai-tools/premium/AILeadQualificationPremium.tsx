import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserCheck, Loader2, Copy, Check, Sparkles, Star,
  Target, TrendingUp, AlertTriangle, Phone, Mail,
  MessageSquare, Calendar, DollarSign, MapPin
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

const AILeadQualificationPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [leadInfo, setLeadInfo] = useState({
    name: "",
    email: "",
    phone: "",
    budget: "",
    propertyInterest: "",
    timeline: "",
    source: "",
    notes: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setLeadInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!leadInfo.name.trim()) {
      toast.error("Please enter the lead name");
      return;
    }

    const result = await invokeTool("ai-lead-qualification", {
      leadInfo,
    });

    if (result.success) {
      toast.success("Lead qualified successfully!");
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-amber-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/30";
    if (score >= 60) return "bg-amber-500/10 border-amber-500/30";
    if (score >= 40) return "bg-orange-500/10 border-orange-500/30";
    return "bg-red-500/10 border-red-500/30";
  };

  const getLeadLabel = (score: number) => {
    if (score >= 80) return { text: "Hot Lead", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (score >= 60) return { text: "Warm Lead", color: "text-amber-400", bg: "bg-amber-500/20" };
    if (score >= 40) return { text: "Lukewarm", color: "text-orange-400", bg: "bg-orange-500/20" };
    return { text: "Cold Lead", color: "text-red-400", bg: "bg-red-500/20" };
  };

  return (
    <AIToolPremiumLayout
      title="AI Lead Qualification"
      subtitle="Automatically score and qualify leads with AI-powered behavioral analysis and conversion probability"
      icon={<UserCheck className="h-8 w-8 text-purple-400" />}
      accentColor="purple"
      gradientFrom="purple"
      badge="Sales Intelligence"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-purple-900/20 border-purple-500/30">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-purple-400 mb-4">
                <UserCheck className="h-5 w-5" />
                <span className="font-semibold">Lead Information</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-purple-400" />
                    Lead Name *
                  </Label>
                  <Input
                    placeholder="John Smith"
                    value={leadInfo.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="bg-zinc-900/50 border-purple-500/30 text-white hover:border-purple-500/50 focus:border-purple-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-purple-400" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    value={leadInfo.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="bg-zinc-900/50 border-purple-500/30 text-white hover:border-purple-500/50 focus:border-purple-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-purple-400" />
                    Phone
                  </Label>
                  <Input
                    placeholder="+971 50 123 4567"
                    value={leadInfo.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="bg-zinc-900/50 border-purple-500/30 text-white hover:border-purple-500/50 focus:border-purple-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-purple-400" />
                    Budget Range
                  </Label>
                  <Input
                    placeholder="AED 2-3 Million"
                    value={leadInfo.budget}
                    onChange={(e) => handleChange("budget", e.target.value)}
                    className="bg-zinc-900/50 border-purple-500/30 text-white hover:border-purple-500/50 focus:border-purple-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-purple-400" />
                    Property Interest
                  </Label>
                  <Input
                    placeholder="2BR in Dubai Marina"
                    value={leadInfo.propertyInterest}
                    onChange={(e) => handleChange("propertyInterest", e.target.value)}
                    className="bg-zinc-900/50 border-purple-500/30 text-white hover:border-purple-500/50 focus:border-purple-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-purple-400" />
                    Timeline
                  </Label>
                  <Input
                    placeholder="Within 3 months"
                    value={leadInfo.timeline}
                    onChange={(e) => handleChange("timeline", e.target.value)}
                    className="bg-zinc-900/50 border-purple-500/30 text-white hover:border-purple-500/50 focus:border-purple-400 transition-colors"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-400" />
                    Lead Source
                  </Label>
                  <Input
                    placeholder="Website inquiry, referral, social media..."
                    value={leadInfo.source}
                    onChange={(e) => handleChange("source", e.target.value)}
                    className="bg-zinc-900/50 border-purple-500/30 text-white hover:border-purple-500/50 focus:border-purple-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Additional Notes</Label>
                <Textarea
                  placeholder="Any additional context about the lead..."
                  value={leadInfo.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="bg-zinc-900/50 border-purple-500/30 text-white hover:border-purple-500/50 focus:border-purple-400 transition-colors"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Qualifying Lead...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Qualify Lead
                  </>
                )}
              </Button>
            </CardContent>
        </Card>

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
                {/* Main Score Card */}
                {response.qualificationScore && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Card className={`p-6 ${getScoreBg(response.qualificationScore)}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-zinc-400">Qualification Score</p>
                          <p className={`text-4xl font-bold ${getScoreColor(response.qualificationScore)}`}>
                            {response.qualificationScore}/100
                          </p>
                        </div>
                        <Badge className={`${getLeadLabel(response.qualificationScore).bg} ${getLeadLabel(response.qualificationScore).color} border-0 text-lg px-4 py-2`}>
                          {getLeadLabel(response.qualificationScore).text}
                        </Badge>
                      </div>
                      <Progress value={response.qualificationScore} className="h-3" />
                      <div className="flex items-center gap-1 mt-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(response.qualificationScore / 20)
                                ? "text-amber-400 fill-amber-400"
                                : "text-zinc-600"
                            }`}
                          />
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Intelligence Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  {response.conversionProbability && (
                    <Card className="bg-purple-500/10 border-purple-500/30 p-4">
                      <Target className="h-5 w-5 mb-2 text-purple-400" />
                      <p className="text-xs text-zinc-400">Conversion Probability</p>
                      <p className="text-xl font-bold text-purple-400">{response.conversionProbability}%</p>
                    </Card>
                  )}
                  {response.urgencyLevel && (
                    <Card className="bg-orange-500/10 border-orange-500/30 p-4">
                      <TrendingUp className="h-5 w-5 mb-2 text-orange-400" />
                      <p className="text-xs text-zinc-400">Urgency Level</p>
                      <p className="text-xl font-bold text-orange-400 capitalize">{response.urgencyLevel}</p>
                    </Card>
                  )}
                </div>

                {/* Recommended Actions */}
                {response.recommendedActions && (
                  <Card className="bg-purple-900/20 border-purple-500/30 p-4">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-400" />
                      Recommended Actions
                    </h4>
                    <ul className="space-y-2">
                      {response.recommendedActions.map((action: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                          <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-xs text-purple-400">
                            {i + 1}
                          </span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Full Analysis */}
                <Card className="bg-purple-900/20 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Full Analysis</h4>
                      <Button variant="dark-outline" size="sm" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
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
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-6 rounded-full bg-purple-500/10 mb-4">
                <UserCheck className="h-12 w-12 text-purple-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Qualify</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Enter lead information to get AI-powered qualification scoring with conversion probability
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AILeadQualificationPremium;
