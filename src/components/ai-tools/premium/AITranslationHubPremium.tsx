import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Languages, Loader2, Copy, Check, Sparkles, ArrowLeftRight,
  Globe, MessageSquare, FileText, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "Arabic", flag: "🇦🇪" },
  { code: "zh", name: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "fa", name: "Farsi (Persian)", flag: "🇮🇷" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
];

const RTL_LANGUAGES = ["ar", "fa", "ur"];

const AITranslationHubPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [text, setText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("ar");
  const [context, setContext] = useState("real-estate");
  const [copied, setCopied] = useState<"source" | "target" | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("Please enter text to translate");
      return;
    }

    const result = await invokeTool("ai-translation-hub", {
      text,
      sourceLanguage,
      targetLanguage,
      context,
    });

    if (result.success) {
      toast.success("Translation complete!");
    }
  };

  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    if (response?.translation) {
      setText(response.translation);
    }
  };

  const copyToClipboard = (type: "source" | "target") => {
    const textToCopy = type === "source" ? text : response?.translation;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(type);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const getLanguageInfo = (code: string) => LANGUAGES.find((l) => l.code === code);
  const isRTL = (code: string) => RTL_LANGUAGES.includes(code);

  return (
    <AIToolPremiumLayout
      title="AI Translation Hub"
      subtitle="Professional real estate translations with cultural context and industry terminology for global clients"
      icon={<Languages className="h-8 w-8 text-amber-400" />}
      accentColor="amber"
      gradientFrom="amber"
      badge="15+ Languages"
    >
      <AIToolGuide
        description="Instantly translate property listings, client communications, and marketing materials with real estate-specific terminology. Perfect for Dubai's international market."
        steps={[
          "Select source and target languages",
          "Choose the context (real estate, legal, marketing)",
          "Paste your text and click Translate",
          "Copy the translated text with one click"
        ]}
        benefits={[
          "Industry-specific terminology",
          "Cultural context awareness",
          "Support for 15+ languages",
          "RTL language support (Arabic, Farsi, Urdu)"
        ]}
        accentColor="amber"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Side */}
        <div className="space-y-4">
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getLanguageInfo(sourceLanguage)?.flag}</span>
                  <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                    <SelectTriggerDark className="w-[180px] border-amber-500/30 hover:border-amber-500/50">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-amber-500/30">
                      {LANGUAGES.map((lang) => (
                        <SelectItemDark key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItemDark>
                      ))}
                    </SelectContentDark>
                  </Select>
                </div>
                <Button
                  variant="dark-ghost"
                  size="sm"
                  onClick={() => copyToClipboard("source")}
                  disabled={!text}
                >
                  {copied === "source" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Textarea
                placeholder="Enter text to translate..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className={`bg-zinc-900/50 border-amber-500/30 text-white min-h-[200px] hover:border-amber-500/50 focus:border-amber-400 transition-colors ${
                  isRTL(sourceLanguage) ? "text-right" : ""
                }`}
                dir={isRTL(sourceLanguage) ? "rtl" : "ltr"}
              />
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-zinc-500">{text.length} characters</span>
              </div>
            </CardContent>
          </Card>

          {/* Context Selector */}
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="p-4">
              <Label className="text-zinc-300 flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4 text-amber-400" />
                Context
              </Label>
              <Select value={context} onValueChange={setContext}>
                <SelectTriggerDark className="border-amber-500/30 hover:border-amber-500/50">
                  <SelectValue />
                </SelectTriggerDark>
                <SelectContentDark className="border-amber-500/30">
                  <SelectItemDark value="real-estate">Real Estate</SelectItemDark>
                  <SelectItemDark value="legal">Legal / Contracts</SelectItemDark>
                  <SelectItemDark value="marketing">Marketing</SelectItemDark>
                  <SelectItemDark value="formal">Formal / Business</SelectItemDark>
                  <SelectItemDark value="casual">Casual / Conversational</SelectItemDark>
                </SelectContentDark>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Swap Button (Center) */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 z-10">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={swapLanguages}
            className="p-3 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Mobile Swap Button */}
        <div className="flex lg:hidden justify-center -my-2">
          <Button
            variant="dark-ghost"
            size="sm"
            onClick={swapLanguages}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2 text-amber-400" />
            <span className="text-amber-400">Swap Languages</span>
          </Button>
        </div>

        {/* Target Side */}
        <div className="space-y-4">
          <Card className="bg-amber-900/20 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getLanguageInfo(targetLanguage)?.flag}</span>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTriggerDark className="w-[180px] border-amber-500/30 hover:border-amber-500/50">
                      <SelectValue />
                    </SelectTriggerDark>
                    <SelectContentDark className="border-amber-500/30">
                      {LANGUAGES.map((lang) => (
                        <SelectItemDark key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItemDark>
                      ))}
                    </SelectContentDark>
                  </Select>
                </div>
                <Button
                  variant="dark-ghost"
                  size="sm"
                  onClick={() => copyToClipboard("target")}
                  disabled={!response?.translation}
                >
                  {copied === "target" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              
              <AnimatePresence mode="wait">
                {response?.translation ? (
                  <motion.div
                    key="translation"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`bg-zinc-800 border border-zinc-700 rounded-md p-4 min-h-[200px] text-white ${
                      isRTL(targetLanguage) ? "text-right" : ""
                    }`}
                    dir={isRTL(targetLanguage) ? "rtl" : "ltr"}
                  >
                    {response.translation}
                  </motion.div>
                ) : (
                  <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-md p-4 min-h-[200px] flex items-center justify-center">
                    <div className="text-center text-zinc-500">
                      <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Translation will appear here</p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Translation Notes */}
          {response?.notes && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-400 mb-1">Translation Notes</p>
                      <p className="text-sm text-zinc-300">{response.notes}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>

      {/* Translate Button */}
      <div className="mt-6">
        <Button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold py-6"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Translate
            </>
          )}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mt-6">
        {[
          { icon: Globe, label: "15+ Languages" },
          { icon: FileText, label: "RE Terminology" },
          { icon: MessageSquare, label: "Context Aware" },
          { icon: Languages, label: "RTL Support" },
        ].map(({ icon: Icon, label }) => (
          <Card key={label} className="bg-amber-900/20 border-amber-500/30 p-3 text-center">
            <Icon className="h-5 w-5 mx-auto mb-1 text-amber-400" />
            <p className="text-xs text-zinc-400">{label}</p>
          </Card>
        ))}
      </div>
    </AIToolPremiumLayout>
  );
};

export default AITranslationHubPremium;
