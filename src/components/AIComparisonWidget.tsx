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
      className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border border-zinc-800 rounded-3xl p-8 md:p-10 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 border border-gold/30 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-gold" />
              <span className="text-gold text-xs font-medium uppercase tracking-wider">AI Powered</span>
            </div>
            <h3 
              className="text-white text-2xl md:text-3xl font-bold mb-2"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              AI Property Comparison
            </h3>
            <p className="text-zinc-400 max-w-md">
              Compare projects dynamically with AI-powered analysis including valuation, ROI, and market insights.
            </p>
          </div>
          <div className="hidden md:flex w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-2xl items-center justify-center shadow-lg shadow-gold/20">
            <BarChart3 className="w-8 h-8 text-black" />
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl"
            >
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">{feature.label}</p>
                <p className="text-zinc-500 text-xs">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Sample comparison preview */}
        <div className="bg-black/40 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400 mb-3">
            <span>Project</span>
            <span className="text-center">Price/sqft</span>
            <span className="text-right">ROI</span>
          </div>
          {[
            { name: "Emaar Alterra", price: "AED 2,450", roi: "8.2%" },
            { name: "Sobha Verde", price: "AED 2,180", roi: "7.8%" },
            { name: "Damac Lagoons", price: "AED 1,850", roi: "9.1%" },
          ].map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 py-2 border-t border-zinc-800 text-sm">
              <span className="text-white">{item.name}</span>
              <span className="text-center text-zinc-300">{item.price}</span>
              <span className="text-right text-green-500">{item.roi}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link to="/compare">
          <Button className="w-full md:w-auto bg-gold hover:bg-gold-light text-black font-semibold px-8 py-5 text-base">
            Start Comparing
            <ArrowUpRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
};

export default AIComparisonWidget;
