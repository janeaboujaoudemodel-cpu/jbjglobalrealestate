// ─── Types ────────────────────────────────────────────────────────────────────
export type Tone = "professional" | "confident" | "casual" | "enthusiastic" | "executive";
export type DocType = "cover-letter" | "offer-letter" | "company-letter" | "contract" | "nda" | "hr-letter" | "termination" | "recommendation";

export interface FormData {
  yourName: string;
  yourTitle: string;
  yourEmail: string;
  yourPhone: string;
  jobTitle: string;
  companyName: string;
  skills: string;
  experience: string;
  additionalNotes: string;
  recipientName: string;
}

export interface TemplateConfig {
  id: string;
  label: string;
  accentColor: string;
  headerBg: string;
  textColor: string;
  dividerColor: string;
  bodyFont: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const TEMPLATES: TemplateConfig[] = [
  { id: "classic", label: "Classic", accentColor: "#1e293b", headerBg: "#f8fafc", textColor: "#374151", dividerColor: "#1e293b", bodyFont: "'Georgia', serif" },
  { id: "modern", label: "Modern", accentColor: "#1d4ed8", headerBg: "#eff6ff", textColor: "#1e293b", dividerColor: "#3b82f6", bodyFont: "'Inter', sans-serif" },
  { id: "executive", label: "Executive", accentColor: "#92400e", headerBg: "#fffbeb", textColor: "#1c1917", dividerColor: "#d97706", bodyFont: "'Georgia', serif" },
  { id: "minimal", label: "Minimal", accentColor: "#111827", headerBg: "#ffffff", textColor: "#374151", dividerColor: "#e5e7eb", bodyFont: "'Helvetica Neue', sans-serif" },
  { id: "legal", label: "Legal", accentColor: "#1e3a5f", headerBg: "#f0f4f8", textColor: "#2d3748", dividerColor: "#2b6cb0", bodyFont: "'Times New Roman', serif" },
  { id: "corporate-gold", label: "Corporate Gold", accentColor: "#78571a", headerBg: "#FDFBF7", textColor: "#1c1917", dividerColor: "#c8a45a", bodyFont: "'Playfair Display', serif" },
  { id: "dark", label: "Dark Mode", accentColor: "#e2e8f0", headerBg: "#1a1a2e", textColor: "#e2e8f0", dividerColor: "#4a5568", bodyFont: "'Inter', sans-serif" },
  { id: "royal", label: "Royal", accentColor: "#5b21b6", headerBg: "#faf5ff", textColor: "#1c1917", dividerColor: "#7c3aed", bodyFont: "'Crimson Text', serif" },
];

export const DOC_TYPES: { id: DocType; label: string }[] = [
  { id: "cover-letter", label: "Cover Letter" },
  { id: "offer-letter", label: "Offer Letter" },
  { id: "company-letter", label: "Company Letter" },
  { id: "contract", label: "Contract" },
  { id: "nda", label: "NDA" },
  { id: "hr-letter", label: "HR Letter" },
  { id: "termination", label: "Termination" },
  { id: "recommendation", label: "Recommendation" },
];

export const TONES: { id: Tone; label: string; desc: string }[] = [
  { id: "professional", label: "Professional", desc: "Formal & polished" },
  { id: "confident", label: "Confident", desc: "Direct & assertive" },
  { id: "enthusiastic", label: "Enthusiastic", desc: "Energetic & passionate" },
  { id: "executive", label: "Executive", desc: "Strategic & authoritative" },
  { id: "casual", label: "Casual", desc: "Warm & personable" },
];

export const DIVIDER_STYLES = [
  { id: "solid", label: "Solid" },
  { id: "dashed", label: "Dashed" },
  { id: "double", label: "Double" },
  { id: "gold", label: "Gold" },
];
