import { Link } from "react-router-dom";
import { 
  Calculator, Layers, Home, TrendingUp, Palette, 
  Film, Mic, ArrowRight, Sparkles, Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";

const royalTools = [
  { 
    id: "property-evaluator",
    name: "Property Evaluator", 
    description: "AI-powered property valuation",
    icon: Calculator, 
    href: "/property-evaluator",
    cta: "Get Evaluation",
  },
  { 
    id: "property-comparison",
    name: "Property Comparison", 
    description: "Compare properties side-by-side",
    icon: Layers, 
    href: "/compare",
    cta: "Start Comparing",
  },
  { 
    id: "mortgage-calculator",
    name: "Mortgage Calculator", 
    description: "Calculate your monthly payments",
    icon: Calculator, 
    href: "/mortgage-calculator",
    cta: "Calculate Now",
  },
  { 
    id: "ai-home-finder",
    name: "AI Home Finder", 
    description: "Find your perfect home with AI",
    icon: Home, 
    href: "/quiz",
    cta: "Find My Home",
  },
  { 
    id: "rental-index",
    name: "Rental Index", 
    description: "Check current rental rates",
    icon: TrendingUp, 
    href: "/rental-index",
    cta: "Check Rates",
  },
  { 
    id: "interior-design-ai",
    name: "AI Interior Design", 
    description: "Visualize your dream space",
    icon: Palette, 
    href: "/interior-design-ai",
    cta: "Design Space",
  },
  { 
    id: "ai-video-studio",
    name: "AI Video Studio", 
    description: "Create professional videos",
    icon: Film, 
    href: "/toolkit/ai-video-studio",
    cta: "Create Video",
  },
  { 
    id: "voice-studio",
    name: "Voice Studio", 
    description: "AI text-to-speech synthesis",
    icon: Mic, 
    href: "/toolkit/voice-studio",
    cta: "Generate Voice",
  },
];

export function ToolkitShowcaseCard() {
  return (
    <section className="bg-white py-10 md:py-14">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
          {/* Header Section */}
          <div className="bg-gray-50 p-6 md:p-8 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 border border-gray-300 text-black text-xs uppercase tracking-[0.2em]">
                <Sparkles className="w-3 h-3" />
                Free Professional Tools
              </div>
            </div>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-2">
              JBJ Royal Tools Hub
            </h2>
            
            <p className="text-sm text-gray-500 text-sm md:text-base max-w-2xl">
              Powerful real estate tools for property valuation, comparison, mortgage calculation, and AI-powered enhancements — all completely free to use.
            </p>
          </div>
            
          {/* Tools Grid */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {royalTools.map((tool, index) => (
                <div
                  key={tool.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Link to={tool.href} className="group block h-full">
                    <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 hover:border-gray-400 p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <tool.icon className="w-6 h-6 text-gray-600" />
                      </div>

                      {/* Title */}
                      <h4 className="text-base font-bold text-black mb-2 group-hover:text-gray-700 transition-colors">
                        {tool.name}
                      </h4>

                      {/* Description */}
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed flex-grow">
                        {tool.description}
                      </p>

                      {/* CTA */}
                      <Button size="sm" className="mt-auto w-full justify-center bg-black hover:bg-gray-800 text-white font-semibold border-0 text-[10px] sm:text-sm px-1.5 sm:px-3 whitespace-nowrap overflow-hidden">
                        <span className="truncate">{tool.cta}</span>
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0" />
                      </Button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Explore All Tools CTA */}
            <div className="mt-8 text-center">
              <Link to="/ai-hub">
                <Button 
                  size="lg" 
                  className="gap-3 px-10 py-6 text-base font-bold bg-black hover:bg-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Crown className="w-5 h-5" />
                  Explore All Our Tools Now
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
