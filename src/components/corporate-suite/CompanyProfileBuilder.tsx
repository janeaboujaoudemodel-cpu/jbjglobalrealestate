import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, Sparkles, Download, Plus, Trash2,
  ChevronRight, LayoutGrid, Loader2, User, Phone, Mail, Globe, MapPin, ImageIcon, ChevronDown,
  Globe2, CheckCircle2, AlertTriangle, Palette, GripHorizontal,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type Template = "premium" | "executive" | "clean";

interface Service { title: string; description: string }
interface TeamMember { name: string; role: string }

interface ProfileData {
  companyName: string;
  tagline: string;
  aboutUs: string;
  services: Service[];
  team: TeamMember[];
  phone: string;
  email: string;
  website: string;
  address: string;
  linkedin: string;
  instagram: string;
}

interface PaletteColor {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "background" | "text";
  opacity: number;
}

const TEMPLATES: { id: Template; label: string; desc: string; accent: string; coverBg: string; contentBg: string }[] = [
  { id: "premium",   label: "Premium Gold",   desc: "Gold accent, dark cover",   accent: "#C8A766", coverBg: "#0a0a0a", contentBg: "#f9f7f3" },
  { id: "executive", label: "Executive Blue",  desc: "Navy blue, structured",     accent: "#1e3a8a", coverBg: "#1e3a8a", contentBg: "#ffffff" },
  { id: "clean",     label: "Clean White",     desc: "Minimal, professional",     accent: "#374151", coverBg: "#ffffff", contentBg: "#ffffff" },
];

const DEFAULT_PALETTE: PaletteColor[] = [
  { hex: "#1a1a1a", name: "Primary",    role: "primary",    opacity: 100 },
  { hex: "#C8A766", name: "Secondary",  role: "secondary",  opacity: 100 },
  { hex: "#F5F0E6", name: "Accent",     role: "accent",     opacity: 100 },
  { hex: "#ffffff", name: "Background", role: "background", opacity: 100 },
  { hex: "#374151", name: "Text",       role: "text",       opacity: 100 },
];

const EMPTY_SERVICE: Service = { title: "", description: "" };
const EMPTY_MEMBER: TeamMember = { name: "", role: "" };

// ─── Completion Score ──────────────────────────────────────────────────────────
function calcScore(data: ProfileData, logoUrl: string): number {
  let score = 0;
  if (data.companyName)                                             score += 10;
  if (data.tagline)                                                 score += 8;
  const wordCount = data.aboutUs.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 10)                                               score += 8;
  if (wordCount > 50)                                               score += 7;
  if (logoUrl)                                                      score += 10;
  if (data.services.some(s => s.title))                             score += 8;
  if (data.services.some(s => s.description))                       score += 7;
  if (data.services.filter(s => s.title).length >= 3)               score += 5;
  if (data.team.some(m => m.name))                                  score += 8;
  if (data.phone)                                                   score += 5;
  if (data.email)                                                   score += 7;
  if (data.website)                                                 score += 5;
  if (data.address)                                                 score += 5;
  if (data.linkedin)                                                score += 4;
  if (data.instagram)                                               score += 3;
  return score;
}

function getScoreItems(data: ProfileData, logoUrl: string) {
  const wordCount = data.aboutUs.trim().split(/\s+/).filter(Boolean).length;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (data.companyName) strengths.push("Company name provided");
  else weaknesses.push("Add your company name to get started");

  if (data.tagline) strengths.push("Tagline added");
  else weaknesses.push("Add a tagline — it defines your brand in one line");

  if (wordCount > 50) strengths.push("About Us section is detailed");
  else if (wordCount > 10) weaknesses.push("About Us is too short — click AI Expand for a professional paragraph");
  else weaknesses.push("Write an About Us section to tell your story");

  if (logoUrl) strengths.push("Logo uploaded");
  else weaknesses.push("Missing logo — upload in Brand Assets");

  const svcCount = data.services.filter(s => s.title).length;
  if (svcCount >= 3) strengths.push(`${svcCount} services listed`);
  else if (svcCount > 0) weaknesses.push("Add at least 3 services for a full profile");
  else weaknesses.push("Add your services — show what you offer");

  if (data.services.some(s => s.description)) strengths.push("Service descriptions added");
  else if (svcCount > 0) weaknesses.push("Add descriptions to your services — use AI ✨ per service");

  if (data.team.some(m => m.name)) strengths.push("Team members added");
  else weaknesses.push("No team members — profiles build trust with clients");

  if (data.email) strengths.push("Email contact provided");
  else weaknesses.push("Missing email address");

  if (data.phone) strengths.push("Phone number added");
  else weaknesses.push("Add a phone number for direct contact");

  if (data.linkedin) strengths.push("LinkedIn profile linked");
  else weaknesses.push("Missing LinkedIn — add for professional credibility");

  if (data.website) strengths.push("Website URL added");
  if (data.address) strengths.push("Address provided");
  if (data.instagram) strengths.push("Instagram linked");

  return { strengths, weaknesses };
}

