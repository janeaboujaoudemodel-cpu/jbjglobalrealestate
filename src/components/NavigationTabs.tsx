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
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all border ${
                isDeveloperActive
                  ? "bg-white text-black border-white shadow-lg"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800"
              }`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <Building2 className="w-4 h-4" />
              By Developer
            </Link>

            <Link
              to="/communities"
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all border ${
                isCommunityActive
                  ? "bg-white text-black border-white shadow-lg"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800"
              }`}
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <MapPin className="w-4 h-4" />
              By Community
            </Link>
          </div>
          
          {/* Search Row - Contextual search button based on active tab */}
          <div className="flex items-center gap-3 flex-wrap">
            {isDeveloperActive ? (
              <Button
                onClick={() => setIsDeveloperSearchOpen(true)}
                variant="outline"
                className="px-6 py-3 h-auto rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white bg-transparent"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Developer
              </Button>
            ) : (
              <Button
                onClick={() => setIsCommunitySearchOpen(true)}
                variant="outline"
                className="px-6 py-3 h-auto rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white bg-transparent"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <Search className="w-4 h-4 mr-2" />
                Search Community
              </Button>
            )}

            {/* Filters Button - Only show when prop is true */}
            {showFiltersButton && onFiltersClick && (
              <Button
                onClick={onFiltersClick}
                variant="outline"
                className="px-6 py-3 h-auto rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white bg-transparent"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-white text-black text-xs font-bold rounded-full">
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
