import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Sparkles, Download, Plus, Trash2,
  LayoutGrid, Loader2, User, Phone, Mail, Globe, MapPin, ImageIcon, ChevronDown,
  Globe2, CheckCircle2, AlertTriangle, Palette, GripHorizontal, ToggleLeft, ToggleRight,
  Layers, Users, FileText, ArrowLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VoiceInputButton } from "@/components/ui/VoiceInputButton";
import { BrandAssetLibrary } from "@/components/corporate-suite/BrandAssetLibrary";
import { DocumentExtractorUpload } from "@/components/corporate-suite/DocumentExtractorUpload";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ── Extracted modules ──
import type { Template, LogoPosition, LogoPageMode, ProfileData, PaletteColor } from "./companyProfileTypes";
import {
  TEMPLATES, DEFAULT_PALETTE, EMPTY_SERVICE, EMPTY_MEMBER,
  LOGO_POSITIONS, LOGO_PAGE_MODES,
  calcScore, getScoreItems,
} from "./companyProfileTypes";
import { MultiPagePreview, ColorSwatchEditor } from "./CompanyProfilePreview";
import { exportCompanyProfilePDF } from "./companyProfileExport";

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CompanyProfileBuilder() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("company");
  const [template, setTemplate] = useState<Template>("premium");
  const [generating, setGenerating] = useState(false);
  const [expandingIdx, setExpandingIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"company" | "services" | "team" | "contact">("company");
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(80);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>("top-right");
  const [logoPageMode, setLogoPageMode] = useState<LogoPageMode>("all");
  const [urlInput, setUrlInput] = useState("");
  const [extractingUrl, setExtractingUrl] = useState(false);
  const [extractStep, setExtractStep] = useState("");
  const [deepScan, setDeepScan] = useState(false);
  const [palette, setPalette] = useState<PaletteColor[]>(DEFAULT_PALETTE);
  const dragIdx = useRef<number | null>(null);

  const [data, setData] = useState<ProfileData>({
    companyName: "", tagline: "", aboutUs: "",
    services: [{ ...EMPTY_SERVICE }, { ...EMPTY_SERVICE }],
    team: [{ ...EMPTY_MEMBER }],
    phone: "", email: "", website: "", address: "", linkedin: "", instagram: "",
  });

  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

  // ── Completion score ──────────────────────────────────────────────────────
  const score = calcScore(data, logoUrl);
  const { strengths, weaknesses } = getScoreItems(data, logoUrl);

  // ── Document Extractor handler ─────────────────────────────────────────────
  const handleExtracted = useCallback((extracted: Record<string, unknown>) => {
    setData(prev => ({
      ...prev,
      companyName: extracted.companyName ? String(extracted.companyName) : prev.companyName,
      tagline:     extracted.tagline     ? String(extracted.tagline)     : prev.tagline,
      aboutUs:     extracted.aboutUs     ? String(extracted.aboutUs)     : prev.aboutUs,
      phone:       extracted.phone       ? String(extracted.phone)       : prev.phone,
      email:       extracted.email       ? String(extracted.email)       : prev.email,
      website:     extracted.website     ? String(extracted.website)     : prev.website,
      address:     extracted.address     ? String(extracted.address)     : prev.address,
      linkedin:    extracted.linkedin    ? String(extracted.linkedin)    : prev.linkedin,
      instagram:   extracted.instagram   ? String(extracted.instagram)   : prev.instagram,
      services: Array.isArray(extracted.services) && extracted.services.length
        ? (extracted.services as Record<string, unknown>[]).map(s => ({ title: String(s.title ?? ""), description: String(s.description ?? "") }))
        : prev.services,
      team: Array.isArray(extracted.team) && extracted.team.length
        ? (extracted.team as Record<string, unknown>[]).map(m => ({ name: String(m.name ?? ""), role: String(m.role ?? "") }))
        : prev.team,
    }));
    toast.success("Fields pre-filled from uploaded document!");
  }, []);

  // ── Smart URL Extraction ───────────────────────────────────────────────────
  const extractFromUrl = useCallback(async () => {
    if (!urlInput.trim()) { toast.error("Enter a website URL first"); return; }
    setExtractingUrl(true);
    setExtractStep("Scanning website…");
    try {
      let markdown = "";
      let brandColors: Record<string, string> | null = null;

      if (deepScan) {
        setExtractStep("Mapping website pages…");
        const { data: mapData } = await supabase.functions.invoke("firecrawl-map", {
          body: { url: urlInput.trim(), options: { limit: 20 } },
        });
        const allLinks: string[] = mapData?.links || [];
        const keywords = ["about", "service", "team", "contact", "who-we-are", "what-we-do"];
        const prioritized = allLinks.filter(l => keywords.some(k => l.toLowerCase().includes(k))).slice(0, 4);
        const pagesToScrape = [urlInput.trim(), ...prioritized].slice(0, 5);

        setExtractStep(`Scraping ${pagesToScrape.length} pages…`);
        const markdownParts: string[] = [];
        for (const pageUrl of pagesToScrape) {
          const { data: sd } = await supabase.functions.invoke("firecrawl-scrape", {
            body: { url: pageUrl, options: { formats: ["markdown", "branding"], onlyMainContent: true, waitFor: 2000, timeout: 25000 } },
          });
          if (sd?.data?.markdown) markdownParts.push(`\n\n## [${pageUrl}]\n${sd.data.markdown}`);
          else if (sd?.markdown) markdownParts.push(`\n\n## [${pageUrl}]\n${sd.markdown}`);
          if (!brandColors) {
            const bc = sd?.data?.branding?.colors || sd?.branding?.colors;
            if (bc && typeof bc === "object") brandColors = bc as Record<string, string>;
          }
        }
        markdown = markdownParts.join("\n").slice(0, 12000);
      } else {
        setExtractStep("Fetching page content…");
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke("firecrawl-scrape", {
          body: { url: urlInput.trim(), options: { formats: ["markdown", "branding"], onlyMainContent: true, waitFor: 3000, timeout: 30000 } },
        });
        if (!scrapeError && scrapeData?.success !== false) {
          markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
          const bc = scrapeData?.data?.branding?.colors || scrapeData?.branding?.colors || scrapeData?.data?.branding || null;
          if (bc && typeof bc === "object" && (bc.primary || bc.secondary || bc.accent || bc.background)) {
            brandColors = bc as Record<string, string>;
          }
        } else {
          toast.info("Firecrawl not connected — extracting via AI only. Connect Firecrawl for brand colors.");
        }
      }

      setExtractStep("Extracting company details with AI…");
      const { data: aiRes, error: aiErr } = await supabase.functions.invoke("company-profile-ai", {
        body: { action: "extract_from_url", markdown, url: urlInput.trim() },
      });
      if (aiErr) throw aiErr;
      if (aiRes?.error) throw new Error(aiRes.error);

      let extracted: Record<string, unknown> = {};
      try {
        const raw = aiRes?.content || "{}";
        const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        extracted = JSON.parse(cleaned);
      } catch {
        toast.error("AI returned unexpected format — please try again");
        return;
      }

      setExtractStep("Applying extracted information…");
      setData(prev => ({
        ...prev,
        companyName: extracted.companyName ? String(extracted.companyName) : prev.companyName,
        tagline:     extracted.tagline     ? String(extracted.tagline)     : prev.tagline,
        aboutUs:     extracted.aboutUs     ? String(extracted.aboutUs)     : prev.aboutUs,
        phone:       extracted.phone       ? String(extracted.phone)       : prev.phone,
        email:       extracted.email       ? String(extracted.email)       : prev.email,
        website:     extracted.website     ? String(extracted.website)     : (urlInput.trim() || prev.website),
        address:     extracted.address     ? String(extracted.address)     : prev.address,
        linkedin:    extracted.linkedin    ? String(extracted.linkedin)    : prev.linkedin,
        instagram:   extracted.instagram   ? String(extracted.instagram)   : prev.instagram,
        services: Array.isArray(extracted.services) && extracted.services.length
          ? (extracted.services as Record<string, unknown>[]).map(s => ({ title: String(s.title ?? ""), description: String(s.description ?? "") }))
          : prev.services,
        team: Array.isArray(extracted.team) && extracted.team.length
          ? (extracted.team as Record<string, unknown>[]).map(m => ({ name: String(m.name ?? ""), role: String(m.role ?? "") }))
          : prev.team,
      }));

      if (brandColors) {
        setExtractStep("Applying brand colors…");
        const mapColor = (val: unknown, fallback: string) => {
          if (typeof val === "string" && /^#[0-9A-Fa-f]{6}$/.test(val)) return val;
          return fallback;
        };
        const newPalette: PaletteColor[] = [
          { hex: mapColor(brandColors.primary,     "#1a1a1a"), name: "Primary",    role: "primary",    opacity: 100 },
          { hex: mapColor(brandColors.secondary,   "#666666"), name: "Secondary",  role: "secondary",  opacity: 100 },
          { hex: mapColor(brandColors.accent,      "#C8A766"), name: "Accent",     role: "accent",     opacity: 100 },
          { hex: mapColor(brandColors.background,  "#ffffff"), name: "Background", role: "background", opacity: 100 },
          { hex: mapColor(brandColors.textPrimary, "#374151"), name: "Text",       role: "text",       opacity: 100 },
        ];
        setPalette(newPalette);
        setPaletteOpen(true);
        toast.success("Brand colors extracted and saved to your palette!");
      }

      toast.success(deepScan ? "Deep scan complete! Profile extracted from multiple pages." : "Company profile extracted from website!");
      setScoreOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      toast.error(msg);
    } finally {
      setExtractingUrl(false);
      setExtractStep("");
    }
  }, [urlInput, deepScan]);

  // ── Palette drag-and-drop ─────────────────────────────────────────────────
  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const newPalette = [...palette];
    const dragged = newPalette[dragIdx.current];
    const target  = newPalette[targetIdx];
    newPalette[dragIdx.current] = { ...dragged, hex: target.hex, opacity: target.opacity };
    newPalette[targetIdx]       = { ...target,  hex: dragged.hex, opacity: dragged.opacity };
    setPalette(newPalette);
    dragIdx.current = null;
  };

  // ── Save palette to DB ────────────────────────────────────────────────────
  const savePalette = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in to save palette"); return; }
    const name = `Website Palette${data.companyName ? ` — ${data.companyName}` : ""}`;
    const { error } = await supabase.from("design_color_palettes" as any).upsert({
      user_id: user.id, name,
      colors: palette.map(c => ({ hex: c.hex, name: c.name, role: c.role, opacity: c.opacity })),
      is_default: false, is_public: false,
    }, { onConflict: "user_id,name" });
    if (error) { toast.error("Failed to save palette"); return; }
    toast.success("Brand palette saved!");
  }, [palette, data.companyName]);

  // ── AI: Expand About Us ────────────────────────────────────────────────────
  const expandAbout = useCallback(async () => {
    if (!data.companyName) { toast.error("Enter company name first"); return; }
    setGenerating(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("company-profile-ai", {
        body: { action: "expand_about", companyName: data.companyName, tagline: data.tagline, draft: data.aboutUs },
      });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      if (res?.content) { set("aboutUs", res.content); toast.success("About Us expanded by AI!"); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI expansion failed");
    } finally { setGenerating(false); }
  }, [data.companyName, data.tagline, data.aboutUs]);

  // ── AI: Expand Service ────────────────────────────────────────────────────
  const expandService = useCallback(async (idx: number) => {
    const svc = data.services[idx];
    if (!svc.title) { toast.error("Enter service title first"); return; }
    setExpandingIdx(idx);
    try {
      const { data: res, error } = await supabase.functions.invoke("company-profile-ai", {
        body: { action: "expand_service", companyName: data.companyName, serviceTitle: svc.title },
      });
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      if (res?.content) {
        const updated = [...data.services];
        updated[idx] = { ...updated[idx], description: res.content };
        set("services", updated);
        toast.success("Service description generated!");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI expansion failed");
    } finally { setExpandingIdx(null); }
  }, [data.services, data.companyName]);

  // ── PDF Export ─────────────────────────────────────────────────────────────
  const exportPDF = useCallback(async () => {
    if (!data.companyName) { toast.error("Enter company name first"); return; }
    setExporting(true);
    try {
      await exportCompanyProfilePDF({ data, template, logoUrl, logoSize, logoPosition, logoPageMode });
    } catch (err) { console.error(err); toast.error("PDF export failed"); }
    finally { setExporting(false); }
  }, [data, template, logoUrl, logoSize, logoPosition, logoPageMode]);

  const TABS = [
    { id: "company",  label: "Company"  },
    { id: "services", label: "Services" },
    { id: "team",     label: "Team"     },
    { id: "contact",  label: "Contact"  },
  ] as const;

  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-500";
  const progressColor = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-400";
  const cfg = TEMPLATES.find(t => t.id === template)!;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 lg:top-[48px] z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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
              <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Company Profile</span>
            </div>
          </div>
          <Button
            onClick={exportPDF}
            disabled={exporting || !data.companyName}
            className="gap-2 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.85)] text-black font-semibold text-sm"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">
        {/* ── Left: Editor ── */}
        <div className="space-y-4">

          {/* ── URL Extraction Panel ── */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden hover:border-[hsl(var(--gold))] transition-colors">
            <div className="flex items-center gap-2 p-4 border-b border-[hsl(var(--border))]">
              <Globe2 size={13} className="text-[hsl(var(--gold))]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Generate from Website</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="flex-1 text-sm"
                  onKeyDown={e => e.key === "Enter" && !extractingUrl && extractFromUrl()}
                  disabled={extractingUrl}
                />
                <Button
                  onClick={extractFromUrl}
                  disabled={extractingUrl || !urlInput.trim()}
                  className="gap-1.5 bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold)/0.85)] text-black text-xs font-semibold shrink-0"
                >
                  {extractingUrl ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  {extractingUrl ? "Extracting…" : "Extract"}
                </Button>
              </div>
              <button
                onClick={() => setDeepScan(d => !d)}
                className="flex items-center gap-2 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                disabled={extractingUrl}
              >
                {deepScan ? <ToggleRight size={16} className="text-[hsl(var(--gold))]" /> : <ToggleLeft size={16} />}
                <span>{deepScan ? "Deep Scan ON — crawling up to 5 pages" : "Deep Scan — crawl multiple pages for richer content"}</span>
              </button>
              {extractingUrl && extractStep && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                    <div className="h-full bg-[hsl(var(--gold))] rounded-full animate-pulse w-2/3" />
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">{extractStep}</span>
                </div>
              )}
            </div>
          </div>

          {/* Document Extractor */}
          <DocumentExtractorUpload
            extractionType="company_profile"
            onExtracted={handleExtracted}
            label="Scan Existing Brochure"
            hint="Upload a company brochure or PDF to pre-fill all fields with AI"
          />

          {/* Brand Assets */}
          <Collapsible open={brandAssetOpen} onOpenChange={setBrandAssetOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden transition-colors hover:border-[hsl(var(--gold))]">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Brand Assets</span>
                    {logoUrl && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                  </div>
                  <ChevronDown size={13} className={cn("text-[hsl(var(--muted-foreground))] transition-transform", brandAssetOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-4">
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl sizeValue={logoSize} onSizeChange={setLogoSize}
                    sizeLabel="Logo Size" sizeMin={40} sizeMax={160}
                  />
                  {logoUrl && (
                    <div className="space-y-3 pt-2 border-t border-[hsl(var(--border))]">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Logo Position</Label>
                        <div className="grid grid-cols-5 gap-1">
                          {LOGO_POSITIONS.map(pos => (
                            <button
                              key={pos.id}
                              onClick={() => setLogoPosition(pos.id)}
                              className={cn(
                                "py-1.5 px-1 rounded-lg text-[8px] font-medium transition-all border text-center leading-tight",
                                logoPosition === pos.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              )}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">Apply Logo To</Label>
                        <div className="grid grid-cols-4 gap-1">
                          {LOGO_PAGE_MODES.map(mode => (
                            <button
                              key={mode.id}
                              onClick={() => setLogoPageMode(mode.id)}
                              className={cn(
                                "py-1.5 px-1 rounded-lg text-[8px] font-medium transition-all border text-center leading-tight",
                                logoPageMode === mode.id
                                  ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold))]"
                                  : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.4)]"
                              )}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* ── Brand Color Palette ── */}
          <Collapsible open={paletteOpen} onOpenChange={setPaletteOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden transition-colors hover:border-[hsl(var(--gold))]">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <Palette size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Brand Color Palette</span>
                  </div>
                  <ChevronDown size={13} className={cn("text-[hsl(var(--muted-foreground))] transition-transform", paletteOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] space-y-4 pt-4">
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Drag swatches to swap roles. Click any swatch to change color or opacity.</p>
                  <div className="flex gap-3 justify-between">
                    {palette.map((color, idx) => (
                      <div
                        key={color.role}
                        className="flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => handleDrop(idx)}
                      >
                        <GripHorizontal size={10} className="text-[hsl(var(--muted-foreground))]" />
                        <ColorSwatchEditor
                          color={color}
                          onUpdate={updated => {
                            const np = [...palette];
                            np[idx] = updated;
                            setPalette(np);
                          }}
                        />
                        <span className="text-[9px] font-medium text-[hsl(var(--muted-foreground))] text-center leading-tight">{color.name}</span>
                        <span className="text-[8px] text-[hsl(var(--muted-foreground)/0.7)] font-mono">{color.hex}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={savePalette} className="flex-1 text-xs gap-1.5">
                      <Palette size={11} /> Save Palette
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setPalette(DEFAULT_PALETTE)} className="text-xs text-[hsl(var(--muted-foreground))]">
                      Reset
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Template picker */}
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3 shadow-sm">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Template</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "flex-shrink-0 p-2.5 rounded-xl border-2 text-center transition-all w-[90px]",
                    template === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]"
                  )}
                >
                  <div className="w-full h-5 rounded mb-1.5 border border-white/40 shadow-sm" style={{ background: `linear-gradient(135deg, ${t.coverBg}, ${t.accent})` }} />
                  <p className="text-[8px] font-bold text-[hsl(var(--foreground))] leading-tight">{t.label}</p>
                  <p className="text-[7px] text-[hsl(var(--muted-foreground))] mt-0.5 leading-tight">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tab navigation */}
          <div className="flex bg-[hsl(var(--muted))] rounded-xl p-1 gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all",
                  activeTab === tab.id ? "bg-white shadow-sm text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4 shadow-sm">
            {activeTab === "company" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Company Name *</Label>
                  <Input value={data.companyName} onChange={e => set("companyName", e.target.value)} placeholder="Your company name" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tagline</Label>
                  <div className="flex gap-2">
                    <Input value={data.tagline} onChange={e => set("tagline", e.target.value)} placeholder="e.g. Building trust since 2010" className="flex-1 text-sm" />
                    <VoiceInputButton onTranscript={t => set("tagline", t)} size="icon" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">About Us</Label>
                    <Button variant="ghost" size="sm" onClick={expandAbout} disabled={generating} className="h-6 text-[10px] gap-1 text-[hsl(var(--gold))] hover:text-[hsl(var(--gold))]">
                      {generating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      AI Expand
                    </Button>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Textarea value={data.aboutUs} onChange={e => set("aboutUs", e.target.value)} placeholder="Describe your company, mission, and values…" rows={5} className="flex-1 text-sm resize-none" />
                    <VoiceInputButton onTranscript={t => set("aboutUs", data.aboutUs ? data.aboutUs + " " + t : t)} size="icon" className="mt-0.5" />
                  </div>
                </div>
              </>
            )}

            {activeTab === "services" && (
              <div className="space-y-4">
                {data.services.map((svc, i) => (
                  <div key={i} className="space-y-2 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Service {i + 1}</p>
                      <button onClick={() => set("services", data.services.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><Trash2 size={12} /></button>
                    </div>
                    <Input value={svc.title} onChange={e => { const s = [...data.services]; s[i] = { ...s[i], title: e.target.value }; set("services", s); }} placeholder="e.g. Property Consulting" className="text-sm" />
                    <div className="flex gap-2 items-start">
                      <Textarea value={svc.description} onChange={e => { const s = [...data.services]; s[i] = { ...s[i], description: e.target.value }; set("services", s); }} placeholder="Brief description of the service…" rows={2} className="flex-1 text-sm resize-none" />
                      <div className="flex flex-col gap-1">
                        <VoiceInputButton onTranscript={t => { const s = [...data.services]; s[i] = { ...s[i], description: t }; set("services", s); }} size="icon" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--gold))]" onClick={() => expandService(i)} disabled={expandingIdx !== null} title="Generate description with AI">
                          {expandingIdx === i ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => set("services", [...data.services, { ...EMPTY_SERVICE }])} className="w-full gap-1.5 text-xs">
                  <Plus size={13} /> Add Service
                </Button>
              </div>
            )}

            {activeTab === "team" && (
              <div className="space-y-3">
                {data.team.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--gold)/0.15)] flex items-center justify-center shrink-0"><User size={13} className="text-[hsl(var(--gold))]" /></div>
                    <Input value={m.name} onChange={e => { const t = [...data.team]; t[i] = { ...t[i], name: e.target.value }; set("team", t); }} placeholder="Full Name" className="flex-1 text-sm" />
                    <Input value={m.role} onChange={e => { const t = [...data.team]; t[i] = { ...t[i], role: e.target.value }; set("team", t); }} placeholder="Role / Title" className="flex-1 text-sm" />
                    <button onClick={() => set("team", data.team.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 size={13} /></button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => set("team", [...data.team, { ...EMPTY_MEMBER }])} className="w-full gap-1.5 text-xs">
                  <Plus size={13} /> Add Team Member
                </Button>
              </div>
            )}

            {activeTab === "contact" && (
              <div className="space-y-3">
                {[
                  { key: "phone"     as const, label: "Phone",     placeholder: "+1 (555) 000-0000",          icon: Phone  },
                  { key: "email"     as const, label: "Email",     placeholder: "info@yourcompany.com",       icon: Mail   },
                  { key: "website"   as const, label: "Website",   placeholder: "https://www.yourcompany.com",icon: Globe  },
                  { key: "address"   as const, label: "Address",   placeholder: "City, Country",              icon: MapPin },
                  { key: "linkedin"  as const, label: "LinkedIn",  placeholder: "linkedin.com/company/…",     icon: Globe  },
                  { key: "instagram" as const, label: "Instagram", placeholder: "@yourcompany",                icon: Globe  },
                ].map(({ key, label, placeholder, icon: Icon }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs flex items-center gap-1.5"><Icon size={11} />{label}</Label>
                    <div className="flex gap-2">
                      <Input value={data[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} className="flex-1 text-sm" />
                      <VoiceInputButton onTranscript={t => set(key, t)} size="icon" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Score + Preview ── */}
        <div className="space-y-4">
          {/* ── Completion Score Panel ── */}
          <Collapsible open={scoreOpen} onOpenChange={setScoreOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.4)] transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Profile Score</span>
                    <div className="flex-1 h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden mx-2">
                      <div className={cn("h-full rounded-full transition-all duration-500", progressColor)} style={{ width: `${score}%` }} />
                    </div>
                    <span className={cn("text-sm font-bold tabular-nums", scoreColor)}>{score}%</span>
                  </div>
                  <ChevronDown size={13} className={cn("text-[hsl(var(--muted-foreground))] transition-transform ml-3", scoreOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))] pt-3 space-y-2 max-h-56 overflow-y-auto">
                  {strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={12} className="text-green-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-[hsl(var(--foreground))]">{s}</span>
                    </div>
                  ))}
                  {weaknesses.map((w, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-[hsl(var(--muted-foreground))]">{w}</span>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          {/* Live Preview */}
          <div className="bg-[hsl(var(--muted)/0.5)] rounded-2xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[hsl(var(--foreground))] text-sm">Live Preview</h2>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] bg-white px-2 py-1 rounded-full border border-[hsl(var(--border))]">A4 · {cfg.label}</span>
            </div>
            <div className="overflow-y-auto max-h-[800px] overflow-x-hidden">
              <div style={{ transform: "scale(0.58)", transformOrigin: "top left", width: `${100/0.58}%` }}>
                <MultiPagePreview
                  data={data}
                  cfg={cfg}
                  scale={1}
                  logoUrl={logoUrl}
                  logoSize={logoSize}
                  logoPosition={logoPosition}
                  logoPageMode={logoPageMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
