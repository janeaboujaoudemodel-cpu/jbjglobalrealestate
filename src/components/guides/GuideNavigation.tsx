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
    >
      <div className="max-w-4xl mx-auto">
        {/* Start Here Block */}
        {showStartHere && (
          <div className="mb-8 bg-gradient-to-br from-gold/10 via-gold/5 to-white border-2 border-gold/30 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Home className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-xl font-bold text-black mb-3">New to UAE Real Estate?</h3>
            <p className="text-zinc-600 text-sm mb-5 max-w-md mx-auto leading-relaxed">
              Start with our Buyer Guide to understand the fundamentals of purchasing property in the UAE.
            </p>
            <Link 
              to="/buyer-guide"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-black rounded-xl transition-all text-sm font-semibold shadow-lg hover:shadow-xl"
            >
              Start Here: Buyer Guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Navigation Arrows */}
        <div className="flex flex-col sm:flex-row gap-6">
          {prevGuide ? (
            <Link 
              to={prevGuide.path}
              className="flex-1 group bg-gradient-to-br from-zinc-50 to-white border-2 border-zinc-200 hover:border-gold/50 rounded-2xl p-8 transition-all hover:shadow-xl"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center group-hover:bg-gold/10 transition-colors shadow-lg">
                  <ArrowLeft className="w-7 h-7 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-500 text-sm uppercase tracking-wider mb-2 font-semibold">Previous Guide</p>
                  <p className="text-black font-bold group-hover:text-gold transition-colors text-xl md:text-2xl">{prevGuide.title}</p>
                  {prevGuide.description && (
                    <p className="text-zinc-600 text-sm mt-2">{prevGuide.description}</p>
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
              className="flex-1 group bg-gradient-to-br from-gold/10 to-gold/5 border-2 border-gold/30 hover:border-gold rounded-2xl p-8 transition-all hover:shadow-xl text-right"
            >
              <div className="flex items-center justify-end gap-6">
                <div className="flex-1">
                  <p className="text-gold text-sm uppercase tracking-wider mb-2 font-semibold">Next Guide</p>
                  <p className="text-black font-bold group-hover:text-gold transition-colors text-xl md:text-2xl">{nextGuide.title}</p>
                  {nextGuide.description && (
                    <p className="text-zinc-600 text-sm mt-2">{nextGuide.description}</p>
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

        {/* All Guides Links */}
        <div className="mt-8 pt-6 border-t border-zinc-200">
          <p className="text-center text-sm text-zinc-500 font-medium uppercase tracking-wider mb-4">All Guides</p>
          <div className="flex flex-wrap justify-center gap-3">
            {guides.map((guide) => (
              <Link
                key={guide.path}
                to={guide.path}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  guide.path === current
                    ? "bg-gradient-to-r from-gold to-gold-dark text-black shadow-lg"
                    : "bg-zinc-100 text-zinc-700 hover:text-black hover:bg-zinc-200 border border-zinc-200 hover:border-gold/50"
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
  { title: "FAQ", path: "/faq", description: "Common questions answered" },
];

export default GuideNavigation;
