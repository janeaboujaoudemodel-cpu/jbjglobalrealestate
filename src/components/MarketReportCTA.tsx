import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Download, ArrowUpRight, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const MarketReportCTA = () => {
  const highlights = [
    "Market indicators & transaction analysis",
    "Developer comparison framework",
    "Investment due diligence checklist",
    "Community ROI rankings",
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      className="relative overflow-hidden"
    >
      {/* Premium Purple Gradient Background - matching AI style */}
      <div className="bg-gradient-to-r from-purple-900/40 via-purple-800/30 to-purple-900/40 border border-purple-500/30 rounded-3xl p-8 md:p-12 relative">
        {/* Decorative glow elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gold/5 rounded-full blur-2xl translate-y-1/2" />
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl -translate-x-1/2" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-400/40 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-purple-300" />
              <span className="text-purple-200 text-xs font-medium uppercase tracking-wider">Exclusive Free Download</span>
            </div>
            
            <h3 
              className="text-white text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              JJ Global Capital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-gold to-purple-300">2025–2026 Market Outlook</span>
            </h3>
            
            <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
              An exclusive educational book authored by Jane Abou Jaoude, covering the UAE real estate market with government-backed data and structured frameworks.
            </p>
            
            {/* Highlights */}
            <ul className="space-y-3 mb-8">
              {highlights.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-200">
                  <CheckCircle className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/market-report">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold px-8 py-6 text-base shadow-lg shadow-purple-500/30 border border-purple-400/30">
                <Download className="w-5 h-5 mr-2" />
                Download Free Report
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          
          {/* Premium 3D Book Visual */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Glow effect behind book */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-gold/10 blur-3xl rounded-full scale-150" />
              
              {/* Premium Book Visual with flip effect */}
              <motion.div
                className="relative"
                style={{ perspective: "1200px" }}
                initial={{ rotateY: -10 }}
                animate={{ rotateY: [-10, 10, -10] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ rotateY: 25, scale: 1.05 }}
              >
                <div 
                  className="relative"
                  style={{ transformStyle: "preserve-3d", transform: "rotateY(-15deg)" }}
                >
                  {/* Book Shadow */}
                  <div 
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/40 blur-xl rounded-full"
                    style={{ transform: "translateZ(-50px)" }}
                  />
                  
                  {/* Book Spine */}
                  <div
                    className="absolute left-0 top-0 h-full hidden md:block"
                    style={{
                      width: 24,
                      background: "linear-gradient(90deg, #7c3aed 0%, #9333ea 50%, #7c3aed 100%)",
                      transform: "translateX(-24px) rotateY(-90deg)",
                      transformOrigin: "right center",
                      boxShadow: "inset -2px 0 10px rgba(0,0,0,0.4)",
                    }}
                  >
                    <div className="h-full flex items-center justify-center">
                      <span 
                        className="text-white font-bold"
                        style={{ writingMode: "vertical-rl", fontSize: "10px", letterSpacing: "0.25em" }}
                      >
                        JJ GLOBAL CAPITAL • 2026
                      </span>
                    </div>
                  </div>

                  {/* Book Front Cover */}
                  <div
                    className="w-52 h-72 md:w-64 md:h-88 rounded-r-lg overflow-hidden border border-purple-400/30"
                    style={{
                      background: "linear-gradient(145deg, #1a1a2e 0%, #0a0a15 100%)",
                      boxShadow: "8px 8px 30px rgba(0,0,0,0.5), inset 0 0 80px rgba(139,92,246,0.05)",
                    }}
                  >
                    {/* Background image */}
                    <div 
                      className="absolute inset-0 opacity-25"
                      style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 via-black/60 to-black/80" />

                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-14 h-14 border-l-2 border-t-2 border-purple-400/50" />
                    <div className="absolute bottom-0 right-0 w-14 h-14 border-r-2 border-b-2 border-purple-400/50" />
                    
                    {/* Cover content */}
                    <div className="relative h-full flex flex-col items-center justify-center p-6 text-center z-10">
                      <span className="text-purple-300/80 text-[10px] tracking-[0.3em] uppercase mb-4">
                        J | J Global Capital
                      </span>
                      
                      <h3 className="text-white font-bold text-base md:text-lg mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                        UAE Real Estate
                      </h3>
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-gold font-semibold text-sm">
                        Market Intelligence
                      </p>

                      <div className="w-20 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent my-4" />

                      <div className="px-4 py-2 border border-purple-400/50 rounded bg-black/40 backdrop-blur-sm">
                        <span className="text-purple-200 text-xs font-medium tracking-wider">
                          2025–2026 EDITION
                        </span>
                      </div>

                      <div className="mt-auto pt-4 border-t border-purple-800/50 w-full">
                        <p className="text-purple-300/60 text-[10px] uppercase tracking-wider">
                          By Jane Abou Jaoude
                        </p>
                        <p className="text-purple-400/40 text-[8px] uppercase tracking-wider mt-1">
                          Powered by JJ Holding Group
                        </p>
                      </div>
                    </div>

                    {/* Glossy effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)" }}
                    />
                  </div>

                  {/* Pages edge */}
                  <div
                    className="absolute right-0 top-[3px] h-[calc(100%-6px)] hidden md:block"
                    style={{
                      width: 10,
                      background: "repeating-linear-gradient(to bottom, #f5f5f0 0px, #f5f5f0 1px, #eae8e0 1px, #eae8e0 2px)",
                      transform: "translateX(100%) rotateY(90deg)",
                      transformOrigin: "left center",
                      boxShadow: "inset -2px 0 4px rgba(0,0,0,0.1)",
                    }}
                  />

                  {/* Back cover hint */}
                  <div
                    className="absolute top-0 left-0 w-full h-full hidden md:block"
                    style={{
                      background: "linear-gradient(145deg, #151520 0%, #0a0a10 100%)",
                      transform: "translateZ(-10px)",
                      borderRadius: "0 6px 6px 0",
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketReportCTA;
