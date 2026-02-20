import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import { BrandAssetLibrary, BrandAsset } from "@/components/corporate-suite/BrandAssetLibrary";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

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

const TEMPLATES: { id: Template; label: string; desc: string; accent: string; bg: string }[] = [
  { id: "premium", label: "Premium Gold", desc: "Gold accent, full-bleed cover", accent: "#C8A766", bg: "#0a0a0a" },
  { id: "executive", label: "Executive Blue", desc: "Dark navy, structured", accent: "#1e3a8a", bg: "#f8fafc" },
  { id: "clean", label: "Clean White", desc: "Minimal, professional", accent: "#374151", bg: "#ffffff" },
];

const EMPTY_SERVICE: Service = { title: "", description: "" };
const EMPTY_MEMBER: TeamMember = { name: "", role: "" };

// ─── Profile Preview ──────────────────────────────────────────────────────────
function ProfilePreview({ data, template, scale = 0.5 }: { data: ProfileData; template: Template; scale?: number }) {
  const cfg = TEMPLATES.find(t => t.id === template)!;
  const { accent, bg } = cfg;
  const isPremium = template === "premium";
  const isExec = template === "executive";

  const px = (n: number) => n * scale;

  return (
    <div style={{ fontFamily: isPremium ? "Georgia, serif" : "'Helvetica Neue', Arial, sans-serif", background: bg, color: isExec ? "#111" : isPremium ? "#fff" : "#111", minHeight: px(600), borderRadius: px(12), overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
      {/* Cover / Header */}
      <div style={{ background: isPremium ? `linear-gradient(135deg, #1a1a1a, #2a2a2a)` : accent, padding: `${px(40)}px ${px(36)}px`, position: "relative" }}>
        {isPremium && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: px(4), background: `linear-gradient(90deg, ${accent}, ${accent}aa)` }} />
        )}
        <p style={{ fontSize: px(9), fontWeight: 700, letterSpacing: px(3), textTransform: "uppercase", color: accent, opacity: 0.9, marginBottom: px(12) }}>COMPANY PROFILE</p>
        <h1 style={{ fontSize: px(32), fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1.15 }}>{data.companyName || "Your Company Name"}</h1>
        {data.tagline && <p style={{ fontSize: px(13), color: "#fff", opacity: 0.7, marginTop: px(8) }}>{data.tagline}</p>}
      </div>

      {/* About */}
      {data.aboutUs && (
        <div style={{ padding: `${px(28)}px ${px(36)}px`, borderBottom: `1px solid ${accent}20` }}>
          <p style={{ fontSize: px(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(10) }}>About Us</p>
          <p style={{ fontSize: px(10), lineHeight: 1.7, color: isExec ? "#374151" : isPremium ? "#e5e5e5" : "#374151" }}>{data.aboutUs}</p>
        </div>
      )}

      {/* Services */}
      {data.services.some(s => s.title) && (
        <div style={{ padding: `${px(24)}px ${px(36)}px`, borderBottom: `1px solid ${accent}20` }}>
          <p style={{ fontSize: px(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(16) }}>Our Services</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: px(12) }}>
            {data.services.filter(s => s.title).map((s, i) => (
              <div key={i} style={{ padding: `${px(12)}px`, background: `${accent}10`, borderRadius: px(8), borderLeft: `3px solid ${accent}` }}>
                <p style={{ fontSize: px(10), fontWeight: 700, color: accent, marginBottom: px(4) }}>{s.title}</p>
                {s.description && <p style={{ fontSize: px(9), opacity: 0.75, lineHeight: 1.5 }}>{s.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team */}
      {data.team.some(m => m.name) && (
        <div style={{ padding: `${px(24)}px ${px(36)}px`, borderBottom: `1px solid ${accent}20` }}>
          <p style={{ fontSize: px(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(16) }}>Our Team</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: px(12) }}>
            {data.team.filter(m => m.name).map((m, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ width: px(44), height: px(44), borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", margin: `0 auto ${px(6)}px` }}>
                  <span style={{ fontSize: px(16), fontWeight: 700, color: "#fff" }}>{m.name.charAt(0)}</span>
                </div>
                <p style={{ fontSize: px(9), fontWeight: 700 }}>{m.name}</p>
                <p style={{ fontSize: px(8), opacity: 0.6 }}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div style={{ padding: `${px(20)}px ${px(36)}px`, background: `${accent}08` }}>
        <p style={{ fontSize: px(9), fontWeight: 700, textTransform: "uppercase", letterSpacing: px(2), color: accent, marginBottom: px(10) }}>Contact</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: `${px(6)}px ${px(20)}px` }}>
          {[data.phone, data.email, data.website, data.address].filter(Boolean).map((c, i) => (
            <span key={i} style={{ fontSize: px(9), opacity: 0.75 }}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompanyProfileBuilder() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template>("premium");
  const [generating, setGenerating] = useState(false);
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

  // AI expand about us
  const expandAbout = useCallback(async () => {
    if (!data.companyName) { toast.error("Enter company name first"); return; }
    setGenerating(true);
    try {
      const prompt = data.aboutUs
        ? `Expand this into a professional 3-paragraph "About Us" section for a company profile PDF (max 200 words). Company: "${data.companyName}". Tagline: "${data.tagline || ""}". Draft: "${data.aboutUs}". Return only the expanded text.`
        : `Write a professional "About Us" section (3 paragraphs, max 200 words) for company profile PDF. Company: "${data.companyName}". Tagline: "${data.tagline || ""}". Make it compelling and professional. Return only the text.`;

      const { data: res, error } = await supabase.functions.invoke("gemini-chat", {
        body: { messages: [{ role: "user", content: prompt }] },
      });
      if (error) throw error;
      const content = res?.content || res?.message || "";
      if (content) { set("aboutUs", content); toast.success("About Us expanded by AI!"); }
    } catch {
      toast.error("AI expansion failed");
    } finally {
      setGenerating(false);
    }
  }, [data.companyName, data.tagline, data.aboutUs]);

  const expandService = useCallback(async (idx: number) => {
    const svc = data.services[idx];
    if (!svc.title) { toast.error("Enter service title first"); return; }
    setGenerating(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          messages: [{
            role: "user",
            content: `Write a concise 1-2 sentence professional description for this service offered by "${data.companyName || "our company"}": "${svc.title}". Return only the description.`
          }]
        },
      });
      if (error) throw error;
      const content = res?.content || res?.message || "";
      if (content) {
        const updated = [...data.services];
        updated[idx] = { ...updated[idx], description: content };
        set("services", updated);
        toast.success("Service description generated!");
      }
    } catch {
      toast.error("AI expansion failed");
    } finally {
      setGenerating(false);
    }
  }, [data.services, data.companyName]);

  const exportPDF = useCallback(async () => {
    if (!data.companyName) { toast.error("Enter company name first"); return; }
    setExporting(true);
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const cfg = TEMPLATES.find(t => t.id === template)!;
      const W = 595, H = 842;
      const pdfDoc = await PDFDocument.create();
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      function hex(h: string) {
        const c = h.replace("#", "");
        return rgb(parseInt(c.slice(0, 2), 16) / 255, parseInt(c.slice(2, 4), 16) / 255, parseInt(c.slice(4, 6), 16) / 255);
      }

      const ac = hex(cfg.accent);
      const white = rgb(1, 1, 1);
      const dark = rgb(0.05, 0.05, 0.05);
      const gray = rgb(0.45, 0.45, 0.45);

      // ── Cover page ─────────────────────────────────────────────────────────
      const cover = pdfDoc.addPage([W, H]);
      cover.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.06, 0.06, 0.06) });
      cover.drawRectangle({ x: 0, y: H - 4, width: W, height: 4, color: ac });
      cover.drawText("COMPANY PROFILE", { x: 50, y: H - 60, size: 8, font: bold, color: ac });
      cover.drawText(data.companyName, { x: 50, y: H - 130, size: 36, font: bold, color: white });
      if (data.tagline) cover.drawText(data.tagline, { x: 50, y: H - 165, size: 14, font: regular, color: rgb(0.8, 0.8, 0.8) });
      cover.drawLine({ start: { x: 50, y: H - 185 }, end: { x: 250, y: H - 185 }, thickness: 2, color: ac });

      // ── Content page ────────────────────────────────────────────────────────
      const page = pdfDoc.addPage([W, H]);
      page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(0.99, 0.99, 0.99) });

      let y = H - 50;

      function drawSection(title: string) {
        page.drawRectangle({ x: 50, y: y - 2, width: W - 100, height: 1.5, color: ac, opacity: 0.3 });
        page.drawText(title.toUpperCase(), { x: 50, y: y + 6, size: 7.5, font: bold, color: ac });
        y -= 20;
      }

      function drawParagraph(text: string, maxWidth = W - 100) {
        const words = text.split(" ");
        let line = "";
        const lineH = 14;
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          const w = regular.widthOfTextAtSize(test, 9);
          if (w > maxWidth && line) {
            if (y < 60) break;
            page.drawText(line, { x: 50, y, size: 9, font: regular, color: gray });
            y -= lineH;
            line = word;
          } else {
            line = test;
          }
        }
        if (line) {
          page.drawText(line, { x: 50, y, size: 9, font: regular, color: gray });
          y -= lineH;
        }
        y -= 8;
      }

      if (data.aboutUs) {
        drawSection("About Us");
        drawParagraph(data.aboutUs);
        y -= 10;
      }

      const activeServices = data.services.filter(s => s.title);
      if (activeServices.length) {
        drawSection("Our Services");
        activeServices.forEach(s => {
          page.drawText(`• ${s.title}`, { x: 50, y, size: 10, font: bold, color: dark });
          y -= 14;
          if (s.description) { drawParagraph(s.description, W - 120); }
          y -= 4;
        });
        y -= 6;
      }

      const activeTeam = data.team.filter(m => m.name);
      if (activeTeam.length) {
        drawSection("Our Team");
        activeTeam.forEach(m => {
          page.drawText(`${m.name}${m.role ? ` — ${m.role}` : ""}`, { x: 50, y, size: 9, font: regular, color: dark });
          y -= 14;
        });
        y -= 10;
      }

      const contacts = [data.phone, data.email, data.website, data.address].filter(Boolean);
      if (contacts.length) {
        drawSection("Contact Us");
        contacts.forEach(c => {
          page.drawText(c, { x: 50, y, size: 9, font: regular, color: gray });
          y -= 13;
        });
      }

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
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
  }, [data, template]);

  const TABS = [
    { id: "company", label: "Company" },
    { id: "services", label: "Services" },
    { id: "team", label: "Team" },
    { id: "contact", label: "Contact" },
  ] as const;

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
              <span className="text-xs font-semibold text-[hsl(var(--foreground))]">Company Profile</span>
            </div>
          </div>
          <Button
            onClick={exportPDF}
            disabled={exporting || !data.companyName}
            className="gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:opacity-90 text-sm"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
        {/* ── Left: Editor ── */}
        <div className="space-y-4">
          {/* Brand Assets */}
          <Collapsible open={brandAssetOpen} onOpenChange={setBrandAssetOpen}>
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-4 hover:bg-[hsl(var(--muted)/0.5)] transition-colors">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={13} className="text-[hsl(var(--gold))]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))]">Brand Assets</span>
                    {logoUrl && <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />}
                  </div>
                  <ChevronDown size={13} className={`text-[hsl(var(--muted-foreground))] transition-transform ${brandAssetOpen ? "rotate-180" : ""}`} />
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
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Template</h3>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${template === t.id ? "border-teal-500 bg-teal-50" : "border-[hsl(var(--border))] hover:border-teal-300"}`}
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
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-all ${activeTab === tab.id ? "bg-white shadow-sm text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5 space-y-4">
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
                    <Button variant="ghost" size="sm" onClick={expandAbout} disabled={generating} className="h-6 text-[10px] gap-1 text-teal-600">
                      {generating ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                      AI Expand
                    </Button>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Textarea value={data.aboutUs} onChange={e => set("aboutUs", e.target.value)} placeholder="Write a short description and click AI Expand..." rows={5} className="flex-1 text-sm resize-none" />
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
                        placeholder="Description..."
                        rows={2}
                        className="flex-1 text-sm resize-none"
                      />
                      <div className="flex flex-col gap-1">
                        <VoiceInputButton onTranscript={t => { const s = [...data.services]; s[i] = { ...s[i], description: t }; set("services", s); }} size="icon" />
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600" onClick={() => expandService(i)} disabled={generating}>
                          <Sparkles size={12} />
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
                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <User size={13} className="text-teal-600" />
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
                  { key: "phone" as const, label: "Phone", placeholder: "+971 4 000 0000", icon: Phone },
                  { key: "email" as const, label: "Email", placeholder: "info@company.com", icon: Mail },
                  { key: "website" as const, label: "Website", placeholder: "www.company.com", icon: Globe },
                  { key: "address" as const, label: "Address", placeholder: "Dubai, UAE", icon: MapPin },
                  { key: "linkedin" as const, label: "LinkedIn", placeholder: "linkedin.com/company/...", icon: Globe },
                  { key: "instagram" as const, label: "Instagram", placeholder: "@company", icon: Globe },
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
          <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[hsl(var(--foreground))]">Live Preview</h2>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-1 rounded-full">A4 Preview (50% scale)</span>
            </div>
            <div className="overflow-y-auto max-h-[700px]">
              <ProfilePreview data={data} template={template} scale={0.55} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
