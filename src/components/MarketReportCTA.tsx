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
      {/* Premium White & Gold Background */}
      <div className="bg-gradient-to-br from-white via-zinc-50 to-white border border-gold/30 rounded-3xl p-8 md:p-12 relative shadow-2xl">
        {/* Decorative gold glow elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gold/5 rounded-full blur-2xl translate-y-1/2" />
        <div className="absolute top-1/2 left-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -translate-x-1/2" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/40 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-zinc-700 text-xs font-semibold uppercase tracking-wider">Exclusive Free Download</span>
            </div>
            
            <h3 
              className="text-zinc-900 text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              JJ Global Capital <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold">Latest Edition 2026</span>
            </h3>
            
            <p className="text-zinc-600 text-lg mb-6 leading-relaxed">
              An exclusive educational book authored by Jane Abou Jaoude, covering the UAE real estate market with government-backed data and structured frameworks.
            </p>
            
            {/* Highlights */}
            <ul className="space-y-3 mb-8">
              {highlights.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-700">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/market-report">
              <Button className="bg-gradient-to-r from-zinc-900 to-black border border-gold/40 text-gold font-semibold px-8 py-6 text-base shadow-lg shadow-black/30 transition-all duration-300 hover:shadow-xl hover:shadow-gold/20 hover:scale-[1.02] hover:border-gold/60">
                <Download className="w-5 h-5 mr-2" />
                Download Your Free Book Now
                <ArrowUpRight className="w-5 h-5 ml-2 -mr-1" />
              </Button>
            </Link>
          </div>
          
          {/* Premium 3D Book Visual */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Glow effect behind book - Gold themed */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-gold/5 blur-3xl rounded-full scale-150" />
              
              {/* Interactive 3D Book with drag-to-rotate */}
              <motion.div
                className="relative cursor-grab active:cursor-grabbing"
                style={{ perspective: "1200px" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{ rotateY: [-8, 8, -8] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="relative"
                  style={{ transformStyle: "preserve-3d", transform: "rotateY(-10deg)" }}
                  whileHover={{ rotateY: 15 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Book Shadow */}
                  <div 
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-52 h-10 bg-black/50 blur-2xl rounded-full"
                    style={{ transform: "translateZ(-50px)" }}
                  />
                  
                  {/* Book Spine - Gold themed */}
                  <div
                    className="absolute left-0 top-0 h-full hidden md:block"
                    style={{
                      width: 28,
                      background: "linear-gradient(90deg, #8B7355 0%, #A8925A 30%, #C4A962 50%, #A8925A 70%, #8B7355 100%)",
                      transform: "translateX(-28px) rotateY(-90deg)",
                      transformOrigin: "right center",
                      boxShadow: "inset -3px 0 12px rgba(0,0,0,0.5), inset 2px 0 4px rgba(255,255,255,0.1)",
                    }}
                  >
                    <div className="h-full flex items-center justify-center">
                      <span 
                        className="text-black font-bold"
                        style={{ writingMode: "vertical-rl", fontSize: "10px", letterSpacing: "0.2em" }}
                      >
                        JJ GLOBAL CAPITAL • 2026
                      </span>
                    </div>
                  </div>

                  {/* Book Front Cover */}
                  <div
                    className="w-56 h-80 md:w-72 md:h-96 rounded-r-lg overflow-hidden border-2 border-gold/50"
                    style={{
                      background: "linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)",
                      boxShadow: "12px 12px 40px rgba(0,0,0,0.6), inset 0 0 100px rgba(168,146,90,0.08), 0 0 60px rgba(168,146,90,0.1)",
                    }}
                  >
                    {/* Background subtle pattern */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-black/70 to-black/90" />

                    {/* Premium corner accents */}
                    <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-gold/60" />
                    <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-gold/60" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-gold/30" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-gold/30" />
                    
                    {/* Cover content - improved readability */}
                    <div className="relative h-full flex flex-col items-center justify-between p-6 md:p-8 text-center z-10">
                      {/* Top: Logo */}
                      <div className="w-full">
                        <div className="flex items-center justify-center gap-0.5 mb-1">
                          <span className="text-gold font-light text-sm tracking-wide">J</span>
                          <span className="text-white/80 mx-0.5">|</span>
                          <span className="text-gold font-light text-sm tracking-wide">J</span>
                        </div>
                        <span className="text-gold/90 text-[11px] md:text-xs tracking-[0.2em] uppercase font-medium">
                          GLOBAL CAPITAL
                        </span>
                      </div>
                      
                      {/* Center: Main Title */}
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <h3 className="text-white font-bold text-xl md:text-2xl mb-2 drop-shadow-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
                          UAE Real Estate
                        </h3>
                        <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#D4B970] to-gold font-semibold text-base md:text-lg">
                          Market Intelligence
                        </p>

                        <div className="w-24 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent my-5" />

                        <div className="px-5 py-2.5 border-2 border-gold/60 rounded-md bg-black/50 backdrop-blur-sm shadow-lg">
                          <span className="text-gold text-sm md:text-base font-semibold tracking-wider">
                            LATEST EDITION 2026
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Author & Powered by */}
                      <div className="w-full pt-4 border-t border-gold/30">
                        <p className="text-gold text-xs md:text-sm uppercase tracking-wider font-medium mb-1">
                          By Jane Abou Jaoude
                        </p>
                        <p className="text-gold/70 text-[10px] md:text-xs uppercase tracking-wider">
                          Powered by JJ Global Capital
                        </p>
                      </div>
                    </div>

                    {/* Glossy reflection effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{ 
                        background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)" 
                      }}
                    />
                  </div>

                  {/* Pages edge - more realistic */}
                  <div
                    className="absolute right-0 top-[4px] h-[calc(100%-8px)] hidden md:block"
                    style={{
                      width: 14,
                      background: "repeating-linear-gradient(to bottom, #f8f8f5 0px, #f8f8f5 1px, #f0efe8 1px, #f0efe8 2px)",
                      transform: "translateX(100%) rotateY(90deg)",
                      transformOrigin: "left center",
                      boxShadow: "inset -3px 0 6px rgba(0,0,0,0.15), inset 1px 0 2px rgba(255,255,255,0.5)",
                    }}
                  />

                  {/* Back cover - deeper 3D */}
                  <div
                    className="absolute top-0 left-0 w-full h-full hidden md:block"
                    style={{
                      background: "linear-gradient(145deg, #1a1a1f 0%, #0a0a0f 100%)",
                      transform: "translateZ(-14px)",
                      borderRadius: "0 6px 6px 0",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
                    }}
                  />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketReportCTA;
