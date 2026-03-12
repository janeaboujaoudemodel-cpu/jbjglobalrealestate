// ─── Types ────────────────────────────────────────────────────────────────────
export type Template = "premium" | "executive" | "clean" | "corporate_red" | "modern_green" | "luxury_black" | "cover_letter" | "copyright" | "magazine";
export type LogoPosition = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-right";
export type LogoPageMode = "all" | "cover-only" | "content-only" | "none";

export interface Service { title: string; description: string }
export interface TeamMember { name: string; role: string }

export interface ProfileData {
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

export interface PaletteColor {
  hex: string;
  name: string;
  role: "primary" | "secondary" | "accent" | "background" | "text";
  opacity: number;
}

export interface TemplateConfig {
  id: Template;
  label: string;
  desc: string;
  accent: string;
  coverBg: string;
  contentBg: string;
  coverTextColor: string;
  sectionStyle: "card" | "list" | "underline";
  emoji?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
export const TEMPLATES: TemplateConfig[] = [
  { id: "premium",       label: "Premium Gold",    desc: "Gold accent, dark cover",      accent: "#C8A766", coverBg: "#0a0a0a", contentBg: "#f9f7f3", coverTextColor: "#ffffff", sectionStyle: "card" },
  { id: "executive",     label: "Executive Blue",  desc: "Navy blue, structured",        accent: "#1e3a8a", coverBg: "#1e3a8a", contentBg: "#ffffff", coverTextColor: "#ffffff", sectionStyle: "list" },
  { id: "clean",         label: "Clean White",     desc: "Minimal, professional",        accent: "#374151", coverBg: "#ffffff", contentBg: "#ffffff", coverTextColor: "#111111", sectionStyle: "underline" },
  { id: "corporate_red", label: "Corporate Red",   desc: "Bold red, high impact",        accent: "#dc2626", coverBg: "#7f1d1d", contentBg: "#ffffff", coverTextColor: "#ffffff", sectionStyle: "card" },
  { id: "modern_green",  label: "Modern Green",    desc: "Forest green, eco & trust",    accent: "#16a34a", coverBg: "#14532d", contentBg: "#f0fdf4", coverTextColor: "#ffffff", sectionStyle: "list" },
  { id: "luxury_black",  label: "Luxury Black",    desc: "All-black, silver accents",    accent: "#a1a1aa", coverBg: "#09090b", contentBg: "#18181b", coverTextColor: "#ffffff", sectionStyle: "underline" },
  { id: "cover_letter",  label: "Cover Letter",    desc: "Formal letter format",         accent: "#1d4ed8", coverBg: "#eff6ff", contentBg: "#ffffff", coverTextColor: "#1e3a8a", sectionStyle: "list" },
  { id: "copyright",     label: "Legal / Copyright", desc: "Official document style",   accent: "#292524", coverBg: "#f5f5f4", contentBg: "#fafaf9", coverTextColor: "#1c1917", sectionStyle: "underline" },
  { id: "magazine",      label: "Magazine Style",  desc: "Editorial, full-bleed hero",   accent: "#e11d48", coverBg: "#881337", contentBg: "#ffffff", coverTextColor: "#ffffff", sectionStyle: "card" },
];

export const DEFAULT_PALETTE: PaletteColor[] = [
  { hex: "#1a1a1a", name: "Primary",    role: "primary",    opacity: 100 },
  { hex: "#C8A766", name: "Secondary",  role: "secondary",  opacity: 100 },
  { hex: "#F5F0E6", name: "Accent",     role: "accent",     opacity: 100 },
  { hex: "#ffffff", name: "Background", role: "background", opacity: 100 },
  { hex: "#374151", name: "Text",       role: "text",       opacity: 100 },
];

export const EMPTY_SERVICE: Service = { title: "", description: "" };
export const EMPTY_MEMBER: TeamMember = { name: "", role: "" };

export const LOGO_POSITIONS: { id: LogoPosition; label: string }[] = [
  { id: "top-left",    label: "↖ Top Left"    },
  { id: "top-center",  label: "↑ Top Center"  },
  { id: "top-right",   label: "↗ Top Right"   },
  { id: "bottom-left", label: "↙ Bot Left"    },
  { id: "bottom-right",label: "↘ Bot Right"   },
];

export const LOGO_PAGE_MODES: { id: LogoPageMode; label: string }[] = [
  { id: "all",          label: "All Pages"     },
  { id: "cover-only",   label: "Cover Only"    },
  { id: "content-only", label: "Content Pages" },
  { id: "none",         label: "None"          },
];

// ─── Completion Score ──────────────────────────────────────────────────────────
export function calcScore(data: ProfileData, logoUrl: string): number {
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

export function getScoreItems(data: ProfileData, logoUrl: string) {
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
  else if (svcCount > 0) weaknesses.push("Add descriptions to your services — use AI per service");

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
