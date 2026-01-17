import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const MarketReportCTA = () => {
  const benefits = [
    "Structured market overview (educational)",
    "Developer & community comparison frameworks",
    "Investment due diligence checklist",
    "Complimentary AI Home Finder access",
    "Expert insights from our founder",
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      className="relative"
    >
      {/* Premium White Frame Container */}
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl shadow-black/50">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Premium 3D Book */}
          <div className="flex items-center justify-center lg:justify-start">
            <div className="relative" style={{ perspective: "1500px" }}>
              {/* Ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold/30 via-gold/10 to-transparent blur-3xl rounded-full scale-150 -z-10" />
              
              {/* Interactive 3D Book */}
              <motion.div
                className="relative cursor-grab active:cursor-grabbing"
                whileHover={{ scale: 1.03 }}
                animate={{ rotateY: [-6, 6, -6] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div 
                  className="relative"
                  style={{ 
                    transformStyle: "preserve-3d", 
                    transform: "rotateY(-12deg) rotateX(3deg)" 
                  }}
                  whileHover={{ rotateY: 10, rotateX: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Book Shadow */}
                  <div 
                    className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-64 h-12 bg-black/40 blur-2xl rounded-full"
                    style={{ transform: "translateZ(-60px)" }}
                  />
                  
                  {/* Book Spine */}
                  <div
                    className="absolute left-0 top-0 h-full hidden md:block"
                    style={{
                      width: 32,
                      background: "linear-gradient(90deg, #6B5B3D 0%, #A8925A 25%, #C4A962 50%, #A8925A 75%, #6B5B3D 100%)",
                      transform: "translateX(-32px) rotateY(-90deg)",
                      transformOrigin: "right center",
                      boxShadow: "inset -4px 0 15px rgba(0,0,0,0.6), inset 3px 0 8px rgba(255,255,255,0.1)",
                    }}
                  >
                    <div className="h-full flex items-center justify-center">
                      <span 
                        className="text-black font-bold"
                        style={{ writingMode: "vertical-rl", fontSize: "11px", letterSpacing: "0.25em" }}
                      >
                        JBJ GLOBAL REAL ESTATE • 2026
                      </span>
                    </div>
                  </div>

                  {/* Book Front Cover */}
                  <div
                    className="w-64 h-[400px] md:w-80 md:h-[480px] rounded-lg overflow-hidden"
                    style={{
                      background: "linear-gradient(165deg, #2a2a2a 0%, #1a1a1a 40%, #0f0f0f 100%)",
                      boxShadow: `
                        20px 25px 50px rgba(0,0,0,0.5),
                        inset 0 0 120px rgba(168,146,90,0.08),
                        0 0 80px rgba(168,146,90,0.15),
                        0 0 2px rgba(168,146,90,0.5)
                      `,
                      border: "1.5px solid rgba(168, 146, 90, 0.5)",
                    }}
                  >
                    {/* Top Villa Image Section */}
                    <div className="relative h-[45%] overflow-hidden">
                      <img 
                        src={luxuryVilla1}
                        alt="Luxury UAE Villa"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90" />
                      
                      {/* Reflection overlay on image */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)"
                        }}
                      />
                    </div>

                    {/* Cover Content */}
                    <div className="relative h-[55%] flex flex-col items-center justify-between p-6 md:p-8 text-center">
                      {/* Gold decorative line */}
                      <div className="w-16 h-1 bg-gradient-to-r from-transparent via-gold to-transparent absolute -top-0.5" />
                      
                      {/* Badge */}
                      <div className="inline-flex items-center gap-2 px-4 py-2 border border-gold/50 rounded-full bg-black/50 backdrop-blur-sm mt-2">
                        <Sparkles className="w-3 h-3 text-gold" />
                        <span className="text-gold text-[10px] md:text-xs font-semibold uppercase tracking-[0.15em]">
                          Latest Edition 2026
                        </span>
                      </div>
                      
                      {/* Main Title */}
                      <div className="flex-1 flex flex-col items-center justify-center py-4">
                        <h3 
                          className="text-white font-bold text-2xl md:text-3xl mb-2 drop-shadow-lg" 
                          style={{ fontFamily: "Poppins, sans-serif" }}
                        >
                          UAE Real Estate
                        </h3>
                        <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#D4B970] to-gold font-semibold text-lg md:text-xl">
                          Market Intelligence
                        </p>
                      </div>

                      {/* Author & Branding */}
                      <div className="w-full pt-4 border-t border-gold/30">
                        <p className="text-zinc-400 text-xs md:text-sm mb-3">
                          By Founder and CEO Jane Abou Jaoude
                        </p>
                        <p className="text-gold/80 text-[10px] md:text-xs uppercase tracking-[0.2em] font-medium">
                          JBJ Global Real Estate
                        </p>
                      </div>
                    </div>

                    {/* Glossy reflection effect */}
                    <div 
                      className="absolute inset-0 pointer-events-none"
                      style={{ 
                        background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 35%, rgba(0,0,0,0.15) 100%)" 
                      }}
                    />
                  </div>

                  {/* Pages edge */}
                  <div
                    className="absolute right-0 top-[4px] h-[calc(100%-8px)] hidden md:block"
                    style={{
                      width: 16,
                      background: "repeating-linear-gradient(to bottom, #f8f8f5 0px, #f8f8f5 1px, #f0efe8 1px, #f0efe8 2px)",
                      transform: "translateX(100%) rotateY(90deg)",
                      transformOrigin: "left center",
                      boxShadow: "inset -4px 0 8px rgba(0,0,0,0.2), inset 2px 0 3px rgba(255,255,255,0.6)",
                    }}
                  />

                  {/* Back cover */}
                  <div
                    className="absolute top-0 left-0 w-full h-full hidden md:block"
                    style={{
                      background: "linear-gradient(165deg, #1a1a1f 0%, #0a0a0f 100%)",
                      transform: "translateZ(-16px)",
                      borderRadius: "0 8px 8px 0",
                      boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)",
                    }}
                  />
                </motion.div>
              </motion.div>
              
              {/* Free Download Badge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="absolute -bottom-3 -right-2 md:right-4 bg-gradient-to-br from-gold to-gold-dark text-black px-5 py-2.5 rounded-full shadow-xl shadow-gold/30"
              >
                <span className="text-xs font-bold uppercase tracking-wider">Free Download</span>
              </motion.div>
            </div>
          </div>

          {/* Right: What You'll Receive */}
          <div className="space-y-6">
            {/* What You'll Receive Card */}
            <div className="bg-zinc-100 rounded-2xl p-6 md:p-8">
              <h3 
                className="text-zinc-900 text-2xl md:text-3xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                What You'll Receive
              </h3>
              
              <ul className="space-y-4">
                {benefits.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-zinc-700 text-base md:text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Download Button */}
            <Link to="/market-report" className="block">
              <Button 
                variant="dark"
                className="w-full px-8 py-7 text-lg rounded-full"
              >
                Download Your Free Book Now
              </Button>
            </Link>
            
            {/* Powered by - Creative Dubai branding */}
            <div className="text-center pt-4 border-t border-zinc-200">
              <p className="text-zinc-600 text-sm mb-1">
                Created by <span className="text-zinc-900 font-semibold">Jane Abou Jaoude</span>
              </p>
              <p className="text-zinc-500 text-xs mb-2">
                Exclusive for <span className="text-gold font-semibold">JBJ Global Real Estate</span>
              </p>
              <p className="text-zinc-400 text-[10px] uppercase tracking-widest">
                Real Estate Brokerage • Dubai, UAE
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketReportCTA;