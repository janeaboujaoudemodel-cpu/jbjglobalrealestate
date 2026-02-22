import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { SectionDivider } from "@/components/ui/section-divider";
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
  Headphones,
  LogIn,
  FolderOpen,
  Home,
  Image,
  Share2,
  Lock,
  Globe,
  FileSignature,
  Handshake,
  ArrowRight,
  Ruler,
  Newspaper,
  TrendingUp,
  MapPin,
  UserCheck
} from "lucide-react";


const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

// Category definitions with styles - MATCHING BROKER HUB
// GLOW RULE: Category glow on normal load → Gold glow on hover
type ToolCategory = 'property' | 'productivity' | 'marketing' | 'design' | 'corporate';

const CATEGORY_META: Record<ToolCategory, {
  label: string;
  coloredLabel: string;
  badgeClass: string;
  cardClass: string;
  iconWrapClass: string;
  iconClass: string;
  arrowClass: string;
  glowClass: string;
}> = {
  property: {
    label: "Investment &",
    coloredLabel: "Property Tools",
    badgeClass: "bg-purple-500/30 text-purple-200 border-purple-400/50",
    // GLOW ON NORMAL LOAD (purple), WHITE GLOW ON HOVER
    cardClass: "bg-purple-900/80 border-2 border-purple-500/50 shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:border-white hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)]",
    iconWrapClass: "bg-purple-500/30 border border-purple-400/40",
    iconClass: "text-purple-300",
    arrowClass: "text-purple-300 group-hover:text-white",
    glowClass: "border-purple-500/50 shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)] hover:border-white",
  },
  productivity: {
    label: "Productivity",
    coloredLabel: "Tools",
    badgeClass: "bg-blue-500/30 text-blue-200 border-blue-400/50",
    // GLOW ON NORMAL LOAD (blue), WHITE GLOW ON HOVER
    cardClass: "bg-blue-900/80 border-2 border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:border-white hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)]",
    iconWrapClass: "bg-blue-500/30 border border-blue-400/40",
    iconClass: "text-blue-300",
    arrowClass: "text-blue-300 group-hover:text-white",
    glowClass: "border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.4)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)] hover:border-white",
  },
  marketing: {
    label: "Marketing &",
    coloredLabel: "Content",
    badgeClass: "bg-amber-500/30 text-amber-200 border-amber-400/50",
    // GLOW ON NORMAL LOAD (amber), WHITE GLOW ON HOVER - Distinct from Broker Hub green
    cardClass: "bg-amber-900/80 border-2 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:border-white hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)]",
    iconWrapClass: "bg-amber-500/30 border border-amber-400/40",
    iconClass: "text-amber-300",
    arrowClass: "text-amber-300 group-hover:text-white",
    glowClass: "border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)] hover:border-white",
  },
  design: {
    label: "Design &",
    coloredLabel: "Media",
    badgeClass: "bg-pink-500/30 text-pink-200 border-pink-400/50",
    cardClass: "bg-pink-900/80 border-2 border-pink-500/50 shadow-[0_0_25px_rgba(236,72,153,0.4)] hover:border-white hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)]",
    iconWrapClass: "bg-pink-500/30 border border-pink-400/40",
    iconClass: "text-pink-300",
    arrowClass: "text-pink-300 group-hover:text-white",
    glowClass: "border-pink-500/50 shadow-[0_0_25px_rgba(236,72,153,0.4)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)] hover:border-white",
  },
  corporate: {
    label: "Corporate",
    coloredLabel: "Suite Tools",
    badgeClass: "bg-teal-500/30 text-teal-200 border-teal-400/50",
    cardClass: "bg-teal-900/80 border-2 border-teal-500/50 shadow-[0_0_25px_rgba(20,184,166,0.4)] hover:border-white hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)]",
    iconWrapClass: "bg-teal-500/30 border border-teal-400/40",
    iconClass: "text-teal-300",
    arrowClass: "text-teal-300 group-hover:text-white",
    glowClass: "border-teal-500/50 shadow-[0_0_25px_rgba(20,184,166,0.4)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4),0_0_60px_rgba(255,255,255,0.2)] hover:border-white",
  },
};

