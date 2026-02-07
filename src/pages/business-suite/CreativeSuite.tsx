import { FileText, Languages, Video } from "lucide-react";
import BusinessSuiteToolCard from "@/components/business-suite/BusinessSuiteToolCard";

const tools = [
  {
    icon: FileText,
    title: "Document Generator",
    description: "Create professional property brochures, comparison documents, and marketing materials.",
    href: "/ai-document-generator",
    colorClass: "text-lime-400",
    borderColorClass: "border-lime-500/30",
    gradientFrom: "from-lime-600",
    gradientTo: "to-green-600",
  },
  {
    icon: Languages,
    title: "Translation Hub",
    description: "Translate property descriptions and communications into multiple languages with context awareness.",
    href: "/ai-translation-hub",
    colorClass: "text-amber-400",
    borderColorClass: "border-amber-500/30",
    gradientFrom: "from-amber-600",
    gradientTo: "to-orange-600",
  },
  {
    icon: Video,
    title: "Video Tour Script",
    description: "Generate engaging video tour scripts with scene suggestions and call-to-actions.",
    href: "/ai-video-tour-script",
    colorClass: "text-pink-400",
    borderColorClass: "border-pink-500/30",
    gradientFrom: "from-pink-600",
    gradientTo: "to-rose-600",
  },
];

const CreativeSuite = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pink-950/40 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-pink-600/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/30 rounded-full mb-6">
            <FileText className="w-5 h-5 text-pink-400" />
            <span className="text-pink-400 font-medium text-sm">Creative & Communication Suite</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Creative & <span className="text-pink-400">Communication</span> Suite
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            AI-powered content creation tools for documents, translations, and video scripts. 
            Create professional marketing materials in minutes.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-pink-400 rounded-full" />
              3 Tools Included
            </span>
            <span>•</span>
            <span>Powered by AI</span>
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

export default CreativeSuite;
