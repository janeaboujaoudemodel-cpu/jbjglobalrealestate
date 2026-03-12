// ─── QR helpers ──────────────────────────────────────────────────────────────
export function buildCVQrData(data: { name: string; title: string; email: string; phone: string; website: string; location: string }): string {
  return [
    "BEGIN:VCARD", "VERSION:3.0",
    `FN:${data.name}`,
    data.title    && `TITLE:${data.title}`,
    data.email    && `EMAIL:${data.email}`,
    data.phone    && `TEL:${data.phone}`,
    data.website  && `URL:${data.website}`,
    data.location && `ADR:;;${data.location};;;;`,
    "END:VCARD",
  ].filter(Boolean).join("\n");
}

export function buildCVQrUrl(qrData: string, color: string, size: number): string {
  const colorHex = color.replace("#", "");
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(qrData)}&color=${colorHex}&bgcolor=ffffff&margin=2`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type Template =
  | "executive" | "modern" | "classic" | "creative"
  | "harvard"   | "ats"    | "timeline" | "twocol"
  | "minimal"   | "bold"   | "europass" | "academic";

export interface Experience { title: string; company: string; period: string; description: string }
export interface Education  { degree: string; institution: string; year: string }
export interface SocialLink { label: string; url: string }

export interface CVData {
  name: string; title: string; email: string; phone: string;
  location: string; linkedin: string; website: string;
  github: string; portfolio: string;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string; languages: string;
  certifications: string;
  socialLinks: SocialLink[];
  photoUrl: string;
}

// ─── Template config ──────────────────────────────────────────────────────────
export const TEMPLATES: { id: Template; label: string; desc: string; accent: string; bg: string; category: string }[] = [
  { id: "executive", label: "Executive",  desc: "Dark sidebar + serif",      accent: "#1e293b", bg: "#f8fafc", category: "Classic" },
  { id: "modern",    label: "Modern",     desc: "Blue header + clean",        accent: "#1e40af", bg: "#ffffff", category: "Classic" },
  { id: "classic",   label: "Classic",    desc: "Centered monochrome",        accent: "#111827", bg: "#fafafa", category: "Classic" },
  { id: "creative",  label: "Creative",   desc: "Violet + bold typography",   accent: "#6d28d9", bg: "#fdf4ff", category: "Creative" },
  { id: "harvard",   label: "Harvard",    desc: "ATS-safe serif format",      accent: "#8b0000", bg: "#ffffff", category: "Academic" },
  { id: "ats",       label: "ATS Clean",  desc: "Pure ATS-optimised layout",  accent: "#1f2937", bg: "#ffffff", category: "Professional" },
  { id: "timeline",  label: "Timeline",   desc: "Vertical timeline sidebar",  accent: "#0f766e", bg: "#f0fdfa", category: "Creative" },
  { id: "twocol",    label: "Two Column", desc: "Split-column layout",        accent: "#7c3aed", bg: "#ffffff", category: "Professional" },
  { id: "minimal",   label: "Minimalist", desc: "Ultra-clean whitespace",     accent: "#374151", bg: "#ffffff", category: "Minimal" },
  { id: "bold",      label: "Bold Pro",   desc: "High-impact header block",   accent: "#dc2626", bg: "#ffffff", category: "Creative" },
  { id: "europass",  label: "Europass",   desc: "EU standard format",         accent: "#003399", bg: "#f7f9ff", category: "International" },
  { id: "academic",  label: "Academic",   desc: "Research & academia style",  accent: "#1e3a5f", bg: "#fffef7", category: "Academic" },
];

export const FONT_FAMILIES = [
  { label: "Helvetica",   value: "'Helvetica Neue', Arial, sans-serif" },
  { label: "Georgia",     value: "Georgia, 'Times New Roman', serif" },
  { label: "Garamond",    value: "Garamond, 'Palatino Linotype', serif" },
  { label: "Courier",     value: "'Courier New', Courier, monospace" },
  { label: "Futura",      value: "'Century Gothic', 'Trebuchet MS', sans-serif" },
  { label: "Roboto",      value: "'Roboto', 'Segoe UI', sans-serif" },
  { label: "Open Sans",   value: "'Open Sans', 'Noto Sans', sans-serif" },
  { label: "Lato",        value: "'Lato', 'Source Sans Pro', sans-serif" },
  { label: "Montserrat",  value: "'Montserrat', 'Century Gothic', sans-serif" },
  { label: "Raleway",     value: "'Raleway', 'Gill Sans', sans-serif" },
  { label: "Playfair",    value: "'Playfair Display', 'Palatino', serif" },
  { label: "Merriweather",value: "'Merriweather', 'Book Antiqua', serif" },
  { label: "Nunito",      value: "'Nunito', 'Varela Round', sans-serif" },
  { label: "Poppins",     value: "'Poppins', 'Futura', sans-serif" },
  { label: "Inter",       value: "'Inter', 'Segoe UI', sans-serif" },
  { label: "Source Code", value: "'Source Code Pro', 'Consolas', monospace" },
  { label: "Crimson",     value: "'Crimson Text', 'Palatino Linotype', serif" },
  { label: "Libre Baskerville", value: "'Libre Baskerville', 'Baskerville', serif" },
  { label: "Ubuntu",      value: "'Ubuntu', 'Trebuchet MS', sans-serif" },
  { label: "Josefin Sans",value: "'Josefin Sans', 'Century Gothic', sans-serif" },
];

export const TEMPLATE_CATEGORIES = ["All", "Classic", "Professional", "Creative", "Minimal", "Academic", "International"];
