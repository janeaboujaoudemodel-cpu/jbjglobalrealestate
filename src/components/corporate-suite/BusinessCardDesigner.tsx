import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download, CreditCard, Phone, Mail, Globe, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Template = "modern" | "classic" | "minimal" | "bold" | "creative" | "corporate";

interface CardData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
}

const TEMPLATES: { id: Template; label: string }[] = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
  { id: "creative", label: "Creative" },
  { id: "corporate", label: "Corporate" },
];

const COLOR_PRESETS = [
  { primary: "#C8A766", secondary: "#1a1a1a", label: "Gold" },
  { primary: "#1e40af", secondary: "#ffffff", label: "Navy" },
  { primary: "#0f766e", secondary: "#ffffff", label: "Teal" },
  { primary: "#7c3aed", secondary: "#ffffff", label: "Purple" },
  { primary: "#be123c", secondary: "#ffffff", label: "Crimson" },
  { primary: "#334155", secondary: "#ffffff", label: "Slate" },
];

function BusinessCardPreview({ data, template, primary, secondary }: {
  data: CardData; template: Template; primary: string; secondary: string;
}) {
  const name = data.name || "Your Name";
  const title = data.title || "Job Title";
  const company = data.company || "Company Name";

  if (template === "modern") {
    return (
      <div className="w-full aspect-[1.75] rounded-xl overflow-hidden shadow-2xl" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }}>
        <div className="h-full flex flex-col justify-between p-5" style={{ color: secondary }}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest opacity-70">{company}</p>
            <h2 className="text-lg font-bold mt-1">{name}</h2>
            <p className="text-sm opacity-80">{title}</p>
          </div>
          <div className="space-y-0.5 text-xs opacity-80">
            {data.phone && <p>📞 {data.phone}</p>}
            {data.email && <p>✉ {data.email}</p>}
            {data.website && <p>🌐 {data.website}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (template === "classic") {
    return (
      <div className="w-full aspect-[1.75] rounded-xl overflow-hidden shadow-2xl bg-white border-2" style={{ borderColor: primary }}>
        <div className="h-full flex">
          <div className="w-2" style={{ background: primary }} />
          <div className="flex-1 flex flex-col justify-between p-5">
            <div>
              <h2 className="text-lg font-bold" style={{ color: primary }}>{name}</h2>
              <p className="text-sm text-gray-600">{title}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">{company}</p>
            </div>
            <div className="space-y-0.5 text-xs text-gray-500">
              {data.phone && <p>{data.phone}</p>}
              {data.email && <p>{data.email}</p>}
              {data.website && <p>{data.website}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template === "minimal") {
    return (
      <div className="w-full aspect-[1.75] rounded-xl overflow-hidden shadow-2xl bg-white">
        <div className="h-full flex flex-col justify-center p-6">
          <h2 className="text-xl font-light tracking-wide text-gray-900">{name}</h2>
          <div className="h-px w-8 my-2" style={{ background: primary }} />
          <p className="text-sm text-gray-500">{title} · {company}</p>
          <div className="mt-3 text-xs text-gray-400 space-y-0.5">
            {data.email && <p>{data.email}</p>}
            {data.phone && <p>{data.phone}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (template === "bold") {
    return (
      <div className="w-full aspect-[1.75] rounded-xl overflow-hidden shadow-2xl" style={{ background: "#111" }}>
        <div className="h-full flex flex-col justify-between p-5">
          <div style={{ color: primary }}>
            <h2 className="text-xl font-black uppercase tracking-tight">{name}</h2>
            <p className="text-xs font-bold uppercase tracking-widest opacity-70 mt-0.5">{title}</p>
          </div>
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">{company}</p>
            <div className="text-xs text-white/60 space-y-0.5">
              {data.phone && <p>{data.phone}</p>}
              {data.email && <p>{data.email}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (template === "creative") {
    return (
      <div className="w-full aspect-[1.75] rounded-xl overflow-hidden shadow-2xl bg-white">
        <div className="h-full relative flex items-center p-5">
          <div className="absolute right-0 top-0 bottom-0 w-2/5 rounded-l-full" style={{ background: `${primary}22` }} />
          <div className="relative z-10 flex-1">
            <div className="w-10 h-10 rounded-full mb-2 flex items-center justify-center text-white text-sm font-bold" style={{ background: primary }}>
              {name.charAt(0)}
            </div>
            <h2 className="text-base font-bold text-gray-900">{name}</h2>
            <p className="text-xs" style={{ color: primary }}>{title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{company}</p>
            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
              {data.email && <p>{data.email}</p>}
              {data.phone && <p>{data.phone}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // corporate
  return (
    <div className="w-full aspect-[1.75] rounded-xl overflow-hidden shadow-2xl" style={{ background: primary }}>
      <div className="h-full flex flex-col" style={{ color: secondary }}>
        <div className="flex-1 flex items-center px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{company}</p>
            <h2 className="text-xl font-bold mt-1">{name}</h2>
            <p className="text-sm opacity-80">{title}</p>
          </div>
        </div>
        <div className="border-t border-white/20 px-6 py-3 flex gap-4 text-xs opacity-75">
          {data.phone && <span>{data.phone}</span>}
          {data.email && <span>{data.email}</span>}
          {data.website && <span>{data.website}</span>}
        </div>
      </div>
    </div>
  );
}

export default function BusinessCardDesigner() {
  const navigate = useNavigate();
  const [template, setTemplate] = useState<Template>("modern");
  const [colorIdx, setColorIdx] = useState(0);
  const [data, setData] = useState<CardData>({
    name: "", title: "", company: "", phone: "", email: "", website: "", address: "",
  });

  const primary = COLOR_PRESETS[colorIdx].primary;
  const secondary = COLOR_PRESETS[colorIdx].secondary;

  const set = (k: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, [k]: e.target.value }));

  const exportPNG = async () => {
    toast.info("Tip: Use browser print (Ctrl+P) → Save as PDF to export your card.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* Header */}
      <div className="border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/toolkit/corporate-suite")} className="gap-1.5">
              <ArrowLeft size={15} /> Back
            </Button>
            <div className="w-px h-5 bg-[hsl(var(--border))]" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <CreditCard size={15} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--foreground))] text-sm">Business Card Designer</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Design · Preview · Export</p>
            </div>
          </div>
          <Button onClick={exportPNG} className="gap-2 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 h-8 text-xs">
            <Download size={13} /> Export PDF
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Controls */}
        <div className="space-y-6">
          {/* Template picker */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3 block">Template</Label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                    template === t.id
                      ? "border-[hsl(var(--gold))] bg-[hsl(var(--gold)/0.1)] text-[hsl(var(--gold-dark))]"
                      : "border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--gold)/0.5)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3 block">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setColorIdx(i)}
                  title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${colorIdx === i ? "border-[hsl(var(--foreground))] scale-110" : "border-transparent"}`}
                  style={{ background: c.primary }}
                />
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block">Card Information</Label>
            {[
              { key: "name" as const, label: "Full Name", icon: <span className="text-[hsl(var(--muted-foreground))]">👤</span>, placeholder: "Ahmed Al-Mansoori" },
              { key: "title" as const, label: "Job Title", icon: <Building2 size={13} className="text-[hsl(var(--muted-foreground))]" />, placeholder: "Senior Real Estate Consultant" },
              { key: "company" as const, label: "Company", icon: <Building2 size={13} className="text-[hsl(var(--muted-foreground))]" />, placeholder: "JBJ Global Real Estate" },
              { key: "phone" as const, label: "Phone", icon: <Phone size={13} className="text-[hsl(var(--muted-foreground))]" />, placeholder: "+971 50 123 4567" },
              { key: "email" as const, label: "Email", icon: <Mail size={13} className="text-[hsl(var(--muted-foreground))]" />, placeholder: "ahmed@company.ae" },
              { key: "website" as const, label: "Website", icon: <Globe size={13} className="text-[hsl(var(--muted-foreground))]" />, placeholder: "www.company.ae" },
              { key: "address" as const, label: "Address", icon: <MapPin size={13} className="text-[hsl(var(--muted-foreground))]" />, placeholder: "Dubai, UAE" },
            ].map(f => (
              <div key={f.key}>
                <Label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">{f.label}</Label>
                <Input value={data[f.key]} onChange={set(f.key)} placeholder={f.placeholder} className="h-9 text-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block">Live Preview</Label>
          <motion.div
            key={`${template}-${colorIdx}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="max-w-sm mx-auto"
          >
            <BusinessCardPreview data={data} template={template} primary={primary} secondary={secondary} />
          </motion.div>

          <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
            3.5" × 2" standard business card ratio
          </p>

          {/* Back of card preview */}
          <div className="max-w-sm mx-auto">
            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2 block">Back Side</Label>
            <div className="w-full aspect-[1.75] rounded-xl overflow-hidden shadow-lg flex items-center justify-center" style={{ background: primary }}>
              <div className="text-center" style={{ color: secondary }}>
                <p className="text-lg font-bold opacity-20 uppercase tracking-widest">{data.company || "Company"}</p>
              </div>
            </div>
          </div>

          <div className="bg-[hsl(var(--muted))] rounded-xl p-4 text-xs text-[hsl(var(--muted-foreground))] space-y-1">
            <p className="font-semibold text-[hsl(var(--foreground))]">💡 Export Tip</p>
            <p>To export as PDF: Use your browser's Print function (Ctrl+P or Cmd+P) and select "Save as PDF". Set paper to Custom 89×51mm (3.5"×2") for exact business card size.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
