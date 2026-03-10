import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search, Heart, Settings, User, LayoutDashboard,
  ChevronUp, ChevronDown, Ruler, FileSearch,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { DisplayModeIconToggle } from "@/components/filters/DisplayModeToggle";
import { useUserMode, type UserMode } from "@/hooks/useUserMode";
import { useLanguage, getLanguageInfo } from "@/contexts/LanguageContext";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import type { DisplayMode } from "@/constants/filterConfig";

export default function HorizontalUtilityBar() {
  const [minimized, setMinimized] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { mode, setMode } = useUserMode();
  const { language } = useLanguage();
  const currentLang = getLanguageInfo(language);

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

  const divider = <div className="w-px h-5 bg-gold/25 flex-shrink-0" />;

  if (minimized) {
    return (
      <>
        <div
          className="fixed top-0 right-0 h-[28px] z-[9996] hidden lg:flex items-center justify-end pr-2 border-b border-gold/15 bg-gradient-to-r from-[#F5F0E6] to-[#EDE4D3] [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px]"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setMinimized(false)}
                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gold/15 transition-all"
                aria-label="Expand toolbar"
              >
                <ChevronDown className="w-3 h-3 text-gold" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Expand toolbar</TooltipContent>
          </Tooltip>
        </div>
        <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div
        className="fixed top-0 right-0 h-[40px] z-[9996] hidden lg:flex items-center gap-1.5 px-3 border-b border-gold/20 bg-gradient-to-r from-[#F5F0E6] to-[#EDE4D3] [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px]"
      >
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
          <TooltipContent side="bottom" className="text-xs">Search ⌘K</TooltipContent>
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
          <TooltipContent side="bottom" className="text-xs">Favorites</TooltipContent>
        </Tooltip>

        {divider}

        {/* Area Unit Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleAreaUnit}
              className="h-8 flex items-center rounded-lg hover:bg-gold/15 transition-all px-1.5 gap-1"
              aria-label="Toggle area unit"
            >
              <Ruler className="w-3.5 h-3.5 text-gold/60" />
              <span className={`text-[10px] font-bold px-1 py-0.5 rounded transition-all ${areaUnit === 'sqft' ? 'bg-gold/20 text-gold' : 'text-black/40'}`}>
                ft²
              </span>
              <span className={`text-[10px] font-bold px-1 py-0.5 rounded transition-all ${areaUnit === 'sqm' ? 'bg-gold/20 text-gold' : 'text-black/40'}`}>
                m²
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {areaUnit === 'sqft' ? 'Square Feet' : 'Square Meters'}
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
          <TooltipContent side="bottom" className="text-xs">
            {currentLang.flag} {currentLang.nativeName}
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
          <TooltipContent side="bottom" className="text-xs">Currency</TooltipContent>
        </Tooltip>

        {/* Gold separator */}
        <div className="w-px h-6 bg-gold/40 mx-1 flex-shrink-0" />

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
          <TooltipContent side="bottom" className="text-xs">My Dashboard</TooltipContent>
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
          <TooltipContent side="bottom" className="text-xs">My Account</TooltipContent>
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
          <TooltipContent side="bottom" className="text-xs">Settings</TooltipContent>
        </Tooltip>

        {divider}

        {/* Advanced Search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/properties"
              className="h-7 flex items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-bold text-gold hover:bg-gold/15 transition-all border border-gold/25"
              aria-label="Advanced Search"
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Advanced</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Advanced Search</TooltipContent>
        </Tooltip>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Minimize */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setMinimized(true)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gold/15 transition-all"
              aria-label="Minimize toolbar"
            >
              <ChevronUp className="w-3.5 h-3.5 text-gold" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Minimize</TooltipContent>
        </Tooltip>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
    </>
  );
}