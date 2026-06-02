import { useState, useMemo } from "react";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { PremiumSectionCard } from "@/components/ui/premium-section-card";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
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
  Camera,
  Film,
  Megaphone,
  GraduationCap,
  Briefcase,
  Award,
  User,
  Target,
  LogIn,
  FolderOpen,
  Home,
  Image,
  Share2,
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

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

type ToolCategory = "property" | "productivity" | "marketing" | "design" | "corporate";

interface ToolDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  link: string;
  category: ToolCategory;
}

const CATEGORY_META: Record<ToolCategory, { label: string; description: string }> = {
  property: {
    label: "Investment & Property Tools",
    description: "Powerful AI tools for property analysis, valuation, and investment decisions.",
  },
  productivity: {
    label: "Productivity Tools",
    description: "Video meetings, documents, calendar, and signing tools to keep your day moving.",
  },
  corporate: {
    label: "Corporate Suite Tools",
    description: "Professional stamps, business cards, logos, CVs, e-signatures and more.",
  },
  design: {
    label: "Design & Media Tools",
    description: "Creative tools for interior design, video, photo, and visual content.",
  },
  marketing: {
    label: "Marketing & Content Tools",
    description: "Lead generation, follow-ups, copywriting, and campaign creation.",
  },
};

// ── DATA (preserved from previous version, plus merged registries) ──
const investorTools: ToolDef[] = [
  { id: "ai-home-finder", title: "JBJ AI Home Finder", description: "Match buyers to listings with AI-powered filters.", icon: Home, link: "/quiz", category: "property" },
  { id: "property-evaluator", title: "JBJ Property Evaluator", description: "AI-driven valuation based on live market data.", icon: Calculator, link: "/property-evaluator", category: "property" },
  { id: "property-comparison", title: "JBJ Property Comparison", description: "Compare properties side-by-side with AI insights.", icon: BarChart3, link: "/compare", category: "property" },
  { id: "mortgage-calculator", title: "JBJ Mortgage Calculator", description: "Estimate monthly payments and financing options.", icon: Calculator, link: "/mortgage-calculator", category: "property" },
  { id: "rental-index", title: "JBJ Rental Index Evaluator", description: "AI-powered rental estimates with market trends.", icon: Layers, link: "/rental-index", category: "property" },
  { id: "list-property-sale", title: "List Your Property for Sale", description: "Submit a sale listing for review and publication.", icon: ClipboardList, link: "/listing-portal?type=sale", category: "property" },
  { id: "list-property-rent", title: "List Your Property for Rent", description: "Submit a rental listing for review and publication.", icon: Home, link: "/listing-portal?type=rent", category: "property" },
  { id: "ai-property-analyzer", title: "JBJ AI Property Analyzer", description: "Deep market analysis with price trends and investment metrics.", icon: Brain, link: "/ai-property-analyzer", category: "property" },
  { id: "ai-price-predictor", title: "JBJ AI Price Predictor", description: "AI-powered price predictions with confidence bands and comparables.", icon: TrendingUp, link: "/ai-price-predictor", category: "property" },
  { id: "ai-neighborhood-insights", title: "JBJ AI Neighborhood Insights", description: "Comprehensive area analysis with livability scores and demographics.", icon: MapPin, link: "/ai-neighborhood-insights", category: "property" },
  { id: "ai-lead-qualification", title: "JBJ AI Lead Qualification", description: "Score leads with AI: confidence, objections, and next actions.", icon: UserCheck, link: "/ai-lead-qualification", category: "marketing" },
  { id: "interior-design", title: "JBJ AI Interior Design", description: "Visualize spaces with AI-generated designs.", icon: Image, link: "/interior-design-ai", category: "design" },
  { id: "business-card-scanner", title: "JBJ Business Card Scanner", description: "Scan and save business cards into your CRM.", icon: CreditCard, link: "/business-card-scanner", category: "productivity" },
  { id: "property-measurement", title: "JBJ Property Measurement", description: "Verify property sizes with AI precision.", icon: Ruler, link: "/property-measurement", category: "property" },
  { id: "property-coach", title: "JBJ Property Coach", description: "Scripts, objections, roleplay, deal strategy.", icon: Target, link: "/broker-toolkit", category: "marketing" },
];

