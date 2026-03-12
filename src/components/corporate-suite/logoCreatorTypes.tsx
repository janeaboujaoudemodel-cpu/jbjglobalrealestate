import { Building2, Cpu, Palette, Heart, Briefcase, User, Scale, Sparkles, UtensilsCrossed } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface LogoData {
  svgContent: string;
  name: string;
  timestamp: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
export const INDUSTRIES = [
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

export const STYLES = [
  { id: "modern",     label: "Modern",     desc: "Clean lines, geometric" },
  { id: "minimalist", label: "Minimalist", desc: "Simple, negative space" },
  { id: "bold",       label: "Bold",       desc: "Strong, impactful" },
  { id: "vintage",    label: "Vintage",    desc: "Classic, timeless" },
  { id: "luxury",     label: "Luxury",     desc: "Premium, sophisticated" },
  { id: "playful",    label: "Playful",    desc: "Fun, energetic" },
];

export const COLOR_PRESETS = [
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

export const FONTS = [
  { value: "Georgia, serif",        label: "Serif",        desc: "Classic, premium" },
  { value: "Arial, sans-serif",     label: "Sans-serif",   desc: "Modern, clean" },
  { value: "Courier New, monospace",label: "Monospace",    desc: "Tech, coding" },
  { value: "Palatino, serif",       label: "Script",       desc: "Creative, fashion" },
  { value: "Georgia, serif",        label: "Editorial",    desc: "Magazine, bold" },
  { value: "Arial, sans-serif",     label: "Corporate",    desc: "Structured, formal" },
];

// ─── SVG Logo Renderer ────────────────────────────────────────────────────────
export function LogoPreview({ svgContent, size = 200 }: { svgContent: string; size?: number }) {
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
export function placeholderSVG(name: string, primary: string, secondary: string): string {
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
export function svgToPng(svgContent: string, size: number, bgColor?: string): Promise<Blob> {
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
