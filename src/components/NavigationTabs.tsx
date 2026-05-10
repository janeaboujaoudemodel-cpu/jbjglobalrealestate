import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeveloperSearchModal from "./DeveloperSearchModal";
import CommunitySearchModal from "./CommunitySearchModal";
import React from "react";

interface NavigationTabsProps {
  showFiltersButton?: boolean;
  onFiltersClick?: () => void;
  activeFiltersCount?: number;
}

const NavigationTabs = React.forwardRef<HTMLDivElement, NavigationTabsProps>(
  ({ showFiltersButton = false, onFiltersClick, activeFiltersCount = 0 }, ref) => {
    const location = useLocation();
    const currentPath = location.pathname;
    const [isDeveloperSearchOpen, setIsDeveloperSearchOpen] = useState(false);
    const [isCommunitySearchOpen, setIsCommunitySearchOpen] = useState(false);
    
    const isDeveloperActive = currentPath === "/" || currentPath.startsWith("/developer");
    const isCommunityActive = currentPath.startsWith("/communities") || currentPath.startsWith("/community");

    return (
      <>
        <div ref={ref} className="space-y-4 mb-8">
          {/* Primary Navigation - By Developer / By Community side by side */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all border-2 ${
                isDeveloperActive
                  ? "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60 shadow-lg"
                  : "bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:border-[#B89555]/40 border-[#B89555]/20"
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                isDeveloperActive 
                  ? "bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark" 
                  : "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]"
              }`}>
                <Building2 className="w-3.5 h-3.5 text-[#1A1A1A]" />
              </div>
              By Developer
            </Link>

            <Link
              to="/communities"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all border-2 ${
                isCommunityActive
                  ? "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/60 shadow-lg"
                  : "bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:border-[#B89555]/40 border-[#B89555]/20"
              }`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${
                isCommunityActive 
                  ? "bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark" 
                  : "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]"
              }`}>
                <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]" />
              </div>
              By Community
            </Link>
          </div>
          
          {/* Search Row - Contextual search button based on active tab */}
          <div className="flex items-center gap-3 flex-wrap">
            {isDeveloperActive ? (
              <Button
                onClick={() => setIsDeveloperSearchOpen(true)}
                variant="outline"
                className="px-6 py-3 h-auto rounded-full border-2 border-[#B89555]/30 text-[#1A1A1A] hover:bg-gradient-to-br hover:from-[#FDFBF7] hover:via-[#F7F2EA] hover:to-[#EFE6D6] hover:border-[#B89555]/50 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark"
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] mr-2">
                  <Search className="w-3.5 h-3.5 text-[#1A1A1A]" />
                </div>
                Search Developer
              </Button>
            ) : (
              <Button
                onClick={() => setIsCommunitySearchOpen(true)}
                variant="outline"
                className="px-6 py-3 h-auto rounded-full border-2 border-[#B89555]/30 text-[#1A1A1A] hover:bg-gradient-to-br hover:from-[#FDFBF7] hover:via-[#F7F2EA] hover:to-[#EFE6D6] hover:border-[#B89555]/50 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark"
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] mr-2">
                  <Search className="w-3.5 h-3.5 text-[#1A1A1A]" />
                </div>
                Search Community
              </Button>
            )}

            {/* Filters Button - Only show when prop is true */}
            {showFiltersButton && onFiltersClick && (
              <Button
                onClick={onFiltersClick}
                variant="outline"
                className="px-6 py-3 h-auto rounded-full border-2 border-[#B89555]/30 text-[#1A1A1A] hover:bg-gradient-to-br hover:from-[#FDFBF7] hover:via-[#F7F2EA] hover:to-[#EFE6D6] hover:border-[#B89555]/50 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark"
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] mr-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#1A1A1A]" />
                </div>
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-[#EFE6D6] text-[#1A1A1A] text-xs font-bold rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Search Modals */}
        <DeveloperSearchModal 
          isOpen={isDeveloperSearchOpen} 
          onClose={() => setIsDeveloperSearchOpen(false)} 
        />
        <CommunitySearchModal 
          isOpen={isCommunitySearchOpen} 
          onClose={() => setIsCommunitySearchOpen(false)} 
        />
      </>
    );
  }
);

NavigationTabs.displayName = "NavigationTabs";

export default NavigationTabs;
