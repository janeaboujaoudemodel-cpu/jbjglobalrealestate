import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, Loader2, Copy, Check, Sparkles, Clock,
  Mic, Film, Play, Download, Users, Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import AIToolGuide from "../AIToolGuide";

const AUDIENCES = [
  { value: "luxury-buyer", label: "Luxury Buyer" },
  { value: "investor", label: "Investor" },
  { value: "first-time-buyer", label: "First-Time Buyer" },
  { value: "family", label: "Family" },
  { value: "expat", label: "Expat / Relocating" },
];

const TONES = [
  { value: "professional", label: "Professional & Polished" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "luxury", label: "Ultra-Luxury" },
  { value: "energetic", label: "Energetic & Exciting" },
  { value: "storytelling", label: "Storytelling" },
];

const AIVideoTourScriptPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyDetails: "",
    location: "",
    targetAudience: "luxury-buyer",
    tone: "professional",
    duration: "2-3",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.propertyName.trim()) {
      toast.error("Please enter the property name");
      return;
    }

    const result = await invokeTool("ai-video-tour-script", formData);

    if (result.success) {
      toast.success("Script generated!");
    }
  };

  const copyToClipboard = (text?: string) => {
    const textToCopy = text || response?.script;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadScript = () => {
    if (!response?.script) return;
    
    const content = `# Video Tour Script: ${formData.propertyName}

Duration: ${response.estimatedDuration || formData.duration + " minutes"}
Target: ${AUDIENCES.find(a => a.value === formData.targetAudience)?.label}
Tone: ${TONES.find(t => t.value === formData.tone)?.label}

---

## Opening Hook
"${response.hook || ""}"

---

## Full Script

${response.script}

---

## Call to Action
"${response.callToAction || ""}"
`;
    
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `video-script-${formData.propertyName.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Script downloaded!");
  };

  return (
    <AIToolPremiumLayout
      title="AI Video Tour Script"
      subtitle="Generate engaging property tour scripts for video content, social media, and virtual walkthroughs"
      icon={<Video className="h-8 w-8 text-pink-400" />}
      accentColor="pink"
      gradientFrom="pink"
      badge="Video Content"
    >
      <AIToolGuide
        description="Create professional video scripts for property tours with hooks, scene directions, and calls-to-action. Perfect for TikTok, Instagram Reels, YouTube, and virtual tours."
        steps={[
          "Enter property name and key details",
          "Select your target audience and tone",
          "Choose the video duration",
          "Download or copy the complete script"
        ]}
        benefits={[
          "Ready-to-record scripts",
          "Opening hooks that grab attention",
          "Scene-by-scene breakdown",
          "Optimized call-to-actions"
        ]}
        accentColor="pink"
      />

      <div className="space-y-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card className="bg-pink-900/20 border-pink-500/30">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 text-pink-400 mb-4">
                <Film className="h-5 w-5" />
                <span className="font-semibold">Video Details</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Property Name *</Label>
                  <Input
                    placeholder="Sunset Bay Residences"
                    value={formData.propertyName}
                    onChange={(e) => handleChange("propertyName", e.target.value)}
                    className="bg-zinc-900/50 border-pink-500/30 text-white hover:border-pink-500/50 focus:border-pink-400 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Location</Label>
                  <Input
                    placeholder="Palm Jumeirah, Dubai"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="bg-zinc-900/50 border-pink-500/30 text-white hover:border-pink-500/50 focus:border-pink-400 transition-colors"
                  />
                </div>
              </div>

              {/* Audience Selector */}
              <div className="space-y-2">
                <Label className="text-zinc-300">Target Audience</Label>
                <div className="grid grid-cols-3 gap-2">
                  {AUDIENCES.slice(0, 3).map((audience) => (
                    <button
                      key={audience.value}
                      onClick={() => handleChange("targetAudience", audience.value)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        formData.targetAudience === audience.value
                          ? "bg-pink-500/20 border-pink-500/50 text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      <span className="text-xs font-medium">{audience.label}</span>
                    </button>
                  ))}
                </div>
                <Select value={formData.targetAudience} onValueChange={(v) => handleChange("targetAudience", v)}>
                  <SelectTriggerDark className="border-pink-500/30 hover:border-pink-500/50 mt-2">
                    <SelectValue />
                  </SelectTriggerDark>
                  <SelectContentDark className="border-pink-500/30">
                    {AUDIENCES.map((a) => (
                      <SelectItemDark key={a.value} value={a.value}>
                        {a.label}
                      </SelectItemDark>
                    ))}
                  </SelectContentDark>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Tone & Style</Label>
                  <Select value={formData.tone} onValueChange={(v) => handleChange("tone", v)}>
                    <SelectTriggerDark className="border-pink-500/30 hover:border-pink-500/50">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-pink-500/30">
                      {TONES.map((t) => (
                        <SelectItemDark key={t.value} value={t.value}>
                          {t.label}
                        </SelectItemDark>
                      ))}
                    </SelectContentDark>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Duration</Label>
                  <Select value={formData.duration} onValueChange={(v) => handleChange("duration", v)}>
                    <SelectTriggerDark className="border-pink-500/30 hover:border-pink-500/50">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-pink-500/30">
                      <SelectItemDark value="1">1 min — Social</SelectItemDark>
                      <SelectItemDark value="2-3">2–3 min — Standard</SelectItemDark>
                      <SelectItemDark value="5">5 min — Detailed</SelectItemDark>
                      <SelectItemDark value="10">10 min — Full Tour</SelectItemDark>
                    </SelectContentDark>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Property Details *</Label>
                <Textarea
                  placeholder="Bedrooms, features, views, amenities, unique selling points..."
                  value={formData.propertyDetails}
                  onChange={(e) => handleChange("propertyDetails", e.target.value)}
                  className="bg-zinc-900/50 border-pink-500/30 text-white hover:border-pink-500/50 focus:border-pink-400 transition-colors min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate Video Script
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
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
                {/* Duration Badge */}
                {response.estimatedDuration && (
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Estimated duration: {response.estimatedDuration}</span>
                  </div>
                )}

                {/* Opening Hook */}
                {response.hook && (
                  <Card className="bg-pink-500/10 border-pink-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Megaphone className="h-4 w-4 text-pink-400" />
                        <span className="text-sm font-semibold text-white">Opening Hook</span>
                      </div>
                      <p className="text-zinc-300 italic">"{response.hook}"</p>
                    </CardContent>
                  </Card>
                )}

                {/* Full Script */}
                <Card className="bg-pink-900/20 border-pink-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white flex items-center gap-2">
                        <Mic className="h-4 w-4 text-pink-400" />
                        Full Script
                      </h4>
                      <div className="flex gap-2">
                        <Button variant="dark-outline" size="sm" onClick={() => copyToClipboard()}>
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                        <Button variant="dark-outline" size="sm" onClick={downloadScript}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                      {response.script}
                    </div>
                  </CardContent>
                </Card>

                {/* Call to Action */}
                {response.callToAction && (
                  <Card className="bg-emerald-500/10 border-emerald-500/30">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Play className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">Call to Action</span>
                      </div>
                      <p className="text-zinc-300">"{response.callToAction}"</p>
                    </CardContent>
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
                <div className="p-6 rounded-full bg-pink-500/10 mb-4">
                  <Video className="h-12 w-12 text-pink-400/50" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-400">Ready to Script</h3>
                <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                  Enter property details to generate a professional video tour script with hooks and CTAs
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIVideoTourScriptPremium;