const productivityTools: ToolDef[] = [
  { id: "content-tools", title: "JBJ Documents & Spreadsheets", description: "Rich text editor and Excel-like tools.", icon: FileText, link: "/documents", category: "productivity" },
  { id: "video-meeting", title: "JBJ Video Meet", description: "Free unlimited video meetings with recording.", icon: Video, link: "/video-meeting", category: "productivity" },
  { id: "calendar", title: "JBJ Calendar & Notes", description: "Smart scheduling and reminders.", icon: Calendar, link: "/ai-calendar", category: "productivity" },
  { id: "stamp-generator", title: "JBJ Smart Stamp Generator", description: "Generate professional company stamps — bilingual, multiple shapes, full export pack.", icon: Award, link: "/toolkit/stamp-generator", category: "corporate" },
  { id: "business-card", title: "JBJ Business Card Designer", description: "Design stunning business cards with AI extraction and 6 premium templates.", icon: CreditCard, link: "/toolkit/corporate-suite/business-card", category: "corporate" },
  { id: "cv-resume", title: "JBJ CV / Resume Builder", description: "Build a professional CV with AI summary, multiple templates and PDF export.", icon: User, link: "/cv-builder", category: "corporate" },
  { id: "cover-letter", title: "JBJ Cover Letter Generator", description: "Generate tailored cover letters with AI. 3 layouts, export as PDF.", icon: FileText, link: "/toolkit/corporate-suite/cover-letter", category: "corporate" },
  { id: "logo-creator", title: "JBJ AI Logo Creator", description: "Generate professional logos with AI. Export PNG & SVG.", icon: Palette, link: "/toolkit/corporate-suite/logo-creator", category: "corporate" },
  { id: "company-profile", title: "JBJ Company Profile Builder", description: "Build a multi-page company profile PDF with AI-expanded content.", icon: Briefcase, link: "/toolkit/corporate-suite/company-profile", category: "corporate" },
  { id: "presentation-tool", title: "JBJ Presentation Builder", description: "Build professional slide decks with Canva-style templates and AI content.", icon: Layers, link: "/presentations", category: "corporate" },
  { id: "landing-page-builder", title: "JBJ Landing Page Builder", description: "Create a one-page business site with custom branding and HTML export.", icon: Globe, link: "/toolkit/corporate-suite/landing-page", category: "corporate" },
  { id: "esign", title: "JBJ E-Sign", description: "DocuSign-style contract signing with multi-signer workflows.", icon: Handshake, link: "/e-signature", category: "corporate" },
  { id: "scan-sign", title: "JBJ Scan & Sign", description: "Camera scan, handwritten signature & PDF export.", icon: FileSignature, link: "/toolkit/scan-sign", category: "corporate" },
  { id: "spreadsheet-tool", title: "JBJ Spreadsheet", description: "Create and edit spreadsheets with formula support and Excel/CSV export.", icon: FileText, link: "/spreadsheet", category: "corporate" },
  { id: "documents-tool", title: "JBJ Documents Editor", description: "Rich text document editor with version history and exports.", icon: FolderOpen, link: "/documents", category: "corporate" },
];

