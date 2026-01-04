import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Download, ArrowUpRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Book3D from "@/components/Book3D";

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
      <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-transparent border border-gold/20 rounded-3xl p-8 md:p-12">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-gold/3 rounded-full blur-2xl translate-y-1/2" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/20 border border-gold/40 rounded-full mb-6">
              <FileText className="w-4 h-4 text-gold" />
              <span className="text-gold text-xs font-medium uppercase tracking-wider">Free Download</span>
            </div>
            
            <h3 
              className="text-white text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              JJ Global Capital <br />
              <span className="text-gold">2025–2026 Market Outlook</span>
            </h3>
            
            <p className="text-zinc-400 text-lg mb-6 leading-relaxed">
              An exclusive educational book authored by Jane Abou Jaoude, covering the UAE real estate market with government-backed data and structured frameworks.
            </p>
            
            {/* Highlights */}
            <ul className="space-y-3 mb-8">
              {highlights.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-zinc-300">
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            
            <Link to="/market-report">
              <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base shadow-lg shadow-gold/20">
                <Download className="w-5 h-5 mr-2" />
                Download Free Report
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          
          {/* 3D Book Visual - Always visible */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* Glow effect behind book */}
              <div className="absolute inset-0 bg-gold/10 blur-3xl rounded-full scale-150" />
              
              {/* 3D Book component - responsive sizes */}
              <div className="hidden lg:block">
                <Book3D size="lg" />
              </div>
              <div className="hidden md:block lg:hidden">
                <Book3D size="md" />
              </div>
              <div className="block md:hidden">
                <Book3D size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketReportCTA;
