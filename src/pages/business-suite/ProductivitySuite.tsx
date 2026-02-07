import { CreditCard, Video, Calculator } from "lucide-react";
import BusinessSuiteToolCard from "@/components/business-suite/BusinessSuiteToolCard";

const tools = [
  {
    icon: CreditCard,
    title: "Business Card Scanner",
    description: "Scan and digitize business cards instantly with AI-powered OCR and contact extraction.",
    href: "/business-card-scanner",
    colorClass: "text-gold",
    borderColorClass: "border-gold/30",
    gradientFrom: "from-gold",
    gradientTo: "to-amber-600",
  },
  {
    icon: Video,
    title: "Video Meet",
    description: "Professional video conferencing with AI meeting summaries and action item extraction.",
    href: "/video-meeting",
    colorClass: "text-cyan-400",
    borderColorClass: "border-cyan-500/30",
    gradientFrom: "from-cyan-600",
    gradientTo: "to-blue-600",
  },
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    description: "Calculate mortgage payments, affordability, and compare financing options.",
    href: "/mortgage-calculator",
    colorClass: "text-gold",
    borderColorClass: "border-gold/30",
    gradientFrom: "from-gold",
    gradientTo: "to-amber-600",
  },
];

const ProductivitySuite = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-950/40 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-600/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-medium text-sm">Productivity Suite</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-cyan-400">Productivity</span> Suite
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Essential productivity tools for real estate professionals. 
            Scan contacts, conduct meetings, and calculate financials with ease.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-cyan-400 rounded-full" />
              3 Tools Included
            </span>
            <span>•</span>
            <span>Free Access</span>
          </div>
        </div>
      </div>
      
      {/* Tools Grid */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <BusinessSuiteToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductivitySuite;
