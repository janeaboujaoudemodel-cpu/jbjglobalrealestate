import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PreFooterSeparatorProps {
  showCTA?: boolean;
  title?: string;
  subtitle?: string;
  primaryLink?: string;
  primaryText?: string;
  secondaryLink?: string;
  secondaryText?: string;
}

/**
 * PreFooterSeparator - White section that visually separates content from the dark footer
 * 
 * Per the global design spec: "Mixed backgrounds allowed, but clear white block before footer"
 * This component provides that white buffer zone.
 */
export const PreFooterSeparator = ({
  showCTA = true,
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
      <section className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-[1100px] mx-auto text-center">
            <div className="h-px bg-gold/30 w-24 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] py-16 md:py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-[1100px] mx-auto">
          {/* Inner CTA Box - keeps white/pearl background */}
          <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/40 rounded-2xl p-8 md:p-12 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center">
            <h2 
              className="text-black text-2xl md:text-3xl lg:text-4xl font-semibold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              {title}
            </h2>
            <p className="text-zinc-600 text-base md:text-lg max-w-2xl mx-auto mb-8">
              {subtitle}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {/* Primary Button - 3D Premium Style: Black first, Gold second, Black arrow on normal → reverse on hover */}
              <Link to={primaryLink}>
                <button 
                  className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden"
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
                  <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors relative z-10" />
                </button>
              </Link>
              {/* Secondary Button - Transparent with black border */}
              <Link to={secondaryLink}>
                <button 
                  className="group inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                >
                  {secondaryText}
                  <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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
