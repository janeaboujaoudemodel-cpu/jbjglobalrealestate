import { Link, useLocation } from "react-router-dom";
import { Building2, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NavigationTabs = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { path: "/", label: "By Developer", icon: Building2 },
    { path: "/communities", label: "By Community", icon: MapPin },
  ];

  return (
    <div className="flex items-center gap-3 mb-12 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab.path === "/" 
          ? currentPath === "/" 
          : currentPath.startsWith(tab.path);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all border ${
              isActive
                ? "bg-gradient-to-r from-gold to-gold-dark text-gold-foreground border-gold/30 shadow-lg shadow-gold/10"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800"
            }`}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
      
      {/* Search Community Button */}
      <Link to="/communities">
        <Button
          variant="outline"
          className="px-6 py-3 h-auto rounded-full border-gold/40 text-gold hover:bg-gold/10 hover:text-gold-light bg-transparent"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          <Search className="w-4 h-4 mr-2" />
          Search Community
        </Button>
      </Link>
    </div>
  );
};

export default NavigationTabs;
