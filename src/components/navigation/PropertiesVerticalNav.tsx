import { Link, useLocation } from "react-router-dom";
import { Building2, BarChart3, BookOpen, Briefcase, Users, Home, Tag, Key, PlusCircle, Building, Layers, Cpu, Heart, GitCompare, Calculator, Headphones, MapPin, Lightbulb, ChevronRight, Search, Globe, User, Settings } from "lucide-react";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";
import React, { useState, useRef, useCallback, useEffect } from "react";

// Mega Menu Components
import MegaMenuBuy from "@/components/header/MegaMenuBuy";
import MegaMenuSell from "@/components/header/MegaMenuSell";
import MegaMenuRent from "@/components/header/MegaMenuRent";
import MegaMenuProjects from "@/components/header/MegaMenuProjects";
import MegaMenuDevelopers from "@/components/header/MegaMenuDevelopers";
import MegaMenuAreas from "@/components/header/MegaMenuAreas";
import MegaMenuInsights from "@/components/header/MegaMenuInsights";

// Utility Components
import GlobalSearchModal from "@/components/GlobalSearchModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";

type MegaMenuKey = 'buy' | 'sell' | 'rent' | 'projects' | 'developers' | 'areas' | 'insights';

const NAV_ITEMS = [
  { label: "Off-plan", href: "/properties", icon: Building2 },
  { label: "Buy", href: "/buy", icon: Home, megaMenu: 'buy' as MegaMenuKey },
  { label: "Sell", href: "/sell", icon: Tag, megaMenu: 'sell' as MegaMenuKey },
  { label: "Rent", href: "/rent", icon: Key, megaMenu: 'rent' as MegaMenuKey },
  { label: "List Property", href: "/list-property", icon: PlusCircle },
  { label: "Developers", href: "/developers", icon: Building, megaMenu: 'developers' as MegaMenuKey },
  { label: "Projects", href: "/projects", icon: Layers, megaMenu: 'projects' as MegaMenuKey },
  { label: "Areas", href: "/areas", icon: MapPin, megaMenu: 'areas' as MegaMenuKey },
  { label: "AI Tools", href: "/toolkit", icon: Cpu },
  { label: "Market Intel", href: "/market-intelligence", icon: BarChart3 },
  { label: "Insights", href: "/insights", icon: Lightbulb, megaMenu: 'insights' as MegaMenuKey },
  { label: "Guides", href: "/guides", icon: BookOpen },
  { label: "Services", href: "/services", icon: Briefcase },
  { label: "About", href: "/about", icon: Users },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Compare", href: "/compare", icon: GitCompare },
  { label: "Mortgage Calc", href: "/mortgage-calculator", icon: Calculator },
];

