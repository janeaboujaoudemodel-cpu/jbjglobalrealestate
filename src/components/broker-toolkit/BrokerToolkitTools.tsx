import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "@/components/ui/icon-tile";
import { useToolVisibility } from "@/hooks/useToolVisibility";
import {
  Home,
  GitCompare,
  Calculator,
  BarChart3,
  TrendingUp,
  Ruler,
  ClipboardCheck,
  
  ArrowUpRight,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type BrokerTool = {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

// Mirrors PUBLIC_TOOLS_WORKSPACE_ITEMS in GlobalVerticalNav.tsx — single
// source of truth for what the broker sees. Tools are filtered through the
// backend visibility table (ai_tool_visibility) controlled from the Owner
// AI Tools Control Panel — no toggle is exposed on this public page.
const BROKER_TOOLS: BrokerTool[] = [
  { id: "ai-home-finder", name: "AI Home Finder", description: "Match clients to listings with AI-powered filters.", icon: Home, href: "/ai-home-finder" },
  { id: "property-comparison", name: "Property Comparison", description: "Compare up to 10 projects or detailed units side-by-side.", icon: GitCompare, href: "/compare" },
  { id: "mortgage-calculator", name: "Mortgage Calculator", description: "Calculate payments and affordability instantly.", icon: Calculator, href: "/mortgage-calculator" },
  { id: "property-evaluator", name: "Property Evaluator", description: "AI-driven valuation based on market data.", icon: BarChart3, href: "/property-evaluator" },
  { id: "rental-index", name: "Rental Index", description: "Rental estimates with market benchmarks.", icon: TrendingUp, href: "/rental-index" },
  { id: "property-measurement", name: "Property Measurement", description: "Verify property sizes with AI precision.", icon: Ruler, href: "/property-measurement" },
  { id: "list-property-sale", name: "List for Sale / Rent", description: "Submit a sale or rental listing — pick the type on the next step.", icon: ClipboardCheck, href: "/list-property" },
];

export function BrokerToolkitTools() {
  const visibility = useToolVisibility();

  const tools = useMemo(
    () => BROKER_TOOLS.filter((t) => visibility.isPublic(t.id)),
    [visibility],
  );

  return (
    <section id="section-tools" className="jj-band jj-band--page py-14 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 mb-3">
            <Wrench className="w-3 h-3 mr-1.5" />
            Broker Tools
          </Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#1A1A1A] mb-3">
            Everything you need to close deals
          </h2>
          <p className="text-[#1A1A1A]/70 text-base">
            The same essential tools available across the platform — curated for brokers.
          </p>
        </motion.div>

        {tools.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16 text-[#1A1A1A]/60 text-sm">
            No tools are currently published. Visit the Owner AI Tools Control Panel to publish tools.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                viewport={{ once: true }}
              >
                <Link
                  to={tool.href}
                  className="group h-full flex flex-col bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/60 hover:shadow-[0_8px_24px_-12px_rgba(184,149,85,0.35)] rounded-2xl p-5 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <IconTile icon={tool.icon} tone="gold" size="md" />
                    <ArrowUpRight className="w-4 h-4 text-[#1A1A1A]/40 group-hover:text-[#1A1A1A] transition-colors" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#1A1A1A] mb-1.5 leading-snug">
                    {tool.name}
                  </h3>
                  <p className="text-[13px] text-[#1A1A1A]/65 leading-relaxed">
                    {tool.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
