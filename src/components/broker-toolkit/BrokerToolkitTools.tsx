import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wrench,
  ArrowRight,
  Layout,
  TrendingUp,
  Calculator,
  FileSignature,
  CreditCard,
  Table2,
  Users,
  FolderOpen,
  Video,
  Share2,
  Sparkles,
  Lock,
  Unlock,
  Home,
  Layers,
  Image,
  Calendar,
  Film,
  Briefcase,
  Camera,
  Ruler,
  Shield,
  LucideIcon,
} from "lucide-react";

type ToolTier = "free" | "member";

type ToolCategory =
  | "property"
  | "marketing"
  | "documents"
  | "design"
  | "productivity"
  | "operations";

type ToolItem = {
  name: string;
  description: string;
  icon: LucideIcon;
  link: string;
  tier: ToolTier;
  category: ToolCategory;
};

const CATEGORY_META: Record<
  ToolCategory,
  {
    label: string;
    coloredLabel?: string; // Second word to be colored
    badgeClass: string;
    cardClass: string;
    iconWrapClass: string;
    iconClass: string;
    arrowClass: string;
  }
> = {
  property: {
    label: "Property",
    coloredLabel: "Tools",
    badgeClass: "bg-purple-500/30 text-purple-200 border-purple-400/50",
    cardClass:
      "bg-purple-900/80 border-2 border-purple-500/50 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] shadow-[0_0_20px_rgba(147,51,234,0.3)]",
    iconWrapClass: "bg-purple-500/30 border border-purple-400/40",
    iconClass: "text-purple-300",
    arrowClass: "text-purple-300",
  },
  marketing: {
    label: "Marketing",
    coloredLabel: "Tools",
    badgeClass: "bg-emerald-500/30 text-emerald-200 border-emerald-400/50",
    cardClass:
      "bg-emerald-900/80 border-2 border-emerald-500/50 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    iconWrapClass: "bg-emerald-500/30 border border-emerald-400/40",
    iconClass: "text-emerald-300",
    arrowClass: "text-emerald-300",
  },
  documents: {
    label: "Document",
    coloredLabel: "Center",
    badgeClass: "bg-teal-500/30 text-teal-200 border-teal-400/50",
    cardClass:
      "bg-teal-900/80 border-2 border-teal-500/50 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] shadow-[0_0_20px_rgba(20,184,166,0.3)]",
    iconWrapClass: "bg-teal-500/30 border border-teal-400/40",
    iconClass: "text-teal-300",
    arrowClass: "text-teal-300",
  },
  design: {
    label: "Design",
    coloredLabel: "& Media",
    badgeClass: "bg-pink-500/30 text-pink-200 border-pink-400/50",
    cardClass:
      "bg-pink-900/80 border-2 border-pink-500/50 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] shadow-[0_0_20px_rgba(236,72,153,0.3)]",
    iconWrapClass: "bg-pink-500/30 border border-pink-400/40",
    iconClass: "text-pink-300",
    arrowClass: "text-pink-300",
  },
  productivity: {
    label: "Productivity",
    coloredLabel: "Tools",
    badgeClass: "bg-indigo-500/30 text-indigo-200 border-indigo-400/50",
    cardClass:
      "bg-indigo-900/80 border-2 border-indigo-500/50 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] shadow-[0_0_20px_rgba(99,102,241,0.3)]",
    iconWrapClass: "bg-indigo-500/30 border border-indigo-400/40",
    iconClass: "text-indigo-300",
    arrowClass: "text-indigo-300",
  },
  operations: {
    label: "Operations",
    coloredLabel: "& CRM",
    badgeClass: "bg-cyan-500/30 text-cyan-200 border-cyan-400/50",
    cardClass:
      "bg-cyan-900/80 border-2 border-cyan-500/50 hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    iconWrapClass: "bg-cyan-500/30 border border-cyan-400/40",
    iconClass: "text-cyan-300",
    arrowClass: "text-cyan-300",
  },
};

