import { Building2, Cpu, Palette, Heart, Briefcase, User, Scale, Sparkles, UtensilsCrossed } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface LogoData {
  svgContent: string;
  name: string;
  timestamp: number;
}

export type LogoType = "full" | "wordmark" | "monogram" | "icon";

export type ExportBg = "white" | "black" | "transparent" | "brand" | "custom";

export interface ExportSize {
  label: string;
  width: number;
  height: number;
  category: string;
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

export const EXPORT_SIZES: ExportSize[] = [
  { label: "Favicon 16", width: 16, height: 16, category: "Favicon" },
  { label: "Favicon 32", width: 32, height: 32, category: "Favicon" },
  { label: "Small 64", width: 64, height: 64, category: "Standard" },
  { label: "Medium 128", width: 128, height: 128, category: "Standard" },
  { label: "Medium 256", width: 256, height: 256, category: "Standard" },
  { label: "Large 512", width: 512, height: 512, category: "Standard" },
  { label: "Large 1024", width: 1024, height: 1024, category: "Standard" },
  { label: "Instagram 1080", width: 1080, height: 1080, category: "Social" },
  { label: "FB Profile 180", width: 180, height: 180, category: "Social" },
  { label: "FB Cover 820×312", width: 820, height: 312, category: "Social" },
  { label: "LinkedIn 1584×396", width: 1584, height: 396, category: "Social" },
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

// ─── Recolor SVG (client-side, no AI call) ────────────────────────────────────
export function recolorSVG(svgContent: string, oldColors: { primary: string; secondary: string; accent: string }, newColors: { primary: string; secondary: string; accent: string }): string {
  let result = svgContent;
  // Replace old hex colors with new ones (case-insensitive)
  if (oldColors.primary && newColors.primary) {
    result = result.replace(new RegExp(escapeRegex(oldColors.primary), "gi"), newColors.primary);
  }
  if (oldColors.secondary && newColors.secondary) {
    result = result.replace(new RegExp(escapeRegex(oldColors.secondary), "gi"), newColors.secondary);
  }
  if (oldColors.accent && newColors.accent) {
    result = result.replace(new RegExp(escapeRegex(oldColors.accent), "gi"), newColors.accent);
  }
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── Auto-contrast: ensure logo is visible on dark backgrounds ────────────────
export function getContrastColors(bgColor: string, colors: { primary: string; secondary: string; accent: string }): { primary: string; secondary: string; accent: string } {
  const lum = getLuminance(bgColor);
  if (lum > 0.4) return colors; // Light bg — no changes needed
  // Dark bg — ensure text/secondary is light
  return {
    primary: getLuminance(colors.primary) < 0.3 ? invertForContrast(colors.primary) : colors.primary,
    secondary: getLuminance(colors.secondary) < 0.3 ? "#ffffff" : colors.secondary,
    accent: getLuminance(colors.accent) < 0.3 ? lightenColor(colors.accent) : colors.accent,
  };
}

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function invertForContrast(hex: string): string {
  const r = 255 - parseInt(hex.slice(1, 3), 16);
  const g = 255 - parseInt(hex.slice(3, 5), 16);
  const b = 255 - parseInt(hex.slice(5, 7), 16);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function lightenColor(hex: string): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 120);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 120);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 120);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ─── PNG helper (FIXED: proper full-canvas background fill) ───────────────────
export function svgToPng(svgContent: string, width: number, height?: number, bgColor?: string): Promise<Blob> {
  const h = height || width;
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      // FIXED: Always fill the ENTIRE canvas with bg color first
      if (bgColor) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, h);
      }
      // Draw SVG centered and covering the canvas
      const scale = Math.min(width / img.naturalWidth, h / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const offsetX = (width - drawW) / 2;
      const offsetY = (h - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      canvas.toBlob(
        b => { URL.revokeObjectURL(url); if (b) resolve(b); else reject(new Error("toBlob failed")); },
        "image/png"
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load failed")); };
    img.src = url;
  });
}

// ─── JPG helper ───────────────────────────────────────────────────────────────
export function svgToJpg(svgContent: string, width: number, height?: number, bgColor = "#ffffff"): Promise<Blob> {
  const h = height || width;
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, h);
      const scale = Math.min(width / img.naturalWidth, h / img.naturalHeight);
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const offsetX = (width - drawW) / 2;
      const offsetY = (h - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      canvas.toBlob(
        b => { URL.revokeObjectURL(url); if (b) resolve(b); else reject(new Error("toBlob failed")); },
        "image/jpeg",
        0.95
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load failed")); };
    img.src = url;
  });
}

// ─── Download trigger (FIXED: append to DOM for all browsers) ─────────────────
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Cleanup after a tick
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// ─── HEX ↔ RGB ↔ HSL converters ──────────────────────────────────────────────
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { r: rr, g: gg, b: bb } = hexToRgb(hex);
  const r = rr / 255, g = gg / 255, b = bb / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
