import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, Sparkles, RefreshCw, Download,
  Loader2, Bookmark, Type,
  Maximize2, Building2, Cpu, Scale, Palette, UtensilsCrossed,
  User, Briefcase, Heart, Archive,
} from "lucide-react";
import { StudioShell, type StudioSection } from "@/components/ui/StudioShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import JSZip from "jszip";

// ─── Constants ─────────────────────────────────────────────────────────────────
const INDUSTRIES = [
  { id: "real-estate",  label: "Real Estate",      icon: Building2,         dna: "Trustworthy, premium, architectural" },
  { id: "technology",   label: "Technology",        icon: Cpu,               dna: "Innovative, clean, forward-thinking" },
  { id: "fashion",      label: "Fashion & Lifestyle", icon: Palette,         dna: "Elegant, trendy, aspirational" },
  { id: "healthcare",   label: "Healthcare",        icon: Heart,             dna: "Caring, clean, professional" },
  { id: "finance",      label: "Finance & Banking", icon: Briefcase,         dna: "Secure, premium, authoritative" },
  { id: "personal",     label: "Personal Brand",    icon: User,              dna: "Authentic, unique, memorable" },
  { id: "law",          label: "Law & Legal",       icon: Scale,             dna: "Authoritative, classic, serious" },
  { id: "creative",     label: "Creative Agency",   icon: Sparkles,          dna: "Bold, expressive, artistic" },
  { id: "restaurant",   label: "Restaurant & Food", icon: UtensilsCrossed,  dna: "Warm, inviting, flavorful" },
];

const STYLES = [
  { id: "modern",     label: "Modern",     desc: "Clean lines, geometric" },
  { id: "minimalist", label: "Minimalist", desc: "Simple, negative space" },
  { id: "bold",       label: "Bold",       desc: "Strong, impactful" },
  { id: "vintage",    label: "Vintage",    desc: "Classic, timeless" },
  { id: "luxury",     label: "Luxury",     desc: "Premium, sophisticated" },
  { id: "playful",    label: "Playful",    desc: "Fun, energetic" },
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
  { primary: "#b45309", secondary: "#ffffff", accent: "#fde68a", label: "Amber" },
  { primary: "#0369a1", secondary: "#ffffff", accent: "#bae6fd", label: "Sky Blue" },
  { primary: "#7f1d1d", secondary: "#ffffff", accent: "#fca5a5", label: "Deep Red" },
  { primary: "#1c1917", secondary: "#e7e5e4", accent: "#a8a29e", label: "Warm Black" },
];