// Updated order: Marketing → Documents → Design → Property → Productivity → Support/Operations
const CATEGORY_ORDER: ToolCategory[] = [
  "marketing",
  "documents",
  "design",
  "property",
  "productivity",
  "operations",
];

const TOOLS: ToolItem[] = [
  // Property tools
  {
    name: "JBJ AI Home Finder",
    description: "Match clients to listings with AI-powered filters",
    icon: Home,
    link: "/quiz",
    tier: "free",
    category: "property",
  },
  {
    name: "JBJ AI Property Comparison",
    description: "Compare up to 3 properties with AI-powered insights",
    icon: Layout,
    link: "/compare",
    tier: "free",
    category: "property",
  },
  {
    name: "JBJ Property Evaluator",
    description: "AI-driven valuation based on market data",
    icon: TrendingUp,
    link: "/property-evaluator",
    tier: "free",
    category: "property",
  },
  {
    name: "JBJ Mortgage Calculator",
    description: "Calculate payments and affordability instantly",
    icon: Calculator,
    link: "/mortgage-calculator",
    tier: "free",
    category: "property",
  },
  {
    name: "JBJ Rental Index Evaluator",
    description: "Rental estimates with market benchmarks",
    icon: Layers,
    link: "/rental-index",
    tier: "free",
    category: "property",
  },
  {
    name: "JBJ AI Interior Design",
    description: "Visualize spaces with AI-generated designs",
    icon: Image,
    link: "/interior-design-ai",
    tier: "free",
    category: "property",
  },
  {
    name: "JBJ Property Measurement",
    description: "Verify property sizes with AI precision",
    icon: Ruler,
    link: "/property-measurement",
    tier: "free",
    category: "property",
  },
  {
    name: "JBJ Listing Portal",
    description: "AI-powered property listing submission",
    icon: FolderOpen,
    link: "/listing-portal",
    tier: "free",
    category: "property",
  },

  // Marketing - Removed JBJ News Reporter (internal automation, not user tool)
  {
    name: "JBJ Content Generator",
    description: "AI-powered marketing content creation",
    icon: Sparkles,
    link: "/ai-hub",
    tier: "member",
    category: "marketing",
  },
  {
    name: "JBJ Social Sharing",
    description: "Quick share tools for listings & campaigns",
    icon: Share2,
    link: "/ai-hub",
    tier: "member",
    category: "marketing",
  },

  // Documents
  {
    name: "JBJ Documents",
    description: "Contracts, templates, and files",
    icon: FolderOpen,
    link: "/documents",
    tier: "member",
    category: "documents",
  },
  {
    name: "JBJ Spreadsheet",
    description: "Property tracking and analysis tools",
    icon: Table2,
    link: "/spreadsheet",
    tier: "member",
    category: "documents",
  },
  {
    name: "JBJ Scan & Sign",
    description: "Digital document scanning and signing",
    icon: FileSignature,
    link: "/toolkit/scan-sign",
    tier: "free",
    category: "documents",
  },
  {
    name: "JBJ AI Stamp Generator",
    description: "Create professional company stamps with AI",
    icon: Shield,
    link: "/toolkit/stamp-generator",
    tier: "free",
    category: "documents",
  },
  {
    name: "JBJ E-Sign",
    description: "DocuSign-style signing with audit trail",
    icon: Unlock,
    link: "/e-signature",
    tier: "free",
    category: "documents",
  },

  // Design & media
  {
    name: "JBJ Design Studio",
    description: "Professional graphics & marketing materials",
    icon: Share2,
    link: "/jbj-design-studio",
    tier: "member",
    category: "design",
  },
  {
    name: "JBJ Video Builder",
    description: "Create HD walkthroughs & marketing videos",
    icon: Film,
    link: "/video-builder",
    tier: "member",
    category: "design",
  },
  {
    name: "JBJ Video Meet",
    description: "HD video calls with clients",
    icon: Video,
    link: "/video-meeting",
    tier: "member",
    category: "design",
  },
  {
    name: "JBJ Business Card Scanner",
    description: "AI-powered contact extraction from cards",
    icon: CreditCard,
    link: "/business-card-scanner",
    tier: "free",
    category: "design",
  },
  {
    name: "JBJ Photo Tools",
    description: "Enhance listing visuals and media assets",
    icon: Camera,
    link: "/interior-design-ai",
    tier: "free",
    category: "design",
  },

  // Productivity - Calendar is NOT FREE per requirements
  {
    name: "JBJ Calendar & Notes",
    description: "Smart scheduling and reminders",
    icon: Calendar,
    link: "/ai-calendar",
    tier: "member",
    category: "productivity",
  },

  // Operations & CRM - Human personas moved to Support/Operations section
  {
    name: "JBJ CRM",
    description: "Complete lead management system",
    icon: Users,
    link: "/crm",
    tier: "member",
    category: "operations",
  },
];

