import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Video, Image, FileText, Mic, Wand2, Palette, 
  ArrowRight, Sparkles, Languages, Film
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const toolCategories = [
  { icon: Video, label: "Video" },
  { icon: Mic, label: "Audio" },
  { icon: Image, label: "Images" },
  { icon: FileText, label: "PDF" },
  { icon: Wand2, label: "AI" },
  { icon: Palette, label: "Filters" },
];

export function ToolkitShowcaseCard() {
  return (
    <section className="py-12 md:py-16 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="relative"
        >
          {/* Gold glow effect behind card */}
          <div className="absolute inset-0 -m-4 md:-m-6 rounded-3xl bg-gold/10 blur-2xl" />
          
          {/* Main Card */}
          <div 
            className="relative z-10 bg-gradient-to-br from-zinc-900 via-black to-zinc-800 rounded-2xl md:rounded-3xl p-6 md:p-10 lg:p-12 border-2 border-gold/40 overflow-hidden"
            style={{
              boxShadow: '0 0 60px rgba(200,167,102,0.2), 0 25px 60px rgba(0,0,0,0.4)'
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 md:w-24 md:h-24">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-gold via-gold/80 to-transparent rounded-tl-2xl" />
              <div className="absolute top-0 left-0 h-full w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-tl-2xl" />
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 md:w-24 md:h-24">
              <div className="absolute top-0 right-0 w-full h-[3px] bg-gradient-to-l from-gold via-gold/80 to-transparent rounded-tr-2xl" />
              <div className="absolute top-0 right-0 h-full w-[3px] bg-gradient-to-b from-gold via-gold/80 to-transparent rounded-tr-2xl" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center">
              {/* Left: Content */}
              <div className="relative z-10">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/20 border border-gold/40 text-gold text-xs uppercase tracking-[0.2em] mb-4">
                  <Sparkles className="w-3 h-3" />
                  Free Professional Tools
                </div>
                
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                  JBJ RealEstate Toolkit™
                </h2>
                
                <p className="text-zinc-300 text-sm md:text-base mb-4 max-w-md">
                  9 powerful tools for video editing, image resizing, PDF creation, voice synthesis, and AI-powered enhancements — all completely free to use.
                </p>
                
                {/* Tool icons grid */}
                <div className="grid grid-cols-6 gap-2 mb-6">
                  {toolCategories.map((tool, idx) => (
                    <div 
                      key={idx}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-zinc-800/80 border border-gold/30 flex items-center justify-center group-hover:border-gold/60 group-hover:bg-zinc-800 transition-all">
                        <tool.icon className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                      </div>
                      <span className="text-zinc-400 text-[8px] md:text-[9px] uppercase tracking-wider">{tool.label}</span>
                    </div>
                  ))}
                </div>
                
                <Link to="/toolkit">
                  <Button 
                    className="bg-gradient-to-r from-gold via-gold/90 to-gold text-black font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_30px_rgba(200,167,102,0.5)] transition-all group"
                  >
                    Explore All Tools
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
              
              {/* Right: Featured tools preview */}
              <div className="relative z-10 grid grid-cols-2 gap-3">
                {/* Tool Card 1: AI Video Studio */}
                <Link to="/toolkit/ai-video-studio" className="group">
                  <div className="bg-zinc-800/60 border border-gold/20 rounded-xl p-4 hover:border-gold/50 hover:bg-zinc-800/80 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mb-3">
                      <Film className="w-5 h-5 text-gold" />
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">AI Video Studio</h4>
                    <p className="text-zinc-400 text-xs">Full editing suite</p>
                  </div>
                </Link>
                
                {/* Tool Card 2: Voice Studio */}
                <Link to="/toolkit/voice-studio" className="group">
                  <div className="bg-zinc-800/60 border border-gold/20 rounded-xl p-4 hover:border-gold/50 hover:bg-zinc-800/80 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mb-3">
                      <Mic className="w-5 h-5 text-gold" />
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">Voice Studio</h4>
                    <p className="text-zinc-400 text-xs">AI text-to-speech</p>
                  </div>
                </Link>
                
                {/* Tool Card 3: Background AI */}
                <Link to="/toolkit/background-ai" className="group">
                  <div className="bg-zinc-800/60 border border-gold/20 rounded-xl p-4 hover:border-gold/50 hover:bg-zinc-800/80 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mb-3">
                      <Wand2 className="w-5 h-5 text-gold" />
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">Background AI</h4>
                    <p className="text-zinc-400 text-xs">Remove & replace</p>
                  </div>
                </Link>
                
                {/* Tool Card 4: Captions */}
                <Link to="/toolkit/captions-translate" className="group">
                  <div className="bg-zinc-800/60 border border-gold/20 rounded-xl p-4 hover:border-gold/50 hover:bg-zinc-800/80 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center mb-3">
                      <Languages className="w-5 h-5 text-gold" />
                    </div>
                    <h4 className="text-white font-semibold text-sm mb-1">Captions</h4>
                    <p className="text-zinc-400 text-xs">Auto-translate</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
