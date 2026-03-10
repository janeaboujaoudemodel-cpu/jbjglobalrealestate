import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search, Heart, Settings, User, LayoutDashboard,
  Ruler, SlidersHorizontal, Menu,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { DisplayModeIconToggle } from "@/components/filters/DisplayModeToggle";
import { useUserMode, type UserMode } from "@/hooks/useUserMode";
import { useLanguage, getLanguageInfo } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import type { DisplayMode } from "@/constants/filterConfig";

export default function HorizontalUtilityBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { mode, setMode } = useUserMode();
  const { language } = useLanguage();
  const currentLang = getLanguageInfo(language);
  const { currency } = useCurrency();

  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jj_area_unit') as 'sqft' | 'sqm') || 'sqft';
    }
    return 'sqft';
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'sqft' || detail === 'sqm') setAreaUnit(detail);
    };
    window.addEventListener('areaUnitChange', handler);
    return () => window.removeEventListener('areaUnitChange', handler);
  }, []);

  const toggleAreaUnit = () => {
    const next = areaUnit === 'sqft' ? 'sqm' : 'sqft';
    setAreaUnit(next);
    localStorage.setItem('jj_area_unit', next);
    window.dispatchEvent(new CustomEvent('areaUnitChange', { detail: next }));
  };

  const handleModeChange = (newMode: DisplayMode) => {
    setMode(newMode as UserMode);
  };

  // Toggle sidebar collapse from horizontal bar
  const toggleSidebar = () => {
    const isCollapsed = document.body.classList.contains('jj-vertical-nav-collapsed');
    if (isCollapsed) {
      localStorage.setItem('jj_nav_collapsed', '0');
      document.body.classList.remove('jj-vertical-nav-collapsed');
      document.body.classList.add('jj-vertical-nav-active');
    } else {
      localStorage.setItem('jj_nav_collapsed', '1');
      document.body.classList.remove('jj-vertical-nav-active');
      document.body.classList.add('jj-vertical-nav-collapsed');
    }
    // Dispatch event so GlobalVerticalNav reacts
    window.dispatchEvent(new CustomEvent('jj_nav_toggle'));
  };

  const divider = <div className="w-px h-5 bg-gold/25 flex-shrink-0" />;

  return (
    <>
      <div
        className="fixed top-0 right-0 h-[40px] z-[9996] hidden lg:flex items-center gap-1.5 px-3 border-b border-gold/20 bg-gradient-to-r from-[#F5F0E6] to-[#EDE4D3] [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px]"
      >
        {/* Sidebar Toggle — prominent minimizer */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-gold/40 hover:bg-gold/15 hover:border-gold/60 transition-all group bg-gold/5"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gold group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Minimize / expand sidebar</TooltipContent>
        </Tooltip>

        {divider}

        {/* Search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/15 transition-all group"
              aria-label="Search ⌘K"
            >
              <Search className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Search ⌘K</TooltipContent>
        </Tooltip>

        {divider}

        {/* Favorites */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/favorites"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/15 transition-all group"
              aria-label="Favorites"
            >
              <Heart className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Favorites</TooltipContent>
        </Tooltip>

        {divider}

        {/* Area Unit Toggle — larger */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleAreaUnit}
              className="h-8 flex items-center rounded-lg hover:bg-gold/15 transition-all px-2 gap-1"
              aria-label="Toggle area unit"
            >
              <Ruler className="w-4 h-4 text-gold/60" />
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-all ${areaUnit === 'sqft' ? 'bg-gold/20 text-gold' : 'text-black/40'}`}>
                ft²
              </span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded transition-all ${areaUnit === 'sqm' ? 'bg-gold/20 text-gold' : 'text-black/40'}`}>
                m²
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
            {areaUnit === 'sqft' ? 'Square Feet (active) — click to switch' : 'Square Meters (active) — click to switch'}
          </TooltipContent>
        </Tooltip>

        {divider}

        {/* Language */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <LanguageSwitcher variant="icon-only" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
            Select your language. Current: {currentLang.flag} {currentLang.nativeName}
          </TooltipContent>
        </Tooltip>

        {divider}

        {/* Currency */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <CurrencySwitcher variant="icon-only" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
            Select your currency. Current: {currency}
          </TooltipContent>
        </Tooltip>

        {/* Gold separator */}
        <div className="w-px h-6 bg-gold/40 mx-1 flex-shrink-0" />

        {/* Advanced Search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/properties"
              className="h-7 flex items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-gold hover:bg-gold/15 transition-all border border-gold/25"
              aria-label="Advanced Filter Search"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Advanced Filter Search</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100] max-w-[220px] text-center">
            Open full-screen advanced search with filters for property type, price, area, and more
          </TooltipContent>
        </Tooltip>

        {/* Spacer pushes right-side items to edge */}
        <div className="flex-1" />

        {/* Mode Selector */}
        <DisplayModeIconToggle
          value={mode === 'investor_broker' ? 'investor' : mode as DisplayMode}
          onChange={handleModeChange}
          variant="light"
        />

        {divider}

        {/* Dashboard */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/my-dashboard"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/15 transition-all group"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Dashboard</TooltipContent>
        </Tooltip>

        {/* Account */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/15 transition-all group"
              aria-label="My Account"
            >
              <User className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Account</TooltipContent>
        </Tooltip>

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold/15 transition-all group"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Settings & Profile</TooltipContent>
        </Tooltip>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
    </>
  );
}