// INVESTOR HUB TOOLS - Available to all users with category
const investorTools = [
  {
    id: "ai-home-finder",
    title: "JBJ AI Home Finder",
    description: "Match buyers to listings with AI-powered filters.",
    icon: Home,
    link: "/quiz",
    category: "property" as ToolCategory,
  },
  {
    id: "property-evaluator",
    title: "JBJ Property Evaluator",
    description: "AI-driven valuation based on live market data.",
    icon: Calculator,
    link: "/property-evaluator",
    category: "property" as ToolCategory,
  },
  {
    id: "property-comparison",
    title: "JBJ Property Comparison",
    description: "Compare properties side-by-side with AI insights.",
    icon: BarChart3,
    link: "/compare",
    category: "property" as ToolCategory,
  },
  {
    id: "mortgage-calculator",
    title: "JBJ Mortgage Calculator",
    description: "Estimate monthly payments and financing options.",
    icon: Calculator,
    link: "/mortgage-calculator",
    category: "property" as ToolCategory,
  },
  {
    id: "rental-index",
    title: "JBJ Rental Index Evaluator",
    description: "AI-powered rental estimates with market trends.",
    icon: Layers,
    link: "/rental-index",
    category: "property" as ToolCategory,
  },
  {
    id: "ai-property-analyzer",
    title: "JBJ AI Property Analyzer",
    description: "Deep market analysis with price trends and investment metrics.",
    icon: Brain,
    link: "/ai-property-analyzer",
    category: "property" as ToolCategory,
  },
  {
    id: "ai-price-predictor",
    title: "JBJ AI Price Predictor",
    description: "AI-powered price predictions with confidence bands and comparables.",
    icon: TrendingUp,
    link: "/ai-price-predictor",
    category: "property" as ToolCategory,
  },
  {
    id: "ai-neighborhood-insights",
    title: "JBJ AI Neighborhood Insights",
    description: "Comprehensive area analysis with livability scores and demographics.",
    icon: MapPin,
    link: "/ai-neighborhood-insights",
    category: "property" as ToolCategory,
  },
  {
    id: "ai-lead-qualification",
    title: "JBJ AI Lead Qualification",
    description: "Score leads with AI: confidence, objections, and next actions.",
    icon: UserCheck,
    link: "/ai-lead-qualification",
    category: "marketing" as ToolCategory,
  },
  {
    id: "interior-design",
    title: "JBJ AI Interior Design",
    description: "Visualize spaces with AI-generated designs.",
    icon: Image,
    link: "/interior-design-ai",
    category: "design" as ToolCategory,
  },
  {
    id: "business-card-scanner",
    title: "JBJ Business Card Scanner",
    description: "Scan and save business cards into your CRM.",
    icon: CreditCard,
    link: "/business-card-scanner",
    category: "productivity" as ToolCategory,
  },
  {
    id: "property-measurement",
    title: "JBJ Property Measurement",
    description: "Verify property sizes with AI precision.",
    icon: Ruler,
    link: "/property-measurement",
    category: "property" as ToolCategory,
  },
  // Removed JBJ News Reporter - it's internal automation, not a user tool
  {
    id: "property-coach",
    title: "JBJ Property Coach",
    description: "Scripts, objections, roleplay, deal strategy.",
    icon: Target,
    link: "/broker-toolkit",
    category: "marketing" as ToolCategory,
  },
];