export default function PropertiesVerticalNav() {
  const location = useLocation();
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNavClick = useCallback((megaMenu?: MegaMenuKey, e?: React.MouseEvent) => {
    if (megaMenu) {
      e?.preventDefault();
      setActiveMegaMenu(prev => prev === megaMenu ? null : megaMenu);
    }
  }, []);

  const closeMegaMenu = useCallback(() => {
    setActiveMegaMenu(null);
  }, []);

  // Close on route change
  useEffect(() => {
    closeMegaMenu();
  }, [location.pathname, closeMegaMenu]);

  const renderMegaMenu = () => {
    if (!activeMegaMenu) return null;
    
    return (
      <>
        {/* Backdrop with blur - covers everything except sidebar */}
        <div
          className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm"
          style={{ left: '200px' }}
          onClick={closeMegaMenu}
        />
        {/* Centered smaller panel - above filter bar */}
        <div
          className="fixed z-[10000] flex items-start justify-center pointer-events-none"
          style={{ left: '200px', top: 0, bottom: 0, right: 0 }}
        >
          <div
            className="pointer-events-auto max-w-[500px] w-full max-h-[70vh] overflow-y-auto mt-8 rounded-2xl shadow-2xl border border-gold/30 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6]"
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={closeMegaMenu}
          >
            <div className="p-4">
              {activeMegaMenu === 'buy' && <MegaMenuBuy onClose={closeMegaMenu} />}
              {activeMegaMenu === 'sell' && <MegaMenuSell onClose={closeMegaMenu} />}
              {activeMegaMenu === 'rent' && <MegaMenuRent onClose={closeMegaMenu} />}
              {activeMegaMenu === 'projects' && <MegaMenuProjects onClose={closeMegaMenu} />}
              {activeMegaMenu === 'developers' && <MegaMenuDevelopers onClose={closeMegaMenu} />}
              {activeMegaMenu === 'areas' && <MegaMenuAreas onClose={closeMegaMenu} />}
              {activeMegaMenu === 'insights' && <MegaMenuInsights onClose={closeMegaMenu} />}
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      <div
        className="w-[200px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 flex flex-col h-full"
      >
        {/* Logo - Links to homepage */}
        <Link to="/" className="p-4 border-b border-gold/20 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src={jbjMonogramLightBg} alt="JBJ" className="w-16 h-16 object-contain" />
          <div className="flex flex-col" style={{ fontFamily: "Poppins, sans-serif" }}>
            <span className="text-[11px] font-bold text-black tracking-wide leading-tight">JBJ GLOBAL</span>
            <span className="text-[11px] font-bold text-gold tracking-wide leading-tight">REAL ESTATE</span>
          </div>
        </Link>

        {/* Nav Items */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href || (item.href === "/properties" && location.pathname.startsWith("/properties"));
            const Icon = item.icon;
            const hasMegaMenu = !!item.megaMenu;
            const isMenuOpen = activeMegaMenu === item.megaMenu;
            return (
              <div key={item.href}>
                <Link
                  to={item.href}
                  onClick={(e) => {
                    if (hasMegaMenu) {
                      handleNavClick(item.megaMenu, e);
                    }
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                    isActive || isMenuOpen
                      ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black border border-gold/40 font-bold"
                      : "text-black/70 hover:bg-white/60 hover:text-black"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive || isMenuOpen ? "text-gold" : "text-black/50"}`} />
                  <span className="flex-1">{item.label}</span>
                  {hasMegaMenu && (
                    <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${isMenuOpen ? "rotate-90 text-gold" : "text-black/30"}`} />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Utility Section */}
        <div className="px-3 py-2 border-t border-gold/20 space-y-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-black/70 hover:bg-white/60 hover:text-black transition-all w-full"
          >
            <Search className="w-4 h-4 text-black/50" />
            Search
          </button>
          <div className="flex items-center gap-1 px-1">
            <LanguageSwitcher variant="icon-only" />
            <CurrencySwitcher variant="icon-only" />
          </div>
          <Link
            to="/my-dashboard"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-black/70 hover:bg-white/60 hover:text-black transition-all"
          >
            <User className="w-4 h-4 text-black/50" />
            Dashboard
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-black/70 hover:bg-white/60 hover:text-black transition-all"
          >
            <Settings className="w-4 h-4 text-black/50" />
            Settings
          </Link>
        </div>

        {/* Bottom */}
        <div className="p-4 border-t border-gold/20 space-y-2">
          <a
            href="mailto:info@jbjglobal.com"
            className="flex items-center gap-2 text-sm font-bold text-gold hover:text-gold-dark transition-colors"
          >
            <Headphones className="w-4 h-4" />
            Contact Support
          </a>
          <a
            href="/support"
            className="text-xs text-black/60 hover:text-gold transition-colors block pl-6"
          >
            Raise a Support Ticket
          </a>
        </div>
      </div>

      {/* Mega Menu Panels */}
      {renderMegaMenu()}

      {/* Search Modal */}
      <GlobalSearchModal
        isOpen={searchOpen}
        initialQuery=""
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
