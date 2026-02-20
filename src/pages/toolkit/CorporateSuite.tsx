import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Stamp, CreditCard, FileText, FileEdit, Globe, Presentation,
  ArrowRight, Sparkles
} from "lucide-react";

const tools = [
  {
    id: "stamp",
    title: "Company Stamp",
    subtitle: "AI-generated official seals",
    description: "Create professional Arabic/English company stamps with live preview and export.",
    icon: Stamp,
    href: "/toolkit/stamp-generator",
    badge: "AI Powered",
    color: "from-amber-500 to-yellow-600",
    external: false,
  },
  {
    id: "business-card",
    title: "Business Card",
    subtitle: "Professional card designer",
    description: "Design stunning business cards with 6 templates, custom colors and PDF export.",
    icon: CreditCard,
    href: "/toolkit/corporate-suite/business-card",
    badge: "New",
    color: "from-blue-500 to-indigo-600",
    external: false,
  },
  {
    id: "cv-resume",
    title: "CV / Resume",
    subtitle: "AI resume builder",
    description: "Build a professional CV with AI-generated summary and 4 executive templates.",
    icon: FileText,
    href: "/toolkit/corporate-suite/cv-resume",
    badge: "AI Powered",
    color: "from-emerald-500 to-teal-600",
    external: false,
  },
  {
    id: "cover-letter",
    title: "Cover Letter",
    subtitle: "AI cover letter generator",
    description: "Generate tailored cover letters with AI. Choose tone, export as PDF.",
    icon: FileEdit,
    href: "/toolkit/corporate-suite/cover-letter",
    badge: "AI Powered",
    color: "from-purple-500 to-violet-600",
    external: false,
  },
  {
    id: "presentation",
    title: "Presentation",
    subtitle: "Slide deck creator",
    description: "Build professional presentations with templates and slide-by-slide editing.",
    icon: Presentation,
    href: "/presentations",
    badge: "Pro",
    color: "from-rose-500 to-pink-600",
    external: false,
  },
  {
    id: "landing-page",
    title: "Landing Page",
    subtitle: "One-page site builder",
    description: "Create a one-page business site with DNS connection instructions for your domain.",
    icon: Globe,
    href: "/toolkit/corporate-suite/landing-page",
    badge: "New",
    color: "from-cyan-500 to-sky-600",
    external: false,
  },
];

export default function CorporateSuite() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--pearl-1))] via-white to-[hsl(var(--pearl-2))]">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-[hsl(var(--border))] bg-white/90 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--gold)/0.05)] to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 py-10 pt-28 sm:pt-32">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center shadow-lg flex-shrink-0">
              <Sparkles size={26} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[hsl(var(--gold-dark))]">JBJ Toolkit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))] leading-tight">
                Corporate Document Suite
              </h1>
              <p className="text-[hsl(var(--muted-foreground))] mt-1 text-sm max-w-xl">
                Professional tools to create company stamps, business cards, CVs, cover letters, presentations and landing pages — all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            return (
              <motion.button
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => navigate(tool.href)}
                className="group text-left bg-white rounded-2xl border border-[hsl(var(--border))] shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Color bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${tool.color}`} />

                <div className="p-6">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <Icon size={22} className="text-white" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full">
                      {tool.badge}
                    </span>
                  </div>

                  <h3 className="font-semibold text-[hsl(var(--foreground))] text-base leading-tight">{tool.title}</h3>
                  <p className="text-xs text-[hsl(var(--gold-dark))] font-medium mt-0.5 mb-2">{tool.subtitle}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">{tool.description}</p>

                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--gold-dark))] transition-colors">
                    Open Tool <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