const mediaAndCreativeTools: ToolDef[] = [
  { id: "ai-video-studio", title: "JBJ Creative Video Suite", description: "Professional video editor with multi-track timeline, AI captions, voiceover, and effects.", icon: Play, link: "/toolkit/video-suite", category: "design" },
  { id: "video-resize-pack", title: "JBJ Video Resize + Smart Reframe", description: "Resize videos for any social platform with AI-powered subject tracking.", icon: Video, link: "/toolkit/video-resize-pack", category: "design" },
  { id: "voice-studio", title: "JBJ Voice Studio", description: "AI voice generation, text-to-speech with multiple voices and languages.", icon: Mic, link: "/toolkit/voice-studio", category: "design" },
  { id: "pdf-from-photos", title: "JBJ Photo → PDF Generator", description: "Convert photos to professional PDFs with custom layouts and title pages.", icon: FileText, link: "/toolkit/pdf-from-photos", category: "design" },
  { id: "image-resize", title: "JBJ Image Resizer + Social Sizes", description: "Resize images for Instagram, Facebook, LinkedIn with preset dimensions.", icon: FileImage, link: "/toolkit/image-resize", category: "design" },
  { id: "captions-translate", title: "JBJ Captions & Translation", description: "Auto-transcribe video audio and translate captions to 100+ languages.", icon: Languages, link: "/toolkit/captions-translate", category: "design" },
  { id: "background-ai", title: "JBJ AI Background Remover", description: "Remove or replace backgrounds from photos instantly using AI.", icon: Wand2, link: "/toolkit/background-ai", category: "design" },
  { id: "beauty-filters", title: "JBJ Beauty Filters", description: "Apply professional beauty enhancements and filters to photos.", icon: Sparkles, link: "/toolkit/beauty-filters", category: "design" },
  { id: "virtual-staging-ai", title: "JBJ AI Virtual Staging", description: "Virtually stage empty properties with AI-generated furniture.", icon: Building2, link: "/virtual-staging-ai", category: "design" },
  { id: "creative-suite", title: "JBJ Creative Suite", description: "Full-featured creative studio for video projects and property presentations.", icon: Sparkles, link: "/studio", category: "design" },
];

const aiSalesTools: ToolDef[] = [
  { id: "ai-followup-scheduler", title: "JBJ AI Follow-up Scheduler", description: "Smart follow-up scheduling based on lead behavior.", icon: Calendar, link: "/ai-followup-scheduler", category: "marketing" },
  { id: "ai-objection-handler", title: "JBJ AI Objection Handler", description: "Get AI-suggested responses to common objections.", icon: MessageSquare, link: "/ai-objection-handler", category: "marketing" },
  { id: "ai-client-matcher", title: "JBJ AI Client Matcher", description: "Match clients to properties using AI preferences analysis.", icon: Users, link: "/ai-client-matcher", category: "marketing" },
];

const aiReportTools: ToolDef[] = [
  { id: "ai-market-report", title: "JBJ AI Market Report", description: "Generate comprehensive market reports with AI analysis.", icon: BarChart3, link: "/ai-market-report", category: "property" },
  { id: "ai-competitor-analysis", title: "JBJ AI Competitor Analysis", description: "Analyze competitor listings and pricing strategies.", icon: TrendingUp, link: "/ai-competitor-analysis", category: "property" },
  { id: "ai-roi-calculator", title: "JBJ AI ROI Calculator", description: "Calculate investment returns with AI market predictions.", icon: Calculator, link: "/ai-roi-calculator", category: "property" },
  { id: "ai-investment-report", title: "JBJ AI Investment Report", description: "Generate detailed investment analysis reports.", icon: FileText, link: "/ai-investment-report", category: "property" },
];

const aiCommTools: ToolDef[] = [
  { id: "ai-meeting-summarizer", title: "JBJ AI Meeting Summarizer", description: "Summarize meetings and extract action items automatically.", icon: ClipboardList, link: "/ai-meeting-summarizer", category: "productivity" },
  { id: "ai-translation-hub", title: "JBJ AI Translation Hub", description: "Translate communications to any language instantly.", icon: Globe, link: "/ai-translation-hub", category: "productivity" },
  { id: "ai-video-tour-script", title: "JBJ AI Video Tour Script", description: "Generate professional video tour scripts for properties.", icon: Video, link: "/toolkit/video-suite", category: "productivity" },
  { id: "ai-email-generator", title: "JBJ AI Email Generator", description: "Generate professional emails for any occasion.", icon: Mail, link: "/ai-email-generator", category: "productivity" },
];

