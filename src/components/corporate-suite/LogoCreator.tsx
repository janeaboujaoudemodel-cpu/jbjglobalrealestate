import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, Sparkles, RefreshCw, Download,
  Loader2, Bookmark, Type, Maximize2, Building2,
  Palette, Archive, Wand2, LayoutGrid, Heart, FileText, Star, Filter,
} from "lucide-react";
import { StudioShell, type StudioSection } from "@/components/ui/StudioShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import {
  INDUSTRIES, STYLES, FONTS,
  type LogoData, type LogoType,
  LogoPreview, placeholderSVG, recolorSVG, refontSVG, getContrastColors, triggerDownload, svgToPng,
  COLOR_PRESETS,
} from "./logoCreatorTypes";
import LogoColorPicker from "./LogoColorPicker";
import LogoExportKit from "./LogoExportKit";
import LogoMockups from "./LogoMockups";

const HISTORY_LIMIT = 100;

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
  const [logoType, setLogoType] = useState<LogoType>("full");
  const [refinePrompt, setRefinePrompt] = useState("");

  // Colors — managed separately from presets to avoid regeneration
  const [colors, setColors] = useState({
    primary: COLOR_PRESETS[0].primary,
    secondary: COLOR_PRESETS[0].secondary,
    accent: COLOR_PRESETS[0].accent,
  });
  // Track original colors the logo was generated with (for client-side recoloring)
  const [generatedColors, setGeneratedColors] = useState(colors);

  // State
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [logoHistory, setLogoHistory] = useState<LogoData[]>([]);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [seed, setSeed] = useState(0);
  const [previewBg, setPreviewBg] = useState<"white" | "black" | "brand">("white");
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenBg, setFullscreenBg] = useState<"white" | "black" | "brand" | "transparent">("white");
  const [licenseCode, setLicenseCode] = useState<string | null>(null);

  // Trade license
  const [tradeLicenseOpen, setTradeLicenseOpen] = useState(false);

  // Client-side recolor + refont: when colors/font change, apply without AI call
  const displayLogo = logo ? {
    ...logo,
    svgContent: refontSVG(recolorSVG(logo.svgContent, generatedColors, colors), font),
  } : null;

  const generateRef = useRef<((seed?: number) => Promise<void>) | null>(null);

  const generate = useCallback(async (currentSeed?: number) => {
    if (!name.trim()) { toast.error("Please enter a company or personal name"); return; }
    setGenerating(true);
    const useSeed = currentSeed !== undefined ? currentSeed : seed;
    try {
      const { data, error } = await supabase.functions.invoke("ai-logo-generator", {
        body: { name, industry, style, font, colors, description, seed: useSeed, logoType, mode: "generate" },
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
      setGeneratedColors({ ...colors }); // Track colors this logo was generated with
      setLogoHistory(prev => [newLogo, ...prev].slice(0, HISTORY_LIMIT));
      setJustSaved(false);
      setLicenseCode(null);
      toast.success("Logo generated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }, [name, description, industry, style, font, colors, seed, logoType]);

  useEffect(() => { generateRef.current = generate; }, [generate]);

  // Auto-regenerate ONLY on style/industry changes (NOT color or font changes)
  useEffect(() => {
    if (!logo || !name.trim()) return;
    const timer = setTimeout(() => {
      const nextSeed = seed + 1;
      setSeed(nextSeed);
      generateRef.current?.(nextSeed);
    }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style, industry]);

  const regenerate = () => {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    generate(nextSeed);
  };

  const refineWithAI = async () => {
    if (!logo || !refinePrompt.trim()) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-logo-generator", {
        body: {
          name, industry, style, font, colors, description,
          seed, logoType, mode: "refine",
          currentSvg: logo.svgContent,
          refineInstruction: refinePrompt.trim(),
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const svgContent: string = data?.svgContent || "";
      if (svgContent) {
        const refined: LogoData = { svgContent, name, timestamp: Date.now() };
        setLogo(refined);
        setGeneratedColors({ ...colors });
        setLogoHistory(prev => [refined, ...prev].slice(0, HISTORY_LIMIT));
        setRefinePrompt("");
        toast.success("Logo refined");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Refinement failed");
    } finally {
      setGenerating(false);
    }
  };

  const toggleFavorite = (timestamp: number) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(timestamp)) next.delete(timestamp);
      else next.add(timestamp);
      return next;
    });
  };

  const downloadSVG = () => {
    if (!displayLogo) return;
    const blob = new Blob([displayLogo.svgContent], { type: "image/svg+xml" });
    triggerDownload(blob, `${name || "logo"}-logo.svg`);
    toast.success("SVG downloaded");
  };

  const handleSaveToAssets = async () => {
    if (!displayLogo) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in to save assets"); return; }
      if (name.trim()) {
        const { data: available } = await supabase.rpc("check_name_available", {
          _company_name: name.trim(),
          _asset_type: "logo",
          _requesting_user: session.user.id,
        });
        if (available === false) {
          toast.error("This company name already has a registered license.");
          return;
        }
      }
      const svgBase64 = btoa(unescape(encodeURIComponent(displayLogo.svgContent)));
      const dataUri = `data:image/svg+xml;base64,${svgBase64}`;
      const { error: assetError } = await supabase.from("design_assets").insert({
        user_id: session.user.id,
        asset_type: "logo",
        name: `${name} Logo`,
        file_url: dataUri,
        thumbnail_url: dataUri,
      });
      if (assetError) throw assetError;

      // Dual-insert into brand_assets for cross-tool visibility
      try {
        await supabase.from("brand_assets").insert({
          user_id: session.user.id,
          asset_type: "logo" as any,
          name: `${name} Logo`,
          svg_content: displayLogo.svgContent,
          thumbnail_url: dataUri,
          metadata: {},
        });
      } catch (e) {
        console.warn("Dual-insert to brand_assets failed (non-critical):", e);
      }
      let code: string | null = null;
      if (name.trim()) {
        try {
          const { data: licRow } = await supabase
            .from("design_licenses")
            .insert({ user_id: session.user.id, asset_type: "logo", company_name: name.trim().toLowerCase() })
            .select("license_code")
            .single();
          code = licRow?.license_code ?? null;
        } catch { /* License may already exist */ }
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
      toast.error(msg.includes("protected") ? "This company name is protected." : "Could not save — please try again");
    } finally {
      setSaving(false);
    }
  };

  // ── Trade License Handler ──────────────────────────────────────────────────
  const handleTradeLicenseExtracted = (extracted: any) => {
    if (extracted?.company) setName(extracted.company);
    if (extracted?.description) setDescription(prev => prev ? prev + " " + extracted.description : extracted.description);
    if (extracted?.industry) {
      const match = INDUSTRIES.find(i =>
        i.label.toLowerCase().includes(extracted.industry.toLowerCase()) ||
        extracted.industry.toLowerCase().includes(i.id)
      );
      if (match) setIndustry(match.id);
    }
    toast.success("Trade license data extracted");
    setTradeLicenseOpen(false);
  };

  const bgForFullscreen = (bg: typeof fullscreenBg) => {
    if (bg === "white") return "#ffffff";
    if (bg === "black") return "#111111";
    if (bg === "brand") return colors.primary;
    return "transparent";
  };

  // ─── Logo Type Options ──────────────────────────────────────────────────────
  const LOGO_TYPES: { id: LogoType; label: string; desc: string }[] = [
    { id: "full", label: "Full Logo", desc: "Icon + company name" },
    { id: "wordmark", label: "Wordmark", desc: "Stylized text only" },
    { id: "monogram", label: "Monogram", desc: "Initials only" },
    { id: "icon", label: "Icon", desc: "Symbol mark only" },
  ];

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
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Description / Tagline</label>
        <div className="flex gap-2 items-start">
          <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Premium property consultancy..." rows={2} className="flex-1 text-sm resize-none" />
          <VoiceInputButton onTranscript={t => setDescription(prev => prev ? prev + " " + t : t)} size="icon" className="shrink-0 mt-0.5" />
        </div>
      </div>

      {/* Trade License Upload */}
      <div className="space-y-1.5 pt-2 border-t border-[hsl(var(--border))]">
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1">
          <FileText size={12} /> Auto-Fill from Trade License
        </label>
        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">
          Upload your trade license to auto-fill company name, description, and industry.
        </p>
        <DocumentExtractorUpload
          extractionType="company_profile"
          onExtracted={handleTradeLicenseExtracted}
          label="Upload Trade License"
          hint="PDF, image, or scanned document"
        />
      </div>

      {/* Logo Type Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Logo Type</label>
        <div className="grid grid-cols-2 gap-1.5">
          {LOGO_TYPES.map(t => (
            <button key={t.id} onClick={() => setLogoType(t.id)}
              className={`p-2.5 rounded-xl border-2 text-left transition-all ${logoType === t.id ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10" : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold))]/60"}`}>
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">{t.label}</p>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generate / Regenerate */}
      <Button onClick={() => generate()} disabled={generating || !name.trim()}
        className="w-full h-10 text-sm font-bold gap-2 border border-[hsl(var(--gold))]/60"
        style={{ background: "linear-gradient(135deg, #1a1a1a, #2d2d2d)", color: "#B89555", boxShadow: "0 0 12px rgba(201,168,76,0.25)" }}>
        {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {generating ? "Generating…" : logo ? "Regenerate" : "Generate Logo"}
      </Button>

      {/* Upload Your Own Logo */}
      <div className="space-y-1.5 pt-2 border-t border-[hsl(var(--border))]">
        <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1">
          <ImageIcon size={12} /> Upload Your Logo
        </label>
        <p className="text-[9px] text-[hsl(var(--muted-foreground))]">Upload an SVG or PNG to refine with AI</p>
        <input
          type="file"
          accept=".svg,.png,.jpg,.jpeg"
          className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[hsl(var(--muted))] file:text-[hsl(var(--foreground))] hover:file:bg-[hsl(var(--gold))]/10 cursor-pointer"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.name.endsWith('.svg')) {
              const text = await file.text();
              const uploaded: LogoData = { svgContent: text, name: name || 'Uploaded', timestamp: Date.now() };
              setLogo(uploaded);
              setGeneratedColors({ ...colors });
              setLogoHistory(prev => [uploaded, ...prev].slice(0, HISTORY_LIMIT));
              toast.success("Logo uploaded — use Refine to modify it");
            } else {
              // PNG/JPG: wrap in SVG
              const reader = new FileReader();
              reader.onload = () => {
                const dataUrl = reader.result as string;
                const svgWrapped = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" width="200" height="200"><image href="${dataUrl}" width="200" height="200" preserveAspectRatio="xMidYMid meet"/></svg>`;
                const uploaded: LogoData = { svgContent: svgWrapped, name: name || 'Uploaded', timestamp: Date.now() };
                setLogo(uploaded);
                setGeneratedColors({ ...colors });
                setLogoHistory(prev => [uploaded, ...prev].slice(0, HISTORY_LIMIT));
                toast.success("Logo uploaded — use Refine to modify it");
              };
              reader.readAsDataURL(file);
            }
            e.target.value = '';
          }}
        />
      </div>

      {/* AI Refinement Prompt */}
      {logo && (
        <div className="space-y-1.5 pt-2 border-t border-[hsl(var(--border))]">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <Wand2 size={12} /> Refine with AI
          </label>
          <div className="flex gap-2 items-start">
            <Textarea
              value={refinePrompt}
              onChange={e => setRefinePrompt(e.target.value)}
              placeholder="e.g. Keep the monogram, improve the wordmark styling..."
              rows={2}
              className="flex-1 text-sm resize-none"
            />
            <VoiceInputButton onTranscript={t => setRefinePrompt(prev => prev ? prev + " " + t : t)} size="icon" className="shrink-0 mt-0.5" />
          </div>
          <Button onClick={refineWithAI} disabled={generating || !refinePrompt.trim()} variant="outline"
            className="w-full gap-2 text-xs border-[hsl(var(--gold))]/40 text-[hsl(var(--gold))]">
            {generating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
            Apply Refinement
          </Button>
        </div>
      )}
    </div>
  );

  const industryPanel = (
    <div className="grid grid-cols-2 gap-2">
      {INDUSTRIES.map(ind => {
        const Icon = ind.icon;
        return (
          <button key={ind.id} onClick={() => setIndustry(ind.id)}
            className={`p-3 rounded-xl border-2 text-left transition-all ${industry === ind.id ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10" : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold))]/60"}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon size={14} className={industry === ind.id ? "text-[hsl(var(--gold))]" : "text-[hsl(var(--muted-foreground))]"} />
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
          className={`p-3 rounded-xl border-2 text-left transition-all ${style === s.id ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10" : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold))]/60"}`}>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{s.label}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.desc}</p>
        </button>
      ))}
    </div>
  );

  const colorsPanel = (
    <LogoColorPicker
      colors={colors}
      onChange={setColors}
      colorPreset={colorPreset}
      onPresetChange={setColorPreset}
    />
  );

  const typographyPanel = (
    <div className="grid grid-cols-1 gap-2">
      {FONTS.map((f, idx) => (
        <button key={`${f.value}-${idx}`} onClick={() => setFont(f.value)}
          className={`p-3 rounded-xl border-2 text-left transition-all ${font === f.value && FONTS.findIndex(ff => ff.value === font) === idx ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10" : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold))]/60"}`}>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]" style={{ fontFamily: f.value }}>{f.label}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{f.desc}</p>
        </button>
      ))}
    </div>
  );

  // ── History items with favorites filter ──────────────────────────────────
  const filteredHistory = showFavoritesOnly
    ? logoHistory.filter(h => favorites.has(h.timestamp))
    : logoHistory;

  const exportPanel = displayLogo ? (
    <div className="space-y-4">
      {/* Background variants */}
      <div>
        <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">Preview Background</p>
        <div className="flex gap-2">
          {(["white", "black", "brand"] as const).map(bg => (
            <button key={bg} onClick={() => setPreviewBg(bg)}
              className={`flex-1 rounded-xl p-3 flex flex-col items-center justify-center border-2 transition-all gap-2 ${previewBg === bg ? "border-[hsl(var(--gold))] ring-2 ring-[hsl(var(--gold))]/20" : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold))]/60"}`}
              style={{ background: bg === "white" ? "#fff" : bg === "black" ? "#111" : colors.primary }}>
              <LogoPreview svgContent={displayLogo.svgContent} size={40} />
              <span className="text-[9px] font-semibold" style={{ color: bg === "white" ? "#666" : "#fff" }}>
                {bg === "white" ? "White" : bg === "black" ? "Black" : "Brand"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {licenseCode && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center space-y-1">
          <p className="text-xs text-green-700 font-semibold">Design Licensed</p>
          <p className="text-sm font-mono font-bold text-green-800">{licenseCode}</p>
        </div>
      )}

      {/* Full Export Kit */}
      <LogoExportKit logo={displayLogo} colors={colors} name={name} />

      {/* Save to Assets */}
      <div className="space-y-2 pt-2 border-t border-[hsl(var(--border))]">
        <Button onClick={handleSaveToAssets} disabled={saving} variant="outline" className="w-full gap-2 text-xs border-[hsl(var(--gold))]/60 text-[hsl(var(--gold))] hover:bg-[hsl(var(--gold))]/10">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Bookmark size={14} />}
          Save to Brand Assets
        </Button>
        {justSaved && (
          <button onClick={() => navigate("/toolkit/corporate-suite")} className="text-xs text-[hsl(var(--gold))] hover:underline flex items-center gap-1 w-full justify-center">
            <Bookmark size={12} /> View in Brand Assets
          </button>
        )}
      </div>

      {/* Fullscreen + Regenerate */}
      <Button onClick={() => setFullscreenOpen(true)} variant="outline" className="w-full gap-2 text-xs"><Maximize2 size={13} /> Fullscreen</Button>
      <Button onClick={regenerate} disabled={generating} variant="ghost" className="w-full gap-2 text-xs">
        <RefreshCw size={13} className={generating ? "animate-spin" : ""} /> Regenerate
      </Button>

      {/* History Grid with Favorites */}
      {logoHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">
              History ({logoHistory.length}/{HISTORY_LIMIT})
              {favorites.size > 0 && <span className="ml-1 text-[hsl(var(--gold))]">· {favorites.size} ★</span>}
            </p>
            <button
              onClick={() => setShowFavoritesOnly(v => !v)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-semibold transition-all border ${
                showFavoritesOnly
                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]"
                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold))]/40"
              }`}
            >
              <Star size={9} className={showFavoritesOnly ? "fill-current" : ""} />
              {showFavoritesOnly ? "All" : "Favorites"}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-thumb-[hsl(var(--border))] scrollbar-track-transparent pr-0.5">
            {filteredHistory.map((h, i) => (
              <button key={h.timestamp}
                onClick={() => { setLogo(h); setGeneratedColors(generatedColors); }}
                className={`relative group rounded-xl border-2 p-1.5 transition-all hover:border-[hsl(var(--gold))]/60 ${
                  logo?.timestamp === h.timestamp ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10" : "border-[hsl(var(--border))]"
                }`}
              >
                <div className="flex items-center justify-center" style={{ height: 40 }}>
                  <LogoPreview svgContent={h.svgContent} size={32} />
                </div>
                <p className="text-[7px] text-center text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                  V{logoHistory.length - logoHistory.indexOf(h)}
                </p>
                {/* Favorite heart */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(h.timestamp); }}
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    favorites.has(h.timestamp)
                      ? "bg-red-500 text-white shadow-sm"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100"
                  }`}
                >
                  <Heart size={9} className={favorites.has(h.timestamp) ? "fill-current" : ""} />
                </button>
              </button>
            ))}
          </div>
          {showFavoritesOnly && filteredHistory.length === 0 && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] text-center py-4">No favorites yet — click ♥ on any logo</p>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Archive size={28} className="text-[hsl(var(--muted-foreground))]" />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Generate a logo first.</p>
    </div>
  );

  const mockupsPanel = displayLogo ? (
    <LogoMockups logo={displayLogo} colors={colors} name={name} font={font} />
  ) : (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <LayoutGrid size={28} className="text-[hsl(var(--muted-foreground))]" />
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Generate a logo to see mockups.</p>
    </div>
  );

  const sections: StudioSection[] = [
    { id: "brand",      label: "Brand",    icon: <ImageIcon size={16} />,   panel: brandPanel },
    { id: "industry",   label: "Industry", icon: <Building2 size={16} />,   panel: industryPanel },
    { id: "style",      label: "Style",    icon: <Sparkles size={16} />,    panel: stylePanel },
    { id: "colors",     label: "Colors",   icon: <Palette size={16} />,     panel: colorsPanel },
    { id: "typography", label: "Font",     icon: <Type size={16} />,        panel: typographyPanel },
    { id: "mockups",    label: "Mockups",  icon: <LayoutGrid size={16} />,  panel: mockupsPanel },
    { id: "export",     label: "Export",   icon: <Archive size={16} />,     panel: exportPanel },
  ];

  // ─── Live Preview ──────────────────────────────────────────────────────────
  const canvasPreview = (
    <div className="flex flex-col items-center gap-6 py-6">
      {generating ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[hsl(var(--gold))]/10 flex items-center justify-center">
            <Loader2 size={32} className="text-[hsl(var(--gold))] animate-spin" />
          </div>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">AI is designing your logo…</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] opacity-60">This usually takes 10–20 seconds</p>
        </div>
      ) : displayLogo ? (
        <AnimatePresence mode="wait">
          <motion.div key={displayLogo.timestamp + colors.primary} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
            <button onClick={() => setFullscreenOpen(true)}
              className="rounded-2xl border-2 border-[hsl(var(--border))] p-8 flex items-center justify-center shadow-inner hover:border-[hsl(var(--gold))]/60 transition-colors group relative"
              style={{ background: previewBg === "white" ? "#fff" : previewBg === "black" ? "#111" : colors.primary }}>
              <LogoPreview svgContent={displayLogo.svgContent} size={260} />
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-[#1A1A1A]/60 rounded-lg px-2 py-1 flex items-center gap-1">
                  <Maximize2 size={11} className="text-white" />
                  <span className="text-[10px] text-white">Fullscreen</span>
                </div>
              </div>
            </button>
            <div className="flex items-end gap-6 flex-wrap justify-center">
              {[{ label: "Favicon (32)", size: 32 }, { label: "Small (64)", size: 64 }, { label: "Medium (128)", size: 128 }].map(v => (
                <div key={v.size} className="flex flex-col items-center gap-2">
                  <div className="rounded-xl border border-[hsl(var(--border))] bg-[#FDFBF7] p-2 flex items-center justify-center shadow-sm" style={{ width: v.size + 16, height: v.size + 16 }}>
                    <LogoPreview svgContent={displayLogo.svgContent} size={v.size} />
                  </div>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{v.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="flex flex-col items-center gap-4 py-16">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/5 flex items-center justify-center">
            <ImageIcon size={36} className="text-[hsl(var(--gold))]/40" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[hsl(var(--foreground))]">Ready to generate</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Enter your name and click Generate</p>
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
        toolColor="#B89555"
        sections={sections}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        preview={canvasPreview}
        onExport={displayLogo ? downloadSVG : undefined}
        exportLabel="SVG"
        breadcrumb="Corporate Suite"
        previewBg="hsl(var(--muted)/0.5)"
      />

      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-4xl w-full">
          <div className="space-y-6">
            <h2 className="font-bold text-lg text-[hsl(var(--foreground))]">Logo Preview</h2>
            <div className="flex gap-2 flex-wrap">
              {(["white", "black", "brand", "transparent"] as const).map(bg => (
                <button key={bg} onClick={() => setFullscreenBg(bg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all capitalize ${fullscreenBg === bg ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))]" : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold))]/60"}`}>
                  {bg === "brand" ? "Brand Color" : bg.charAt(0).toUpperCase() + bg.slice(1)}
                </button>
              ))}
            </div>
            {displayLogo && (
              <div className="rounded-2xl flex items-center justify-center p-12 min-h-[300px] border border-[hsl(var(--border))]"
                style={{ background: bgForFullscreen(fullscreenBg), backgroundImage: fullscreenBg === "transparent" ? "repeating-conic-gradient(#eee 0% 25%, #fff 0% 50%) 0 0 / 20px 20px" : undefined }}>
                <LogoPreview svgContent={displayLogo.svgContent} size={300} />
              </div>
            )}
            {/* Mockups in fullscreen */}
            {displayLogo && (
              <LogoMockups logo={displayLogo} colors={colors} name={name} font={font} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
