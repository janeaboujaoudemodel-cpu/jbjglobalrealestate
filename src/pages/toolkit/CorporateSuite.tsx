import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Stamp, CreditCard, FileText, FileEdit, Globe, Presentation,
  ArrowRight, Sparkles, ChevronRight, LayoutGrid, ImageIcon,
  Building2, PenLine, ScanLine, Table2, FolderOpen, Zap,
} from "lucide-react";

const tools = [
  {
    id: "stamp",
    title: "Company Stamp",
    subtitle: "AI-generated official seals",
    description: "Create professional Arabic/English company stamps from your trade license. Gemini Vision extraction, 14+ fonts, PDF/PNG export.",
    icon: Stamp,
    href: "/toolkit/stamp-generator",
    badge: "AI",
    accentColor: "#B8943E",
  },
  {
    id: "business-card",
    title: "Business Card",
    subtitle: "Visual card designer + AI extract",
    description: "Design stunning business cards with 6 templates, AI smart extractor from photo, live 3.5\"×2\" preview and PDF export.",
    icon: CreditCard,
    href: "/toolkit/corporate-suite/business-card",
    badge: "AI",
    accentColor: "#5B8DEF",
  },
  {
    id: "cv-resume",
    title: "CV / Resume",
    subtitle: "AI resume builder + extract",
    description: "Build a professional CV with AI-generated summary, 12 executive templates, upload-to-extract mode and PDF export.",
    icon: FileText,
    href: "/toolkit/corporate-suite/cv-resume",
    badge: "AI",
    accentColor: "#34D399",
  },
  {
    id: "cover-letter",
    title: "Cover Letter",
    subtitle: "AI cover letter + extract",
    description: "Generate tailored cover letters with Gemini AI. Upload existing letter to extract and redesign. 3 layouts, export as PDF.",
    icon: FileEdit,
    href: "/toolkit/corporate-suite/cover-letter",
    badge: "AI",
    accentColor: "#A78BFA",
  },
  {
    id: "logo-creator",
    title: "Logo Creator",
    subtitle: "AI logo generator",
    description: "Generate professional logos using AI. Choose industry tone, style, and colors. Export PNG & SVG. Regenerate with one click.",
    icon: ImageIcon,
    href: "/toolkit/corporate-suite/logo-creator",
    badge: "AI",
    accentColor: "#F97316",
  },
  {
    id: "company-profile",
    title: "Company Profile",
    subtitle: "AI profile builder",
    description: "Build a multi-page company profile PDF with AI-expanded content. 3 premium templates, team, services, and contact sections.",
    icon: Building2,
    href: "/toolkit/corporate-suite/company-profile",
    badge: "AI",
    accentColor: "#14B8A6",
  },
  {
    id: "presentation",
    title: "Presentation",
    subtitle: "Slide deck creator",
    description: "Build professional slide decks with Canva-style templates, AI-generated content and slide-by-slide editing. Export to PDF.",
    icon: Presentation,
    href: "/presentations",
    badge: "Pro",
    accentColor: "#F43F5E",
  },
  {
    id: "landing-page",
    title: "Landing Page",
    subtitle: "One-page site builder",
    description: "Create a one-page business site with custom branding. Includes DNS A-record & CNAME connection guide. Export as HTML.",
    icon: Globe,
    href: "/toolkit/corporate-suite/landing-page",
    badge: "New",
    accentColor: "#06B6D4",
  },
  {
    id: "e-sign",
    title: "E-Sign / DocuSign",
    subtitle: "Digital signature workflow",
    description: "Send documents for signature with multi-signer workflows, AI auto-detect fields, audit trail PDF, and reminder system.",
    icon: PenLine,
    href: "/e-signature",
    badge: "Pro",
    accentColor: "#6366F1",
  },
  {
    id: "scan-sign",
    title: "Scan & Sign",
    subtitle: "Document scanning + signing",
    description: "Scan physical documents, sign digitally, and export as PDF. AI-powered document processing and signature placement.",
    icon: ScanLine,
    href: "/document-scanner",
    badge: "AI",
    accentColor: "#64748B",
  },
  {
    id: "spreadsheet",
    title: "Spreadsheet",
    subtitle: "Smart spreadsheet tool",
    description: "Create and edit spreadsheets with formula support, export to Excel/CSV. Fully featured data management tool.",
    icon: Table2,
    href: "/spreadsheet",
    badge: "Pro",
    accentColor: "#22C55E",
  },
  {
    id: "documents",
    title: "Documents",
    subtitle: "Document management",
    description: "Create, store and manage your business documents. Rich text editor with export capabilities and version history.",
    icon: FolderOpen,
    href: "/documents",
    badge: "Pro",
    accentColor: "#C9A84C",
  },
];

export default function CorporateSuite() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FDFBF7 0%, #F5EFE3 50%, #EDE4D3 100%)" }}>
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden" style={{ borderBottom: "1px solid rgba(184,148,62,0.25)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 10% 50%, rgba(184,148,62,0.08) 0%, transparent 70%)" }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(184,148,62,0.4), transparent)" }} />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-8 pt-28 sm:pt-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] mb-6 select-none" style={{ color: "rgba(0,0,0,0.4)" }}>
            <LayoutGrid size={11} />
            <span>Toolkit</span>
            <ChevronRight size={10} />
            <span className="font-medium" style={{ color: "#1A1A1A" }}>Corporate Premium Suite</span>
          </div>

          <div className="flex items-start gap-5">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl"
              style={{
                background: "linear-gradient(135deg, #D4C4A8, #B8943E)",
                boxShadow: "0 0 40px rgba(184,148,62,0.25)",
              }}
            >
              <Sparkles size={28} className="text-white" />
            </div>

            {/* Text */}
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: "#B8943E" }}>
                  JBJ Toolkit
                </p>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                  style={{ background: "rgba(184,148,62,0.12)", border: "1px solid rgba(184,148,62,0.3)", color: "#B8943E" }}
                >
                  Premium
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{ color: "#1A1A1A" }}>
                Corporate Premium <span style={{ color: "#B8943E" }}>Suite</span>
              </h1>
              <p className="mt-2 text-sm max-w-2xl leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>
                12 professional tools — stamps, business cards, CVs, logos, company profiles, e-signatures,
                spreadsheets and more. All AI-powered, all in one place.
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-8 flex flex-wrap gap-6">
            {[
              { label: "Tools", value: "12" },
              { label: "AI-Powered", value: "8" },
              { label: "Export formats", value: "PDF, PNG, SVG, HTML" },
            ].map(s => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="text-xl font-bold" style={{ color: "#1A1A1A" }}>{s.value}</span>
                <span className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tools Grid ── */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
                onClick={() => navigate(tool.href)}
                className="group text-left rounded-2xl shadow-md transition-all duration-300 overflow-hidden focus:outline-none hover:-translate-y-0.5 h-full flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(184,148,62,0.18)",
                  boxShadow: "0 2px 12px rgba(184,148,62,0.06)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(184,148,62,0.18)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(184,148,62,0.4)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(184,148,62,0.06)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(184,148,62,0.18)";
                }}
              >
                {/* Top accent bar */}
                <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${tool.accentColor}, ${tool.accentColor}80)` }} />

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + Badge row */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${tool.accentColor}20, ${tool.accentColor}08)`,
                        border: `1px solid ${tool.accentColor}30`,
                      }}
                    >
                      <Icon size={22} style={{ color: tool.accentColor }} />
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{
                        background: `${tool.accentColor}15`,
                        border: `1px solid ${tool.accentColor}30`,
                        color: tool.accentColor,
                      }}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[15px] leading-tight" style={{ color: "#1A1A1A" }}>
                    {tool.title}
                  </h3>
                  <p className="text-xs font-semibold mt-0.5 mb-3" style={{ color: "#B8943E" }}>
                    {tool.subtitle}
                  </p>
                  <p className="text-xs leading-relaxed flex-1" style={{ color: "rgba(0,0,0,0.5)" }}>
                    {tool.description}
                  </p>

                  {/* CTA — pinned to bottom */}
                  <div
                    className="mt-5 flex items-center gap-1.5 text-xs font-semibold transition-colors group-hover:text-[#B8943E]"
                    style={{ color: "rgba(184,148,62,0.6)" }}
                  >
                    Open Tool
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform duration-200" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-2 mt-10">
          <Zap size={12} style={{ color: "rgba(184,148,62,0.35)" }} />
          <p className="text-center text-[11px]" style={{ color: "rgba(0,0,0,0.35)" }}>
            All tools run securely in your browser. Files are exported locally — nothing leaves your device.
          </p>
        </div>
      </div>
    </div>
  );
}
