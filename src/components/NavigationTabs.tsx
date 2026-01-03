import { Link, useLocation } from "react-router-dom";
import { Building2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

const NavigationTabs = React.forwardRef<HTMLDivElement>((_, ref) => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isDeveloperActive = currentPath === "/" || currentPath.startsWith("/developer");
  const isCommunityActive = currentPath.startsWith("/communities") || currentPath.startsWith("/community");

  return (
    <div ref={ref} className="flex items-center gap-3 mb-12 flex-wrap">
      {/* By Developer Tab */}
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

      {/* By Community Tab */}
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
      
      {/* Search Developer Button - Only show when on communities page */}
      {isCommunityActive && (
        <Link to="/">
          <Button
            variant="outline"
            className="px-6 py-3 h-auto rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white bg-transparent"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <Search className="w-4 h-4 mr-2" />
            Search Developer
          </Button>
        </Link>
      )}

      {/* Search Community Button - Only show when on developer page */}
      {isDeveloperActive && (
        <Link to="/communities">
          <Button
            variant="outline"
            className="px-6 py-3 h-auto rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white bg-transparent"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <Search className="w-4 h-4 mr-2" />
            Search Community
          </Button>
        </Link>
      )}
    </div>
  );
});

NavigationTabs.displayName = "NavigationTabs";

export default NavigationTabs;
