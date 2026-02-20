import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ImageIcon, Sparkles, RefreshCw, Download,
  ChevronRight, LayoutGrid, Loader2, Bookmark, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";

// ─── Constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { id: "real-estate", label: "Real Estate", emoji: "🏢", dna: "Trustworthy, premium, architectural" },
  { id: "technology", label: "Technology", emoji: "💻", dna: "Innovative, clean, forward-thinking" },
  { id: "fashion", label: "Fashion & Lifestyle", emoji: "👗", dna: "Elegant, trendy, aspirational" },
  { id: "healthcare", label: "Healthcare", emoji: "🏥", dna: "Caring, clean, professional" },
  { id: "finance", label: "Finance & Banking", emoji: "💰", dna: "Secure, premium, authoritative" },
  { id: "personal", label: "Personal Brand", emoji: "👤", dna: "Authentic, unique, memorable" },
  { id: "law", label: "Law & Legal", emoji: "⚖️", dna: "Authoritative, classic, serious" },
  { id: "creative", label: "Creative Agency", emoji: "🎨", dna: "Bold, expressive, artistic" },
  { id: "restaurant", label: "Restaurant & Food", emoji: "🍽️", dna: "Warm, inviting, flavorful" },
];

const STYLES = [
  { id: "modern", label: "Modern", desc: "Clean lines, geometric" },
  { id: "minimalist", label: "Minimalist", desc: "Simple, negative space" },
  { id: "bold", label: "Bold", desc: "Strong, impactful" },
  { id: "vintage", label: "Vintage", desc: "Classic, timeless" },
  { id: "luxury", label: "Luxury", desc: "Premium, sophisticated" },
  { id: "playful", label: "Playful", desc: "Fun, energetic" },
];

const COLOR_PRESETS = [
  { primary: "#C8A766", secondary: "#1a1a1a", accent: "#ffffff", label: "Gold & Black" },
  { primary: "#1e3a8a", secondary: "#ffffff", accent: "#93c5fd", label: "Navy Blue" },
  { primary: "#111827", secondary: "#ffffff", accent: "#6b7280", label: "Obsidian" },
  { primary: "#7c3aed", secondary: "#ffffff", accent: "#ddd6fe", label: "Violet" },
  { primary: "#0f766e", secondary: "#ffffff", accent: "#99f6e4", label: "Teal" },
  { primary: "#be123c", secondary: "#ffffff", accent: "#fecdd3", label: "Crimson" },
  { primary: "#065f46", secondary: "#ffffff", accent: "#6ee7b7", label: "Forest" },
  { primary: "#334155", secondary: "#f8fafc", accent: "#94a3b8", label: "Slate" },
];

const FONTS = [
  { value: "Georgia, serif", label: "Serif", desc: "Classic, premium" },
  { value: "Arial, sans-serif", label: "Sans-serif", desc: "Modern, clean" },
  { value: "Courier New, monospace", label: "Monospace", desc: "Tech, coding" },
  { value: "Palatino, serif", label: "Script", desc: "Creative, fashion" },
];

// ─── Types ─────────────────────────────────────────────────────────────────────
interface LogoData {
  svgContent: string;
  name: string;
  timestamp: number;
}

