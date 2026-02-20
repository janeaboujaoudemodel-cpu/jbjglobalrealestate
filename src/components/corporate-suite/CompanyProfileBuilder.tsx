import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Building2, Sparkles, Download, Plus, Trash2,
  ChevronRight, LayoutGrid, Loader2, User, Phone, Mail, Globe, MapPin, ImageIcon, ChevronDown,
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

const TEMPLATES: { id: Template; label: string; desc: string; accent: string; coverBg: string; contentBg: string }[] = [
  { id: "premium",   label: "Premium Gold",   desc: "Gold accent, dark cover",   accent: "#C8A766", coverBg: "#0a0a0a", contentBg: "#f9f7f3" },
  { id: "executive", label: "Executive Blue",  desc: "Navy blue, structured",     accent: "#1e3a8a", coverBg: "#1e3a8a", contentBg: "#ffffff" },
  { id: "clean",     label: "Clean White",     desc: "Minimal, professional",     accent: "#374151", coverBg: "#ffffff", contentBg: "#ffffff" },
];

const EMPTY_SERVICE: Service = { title: "", description: "" };
const EMPTY_MEMBER: TeamMember = { name: "", role: "" };

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

        {/* Logo */}
        {logoUrl && (
          <div style={{
            position: isExec ? "static" : "absolute",
            top: isExec ? "auto" : px(16),
            right: isExec ? "auto" : px(16),
            marginBottom: isClean || isPremium ? px(12) : 0,
            display: "flex",
            justifyContent: isClean ? "center" : "flex-start",
          }}>
            <img
              src={logoUrl}
              alt="Company logo"
              style={{
                width: scaledLogo,
                height: scaledLogo,
                objectFit: "contain",
                borderRadius: isPremium ? "50%" : px(6),
                border: isPremium ? `2px solid ${accent}66` : "none",
                background: isPremium ? "rgba(255,255,255,0.05)" : "transparent",
              }}
            />
          </div>
        )}

        <p style={{ fontSize: px(8), fontWeight: 700, letterSpacing: px(3), textTransform: "uppercase", color: accent, marginBottom: px(10) }}>COMPANY PROFILE</p>
        <h1 style={{ fontSize: px(28), fontWeight: 800, color: isClean ? "#111" : "#fff", margin: 0, lineHeight: 1.15 }}>{data.companyName || "Your Company Name"}</h1>
        {data.tagline && <p style={{ fontSize: px(12), color: isClean ? "#6b7280" : "rgba(255,255,255,0.75)", marginTop: px(6) }}>{data.tagline}</p>}
        {!isClean && <div style={{ width: px(60), height: px(2), background: accent, marginTop: px(16) }} />}
      </div>

      {/* About */}
      {data.aboutUs && (
        <div style={{ padding: `${px(22)}px ${px(36)}px`, borderBottom: `1px solid ${accent}20`, background: contentBg }}>
          <p style={{ fontSize: px(8), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(8) }}>About Us</p>
          <p style={{ fontSize: px(9.5), lineHeight: 1.7, color: "#374151" }}>{data.aboutUs}</p>
        </div>
      )}

      {/* Services */}
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

      {/* Team */}
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

      {/* Contact */}
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CompanyProfileBuilder() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template>("premium");
  const [generating, setGenerating] = useState(false);
  const [expandingIdx, setExpandingIdx] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<"company" | "services" | "team" | "contact">("company");
  const [brandAssetOpen, setBrandAssetOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSize, setLogoSize] = useState(80);

  const [data, setData] = useState<ProfileData>({
    companyName: "",
    tagline: "",
    aboutUs: "",
    services: [{ ...EMPTY_SERVICE }, { ...EMPTY_SERVICE }],
    team: [{ ...EMPTY_MEMBER }],
    phone: "",
    email: "",
    website: "",
    address: "",
    linkedin: "",
    instagram: "",
  });

  const set = <K extends keyof ProfileData>(k: K, v: ProfileData[K]) =>
    setData(prev => ({ ...prev, [k]: v }));

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
        ? (extracted.services as Record<string, unknown>[]).map(s => ({
            title:       String(s.title       ?? ""),
            description: String(s.description ?? ""),
          }))
        : prev.services,
      team: Array.isArray(extracted.team) && extracted.team.length
        ? (extracted.team as Record<string, unknown>[]).map(m => ({
            name: String(m.name ?? ""),
            role: String(m.role ?? ""),
          }))
        : prev.team,
    }));
  }, []);

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
      const msg = e instanceof Error ? e.message : "AI expansion failed";
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
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
      const msg = e instanceof Error ? e.message : "AI expansion failed";
      toast.error(msg);
    } finally {
      setExpandingIdx(null);
    }
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
        return rgb(
          parseInt(c.slice(0, 2), 16) / 255,
          parseInt(c.slice(2, 4), 16) / 255,
          parseInt(c.slice(4, 6), 16) / 255
        );
      }

      const ac      = hexToRgb(cfg.accent);
      const white   = rgb(1, 1, 1);
      const dark    = rgb(0.05, 0.05, 0.05);
      const bodyGray = rgb(0.25, 0.25, 0.25);
      const lightGray = rgb(0.45, 0.45, 0.45);

      const isPremium = template === "premium";
      const isExec    = template === "executive";
      const isClean   = template === "clean";

      // ── Embed logo if available ────────────────────────────────────────────
      let embeddedLogo: Awaited<ReturnType<typeof pdfDoc.embedPng>> | Awaited<ReturnType<typeof pdfDoc.embedJpg>> | null = null;
      if (logoUrl) {
        try {
          if (logoUrl.startsWith("data:image/png")) {
            const b64 = logoUrl.split(",")[1];
            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            embeddedLogo = await pdfDoc.embedPng(bytes);
          } else if (logoUrl.startsWith("data:image/jpeg") || logoUrl.startsWith("data:image/jpg")) {
            const b64 = logoUrl.split(",")[1];
            const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
            embeddedLogo = await pdfDoc.embedJpg(bytes);
          } else if (logoUrl.startsWith("http")) {
            const res = await fetch(logoUrl);
            const buf = await res.arrayBuffer();
            const ct  = res.headers.get("content-type") || "";
            embeddedLogo = ct.includes("png")
              ? await pdfDoc.embedPng(new Uint8Array(buf))
              : await pdfDoc.embedJpg(new Uint8Array(buf));
          }
        } catch { /* logo embed failed silently */ }
      }

      // ── Cover page ────────────────────────────────────────────────────────
      const cover = pdfDoc.addPage([W, H]);

      if (isClean) {
        cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: white });
        cover.drawRectangle({ x: 0, y: H - 3, width: W, height: 3, color: ac });
        if (embeddedLogo) {
          const lSize = Math.min(logoSize, 100);
          cover.drawImage(embeddedLogo, { x: W / 2 - lSize / 2, y: H - 90 - lSize, width: lSize, height: lSize });
        }
        cover.drawText("COMPANY PROFILE", { x: 50, y: H - 110, size: 8, font: bold, color: ac });
        cover.drawText(data.companyName, { x: 50, y: H - 145, size: 32, font: bold, color: dark });
        if (data.tagline) cover.drawText(data.tagline, { x: 50, y: H - 178, size: 13, font: regular, color: lightGray });
        cover.drawLine({ start: { x: 50, y: H - 198 }, end: { x: W - 50, y: H - 198 }, thickness: 1, color: hexToRgb("#e5e7eb") });
      } else {
        // Premium & Executive dark cover
        const coverBgColor = isPremium ? rgb(0.06, 0.06, 0.06) : hexToRgb(cfg.coverBg);
        cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: coverBgColor });
        cover.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: ac });

        if (embeddedLogo) {
          const lSize = Math.min(logoSize, 100);
          cover.drawImage(embeddedLogo, { x: W - lSize - 50, y: H - lSize - 50, width: lSize, height: lSize });
        }

        cover.drawText("COMPANY PROFILE", { x: 50, y: H - 70, size: 8, font: bold, color: ac });
        cover.drawText(data.companyName, { x: 50, y: H - 140, size: 34, font: bold, color: white });
        if (data.tagline) cover.drawText(data.tagline, { x: 50, y: H - 175, size: 14, font: regular, color: rgb(0.8, 0.8, 0.8) });
        cover.drawLine({ start: { x: 50, y: H - 198 }, end: { x: 250, y: H - 198 }, thickness: 2, color: ac });
      }

      // ── Auto-paginating content pages ─────────────────────────────────────
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
            y -= lineH;
            line = word;
          } else {
            line = test;
          }
        }
        if (line) {
          ensureSpace(lineH + 4);
          currentPage.drawText(line, { x: xOffset, y, size: fontSize, font: regular, color });
          y -= lineH;
        }
        y -= 6;
      }

      // About Us section
      if (data.aboutUs) {
        drawSectionHeader("About Us");
        drawWrappedText(data.aboutUs);
        y -= 10;
      }

      // Services section
      const activeServices = data.services.filter(s => s.title);
      if (activeServices.length) {
        drawSectionHeader("Our Services");
        activeServices.forEach((s, i) => {
          const bullet = isPremium ? "◆" : isExec ? "▸" : `${i + 1}.`;
          ensureSpace(18);
          currentPage.drawText(`${bullet} ${s.title}`, { x: 50, y, size: 10, font: bold, color: dark });
          y -= 15;
          if (s.description) {
            drawWrappedText(s.description, 62, W - 112, 9, lightGray, 13);
          }
          y -= 4;
        });
        y -= 6;
      }

      // Team section
      const activeTeam = data.team.filter(m => m.name);
      if (activeTeam.length) {
        drawSectionHeader("Our Team");
        activeTeam.forEach(m => {
          ensureSpace(16);
          const display = m.role ? `${m.name}  —  ${m.role}` : m.name;
          currentPage.drawText(display, { x: 50, y, size: 9, font: regular, color: dark });
          y -= 15;
        });
        y -= 6;
      }

      // Contact section
      const contacts: { label: string; val: string }[] = [
        { label: "Phone",     val: data.phone },
        { label: "Email",     val: data.email },
        { label: "Website",   val: data.website },
        { label: "Address",   val: data.address },
        { label: "LinkedIn",  val: data.linkedin },
        { label: "Instagram", val: data.instagram },
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
      a.href = url;
      a.download = `${data.companyName.replace(/\s+/g, "-")}-profile.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Company profile PDF exported!");
    } catch (err) {
      console.error(err);
      toast.error("PDF export failed");
    } finally {
      setExporting(false);
    }
  }, [data, template, logoUrl, logoSize]);

  const TABS = [
    { id: "company",  label: "Company"  },
    { id: "services", label: "Services" },
    { id: "team",     label: "Team"     },
    { id: "contact",  label: "Contact"  },
  ] as const;

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
                    showSizeControl
                    sizeValue={logoSize}
                    onSizeChange={setLogoSize}
                    sizeLabel="Logo Size"
                    sizeMin={40}
                    sizeMax={160}
                  />
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
                  <Input value={data.companyName} onChange={e => set("companyName", e.target.value)} placeholder="JBJ Global Real Estate" className="text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tagline</Label>
                  <div className="flex gap-2">
                    <Input value={data.tagline} onChange={e => set("tagline", e.target.value)} placeholder="Excellence in UAE Real Estate" className="flex-1 text-sm" />
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
                    <Textarea value={data.aboutUs} onChange={e => set("aboutUs", e.target.value)} placeholder="Write a short description and click AI Expand…" rows={5} className="flex-1 text-sm resize-none" />
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
                      <button onClick={() => set("services", data.services.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <Input
                      value={svc.title}
                      onChange={e => { const s = [...data.services]; s[i] = { ...s[i], title: e.target.value }; set("services", s); }}
                      placeholder="Service title"
                      className="text-sm"
                    />
                    <div className="flex gap-2 items-start">
                      <Textarea
                        value={svc.description}
                        onChange={e => { const s = [...data.services]; s[i] = { ...s[i], description: e.target.value }; set("services", s); }}
                        placeholder="Description…"
                        rows={2}
                        className="flex-1 text-sm resize-none"
                      />
                      <div className="flex flex-col gap-1">
                        <VoiceInputButton onTranscript={t => { const s = [...data.services]; s[i] = { ...s[i], description: t }; set("services", s); }} size="icon" />
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-[hsl(var(--gold))]"
                          onClick={() => expandService(i)}
                          disabled={expandingIdx !== null}
                          title="Generate description with AI"
                        >
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
                    <div className="w-7 h-7 rounded-full bg-[hsl(var(--gold)/0.15)] flex items-center justify-center shrink-0">
                      <User size={13} className="text-[hsl(var(--gold))]" />
                    </div>
                    <Input value={m.name} onChange={e => { const t = [...data.team]; t[i] = { ...t[i], name: e.target.value }; set("team", t); }} placeholder="Full Name" className="flex-1 text-sm" />
                    <Input value={m.role} onChange={e => { const t = [...data.team]; t[i] = { ...t[i], role: e.target.value }; set("team", t); }} placeholder="Role / Title" className="flex-1 text-sm" />
                    <button onClick={() => set("team", data.team.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 shrink-0">
                      <Trash2 size={13} />
                    </button>
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
                  { key: "phone"     as const, label: "Phone",     placeholder: "+971 4 000 0000",       icon: Phone  },
                  { key: "email"     as const, label: "Email",     placeholder: "info@company.com",       icon: Mail   },
                  { key: "website"   as const, label: "Website",   placeholder: "www.company.com",        icon: Globe  },
                  { key: "address"   as const, label: "Address",   placeholder: "Dubai, UAE",             icon: MapPin },
                  { key: "linkedin"  as const, label: "LinkedIn",  placeholder: "linkedin.com/company/…", icon: Globe  },
                  { key: "instagram" as const, label: "Instagram", placeholder: "@company",               icon: Globe  },
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

        {/* ── Right: Preview ── */}
        <div className="space-y-4">
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
