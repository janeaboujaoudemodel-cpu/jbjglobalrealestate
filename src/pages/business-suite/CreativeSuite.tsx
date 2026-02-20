import { FileText, Languages, Video, Wand2, Sparkles } from "lucide-react";
import BusinessSuiteToolCard from "@/components/business-suite/BusinessSuiteToolCard";

const tools = [
  {
    icon: FileText,
    title: "Document Generator",
    description: "Create professional property brochures, comparison documents, and marketing materials.",
    href: "/ai-document-generator",
    colorClass: "text-lime-700",
    borderColorClass: "border-lime-500/40",
    gradientFrom: "from-lime-600",
    gradientTo: "to-green-600",
  },
  {
    icon: Languages,
    title: "Translation Hub",
    description: "Translate property descriptions and communications into multiple languages with context awareness.",
    href: "/ai-translation-hub",
    colorClass: "text-amber-700",
    borderColorClass: "border-amber-500/40",
    gradientFrom: "from-amber-600",
    gradientTo: "to-orange-600",
  },
  {
    icon: Video,
    title: "Video Tour Script",
    description: "Generate engaging video tour scripts with scene suggestions and call-to-actions.",
    href: "/ai-video-tour-script",
    colorClass: "text-pink-700",
    borderColorClass: "border-pink-500/40",
    gradientFrom: "from-pink-600",
    gradientTo: "to-rose-600",
  },
  {
    icon: Wand2,
    title: "Background Remover",
    description: "Remove or replace backgrounds from photos instantly using AI. Perfect for property listings.",
    href: "/toolkit/background-ai",
    colorClass: "text-rose-700",
    borderColorClass: "border-rose-500/40",
    gradientFrom: "from-rose-600",
    gradientTo: "to-pink-600",
  },
];

const CreativeSuite = () => {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #EDE0C8 40%, #DDD0B8 100%)' }}>
      {/* Hero Section - Champagne premium */}
      <div className="relative py-14 px-4 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.06) 0%, transparent 60%)' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-32 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center top, rgba(200,167,102,0.15) 0%, transparent 70%)' }} />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gold/50 bg-white/60 backdrop-blur-sm mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-zinc-800 font-semibold text-sm tracking-wide">Creative & Communication Suite</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Creative & <span style={{ background: 'linear-gradient(135deg, #EC4899 0%, #F43F5E 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Communication</span> Suite
          </h1>
          
          <p className="text-base md:text-lg text-zinc-600 max-w-2xl mx-auto mb-8">
            AI-powered content creation tools for documents, translations, and video scripts. 
            Create professional marketing materials in minutes.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-400 rounded-full" />
              4 Tools Included
            </span>
            <span className="text-zinc-300">|</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gold rounded-full" />
              Powered by AI
            </span>
          </div>
        </div>
      </div>
      
      {/* Tools Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <span className="text-xs font-bold text-zinc-700 tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border border-gold/40 bg-white/50">All Tools</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tools.map((tool) => (
            <BusinessSuiteToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreativeSuite;