// SUPPORT & OPERATIONS - Human Personas (NOT AI Tools)
// These are human support roles, not automated AI tools
export const SUPPORT_OPERATIONS: ToolItem[] = [
  {
    name: "Listing Admin (Sarah)",
    description: "Listing setup, docs, and developer coordination",
    icon: FolderOpen,
    link: "/listing-admin",
    tier: "member",
    category: "operations",
  },
  {
    name: "Broker Admin Support",
    description: "Operational support and coordination",
    icon: Briefcase,
    link: "/broker-admin-assistant",
    tier: "member",
    category: "operations",
  },
  {
    name: "JBJ CRM Support",
    description: "Lead management and CRM assistance",
    icon: Users,
    link: "/crm",
    tier: "member",
    category: "operations",
  },
  {
    name: "Operations & Compliance",
    description: "RERA compliance and operational support",
    icon: Shield,
    link: "/broker-admin-assistant",
    tier: "member",
    category: "operations",
  },
];

export function BrokerToolkitTools() {
  // Helper to get color-specific glow (category color on normal, WHITE on hover)
  const getBulkCardGlow = (category: ToolCategory): string => {
    const glowMap: Record<ToolCategory, string> = {
      property: "border-purple-500/50 shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:border-white",
      marketing: "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:border-white",
      documents: "border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:border-white",
      design: "border-pink-500/50 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:border-white",
      productivity: "border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:border-white",
      operations: "border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:border-white",
    };
    return glowMap[category];
  };

  // Render tool card for the ALL TOOLS section (glow/border only with per-tool color)
  // REVERSED GLOW: Color glow on normal, Gold glow on hover
  const renderBulkToolCard = (tool: ToolItem, i: number) => {
    const meta = CATEGORY_META[tool.category];
    const glowClass = getBulkCardGlow(tool.category);

    return (
      <motion.div
        key={`bulk-${tool.category}-${tool.name}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        viewport={{ once: true }}
      >
        <Link to={tool.link}>
          <Card
            className={`bg-black/40 backdrop-blur-sm border-2 ${glowClass} transition-all duration-300 h-full group cursor-pointer`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 ${meta.iconWrapClass} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <tool.icon className={`w-6 h-6 ${meta.iconClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold truncate ${meta.iconClass}`}>{tool.name}</h3>
                  </div>
                  <p className="text-white/70 text-sm mb-2">{tool.description}</p>
                  <div className="flex items-center gap-2">
                    {tool.tier === "free" ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-300">
                        <Unlock className="w-3 h-3" />
                        Free Access
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gold">
                        <Lock className="w-3 h-3" />
                        Member Access
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight
                  className={`w-5 h-5 ${meta.arrowClass} opacity-0 group-hover:opacity-100 group-hover:text-gold transition-all flex-shrink-0`}
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  // Render tool card for category sections (filled background)
  const renderCategoryToolCard = (tool: ToolItem, i: number) => {
    const meta = CATEGORY_META[tool.category];

    return (
      <motion.div
        key={`cat-${tool.category}-${tool.name}`}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        viewport={{ once: true }}
      >
        <Link to={tool.link}>
          <Card
            className={`${meta.cardClass} transition-all duration-300 h-full group cursor-pointer`}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 ${meta.iconWrapClass} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                >
                  <tool.icon className={`w-6 h-6 ${meta.iconClass}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate text-white">{tool.name}</h3>
                  </div>
                  <p className="text-white/70 text-sm mb-2">{tool.description}</p>
                  <div className="flex items-center gap-2">
                    {tool.tier === "free" ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-300">
                        <Unlock className="w-3 h-3" />
                        Free Access
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gold">
                        <Lock className="w-3 h-3" />
                        Member Access
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight
                  className="w-5 h-5 text-white/50 opacity-0 group-hover:opacity-100 group-hover:text-gold transition-all flex-shrink-0"
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </motion.div>
    );
  };

  return (
    <section id="section-tools" className="py-16 md:py-20 bg-black">
      <div className="container mx-auto px-4">
        {/* Discover All Free Tools - Light Cyan/Slate Layer */}
        <div className="bg-gradient-to-br from-slate-800/90 via-slate-800/80 to-slate-900/90 border border-slate-600/30 rounded-2xl p-6 md:p-8 shadow-lg mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="bg-purple-500/30 text-purple-200 border-purple-400/50 mb-4">
              <Wrench className="w-3 h-3 mr-1" />
              AI-Powered Tools
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Discover All <span className="text-sky-300">Free Tools</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              All tools in one place (shortcuts). Scroll down to see the same tools organized by category.
            </p>
          </motion.div>

          {/* ALL TOOLS (shortcuts) - glow/border only with per-tool color */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOOLS.map((tool, i) => renderBulkToolCard(tool, i))}
          </div>
        </div>

        {/* UNLOCK MORE - Green Premium Layer */}
        <div className="bg-gradient-to-br from-emerald-900/90 via-emerald-900/80 to-emerald-950/90 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-lg mb-12">
          <div className="text-center mb-8">
            <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/50 mb-4">
              <Lock className="w-3 h-3 mr-1" />
              Member Exclusive
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Unlock More with <span className="text-emerald-300">JBJ Broker Hub</span>
            </h2>
            <p className="text-emerald-200/70 max-w-2xl mx-auto">
              Join our team to access premium tools, exclusive training, and dedicated support.
            </p>
          </div>
        </div>

        {/* CATEGORY BREAKDOWN - Active color layer with filled cards */}
        <div className="space-y-12">
          {CATEGORY_ORDER.map((category) => {
            const meta = CATEGORY_META[category];
            const items = TOOLS.filter((t) => t.category === category);

            // Get category-specific background color for the active layer
            const categoryBgMap: Record<ToolCategory, string> = {
              property: 'bg-gradient-to-br from-purple-900/90 via-purple-900/80 to-purple-950/90 border-purple-500/30',
              marketing: 'bg-gradient-to-br from-emerald-900/90 via-emerald-900/80 to-emerald-950/90 border-emerald-500/30',
              documents: 'bg-gradient-to-br from-teal-900/90 via-teal-900/80 to-teal-950/90 border-teal-500/30',
              design: 'bg-gradient-to-br from-pink-900/90 via-pink-900/80 to-pink-950/90 border-pink-500/30',
              productivity: 'bg-gradient-to-br from-indigo-900/90 via-indigo-900/80 to-indigo-950/90 border-indigo-500/30',
              operations: 'bg-gradient-to-br from-cyan-900/90 via-cyan-900/80 to-cyan-950/90 border-cyan-500/30',
            };

            return (
              <div key={category} className={`${categoryBgMap[category]} border rounded-2xl p-4 sm:p-6 shadow-lg`}>
                <div className="text-center mb-8">
                  <Badge className={`${meta.badgeClass} mb-3`}>{meta.label} {meta.coloredLabel}</Badge>
                  <h3 className="text-2xl md:text-3xl font-bold">
                    <span className="text-white">{meta.label} </span>
                    <span className={meta.iconClass}>{meta.coloredLabel}</span>
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((tool, i) => renderCategoryToolCard(tool, i))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
