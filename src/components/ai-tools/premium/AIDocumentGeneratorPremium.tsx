import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FilePlus, Loader2, Copy, Check, Sparkles, FileText,
  Mail, MessageSquare, Share2, Newspaper, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const DOCUMENT_TYPES = [
  { value: "listing", label: "Property Listing", icon: FileText },
  { value: "email-follow-up", label: "Follow-up Email", icon: Mail },
  { value: "email-introduction", label: "Introduction Email", icon: Mail },
  { value: "sms", label: "SMS / WhatsApp", icon: MessageSquare },
  { value: "social-media", label: "Social Media Post", icon: Share2 },
  { value: "newsletter", label: "Newsletter", icon: Newspaper },
  { value: "brochure", label: "Brochure Text", icon: FileText },
  { value: "client-report", label: "Client Report", icon: FileText },
];

const TONES = [
  { value: "professional", label: "💼 Professional", desc: "Formal and business-like" },
  { value: "friendly", label: "😊 Friendly", desc: "Warm and approachable" },
  { value: "luxury", label: "✨ Ultra-Luxury", desc: "Exclusive and sophisticated" },
  { value: "urgent", label: "⚡ Urgent", desc: "Time-sensitive and action-oriented" },
  { value: "casual", label: "💬 Casual", desc: "Relaxed and conversational" },
];

const AIDocumentGeneratorPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    documentType: "listing",
    subject: "",
    details: "",
    tone: "professional",
    recipientName: "",
  });
  const [copied, setCopied] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.details.trim()) {
      toast.error("Please provide document details");
      return;
    }

    const result = await invokeTool("ai-document-generator", formData);

    if (result.success) {
      toast.success("Document generated!");
    }
  };

  const copyToClipboard = (text?: string) => {
    const textToCopy = text || response?.document;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getDocTypeInfo = (type: string) => DOCUMENT_TYPES.find((d) => d.value === type);

  return (
    <AIToolPremiumLayout
      title="AI Document Generator"
      subtitle="Generate professional real estate documents, emails, and marketing content in seconds"
      icon={<FilePlus className="h-8 w-8 text-lime-400" />}
      accentColor="lime"
      gradientFrom="lime"
      badge="Content Creator"
    >
      <AIToolGuide
        description="Create polished property listings, follow-up emails, social media posts, and more. AI adapts content to your chosen tone and target audience."
        steps={[
          "Select the document type you need",
          "Choose the tone that fits your audience",
          "Provide details about the property/client",
          "Generate and copy your ready-to-use content"
        ]}
        benefits={[
          "10+ document types supported",
          "Multiple tone options",
          "Alternative versions included",
          "Instant copy-paste ready content"
        ]}
        accentColor="lime"
      />

      <div className="space-y-8">
        {/* Input Section - Full Width */}
        <Card className="bg-lime-900/20 border-lime-500/30">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-lime-400 mb-4">
              <FilePlus className="h-5 w-5" />
              <span className="font-semibold">Document Setup</span>
            </div>

            {/* Document Type Grid */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Document Type *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DOCUMENT_TYPES.slice(0, 4).map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => handleChange("documentType", type.value)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        formData.documentType === type.value
                          ? "bg-lime-500/20 border-lime-500/50 text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs block">{type.label}</span>
                    </button>
                  );
                })}
              </div>
              <Select value={formData.documentType} onValueChange={(v) => handleChange("documentType", v)}>
                <SelectTriggerDark className="border-lime-500/30 hover:border-lime-500/50 mt-2">
                  <SelectValue placeholder="More document types..." />
                </SelectTriggerDark>
                <SelectContentDark className="border-lime-500/30">
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItemDark key={type.value} value={type.value}>
                      {type.label}
                    </SelectItemDark>
                  ))}
                </SelectContentDark>
              </Select>
            </div>

            {/* Tone Selector */}
            <div className="space-y-2">
              <Label className="text-zinc-300">Tone</Label>
              <Select value={formData.tone} onValueChange={(v) => handleChange("tone", v)}>
                <SelectTriggerDark className="border-lime-500/30 hover:border-lime-500/50">
                  <SelectValue />
                </SelectTriggerDark>
                <SelectContentDark className="border-lime-500/30">
                  {TONES.map((tone) => (
                    <SelectItemDark key={tone.value} value={tone.value}>
                      <div>
                        <span>{tone.label}</span>
                        <span className="text-xs text-zinc-500 ml-2">{tone.desc}</span>
                      </div>
                    </SelectItemDark>
                  ))}
                </SelectContentDark>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Subject / Title</Label>
                <Input
                  placeholder="Document title..."
                  value={formData.subject}
                  onChange={(e) => handleChange("subject", e.target.value)}
                  className="bg-zinc-900/50 border-lime-500/30 text-white hover:border-lime-500/50 focus:border-lime-400 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Recipient Name</Label>
                <Input
                  placeholder="John Smith"
                  value={formData.recipientName}
                  onChange={(e) => handleChange("recipientName", e.target.value)}
                  className="bg-zinc-900/50 border-lime-500/30 text-white hover:border-lime-500/50 focus:border-lime-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Details & Context *</Label>
              <Textarea
                placeholder="Property info, client details, key points to include..."
                value={formData.details}
                onChange={(e) => handleChange("details", e.target.value)}
                className="bg-zinc-900/50 border-lime-500/30 text-white hover:border-lime-500/50 focus:border-lime-400 transition-colors min-h-[120px]"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-lime-600 to-lime-500 hover:from-lime-500 hover:to-lime-400 text-white font-semibold py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Document
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section - Below Form */}
        <AnimatePresence mode="wait">
          {response ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Subject Line (for emails) */}
              {response.subject && (
                <Card className="bg-lime-500/10 border-lime-500/30">
                  <CardContent className="p-4">
                    <p className="text-xs text-zinc-400 mb-1">Subject Line</p>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{response.subject}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(response.subject)}
                        className="text-zinc-400"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Document */}
              <Card className="bg-lime-900/20 border-lime-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-white">Generated Document</h4>
                      <Badge className="bg-lime-500/20 text-lime-400 border-lime-500/30">
                        {getDocTypeInfo(formData.documentType)?.label}
                      </Badge>
                    </div>
                    <Button variant="dark-outline" size="sm" onClick={() => copyToClipboard()}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                    {response.document}
                  </div>
                </CardContent>
              </Card>

              {/* Alternative Versions */}
              {response.alternatives && response.alternatives.length > 0 && (
                <Card className="bg-lime-900/20 border-lime-500/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-white mb-3">Alternative Versions</h4>
                    <Tabs defaultValue="0" className="w-full">
                      <TabsList className="bg-zinc-800 border-zinc-700">
                        {response.alternatives.map((_: string, idx: number) => (
                          <TabsTrigger
                            key={idx}
                            value={idx.toString()}
                            className="data-[state=active]:bg-lime-500/20 data-[state=active]:text-lime-400"
                          >
                            Version {idx + 2}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      {response.alternatives.map((alt: string, idx: number) => (
                        <TabsContent key={idx} value={idx.toString()}>
                          <div className="bg-zinc-800/30 p-3 rounded-lg text-sm text-zinc-300 mt-2">
                            {alt}
                            <Button
                              variant="dark-ghost"
                              size="sm"
                              onClick={() => copyToClipboard(alt)}
                              className="mt-2"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
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
              <div className="p-6 rounded-full bg-lime-500/10 mb-4">
                <FilePlus className="h-12 w-12 text-lime-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Ready to Create</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Select a document type and provide details to generate professional content instantly
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIDocumentGeneratorPremium;
