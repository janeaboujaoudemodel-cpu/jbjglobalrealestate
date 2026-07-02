import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import { SEOHead } from "@/components/SEOHead";
import { SEOFaqSchema } from "@/components/SEOFaqSchema";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserMode } from "@/hooks/useUserMode";
import { useToolVisibility } from "@/hooks/useToolVisibility";
import {
  ArrowUpRight,
  Sparkles,
  Calculator,
  FileText,
  Layers,
  BarChart3,
  Calendar,
  Palette,
  Brain,
  Zap,
  Shield,
  Clock,
  Users,
  Video,
  CreditCard,
  Briefcase,
  Award,
  User,
  Target,
  LogIn,
  FolderOpen,
  Home,
  Image as ImageIcon,
  Globe,
  FileSignature,
  Handshake,
  Ruler,
  TrendingUp,
  MapPin,
  UserCheck,
  Play,
  Mic,
  FileImage,
  Languages,
  Wand2,
  MessageSquare,
  ClipboardList,
  Scale,
  PenTool,
  Mail,
  Building2,
  Search,
  type LucideIcon,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Motion presets
// ─────────────────────────────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tool registry (preserved — same ids/links as previous version)
// ─────────────────────────────────────────────────────────────────────────────
type ToolCategory = "property" | "productivity" | "marketing" | "design" | "corporate";

interface ToolDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  category: ToolCategory;
}

const ALL_TOOLS: ToolDef[] = [
  // Property
  { id: "ai-home-finder", title: "JBJ AI Home Finder", description: "Match buyers to listings with AI-powered filters.", icon: Home, link: "/ai-home-finder", category: "property" },
  { id: "property-evaluator", title: "JBJ Property Evaluator", description: "AI-driven valuation based on live market data.", icon: Calculator, link: "/property-evaluator", category: "property" },
  { id: "property-comparison", title: "JBJ Property Comparison", description: "Compare properties side-by-side with AI insights.", icon: BarChart3, link: "/compare", category: "property" },
  { id: "mortgage-calculator", title: "JBJ Mortgage Calculator", description: "Estimate monthly payments and financing options.", icon: Calculator, link: "/mortgage-calculator", category: "property" },
  { id: "rental-index", title: "JBJ Rental Index Evaluator", description: "AI-powered rental estimates with market trends.", icon: Layers, link: "/rental-index", category: "property" },
  { id: "list-property-sale", title: "List Your Property for Sale", description: "Submit a sale listing for review and publication.", icon: ClipboardList, link: "/listing-portal?type=sale", category: "property" },
  { id: "list-property-rent", title: "List Your Property for Rent", description: "Submit a rental listing for review and publication.", icon: Home, link: "/listing-portal?type=rent", category: "property" },
  { id: "ai-property-analyzer", title: "JBJ AI Property Analyzer", description: "Deep market analysis with price trends and investment metrics.", icon: Brain, link: "/ai-property-analyzer", category: "property" },
  { id: "ai-price-predictor", title: "JBJ AI Price Predictor", description: "AI-powered price predictions with confidence bands.", icon: TrendingUp, link: "/ai-price-predictor", category: "property" },
  { id: "ai-neighborhood-insights", title: "JBJ AI Neighborhood Insights", description: "Area analysis with livability scores and demographics.", icon: MapPin, link: "/ai-neighborhood-insights", category: "property" },
  { id: "property-measurement", title: "JBJ Property Measurement", description: "Verify property sizes with AI precision.", icon: Ruler, link: "/property-measurement", category: "property" },
  { id: "ai-market-report", title: "JBJ AI Market Report", description: "Generate comprehensive market reports with AI analysis.", icon: BarChart3, link: "/ai-market-report", category: "property" },
  { id: "ai-competitor-analysis", title: "JBJ AI Competitor Analysis", description: "Analyze competitor listings and pricing strategies.", icon: TrendingUp, link: "/ai-competitor-analysis", category: "property" },
  { id: "ai-roi-calculator", title: "JBJ AI ROI Calculator", description: "Calculate investment returns with AI market predictions.", icon: Calculator, link: "/ai-roi-calculator", category: "property" },
  { id: "ai-investment-report", title: "JBJ AI Investment Report", description: "Generate detailed investment analysis reports.", icon: FileText, link: "/ai-investment-report", category: "property" },

  // Productivity
  { id: "content-tools", title: "JBJ Documents & Spreadsheets", description: "Rich text editor and Excel-like tools.", icon: FileText, link: "/documents", category: "productivity" },
  { id: "video-meeting", title: "JBJ Video Meet", description: "Free unlimited video meetings with recording.", icon: Video, link: "/video-meeting", category: "productivity" },
  { id: "calendar", title: "JBJ Calendar & Notes", description: "Smart scheduling and reminders.", icon: Calendar, link: "/ai-calendar", category: "productivity" },
  { id: "business-card-scanner", title: "JBJ Business Card Scanner", description: "Scan and save business cards into your CRM.", icon: CreditCard, link: "/business-card-scanner", category: "productivity" },
  { id: "ai-meeting-summarizer", title: "JBJ AI Meeting Summarizer", description: "Summarize meetings and extract action items automatically.", icon: ClipboardList, link: "/ai-meeting-summarizer", category: "productivity" },
  { id: "ai-translation-hub", title: "JBJ AI Translation Hub", description: "Translate communications to any language instantly.", icon: Globe, link: "/ai-translation-hub", category: "productivity" },
  { id: "ai-video-tour-script", title: "JBJ AI Video Tour Script", description: "Generate professional video tour scripts for properties.", icon: Video, link: "/toolkit/video-suite", category: "productivity" },
  { id: "ai-email-generator", title: "JBJ AI Email Generator", description: "Generate professional emails for any occasion.", icon: Mail, link: "/ai-email-generator", category: "productivity" },

  // Corporate
  { id: "stamp-generator", title: "JBJ Smart Stamp Generator", description: "Generate professional company stamps — bilingual exports.", icon: Award, link: "/toolkit/stamp-generator", category: "corporate" },
  { id: "business-card", title: "JBJ Business Card Designer", description: "Design stunning business cards with 6 premium templates.", icon: CreditCard, link: "/toolkit/corporate-suite/business-card", category: "corporate" },
  { id: "cv-resume", title: "JBJ CV / Resume Builder", description: "Build a professional CV with AI summary and PDF export.", icon: User, link: "/cv-builder", category: "corporate" },
  { id: "cover-letter", title: "JBJ Cover Letter Generator", description: "Generate tailored cover letters with AI. Export as PDF.", icon: FileText, link: "/toolkit/corporate-suite/cover-letter", category: "corporate" },
  { id: "logo-creator", title: "JBJ AI Logo Creator", description: "Generate professional logos with AI. Export PNG & SVG.", icon: Palette, link: "/toolkit/corporate-suite/logo-creator", category: "corporate" },
  { id: "company-profile", title: "JBJ Company Profile Builder", description: "Build a multi-page company profile PDF with AI content.", icon: Briefcase, link: "/toolkit/corporate-suite/company-profile", category: "corporate" },
  // { id: "presentation-tool", ... } REMOVED — broken slide builder retired per owner directive (June 2026)
  { id: "landing-page-builder", title: "JBJ Landing Page Builder", description: "Create a one-page business site with HTML export.", icon: Globe, link: "/toolkit/corporate-suite/landing-page", category: "corporate" },
  { id: "esign", title: "JBJ E-Sign", description: "Contract signing with multi-signer workflows.", icon: Handshake, link: "/e-signature", category: "corporate" },
  { id: "scan-sign", title: "JBJ Scan & Sign", description: "Camera scan, handwritten signature & PDF export.", icon: FileSignature, link: "/toolkit/scan-sign", category: "corporate" },
  { id: "spreadsheet-tool", title: "JBJ Spreadsheet", description: "Spreadsheets with formula support and Excel/CSV export.", icon: FileText, link: "/spreadsheet", category: "corporate" },
  { id: "documents-tool", title: "JBJ Documents Editor", description: "Rich text document editor with version history.", icon: FolderOpen, link: "/documents", category: "corporate" },
  { id: "ai-contract-reviewer", title: "JBJ AI Contract Reviewer", description: "Review contracts and highlight important clauses.", icon: Scale, link: "/ai-contract-reviewer", category: "corporate" },
  { id: "ai-document-generator", title: "JBJ AI Document Generator", description: "Generate professional documents from templates.", icon: FileSignature, link: "/ai-document-generator", category: "corporate" },

  // Design & Media
  { id: "ai-video-studio", title: "JBJ Creative Video Suite", description: "Professional video editor with AI captions and effects.", icon: Play, link: "/toolkit/video-suite", category: "design" },
  { id: "video-resize-pack", title: "JBJ Video Resize + Smart Reframe", description: "Resize videos for any social platform with AI tracking.", icon: Video, link: "/toolkit/video-resize-pack", category: "design" },
  { id: "voice-studio", title: "JBJ Voice Studio", description: "AI voice generation and text-to-speech.", icon: Mic, link: "/toolkit/voice-studio", category: "design" },
  { id: "pdf-from-photos", title: "JBJ Photo → PDF Generator", description: "Convert photos to professional PDFs.", icon: FileText, link: "/toolkit/pdf-from-photos", category: "design" },
  { id: "image-resize", title: "JBJ Image Resizer + Social Sizes", description: "Resize images for every social platform.", icon: FileImage, link: "/toolkit/image-resize", category: "design" },
  { id: "captions-translate", title: "JBJ Captions & Translation", description: "Auto-transcribe and translate captions to 100+ languages.", icon: Languages, link: "/toolkit/captions-translate", category: "design" },
  { id: "background-ai", title: "JBJ AI Background Remover", description: "Remove or replace backgrounds from photos instantly.", icon: Wand2, link: "/toolkit/background-ai", category: "design" },
  { id: "beauty-filters", title: "JBJ Beauty Filters", description: "Apply professional beauty enhancements to photos.", icon: Sparkles, link: "/toolkit/beauty-filters", category: "design" },
  { id: "interior-design", title: "JBJ AI Interior Design", description: "Visualize spaces with AI-generated designs.", icon: ImageIcon, link: "/interior-design-ai", category: "design" },
  { id: "virtual-staging-ai", title: "JBJ AI Virtual Staging", description: "Virtually stage empty properties with AI furniture.", icon: Building2, link: "/virtual-staging-ai", category: "design" },
  { id: "creative-suite", title: "JBJ Creative Suite", description: "Full-featured creative studio for video and presentations.", icon: Sparkles, link: "/studio", category: "design" },

  // Marketing
  { id: "ai-lead-qualification", title: "JBJ AI Lead Qualification", description: "Score leads with AI: confidence, objections, next actions.", icon: UserCheck, link: "/ai-lead-qualification", category: "marketing" },
  { id: "ai-followup-scheduler", title: "JBJ AI Follow-up Scheduler", description: "Smart follow-up scheduling based on lead behavior.", icon: Calendar, link: "/ai-followup-scheduler", category: "marketing" },
  { id: "ai-objection-handler", title: "JBJ AI Objection Handler", description: "Get AI-suggested responses to common objections.", icon: MessageSquare, link: "/ai-objection-handler", category: "marketing" },
  { id: "ai-client-matcher", title: "JBJ AI Client Matcher", description: "Match clients to properties using AI preferences.", icon: Users, link: "/ai-client-matcher", category: "marketing" },
  { id: "ai-social-media", title: "JBJ AI Social Media", description: "Generate engaging social media content for properties.", icon: PenTool, link: "/ai-social-media", category: "marketing" },
  { id: "ai-description-writer", title: "JBJ AI Description Writer", description: "Write compelling property descriptions automatically.", icon: FileText, link: "/ai-description-writer", category: "marketing" },
  { id: "property-coach", title: "JBJ Property Coach", description: "Scripts, objections, roleplay, deal strategy.", icon: Target, link: "/broker-toolkit", category: "marketing" },
];

const QUICK_BENEFITS = [
  { icon: Brain, title: "Intelligent Analysis", desc: "AI processes thousands of data points." },
  { icon: Zap, title: "Instant Results", desc: "Get real-time insights instantly." },
  { icon: Shield, title: "Data Security", desc: "Industry-standard encryption." },
  { icon: Clock, title: "Save Time", desc: "Automate tedious tasks." },
];

const FILTERS: { id: ToolCategory | "all"; label: string }[] = [
  { id: "all", label: "All Tools" },
  { id: "property", label: "Property Tools" },
  { id: "corporate", label: "Corporate Suite" },
  { id: "productivity", label: "Productivity" },
  { id: "design", label: "Design & Media" },
  { id: "marketing", label: "Marketing & Sales" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Champagne tool card (gold hairline, ink text, mother-of-pearl surface)
// ─────────────────────────────────────────────────────────────────────────────
function ToolCard({ tool, index }: { tool: ToolDef; index: number }) {
  const Icon = tool.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 16) * 0.025, duration: 0.35 }}
      viewport={{ once: true }}
    >
      <Link
        to={tool.link}
        data-surface="emerald"
        className="group relative h-full flex flex-col rounded-2xl p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1 border border-white/15 hover:border-white/35 hover:shadow-[0_18px_40px_-22px_rgba(6,95,70,0.55)]"
        style={{
          background:
            "linear-gradient(155deg, #065F46 0%, #04231A 55%, #022c1c 100%)",
        }}
      >
        {/* White hairline top accent */}
        <div
          aria-hidden
          className="absolute top-0 left-4 right-4 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
        />

        <div className="flex items-start justify-between mb-4 gap-3 relative">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl border border-white/25"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <Icon className="w-5 h-5 allow-white" style={{ color: "#FFFFFF" }} />
          </div>
          <span
            className="allow-white text-[10px] font-semibold tracking-[0.18em] uppercase px-2 py-1 rounded-md border border-white/30"
            style={{ background: "rgba(255,255,255,0.10)", color: "#FFFFFF" }}
          >
            Free
          </span>
        </div>

        <h3 className="allow-white text-[15px] font-semibold leading-snug mb-1.5 relative" style={{ color: "#FFFFFF" }}>
          {tool.title}
        </h3>
        <p className="allow-white text-[13px] leading-relaxed line-clamp-2 flex-1 relative" style={{ color: "rgba(255,255,255,0.82)" }}>
          {tool.description}
        </p>

        <div className="mt-4 flex items-center justify-between text-[12px] font-semibold relative">
          <span className="allow-white transition-colors" style={{ color: "rgba(255,255,255,0.9)" }}>
            Open tool
          </span>
          <ArrowUpRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF" }} />
        </div>
      </Link>
    </motion.div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