const aiContentTools: ToolDef[] = [
  { id: "ai-social-media", title: "JBJ AI Social Media", description: "Generate engaging social media content for properties.", icon: PenTool, link: "/ai-social-media", category: "marketing" },
  { id: "ai-description-writer", title: "JBJ AI Description Writer", description: "Write compelling property descriptions automatically.", icon: FileText, link: "/ai-description-writer", category: "marketing" },
  { id: "ai-contract-reviewer", title: "JBJ AI Contract Reviewer", description: "Review contracts and highlight important clauses.", icon: Scale, link: "/ai-contract-reviewer", category: "corporate" },
  { id: "ai-document-generator", title: "JBJ AI Document Generator", description: "Generate professional documents from templates.", icon: FileSignature, link: "/ai-document-generator", category: "corporate" },
];

const ALL_TOOLS: ToolDef[] = [
  ...investorTools,
  ...productivityTools,
  ...mediaAndCreativeTools,
  ...aiSalesTools,
  ...aiReportTools,
  ...aiCommTools,
  ...aiContentTools,
];

// Dedupe by id (some lists can overlap intentionally)
const dedupe = (tools: ToolDef[]): ToolDef[] => {
  const seen = new Set<string>();
  return tools.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
};

const SUITE_SHORTCUTS = [
  { label: "Creative Suite", desc: "Design studio, graphics & media", href: "/studio", icon: Palette },
  { label: "Broker Intelligence", desc: "Sales tools & market insights", href: "/business-suite/broker", icon: Brain },
  { label: "Productivity Suite", desc: "Docs, calendar & meetings", href: "/business-suite/productivity", icon: Zap },
  { label: "All Suites", desc: "Browse all available suites", href: "/business-suite", icon: Layers },
];

const QUICK_BENEFITS = [
  { icon: Brain, title: "Intelligent Analysis", desc: "AI processes thousands of data points." },
  { icon: Zap, title: "Instant Results", desc: "Get real-time insights instantly." },
  { icon: Shield, title: "Data Security", desc: "Industry-standard encryption." },
  { icon: Clock, title: "Save Time", desc: "Automate tedious tasks." },
];

// ─────────────────────────────────────────────────────────────────────────────
// Reusable tool card — single champagne style, ink text, gold hairline, purple
// IconTile (AI accent). Used in Discover grid and per-category sections.
// ─────────────────────────────────────────────────────────────────────────────
function ToolCard({ tool, index }: { tool: ToolDef; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.35 }}
      viewport={{ once: true }}
    >
      <Link
        to={tool.link}
        className="group h-full flex flex-col bg-[#FDFBF7] border border-[#B89555]/30 hover:border-[#B89555]/70 hover:shadow-[0_10px_28px_-12px_rgba(184,149,85,0.4)] rounded-2xl p-5 transition-all"
      >
        <div className="flex items-start justify-between mb-4 gap-3">
          <IconTile icon={tool.icon} tone="purple" size="md" />
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 text-[10px] uppercase tracking-wider px-2 py-0.5">
            Free
          </Badge>
        </div>
        <h3 className="text-[15px] font-semibold text-[#1A1A1A] leading-snug mb-1.5">
          {tool.title}
        </h3>
        <p className="text-[13px] text-[#1A1A1A]/70 leading-relaxed line-clamp-2 flex-1">
          {tool.description}
        </p>
        <div className="mt-4 flex items-center justify-between text-[12px] font-semibold text-[#1A1A1A]">
          <span className="opacity-70 group-hover:opacity-100 transition-opacity">Open tool</span>
          <ArrowUpRight className="w-4 h-4 text-[#B89555]" />
        </div>
      </Link>
    </motion.div>
  );
}

const AIHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toolSearch, setToolSearch] = useState("");
  const [toolFilter, setToolFilter] = useState<ToolCategory | "all">("all");

  const visibility = useToolVisibility();

  const allTools = useMemo(
    () => dedupe(ALL_TOOLS).filter((t) => visibility.isPublic(t.id)),
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

  const toolsByCategory = useMemo(() => {
    return allTools.reduce((acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = [];
      acc[tool.category].push(tool);
      return acc;
    }, {} as Record<ToolCategory, ToolDef[]>);
  }, [allTools]);

  const dashboardHref = user ? "/my-account" : "/auth?redirect=/ai-hub";

  return (
    <>
      <SEOHead
        title="JBJ Royal Tools Hub | Free Tools for Investors & Brokers"
        description="Access free tools for property investment, comparison, mortgage calculation, and more. Your complete investor toolkit at JBJ Global Real Estate."
        keywords="JBJ Royal Tools Hub, property tools, investment tools Dubai, property analysis, JBJ Global Real Estate"
        canonicalPath="/ai-hub"
      />

      <main data-marketing-page className="bg-[#FDFBF7]">
        {/* ════════════════════════════════════════════════════════════════
            HERO — full-bleed premium video, locked dark hero
        ════════════════════════════════════════════════════════════════ */}
        <section
          data-hero-dark
          className="jj-hero-fullscreen relative flex items-center overflow-hidden min-h-[86vh]"
        >
          {/* Video bg */}
          <div className="absolute inset-0 z-0">
            <VideoBackground
              src="/video/aihub-bg.mp4"
              poster="/video/aihub-bg-poster.jpg"
              opacity={1}
            />
          </div>

          {/* Legibility composite — matches MarketIntelligenceHero pattern */}
          <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/85 via-black/65 to-black/95 pointer-events-none" />
          <div
            className="absolute inset-0 z-[2] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 75%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-1/4 z-[2] bg-gradient-to-b from-transparent to-[#FDFBF7] pointer-events-none" />

          {/* Ambient gold orbs */}
          <div className="absolute top-1/4 left-1/4 w-[480px] h-[480px] rounded-full blur-[120px] bg-[#B89555]/10 z-[1] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[420px] h-[420px] rounded-full blur-[110px] bg-purple-500/10 z-[1] pointer-events-none" />

          <motion.div
            className="relative z-10 w-full py-24 px-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <div className="max-w-4xl mx-auto text-center">
              {/* Glass gold badge */}
              <motion.div variants={fadeInUp} className="mb-6 inline-block">
                <span
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 50%, rgba(184,149,85,0.10) 100%)",
                    backdropFilter: "blur(20px)",
                    border: "1.5px solid rgba(184,149,85,0.65)",
                    boxShadow:
                      "inset 0 1px 2px rgba(255,255,255,0.10), inset 0 -1px 2px rgba(0,0,0,0.20), 0 4px 20px rgba(0,0,0,0.30)",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B89555]" />
                  <span
                    className="text-[#B89555] font-semibold text-[10px] md:text-xs uppercase tracking-[0.22em]"
                    style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                  >
                    Free for All Users
                  </span>
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5 leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)]"
              >
                JBJ Royal Tools Hub
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-white/95 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-3 drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]"
              >
                Your Complete AI Tools Command Center
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="text-white/85 text-sm md:text-base max-w-xl mx-auto mb-8 drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]"
              >
                Free tools · Property analysis · Investment calculators · Productivity suite
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="w-24 h-px bg-gradient-to-r from-transparent via-[#B89555] to-transparent mx-auto mb-8"
              />

              {/* THREE EQUAL CTAs */}
              <motion.div
                variants={fadeInUp}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto"
              >
                <button
                  data-cta="dashboard"
                  onClick={() => navigate(dashboardHref)}
                  className="jj-cta-dark inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-sm font-semibold w-full"
                >
                  {user ? <User className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                  <span>{user ? "Go to My Dashboard" : "Sign In / Create Account"}</span>
                </button>

                <button
                  data-cta="explore"
                  onClick={() =>
                    document.getElementById("discover-tools")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="jj-cta-champagne inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-sm font-semibold w-full"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Explore Free Tools</span>
                </button>

                <button
                  data-cta="premium"
                  onClick={() => navigate("/pricing")}
                  className="jj-cta-dark inline-flex items-center justify-center gap-2 h-12 px-4 rounded-xl text-sm font-semibold w-full"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>View Premium Plans</span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            TRUST STRIP
        ════════════════════════════════════════════════════════════════ */}
        <section className="jj-band jj-band--surface py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
              {QUICK_BENEFITS.map((b, idx) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.06 }}
                  className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-5 text-center"
                >
                  <div className="flex justify-center mb-3">
                    <IconTile icon={b.icon} tone="gold" size="md" />
                  </div>
                  <h3 className="text-[#1A1A1A] font-semibold text-sm mb-1">{b.title}</h3>
                  <p className="text-[#1A1A1A]/70 text-xs leading-relaxed">{b.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            DISCOVER — search, filters, full grid
        ════════════════════════════════════════════════════════════════ */}
        <section id="discover-tools" className="jj-band jj-band--page py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-7xl">
            <PremiumSectionCard padding="lg" tone="page" width="contained">
              <div className="text-center max-w-3xl mx-auto mb-10">
                <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 mb-4 px-3 py-1">
                  <Sparkles className="w-3 h-3 mr-1.5 text-[#B89555]" />
                  All Free Tools
                </Badge>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1A1A1A] mb-3">
                  Discover All Free AI Tools
                </h2>
                <p className="text-[#1A1A1A]/70 text-base">
                  All tools in one place — each grouped by category, with AI-powered search.
                </p>
              </div>

              {/* Search + pills */}
              <div className="flex flex-col lg:flex-row gap-3 mb-8">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/50" />
                  <input
                    type="text"
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    placeholder="Search tools…"
                    className="w-full pl-11 pr-4 h-12 rounded-xl bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] placeholder:text-[#1A1A1A]/45 focus:border-[#B89555] focus:outline-none focus:ring-2 focus:ring-[#B89555]/20 transition-all"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", "property", "corporate", "productivity", "design", "marketing"] as const).map(
                    (cat) => {
                      const active = toolFilter === cat;
                      const label = cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1);
                      return (
                        <button
                          key={cat}
                          onClick={() => setToolFilter(cat)}
                          className={
                            active
                              ? "jj-pill-active px-4 h-10 rounded-full text-[11px] font-semibold uppercase tracking-wider"
                              : "px-4 h-10 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#FDFBF7] text-[#1A1A1A]/70 border border-[#B89555]/30 hover:border-[#B89555]/60 hover:text-[#1A1A1A] transition-all"
                          }
                        >
                          {label}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Suite shortcuts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {SUITE_SHORTCUTS.map((s) => (
                  <Link
                    key={s.label}
                    to={s.href}
                    className="group flex items-center gap-3 p-4 rounded-2xl bg-[#F7F2EA] border border-[#B89555]/30 hover:border-[#B89555]/70 hover:shadow-[0_8px_24px_-12px_rgba(184,149,85,0.35)] transition-all"
                  >
                    <IconTile icon={s.icon} tone="gold" size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-semibold text-[#1A1A1A] leading-snug">
                        {s.label}
                      </div>
                      <div className="text-[12px] text-[#1A1A1A]/65 truncate">{s.desc}</div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#B89555] opacity-70 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>

              {filteredTools.length === 0 ? (
                <div className="text-center py-16 text-[#1A1A1A]/60 text-sm">
                  No tools match your search.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTools.map((tool, idx) => (
                    <ToolCard key={tool.id} tool={tool} index={idx} />
                  ))}
                </div>
              )}
            </PremiumSectionCard>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            CATEGORY GROUPS — alternating champagne tones
        ════════════════════════════════════════════════════════════════ */}
        {(["property", "productivity", "corporate", "design", "marketing"] as ToolCategory[]).map(
          (category, idx) => {
            const tools = toolsByCategory[category] || [];
            if (tools.length === 0) return null;
            const meta = CATEGORY_META[category];
            const bandClass = idx % 2 === 0 ? "jj-band--surface" : "jj-band--raised";

            return (
              <section
                key={category}
                id={category === "property" ? "investor-tools" : `${category}-tools`}
                className={`jj-band ${bandClass} py-14 md:py-20`}
              >
                <div className="container mx-auto px-4 max-w-7xl">
                  <PremiumSectionCard padding="lg" tone="page" width="contained">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                      <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 mb-4 px-3 py-1">
                        <Sparkles className="w-3 h-3 mr-1.5 text-[#B89555]" />
                        {meta.label}
                      </Badge>
                      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1A1A1A] mb-3">
                        {meta.label}
                      </h2>
                      <p className="text-[#1A1A1A]/70 text-base">{meta.description}</p>
                    </div>

                    <motion.div
                      className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={staggerContainer}
                    >
                      {tools.map((tool, i) => (
                        <ToolCard key={tool.id} tool={tool} index={i} />
                      ))}
                    </motion.div>
                  </PremiumSectionCard>
                </div>
              </section>
            );
          }
        )}

        {/* ════════════════════════════════════════════════════════════════
            PORTAL ROW — Broker / Investor
        ════════════════════════════════════════════════════════════════ */}
        <section className="jj-band jj-band--surface py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-2 gap-5">
              {/* Broker Portal */}
              <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-7 flex flex-col">
                <IconTile icon={GraduationCap} tone="gold" size="md" />
                <h3 className="text-xl font-semibold text-[#1A1A1A] mt-4 mb-2">
                  Your Broker Portal
                </h3>
                <p className="text-[#1A1A1A]/70 text-sm leading-relaxed mb-6 flex-1">
                  Training, education, books, certifications, listing portal, and CRM tools for
                  brokers.
                </p>
                <button
                  data-cta="broker-portal"
                  onClick={() => navigate("/broker/portal")}
                  className="jj-cta-dark inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl text-sm font-semibold self-start"
                >
                  <span>Open Broker Portal</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>

              {/* Investor Hub */}
              <div className="bg-[#FDFBF7] border border-[#B89555]/30 rounded-2xl p-7 flex flex-col">
                <IconTile icon={TrendingUp} tone="gold" size="md" />
                <h3 className="text-xl font-semibold text-[#1A1A1A] mt-4 mb-2">
                  Your Investor Hub
                </h3>
                <p className="text-[#1A1A1A]/70 text-sm leading-relaxed mb-6 flex-1">
                  Portfolio, market intelligence, guides, books, and investment tools for investors.
                </p>
                <button
                  data-cta="investor-hub"
                  onClick={() => navigate("/investor-hub")}
                  className="jj-cta-dark inline-flex items-center justify-center gap-2 h-12 px-5 rounded-xl text-sm font-semibold self-start"
                >
                  <span>Open Investor Hub</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
            WELCOME-BACK BAND
        ════════════════════════════════════════════════════════════════ */}
        <section className="jj-band jj-band--raised py-14 md:py-20">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1A1A1A] mb-4">
              {user ? (
                <>
                  Welcome back,{" "}
                  <span className="text-[#1A1A1A]">{user.email?.split("@")[0]}</span>
                </>
              ) : (
                <>
                  Start Using <span className="text-[#1A1A1A]">All Free Tools</span>
                </>
              )}
            </h2>
            <p className="text-[#1A1A1A]/70 mb-7 max-w-xl mx-auto">
              30+ free tools for property analysis, corporate documents, creative design, and
              productivity.
            </p>
            <button
              data-cta={user ? "explore-above" : "signin-bottom"}
              onClick={() =>
                user
                  ? document
                      .getElementById("discover-tools")
                      ?.scrollIntoView({ behavior: "smooth" })
                  : navigate("/auth?redirect=/ai-hub")
              }
              className="jj-cta-dark inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl text-sm font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              <span>{user ? "Explore Tools Above" : "Sign In / Create Account"}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>
    </>
  );
};

export default AIHub;