const FONTS = [
  { value: "Georgia, serif",        label: "Serif",        desc: "Classic, premium" },
  { value: "Arial, sans-serif",     label: "Sans-serif",   desc: "Modern, clean" },
  { value: "Courier New, monospace",label: "Monospace",    desc: "Tech, coding" },
  { value: "Palatino, serif",       label: "Script",       desc: "Creative, fashion" },
  { value: "Georgia, serif",        label: "Editorial",    desc: "Magazine, bold" },
  { value: "Arial, sans-serif",     label: "Corporate",    desc: "Structured, formal" },
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

// ─── PNG helper ───────────────────────────────────────────────────────────────
function svgToPng(svgContent: string, size: number, bgColor?: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgWithBg = bgColor
      ? svgContent.replace(/<svg/, `<svg style="background:${bgColor}"`)
      : svgContent;
    const blob = new Blob([svgWithBg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      if (bgColor) { ctx.fillStyle = bgColor; ctx.fillRect(0, 0, size, size); }
      ctx.drawImage(img, 0, 0, size, size);
      canvas.toBlob(b => { URL.revokeObjectURL(url); if (b) resolve(b); else reject(new Error("toBlob failed")); }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load failed")); };
    img.src = url;
  });
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function LogoCreator() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("brand");

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
  const [justSaved, setJustSaved] = useState(false);
  const [seed, setSeed] = useState(0);
  const [previewBg, setPreviewBg] = useState<"white" | "black" | "brand">("white");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenBg, setFullscreenBg] = useState<"white" | "black" | "brand" | "transparent">("white");
  const [downloadingKit, setDownloadingKit] = useState(false);
  const [licenseCode, setLicenseCode] = useState<string | null>(null);

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
      if (data?.error) { toast.error(data.error); return; }

      const svgContent: string = data?.svgContent || "";
      const newLogo: LogoData = {
        svgContent: svgContent || placeholderSVG(name, colors.primary, colors.secondary),
        name,
        timestamp: Date.now(),
      };

      setLogo(newLogo);
      setLogoHistory(prev => [newLogo, ...prev].slice(0, 3));
      setJustSaved(false);
      setLicenseCode(null);
      toast.success("Logo generated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [name, description, industry, style, font, colors, seed]);

  // Auto-regenerate when style/industry/font/color changes — only after first generation
  useEffect(() => {
    if (!logo || !name.trim() || generating) return;
    const timer = setTimeout(() => {
      const nextSeed = seed + 1;
      setSeed(nextSeed);
      generate(nextSeed);
    }, 800);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, industry, font, colorPreset]);

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
    svgToPng(logo.svgContent, 512).then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${name || "logo"}-logo-512.png`; a.click();
      URL.revokeObjectURL(url);
      toast.success("PNG downloaded (512×512)");
    });
  };

  const downloadFullKit = async () => {
    if (!logo) return;
    setDownloadingKit(true);
    try {
      const zip = new JSZip();
      const baseName = name || "logo";

      // SVG variants
      const svgTransparent = logo.svgContent;
      const svgWhite = logo.svgContent.replace(/<svg/, '<svg style="background:white"');
      const svgBlack = logo.svgContent.replace(/<svg/, '<svg style="background:#111"');
      zip.file(`${baseName}-transparent.svg`, svgTransparent);
      zip.file(`${baseName}-white-bg.svg`, svgWhite);
      zip.file(`${baseName}-black-bg.svg`, svgBlack);

      // PNG variants
      const sizes = [
        { size: 1024, label: "1024" },
        { size: 512,  label: "512" },
        { size: 256,  label: "256" },
        { size: 32,   label: "favicon-32" },
      ];
      for (const { size, label } of sizes) {
        const pngBlob = await svgToPng(logo.svgContent, size);
        const buf = await pngBlob.arrayBuffer();
        zip.file(`${baseName}-${label}px.png`, buf);
      }
      // White bg 512
      const pngWhite = await svgToPng(logo.svgContent, 512, "#ffffff");
      zip.file(`${baseName}-512px-white-bg.png`, await pngWhite.arrayBuffer());
      // Black bg 512
      const pngBlack = await svgToPng(logo.svgContent, 512, "#111111");
      zip.file(`${baseName}-512px-black-bg.png`, await pngBlack.arrayBuffer());

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url; a.download = `${baseName}-logo-kit.zip`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Full logo kit downloaded");
    } catch {
      toast.error("Kit download failed — please try again");
    } finally {
      setDownloadingKit(false);
    }
  };

  const handleSaveToAssets = async () => {
    if (!logo) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in to save assets"); return; }

      // Check if name is available (not licensed by another user)
      if (name.trim()) {
        const { data: available } = await supabase.rpc("check_name_available", {
          _company_name: name.trim(),
          _asset_type: "logo",
          _requesting_user: session.user.id,
        });
        if (available === false) {
          toast.error("This company name already has a registered license. Please verify ownership to proceed.");
          return;
        }
      }

      const svgBase64 = btoa(unescape(encodeURIComponent(logo.svgContent)));
      const dataUri = `data:image/svg+xml;base64,${svgBase64}`;

      const { error: assetError } = await supabase.from("design_assets").insert({
        user_id: session.user.id,
        asset_type: "logo",
        name: `${name} Logo`,
        file_url: dataUri,
        thumbnail_url: dataUri,
      });
      if (assetError) throw assetError;

      // Issue a design license
      let code: string | null = null;
      if (name.trim()) {
        try {
          const { data: licRow } = await supabase
            .from("design_licenses")
            .insert({
              user_id: session.user.id,
              asset_type: "logo",
              company_name: name.trim().toLowerCase(),
            })
            .select("license_code")
            .single();
          code = licRow?.license_code ?? null;
        } catch {
          // License may already exist — ignore
        }
        if (!code) {
          const { data: existing } = await supabase
            .from("design_licenses")
            .select("license_code")
            .eq("user_id", session.user.id)
            .eq("company_name", name.trim().toLowerCase())
            .eq("asset_type", "logo")
            .maybeSingle();
          code = existing?.license_code ?? null;
        }
      }

      setLicenseCode(code);
      setJustSaved(true);
      toast.success("Logo saved to Brand Assets", {
        description: "Find it in Corporate Suite → Brand Assets panel",
        action: { label: "Go there", onClick: () => navigate("/toolkit/corporate-suite") },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not save";
      if (msg.includes("protected")) {
        toast.error("This company name is protected and reserved for its verified owner.");
      } else {
        toast.error("Could not save — please try again");
      }
    } finally {
      setSaving(false);
    }
  };

  const bgForFullscreen = (bg: typeof fullscreenBg) => {
    if (bg === "white") return "#ffffff";
    if (bg === "black") return "#111111";
    if (bg === "brand") return colors.primary;
    return "transparent";
  };

  const bgLabel = (bg: "white" | "black" | "brand") => {
    if (bg === "white") return "White";
    if (bg === "black") return "Black";
    return "Brand";
  };

  // ─── Studio Sections ─────────────────────────────────────────────────────────

  const brandPanel = (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Company / Name *</label>
        <div className="flex gap-2">
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Acme Corporation" className="flex-1 text-sm" />
          <VoiceInputButton onTranscript={setName} size="icon" className="shrink-0" />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Description / Tagline (optional)</label>
        <div className="flex gap-2 items-start">
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Premium property consultancy..." rows={3} className="flex-1 text-sm resize-none" />
          <VoiceInputButton onTranscript={t => setDescription(prev => prev ? prev + " " + t : t)} size="icon" className="shrink-0 mt-0.5" />
        </div>
      </div>
      <Button onClick={() => generate()} disabled={generating || !name.trim()} className="w-full h-10 text-sm font-bold gap-2 border border-[#C9A84C]/60" style={{ background: "linear-gradient(135deg, #1a1a1a, #2d2d2d)", color: "#C9A84C", boxShadow: "0 0 12px rgba(201,168,76,0.25)" }}>
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {generating ? "Generating…" : logo ? "Regenerate" : "Generate Logo"}
      </Button>
    </div>
  );

  const industryPanel = (
    <div className="grid grid-cols-2 gap-2">
      {INDUSTRIES.map(ind => {
        const Icon = ind.icon;
        return (
          <button key={ind.id} onClick={() => setIndustry(ind.id)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${industry === ind.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[hsl(var(--border))] hover:border-[#C9A84C]/60"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={industry === ind.id ? "text-[#C9A84C]" : "text-[hsl(var(--muted-foreground))]"} />
              <p className="text-xs font-semibold text-[hsl(var(--foreground))] leading-tight">{ind.label}</p>
            </div>
            <p className="text-[9px] text-[hsl(var(--muted-foreground))] pl-5 leading-tight">{ind.dna}</p>
          </button>
        );
      })}
    </div>
  );

  const stylePanel = (
    <div className="grid grid-cols-1 gap-2">
      {STYLES.map(s => (
        <button key={s.id} onClick={() => setStyle(s.id)}
          className={`p-3 rounded-xl border-2 text-left transition-all ${style === s.id ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[hsl(var(--border))] hover:border-[#C9A84C]/60"}`}>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{s.label}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.desc}</p>
        </button>
      ))}
    </div>
  );

  const colorsPanel = (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {COLOR_PRESETS.map((c, i) => (
          <button key={i} onClick={() => { setColorPreset(i); setCustomColors({ primary: "", secondary: "", accent: "" }); }}
            className={`p-2 rounded-xl border-2 transition-all ${colorPreset === i && !customColors.primary ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[hsl(var(--border))] hover:border-[#C9A84C]/60"}`}>
            <div className="flex gap-0.5 justify-center mb-1.5">
              <div className="w-4 h-4 rounded-full border border-white/60 shadow-sm" style={{ background: c.primary }} />
              <div className="w-4 h-4 rounded-full border border-[hsl(var(--border))] shadow-sm" style={{ background: c.secondary }} />
              <div className="w-4 h-4 rounded-full border border-white/60 shadow-sm" style={{ background: c.accent }} />
            </div>
            <p className="text-[8px] text-center text-[hsl(var(--muted-foreground))] leading-tight">{c.label}</p>
          </button>
        ))}
      </div>
      <div className="pt-2 border-t border-[hsl(var(--border))]">
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2">Custom Colors</p>
        <div className="grid grid-cols-3 gap-2">
          {(["primary", "secondary", "accent"] as const).map(key => (
            <div key={key} className="flex flex-col items-center gap-1">
              <div className="relative w-8 h-8 rounded-full border-2 border-[hsl(var(--border))] overflow-hidden cursor-pointer" style={{ background: customColors[key] || colors[key] }}>
                <input type="color" value={customColors[key] || colors[key]} onChange={e => setCustomColors(prev => ({ ...prev, [key]: e.target.value }))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))] capitalize">{key}</p>
            </div>
          ))}
        </div>
        {(customColors.primary || customColors.secondary || customColors.accent) && (
          <button onClick={() => setCustomColors({ primary: "", secondary: "", accent: "" })} className="text-[10px] text-[#C9A84C] hover:underline mt-1">Reset to preset</button>
        )}
      </div>
    </div>
  );

  const typographyPanel = (
    <div className="grid grid-cols-1 gap-2">
      {FONTS.map((f, idx) => (
        <button key={`${f.value}-${idx}`} onClick={() => setFont(f.value)}
          className={`p-3 rounded-xl border-2 text-left transition-all ${font === f.value && FONTS.findIndex(ff => ff.value === font) === idx ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-[hsl(var(--border))] hover:border-[#C9A84C]/60"}`}>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]" style={{ fontFamily: f.value }}>{f.label}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{f.desc}</p>
        </button>
      ))}
    </div>
  );

  const exportPanel = (
    <div className="space-y-4">
      {logo ? (
        <>
          {/* Background variants */}
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">Background</p>
            <div className="flex gap-2">
              {(["white", "black", "brand"] as const).map(bg => (
                <button key={bg} onClick={() => setPreviewBg(bg)}
                  className={`flex-1 rounded-xl p-3 flex flex-col items-center justify-center border-2 transition-all gap-2 ${previewBg === bg ? "border-orange-400 ring-2 ring-orange-200" : "border-[hsl(var(--border))] hover:border-orange-300"}`}
                  style={{ background: bg === "white" ? "#fff" : bg === "black" ? "#111" : colors.primary }}>
                  <LogoPreview svgContent={logo.svgContent} size={40} />
                  <span className="text-[9px] font-semibold" style={{ color: bg === "white" ? "#666" : "#fff" }}>{bgLabel(bg)}</span>
                </button>
              ))}
            </div>
          </div>
          {/* License code */}
          {licenseCode && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center space-y-1">
              <p className="text-xs text-green-700 font-semibold">Design Licensed</p>
              <p className="text-sm font-mono font-bold text-green-800">{licenseCode}</p>
              <p className="text-[10px] text-green-600">Exclusively registered to your account.</p>
            </div>
          )}
          {/* Downloads */}
          <div className="space-y-2">
            <Button onClick={downloadSVG} variant="outline" className="w-full gap-2 text-xs"><Download size={13} /> Download SVG</Button>
            <Button onClick={downloadPNG} variant="outline" className="w-full gap-2 text-xs"><Download size={13} /> Download PNG 512px</Button>
            <Button onClick={downloadFullKit} disabled={downloadingKit} className="w-full gap-2 text-xs text-[#1a1a1a] font-semibold border border-[#C9A84C]/60" style={{ background: "linear-gradient(135deg, #FDFBF7, #F5F0E6, #EDE4D3)" }}>
              {downloadingKit ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
              {downloadingKit ? "Packaging…" : "Full Kit (ZIP)"}
            </Button>
          </div>
          {/* Save to Assets */}
          <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
            <Button onClick={handleSaveToAssets} disabled={saving} variant="outline" className="w-full gap-2 text-xs border-[#C9A84C]/60 text-[#C9A84C] hover:bg-[#C9A84C]/10">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
              Save to Brand Assets
            </Button>
            {justSaved && (
              <button onClick={() => navigate("/toolkit/corporate-suite")} className="text-xs text-orange-600 hover:underline flex items-center gap-1 w-full justify-center">
                <Bookmark size={12} /> View in Brand Assets
              </button>
            )}
          </div>
          {/* Fullscreen */}
          <Button onClick={() => setFullscreenOpen(true)} variant="outline" className="w-full gap-2 text-xs">
            <Maximize2 size={13} /> Fullscreen Preview
          </Button>
          {/* Regenerate */}
          <Button onClick={regenerate} disabled={generating} variant="ghost" className="w-full gap-2 text-xs">
            <RefreshCw size={13} className={generating ? "animate-spin" : ""} /> Regenerate
          </Button>
          {/* History strip */}
          {logoHistory.length > 1 && (
            <div>
              <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Recent Variations ({logoHistory.length})</p>
              <div className="flex gap-2">
                {logoHistory.map((h, i) => (
                  <button key={h.timestamp} onClick={() => setLogo(h)}
                    className={`relative flex-1 rounded-xl border-2 p-2 transition-all hover:border-orange-400 ${logo?.timestamp === h.timestamp ? "border-orange-400 bg-orange-50" : "border-[hsl(var(--border))]"}`}>
                    <div className="flex items-center justify-center" style={{ height: 56 }}>
                      <LogoPreview svgContent={h.svgContent} size={48} />
                    </div>
                    <p className="text-[9px] text-center text-[hsl(var(--muted-foreground))] mt-1">V{logoHistory.length - i}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Archive size={28} className="text-[hsl(var(--muted-foreground))]" />
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Generate a logo first to see export options.</p>
        </div>
      )}
    </div>
  );

  const sections: StudioSection[] = [
    { id: "brand",      label: "Brand",    icon: <ImageIcon size={16} />,  panel: brandPanel },
    { id: "industry",   label: "Industry", icon: <Building2 size={16} />,  panel: industryPanel },
    { id: "style",      label: "Style",    icon: <Sparkles size={16} />,   panel: stylePanel },
    { id: "colors",     label: "Colors",   icon: <Palette size={16} />,    panel: colorsPanel },
    { id: "typography", label: "Font",     icon: <Type size={16} />,       panel: typographyPanel },
    { id: "export",     label: "Export",   icon: <Archive size={16} />,    panel: exportPanel },
  ];

  // ─── Live Preview (canvas center) ────────────────────────────────────────────
  const canvasPreview = (
    <div className="flex flex-col items-center gap-6 py-6">
      {generating ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center">
            <Loader2 size={32} className="text-orange-500 animate-spin" />
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">AI is designing your logo…</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] opacity-60">This usually takes 10–20 seconds</p>
        </div>
      ) : logo ? (
        <AnimatePresence mode="wait">
          <motion.div key={logo.timestamp} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
            {/* Main preview */}
            <button onClick={() => setFullscreenOpen(true)}
              className="rounded-2xl border-2 border-[hsl(var(--border))] p-8 flex items-center justify-center shadow-inner hover:border-orange-300 transition-colors group relative"
              style={{ background: previewBg === "white" ? "#fff" : previewBg === "black" ? "#111" : colors.primary }}>
              <LogoPreview svgContent={logo.svgContent} size={260} />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/60 rounded-lg px-2 py-1 flex items-center gap-1">
                  <Maximize2 size={11} className="text-white" />
                  <span className="text-[10px] text-white">Fullscreen</span>
                </div>
              </div>
            </button>
            {/* Size variants row */}
            <div className="flex items-end gap-6 flex-wrap justify-center">
              {[{ label: "Favicon (32)", size: 32 }, { label: "Small (64)", size: 64 }, { label: "Medium (128)", size: 128 }].map(v => (
                <div key={v.size} className="flex flex-col items-center gap-2">
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-2 flex items-center justify-center shadow-sm" style={{ width: v.size + 16, height: v.size + 16 }}>
                    <LogoPreview svgContent={logo.svgContent} size={v.size} />
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{v.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-orange-200 bg-orange-50 flex items-center justify-center">
            <ImageIcon size={36} className="text-orange-300" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[hsl(var(--foreground))]">Ready to generate</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Select Brand Name in the left panel, enter your name, then click Generate</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <StudioShell
        toolName="Logo Creator"
        toolIcon={<ImageIcon size={14} />}
        toolColor="#f97316"
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        preview={canvasPreview}
        onExport={logo ? downloadSVG : undefined}
        exportLabel="SVG"
        breadcrumb="Corporate Suite"
        previewBg="hsl(var(--muted)/0.5)"
      />

      {/* Fullscreen Modal */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-4xl w-full">
          <div className="space-y-6">
            <h2 className="font-bold text-lg text-[hsl(var(--foreground))]">Logo Preview</h2>
            <div className="flex gap-2 flex-wrap">
              {(["white", "black", "brand", "transparent"] as const).map(bg => (
                <button key={bg} onClick={() => setFullscreenBg(bg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all capitalize ${fullscreenBg === bg ? "border-orange-400 bg-orange-50 text-orange-700" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-orange-300"}`}>
                  {bg === "brand" ? "Brand Color" : bg.charAt(0).toUpperCase() + bg.slice(1)}
                </button>
              ))}
            </div>
            {logo && (
              <div className="rounded-2xl flex items-center justify-center p-12 min-h-[300px] border border-[hsl(var(--border))]"
                style={{ background: bgForFullscreen(fullscreenBg), backgroundImage: fullscreenBg === "transparent" ? "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 20px 20px" : undefined }}>
                <LogoPreview svgContent={logo.svgContent} size={300} />
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Business Card Mockup</p>
              <div className="rounded-xl overflow-hidden shadow-lg flex" style={{ width: 350, height: 200, background: colors.primary }}>
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>{logo && <LogoPreview svgContent={logo.svgContent} size={48} />}</div>
                  <div>
                    <p className="text-white font-bold text-sm" style={{ fontFamily: font }}>{name || "Company Name"}</p>
                    <p className="text-white/70 text-xs mt-0.5">Professional Services</p>
                  </div>
                </div>
                <div className="w-24 flex flex-col justify-center items-center gap-1 p-2">
                  <div className="text-white/60 text-[9px] text-center">www.company.com</div>
                  <div className="text-white/60 text-[9px] text-center">info@company.com</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Letterhead Mockup</p>
              <div className="rounded-xl border border-[hsl(var(--border))] bg-white p-6 space-y-3" style={{ maxWidth: 500 }}>
                <div className="flex items-center justify-between pb-3 border-b-2" style={{ borderColor: colors.primary }}>
                  {logo && <LogoPreview svgContent={logo.svgContent} size={48} />}
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: colors.primary, fontFamily: font }}>{name || "Company Name"}</p>
                    <p className="text-xs text-gray-400">www.company.com</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 rounded bg-gray-100 w-full" /><div className="h-2 rounded bg-gray-100 w-4/5" /><div className="h-2 rounded bg-gray-100 w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
