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
    badgeClass: string;
    cardClass: string;
    iconWrapClass: string;
    iconClass: string;
    arrowClass: string;
  }
> = {
  property: {
    label: "Property Tools",
    badgeClass: "bg-purple-500/30 text-purple-200 border-purple-400/50",
    cardClass:
      "bg-purple-900/60 border border-purple-500/30 hover:border-purple-400 hover:bg-purple-900/80 shadow-lg shadow-purple-500/10 hover:shadow-purple-400/20",
    iconWrapClass: "bg-purple-500/30",
    iconClass: "text-purple-200",
    arrowClass: "text-purple-300",
  },
  marketing: {
    label: "Marketing",
    badgeClass: "bg-emerald-500/30 text-emerald-200 border-emerald-400/50",
    cardClass:
      "bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-900/80 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-400/20",
    iconWrapClass: "bg-emerald-500/30",
    iconClass: "text-emerald-200",
    arrowClass: "text-emerald-300",
  },
  documents: {
    label: "Documents",
    badgeClass: "bg-amber-500/30 text-amber-200 border-amber-400/50",
    cardClass:
      "bg-amber-900/40 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-900/60 shadow-lg shadow-amber-500/10 hover:shadow-amber-400/20",
    iconWrapClass: "bg-amber-500/30",
    iconClass: "text-amber-200",
    arrowClass: "text-amber-200",
  },
  design: {
    label: "Design & Media",
    badgeClass: "bg-pink-500/30 text-pink-200 border-pink-400/50",
    cardClass:
      "bg-pink-900/50 border border-pink-500/30 hover:border-pink-400 hover:bg-pink-900/70 shadow-lg shadow-pink-500/10 hover:shadow-pink-400/20",
    iconWrapClass: "bg-pink-500/30",
    iconClass: "text-pink-200",
    arrowClass: "text-pink-200",
  },
  productivity: {
    label: "Productivity",
    badgeClass: "bg-blue-500/30 text-blue-200 border-blue-400/50",
    cardClass:
      "bg-blue-900/60 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-900/80 shadow-lg shadow-blue-500/10 hover:shadow-blue-400/20",
    iconWrapClass: "bg-blue-500/30",
    iconClass: "text-blue-200",
    arrowClass: "text-blue-200",
  },
  operations: {
    label: "Operations & CRM",
    badgeClass: "bg-cyan-500/30 text-cyan-200 border-cyan-400/50",
    cardClass:
      "bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-900/80 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-400/20",
    iconWrapClass: "bg-cyan-500/30",
    iconClass: "text-cyan-200",
    arrowClass: "text-cyan-300",
  },
};

const CATEGORY_ORDER: ToolCategory[] = [
  "property",
  "marketing",
  "documents",
  "design",
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

  // Marketing
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
    description: "Digital document signing and scanning",
    icon: FileSignature,
    link: "/scan-sign-documents",
    tier: "member",
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

  // Productivity
  {
    name: "JBJ Calendar & Notes",
    description: "Smart scheduling and reminders",
    icon: Calendar,
    link: "/ai-calendar",
    tier: "member",
    category: "productivity",
  },

  // Operations & CRM
  {
    name: "JBJ CRM",
    description: "Complete lead management system",
    icon: Users,
    link: "/crm",
    tier: "member",
    category: "operations",
  },
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
];

export function BrokerToolkitTools() {
  const renderToolCard = (tool: ToolItem, i: number) => {
    const meta = CATEGORY_META[tool.category];

    return (
      <motion.div
        key={`${tool.category}-${tool.name}`}
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
                    <h3 className="text-white font-semibold truncate">{tool.name}</h3>
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
                  className={`w-5 h-5 ${meta.arrowClass} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`}
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
            Professional Tools for <span className="text-purple-300">Modern Brokers</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            All tools in one place (shortcuts). Scroll down to see the same tools organized by category.
          </p>
        </motion.div>

        {/* ALL TOOLS (shortcuts) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map((tool, i) => renderToolCard(tool, i))}
        </div>

        {/* CATEGORY BREAKDOWN */}
        <div className="mt-14 space-y-12">
          {CATEGORY_ORDER.map((category) => {
            const meta = CATEGORY_META[category];
            const items = TOOLS.filter((t) => t.category === category);

            return (
              <div key={category}>
                <div className="text-center mb-8">
                  <Badge className={`${meta.badgeClass} mb-3`}>{meta.label}</Badge>
                  <h3 className="text-2xl md:text-3xl font-bold text-white">
                    {meta.label}
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((tool, i) => renderToolCard(tool, i))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
