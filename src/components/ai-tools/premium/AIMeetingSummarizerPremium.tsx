import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileAudio, Loader2, Copy, Check, Sparkles, 
  ListChecks, Users, Clock, Target, Calendar
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

const AIMeetingSummarizerPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    meetingTitle: "",
    participants: "",
    notes: "",
    duration: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.notes.trim()) {
      toast.error("Please enter meeting notes");
      return;
    }

    const result = await invokeTool("ai-meeting-summarizer", formData);

    if (result.success) {
      toast.success("Meeting summarized successfully!");
    }
  };

  const copyToClipboard = () => {
    if (response?.summary) {
      navigator.clipboard.writeText(response.summary);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AIToolPremiumLayout
      title="AI Meeting Summarizer"
      subtitle="Transform meeting notes into actionable summaries with extracted decisions, action items, and follow-ups"
      icon={<FileAudio className="h-8 w-8 text-violet-400" />}
      accentColor="violet"
      gradientFrom="violet"
      badge="Productivity Intelligence"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-violet-900/20 border-violet-500/30">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-violet-400 mb-4">
                <FileAudio className="h-5 w-5" />
                <span className="font-semibold">Meeting Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-400" />
                    Meeting Title
                  </Label>
                  <Input
                    placeholder="Client Discovery Call - Palm Jumeirah"
                    value={formData.meetingTitle}
                    onChange={(e) => handleChange("meetingTitle", e.target.value)}
                    className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-violet-400" />
                    Duration
                  </Label>
                  <Input
                    placeholder="45 minutes"
                    value={formData.duration}
                    onChange={(e) => handleChange("duration", e.target.value)}
                    className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-400" />
                  Participants
                </Label>
                <Input
                  placeholder="John Smith (Client), Sarah Ahmed (Agent)"
                  value={formData.participants}
                  onChange={(e) => handleChange("participants", e.target.value)}
                  className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Meeting Notes / Transcript *</Label>
                <Textarea
                  placeholder="Paste your meeting notes, transcript, or key discussion points here..."
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={10}
                  className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Summarizing Meeting...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Summary
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
                {/* Action Items */}
                {response.actionItems && response.actionItems.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <Card className="bg-violet-500/10 border-violet-500/30 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <ListChecks className="h-5 w-5 text-violet-400" />
                        <h4 className="font-semibold text-white">Action Items</h4>
                        <Badge className="bg-violet-500/20 text-violet-400 border-0">
                          {response.actionItems.length} items
                        </Badge>
                      </div>
                      <ul className="space-y-2">
                        {response.actionItems.map((item: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <span className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-xs text-violet-400 font-semibold">
                              {idx + 1}
                            </span>
                            <span className="text-zinc-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                )}

                {/* Key Decisions */}
                {response.keyDecisions && response.keyDecisions.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="h-5 w-5 text-emerald-400" />
                        <h4 className="font-semibold text-white">Key Decisions</h4>
                      </div>
                      <ul className="space-y-2">
                        {response.keyDecisions.map((decision: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                            <span className="text-emerald-400">✓</span>
                            {decision}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                )}

                {/* Follow-ups */}
                {response.followUps && response.followUps.length > 0 && (
                  <Card className="bg-violet-900/20 border-violet-500/30 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="h-5 w-5 text-violet-400" />
                      <h4 className="font-semibold text-white">Follow-ups Required</h4>
                    </div>
                    <ul className="space-y-2">
                      {response.followUps.map((followUp: string, idx: number) => (
                        <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                          <Clock className="h-4 w-4 mt-0.5 text-violet-400 flex-shrink-0" />
                          {followUp}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Full Summary */}
                <Card className="bg-violet-900/20 border-violet-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">Full Summary</h4>
                      <Button variant="dark-outline" size="sm" onClick={copyToClipboard}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                      {response.summary}
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
              <div className="p-6 rounded-full bg-violet-500/10 mb-4">
                <FileAudio className="h-12 w-12 text-violet-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Summarize</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Paste your meeting notes to get AI-powered summaries with action items and decisions
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIMeetingSummarizerPremium;
