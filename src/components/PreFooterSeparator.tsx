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
      <section className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-[1100px] mx-auto text-center">
            <div className="h-px bg-zinc-200 w-24 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] py-16 md:py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-[1100px] mx-auto text-center">
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
            <Link to={primaryLink}>
              <button 
                className="inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-semibold rounded-xl transition-all duration-300 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] text-gold border-2 border-gold/40 shadow-[0_8px_30px_rgba(200,167,102,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_4px_15px_rgba(200,167,102,0.15)] hover:translate-y-0.5"
              >
                {primaryText}
                <ArrowUpRight className="w-4 h-4 text-black" />
              </button>
            </Link>
            <Link to={secondaryLink}>
              <button 
                className="inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-semibold rounded-xl transition-all duration-300 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] text-gold border-2 border-gold/40 shadow-[0_8px_30px_rgba(200,167,102,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] hover:shadow-[0_4px_15px_rgba(200,167,102,0.15)] hover:translate-y-0.5"
              >
                {secondaryText}
                <ArrowUpRight className="w-4 h-4 text-black" />
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreFooterSeparator;
