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
          <div className="mb-8 bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/30 rounded-xl p-6 text-center">
            <Home className="w-8 h-8 text-gold mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">New to UAE Real Estate?</h3>
            <p className="text-zinc-400 text-sm mb-4">
              Start with our Buyer Guide to understand the fundamentals of purchasing property in the UAE.
            </p>
            <Link 
              to="/buyer-guide"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold rounded-lg transition-colors text-sm font-medium"
            >
              Start Here: Buyer Guide
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Navigation Arrows */}
        <div className="flex flex-col sm:flex-row gap-4">
          {prevGuide ? (
            <Link 
              to={prevGuide.path}
              className="flex-1 group bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-gold/50 rounded-xl p-5 transition-all hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gold" />
                </div>
                <div className="flex-1">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1 font-medium">Previous Guide</p>
                  <p className="text-black font-semibold group-hover:text-gold transition-colors text-lg">{prevGuide.title}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {nextGuide ? (
            <Link 
              to={nextGuide.path}
              className="flex-1 group bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-gold/50 rounded-xl p-5 transition-all hover:shadow-lg text-right"
            >
              <div className="flex items-center justify-end gap-4">
                <div className="flex-1">
                  <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1 font-medium">Next Guide</p>
                  <p className="text-black font-semibold group-hover:text-gold transition-colors text-lg">{nextGuide.title}</p>
                </div>
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                  <ArrowRight className="w-5 h-5 text-gold" />
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>

        {/* All Guides Links */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {guides.map((guide) => (
            <Link
              key={guide.path}
              to={guide.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                guide.path === current
                  ? "bg-gold text-black shadow-md"
                  : "bg-white text-zinc-700 hover:text-black hover:bg-zinc-100 border border-zinc-200 hover:border-gold/50"
              }`}
            >
              {guide.title}
            </Link>
          ))}
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
