import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CalendarClock, Loader2, Copy, Check, Sparkles, 
  Calendar, Clock, Phone, Mail, MessageSquare,
  Target, AlertCircle, ChevronRight, Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const AIFollowupSchedulerPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    leadName: "",
    lastInteraction: "",
    interactionType: "call",
    leadStatus: "warm",
    notes: "",
    timezone: "GST",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.leadName.trim()) {
      toast.error("Please enter the lead name");
      return;
    }

    // Map frontend fields to backend expected format
    const leadInfo = `Lead: ${formData.leadName}. Status: ${formData.leadStatus}. Notes: ${formData.notes || 'None'}`;
    const urgency = formData.leadStatus === 'hot' ? 'high' : formData.leadStatus === 'warm' ? 'normal' : 'low';

    const result = await invokeTool("ai-followup-scheduler", {
      leadInfo,
      lastInteraction: formData.lastInteraction || 'Not specified',
      interactionType: formData.interactionType,
      urgency,
    });

    if (result.success) {
      toast.success("Follow-up schedule generated!");
    }
  };

  const copyToClipboard = () => {
    if (response?.schedule || response?.recommendations) {
      navigator.clipboard.writeText(JSON.stringify(response.schedule || response.recommendations, null, 2));
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'phone':
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warm':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'lukewarm':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <AIToolPremiumLayout
      title="AI Follow-up Scheduler"
      subtitle="Get AI-powered recommendations for optimal follow-up timing, messaging, and channel selection"
      icon={<CalendarClock className="h-8 w-8 text-cyan-400" />}
      accentColor="cyan"
      gradientFrom="cyan"
      badge="Timing Intelligence"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-cyan-900/20 border-cyan-500/30">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-cyan-400 mb-4">
              <CalendarClock className="h-5 w-5" />
              <span className="font-semibold">Lead & Interaction Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Target className="h-4 w-4 text-cyan-400" />
                  Lead Name *
                </Label>
                <Input
                  placeholder="John Smith"
                  value={formData.leadName}
                  onChange={(e) => handleChange("leadName", e.target.value)}
                  className="bg-zinc-900/50 border-cyan-500/30 text-white hover:border-cyan-500/50 focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  Last Interaction Date
                </Label>
                <Input
                  type="date"
                  value={formData.lastInteraction}
                  onChange={(e) => handleChange("lastInteraction", e.target.value)}
                  className="bg-zinc-900/50 border-cyan-500/30 text-white hover:border-cyan-500/50 focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Last Interaction Type</Label>
                <Select value={formData.interactionType} onValueChange={(v) => handleChange("interactionType", v)}>
                  <SelectTriggerDark className="border-cyan-500/30 hover:border-cyan-500/50">
                    <SelectValue />
                  </SelectTriggerDark>
                  <SelectContentDark className="border-cyan-500/30">
                    <SelectItemDark value="call">
                      <span className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone Call
                      </span>
                    </SelectItemDark>
                    <SelectItemDark value="email">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email
                      </span>
                    </SelectItemDark>
                    <SelectItemDark value="whatsapp">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> WhatsApp
                      </span>
                    </SelectItemDark>
                    <SelectItemDark value="meeting">In-Person Meeting</SelectItemDark>
                    <SelectItemDark value="viewing">Property Viewing</SelectItemDark>
                    <SelectItemDark value="inquiry">Website Inquiry</SelectItemDark>
                  </SelectContentDark>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Lead Status</Label>
                <Select value={formData.leadStatus} onValueChange={(v) => handleChange("leadStatus", v)}>
                  <SelectTriggerDark className="border-cyan-500/30 hover:border-cyan-500/50">
                    <SelectValue />
                  </SelectTriggerDark>
                  <SelectContentDark className="border-cyan-500/30">
                    <SelectItemDark value="hot">🔥 Hot - Ready to Buy</SelectItemDark>
                    <SelectItemDark value="warm">☀️ Warm - Interested</SelectItemDark>
                    <SelectItemDark value="lukewarm">🌤️ Lukewarm - Needs Nurturing</SelectItemDark>
                    <SelectItemDark value="cold">❄️ Cold - Initial Contact</SelectItemDark>
                    <SelectItemDark value="follow-up">📋 Follow-up Required</SelectItemDark>
                  </SelectContentDark>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Context & Notes</Label>
              <Textarea
                placeholder="What happened in the last interaction? Any specific interests or concerns?"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={3}
                className="bg-zinc-900/50 border-cyan-500/30 text-white hover:border-cyan-500/50 focus:border-cyan-400 transition-colors"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              variant="ai-cyan"
              className="w-full font-semibold py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Schedule...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Get Follow-up Plan
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Status Legend */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { status: 'hot', label: 'Hot Lead' },
            { status: 'warm', label: 'Warm Lead' },
            { status: 'lukewarm', label: 'Lukewarm' },
            { status: 'cold', label: 'Cold Lead' },
          ].map((item) => (
            <Badge key={item.status} className={`${getStatusColor(item.status)} border`}>
              {item.label}
            </Badge>
          ))}
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
              {/* Next Follow-up Card */}
              {response.nextFollowup && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                >
                  <Card className="bg-cyan-500/10 border-cyan-500/30 p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Calendar className="h-7 w-7 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-zinc-400">Next Follow-up</p>
                        <p className="text-xl font-bold text-white">{response.nextFollowup}</p>
                        {response.channel && (
                          <div className="flex items-center gap-2 mt-2">
                            {getChannelIcon(response.channel)}
                            <span className="text-sm text-cyan-400">{response.channel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Optimal Timing */}
              {response.optimalTiming && (
                <Card className="bg-cyan-900/20 border-cyan-500/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-cyan-400" />
                    <h4 className="font-semibold text-white">Optimal Timing</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {response.optimalTiming.bestDays && (
                      <div className="bg-zinc-800/50 p-3 rounded-lg">
                        <p className="text-xs text-zinc-500">Best Days</p>
                        <p className="text-sm text-white">{response.optimalTiming.bestDays.join(', ')}</p>
                      </div>
                    )}
                    {response.optimalTiming.bestHours && (
                      <div className="bg-zinc-800/50 p-3 rounded-lg">
                        <p className="text-xs text-zinc-500">Best Hours</p>
                        <p className="text-sm text-white">{response.optimalTiming.bestHours}</p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Suggested Messages */}
              {response.suggestedMessages && (
                <Card className="bg-cyan-900/20 border-cyan-500/30 p-4">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                    Suggested Messages
                  </h4>
                  <div className="space-y-2">
                    {response.suggestedMessages.map((msg: string, i: number) => (
                      <div key={i} className="bg-zinc-800/50 p-3 rounded-lg text-sm text-zinc-300 flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-cyan-400" />
                        {msg}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Urgency Alert */}
              {response.urgencyAlert && (
                <Card className="bg-red-500/10 border-red-500/30 p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <span className="font-semibold text-red-400">Urgency Alert</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-2">{response.urgencyAlert}</p>
                </Card>
              )}

              {/* Full Schedule */}
              <Card className="bg-cyan-900/20 border-cyan-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Full Schedule & Recommendations</h4>
                    <Button variant="dark-outline" size="sm" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                    {response.schedule || response.recommendations}
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
              <div className="p-6 rounded-full bg-cyan-500/10 mb-4">
                <CalendarClock className="h-12 w-12 text-cyan-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Schedule</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Enter lead details to get AI-powered follow-up scheduling with optimal timing recommendations
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIFollowupSchedulerPremium;
