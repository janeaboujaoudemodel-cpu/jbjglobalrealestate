import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Stamp, CreditCard, FileText, FileEdit, Globe, Presentation,
  ArrowRight, Sparkles, ChevronRight, LayoutGrid, ImageIcon,
  Building2, PenLine, ScanLine, Table2, FolderOpen,
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
    badgeColor: "bg-amber-100 text-amber-800",
    gradient: "from-amber-400 to-yellow-600",
    glow: "shadow-amber-100",
    iconBg: "from-amber-400 to-yellow-600",
  },
  {
    id: "business-card",
    title: "Business Card",
    subtitle: "Visual card designer + AI extract",
    description: "Design stunning business cards with 6 templates, AI smart extractor from photo, live 3.5\"×2\" preview and PDF export.",
    icon: CreditCard,
    href: "/toolkit/corporate-suite/business-card",
    badge: "AI",
    badgeColor: "bg-blue-100 text-blue-800",
    gradient: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-100",
    iconBg: "from-blue-500 to-indigo-600",
  },
  {
    id: "cv-resume",
    title: "CV / Resume",
    subtitle: "AI resume builder + extract",
    description: "Build a professional CV with AI-generated summary, 4 executive templates, upload-to-extract mode and PDF export.",
    icon: FileText,
    href: "/toolkit/corporate-suite/cv-resume",
    badge: "AI",
    badgeColor: "bg-emerald-100 text-emerald-800",
    gradient: "from-emerald-500 to-teal-600",
    glow: "shadow-emerald-100",
    iconBg: "from-emerald-500 to-teal-600",
  },
  {
    id: "cover-letter",
    title: "Cover Letter",
    subtitle: "AI cover letter + extract",
    description: "Generate tailored cover letters with Gemini AI. Upload existing letter to extract and redesign. 3 layouts, export as PDF.",
    icon: FileEdit,
    href: "/toolkit/corporate-suite/cover-letter",
    badge: "AI",
    badgeColor: "bg-purple-100 text-purple-800",
    gradient: "from-purple-500 to-violet-600",
    glow: "shadow-purple-100",
    iconBg: "from-purple-500 to-violet-600",
  },
  {
    id: "logo-creator",
    title: "Logo Creator",
    subtitle: "AI logo generator",
    description: "Generate professional logos using AI. Choose industry tone, style, and colors. Export PNG & SVG. Regenerate with one click.",
    icon: ImageIcon,
    href: "/toolkit/corporate-suite/logo-creator",
    badge: "AI",
    badgeColor: "bg-orange-100 text-orange-800",
    gradient: "from-orange-400 to-red-500",
    glow: "shadow-orange-100",
    iconBg: "from-orange-400 to-red-500",
  },
  {
    id: "company-profile",
    title: "Company Profile",
    subtitle: "AI profile builder",
    description: "Build a multi-page company profile PDF with AI-expanded content. 3 premium templates, team, services, and contact sections.",
    icon: Building2,
    href: "/toolkit/corporate-suite/company-profile",
    badge: "AI",
    badgeColor: "bg-teal-100 text-teal-800",
    gradient: "from-teal-500 to-cyan-600",
    glow: "shadow-teal-100",
    iconBg: "from-teal-500 to-cyan-600",
  },
  {
    id: "presentation",
    title: "Presentation",
    subtitle: "Slide deck creator",
    description: "Build professional slide decks with templates, AI-generated content and slide-by-slide editing. Export to PDF.",
    icon: Presentation,
    href: "/presentations",
    badge: "Pro",
    badgeColor: "bg-rose-100 text-rose-800",
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-100",
    iconBg: "from-rose-500 to-pink-600",
  },
  {
    id: "landing-page",
    title: "Landing Page",
    subtitle: "One-page site builder",
    description: "Create a one-page business site with custom branding. Includes DNS A-record & CNAME connection guide. Export as HTML.",
    icon: Globe,
    href: "/toolkit/corporate-suite/landing-page",
    badge: "New",
    badgeColor: "bg-cyan-100 text-cyan-800",
    gradient: "from-cyan-500 to-sky-600",
    glow: "shadow-cyan-100",
    iconBg: "from-cyan-500 to-sky-600",
  },
  {
    id: "e-sign",
    title: "E-Sign / DocuSign",
    subtitle: "Digital signature workflow",
    description: "Send documents for signature with multi-signer workflows, AI auto-detect fields, audit trail PDF, and reminder system.",
    icon: PenLine,
    href: "/e-signature",
    badge: "Pro",
    badgeColor: "bg-indigo-100 text-indigo-800",
    gradient: "from-indigo-500 to-blue-600",
    glow: "shadow-indigo-100",
    iconBg: "from-indigo-500 to-blue-600",
  },
  {
    id: "scan-sign",
    title: "Scan & Sign",
    subtitle: "Document scanning + signing",
    description: "Scan physical documents, sign digitally, and export as PDF. AI-powered document processing and signature placement.",
    icon: ScanLine,
    href: "/document-scanner",
    badge: "AI",
    badgeColor: "bg-slate-100 text-slate-800",
    gradient: "from-slate-500 to-gray-600",
    glow: "shadow-slate-100",
    iconBg: "from-slate-500 to-gray-600",
  },
  {
    id: "spreadsheet",
    title: "Spreadsheet",
    subtitle: "Smart spreadsheet tool",
    description: "Create and edit spreadsheets with formula support, export to Excel/CSV. Fully featured data management tool.",
    icon: Table2,
    href: "/spreadsheet",
    badge: "Pro",
    badgeColor: "bg-green-100 text-green-800",
    gradient: "from-green-500 to-emerald-600",
    glow: "shadow-green-100",
    iconBg: "from-green-500 to-emerald-600",
  },
  {
    id: "documents",
    title: "Documents",
    subtitle: "Document management",
    description: "Create, store and manage your business documents. Rich text editor with export capabilities and version history.",
    icon: FolderOpen,
    href: "/documents",
    badge: "Pro",
    badgeColor: "bg-yellow-100 text-yellow-800",
    gradient: "from-yellow-400 to-orange-500",
    glow: "shadow-yellow-100",
    iconBg: "from-yellow-400 to-orange-500",
  },
];

export default function CorporateSuite() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--pearl-1,48 30% 97%))" }}>
      {/* ── Hero Header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur-sm">
        {/* Gold shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 50%, hsl(var(--gold)/0.06) 0%, transparent 70%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--gold)/0.4)] to-transparent" />

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-8 pt-28 sm:pt-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] text-[hsl(var(--muted-foreground))] mb-6 select-none">
            <LayoutGrid size={11} />
            <span>Toolkit</span>
            <ChevronRight size={10} />
            <span className="text-[hsl(var(--foreground))] font-medium">Corporate Suite</span>
          </div>

          <div className="flex items-start gap-5">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xl"
              style={{
                background: "linear-gradient(135deg, hsl(var(--gold)), hsl(var(--gold-dark)))",
              }}
            >
              <Sparkles size={28} className="text-white" />
            </div>

            {/* Text */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--gold-dark))] mb-1">
                JBJ Toolkit · Document Suite
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))] leading-tight">
                Corporate Document Suite
              </h1>
              <p className="text-[hsl(var(--muted-foreground))] mt-2 text-sm max-w-2xl leading-relaxed">
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
                <span className="text-xl font-bold text-[hsl(var(--foreground))]">{s.value}</span>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</span>
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
                className={`group text-left bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--gold))]`}
              >
                {/* Color accent top border */}
                <div className={`h-[3px] w-full bg-gradient-to-r ${tool.gradient}`} />

                <div className="p-6">
                  {/* Icon + Badge row */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.iconBg} flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-[hsl(var(--foreground))] text-[15px] leading-tight">
                    {tool.title}
                  </h3>
                  <p
                    className="text-xs font-semibold mt-0.5 mb-3"
                    style={{ color: `hsl(var(--gold-dark))` }}
                  >
                    {tool.subtitle}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {tool.description}
                  </p>

                  {/* CTA */}
                  <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--gold-dark))] transition-colors">
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
        <p className="text-center text-[11px] text-[hsl(var(--muted-foreground))] mt-10">
          All tools run securely in your browser. Files are exported locally — nothing leaves your device.
        </p>
      </div>
    </div>
  );
}
