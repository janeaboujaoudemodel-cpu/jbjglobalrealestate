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
    badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    gradient: "from-amber-400/20 via-yellow-500/10 to-amber-600/5",
    topBorder: "from-amber-400 to-yellow-500",
    iconBg: "from-amber-400/30 to-yellow-600/20 border border-amber-500/30",
    iconColor: "text-amber-300",
    glow: "hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]",
  },
  {
    id: "business-card",
    title: "Business Card",
    subtitle: "Visual card designer + AI extract",
    description: "Design stunning business cards with 6 templates, AI smart extractor from photo, live 3.5\"×2\" preview and PDF export.",
    icon: CreditCard,
    href: "/toolkit/corporate-suite/business-card",
    badge: "AI",
    badgeColor: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    gradient: "from-blue-500/20 via-indigo-500/10 to-blue-600/5",
    topBorder: "from-blue-400 to-indigo-500",
    iconBg: "from-blue-500/30 to-indigo-600/20 border border-blue-500/30",
    iconColor: "text-blue-300",
    glow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
  },
  {
    id: "cv-resume",
    title: "CV / Resume",
    subtitle: "AI resume builder + extract",
    description: "Build a professional CV with AI-generated summary, 12 executive templates, upload-to-extract mode and PDF export.",
    icon: FileText,
    href: "/toolkit/corporate-suite/cv-resume",
    badge: "AI",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    gradient: "from-emerald-500/20 via-teal-500/10 to-emerald-600/5",
    topBorder: "from-emerald-400 to-teal-500",
    iconBg: "from-emerald-500/30 to-teal-600/20 border border-emerald-500/30",
    iconColor: "text-emerald-300",
    glow: "hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
  },
  {
    id: "cover-letter",
    title: "Cover Letter",
    subtitle: "AI cover letter + extract",
    description: "Generate tailored cover letters with Gemini AI. Upload existing letter to extract and redesign. 3 layouts, export as PDF.",
    icon: FileEdit,
    href: "/toolkit/corporate-suite/cover-letter",
    badge: "AI",
    badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
    gradient: "from-purple-500/20 via-violet-500/10 to-purple-600/5",
    topBorder: "from-purple-400 to-violet-500",
    iconBg: "from-purple-500/30 to-violet-600/20 border border-purple-500/30",
    iconColor: "text-purple-300",
    glow: "hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
  },
  {
    id: "logo-creator",
    title: "Logo Creator",
    subtitle: "AI logo generator",
    description: "Generate professional logos using AI. Choose industry tone, style, and colors. Export PNG & SVG. Regenerate with one click.",
    icon: ImageIcon,
    href: "/toolkit/corporate-suite/logo-creator",
    badge: "AI",
    badgeColor: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    gradient: "from-orange-400/20 via-red-500/10 to-orange-600/5",
    topBorder: "from-orange-400 to-red-500",
    iconBg: "from-orange-400/30 to-red-500/20 border border-orange-500/30",
    iconColor: "text-orange-300",
    glow: "hover:shadow-[0_0_30px_rgba(249,115,22,0.15)]",
  },
  {
    id: "company-profile",
    title: "Company Profile",
    subtitle: "AI profile builder",
    description: "Build a multi-page company profile PDF with AI-expanded content. 3 premium templates, team, services, and contact sections.",
    icon: Building2,
    href: "/toolkit/corporate-suite/company-profile",
    badge: "AI",
    badgeColor: "bg-teal-500/20 text-teal-300 border border-teal-500/30",
    gradient: "from-teal-500/20 via-cyan-500/10 to-teal-600/5",
    topBorder: "from-teal-400 to-cyan-500",
    iconBg: "from-teal-500/30 to-cyan-600/20 border border-teal-500/30",
    iconColor: "text-teal-300",
    glow: "hover:shadow-[0_0_30px_rgba(20,184,166,0.15)]",
  },
  {
    id: "presentation",
    title: "Presentation",
    subtitle: "Slide deck creator",
    description: "Build professional slide decks with Canva-style templates, AI-generated content and slide-by-slide editing. Export to PDF.",
    icon: Presentation,
    href: "/presentations",
    badge: "Pro",
    badgeColor: "bg-rose-500/20 text-rose-300 border border-rose-500/30",
    gradient: "from-rose-500/20 via-pink-500/10 to-rose-600/5",
    topBorder: "from-rose-400 to-pink-500",
    iconBg: "from-rose-500/30 to-pink-600/20 border border-rose-500/30",
    iconColor: "text-rose-300",
    glow: "hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]",
  },
  {
    id: "landing-page",
    title: "Landing Page",
    subtitle: "One-page site builder",
    description: "Create a one-page business site with custom branding. Includes DNS A-record & CNAME connection guide. Export as HTML.",
    icon: Globe,
    href: "/toolkit/corporate-suite/landing-page",
    badge: "New",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
    gradient: "from-cyan-500/20 via-sky-500/10 to-cyan-600/5",
    topBorder: "from-cyan-400 to-sky-500",
    iconBg: "from-cyan-500/30 to-sky-600/20 border border-cyan-500/30",
    iconColor: "text-cyan-300",
    glow: "hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
  },
  {
    id: "e-sign",
    title: "E-Sign / DocuSign",
    subtitle: "Digital signature workflow",
    description: "Send documents for signature with multi-signer workflows, AI auto-detect fields, audit trail PDF, and reminder system.",
    icon: PenLine,
    href: "/e-signature",
    badge: "Pro",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    gradient: "from-indigo-500/20 via-blue-500/10 to-indigo-600/5",
    topBorder: "from-indigo-400 to-blue-500",
    iconBg: "from-indigo-500/30 to-blue-600/20 border border-indigo-500/30",
    iconColor: "text-indigo-300",
    glow: "hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]",
  },
  {
    id: "scan-sign",
    title: "Scan & Sign",
    subtitle: "Document scanning + signing",
    description: "Scan physical documents, sign digitally, and export as PDF. AI-powered document processing and signature placement.",
    icon: ScanLine,
    href: "/document-scanner",
    badge: "AI",
    badgeColor: "bg-slate-500/20 text-slate-300 border border-slate-500/30",
    gradient: "from-slate-500/20 via-gray-500/10 to-slate-600/5",
    topBorder: "from-slate-400 to-gray-500",
    iconBg: "from-slate-500/30 to-gray-600/20 border border-slate-500/30",
    iconColor: "text-slate-300",
    glow: "hover:shadow-[0_0_30px_rgba(100,116,139,0.15)]",
  },
  {
    id: "spreadsheet",
    title: "Spreadsheet",
    subtitle: "Smart spreadsheet tool",
    description: "Create and edit spreadsheets with formula support, export to Excel/CSV. Fully featured data management tool.",
    icon: Table2,
    href: "/spreadsheet",
    badge: "Pro",
    badgeColor: "bg-green-500/20 text-green-300 border border-green-500/30",
    gradient: "from-green-500/20 via-emerald-500/10 to-green-600/5",
    topBorder: "from-green-400 to-emerald-500",
    iconBg: "from-green-500/30 to-emerald-600/20 border border-green-500/30",
    iconColor: "text-green-300",
    glow: "hover:shadow-[0_0_30px_rgba(34,197,94,0.15)]",
  },
  {
    id: "documents",
    title: "Documents",
    subtitle: "Document management",
    description: "Create, store and manage your business documents. Rich text editor with export capabilities and version history.",
    icon: FolderOpen,
    href: "/documents",
    badge: "Pro",
    badgeColor: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    gradient: "from-yellow-400/20 via-orange-500/10 to-yellow-600/5",
    topBorder: "from-yellow-400 to-orange-400",
    iconBg: "from-yellow-400/30 to-orange-500/20 border border-yellow-500/30",
    iconColor: "text-yellow-300",
    glow: "hover:shadow-[0_0_30px_rgba(234,179,8,0.15)]",
  },
];

export default function CorporateSuite() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #F5EBD7 0%, #EDE0C8 50%, #F5EBD7 100%)" }}>
      {/* ── Hero Header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[#C9A84C]/30">
        {/* Champagne shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 50%, rgba(201,168,76,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/60 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-8 pt-28 sm:pt-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B5B3E]/70 mb-6 select-none">
            <LayoutGrid size={11} />
            <span>Toolkit</span>
            <ChevronRight size={10} />
            <span className="text-[#3D2B1F] font-medium">Corporate Suite</span>
          </div>

          <div className="flex items-start gap-5">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl"
              style={{
                background: "linear-gradient(135deg, #C9A84C, #8B6914)",
                boxShadow: "0 0 40px rgba(201,168,76,0.3)",
              }}
            >
              <Sparkles size={28} className="text-white" />
            </div>

            {/* Text */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: "#8B6914" }}>
                JBJ Toolkit · Document Suite
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1A120B] leading-tight">
                Corporate Document Suite
              </h1>
              <p className="text-[#4A3728]/70 mt-2 text-sm max-w-2xl leading-relaxed">
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
                <span className="text-xl font-bold text-[#1A120B]">{s.value}</span>
                <span className="text-xs text-[#6B5B3E]/70">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tools Grid ───────────────────────────────────────── */}
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
                className={`group text-left rounded-2xl border border-[#C9A84C]/20 shadow-md transition-all duration-300 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] hover:shadow-[0_4px_20px_rgba(201,168,76,0.2)] hover:-translate-y-0.5`}
                style={{
                  background: "rgba(255,255,255,0.70)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {/* Champagne-gold gradient top border */}
                <div className={`h-[2px] w-full bg-gradient-to-r ${tool.topBorder}`} />

                <div className="p-6">
                  {/* Icon + Badge row */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.iconBg} flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Icon size={22} className={tool.iconColor} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[#1A120B] text-[15px] leading-tight">
                    {tool.title}
                  </h3>
                  <p className="text-xs font-semibold mt-0.5 mb-3" style={{ color: "#8B6914" }}>
                    {tool.subtitle}
                  </p>
                  <p className="text-xs text-[#4A3728]/70 leading-relaxed">
                    {tool.description}
                  </p>

                  {/* CTA */}
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[#8B6914]/70 group-hover:text-[#C9A84C] transition-colors">
                    Open Tool
                    <ArrowRight
                      size={13}
                      className="group-hover:translate-x-1 transition-transform duration-200"
                    />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-2 mt-10">
          <Zap size={12} className="text-[#8B6914]/40" />
          <p className="text-center text-[11px] text-[#6B5B3E]/50">
            All tools run securely in your browser. Files are exported locally — nothing leaves your device.
          </p>
        </div>
      </div>
    </div>
  );
}
