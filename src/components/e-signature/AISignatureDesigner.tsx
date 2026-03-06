import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Wand2,
  Save,
  RefreshCw,
  Trash2,
  Check,
  Loader2,
  PenTool,
  Type,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ESignaturePad from "./ESignaturePad";

interface SavedSignature {
  id: string;
  name: string;
  data_url: string;
  type: "drawn" | "generated";
  created_at: string;
}

const SIGNATURE_FONTS = [
  { name: "Elegant Script", family: "'Dancing Script', cursive", weight: "400" },
  { name: "Classic Serif", family: "'Playfair Display', serif", weight: "700" },
  { name: "Modern Sans", family: "'Montserrat', sans-serif", weight: "600" },
  { name: "Handwritten", family: "'Caveat', cursive", weight: "700" },
  { name: "Formal", family: "'Cormorant Garamond', serif", weight: "600" },
];

const SIGNATURE_COLORS = [
  { name: "Black", value: "#1a1a1a" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Dark Blue", value: "#0d47a1" },
  { name: "Burgundy", value: "#6b1d1d" },
  { name: "Forest", value: "#1b5e20" },
];

export default function AISignatureDesigner() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fullName, setFullName] = useState("");
  const [selectedFont, setSelectedFont] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [generatedSignatures, setGeneratedSignatures] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [activeTab, setActiveTab] = useState<"draw" | "generate">("generate");
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [selectedGenerated, setSelectedGenerated] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved signatures
  useEffect(() => {
    if (!user?.id) return;
    loadSavedSignatures();
  }, [user?.id]);

  const loadSavedSignatures = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("ai_tool_projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("tool_type", "signature_designer")
      .order("created_at", { ascending: false });

    if (data) {
      setSavedSignatures(
        data.map((d: any) => ({
          id: d.id,
          name: d.project_name,
          data_url: (d.project_data as any)?.data_url || "",
          type: (d.project_data as any)?.type || "generated",
          created_at: d.created_at,
        }))
      );
    }
  };

  // Load Google Fonts for signature rendering
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Playfair+Display:wght@700&family=Montserrat:wght@600&family=Caveat:wght@700&family=Cormorant+Garamond:wght@600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const generateSignature = useCallback(
    (name: string, fontIndex: number, colorIndex: number): string => {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const font = SIGNATURE_FONTS[fontIndex];
      const color = SIGNATURE_COLORS[colorIndex];

      ctx.fillStyle = color.value;
      ctx.font = `${font.weight} 42px ${font.family}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add slight rotation for natural feel
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-0.02 + Math.random() * 0.04);
      ctx.fillText(name, 0, 0);
      ctx.restore();

      // Add underline flourish
      ctx.beginPath();
      ctx.strokeStyle = color.value;
      ctx.lineWidth = 1.5;
      const textMetrics = ctx.measureText(name);
      const startX = (canvas.width - textMetrics.width) / 2 - 10;
      const endX = (canvas.width + textMetrics.width) / 2 + 20;
      const baseY = canvas.height / 2 + 28;
      ctx.moveTo(startX, baseY);
      ctx.quadraticCurveTo(
        (startX + endX) / 2,
        baseY + 8 + Math.random() * 4,
        endX,
        baseY - 2
      );
      ctx.stroke();

      return canvas.toDataURL("image/png");
    },
    []
  );

  const handleGenerate = useCallback(() => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setIsGenerating(true);
    setSelectedGenerated(null);

    // Generate multiple signature variations
    setTimeout(() => {
      const signatures: string[] = [];
      for (let i = 0; i < SIGNATURE_FONTS.length; i++) {
        signatures.push(generateSignature(fullName, i, selectedColor));
      }
      setGeneratedSignatures(signatures);
      setIsGenerating(false);
      toast.success(`Generated ${signatures.length} signature styles`);
    }, 500);
  }, [fullName, selectedColor, generateSignature]);

  const handleRegenerate = () => {
    setSelectedColor((prev) => (prev + 1) % SIGNATURE_COLORS.length);
    handleGenerate();
  };

  const handleSave = async (dataUrl: string, type: "drawn" | "generated") => {
    if (!user?.id) {
      toast.error("Please sign in to save signatures");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase.from("ai_tool_projects").insert({
        user_id: user.id,
        tool_type: "signature_designer",
        project_name: fullName || "My Signature",
        project_data: { data_url: dataUrl, type, name: fullName },
      });

      if (error) throw error;
      toast.success("Signature saved successfully");
      loadSavedSignatures();
    } catch {
      toast.error("Failed to save signature");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    const { error } = await supabase
      .from("ai_tool_projects")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Signature deleted");
      setSavedSignatures((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Toggle */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit">
        <Button
          variant={activeTab === "generate" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("generate")}
          className={activeTab === "generate" ? "bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white" : ""}
        >
          <Wand2 className="w-4 h-4 mr-2" />
          AI Generate
        </Button>
        <Button
          variant={activeTab === "draw" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("draw")}
          className={activeTab === "draw" ? "bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white" : ""}
        >
          <PenTool className="w-4 h-4 mr-2" />
          Draw
        </Button>
      </div>

      {activeTab === "generate" && (
        <div className="space-y-5">
          {/* Name Input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Full Name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name for signature"
              className="bg-white/80 border-[hsl(var(--gold)/.2)] focus:border-[hsl(var(--gold))]"
            />
          </div>

          {/* Color Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="w-4 h-4" /> Ink Color
            </Label>
            <div className="flex gap-3">
              {SIGNATURE_COLORS.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(idx)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === idx
                      ? "border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold)/.3)] scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !fullName.trim()}
              className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : "Generate Signatures"}
            </Button>
            {generatedSignatures.length > 0 && (
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>

          {/* Generated Results */}
          {generatedSignatures.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose your signature style</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {generatedSignatures.map((sig, idx) => (
                  <Card
                    key={idx}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedGenerated === idx
                        ? "border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold)/.2)] bg-[hsl(var(--gold)/.05)]"
                        : "border-border hover:border-[hsl(var(--gold)/.4)]"
                    }`}
                    onClick={() => setSelectedGenerated(idx)}
                  >
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <img
                        src={sig}
                        alt={`Style ${idx + 1}`}
                        className="h-16 object-contain"
                      />
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {SIGNATURE_FONTS[idx].name}
                        </Badge>
                        {selectedGenerated === idx && (
                          <Check className="w-4 h-4 text-[hsl(var(--gold))]" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedGenerated !== null && (
                <Button
                  onClick={() => handleSave(generatedSignatures[selectedGenerated], "generated")}
                  disabled={isSaving}
                  className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Selected Signature
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "draw" && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Draw your signature</Label>
          <ESignaturePad
            onSignatureChange={setDrawnSignature}
            height={150}
          />
          {drawnSignature && (
            <Button
              onClick={() => handleSave(drawnSignature, "drawn")}
              disabled={isSaving}
              className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Drawn Signature
            </Button>
          )}
        </div>
      )}

      {/* Saved Signatures */}
      {savedSignatures.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Saved Signatures ({savedSignatures.length})
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {savedSignatures.map((sig) => (
              <Card key={sig.id} className="border border-border">
                <CardContent className="p-3 space-y-2">
                  <div className="bg-white rounded-lg p-3 flex items-center justify-center min-h-[60px]">
                    <img
                      src={sig.data_url}
                      alt={sig.name}
                      className="max-h-14 object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{sig.name}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {sig.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleDeleteSaved(sig.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