const AIHub = () => {
  const { user } = useAuth();
  const { mode } = useUserMode();
  const navigate = useNavigate();
  const [toolSearch, setToolSearch] = useState("");
  const [toolFilter, setToolFilter] = useState<ToolCategory | "all">("all");

  const visibility = useToolVisibility();

  const allTools = useMemo(
    () => ALL_TOOLS.filter((t) => visibility.isPublic(t.id)),
    [visibility]
  );

  const filteredTools = useMemo(() => {
    const q = toolSearch.trim().toLowerCase();
    return allTools.filter((tool) => {
      const matchesSearch =
        !q || tool.title.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
      const matchesCategory = toolFilter === "all" || tool.category === toolFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allTools, toolSearch, toolFilter]);

  const dashboardHref = user ? "/my-account" : "/auth?redirect=/ai-hub";

  // Mode-aware portal CTA — single button replaces old Broker/Investor row
  const portalCta = useMemo(() => {
    if (mode === "broker") return { label: "Your Broker Portal", href: "/broker/portal", icon: Briefcase };
    if (mode === "developer") return { label: "Your Developer Portal", href: "/developers-portal", icon: Building2 };
    return { label: "Your Investor Portal", href: "/investor-hub", icon: TrendingUp };
  }, [mode]);

  return (
    <>
      <SEOHead
        title="JBJ Royal Tools Hub | Free AI Tools for Investors & Brokers"
        description="The complete AI command center: property analysis, valuations, productivity, design, and marketing tools — all free."
        keywords="JBJ Royal Tools Hub, AI property tools, investment tools Dubai, JBJ Global Real Estate"
        canonicalPath="/ai-hub"
      />

      <main data-marketing-page className="bg-[#FDFBF7]">
        {/* ════════════════════════════════════════════════════════════════
            HERO — champagne page band, gold hairline accents, ink type
        ════════════════════════════════════════════════════════════════ */}
        <section
          data-surface="emerald"
          data-allow-dark-cta
          data-on-dark
          className="relative overflow-hidden py-20 md:py-28"
          style={{
            background:
              "linear-gradient(135deg, #064E3B 0%, #04231A 48%, #010806 100%)",
          }}
        >
          {/* Emerald depth wash */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(900px 500px at 50% 0%, rgba(255,255,255,0.10), transparent 62%)",
            }}
          />
          <motion.div
            className="relative z-10 w-full px-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.div variants={fadeInUp} className="mb-5 flex justify-center">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/10 shadow-[0_18px_44px_-26px_rgba(255,255,255,0.42)]">
                  <Sparkles className="w-7 h-7 allow-white" style={{ color: "#FFFFFF" }} />
                </span>
              </motion.div>

              <motion.div variants={fadeInUp} className="mb-6 inline-block">
                <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/35 bg-white/10">
                  <Sparkles className="w-3.5 h-3.5 allow-white" style={{ color: "#FFFFFF" }} />
                  <span className="allow-white font-semibold text-[10px] md:text-xs uppercase tracking-[0.24em]" style={{ color: "#FFFFFF" }}>
                    Free for All Users · AI Command Center
                  </span>
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="allow-white text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-5 leading-[1.05]"
                style={{ color: "#FFFFFF" }}
              >
                JBJ Royal{" "}
                <span className="allow-white" style={{ color: "#FFFFFF" }}>Tools Hub</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="allow-white text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-3"
                style={{ color: "rgba(255,255,255,0.92)" }}
              >
                Your Complete AI Tools Command Center
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="allow-white text-sm md:text-base max-w-xl mx-auto mb-8"
                style={{ color: "rgba(255,255,255,0.82)" }}
              >
                60+ free tools · Property analysis · Investment calculators · Productivity suite
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="w-24 h-px mx-auto mb-9"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.65), transparent)",
                }}
              />

              {/* THREE CTAs — navy primary + champagne + navy portal */}
              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto"
              >
                <button
                  data-cta="dark"
                  onClick={() => navigate(dashboardHref)}
                  className="jj-cta-dark inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-sm font-semibold w-full"
                >
                  {user ? <User className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{user ? "My Dashboard" : "Sign In / Create Account"}</span>
                </button>

                <button
                  data-cta="champagne"
                  onClick={() =>
                    document.getElementById("discover-tools")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="allow-white inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-sm font-semibold w-full border border-white/35 transition-all hover:border-white/60"
                  style={{ color: "#FFFFFF", background: "rgba(255,255,255,0.10)" }}
                >
                  <Sparkles className="w-4 h-4 allow-white" style={{ color: "#FFFFFF" }} />
                  <span className="allow-white" style={{ color: "#FFFFFF" }}>Explore Free Tools</span>
                </button>


                <button
                  data-cta="dark"
                  onClick={() => navigate(portalCta.href)}
                  className="jj-cta-dark inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-sm font-semibold w-full"
                >
                  <portalCta.icon className="w-4 h-4" />
                  <span>{portalCta.label}</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TRUST STRIP — champagne raised tiles, gold hairline
        ════════════════════════════════════════════════════════════════ */}
        <section className="jj-band jj-band--surface py-14 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
              {QUICK_BENEFITS.map((b, idx) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.06 }}
                    data-surface="emerald"
                    className="rounded-2xl p-5 text-center border border-white/15"
                    style={{
                      background:
                        "linear-gradient(155deg, #065F46 0%, #04231A 55%, #022c1c 100%)",
                    }}
                  >
                    <div className="flex justify-center mb-3">
                      <div
                        className="flex items-center justify-center w-11 h-11 rounded-xl border border-white/25"
                        style={{ background: "rgba(255,255,255,0.08)" }}
                      >
                        <Icon className="w-5 h-5 allow-white" style={{ color: "#FFFFFF" }} />
                      </div>
                    </div>
                    <h3 className="allow-white font-semibold text-sm mb-1" style={{ color: "#FFFFFF" }}>
                      {b.title}
                    </h3>
                    <p className="allow-white text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.82)" }}>
                      {b.desc}
                    </p>
                  </motion.div>
                );
              })}

            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            DISCOVER — search + category filters + unified grid (champagne)
        ════════════════════════════════════════════════════════════════ */}
        <section
          id="discover-tools"
          className="jj-band jj-band--page py-14 md:py-20"
        >
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span
                data-surface="emerald"
                className="allow-white inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] mb-4 border border-white/25"
                style={{
                  background:
                    "linear-gradient(135deg, #065F46 0%, #04231A 100%)",
                  color: "#FFFFFF",
                }}
              >
                <Sparkles className="w-3 h-3 allow-white" style={{ color: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF" }}>All Free Tools</span>
              </span>

              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 text-[#1A1A1A]">
                Discover All Free{" "}
                <span style={{ color: "#B89555" }}>AI Tools</span>
              </h2>
              <p className="text-base text-[#1A1A1A]/70">
                Filter by category or search across the full hub.
              </p>
            </div>

            {/* Search + filters */}
            <div className="flex flex-col gap-4 mb-10">
              <div className="relative max-w-2xl mx-auto w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/60" />
                <input
                  type="text"
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  placeholder="Search tools…"
                  className="w-full pl-11 pr-4 h-12 rounded-xl text-sm font-medium focus:outline-none focus:border-[#B89555] transition-all bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40"
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {FILTERS.map((f) => {
                  const active = toolFilter === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setToolFilter(f.id)}
                      className={
                        active
                          ? "jj-pill-active px-4 h-10 rounded-xl text-[11px] font-semibold uppercase tracking-[0.16em] transition-all"
                          : "px-4 h-10 rounded-xl text-[11px] font-semibold uppercase tracking-[0.16em] transition-all bg-[#F7F2EA] border border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6] hover:border-[#B89555]"
                      }
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

            </div>

            {filteredTools.length === 0 ? (
              <div className="text-center py-16 text-sm text-[#1A1A1A]/60">
                No tools match your search.
              </div>
            ) : (
              <motion.div
                className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {filteredTools.map((tool, idx) => (
                  <ToolCard key={tool.id} tool={tool} index={idx} />
                ))}
              </motion.div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            BOTTOM CTA BAND — emerald ombré, white ink, white hairline
        ════════════════════════════════════════════════════════════════ */}
        <section
          data-surface="emerald"
          data-allow-dark-cta
          data-on-dark
          className="py-16 md:py-20 relative overflow-hidden"
          style={{
            background:
              "linear-gradient(155deg, #065F46 0%, #04231A 55%, #022c1c 100%)",
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)" }}
          />
          <div className="container mx-auto px-4 max-w-3xl text-center relative">
            <h2
              className="text-3xl md:text-4xl font-bold tracking-tight mb-4 allow-white"
              style={{ color: "#FFFFFF" }}
            >
              {user ? (
                <>
                  <span className="allow-white" style={{ color: "#FFFFFF" }}>Welcome back to your </span>
                  <span className="allow-white" style={{ color: "#FFFFFF" }}>Command Center</span>
                </>
              ) : (
                <>
                  <span className="allow-white" style={{ color: "#FFFFFF" }}>Start using </span>
                  <span className="allow-white" style={{ color: "#FFFFFF" }}>All Free AI Tools</span>
                </>
              )}
            </h2>
            <p
              className="mb-8 max-w-xl mx-auto allow-white"
              style={{ color: "rgba(255,255,255,0.9)" }}
            >
              60+ free tools for property analysis, corporate documents, creative design, and productivity.
            </p>
            <button
              onClick={() =>
                user
                  ? document.getElementById("discover-tools")?.scrollIntoView({ behavior: "smooth" })
                  : navigate("/auth?redirect=/ai-hub")
              }
              className="allow-white inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl text-sm font-semibold border border-white/40 hover:border-white/70 transition-all"
              style={{ background: "rgba(255,255,255,0.10)", color: "#FFFFFF" }}
            >
              <Sparkles className="w-4 h-4 allow-white" style={{ color: "#FFFFFF" }} />
              <span className="allow-white" style={{ color: "#FFFFFF" }}>
                {user ? "Explore Tools Above" : "Sign In / Create Account"}
              </span>
              <ArrowUpRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF" }} />
            </button>
          </div>
        </section>


        {/* HOW IT WORKS */}
        <section className="jj-band jj-band--surface py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <span
                data-surface="emerald"
                className="allow-white inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] mb-4 border border-white/25"
                style={{
                  background:
                    "linear-gradient(135deg, #065F46 0%, #04231A 100%)",
                  color: "#FFFFFF",
                }}
              >
                <Sparkles className="w-3 h-3 allow-white" style={{ color: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF" }}>Simple Workflow</span>
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                How It Works
              </h2>
            </div>
            <ol className="space-y-4">
              {[
                { n: 1, t: "Input your scenario", d: "Enter the verified figures you want to model." },
                { n: 2, t: "Review structured outputs", d: "Tables and summaries reflect only the inputs you provide." },
                { n: 3, t: "Save results to your dashboard", d: "Where the dashboard supports it, signed-in results are retained." },
                { n: 4, t: "Share a formatted snapshot", d: "Brokers and teams can export a clean client-ready summary where available." },
              ].map((s) => (
                <li key={s.n} className="flex items-start gap-5 rounded-2xl bg-[#FDFBF7] border border-[#B89555]/30 p-5">
                  <span
                    data-surface="emerald"
                    className="allow-white shrink-0 w-10 h-10 rounded-full border border-white/20 flex items-center justify-center font-bold"
                    style={{
                      background:
                        "linear-gradient(155deg, #065F46 0%, #04231A 55%, #022c1c 100%)",
                      color: "#FFFFFF",
                      boxShadow: "0 6px 16px -8px rgba(6,95,70,0.55)",
                    }}
                  >
                    {s.n}
                  </span>
                  <div>
                    <div className="font-semibold text-[#1A1A1A]">{s.t}</div>
                    <div className="text-sm text-[#1A1A1A]/70 mt-1">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TRANSPARENCY & RESPONSIBLE USE — UAE-aligned */}
        <section className="jj-band jj-band--raised py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <span
                data-surface="emerald"
                className="allow-white inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] mb-4 border border-white/25"
                style={{
                  background:
                    "linear-gradient(135deg, #065F46 0%, #04231A 100%)",
                  color: "#FFFFFF",
                }}
              >
                <Shield className="w-3 h-3 allow-white" style={{ color: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF" }}>UAE Aligned</span>
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                Transparency & Responsible Use
              </h2>
            </div>
            <div className="rounded-2xl bg-[#FDFBF7] border border-[#B89555]/40 p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div
                  data-surface="emerald"
                  className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border border-white/20 mt-0.5"
                  style={{
                    background:
                      "linear-gradient(155deg, #065F46 0%, #04231A 55%, #022c1c 100%)",
                    boxShadow: "0 6px 16px -8px rgba(6,95,70,0.55)",
                  }}
                >
                  <Shield className="w-5 h-5 allow-white" style={{ color: "#FFFFFF" }} />
                </div>
                <div className="space-y-3 text-[#1A1A1A]/80 leading-relaxed">
                  <p>
                    Outputs are generated from the inputs you provide and structured logic. They are <strong>informational only</strong> and do not constitute investment, legal, tax, valuation, or regulated brokerage advice under UAE law.
                  </p>
                  <p>
                    Official property valuations in the UAE must be issued by a <strong>RERA-certified valuer</strong> registered with the Dubai Land Department (DLD), or the equivalent authority in the relevant Emirate. Regulated brokerage activity in Dubai is governed by Law No. (6) of 2019 and Bylaw No. (85) of 2006.
                  </p>
                  <p>
                    Personal data submitted to these tools is processed in line with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL). Where official datasets are referenced inside report modules, sources are shown alongside the figures.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ — UAE-aligned */}
        <section id="ai-hub-faq" className="jj-band jj-band--surface py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <span
                data-surface="emerald"
                className="allow-white inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] mb-4 border border-white/25"
                style={{
                  background:
                    "linear-gradient(135deg, #065F46 0%, #04231A 100%)",
                  color: "#FFFFFF",
                }}
              >
                <Sparkles className="w-3 h-3 allow-white" style={{ color: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF" }}>Common Questions</span>
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>
            <AIHubFaqSection />
          </div>
        </section>

      </main>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// UAE-aligned FAQ (with JSON-LD)
// ─────────────────────────────────────────────────────────────────────────────
const AI_HUB_FAQS = [
  {
    question: "Do these tools guarantee returns?",
    answer:
      "No. All outputs are illustrative scenarios for informational purposes only. They are not investment advice under UAE Securities and Commodities Authority (SCA) rules and do not guarantee any financial outcome.",
  },
  {
    question: "Can I use tool outputs as an official valuation?",
    answer:
      "No. Official property valuations in the UAE must be issued by a RERA-certified valuer registered with the Dubai Land Department (DLD), or the equivalent authority in the relevant Emirate. Tool outputs are indicative only.",
  },
  {
    question: "Why do inputs matter so much?",
    answer:
      "Scenario accuracy depends entirely on the assumptions you enter. Inputs should reflect verified figures (DLD transaction records, signed agreements, official service charges). Inaccurate inputs produce non-representative outputs.",
  },
  {
    question: "Can I save my results?",
    answer:
      "Yes, when logged in. Saved data is stored in line with UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data (PDPL); you may request export or deletion at any time.",
  },
  {
    question: "Can I compare multiple projects?",
    answer:
      "Yes. Comparisons use publicly available project information and DLD-published data where applicable. Final terms must always be confirmed against the developer's official SPA and the RERA project trust (escrow) account details.",
  },
  {
    question: "Do the tools work for all Emirates?",
    answer:
      "Tools are designed to be Emirate-agnostic. Regulatory references default to Dubai (RERA/DLD); Abu Dhabi (DMT/ADREC), Sharjah (SRERD) and other authorities have their own rules — always verify locally.",
  },
  {
    question: "Can a broker generate a client PDF?",
    answer:
      "Yes, where the feature is available. Brokers must hold a valid RERA broker card and comply with Law No. (6) of 2019 and Bylaw No. (85) of 2006 regulating real estate brokers in Dubai. Generated PDFs must not be presented as regulated advice.",
  },
  {
    question: "Can I request a custom tool?",
    answer:
      "Yes — submit a request via Concierge or Support. Custom tools that touch payments, escrow, or AML-regulated activity will be reviewed for UAE Central Bank and Ministry of Economy AML/CFT compliance before release.",
  },
];

function AIHubFaqSection() {
  return (
    <>
      <SEOFaqSchema faqs={AI_HUB_FAQS} />
      <Accordion type="single" collapsible className="space-y-3">
        {AI_HUB_FAQS.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`ai-hub-faq-${i}`}
            data-ai-hub-faq-item
            data-allow-bg
            className="group rounded-2xl bg-[#FDFBF7] border border-[#B89555]/30 overflow-hidden transition-colors data-[state=open]:border-white/35 data-[state=open]:bg-[#064E3B]"
          >
            <AccordionTrigger
              data-ai-hub-faq-trigger
              className="w-full text-left text-[#1A1A1A] hover:text-[#1A1A1A] hover:no-underline py-4 px-5 transition-colors hover:bg-[#F7F2EA] data-[state=open]:bg-[#064E3B] data-[state=open]:text-white data-[state=open]:hover:bg-[#064E3B]"
            >
              <span className="font-semibold group-data-[state=open]:text-white">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent
              data-ai-hub-faq-content
              className="bg-[#064E3B] text-white leading-relaxed pb-5 px-5 pt-4"
            >
              <span>{faq.answer}</span>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

    </>
  );
}

export default AIHub;
