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
          <div className="mb-8 jj-card-inner border-2 border-gold/50 rounded-2xl p-8 text-center shadow-[0_8px_30px_rgba(200,167,102,0.2)]">
            {/* Active color icon box */}
            <div className="jj-icon-box-active w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <BarChart3 className="w-7 h-7 text-black" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">New to Market Intelligence?</h3>
            <p className="text-gray-600 text-sm mb-5 max-w-md mx-auto leading-relaxed">
              Start with our Market Overview to understand the Dubai real estate landscape.
            </p>
            <Link 
              to="/market-intelligence/overview"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-gold/50 rounded-xl transition-all text-sm font-semibold shadow-[0_8px_25px_rgba(200,167,102,0.3),0_4px_15px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_35px_rgba(200,167,102,0.45),0_8px_25px_rgba(0,0,0,0.18)] hover:-translate-y-1"
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
              className="flex-1 group jj-card-inner border-2 border-gold/50 hover:border-gold rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(200,167,102,0.35),0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 md:gap-6">
                {/* Active color icon box */}
                <div className="jj-icon-box-active w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg">
                  <ArrowLeft className="w-5 h-5 md:w-7 md:h-7 text-black" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2 font-semibold">Previous</p>
                  <p className="text-black font-bold group-hover:text-gold transition-colors text-lg md:text-xl lg:text-2xl">{prevLink.title}</p>
                  {prevLink.description && (
                    <p className="text-gray-600 text-sm mt-1 md:mt-2 hidden md:block">{prevLink.description}</p>
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
              className="flex-1 group jj-card-inner border-2 border-gold/50 hover:border-gold rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(200,167,102,0.35),0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1 text-right"
            >
              <div className="flex items-center justify-end gap-4 md:gap-6">
                <div className="flex-1">
                  <p className="text-gold text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2 font-semibold">Next</p>
                  <p className="text-black font-bold group-hover:text-gold transition-colors text-lg md:text-xl lg:text-2xl">{nextLink.title}</p>
                  {nextLink.description && (
                    <p className="text-gray-600 text-sm mt-1 md:mt-2 hidden md:block">{nextLink.description}</p>
                  )}
                </div>
                {/* Active color icon box */}
                <div className="jj-icon-box-active w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg">
                  <ArrowRight className="w-5 h-5 md:w-7 md:h-7 text-black" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* All Market Intelligence Links */}
        <div className="mt-8 pt-6 border-t border-gold/30">
          <p className="text-center text-sm text-gray-600 font-medium uppercase tracking-wider mb-4">Market Intelligence</p>
          <div className="flex flex-wrap justify-center gap-3">
            {MARKET_INTELLIGENCE_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 border-2 ${
                  link.path === current
                    ? "bg-gradient-to-br from-[#D8C7A6] via-[#C8B89A] to-[#B8A888] text-black border-gold shadow-[0_6px_20px_rgba(200,167,102,0.35)]"
                    : "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-gray-700 hover:text-black border-gold/50 hover:border-gold shadow-[0_4px_15px_rgba(200,167,102,0.2)] hover:shadow-[0_8px_25px_rgba(200,167,102,0.35)] hover:-translate-y-0.5"
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