// ─── SVG Logo Renderer ────────────────────────────────────────────────────────
function LogoPreview({ svgContent, size = 200 }: { svgContent: string; size?: number }) {
  if (!svgContent) return null;
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center overflow-hidden"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

// ─── Placeholder SVG ──────────────────────────────────────────────────────────
function placeholderSVG(name: string, primary: string, secondary: string): string {
  const initial = name ? name.charAt(0).toUpperCase() : "L";
  const words = name ? name.split(/\s+/).map(w => w.charAt(0).toUpperCase()).slice(0, 3).join("") : "LOG";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${primary}bb;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="90" fill="url(#g1)"/>
  <circle cx="100" cy="100" r="80" fill="none" stroke="${secondary}40" stroke-width="1.5"/>
  <text x="100" y="95" font-family="Georgia, serif" font-size="52" font-weight="700" fill="${secondary}" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  <text x="100" y="150" font-family="Arial, sans-serif" font-size="13" font-weight="600" fill="${secondary}" text-anchor="middle" letter-spacing="3" opacity="0.7">${words}</text>
</svg>`;
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LogoCreator() {
  const navigate = useNavigate();

  // Inputs
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("real-estate");
  const [style, setStyle] = useState("modern");
  const [colorPreset, setColorPreset] = useState(0);
  const [font, setFont] = useState("Georgia, serif");
  const [customColors, setCustomColors] = useState({ primary: "", secondary: "", accent: "" });

  // State
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [logoHistory, setLogoHistory] = useState<LogoData[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [seed, setSeed] = useState(0);

  const preset = COLOR_PRESETS[colorPreset];
  const colors = {
    primary: customColors.primary || preset.primary,
    secondary: customColors.secondary || preset.secondary,
    accent: customColors.accent || preset.accent,
  };

  const generate = useCallback(async (currentSeed?: number) => {
    if (!name.trim()) { toast.error("Please enter a company or personal name"); return; }
    setGenerating(true);
    const useSeed = currentSeed !== undefined ? currentSeed : seed;
    try {
      const { data, error } = await supabase.functions.invoke("ai-logo-generator", {
        body: { name, industry, style, font, colors, description, seed: useSeed },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const svgContent: string = data?.svgContent || "";
      const newLogo: LogoData = {
        svgContent: svgContent || placeholderSVG(name, colors.primary, colors.secondary),
        name,
        timestamp: Date.now(),
      };

      setLogo(newLogo);
      setLogoHistory(prev => [newLogo, ...prev].slice(0, 3));

      if (svgContent) {
        toast.success("Logo generated!");
      } else {
        toast.success("Logo created with default design");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  }, [name, description, industry, style, font, colors, seed]);

  const regenerate = () => {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    generate(nextSeed);
  };

  const downloadSVG = () => {
    if (!logo) return;
    const blob = new Blob([logo.svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${name || "logo"}-logo.svg`; a.click();
    URL.revokeObjectURL(url);
    toast.success("SVG downloaded");
  };

  const downloadPNG = () => {
    if (!logo) return;
    const svgBlob = new Blob([logo.svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512; canvas.height = 512;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 512, 512);
      canvas.toBlob(blob => {
        if (!blob) return;
        const pngUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl; a.download = `${name || "logo"}-logo.png`; a.click();
        URL.revokeObjectURL(pngUrl);
        toast.success("PNG downloaded (512×512)");
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleSaveToAssets = async () => {
    if (!logo) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in to save assets"); return; }

      const svgBase64 = btoa(unescape(encodeURIComponent(logo.svgContent)));
      const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

      const { error } = await supabase.from("design_assets").insert({
        user_id: session.user.id,
        asset_type: "logo",
        name: `${name} Logo`,
        file_url: dataUri,
      });

      if (error) throw error;
      toast.success("Saved to Brand Assets! It will appear in the Brand Asset Library.");
    } catch {
      toast.error("Could not save — please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--pearl-1,48 30% 97%))" }}>
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/toolkit/corporate-suite")} className="gap-1.5">
              <ArrowLeft size={15} /> Back
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]" />
            <div className="flex items-center gap-2">
              <LayoutGrid size={11} className="text-[hsl(var(--muted-foreground))]" />
              <ChevronRight size={10} className="text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Corporate Suite</span>
              <ChevronRight size={10} className="text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Logo Creator</span>
            </div>
          </div>
          <div className="flex gap-2">
            {logo && (
              <>
                <Button variant="outline" size="sm" onClick={downloadSVG} className="gap-1.5 text-xs">
                  <Download size={13} /> SVG
                </Button>
                <Button variant="outline" size="sm" onClick={downloadPNG} className="gap-1.5 text-xs">
                  <Download size={13} /> PNG
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
        {/* ── Left: Controls ── */}
        <div className="space-y-5">
          {/* Brand Identity */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
            <h2 className="font-bold text-[hsl(var(--foreground))] flex items-center gap-2">
              <ImageIcon size={16} className="text-orange-500" /> Brand Identity
            </h2>
            <div className="space-y-1.5">
              <Label className="text-xs">Company / Name *</Label>
              <div className="flex gap-2">
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. JBJ Global Real Estate"
                  className="flex-1 text-sm"
                />
                <VoiceInputButton onTranscript={setName} size="icon" className="shrink-0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description / Tagline (optional)</Label>
              <div className="flex gap-2 items-start">
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Premium UAE property consultancy with 10+ years experience..."
                  rows={2}
                  className="flex-1 text-sm resize-none"
                />
                <VoiceInputButton onTranscript={t => setDescription(prev => prev ? prev + " " + t : t)} size="icon" className="shrink-0 mt-0.5" />
              </div>
            </div>
          </div>

          {/* Industry */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Industry / Tone</h3>
            <div className="grid grid-cols-3 gap-2">
              {INDUSTRIES.map(ind => (
                <button
                  key={ind.id}
                  onClick={() => setIndustry(ind.id)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${industry === ind.id ? "border-orange-400 bg-orange-50" : "border-[hsl(var(--border))] hover:border-orange-300"}`}
                >
                  <div className="text-xl mb-1">{ind.emoji}</div>
                  <p className="text-[9px] font-semibold text-[hsl(var(--foreground))] leading-tight">{ind.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Visual Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${style === s.id ? "border-orange-400 bg-orange-50" : "border-[hsl(var(--border))] hover:border-orange-300"}`}
                >
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{s.label}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
              <Type size={14} className="text-orange-500" /> Typography
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFont(f.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${font === f.value ? "border-orange-400 bg-orange-50" : "border-[hsl(var(--border))] hover:border-orange-300"}`}
                >
                  <p className="text-xs font-semibold text-[hsl(var(--foreground))]" style={{ fontFamily: f.value }}>{f.label}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Color Palette</h3>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_PRESETS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => { setColorPreset(i); setCustomColors({ primary: "", secondary: "", accent: "" }); }}
                  className={`p-2 rounded-xl border-2 transition-all ${colorPreset === i && !customColors.primary ? "border-orange-400 bg-orange-50" : "border-[hsl(var(--border))] hover:border-orange-300"}`}
                >
                  <div className="flex gap-0.5 justify-center mb-1.5">
                    <div className="w-4 h-4 rounded-full border border-white/60 shadow-sm" style={{ background: c.primary }} />
                    <div className="w-4 h-4 rounded-full border border-[hsl(var(--border))] shadow-sm" style={{ background: c.secondary }} />
                    <div className="w-4 h-4 rounded-full border border-white/60 shadow-sm" style={{ background: c.accent }} />
                  </div>
                  <p className="text-[8px] text-center text-[hsl(var(--muted-foreground))] leading-tight">{c.label}</p>
                </button>
              ))}
            </div>

            {/* Custom color wheels */}
            <div className="pt-2 border-t border-[hsl(var(--border))]">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">Custom Colors</p>
              <div className="grid grid-cols-3 gap-2">
                {(["primary", "secondary", "accent"] as const).map(key => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <div className="relative w-8 h-8 rounded-full border-2 border-[hsl(var(--border))] overflow-hidden cursor-pointer"
                      style={{ background: customColors[key] || colors[key] }}>
                      <input
                        type="color"
                        value={customColors[key] || colors[key]}
                        onChange={e => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <p className="text-[9px] text-[hsl(var(--muted-foreground))] capitalize">{key}</p>
                  </div>
                ))}
              </div>
              {(customColors.primary || customColors.secondary || customColors.accent) && (
                <button
                  onClick={() => setCustomColors({ primary: "", secondary: "", accent: "" })}
                  className="text-[10px] text-orange-500 hover:underline mt-1"
                >
                  Reset to preset
                </button>
              )}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={() => generate()}
            disabled={generating || !name.trim()}
            className="w-full h-12 text-sm font-bold gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white shadow-lg"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? "Generating Logo..." : "Generate Logo"}
          </Button>
        </div>

        {/* ── Right: Preview ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[hsl(var(--foreground))]">Logo Preview</h2>
              {logo && (
                <Button variant="outline" size="sm" onClick={regenerate} disabled={generating} className="gap-1.5 text-xs">
                  <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
                  Regenerate
                </Button>
              )}
            </div>

            {generating ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <Loader2 size={28} className="text-orange-500 animate-spin" />
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">AI is designing your logo...</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] opacity-60">This usually takes 10–20 seconds</p>
              </div>
            ) : logo ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={logo.timestamp}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-8"
                >
                  {/* Large preview */}
                  <div className="rounded-2xl border-2 border-[hsl(var(--border))] bg-[hsl(var(--pearl-1,48_30%_97%))] p-8 flex items-center justify-center shadow-inner">
                    <LogoPreview svgContent={logo.svgContent} size={240} />
                  </div>

                  {/* Size variants */}
                  <div className="w-full">
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Size Variants</p>
                    <div className="flex items-end gap-6 flex-wrap">
                      {[{ label: "Icon (32)", size: 32 }, { label: "Small (64)", size: 64 }, { label: "Medium (128)", size: 128 }].map(v => (
                        <div key={v.size} className="flex flex-col items-center gap-2">
                          <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-2 flex items-center justify-center shadow-sm" style={{ width: v.size + 16, height: v.size + 16 }}>
                            <LogoPreview svgContent={logo.svgContent} size={v.size} />
                          </div>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{v.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Background variants */}
                  <div className="w-full">
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">Background Variants</p>
                    <div className="flex gap-3">
                      {["white", "#111", colors.primary].map((bg, i) => (
                        <div key={i} className="flex-1 rounded-xl p-4 flex items-center justify-center border border-[hsl(var(--border))]" style={{ background: bg }}>
                          <LogoPreview svgContent={logo.svgContent} size={80} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export buttons */}
                  <div className="flex gap-3 w-full flex-wrap">
                    <Button onClick={downloadSVG} variant="outline" className="flex-1 gap-2 min-w-[130px]">
                      <Download size={15} /> Download SVG
                    </Button>
                    <Button onClick={downloadPNG} className="flex-1 gap-2 min-w-[130px] bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90">
                      <Download size={15} /> Download PNG (512px)
                    </Button>
                    <Button
                      onClick={handleSaveToAssets}
                      disabled={saving}
                      variant="outline"
                      className="flex-1 gap-2 min-w-[130px] border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={15} />}
                      Save to Brand Assets
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-full bg-orange-50 border-2 border-dashed border-orange-200 flex items-center justify-center">
                  <ImageIcon size={32} className="text-orange-300" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-[hsl(var(--foreground))]">Ready to generate</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Fill in your brand details and click Generate Logo</p>
                </div>
              </div>
            )}
          </div>

          {/* Variations history strip */}
          {logoHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">
                Recent Variations ({logoHistory.length})
              </p>
              <div className="flex gap-3">
                {logoHistory.map((h, i) => (
                  <button
                    key={h.timestamp}
                    onClick={() => setLogo(h)}
                    className={`relative flex-1 rounded-xl border-2 p-2 transition-all hover:border-orange-400 ${logo?.timestamp === h.timestamp ? "border-orange-400 bg-orange-50" : "border-[hsl(var(--border))]"}`}
                    title={`Variation ${logoHistory.length - i}`}
                  >
                    <div className="flex items-center justify-center" style={{ height: 72 }}>
                      <LogoPreview svgContent={h.svgContent} size={64} />
                    </div>
                    {logo?.timestamp === h.timestamp && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">✓</span>
                      </div>
                    )}
                    <p className="text-[9px] text-center text-[hsl(var(--muted-foreground))] mt-1">V{logoHistory.length - i}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
