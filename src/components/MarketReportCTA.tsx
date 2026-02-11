import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowUpRight, FileText } from "lucide-react";
import MarketReportHeroBook from "./MarketReportHeroBook";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const MarketReportCTA = () => {
  const benefits = [
    "Expert market analysis & forecasts",
    "Investment opportunity insights",
    "Area-by-area breakdowns",
    "Exclusive data & trends"
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className="grid md:grid-cols-2 gap-8 items-center"
    >
      {/* Book Preview - Left */}
      <div className="flex justify-center relative">
        {/* Ambient glow behind book */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
        </div>
        <MarketReportHeroBook />
      </div>

      {/* Content - Right */}
      <div className="space-y-6">
        <div>
          <h3 className="text-black text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            <span className="text-black">Market Report</span>
          </h3>
          <p className="text-zinc-700 text-base leading-relaxed">
            Get exclusive insights into Dubai's property market with our comprehensive guide.
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-3 text-zinc-700">
              <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Button - Primary button with correct color logic */}
        <Link to="/market-report" className="block">
          <button 
            className="relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
              boxShadow: `
                0 10px 30px rgba(200,167,102,0.4),
                0 6px 15px rgba(0,0,0,0.2),
                inset 0 2px 4px rgba(255,255,255,0.9),
                inset 0 -2px 4px rgba(200,167,102,0.2),
                0 0 20px rgba(200,167,102,0.3)
              `,
            }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
            <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
            <span className="relative flex items-center justify-center gap-2">
              <FileText className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
              <span className="text-black group-hover:text-gold transition-colors">Download Your</span>
              <span className="text-gold group-hover:text-black transition-colors">Free Book Now</span>
              <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
            </span>
          </button>
        </Link>

        {/* Attribution */}
        <p className="text-zinc-600 text-xs">
          Created by <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link>
        </p>
      </div>
    </motion.div>
  );
};

export default MarketReportCTA;