// PRODUCTIVITY TOOLS
const productivityTools = [
  {
    id: "content-tools",
    title: "JBJ Documents & Spreadsheets",
    description: "Rich text editor and Excel-like tools.",
    icon: FileText,
    link: "/documents",
    category: "productivity" as ToolCategory,
  },
  {
    id: "video-meeting",
    title: "JBJ Video Meet",
    description: "Free unlimited video meetings with recording.",
    icon: Video,
    link: "/video-meeting",
    category: "productivity" as ToolCategory,
  },
  {
    id: "calendar",
    title: "JBJ Calendar & Notes",
    description: "Smart scheduling and reminders.",
    icon: Calendar,
    link: "/ai-calendar",
    category: "productivity" as ToolCategory,
  },
  // ── Corporate Suite Tools (12 tools) ─────────────────────────────────────
  {
    id: "stamp-generator",
    title: "JBJ AI Stamp Generator",
    description: "Generate professional company stamps — bilingual, multiple shapes, full export pack.",
    icon: Award,
    link: "/toolkit/stamp-generator",
    category: "corporate" as ToolCategory,
  },
  {
    id: "business-card",
    title: "JBJ Business Card Designer",
    description: "Design stunning business cards with AI extraction and 6 premium templates.",
    icon: CreditCard,
    link: "/toolkit/corporate-suite/business-card",
    category: "corporate" as ToolCategory,
  },
  {
    id: "cv-resume",
    title: "JBJ CV / Resume Builder",
    description: "Build a professional CV with AI-generated summary, 12 templates and PDF export.",
    icon: User,
    link: "/toolkit/corporate-suite/cv-resume",
    category: "corporate" as ToolCategory,
  },
  {
    id: "cover-letter",
    title: "JBJ Cover Letter Generator",
    description: "Generate tailored cover letters with Gemini AI. 3 layouts, export as PDF.",
    icon: FileText,
    link: "/toolkit/corporate-suite/cover-letter",
    category: "corporate" as ToolCategory,
  },
  {
    id: "logo-creator",
    title: "JBJ AI Logo Creator",
    description: "Generate professional logos with AI. Choose style, industry and colors. Export PNG & SVG.",
    icon: Palette,
    link: "/toolkit/corporate-suite/logo-creator",
    category: "corporate" as ToolCategory,
  },
  {
    id: "company-profile",
    title: "JBJ Company Profile Builder",
    description: "Build a multi-page company profile PDF with AI-expanded content and 3 premium templates.",
    icon: Briefcase,
    link: "/toolkit/corporate-suite/company-profile",
    category: "corporate" as ToolCategory,
  },
  {
    id: "presentation-tool",
    title: "JBJ Presentation Builder",
    description: "Build professional slide decks with Canva-style templates and AI-generated content.",
    icon: Layers,
    link: "/presentations",
    category: "corporate" as ToolCategory,
  },
  {
    id: "landing-page-builder",
    title: "JBJ Landing Page Builder",
    description: "Create a one-page business site with custom branding and HTML export.",
    icon: Globe,
    link: "/toolkit/corporate-suite/landing-page",
    category: "corporate" as ToolCategory,
  },
  {
    id: "esign",
    title: "JBJ E-Sign",
    description: "DocuSign-style contract signing with multi-signer workflows and audit trails.",
    icon: Handshake,
    link: "/e-signature",
    category: "corporate" as ToolCategory,
  },
  {
    id: "scan-sign",
    title: "JBJ Scan & Sign",
    description: "Camera scan, handwritten signature & PDF export.",
    icon: FileSignature,
    link: "/toolkit/scan-sign",
    category: "corporate" as ToolCategory,
  },
  {
    id: "spreadsheet-tool",
    title: "JBJ Spreadsheet",
    description: "Create and edit spreadsheets with formula support and Excel/CSV export.",
    icon: FileText,
    link: "/spreadsheet",
    category: "corporate" as ToolCategory,
  },
  {
    id: "documents-tool",
    title: "JBJ Documents Editor",
    description: "Rich text document editor with version history and export capabilities.",
    icon: FolderOpen,
    link: "/documents",
    category: "corporate" as ToolCategory,
  },
];

