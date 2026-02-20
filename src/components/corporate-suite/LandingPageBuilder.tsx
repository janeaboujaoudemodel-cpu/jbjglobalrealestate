import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Globe, Download, ExternalLink, Server, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface LPData {
  businessName: string;
  tagline: string;
  description: string;
  services: string;
  phone: string;
  email: string;
  address: string;
  primaryColor: string;
  bgColor: string;
}

const COLOR_PRESETS = [
  { primary: "#C8A766", bg: "#1a1a1a", label: "Gold Dark" },
  { primary: "#1e40af", bg: "#f0f4ff", label: "Blue Light" },
  { primary: "#0f766e", bg: "#f0fdfb", label: "Teal Light" },
  { primary: "#7c3aed", bg: "#faf5ff", label: "Purple Light" },
  { primary: "#be123c", bg: "#fff1f2", label: "Rose Light" },
];

function LandingPreview({ data }: { data: LPData }) {
  const services = data.services.split(",").map(s => s.trim()).filter(Boolean);
  return (
    <div className="rounded-xl overflow-hidden shadow-2xl text-sm" style={{ background: data.bgColor || "#f9fafb", fontFamily: "system-ui, sans-serif" }}>
      {/* Nav */}
      <div className="px-6 py-3 flex items-center justify-between" style={{ background: data.primaryColor }}>
        <span className="font-bold text-white text-sm">{data.businessName || "Business Name"}</span>
        <div className="flex gap-3 text-white/80 text-xs">
          <span>About</span><span>Services</span><span>Contact</span>
        </div>
      </div>

      {/* Hero */}
      <div className="px-6 py-10 text-center" style={{ background: `${data.primaryColor}18` }}>
        <h1 className="text-2xl font-black" style={{ color: data.primaryColor }}>{data.businessName || "Your Business Name"}</h1>
        <p className="text-base text-gray-600 mt-2 max-w-sm mx-auto">{data.tagline || "Your compelling tagline goes here"}</p>
        <p className="text-xs text-gray-500 mt-3 max-w-md mx-auto">{data.description || "A brief description of your business and what makes you unique."}</p>
        <button className="mt-4 px-5 py-2 rounded-full text-white text-xs font-semibold" style={{ background: data.primaryColor }}>
          Get In Touch →
        </button>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="px-6 py-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-center mb-4" style={{ color: data.primaryColor }}>Our Services</h2>
          <div className="grid grid-cols-2 gap-2">
            {services.slice(0, 4).map((s, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border text-xs text-gray-700 font-medium shadow-sm">{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* Contact */}
      <div className="px-6 py-5 border-t border-gray-100">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 justify-center">
          {data.phone && <span>Phone: {data.phone}</span>}
          {data.email && <span>Email: {data.email}</span>}
          {data.address && <span>Address: {data.address}</span>}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-2 text-center text-[10px] text-white" style={{ background: data.primaryColor }}>
        © 2025 {data.businessName || "Business Name"} · All rights reserved
      </div>
    </div>
  );
}

export default function LandingPageBuilder() {
  const navigate = useNavigate();
  const [colorIdx, setColorIdx] = useState(1);
  const [data, setData] = useState<LPData>({
    businessName: "", tagline: "", description: "", services: "",
    phone: "", email: "", address: "",
    primaryColor: COLOR_PRESETS[1].primary,
    bgColor: COLOR_PRESETS[1].bg,
  });

  const set = (k: keyof LPData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setData(prev => ({ ...prev, [k]: e.target.value }));

  const applyPreset = (i: number) => {
    setColorIdx(i);
    setData(prev => ({ ...prev, primaryColor: COLOR_PRESETS[i].primary, bgColor: COLOR_PRESETS[i].bg }));
  };

  const exportHTML = () => {
    const services = data.services.split(",").map(s => s.trim()).filter(Boolean);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${data.businessName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; font-family:system-ui,sans-serif; }
  body { background:${data.bgColor}; }
  nav { background:${data.primaryColor}; padding:12px 24px; display:flex; justify-content:space-between; align-items:center; }
  nav span { color:white; font-weight:700; }
  nav div a { color:rgba(255,255,255,0.8); text-decoration:none; margin-left:16px; font-size:13px; }
  .hero { padding:60px 24px; text-align:center; background:${data.primaryColor}18; }
  .hero h1 { font-size:2.2rem; font-weight:900; color:${data.primaryColor}; }
  .hero p { color:#4b5563; margin-top:12px; max-width:500px; margin-left:auto; margin-right:auto; }
  .cta { display:inline-block; margin-top:20px; padding:10px 24px; background:${data.primaryColor}; color:white; border-radius:999px; text-decoration:none; font-weight:600; }
  .services { padding:40px 24px; max-width:800px; margin:0 auto; }
  .services h2 { text-align:center; color:${data.primaryColor}; font-size:.8rem; letter-spacing:.1em; text-transform:uppercase; margin-bottom:20px; }
  .services-grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:12px; }
  .service-card { background:white; border-radius:8px; padding:12px; border:1px solid #e5e7eb; font-size:.85rem; }
  .contact { padding:20px 24px; text-align:center; color:#6b7280; font-size:.8rem; border-top:1px solid #f3f4f6; }
  .contact span { margin:0 8px; }
  footer { background:${data.primaryColor}; color:white; text-align:center; padding:8px; font-size:.75rem; }
</style>
</head>
<body>
<nav><span>${data.businessName}</span><div><a href="#">About</a><a href="#">Services</a><a href="#">Contact</a></div></nav>
<div class="hero">
  <h1>${data.businessName}</h1>
  <p style="font-size:1.1rem;margin-top:8px">${data.tagline}</p>
  <p style="font-size:.9rem;margin-top:12px;color:#6b7280">${data.description}</p>
  <a href="mailto:${data.email}" class="cta">Get In Touch →</a>
</div>
${services.length ? `<div class="services"><h2>Our Services</h2><div class="services-grid">${services.map(s => `<div class="service-card">${s}</div>`).join("")}</div></div>` : ""}
<div class="contact">
  ${data.phone ? `<span>Phone: ${data.phone}</span>` : ""}
  ${data.email ? `<span>Email: ${data.email}</span>` : ""}
  ${data.address ? `<span>Address: ${data.address}</span>` : ""}
</div>
<footer>© 2025 ${data.businessName} · All rights reserved</footer>
</body>
</html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${data.businessName || "landing-page"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML file downloaded!");
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center">
              <Globe size={15} className="text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[hsl(var(--foreground))] text-sm">Landing Page Builder</h1>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Build · Preview · Export HTML + DNS Guide</p>
            </div>
          </div>
          <Button onClick={exportHTML} className="gap-2 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] text-white hover:opacity-90 h-8 text-xs">
            <Download size={13} /> Export HTML
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-5">
          {/* Colors */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3 block">Color Theme</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map((c, i) => (
                <button key={i} onClick={() => applyPreset(i)} title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${colorIdx === i ? "border-[hsl(var(--foreground))] scale-110" : "border-transparent"}`}
                  style={{ background: c.primary }} />
              ))}
            </div>
          </div>

          {/* Business Info */}
          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Business Information</p>
            <div><Label className="text-xs mb-1 block">Business Name</Label><Input value={data.businessName} onChange={set("businessName")} placeholder="e.g. Acme Corporation" className="h-8 text-xs" /></div>
            <div><Label className="text-xs mb-1 block">Tagline</Label><Input value={data.tagline} onChange={set("tagline")} placeholder="Your Premier Real Estate Partner in Dubai" className="h-8 text-xs" /></div>
            <div><Label className="text-xs mb-1 block">Description</Label><Textarea value={data.description} onChange={set("description")} placeholder="Tell visitors what makes your business unique…" className="text-xs min-h-[70px]" /></div>
            <div><Label className="text-xs mb-1 block">Services (comma-separated)</Label><Input value={data.services} onChange={set("services")} placeholder="Buying, Selling, Rentals, Property Management, Investment" className="h-8 text-xs" /></div>
          </div>

          <div className="bg-white rounded-xl border border-[hsl(var(--border))] p-4 space-y-3">
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">Contact Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs mb-1 block">Phone</Label><Input value={data.phone} onChange={set("phone")} placeholder="+971 4 000 0000" className="h-8 text-xs" /></div>
              <div><Label className="text-xs mb-1 block">Email</Label><Input value={data.email} onChange={set("email")} placeholder="info@business.ae" className="h-8 text-xs" /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Address</Label><Input value={data.address} onChange={set("address")} placeholder="Business Bay, Dubai, UAE" className="h-8 text-xs" /></div>
          </div>

          {/* DNS Guide */}
          <div className="bg-[hsl(var(--muted))] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Server size={14} className="text-[hsl(var(--gold-dark))]" />
              <p className="text-xs font-semibold text-[hsl(var(--foreground))]">How to Connect Your Domain</p>
            </div>
            <div className="space-y-2 text-xs text-[hsl(var(--muted-foreground))]">
              <p className="font-medium text-[hsl(var(--foreground))]">After downloading the HTML file:</p>
              <ol className="list-decimal list-inside space-y-1.5 ml-1">
                <li>Upload the HTML file to a web host (e.g., Netlify, GitHub Pages, or cPanel)</li>
                <li>Get your host's <strong className="text-[hsl(var(--foreground))]">IP address</strong> or <strong className="text-[hsl(var(--foreground))]">CNAME</strong></li>
                <li>Log in to your domain registrar (GoDaddy, Namecheap, etc.)</li>
                <li>Go to <strong className="text-[hsl(var(--foreground))]">DNS Settings</strong> → Add Record:
                  <div className="mt-1 bg-white/60 rounded-lg p-2 font-mono text-[10px] space-y-1">
                    <p><span className="text-blue-600">A Record</span>: @ → your-host-IP-address</p>
                    <p><span className="text-emerald-600">CNAME</span>: www → your-subdomain.host.com</p>
                  </div>
                </li>
                <li>Wait 24-48 hours for DNS propagation</li>
              </ol>
              <div className="flex items-start gap-1.5 mt-2 bg-amber-50 rounded-lg p-2">
                <Info size={11} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700">For UAE businesses: Popular hosts include SiteGround, Hostinger, and Bluehost — all support Arabic sites and accept AED payments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Label className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] block">Live Preview</Label>
          <motion.div key={colorIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            <LandingPreview data={data} />
          </motion.div>
          <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">Click "Export HTML" to download your one-page website</p>
        </div>
      </div>
    </div>
  );
}
