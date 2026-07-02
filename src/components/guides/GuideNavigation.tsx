import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Home } from "lucide-react";
import { motion } from "framer-motion";

interface GuideLink {
  title: string;
  path: string;
  description?: string;
}

interface GuideNavigationProps {
  current: string;
  guides: GuideLink[];
  showStartHere?: boolean;
}

export const GuideNavigation = ({ current, guides, showStartHere = false }: GuideNavigationProps) => {
  const currentIndex = guides.findIndex(g => g.path === current);
  const prevGuide = currentIndex > 0 ? guides[currentIndex - 1] : null;
  const nextGuide = currentIndex < guides.length - 1 ? guides[currentIndex + 1] : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-8"
      data-guide-nav
    >
      <div className="max-w-4xl mx-auto">
        {/* Start Here Block */}
        {showStartHere && (
          <div className="mb-8 jj-card-inner border-2 border-[#B89555]/50 rounded-2xl p-8 text-center shadow-[0_8px_30px_rgba(200,167,102,0.2)]">
            {/* Active color icon box */}
            <div className="jj-icon-box-active w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Home className="w-7 h-7 text-[#1A1A1A]" />
            </div>
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">New to UAE Real Estate?</h3>
            <p className="text-[#1A1A1A]/70 text-sm mb-5 max-w-md mx-auto leading-relaxed">
              Start with our Buyer Guide to understand the fundamentals of purchasing property in the UAE.
            </p>
            <Link 
              to="/buyer-guide"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/50 rounded-xl transition-all text-sm font-semibold shadow-[0_8px_25px_rgba(200,167,102,0.3),0_4px_15px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_35px_rgba(200,167,102,0.45),0_8px_25px_rgba(0,0,0,0.18)] hover:-translate-y-1"
            >
              <span className="text-[#1A1A1A]">Start Here:</span>
              <span className="text-[#1A1A1A]">Buyer Guide</span>
              <ArrowRight className="w-4 h-4 text-[#1A1A1A]" />
            </Link>
          </div>
        )}

        {/* Navigation Arrows */}
        <div className="flex flex-col sm:flex-row gap-6">
          {prevGuide ? (
            <Link 
              to={prevGuide.path}
              data-guide-nav-card
              className="flex-1 group jj-card-inner border-2 border-[#B89555]/50 hover:border-[#B89555] rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(200,167,102,0.35),0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1"
            >
              <div className="flex items-center gap-4 md:gap-6">
                {/* Active color icon box */}
                <div className="jj-icon-box-active w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg">
                  <ArrowLeft className="w-5 h-5 md:w-7 md:h-7 text-[#1A1A1A]" />
                </div>
                <div className="flex-1">
                  <p className="text-[#1A1A1A]/70 text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2 font-semibold">Previous Guide</p>
                  <p className="text-[#1A1A1A] font-bold group-hover:text-[#1A1A1A] transition-colors text-lg md:text-xl lg:text-2xl">{prevGuide.title}</p>
                  {prevGuide.description && (
                    <p className="text-[#1A1A1A]/70 text-sm mt-1 md:mt-2 hidden md:block">{prevGuide.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextGuide ? (
            <Link 
              to={nextGuide.path}
              data-guide-nav-card
              className="flex-1 group jj-card-inner border-2 border-[#B89555]/50 hover:border-[#B89555] rounded-2xl p-6 md:p-8 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(200,167,102,0.35),0_8px_25px_rgba(0,0,0,0.15)] hover:-translate-y-1 text-right"
            >
              <div className="flex items-center justify-end gap-4 md:gap-6">
                <div className="flex-1">
                  <p className="text-[#1A1A1A] text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2 font-semibold">Next Guide</p>
                  <p className="text-[#1A1A1A] font-bold group-hover:text-[#1A1A1A] transition-colors text-lg md:text-xl lg:text-2xl">{nextGuide.title}</p>
                  {nextGuide.description && (
                    <p className="text-[#1A1A1A]/70 text-sm mt-1 md:mt-2 hidden md:block">{nextGuide.description}</p>
                  )}
                </div>
                {/* Active color icon box */}
                <div className="jj-icon-box-active w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg">
                  <ArrowRight className="w-5 h-5 md:w-7 md:h-7 text-[#1A1A1A]" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* All Guides Links */}
        <div className="mt-8 pt-6 border-t border-[#B89555]/30">
          <p className="text-center text-sm text-[#1A1A1A]/70 font-medium uppercase tracking-wider mb-4">All Guides</p>
          <div className="flex flex-wrap justify-center gap-3">
            {guides.map((guide) => (
              <Link
                key={guide.path}
                to={guide.path}
                className={`px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all duration-300 border-2 ${
                  guide.path === current
                    ? "bg-gradient-to-br from-[#D8C7A6] via-[#C8B89A] to-[#B8A888] text-[#1A1A1A] border-[#B89555] shadow-[0_6px_20px_rgba(200,167,102,0.35)]"
                    : "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A]/70 hover:text-[#1A1A1A] border-[#B89555]/50 hover:border-[#B89555] shadow-[0_4px_15px_rgba(200,167,102,0.2)] hover:shadow-[0_8px_25px_rgba(200,167,102,0.35)] hover:-translate-y-0.5"
                }`}
              >
                {guide.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Standardized guide links
export const GUIDE_LINKS: GuideLink[] = [
  { title: "Buyer Guide", path: "/buyer-guide", description: "Complete guide to purchasing property" },
  { title: "Seller Guide", path: "/seller-guide", description: "How to sell property successfully" },
  { title: "Rent Guide", path: "/rent-guide", description: "How renting works in Dubai" },
  { title: "Tenant Guide", path: "/tenant-guide", description: "Tenant rights & responsibilities" },
  { title: "Landlord Guide", path: "/landlord-guide", description: "List your property for rent" },
  { title: "Area Guides", path: "/areas", description: "Explore Dubai's communities" },
  { title: "Golden Visa Guide", path: "/guides/golden-visa-uae", description: "Residency through property investment" },
  { title: "Investor Education", path: "/investor-education", description: "Investment framework" },
  { title: "Investor FAQ", path: "/investor-faq", description: "Investment questions answered" },
  { title: "Broker Education", path: "/broker-education", description: "Professional broker training" },
  { title: "Broker FAQ", path: "/broker-faq", description: "Professional broker questions answered" },
  { title: "FAQ", path: "/faq", description: "Common questions answered" },
];

export default GuideNavigation;
