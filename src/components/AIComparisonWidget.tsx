import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  ArrowUpRight, 
  Check,
  Building2,
  TrendingUp,
  Calculator,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const AIComparisonWidget = () => {
  const features = [
    { icon: BarChart3, label: "Compare 2-5 Projects", description: "Side-by-side analysis" },
    { icon: TrendingUp, label: "ROI Projections", description: "Investment returns" },
    { icon: Calculator, label: "Mortgage Estimates", description: "Monthly payments" },
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-3xl p-8 md:p-10 relative overflow-hidden shadow-[0_0_40px_rgba(200,167,102,0.3)]"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/20 border border-gold/40 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-gold text-xs font-medium uppercase tracking-wider">AI Powered</span>
            </div>
            <h3 
              className="text-black text-2xl md:text-3xl font-bold mb-2"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              AI Property Comparison
            </h3>
            <p className="text-zinc-600 max-w-md">
              Compare projects dynamically with AI-powered analysis including valuation, ROI, and market insights.
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              Powered by JBJ Global Real Estate
            </p>
          </div>
          <div className="hidden md:flex w-16 h-16 bg-black rounded-2xl items-center justify-center shadow-lg">
            <BarChart3 className="w-8 h-8 text-gold" />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 p-4 bg-white/80 border border-gold/20 rounded-xl shadow-sm"
            >
              <div className="w-10 h-10 bg-gold/20 rounded-lg flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-black font-medium text-sm">{feature.label}</p>
                <p className="text-zinc-500 text-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sample comparison preview */}
        <div className="bg-zinc-100 border border-gold/20 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500 mb-3">
            <span>Project</span>
            <span className="text-center">Price/sqft</span>
            <span className="text-right">Yield Est.</span>
          </div>
          {[
            { name: "Emaar Alterra", price: "AED 2,450", roi: "7.9%" },
            { name: "Sobha Verde", price: "AED 2,280", roi: "7.2%" },
            { name: "Damac Lagoons", price: "AED 1,050", roi: "5.6%" },
          ].map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 py-2 border-t border-zinc-200 text-sm">
              <span className="text-black font-medium">{item.name}</span>
              <span className="text-center text-zinc-600">{item.price}</span>
              <span className="text-right text-green-600 font-medium">{item.roi}</span>
            </div>
          ))}
          <p className="text-[10px] text-zinc-400 mt-2 text-center">Sample figures for illustration · Use comparison tool for live data</p>
        </div>

        {/* CTA - Premium 3D Champagne Button */}
        <Link to="/compare">
          <button 
            className="relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 hover:scale-[1.02] transform active:scale-95 group w-full md:w-auto"
            style={{
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
            <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
            <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
            <span className="relative flex items-center justify-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
              <span className="text-black group-hover:text-gold transition-colors">Start</span>
              <span className="text-gold group-hover:text-black transition-colors">Comparing</span>
              <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
            </span>
          </button>
        </Link>
      </div>
    </motion.div>
  );
};

export default AIComparisonWidget;
