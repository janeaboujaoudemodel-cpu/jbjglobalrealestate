import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, Loader2, Copy, Check, Sparkles, ArrowRight } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AITranslationHubProps {
  defaultText?: string;
  onResponse?: (response: any) => void;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "ru", name: "Russian" },
  { code: "hi", name: "Hindi" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "fa", name: "Farsi (Persian)" },
  { code: "ur", name: "Urdu" },
  { code: "tr", name: "Turkish" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
];

const AITranslationHub = ({ defaultText = "", onResponse }: AITranslationHubProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [text, setText] = useState(defaultText);
  const [sourceLanguage, setSourceLanguage] = useState("en");
  const [targetLanguage, setTargetLanguage] = useState("ar");
  const [context, setContext] = useState("real-estate");
  const [copied, setCopied] = useState(false);

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

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.translation) {
      navigator.clipboard.writeText(response.translation);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    if (response?.translation) {
      setText(response.translation);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-primary" />
          AI Translation Hub
        </CardTitle>
        <CardDescription>
          Professional real estate translations with cultural context and industry terminology
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 space-y-2">
            <Label>From</Label>
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="icon" className="mt-6" onClick={swapLanguages}>
            <ArrowRight className="h-4 w-4" />
          </Button>

          <div className="flex-1 space-y-2">
            <Label>To</Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Context</Label>
          <Select value={context} onValueChange={setContext}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="real-estate">Real Estate</SelectItem>
              <SelectItem value="legal">Legal / Contracts</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="formal">Formal / Business</SelectItem>
              <SelectItem value="casual">Casual / Conversational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="text">Text to Translate *</Label>
          <Textarea
            id="text"
            placeholder="Enter your text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Translate
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">
                Translation ({LANGUAGES.find((l) => l.code === targetLanguage)?.name})
              </h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div 
              className={`bg-muted p-4 rounded-lg text-lg ${
                targetLanguage === "ar" || targetLanguage === "fa" || targetLanguage === "ur" 
                  ? "text-right" 
                  : ""
              }`}
              dir={targetLanguage === "ar" || targetLanguage === "fa" || targetLanguage === "ur" ? "rtl" : "ltr"}
            >
              {response.translation}
            </div>

            {response.notes && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Translation Notes</h5>
                <p className="text-sm text-muted-foreground">{response.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AITranslationHub;