// ─── Profile Preview ──────────────────────────────────────────────────────────
function ProfilePreview({
  data, template, scale = 0.5, logoUrl = "", logoSize = 80,
}: {
  data: ProfileData; template: Template; scale?: number; logoUrl?: string; logoSize?: number;
}) {
  const cfg = TEMPLATES.find(t => t.id === template)!;
  const { accent, coverBg, contentBg } = cfg;
  const isPremium = template === "premium";
  const isExec = template === "executive";
  const isClean = template === "clean";

  const px = (n: number) => n * scale;
  const scaledLogo = logoSize * scale;

  return (
    <div style={{ fontFamily: isPremium ? "Georgia, serif" : "'Helvetica Neue', Arial, sans-serif", background: contentBg, color: isExec || isClean ? "#111" : "#fff", borderRadius: px(12), overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
      {/* Cover / Header */}
      <div style={{ background: isPremium ? `linear-gradient(135deg, #1a1a1a, #0a0a0a)` : isClean ? "#ffffff" : coverBg, padding: `${px(36)}px ${px(36)}px ${px(32)}px`, position: "relative", borderBottom: isClean ? `2px solid #e5e7eb` : "none" }}>
        {isPremium && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: px(4), background: `linear-gradient(90deg, ${accent}, ${accent}88)` }} />
        )}
        {logoUrl && (
          <div style={{
            position: isExec ? "static" : "absolute",
            top: isExec ? "auto" : px(16),
            right: isExec ? "auto" : px(16),
            marginBottom: isClean || isPremium ? px(12) : 0,
            display: "flex",
            justifyContent: isClean ? "center" : "flex-start",
          }}>
            <img src={logoUrl} alt="Company logo" style={{ width: scaledLogo, height: scaledLogo, objectFit: "contain", borderRadius: isPremium ? "50%" : px(6), border: isPremium ? `2px solid ${accent}66` : "none", background: isPremium ? "rgba(255,255,255,0.05)" : "transparent" }} />
          </div>
        )}
        <p style={{ fontSize: px(8), fontWeight: 700, letterSpacing: px(3), textTransform: "uppercase", color: accent, marginBottom: px(10) }}>COMPANY PROFILE</p>
        <h1 style={{ fontSize: px(28), fontWeight: 800, color: isClean ? "#111" : "#fff", margin: 0, lineHeight: 1.15 }}>{data.companyName || "Your Company Name"}</h1>
        {data.tagline && <p style={{ fontSize: px(12), color: isClean ? "#6b7280" : "rgba(255,255,255,0.75)", marginTop: px(6) }}>{data.tagline}</p>}
        {!isClean && <div style={{ width: px(60), height: px(2), background: accent, marginTop: px(16) }} />}
      </div>
      {data.aboutUs && (
        <div style={{ padding: `${px(22)}px ${px(36)}px`, borderBottom: `1px solid ${accent}20`, background: contentBg }}>
          <p style={{ fontSize: px(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(8) }}>About Us</p>
          <p style={{ fontSize: px(9.5), lineHeight: 1.7, color: "#374151" }}>{data.aboutUs}</p>
        </div>
      )}
      {data.services.some(s => s.title) && (
        <div style={{ padding: `${px(20)}px ${px(36)}px`, borderBottom: `1px solid ${accent}20`, background: contentBg }}>
          <p style={{ fontSize: px(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(12) }}>Our Services</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: px(10) }}>
            {data.services.filter(s => s.title).map((s, i) => (
              <div key={i} style={{ padding: `${px(10)}px`, background: `${accent}10`, borderRadius: px(6), borderLeft: `3px solid ${accent}` }}>
                <p style={{ fontSize: px(9), fontWeight: 700, color: accent, marginBottom: px(3) }}>{s.title}</p>
                {s.description && <p style={{ fontSize: px(8.5), opacity: 0.7, lineHeight: 1.5, color: "#374151" }}>{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {data.team.some(m => m.name) && (
        <div style={{ padding: `${px(20)}px ${px(36)}px`, borderBottom: `1px solid ${accent}20`, background: contentBg }}>
          <p style={{ fontSize: px(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(12) }}>Our Team</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: px(14) }}>
            {data.team.filter(m => m.name).map((m, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: px(40), height: px(40), borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", margin: `0 auto ${px(5)}px` }}>
                  <span style={{ fontSize: px(15), fontWeight: 700, color: "#fff" }}>{m.name.charAt(0).toUpperCase()}</span>
                </div>
                <p style={{ fontSize: px(8.5), fontWeight: 700, color: "#111" }}>{m.name}</p>
                <p style={{ fontSize: px(7.5), opacity: 0.55, color: "#374151" }}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {[data.phone, data.email, data.website, data.address].some(Boolean) && (
        <div style={{ padding: `${px(16)}px ${px(36)}px`, background: `${accent}08` }}>
          <p style={{ fontSize: px(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(8) }}>Contact</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: `${px(5)}px ${px(18)}px` }}>
            {[data.phone, data.email, data.website, data.address].filter(Boolean).map((c, i) => (
              <span key={i} style={{ fontSize: px(8.5), color: "#374151", opacity: 0.8 }}>{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Color Swatch Editor ───────────────────────────────────────────────────────
function ColorSwatchEditor({
  color, onUpdate,
}: {
  color: PaletteColor;
  onUpdate: (updated: PaletteColor) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="w-10 h-10 rounded-lg border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer ring-1 ring-[hsl(var(--border))]"
          style={{ background: color.hex }}
          title={`${color.name}: ${color.hex}`}
        />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4 space-y-3" side="top">
        <p className="text-xs font-bold text-[hsl(var(--foreground))]">{color.name}</p>
        <div className="flex gap-3 items-center">
          <input
            type="color"
            value={color.hex}
            onChange={e => onUpdate({ ...color, hex: e.target.value })}
            className="w-12 h-10 rounded cursor-pointer border border-[hsl(var(--border))]"
          />
          <Input
            value={color.hex}
            onChange={e => {
              const v = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onUpdate({ ...color, hex: v });
            }}
            className="flex-1 text-sm font-mono"
            maxLength={7}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Opacity: {color.opacity}%</Label>
          <Slider
            min={0} max={100} step={1}
            value={[color.opacity]}
            onValueChange={([v]) => onUpdate({ ...color, opacity: v })}
          />
        </div>
        <div className="h-8 rounded-md border border-[hsl(var(--border))]" style={{ background: color.hex, opacity: color.opacity / 100 }} />
      </PopoverContent>
    </Popover>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CompanyProfileBuilder() {
  const navigate = useNavigate();
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
  const [urlInput, setUrlInput] = useState("");
  const [extractingUrl, setExtractingUrl] = useState(false);
  const [extractStep, setExtractStep] = useState("");
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

      // Step 1: Try Firecrawl scrape
      setExtractStep("Fetching page content…");
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke("firecrawl-scrape", {
        body: { url: urlInput.trim(), options: { formats: ["markdown", "branding"], onlyMainContent: true, waitFor: 3000, timeout: 30000 } },
      });

      if (!scrapeError && scrapeData?.success !== false) {
        markdown = scrapeData?.data?.markdown || scrapeData?.markdown || "";
        const bc = scrapeData?.data?.branding?.colors || scrapeData?.branding?.colors;
        if (bc) brandColors = bc;
      } else {
        // Graceful degradation: just inform user
        toast.info("Firecrawl not connected — extracting via AI only. Connect Firecrawl for brand colors.");
      }

      // Step 2: AI extraction
      setExtractStep("Extracting company details with AI…");
      const { data: aiRes, error: aiErr } = await supabase.functions.invoke("company-profile-ai", {
        body: { action: "extract_from_url", markdown, url: urlInput.trim() },
      });
      if (aiErr) throw aiErr;
      if (aiRes?.error) throw new Error(aiRes.error);

      let extracted: Record<string, unknown> = {};
      try {
        // The content field contains the JSON string
        const raw = aiRes?.content || "{}";
        // Strip markdown fences if present
        const cleaned = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        extracted = JSON.parse(cleaned);
      } catch {
        toast.error("AI returned unexpected format — please try again");
        return;
      }

      // Step 3: Fill data
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

      // Step 4: Apply brand colors if found
      if (brandColors) {
        setExtractStep("Applying brand colors…");
        const newPalette: PaletteColor[] = [
          { hex: brandColors.primary    || "#1a1a1a", name: "Primary",    role: "primary",    opacity: 100 },
          { hex: brandColors.secondary  || "#666666", name: "Secondary",  role: "secondary",  opacity: 100 },
          { hex: brandColors.accent     || "#C8A766", name: "Accent",     role: "accent",     opacity: 100 },
          { hex: brandColors.background || "#ffffff", name: "Background", role: "background", opacity: 100 },
          { hex: brandColors.textPrimary|| "#374151", name: "Text",       role: "text",       opacity: 100 },
        ];
        setPalette(newPalette);
        setPaletteOpen(true);
        toast.success("Brand colors extracted and saved to your palette!");
      }

      toast.success("Company profile extracted from website!");
      setScoreOpen(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Extraction failed";
      toast.error(msg);
    } finally {
      setExtractingUrl(false);
      setExtractStep("");
    }
  }, [urlInput]);

  // ── Palette drag-and-drop ─────────────────────────────────────────────────
  const handleDragStart = (idx: number) => { dragIdx.current = idx; };
  const handleDrop = (targetIdx: number) => {
    if (dragIdx.current === null || dragIdx.current === targetIdx) return;
    const newPalette = [...palette];
    const dragged = newPalette[dragIdx.current];
    const target  = newPalette[targetIdx];
    // Swap hex + opacity, keep role labels fixed
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
      user_id: user.id,
      name,
      colors: palette.map(c => ({ hex: c.hex, name: c.name, role: c.role, opacity: c.opacity })),
      is_default: false,
      is_public: false,
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
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const cfg = TEMPLATES.find(t => t.id === template)!;
      const W = 595, H = 842;
      const pdfDoc = await PDFDocument.create();
      const bold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      function hexToRgb(h: string) {
        const c = h.replace("#", "");
        return rgb(parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255);
      }

      const ac       = hexToRgb(cfg.accent);
      const white    = rgb(1, 1, 1);
      const dark     = rgb(0.05, 0.05, 0.05);
      const bodyGray = rgb(0.25, 0.25, 0.25);
      const lightGray = rgb(0.45, 0.45, 0.45);
      const isPremium = template === "premium";
      const isExec    = template === "executive";
      const isClean   = template === "clean";

      let embeddedLogo: Awaited<ReturnType<typeof pdfDoc.embedPng>> | Awaited<ReturnType<typeof pdfDoc.embedJpg>> | null = null;
      if (logoUrl) {
        try {
          if (logoUrl.startsWith("data:image/png")) {
            const bytes = Uint8Array.from(atob(logoUrl.split(",")[1]), c => c.charCodeAt(0));
            embeddedLogo = await pdfDoc.embedPng(bytes);
          } else if (logoUrl.startsWith("data:image/jpeg") || logoUrl.startsWith("data:image/jpg")) {
            const bytes = Uint8Array.from(atob(logoUrl.split(",")[1]), c => c.charCodeAt(0));
            embeddedLogo = await pdfDoc.embedJpg(bytes);
          } else if (logoUrl.startsWith("http")) {
            const res = await fetch(logoUrl);
            const buf = await res.arrayBuffer();
            embeddedLogo = res.headers.get("content-type")?.includes("png")
              ? await pdfDoc.embedPng(new Uint8Array(buf))
              : await pdfDoc.embedJpg(new Uint8Array(buf));
          }
        } catch { /* logo embed failed silently */ }
      }

      const cover = pdfDoc.addPage([W, H]);
      if (isClean) {
        cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: white });
        cover.drawRectangle({ x: 0, y: H - 3, width: W, height: 3, color: ac });
        if (embeddedLogo) { const lSize = Math.min(logoSize, 100); cover.drawImage(embeddedLogo, { x: W / 2 - lSize / 2, y: H - 90 - lSize, width: lSize, height: lSize }); }
        cover.drawText("COMPANY PROFILE", { x: 50, y: H - 110, size: 8, font: bold, color: ac });
        cover.drawText(data.companyName, { x: 50, y: H - 145, size: 32, font: bold, color: dark });
        if (data.tagline) cover.drawText(data.tagline, { x: 50, y: H - 178, size: 13, font: regular, color: lightGray });
        cover.drawLine({ start: { x: 50, y: H - 198 }, end: { x: W - 50, y: H - 198 }, thickness: 1, color: hexToRgb("#e5e7eb") });
      } else {
        const coverBgColor = isPremium ? rgb(0.06, 0.06, 0.06) : hexToRgb(cfg.coverBg);
        cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: coverBgColor });
        cover.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: ac });
        if (embeddedLogo) { const lSize = Math.min(logoSize, 100); cover.drawImage(embeddedLogo, { x: W - lSize - 50, y: H - lSize - 50, width: lSize, height: lSize }); }
        cover.drawText("COMPANY PROFILE", { x: 50, y: H - 70, size: 8, font: bold, color: ac });
        cover.drawText(data.companyName, { x: 50, y: H - 140, size: 34, font: bold, color: white });
        if (data.tagline) cover.drawText(data.tagline, { x: 50, y: H - 175, size: 14, font: regular, color: rgb(0.8, 0.8, 0.8) });
        cover.drawLine({ start: { x: 50, y: H - 198 }, end: { x: 250, y: H - 198 }, thickness: 2, color: ac });
      }

      let currentPage = pdfDoc.addPage([W, H]);
      const contentBgColor = isClean || isExec ? white : rgb(0.98, 0.97, 0.95);
      currentPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: contentBgColor });
      let y = H - 50;

      function ensureSpace(needed: number) {
        if (y - needed < 60) {
          currentPage = pdfDoc.addPage([W, H]);
          currentPage.drawRectangle({ x: 0, y: 0, width: W, height: H, color: contentBgColor });
          currentPage.drawRectangle({ x: 0, y: H - 3, width: W, height: 3, color: ac });
          y = H - 50;
        }
      }
      function drawSectionHeader(title: string) {
        ensureSpace(30);
        currentPage.drawText(title.toUpperCase(), { x: 50, y: y + 5, size: 8, font: bold, color: ac });
        currentPage.drawLine({ start: { x: 50, y: y - 2 }, end: { x: W - 50, y: y - 2 }, thickness: 0.75, color: ac, opacity: 0.25 });
        y -= 22;
      }
      function drawWrappedText(text: string, xOffset = 50, maxWidth = W - 100, fontSize = 9, color = bodyGray, lineH = 14) {
        const words = text.split(" ");
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          const w = regular.widthOfTextAtSize(test, fontSize);
          if (w > maxWidth && line) {
            ensureSpace(lineH + 4);
            currentPage.drawText(line, { x: xOffset, y, size: fontSize, font: regular, color });
            y -= lineH; line = word;
          } else { line = test; }
        }
        if (line) { ensureSpace(lineH + 4); currentPage.drawText(line, { x: xOffset, y, size: fontSize, font: regular, color }); y -= lineH; }
        y -= 6;
      }

      if (data.aboutUs) { drawSectionHeader("About Us"); drawWrappedText(data.aboutUs); y -= 10; }
      const activeServices = data.services.filter(s => s.title);
      if (activeServices.length) {
        drawSectionHeader("Our Services");
        activeServices.forEach((s, i) => {
          const bullet = isPremium ? "◆" : isExec ? "▸" : `${i + 1}.`;
          ensureSpace(18);
          currentPage.drawText(`${bullet} ${s.title}`, { x: 50, y, size: 10, font: bold, color: dark });
          y -= 15;
          if (s.description) { drawWrappedText(s.description, 62, W - 112, 9, lightGray, 13); }
          y -= 4;
        });
        y -= 6;
      }
      const activeTeam = data.team.filter(m => m.name);
      if (activeTeam.length) {
        drawSectionHeader("Our Team");
        activeTeam.forEach(m => {
          ensureSpace(16);
          currentPage.drawText(m.role ? `${m.name}  —  ${m.role}` : m.name, { x: 50, y, size: 9, font: regular, color: dark });
          y -= 15;
        });
        y -= 6;
      }
      const contacts = [
        { label: "Phone", val: data.phone }, { label: "Email", val: data.email },
        { label: "Website", val: data.website }, { label: "Address", val: data.address },
        { label: "LinkedIn", val: data.linkedin }, { label: "Instagram", val: data.instagram },
      ].filter(c => c.val);
      if (contacts.length) {
        drawSectionHeader("Contact Us");
        contacts.forEach(({ label, val }) => {
          ensureSpace(16);
          currentPage.drawText(`${label}:`, { x: 50, y, size: 8.5, font: bold, color: ac });
          currentPage.drawText(val, { x: 120, y, size: 8.5, font: regular, color: bodyGray });
          y -= 15;
        });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${data.companyName.replace(/\s+/g, "-")}-profile.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Company profile PDF exported!");
    } catch (err) { console.error(err); toast.error("PDF export failed"); }
    finally { setExporting(false); }
  }, [data, template, logoUrl, logoSize]);

  const TABS = [
    { id: "company",  label: "Company"  },
    { id: "services", label: "Services" },
    { id: "team",     label: "Team"     },
    { id: "contact",  label: "Contact"  },
  ] as const;

  const scoreColor = score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-500";
  const progressColor = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-400";

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
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

      <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
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
              {extractingUrl && extractStep && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                    <div className="h-full bg-[hsl(var(--gold))] rounded-full animate-pulse w-2/3" />
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] shrink-0">{extractStep}</span>
                </div>
              )}
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Paste your website URL — AI will extract your company details and brand colors automatically.</p>
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
                <div className="px-4 pb-4 border-t border-[hsl(var(--border))]">
                  <BrandAssetLibrary
                    assetTypes={["monogram", "logo"]}
                    selectedUrl={logoUrl}
                    onSelect={asset => setLogoUrl(asset.file_url)}
                    showSizeControl sizeValue={logoSize} onSizeChange={setLogoSize}
                    sizeLabel="Logo Size" sizeMin={40} sizeMax={160}
                  />
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
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all",
                    template === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.06)]"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--gold)/0.4)]"
                  )}
                >
                  <div className="w-8 h-5 rounded mx-auto mb-2 border border-white/60 shadow-sm" style={{ background: t.accent }} />
                  <p className="text-[9px] font-semibold text-[hsl(var(--foreground))] leading-tight">{t.label}</p>
                  <p className="text-[8px] text-[hsl(var(--muted-foreground))]">{t.desc}</p>
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
            {/* Company tab */}
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

            {/* Services tab */}
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

            {/* Team tab */}
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

            {/* Contact tab */}
            {activeTab === "contact" && (
              <div className="space-y-3">
                {[
                  { key: "phone"     as const, label: "Phone",     placeholder: "+1 (555) 000-0000",       icon: Phone  },
                  { key: "email"     as const, label: "Email",     placeholder: "info@yourcompany.com",    icon: Mail   },
                  { key: "website"   as const, label: "Website",   placeholder: "https://www.yourcompany.com", icon: Globe  },
                  { key: "address"   as const, label: "Address",   placeholder: "City, Country",           icon: MapPin },
                  { key: "linkedin"  as const, label: "LinkedIn",  placeholder: "linkedin.com/company/…",  icon: Globe  },
                  { key: "instagram" as const, label: "Instagram", placeholder: "@yourcompany",             icon: Globe  },
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
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[hsl(var(--foreground))]">Live Preview</h2>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded-full">A4 Preview (55% scale)</span>
            </div>
            <div className="overflow-y-auto max-h-[700px]">
              <ProfilePreview data={data} template={template} scale={0.55} logoUrl={logoUrl} logoSize={logoSize} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
