import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Palette,
  Heart,
  Upload,
  Image as ImageIcon,
  Stamp,
  Crop,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ESignaturePad from "./ESignaturePad";

interface SavedSignature {
  id: string;
  name: string;
  data_url: string;
  type: "drawn" | "generated" | "uploaded_signature" | "uploaded_stamp";
  favorite?: boolean;
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
  { name: "Gold Champagne", value: "#C8A766" },
  { name: "Pearl", value: "#F5F0E6" },
  { name: "Dark Gold", value: "#9A7B3C" },
  { name: "Rose Gold", value: "#B76E79" },
  { name: "Platinum", value: "#8E8E8E" },
  { name: "Ink Blue", value: "#1B3A8C" },
  { name: "Deep Brown", value: "#3E2723" },
];

type SignatureStyle = {
  label: string;
  render: (name: string, font: typeof SIGNATURE_FONTS[0], color: string) => string;
};

const getInitials = (name: string): string => {
  return name.split(/\s+/).map(w => w[0]?.toUpperCase() || "").join("");
};

const getInitialsWithDots = (name: string): string => {
  return name.split(/\s+/).map(w => w[0]?.toUpperCase() + ".").join("");
};

const renderTextToCanvas = (
  text: string,
  font: typeof SIGNATURE_FONTS[0],
  color: string,
  fontSize: number = 42,
  rotation: number = -0.02
): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 120;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = color;
  ctx.font = `${font.weight} ${fontSize}px ${font.family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotation + Math.random() * 0.04);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return canvas.toDataURL("image/png");
};

const SIGNATURE_STYLES: SignatureStyle[] = [
  {
    label: "Full Name Cursive",
    render: (name, font, color) => renderTextToCanvas(name, SIGNATURE_FONTS[0], color),
  },
  {
    label: "Full Name Bold",
    render: (name, font, color) => renderTextToCanvas(name, SIGNATURE_FONTS[1], color, 44),
  },
  {
    label: "Initials Only",
    render: (name, font, color) => renderTextToCanvas(getInitials(name), SIGNATURE_FONTS[3], color, 56),
  },
  {
    label: "Initials with Dots",
    render: (name, font, color) => renderTextToCanvas(getInitialsWithDots(name), SIGNATURE_FONTS[4], color, 48),
  },
  {
    label: "First Name Only",
    render: (name, font, color) => renderTextToCanvas(name.split(/\s+/)[0] || name, SIGNATURE_FONTS[0], color, 48),
  },
  {
    label: "Handwritten Full",
    render: (name, font, color) => renderTextToCanvas(name, SIGNATURE_FONTS[3], color, 40),
  },
  {
    label: "Modern Minimal",
    render: (name, font, color) => renderTextToCanvas(name, SIGNATURE_FONTS[2], color, 36),
  },
  {
    label: "Formal Classic",
    render: (name, font, color) => renderTextToCanvas(name, SIGNATURE_FONTS[4], color, 42),
  },
  {
    label: "Monogram",
    render: (name, font, color) => {
      const initials = getInitials(name);
      return renderTextToCanvas(initials, SIGNATURE_FONTS[1], color, 64, 0);
    },
  },
  {
    label: "Compact Script",
    render: (name, font, color) => {
      const short = name.split(/\s+/).map((w, i) => i === 0 ? w : w[0] + ".").join(" ");
      return renderTextToCanvas(short, SIGNATURE_FONTS[0], color, 40);
    },
  },
];

export default function AISignatureDesigner() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [selectedColor, setSelectedColor] = useState(0);
  const [customColor, setCustomColor] = useState("#1a1a1a");
  const [useCustomColor, setUseCustomColor] = useState(false);
  const [generatedSignatures, setGeneratedSignatures] = useState<{ url: string; label: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedSignatures, setSavedSignatures] = useState<SavedSignature[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "draw" | "upload">("generate");
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [selectedGenerated, setSelectedGenerated] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  // Upload states
  const signatureUploadRef = useRef<HTMLInputElement>(null);
  const stampUploadRef = useRef<HTMLInputElement>(null);
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [uploadedStamp, setUploadedStamp] = useState<string | null>(null);

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
          favorite: (d.project_data as any)?.favorite || false,
          created_at: d.created_at,
        }))
      );
    }
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Playfair+Display:wght@700&family=Montserrat:wght@600&family=Caveat:wght@700&family=Cormorant+Garamond:wght@600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  const getActiveColor = () => useCustomColor ? customColor : SIGNATURE_COLORS[selectedColor].value;

  const handleGenerate = useCallback(() => {
    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    setIsGenerating(true);
    setSelectedGenerated(null);
    setFavorites(new Set());

    setTimeout(() => {
      const color = getActiveColor();
      const sigs = SIGNATURE_STYLES.map((style) => ({
        url: style.render(fullName, SIGNATURE_FONTS[0], color),
        label: style.label,
      }));
      setGeneratedSignatures(sigs);
      setIsGenerating(false);
      toast.success(`Generated ${sigs.length} signature styles`);
    }, 500);
  }, [fullName, selectedColor, customColor, useCustomColor]);

  const handleSave = async (dataUrl: string, type: "drawn" | "generated" | "uploaded_signature" | "uploaded_stamp", favorite = false) => {
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
        project_data: { data_url: dataUrl, type, name: fullName, favorite },
      });

      if (error) throw error;
      toast.success("Saved successfully");
      loadSavedSignatures();
    } catch {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFavorite = async (sig: SavedSignature) => {
    const newFav = !sig.favorite;
    const { error } = await supabase
      .from("ai_tool_projects")
      .update({
        project_data: { data_url: sig.data_url, type: sig.type, name: sig.name, favorite: newFav },
      })
      .eq("id", sig.id);

    if (!error) {
      setSavedSignatures((prev) =>
        prev.map((s) => (s.id === sig.id ? { ...s, favorite: newFav } : s))
      );
    }
  };

  const handleDeleteSaved = async (id: string) => {
    const { error } = await supabase.from("ai_tool_projects").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Deleted");
      setSavedSignatures((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "uploaded_signature" | "uploaded_stamp") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (type === "uploaded_signature") {
        setUploadedSignature(dataUrl);
      } else {
        setUploadedStamp(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleLocalFavorite = (index: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const favoriteSaved = savedSignatures.filter((s) => s.favorite);

  return (
    <div className="space-y-6">
      {/* Tab Toggle */}
      <div className="flex gap-2 p-1 bg-muted/50 rounded-xl w-fit flex-wrap">
        {[
          { key: "generate" as const, icon: Wand2, label: "AI Generate" },
          { key: "draw" as const, icon: PenTool, label: "Draw" },
          { key: "upload" as const, icon: Upload, label: "Upload" },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={activeTab === tab.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? "bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white" : ""}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </Button>
        ))}
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
            <div className="flex gap-2 flex-wrap items-center">
              {SIGNATURE_COLORS.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedColor(idx); setUseCustomColor(false); }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${
                    !useCustomColor && selectedColor === idx
                      ? "border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold)/.3)] scale-110"
                      : "border-border hover:scale-105"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              {/* Custom color picker */}
              <div className="relative">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => { setCustomColor(e.target.value); setUseCustomColor(true); }}
                  className="w-7 h-7 rounded-full border-2 border-border cursor-pointer appearance-none bg-transparent"
                  title="Custom Color"
                  style={{ padding: 0 }}
                />
                {useCustomColor && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[hsl(var(--gold))] border border-white" />
                )}
              </div>
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
              {isGenerating ? "Generating..." : "Generate 10 Signatures"}
            </Button>
            {generatedSignatures.length > 0 && (
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
          </div>

          {/* Generated Results - 5 per row */}
          {generatedSignatures.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Choose your signature style ({generatedSignatures.length} styles)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {generatedSignatures.map((sig, idx) => (
                  <Card
                    key={idx}
                    className={`cursor-pointer transition-all border-2 relative ${
                      selectedGenerated === idx
                        ? "border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold)/.2)] bg-[hsl(var(--gold)/.05)]"
                        : "border-border hover:border-[hsl(var(--gold)/.4)]"
                    }`}
                    onClick={() => setSelectedGenerated(idx)}
                  >
                    {/* Favorite heart */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLocalFavorite(idx); }}
                      className="absolute top-1 right-1 z-10 p-1 rounded-full hover:bg-muted/50 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 transition-colors ${
                          favorites.has(idx) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                        }`}
                      />
                    </button>
                    <CardContent className="p-3 flex flex-col items-center gap-1">
                      <img src={sig.url} alt={sig.label} className="h-14 object-contain" />
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px]">{sig.label}</Badge>
                        {selectedGenerated === idx && <Check className="w-3 h-3 text-[hsl(var(--gold))]" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedGenerated !== null && (
                <Button
                  onClick={() => handleSave(generatedSignatures[selectedGenerated].url, "generated", favorites.has(selectedGenerated))}
                  disabled={isSaving}
                  className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
          <ESignaturePad onSignatureChange={setDrawnSignature} height={150} />
          {drawnSignature && (
            <Button
              onClick={() => handleSave(drawnSignature, "drawn")}
              disabled={isSaving}
              className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Drawn Signature
            </Button>
          )}
        </div>
      )}

      {activeTab === "upload" && (
        <div className="space-y-6">
          {/* Upload Signature */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> Upload Signature Image
            </Label>
            <p className="text-xs text-muted-foreground">Upload a photo of your handwritten signature to use digitally.</p>
            <input
              ref={signatureUploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "uploaded_signature")}
            />
            <Button variant="outline" onClick={() => signatureUploadRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Choose Signature Image
            </Button>
            {uploadedSignature && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-[hsl(var(--gold)/.3)] rounded-xl p-4 bg-white flex items-center justify-center">
                  <img src={uploadedSignature} alt="Uploaded signature" className="max-h-24 object-contain" />
                </div>
                <Button
                  onClick={() => handleSave(uploadedSignature, "uploaded_signature")}
                  disabled={isSaving}
                  className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Uploaded Signature
                </Button>
              </div>
            )}
          </div>

          {/* Upload Company Stamp */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Stamp className="w-4 h-4" /> Upload Company Stamp
            </Label>
            <p className="text-xs text-muted-foreground">Upload your company stamp image for use in documents.</p>
            <input
              ref={stampUploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e, "uploaded_stamp")}
            />
            <Button variant="outline" onClick={() => stampUploadRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Choose Stamp Image
            </Button>
            {uploadedStamp && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-[hsl(var(--gold)/.3)] rounded-xl p-4 bg-white flex items-center justify-center">
                  <img src={uploadedStamp} alt="Uploaded stamp" className="max-h-24 object-contain" />
                </div>
                <Button
                  onClick={() => handleSave(uploadedStamp, "uploaded_stamp")}
                  disabled={isSaving}
                  className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/.9)] text-white"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Company Stamp
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Favorites Section */}
      {favoriteSaved.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            Favorites ({favoriteSaved.length})
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {favoriteSaved.map((sig) => (
              <Card key={sig.id} className="border border-[hsl(var(--gold)/.3)]">
                <CardContent className="p-3 space-y-2">
                  <div className="bg-white rounded-lg p-3 flex items-center justify-center min-h-[60px]">
                    <img src={sig.data_url} alt={sig.name} className="max-h-14 object-contain" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{sig.type}</Badge>
                    <button onClick={() => handleToggleFavorite(sig)} className="p-1">
                      <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                    <img src={sig.data_url} alt={sig.name} className="max-h-14 object-contain" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{sig.name}</p>
                      <Badge variant="outline" className="text-[10px]">{sig.type}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleFavorite(sig)}
                        className="p-1 rounded hover:bg-muted/50"
                      >
                        <Heart className={`w-3.5 h-3.5 ${sig.favorite ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleDeleteSaved(sig.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
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