// SUPPORT & OPERATIONS - Human Personas (shown in Broker Hub preview)
// These are human support roles, NOT AI tools - moved to Support/Operations section
const supportOperationsTools = [
  {
    id: "listing-admin",
    title: "Listing Admin (Sarah)",
    description: "Listing setup, docs, and developer coordination.",
    icon: FolderOpen,
    link: "/listing-admin",
  },
  {
    id: "broker-admin-support",
    title: "Broker Admin Support",
    description: "Operational support and coordination.",
    icon: Briefcase,
    link: "/broker-admin-assistant",
  },
  {
    id: "operations-compliance",
    title: "Operations & Compliance",
    description: "RERA compliance and operational support.",
    icon: Shield,
    link: "/broker-admin-assistant",
  },
  {
    id: "crm-support",
    title: "JBJ CRM Support",
    description: "Lead management and CRM assistance.",
    icon: Users,
    link: "/crm",
  },
];

// BROKER-ONLY AI TOOLS (shown as preview to encourage joining)
const brokerOnlyTools = [
  {
    id: "hr-manager",
    title: "HR Manager (Jessica)",
    description: "Hiring pipeline, performance tracking, HR policies.",
    icon: Users,
    link: "/hr-hub",
  },
  {
    id: "graphic-designer",
    title: "JBJ Graphic Designer",
    description: "Create brochures, ads, and marketing materials.",
    icon: Palette,
    link: "/jbj-design-studio",
  },
  {
    id: "video-producer",
    title: "JBJ Video Producer",
    description: "Cinematic property tours and marketing videos.",
    icon: Film,
    link: "/video-builder",
  },
  {
    id: "photographer",
    title: "JBJ Photographer",
    description: "Auto-enhance listing photos with AI filters.",
    icon: Camera,
    link: "/jbj-design-studio",
  },
  {
    id: "digital-marketing",
    title: "JBJ Digital Marketing",
    description: "Automate ads, campaigns, and analytics.",
    icon: Megaphone,
    link: "/broker-toolkit",
  },
  {
    id: "social-workshop",
    title: "JBJ Social Media Workshop",
    description: "Tutorials and training to grow your brand.",
    icon: Share2,
    link: "/broker-toolkit",
  },
];

const quickBenefits = [
  { icon: Brain, title: "Intelligent Analysis", desc: "AI processes thousands of data points." },
  { icon: Zap, title: "Instant Results", desc: "Get real-time insights instantly." },
  { icon: Shield, title: "Data Security", desc: "Industry-standard encryption." },
  { icon: Clock, title: "Save Time", desc: "Automate tedious tasks." },
];



const AIHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toolSearch, setToolSearch] = useState('');
  const [toolFilter, setToolFilter] = useState<ToolCategory | 'all'>('all');

  // Combine all tools
  const allTools = [...investorTools, ...productivityTools];

  // Filter tools by search and category
  const filteredTools = allTools.filter(tool => {
    const matchesSearch = !toolSearch || tool.title.toLowerCase().includes(toolSearch.toLowerCase()) || tool.description.toLowerCase().includes(toolSearch.toLowerCase());
    const matchesCategory = toolFilter === 'all' || tool.category === toolFilter;
    return matchesSearch && matchesCategory;
  });

  // Group tools by category
  const toolsByCategory = allTools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<ToolCategory, typeof allTools>);

  // Render tool card for bulk section (glow/border only)
  const renderBulkToolCard = (tool: typeof investorTools[0], index: number) => {
    const meta = CATEGORY_META[tool.category];
    
    return (
      <motion.div 
        key={tool.id} 
        variants={fadeInUp}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        viewport={{ once: true }}
      >
        <Link to={tool.link} className="block group h-full">
          <Card className={`bg-black/40 backdrop-blur-sm border-2 ${meta.glowClass} transition-all duration-300 h-full group-hover:scale-[1.02]`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${meta.iconWrapClass} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <tool.icon className={`w-6 h-6 ${meta.iconClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <h3 className={`font-semibold text-sm leading-tight ${meta.iconClass}`}>{tool.title}</h3>
                    <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/50 text-[10px] px-1.5 py-0 flex-shrink-0">
                      FREE
                    </Badge>
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">{tool.description}</p>
                </div>
                <ArrowUpRight className={`w-5 h-5 ${meta.arrowClass} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  // Render tool card for category sections (FILLED backgrounds - matching Broker Hub)
  const renderCategoryToolCard = (tool: typeof investorTools[0], index: number) => {
    const meta = CATEGORY_META[tool.category];
    
    return (
      <motion.div 
        key={`cat-${tool.id}`} 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        viewport={{ once: true }}
      >
        <Link to={tool.link} className="block group h-full">
          <Card className={`${meta.cardClass} transition-all duration-300 h-full group-hover:scale-[1.02]`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${meta.iconWrapClass} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <tool.icon className={`w-6 h-6 ${meta.iconClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm leading-tight text-white">{tool.title}</h3>
                    <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/50 text-[10px] px-1.5 py-0 flex-shrink-0">
                      FREE
                    </Badge>
                  </div>
                  <p className="text-white/70 text-sm line-clamp-2">{tool.description}</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-white/50 opacity-0 group-hover:opacity-100 group-hover:text-gold transition-all flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  // Render broker-only locked cards (GREEN theme for Broker Hub section)
  // If user is logged in, they can access these tools directly
  const renderLockedCard = (tool: typeof brokerOnlyTools[0]) => (
    <motion.div key={tool.id} variants={fadeInUp}>
      <div 
        className="block group h-full cursor-pointer" 
        onClick={() => navigate(user ? tool.link : "/join")}
      >
        <Card className="bg-gold/10 border-2 border-gold/50 hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.4)] shadow-[0_0_20px_rgba(200,167,102,0.2)] h-full relative overflow-hidden transition-all duration-300">
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gold/20 border border-gold/40 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <tool.icon className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1 flex-wrap">
                  <h3 className="text-white font-semibold text-sm leading-tight">{tool.title}</h3>
                  {user ? (
                    <Badge className="bg-gold/30 text-gold border-gold/50 text-[10px] px-1.5 py-0 flex-shrink-0">
                      FREE
                    </Badge>
                  ) : (
                    <Badge className="bg-gold/30 text-gold border-gold/50 text-[10px] px-1.5 py-0 flex-shrink-0">
                      <Lock className="w-2.5 h-2.5 mr-1" />
                      BROKER ONLY
                    </Badge>
                  )}
                </div>
                <p className="text-zinc-300 text-sm line-clamp-2">{tool.description}</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gold opacity-0 group-hover:opacity-100 group-hover:text-gold transition-all flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  return (
    <>
      <SEOHead 
        title="JBJ Tools Hub | Free AI Tools for Investors & Brokers"
        description="Access free AI tools for property investment, comparison, mortgage calculation, and more. Your complete investor toolkit at JBJ Global Real Estate."
        keywords="JBJ Tools Hub, property tools, Real Estate AI, investment tools Dubai, property analysis, JBJ Global Real Estate"
        canonicalPath="/ai-hub"
      />
      
      <section className="relative w-full min-h-screen bg-[#0D0D0D]">
        {/* HERO SECTION - With Video Background */}
        <div className="relative py-10 md:py-14 overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover opacity-40"
              poster="https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80"
            >
              <source 
                src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4" 
                type="video/mp4" 
              />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-[#0D0D0D]" />
          </div>
          
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 overflow-hidden z-[1]">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10 pt-8 md:pt-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Premium Label - Glass style with gold border, engraved look */}
              <motion.div variants={fadeInUp} className="mb-6">
                <button 
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full cursor-default"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1.5px solid rgba(200,167,102,0.6)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
                  }}
                >
                  <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
                  <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Free for All Users</span>
                </button>
              </motion.div>

              {/* Main Title - Premium Black Styling */}
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                variants={fadeInUp}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-white">JBJ </span>
                <span className="text-white">Tools Hub</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p 
                className="text-white text-lg md:text-xl max-w-2xl mx-auto mb-4 leading-relaxed"
                variants={fadeInUp}
              >
                Your Complete Tools Command Center
              </motion.p>

              <motion.p 
                className="text-zinc-400 text-base max-w-xl mx-auto mb-8"
                variants={fadeInUp}
              >
                Free AI tools • Property analysis • Investment calculators • Productivity suite
              </motion.p>

              {/* Premium Gold Divider */}
              <motion.div 
                variants={fadeInUp}
                className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"
              />

              {/* Hero CTA Buttons - Transparent bg, white 3D border, white title, gold icon on normal; filled on hover */}
              <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mb-8">
                {!user ? (
                  <button 
                    onClick={() => navigate("/auth?redirect=/ai-hub")}
                    className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                    style={{
                      border: '2px solid rgba(255,255,255,0.8)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                    }}
                  >
                    <LogIn className="w-5 h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                    <span className="text-white group-hover:text-black transition-colors">Sign In / Create Account</span>
                    <ArrowUpRight className="w-5 h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                    {/* Hover fill overlay */}
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate("/my-account")}
                    className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                    style={{
                      border: '2px solid rgba(255,255,255,0.8)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                    }}
                  >
                    <User className="w-5 h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                    <span className="text-white group-hover:text-black transition-colors">Go to My Dashboard</span>
                    <ArrowUpRight className="w-5 h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                    {/* Hover fill overlay */}
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                  </button>
                )}
                {/* Explore Free Tools Button */}
                <button 
                  onClick={() => document.getElementById('investor-tools')?.scrollIntoView({ behavior: 'smooth' })}
                  className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                  style={{
                    border: '2px solid rgba(255,255,255,0.8)',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                  }}
                >
                  <span className="text-white group-hover:text-black transition-colors">Explore Free Tools</span>
                  <ArrowUpRight className="w-5 h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                  {/* Hover fill overlay */}
                  <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
                </button>
                {/* View Premium Plans Button - Using primary champagne gradient */}
                <button 
                  onClick={() => navigate("/pricing")}
                  className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E6 50%, #EDE4D3 100%)',
                    border: '2px solid rgba(200,167,102,0.6)',
                    boxShadow: '0 4px 15px rgba(200,167,102,0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
                  }}
                >
                  <Sparkles className="w-5 h-5 text-gold" />
                  <span className="text-black font-bold">View Premium Plans</span>
                  <ArrowUpRight className="w-5 h-5 text-gold" />
                  {/* Hover glow overlay */}
                  <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 30px rgba(200,167,102,0.5), inset 0 0 15px rgba(200,167,102,0.1)' }} />
                </button>
              </motion.div>

            </motion.div>
          </div>
        </div>

        {/* Divider */}
        <SectionDivider />

        {/* Quick Benefits Strip - Active Champagne Layer */}
        <section className="py-8 bg-black">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 rounded-2xl p-6 md:p-8 shadow-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {quickBenefits.map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl p-4 text-center shadow-sm"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <benefit.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-black font-semibold text-sm mb-1">{benefit.title}</h3>
                    <p className="text-zinc-600 text-xs">{benefit.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <SectionDivider />

        {/* ALL TOOLS SECTION - Bulk view with Active Color Layer */}
        <section className="py-8 md:py-10 bg-black">
          <div className="container mx-auto px-3 sm:px-4">
            {/* Active Slate/Blue Layer - matching Broker Hub */}
            <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 border border-slate-600/30 rounded-2xl p-6 md:p-8 shadow-lg">
              <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 rounded-full shadow-[0_0_15px_rgba(200,167,102,0.25)] mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span className="text-black text-xs uppercase tracking-wider font-medium">All Free Tools</span>
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Discover All <span className="text-sky-300">Free AI Tools</span>
                </h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                  All tools in one place — each with its unique theme. Scroll down to see them organized by category.
                </p>
              </motion.div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    placeholder="Search tools..."
                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-zinc-600 text-white placeholder:text-zinc-500 focus:border-gold/50 focus:outline-none transition-colors"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'property', 'corporate', 'productivity', 'design', 'marketing'] as const).map(cat => {
                    const pillColors: Record<string, { active: string; inactive: string }> = {
                      all: { active: 'bg-white text-black border-white', inactive: 'text-white/70 border-white/20 hover:border-white/50 hover:text-white' },
                      property: { active: 'bg-purple-500 text-white border-purple-400', inactive: 'text-purple-300 border-purple-500/30 hover:border-purple-400 hover:text-purple-200' },
                      corporate: { active: 'bg-teal-500 text-white border-teal-400', inactive: 'text-teal-300 border-teal-500/30 hover:border-teal-400 hover:text-teal-200' },
                      productivity: { active: 'bg-blue-500 text-white border-blue-400', inactive: 'text-blue-300 border-blue-500/30 hover:border-blue-400 hover:text-blue-200' },
                      design: { active: 'bg-pink-500 text-white border-pink-400', inactive: 'text-pink-300 border-pink-500/30 hover:border-pink-400 hover:text-pink-200' },
                      marketing: { active: 'bg-amber-500 text-white border-amber-400', inactive: 'text-amber-300 border-amber-500/30 hover:border-amber-400 hover:text-amber-200' },
                    };
                    const colors = pillColors[cat] || pillColors.all;
                    return (
                      <button
                        key={cat}
                        onClick={() => setToolFilter(cat)}
                        className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all border ${
                          toolFilter === cat ? colors.active : colors.inactive
                        }`}
                      >
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Suite Shortcut Cards - Prominent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Creative Suite', desc: 'Design studio, graphics & media', href: '/studio', icon: Palette, border: 'border-pink-500/50', bg: 'bg-gradient-to-br from-pink-900/60 to-pink-950/60', text: 'text-pink-300', glow: 'shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)]' },
                  { label: 'Broker Intelligence', desc: 'Sales tools & market insights', href: '/business-suite/broker', icon: Brain, border: 'border-teal-500/50', bg: 'bg-gradient-to-br from-teal-900/60 to-teal-950/60', text: 'text-teal-300', glow: 'shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]' },
                  { label: 'Productivity Suite', desc: 'Docs, calendar & meetings', href: '/business-suite/productivity', icon: Zap, border: 'border-blue-500/50', bg: 'bg-gradient-to-br from-blue-900/60 to-blue-950/60', text: 'text-blue-300', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]' },
                  { label: 'All Suites', desc: 'Browse all available suites', href: '/business-suite', icon: Layers, border: 'border-purple-500/50', bg: 'bg-gradient-to-br from-purple-900/60 to-purple-950/60', text: 'text-purple-300', glow: 'shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]' },
                ].map(suite => (
                  <Link key={suite.label} to={suite.href} className={`flex flex-col gap-2 p-5 rounded-2xl ${suite.bg} border-2 ${suite.border} ${suite.text} ${suite.glow} hover:border-white hover:shadow-[0_0_35px_rgba(255,255,255,0.3)] transition-all duration-300 group`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center`}>
                        <suite.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-white">{suite.label}</h4>
                        <p className="text-xs text-white/50">{suite.desc}</p>
                      </div>
                      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-white" />
                    </div>
                  </Link>
                ))}
              </div>

              <motion.div 
                className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {filteredTools.map((tool, idx) => renderBulkToolCard(tool, idx))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <SectionDivider />

        {/* CATEGORY SECTIONS - Active color layer with filled cards */}
        {(['property', 'productivity', 'corporate', 'design', 'marketing'] as ToolCategory[]).map((category) => {
          const meta = CATEGORY_META[category];
          const categoryTools = toolsByCategory[category] || [];
          if (categoryTools.length === 0) return null;

          // Get category-specific background color for the active layer
          const categoryBgMap: Record<ToolCategory, string> = {
            property: 'bg-gradient-to-br from-purple-900/90 via-purple-900/80 to-purple-950/90',
            productivity: 'bg-gradient-to-br from-blue-900/90 via-blue-900/80 to-blue-950/90',
            design: 'bg-gradient-to-br from-pink-900/90 via-pink-900/80 to-pink-950/90',
            marketing: 'bg-gradient-to-br from-amber-900/90 via-amber-900/80 to-amber-950/90',
            corporate: 'bg-gradient-to-br from-teal-900/90 via-teal-900/80 to-teal-950/90',
          };

          const borderColorMap: Record<ToolCategory, string> = {
            property: 'border-purple-500/30',
            productivity: 'border-blue-500/30',
            design: 'border-pink-500/30',
            marketing: 'border-amber-500/30',
            corporate: 'border-teal-500/30',
          };

          return (
            <section key={category} id={category === 'property' ? 'investor-tools' : `${category}-tools`} className="py-8 md:py-10 bg-black">
              <div className="container mx-auto px-3 sm:px-4">
                {/* Active Color Layer - Category-specific */}
                <div className={`${categoryBgMap[category]} ${borderColorMap[category]} border rounded-2xl p-4 sm:p-6 shadow-lg`}>
                  <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <Badge className={`${meta.badgeClass} mb-4`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      {meta.label} {meta.coloredLabel}
                    </Badge>
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">
                      <span className="text-white">{meta.label} </span>
                      <span className={meta.iconClass}>{meta.coloredLabel}</span>
                    </h2>
                    <p className="text-white/70 max-w-2xl mx-auto">
                    {category === 'property' && "Powerful AI tools for property analysis, valuation, and investment decisions."}
                      {category === 'productivity' && "Video meetings, documents, calendar, and signing tools."}
                      {category === 'corporate' && "Professional stamps, business cards, logos, CVs, e-signatures and more."}
                      {category === 'design' && "Creative tools for interior design and visual content."}
                      {category === 'marketing' && "Marketing and content creation tools."}
                    </p>
                  </motion.div>

                  <motion.div 
                    className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                  >
                    {categoryTools.map((tool, idx) => renderCategoryToolCard(tool, idx))}
                  </motion.div>
                </div>
              </div>

              {/* Divider */}
              <SectionDivider />
            </section>
          );
        })}

        {/* CTA - Join Broker Hub or Investor Hub */}
        <section className="py-8 md:py-10 bg-black">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Broker Hub CTA */}
              <div className="bg-gradient-to-br from-fuchsia-900/30 to-purple-900/30 border border-fuchsia-500/20 rounded-2xl p-8 text-center">
                <GraduationCap className="w-8 h-8 text-fuchsia-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">JBJ Broker Hub</h3>
                <p className="text-zinc-400 text-sm mb-4">Training, education, books, certifications, listing portal, and CRM tools for brokers.</p>
                <button 
                  onClick={() => navigate('/broker-hub')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white hover:opacity-90 transition-all"
                >
                  Go to Broker Hub
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              {/* Investor Hub CTA */}
              <div className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20 rounded-2xl p-8 text-center">
                <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">JBJ Investor Hub</h3>
                <p className="text-zinc-400 text-sm mb-4">Portfolio, market intelligence, guides, books, and investment tools for investors.</p>
                <button 
                  onClick={() => navigate('/investor-hub')}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 transition-all"
                >
                  Go to Investor Hub
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <SectionDivider />

        {/* Simple Bottom CTA */}
        <section className="py-8 md:py-10 bg-black">
          <div className="container mx-auto px-4">
            <div className="max-w-[900px] mx-auto text-center">
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 md:p-12">
                <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">
                  {user ? (
                    <>Welcome back, <span className="text-gold">{user.email?.split('@')[0]}</span>!</>
                  ) : (
                    <>Start Using <span className="text-gold">All Free Tools</span></>
                  )}
                </h2>
                <p className="text-zinc-600 mb-6 max-w-lg mx-auto">
                  30+ free AI tools for property analysis, corporate documents, creative design, and productivity.
                </p>
                {user ? (
                  <button 
                    onClick={() => document.getElementById('investor-tools')?.scrollIntoView({ behavior: 'smooth' })}
                    className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-xl bg-black text-gold border-2 border-gold/50 hover:bg-gold/10 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    Explore Tools Above
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate("/auth?redirect=/ai-hub")}
                    className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold rounded-xl bg-black text-gold border-2 border-gold/50 hover:bg-gold/10 transition-all"
                  >
                    <Sparkles className="w-5 h-5" />
                    Sign In / Create Account
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </>
  );
};

export default AIHub;
