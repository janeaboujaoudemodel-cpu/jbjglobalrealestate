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
          <div className="mb-8 rounded-2xl p-8 text-center shadow-lg" style={{ backgroundColor: '#FFFFFF', borderColor: '#000000', borderWidth: 2 }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#000000' }}>
              <BarChart3 className="w-7 h-7" style={{ color: '#ffffff' }} />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: '#000000' }}>New to Market Intelligence?</h3>
            <p className="text-sm mb-5 max-w-md mx-auto leading-relaxed" style={{ color: '#374151' }}>
              Start with our Market Overview to understand the Dubai real estate landscape.
            </p>
            <Link 
              to="/market-intelligence/overview"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-sm font-semibold hover:-translate-y-0.5"
              style={{ backgroundColor: '#000000', color: '#ffffff' }}
            >
              <span style={{ color: '#ffffff' }}>Start Here: Market Overview</span>
              <ArrowRight className="w-4 h-4" style={{ color: '#ffffff' }} />
            </Link>
          </div>
        )}

        {/* Navigation Arrows */}
        <div className="flex flex-col sm:flex-row gap-6">
          {prevLink ? (
            <Link 
              to={prevLink.path}
              className="flex-1 group rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 2 }}
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg" style={{ backgroundColor: '#000000' }}>
                  <ArrowLeft className="w-5 h-5 md:w-7 md:h-7" style={{ color: '#ffffff' }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2 font-semibold" style={{ color: '#6B7280' }}>Previous</p>
                  <p className="font-bold text-lg md:text-xl lg:text-2xl" style={{ color: '#000000' }}>{prevLink.title}</p>
                  {prevLink.description && (
                    <p className="text-sm mt-1 md:mt-2 hidden md:block" style={{ color: '#4B5563' }}>{prevLink.description}</p>
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
              className="flex-1 group rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-right"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 2 }}
            >
              <div className="flex items-center justify-end gap-4 md:gap-6">
                <div className="flex-1">
                  <p className="text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2 font-semibold" style={{ color: '#6B7280' }}>Next</p>
                  <p className="font-bold text-lg md:text-xl lg:text-2xl" style={{ color: '#000000' }}>{nextLink.title}</p>
                  {nextLink.description && (
                    <p className="text-sm mt-1 md:mt-2 hidden md:block" style={{ color: '#4B5563' }}>{nextLink.description}</p>
                  )}
                </div>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg" style={{ backgroundColor: '#000000' }}>
                  <ArrowRight className="w-5 h-5 md:w-7 md:h-7" style={{ color: '#ffffff' }} />
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* All Market Intelligence Links */}
        <div className="mt-8 pt-6 border-t" style={{ borderColor: '#E5E7EB' }}>
          <p className="text-center text-sm font-medium uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>Market Intelligence</p>
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
