import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Download, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISignatureGeneratorProps {
  onSignatureGenerated: (signatureUrl: string) => void;
  defaultName?: string;
}

const SIGNATURE_STYLES = [
  { id: "elegant", label: "Elegant Script", description: "Flowing, sophisticated cursive" },
  { id: "bold", label: "Bold Executive", description: "Strong, confident strokes" },
  { id: "minimal", label: "Minimal Modern", description: "Clean, simple lines" },
  { id: "classic", label: "Classic Formal", description: "Traditional business style" },
];

export default function AISignatureGenerator({ 
  onSignatureGenerated, 
  defaultName = "" 
}: AISignatureGeneratorProps) {
  const [name, setName] = useState(defaultName);
  const [selectedStyle, setSelectedStyle] = useState("elegant");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSignature, setGeneratedSignature] = useState<string | null>(null);
  const [variants, setVariants] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);

  const generateSignature = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name to generate signature");
      return;
    }

    setIsGenerating(true);
    setGeneratedSignature(null);
    setVariants([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-signature-generator', {
        body: { 
          name: name.trim(), 
          style: selectedStyle,
          generateVariants: true
        },
      });

      if (error) throw error;

      if (data?.signatures && data.signatures.length > 0) {
        setVariants(data.signatures);
        setGeneratedSignature(data.signatures[0]);
        setSelectedVariant(0);
        toast.success("Signature generated successfully!");
      } else if (data?.signature) {
        setGeneratedSignature(data.signature);
        setVariants([data.signature]);
        toast.success("Signature generated successfully!");
      } else {
        throw new Error("No signature returned from AI");
      }
    } catch (error) {
      console.error('Signature generation error:', error);
      toast.error("Failed to generate signature. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const selectVariant = (index: number) => {
    setSelectedVariant(index);
    setGeneratedSignature(variants[index]);
  };

  const applySignature = () => {
    if (generatedSignature) {
      onSignatureGenerated(generatedSignature);
      toast.success("Signature applied successfully!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Name Input */}
      <div className="space-y-2">
        <Label htmlFor="signature-name" className="text-foreground font-medium">
          Your Name
        </Label>
        <Input
          id="signature-name"
          placeholder="Enter your full name (e.g., Jane Bou Jaoude)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="text-lg"
        />
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <Label className="text-foreground font-medium">Signature Style</Label>
        <div className="grid grid-cols-2 gap-3">
          {SIGNATURE_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                selectedStyle === style.id
                  ? "border-[#B89555] bg-[#EFE6D6]/10"
                  : "border-border hover:border-[#B89555]/50 bg-card"
              }`}
            >
              <p className="font-semibold text-foreground">{style.label}</p>
              <p className="text-sm text-muted-foreground">{style.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <Button
        onClick={generateSignature}
        disabled={isGenerating || !name.trim()}
        className="w-full bg-gradient-to-r from-gold via-gold to-gold/80 text-primary-foreground hover:from-gold/90 hover:to-gold/70"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating Signature...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate AI Signature
          </>
        )}
      </Button>

      {/* Generated Signature Preview */}
      {generatedSignature && (
        <Card className="border-2 border-[#B89555]/40 bg-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-medium">Generated Signature</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateSignature}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
            </div>

            {/* Main Signature Preview */}
            <div className="p-8 bg-gradient-to-br from-muted/50 to-background rounded-xl border border-border flex items-center justify-center min-h-[120px]">
              <img
                src={generatedSignature}
                alt="Generated Signature"
                className="max-h-24 max-w-full object-contain"
               loading="lazy" decoding="async" />
            </div>

            {/* Variants */}
            {variants.length > 1 && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Choose a variant:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {variants.map((variant, index) => (
                    <button
                      key={index}
                      onClick={() => selectVariant(index)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedVariant === index
                          ? "border-[#B89555] bg-[#EFE6D6]/5"
                          : "border-border hover:border-[#B89555]/50"
                      }`}
                    >
                      <img
                        src={variant}
                        alt={`Variant ${index + 1}`}
                        className="max-h-12 w-full object-contain"
                       loading="lazy" decoding="async" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button */}
            <Button
              onClick={applySignature}
              className="w-full"
              variant="primary"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Apply This Signature
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
