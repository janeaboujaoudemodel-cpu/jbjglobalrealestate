import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface PreFooterSeparatorProps {
  showCTA?: boolean;
  badgeText?: string;
  title?: string;
  subtitle?: string;
  primaryLink?: string;
  primaryText?: string;
  secondaryLink?: string;
  secondaryText?: string;
}

/**
 * PreFooterSeparator - Champagne section with pearl card before footer
 * 
 * Two-layer design: Champagne section background + Pearl content card
 */
export const PreFooterSeparator = ({
  showCTA = true,
  badgeText = "Begin Your Journey",
  title = "Ready to Find Your Perfect Property?",
  subtitle = "Connect with our expert team to explore Dubai's finest real estate opportunities.",
  primaryLink = "/contact",
  primaryText = "Contact Us",
  secondaryLink = "/properties",
  secondaryText = "Browse Properties"
}: PreFooterSeparatorProps) => {
  if (!showCTA) {
    // Simple champagne separator without CTA
    return (
      <section className="bg-gradient-to-r from-champagne-light via-champagne to-champagne-dark py-16">
        <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4">
          <div className="text-center">
            <div className="h-px bg-gold/30 w-24 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark py-10 sm:py-14 md:py-16 lg:py-20">
      <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4">
        <div>
          {/* Pearl Card - Single inner layer on champagne section */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center">
            {badgeText && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-gold/20 via-[#F5F0E6] to-gold/20 border border-gold/50 rounded-full text-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-6 shadow-lg shadow-gold/20">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold" />
                {badgeText}
              </div>
            )}

            <h2 
              className="text-black text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4 leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {title}
            </h2>
            <p className="text-zinc-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-5 sm:mb-8 leading-relaxed">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4">
              {/* Primary Button - 3D Premium Style */}
              <Link to={primaryLink} className="w-full sm:w-auto">
                <button 
                  className="group relative inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 text-sm sm:text-base font-bold rounded-lg sm:rounded-xl transition-all duration-300 overflow-hidden"
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
                  <span className="relative flex items-center gap-1">
                    <span className="text-black group-hover:text-gold transition-colors">{primaryText.split(' ')[0]}</span>
                    <span className="text-gold group-hover:text-black transition-colors">{primaryText.split(' ').slice(1).join(' ') || ''}</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-black group-hover:text-gold transition-colors relative z-10" />
                </button>
              </Link>
              {/* Secondary Button - Transparent with black border */}
              <Link to={secondaryLink} className="w-full sm:w-auto">
                <button 
                  className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 text-sm sm:text-base font-bold rounded-lg sm:rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                >
                  {secondaryText}
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreFooterSeparator;
