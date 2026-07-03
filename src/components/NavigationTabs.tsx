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
              className={`allow-white inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all border-0 ${
                isDeveloperActive
                  ? "jj-pill-emerald-metallic text-white shadow-lg"
                  : "jj-pill-emerald-metallic text-white hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
              }`}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#064E3B] shadow-inner">
                <Building2 className="w-3.5 h-3.5 text-white" />
              </div>
              By Developer
            </Link>

            <Link
              to="/communities"
              className={`allow-white inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all border-0 ${
                isCommunityActive
                  ? "jj-pill-emerald-metallic text-white shadow-lg"
                  : "jj-pill-emerald-metallic text-white hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
              }`}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#064E3B] shadow-inner">
                <MapPin className="w-3.5 h-3.5 text-white" />
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
                className="allow-white px-6 py-3 h-auto rounded-full border-0 text-white jj-pill-emerald-metallic"
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#064E3B] mr-2 shadow-inner">
                  <Search className="w-3.5 h-3.5 text-white" />
                </div>
                Search Developer
              </Button>
            ) : (
              <Button
                onClick={() => setIsCommunitySearchOpen(true)}
                variant="outline"
                className="allow-white px-6 py-3 h-auto rounded-full border-0 text-white jj-pill-emerald-metallic"
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#064E3B] mr-2 shadow-inner">
                  <Search className="w-3.5 h-3.5 text-white" />
                </div>
                Search Community
              </Button>
            )}

            {/* Filters Button - Only show when prop is true */}
            {showFiltersButton && onFiltersClick && (
              <Button
                onClick={onFiltersClick}
                variant="outline"
                className="allow-white px-6 py-3 h-auto rounded-full border-0 text-white jj-pill-emerald-metallic"
              >
                <div className="w-6 h-6 rounded-md flex items-center justify-center bg-[#064E3B] mr-2 shadow-inner">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
                </div>
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white/14 text-white text-xs font-bold rounded-full">
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
