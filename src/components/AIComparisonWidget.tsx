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
    { icon: BarChart3, label: "Compare up to 10 projects", description: "Select exact projects, developers, or areas" },
    { icon: TrendingUp, label: "ROI projections", description: "Yield & investment returns" },
    { icon: Calculator, label: "Excel & premium table", description: "Two export styles" },
  ];

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeInUp}
      className="bg-[#F7F2EA] rounded-2xl p-8 md:p-10 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#EFE6D6]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#EFE6D6]/10 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4 jj-surface-emerald-soft">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">AI Powered</span>
            </div>
            <h3 
              className="text-[#1A1A1A] text-2xl md:text-3xl font-bold mb-2"
            >
              AI Property Comparison
            </h3>
            <p className="text-[#1A1A1A]/70 max-w-md">
              Compare projects dynamically with AI-powered analysis including valuation, ROI, and market insights.
            </p>
            <p className="text-[#1A1A1A]/70 text-sm mt-2">
              Powered by JBJ Global Real Estate
            </p>
          </div>
          <div
            data-surface="emerald"
            data-emerald-ok="icon"
            className="jj-surface-emerald hidden md:flex w-16 h-16 rounded-2xl items-center justify-center shadow-lg"
          >
            <BarChart3 className="w-8 h-8" />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 p-4 bg-[#F7F2EA] border border-[#B89555]/20 rounded-xl shadow-sm"
            >
              <div className="w-10 h-10 bg-[#EFE6D6]/20 rounded-lg flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-[#1A1A1A]" />
              </div>
              <div>
                <p className="text-[#1A1A1A] font-medium text-sm">{feature.label}</p>
                <p className="text-[#1A1A1A]/70 text-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sample comparison preview */}
        <div className="bg-[#EFE6D6] border border-[#B89555]/20 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-2 text-xs text-[#1A1A1A]/70 mb-3">
            <span>Project</span>
            <span className="text-center">Price/sqft</span>
            <span className="text-right">Yield Est.</span>
          </div>
          {[
            { name: "Emaar Alterra", price: "AED 2,450", roi: "7.9%" },
            { name: "Sobha Verde", price: "AED 2,280", roi: "7.2%" },
            { name: "Damac Lagoons", price: "AED 1,050", roi: "5.6%" },
          ].map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 py-2 border-t border-[#B89555]/30 text-sm">
              <span className="text-[#1A1A1A] font-medium">{item.name}</span>
              <span className="text-center text-[#1A1A1A]/70">{item.price}</span>
              <span className="text-right text-[color:var(--emerald-1)] font-medium">{item.roi}</span>
            </div>
          ))}
        </div>

        {/* Dual CTAs — Pick from listings or enter manually */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/properties?compareMode=1" className="flex-1">
            <button
              data-surface="navy"
              data-allow-dark-cta
              className="surface-navy allow-white w-full relative inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-bold rounded-xl bg-[#0A0A0A] text-white border border-[#B89555]/55 hover:bg-[#1F1F1F] hover:border-[#B89555] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,10,10,0.5)] active:scale-[0.98] transition-all duration-300 group"
              style={{ color: "#FFFFFF" }}
            >
              <BarChart3 className="allow-white w-5 h-5" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              <span className="allow-white" style={{ color: "#FFFFFF" }}>Start exploring</span>
              <ArrowUpRight className="allow-white w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            </button>
          </Link>
          <Link to="/compare-manual" className="flex-1">
            <button
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-semibold rounded-xl bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/40 hover:bg-[#EFE6D6] hover:-translate-y-0.5 transition-all duration-300"
            >
              <Building2 className="w-5 h-5 text-[#1A1A1A]/70" />
              <span>Enter manually</span>
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default AIComparisonWidget;
