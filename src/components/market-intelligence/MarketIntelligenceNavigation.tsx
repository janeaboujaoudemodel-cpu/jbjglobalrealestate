import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

interface MarketIntelligenceLink {
  title: string;
  path: string;
  description?: string;
}

interface MarketIntelligenceNavigationProps {
  current: string;
  showStartHere?: boolean;
}

// Standardized Market Intelligence links
export const MARKET_INTELLIGENCE_LINKS: MarketIntelligenceLink[] = [
  { title: "Overview", path: "/market-intelligence/overview", description: "High-level market snapshot" },
  { title: "Area Intelligence", path: "/market-intelligence/areas", description: "Neighborhood-level analysis" },
  { title: "Market Reports", path: "/market-intelligence/reports", description: "Downloadable market reports" },
  { title: "Methodology", path: "/market-intelligence/methodology", description: "Data sources & transparency" },
];

export const MarketIntelligenceNavigation = ({ 
  current, 
  showStartHere = false 
}: MarketIntelligenceNavigationProps) => {
  const currentIndex = MARKET_INTELLIGENCE_LINKS.findIndex(g => g.path === current);
  const prevLink = currentIndex > 0 ? MARKET_INTELLIGENCE_LINKS[currentIndex - 1] : null;
  const nextLink = currentIndex < MARKET_INTELLIGENCE_LINKS.length - 1 ? MARKET_INTELLIGENCE_LINKS[currentIndex + 1] : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Start Here Block */}
        {showStartHere && (
          <div className="mb-8 bg-gradient-to-br from-gold/10 via-gold/5 to-white border-2 border-gold/30 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BarChart3 className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">New to Market Intelligence?</h3>
            <p className="text-zinc-600 text-sm mb-5 max-w-md mx-auto leading-relaxed">
              Start with our Market Overview to understand the Dubai real estate landscape.
            </p>
            <Link 
              to="/market-intelligence/overview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 rounded-xl transition-all text-sm font-semibold shadow-[0_4px_20px_rgba(200,167,102,0.3),0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_25px_rgba(200,167,102,0.5),0_10px_40px_rgba(0,0,0,0.2)] hover:scale-[1.02]"
            >
              <span className="text-gold">Start Here:</span>
              <span className="text-black">Market Overview</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </Link>
          </div>
        )}

        {/* Navigation Arrows */}
        <div className="flex flex-col sm:flex-row gap-6">
          {prevLink ? (
            <Link 
              to={prevLink.path}
              className="flex-1 group bg-gradient-to-br from-zinc-50 to-white border-2 border-zinc-200 hover:border-gold/50 rounded-2xl p-8 transition-all hover:shadow-xl"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center group-hover:bg-gold/10 transition-colors shadow-lg">
                  <ArrowLeft className="w-7 h-7 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-500 text-sm uppercase tracking-wider mb-2 font-semibold">Previous</p>
                  <p className="text-black font-bold group-hover:text-gold transition-colors text-xl md:text-2xl">{prevLink.title}</p>
                  {prevLink.description && (
                    <p className="text-zinc-600 text-sm mt-2">{prevLink.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextLink ? (
            <Link 
              to={nextLink.path}
              className="flex-1 group bg-gradient-to-br from-gold/10 to-gold/5 border-2 border-gold/30 hover:border-gold rounded-2xl p-8 transition-all hover:shadow-xl text-right"
            >
              <div className="flex items-center justify-end gap-6">
                <div className="flex-1">
                  <p className="text-gold text-sm uppercase tracking-wider mb-2 font-semibold">Next</p>
                  <p className="text-black font-bold group-hover:text-gold transition-colors text-xl md:text-2xl">{nextLink.title}</p>
                  {nextLink.description && (
                    <p className="text-zinc-600 text-sm mt-2">{nextLink.description}</p>
                  )}
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold-dark rounded-2xl flex items-center justify-center shadow-lg">
                  <ArrowRight className="w-7 h-7 text-black" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* All Market Intelligence Links */}
        <div className="mt-8 pt-6 border-t border-zinc-200">
          <p className="text-center text-sm text-zinc-500 font-medium uppercase tracking-wider mb-4">Market Intelligence</p>
          <div className="flex flex-wrap justify-center gap-3">
            {MARKET_INTELLIGENCE_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  link.path === current
                    ? "bg-gradient-to-r from-[#D4C4A8] via-[#C8B89A] to-[#B8A888] text-black shadow-md border border-gold/50"
                    : "bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] text-zinc-700 hover:text-black border border-gold/30 hover:border-gold/50 shadow-[0_2px_10px_rgba(200,167,102,0.2)] hover:shadow-[0_4px_15px_rgba(200,167,102,0.3)] hover:scale-[1.02]"
                }`}
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketIntelligenceNavigation;
