import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, RefreshCw, Check, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SignatureDesignerProps {
  onSelectSignature: (signatureUrl: string) => void;
  onSaveSignature?: (signatureUrl: string) => void;
}

// Pre-designed signature styles (CSS-based for demo, would be AI-generated in production)
const SIGNATURE_STYLES = [
  { id: 1, fontFamily: "'Dancing Script', cursive", style: "elegant" },
  { id: 2, fontFamily: "'Great Vibes', cursive", style: "classic" },
  { id: 3, fontFamily: "'Pacifico', cursive", style: "modern" },
  { id: 4, fontFamily: "'Allura', cursive", style: "artistic" },
  { id: 5, fontFamily: "'Alex Brush', cursive", style: "flowing" },
  { id: 6, fontFamily: "'Sacramento', cursive", style: "casual" },
  { id: 7, fontFamily: "'Tangerine', cursive", style: "refined" },
  { id: 8, fontFamily: "'Satisfy', cursive", style: "bold" },
  { id: 9, fontFamily: "'Kaushan Script', cursive", style: "dynamic" },
  { id: 10, fontFamily: "'Lobster', cursive", style: "playful" },
];

export default function SignatureDesigner({ onSelectSignature, onSaveSignature }: SignatureDesignerProps) {
  const [name, setName] = useState("");
  const [signatures, setSignatures] = useState<Array<{ id: number; style: string; fontFamily: string }>>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateSignatures = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name first");
      return;
    }

    setIsGenerating(true);
    setSelectedId(null);

    // Simulate AI generation with shuffled styles
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const shuffled = [...SIGNATURE_STYLES].sort(() => Math.random() - 0.5);
    setSignatures(shuffled);
    setIsGenerating(false);
    
    toast.success("10 signature designs generated!");
  };

  const regenerateSignatures = async () => {
    setIsGenerating(true);
    setSelectedId(null);

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const shuffled = [...SIGNATURE_STYLES].sort(() => Math.random() - 0.5);
    setSignatures(shuffled);
    setIsGenerating(false);
    
    toast.success("New designs generated!");
  };

  const handleSelectSignature = (sig: typeof signatures[0]) => {
    setSelectedId(sig.id);
    // In production, this would generate an actual image
    // For now, we'll create a canvas-based signature
    createSignatureImage(name, sig.fontFamily).then(dataUrl => {
      if (dataUrl) {
        onSelectSignature(dataUrl);
      }
    });
  };

  const createSignatureImage = async (text: string, fontFamily: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#1a1a1a';
      ctx.font = `48px ${fontFamily.replace(/'/g, '')}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);

      resolve(canvas.toDataURL('image/png'));
    });
  };

  const handleSaveSignature = async () => {
    if (!selectedId || !onSaveSignature) return;
    
    setIsSaving(true);
    const sig = signatures.find(s => s.id === selectedId);
    if (sig) {
      const dataUrl = await createSignatureImage(name, sig.fontFamily);
      if (dataUrl) {
        onSaveSignature(dataUrl);
        toast.success("Signature saved for future use!");
      }
    }
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          AI Signature Designer
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Create Your Personal Signature</h3>
        <p className="text-muted-foreground text-sm">
          This is for personal documents only. Official contracts require your ID signature.
        </p>
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <Label htmlFor="sig-name">Enter Your Full Name</Label>
        <div className="flex gap-3">
          <Input
            id="sig-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., John Smith"
            className="flex-1"
          />
          <Button
            onClick={generateSignatures}
            disabled={isGenerating || !name.trim()}
            className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A]"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Signature Grid */}
      {signatures.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">Choose Your Design</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={regenerateSignatures}
              disabled={isGenerating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate All
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {signatures.map((sig) => (
              <Card
                key={sig.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedId === sig.id
                    ? 'ring-2 ring-gold border-[#B89555]'
                    : 'hover:border-[#B89555]/30'
                }`}
                onClick={() => handleSelectSignature(sig)}
              >
                <CardContent className="p-4 text-center relative">
                  {selectedId === sig.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-[#EFE6D6] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div 
                    className="text-3xl py-4 text-[#1A1A1A]"
                    style={{ fontFamily: sig.fontFamily }}
                  >
                    {name}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{sig.style}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Save Button */}
          {selectedId && onSaveSignature && (
            <Button
              onClick={handleSaveSignature}
              disabled={isSaving}
              className="w-full bg-[#1A1A1A] hover:bg-[#1A1A1A] text-white"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save This Signature for Future Use
            </Button>
          )}
        </div>
      )}

      {/* Load Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script&family=Great+Vibes&family=Pacifico&family=Allura&family=Alex+Brush&family=Sacramento&family=Tangerine&family=Satisfy&family=Kaushan+Script&family=Lobster&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
