import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Heart, Settings, LayoutDashboard,
  Ruler, SlidersHorizontal, PanelLeftClose, PanelLeftOpen,
  Building2, Key, Tag, Bell, ClipboardList, Inbox, BarChart3,
  Shield, MapPin, Users, Sparkles, BookOpen, UserCircle,
  Crown, Headphones, FileUser, MessageSquare, SmilePlus,
} from "lucide-react";
import ModeSwitcher from "@/components/ModeSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";

import { useUserMode, type UserMode } from "@/hooks/useUserMode";
import { useLanguage, getLanguageInfo } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAlerts } from "@/hooks/useUserAlerts";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import GlobalBackButton from "@/components/navigation/GlobalBackButton";
import AdvancedFilterPanel from "@/components/filters/AdvancedFilterPanel";
import { defaultShortcutFilters, type ShortcutFilterState } from "@/components/filters/FilterShortcutBar";


export default function HorizontalUtilityBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterState, setFilterState] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { mode, setMode } = useUserMode();
  const { language } = useLanguage();
  const currentLang = getLanguageInfo(language);
  const { currency } = useCurrency();
  const { user, isOwner } = useAuth();
  const { data: alerts } = useUserAlerts();
  const navigate = useNavigate();

  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jj_area_unit') as 'sqft' | 'sqm') || 'sqft';
    }
    return 'sqft';
  });

  // Listen for sidebar state
  useEffect(() => {
    const checkCollapsed = () => {
      setSidebarCollapsed(document.body.classList.contains('jj-vertical-nav-collapsed'));
    };
    checkCollapsed();
    window.addEventListener('jj_nav_toggle', checkCollapsed);
    return () => window.removeEventListener('jj_nav_toggle', checkCollapsed);
  }, []);

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
    window.dispatchEvent(new CustomEvent('jj_nav_toggle'));
  };

  // When filters are applied from the panel, navigate to properties with those filters
  const handleFilterChange = (newFilters: ShortcutFilterState) => {
    setFilterState(newFilters);
    // Build query params from filters and navigate
    const params = new URLSearchParams();
    if (newFilters.searchQuery) params.set('q', newFilters.searchQuery);
    if (newFilters.propertyTypes?.length) params.set('type', newFilters.propertyTypes.join(','));
    if (newFilters.emirates?.length) params.set('emirate', newFilters.emirates.join(','));
    navigate(`/properties?${params.toString()}`);
  };

  const totalAlerts = alerts?.totalAlerts || 0;

  // Determine if user has CRM access (owner or broker)
  const showCRM = !!user && isOwner;

  /* ─── Shared styles for connected segmented cells ─── */
  const cellBase = "h-8 flex items-center gap-1.5 transition-all px-2.5 group whitespace-nowrap shrink-0 outline-none focus:outline-none focus-visible:outline-none [&:focus]:outline-none";
  const cellHover = "hover:bg-transparent";
  const iconClass = "w-4 h-4 text-black/50 group-hover:text-black/70 group-hover:scale-110 transition-transform shrink-0";
  const labelClass = "text-[11px] font-semibold text-black/50 uppercase tracking-wide hidden xl:inline whitespace-nowrap";
  
  /* Vertical divider inside rail — full height, gold */
  const railDivider = <div className="w-px h-full bg-[hsl(var(--gold)/0.3)] shrink-0" />;

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-[48px] z-[9998] flex items-center gap-2 px-2 sm:px-4 xl:px-5 pr-2 sm:pr-3 xl:pr-4 border-b border-[hsl(var(--gold)/0.2)] bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] shadow-[0_1px_3px_hsl(var(--gold)/0.12)] overflow-x-auto overflow-y-visible scrollbar-hide [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px]"
      >

        {/* ── Connected Segmented Rail — all controls in one block ── */}
        <div className="flex items-center h-8 shrink-0">
          
          {/* Back Button */}
          <div className={`${cellBase} ${cellHover} px-1`}>
            <GlobalBackButton />
          </div>

          {railDivider}

          {/* Search */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSearchOpen(true)}
                className={`${cellBase} ${cellHover}`}
                aria-label="Search ⌘K"
              >
                <Search className="w-4 h-4 text-[hsl(var(--gold))] group-hover:text-[hsl(var(--gold))] group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-[11px] text-[hsl(var(--foreground)/0.4)] font-medium hidden xl:inline">⌘K</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Search ⌘K</TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Buy / Rent / Sell */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/properties?transaction=buy"
                className={`${cellBase} ${cellHover}`}
              >
                <Building2 className="w-4 h-4 text-[hsl(var(--gold)/0.7)] group-hover:text-[hsl(var(--gold))] transition-colors shrink-0" />
                <span className="text-[11px] font-semibold text-black/60 group-hover:text-black/80 uppercase tracking-wide">Buy</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-[hsl(var(--gold))] text-xs z-[10100]">Explore properties for sale</TooltipContent>
          </Tooltip>

          {railDivider}

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/properties?transaction=rent"
                className={`${cellBase} ${cellHover}`}
              >
                <Key className="w-4 h-4 text-[hsl(var(--gold)/0.7)] group-hover:text-[hsl(var(--gold))] transition-colors shrink-0" />
                <span className="text-[11px] font-semibold text-black/60 group-hover:text-black/80 uppercase tracking-wide">Rent</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-[hsl(var(--gold))] text-xs z-[10100]">Rent a property</TooltipContent>
          </Tooltip>

          {railDivider}

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/listing-portal"
                className={`${cellBase} ${cellHover}`}
              >
                <Tag className="w-4 h-4 text-[hsl(var(--gold)/0.7)] group-hover:text-[hsl(var(--gold))] transition-colors shrink-0" />
                <span className="text-[11px] font-semibold text-black/60 group-hover:text-black/80 uppercase tracking-wide">Sell</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-[hsl(var(--gold))] text-xs z-[10100]">List your property for sale or rent</TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Favorites */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/favorites"
                className={`${cellBase} ${cellHover} px-2`}
                aria-label="Favorites"
              >
                <Heart className="w-4 h-4 text-red-500 group-hover:text-red-600 group-hover:scale-110 transition-transform shrink-0" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Favorite Properties</TooltipContent>
          </Tooltip>

          {railDivider}

           {/* Area Unit Toggle — connected field box, gold themed */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleAreaUnit}
                className="h-8 flex items-center transition-all shrink-0 border border-[hsl(var(--gold)/0.3)] rounded-none overflow-hidden outline-none focus:outline-none focus-visible:outline-none"
                aria-label="Toggle area unit"
              >
                <span className={`text-[11px] font-bold px-3 py-1.5 transition-all ${areaUnit === 'sqft' ? 'bg-[hsl(var(--gold)/0.18)] text-[hsl(var(--gold))]' : 'text-black/30 hover:text-black/50'}`}>
                  ft²
                </span>
                <span className="w-px h-full bg-[hsl(var(--gold)/0.3)]" />
                <span className={`text-[11px] font-bold px-3 py-1.5 transition-all ${areaUnit === 'sqm' ? 'bg-[hsl(var(--gold)/0.18)] text-[hsl(var(--gold))]' : 'text-black/30 hover:text-black/50'}`}>
                  m²
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
              {areaUnit === 'sqft' ? 'Square Feet — click to switch to m²' : 'Square Meters — click to switch to ft²'}
            </TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Language */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${cellBase} ${cellHover} px-1.5`}><LanguageSwitcher variant="icon-only" /></div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-[hsl(var(--gold))] text-xs z-[10100]">Select your language</TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Currency */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${cellBase} ${cellHover} px-1.5`}><CurrencySwitcher variant="icon-only" /></div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-[hsl(var(--gold))] text-xs z-[10100]">Select your currency</TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Filter */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFilterOpen(true)}
                className={`${cellBase} ${cellHover}`}
                aria-label="Advanced Property Filter"
              >
                <SlidersHorizontal className={iconClass} />
                <span className={labelClass}>Filter</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Open advanced filters</TooltipContent>
          </Tooltip>
        </div>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Right Side: Connected rail for user shortcuts ── */}
        <div className="flex items-center h-8 shrink-0">
          {user && (
            <>
              {/* CRM shortcut (owner/broker only) */}
              {showCRM && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        to="/owner/crm"
                        className={`${cellBase} hover:bg-emerald-500/10`}
                      >
                        <BarChart3 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                        <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide hidden xl:inline whitespace-nowrap">CRM</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">CRM Dashboard</TooltipContent>
                  </Tooltip>
                  {railDivider}
                </>
              )}

              {/* My Tasks */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                     to="/my-dashboard#tasks"
                     className={`${cellBase} ${cellHover} relative`}
                   >
                     <ClipboardList className={iconClass} />
                    <span className="text-[11px] font-medium text-[hsl(var(--foreground)/0.5)] hidden xl:inline whitespace-nowrap">Tasks</span>
                    {(alerts?.pendingTasks || 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-1">
                        {alerts!.pendingTasks > 9 ? '9+' : alerts!.pendingTasks}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Tasks</TooltipContent>
              </Tooltip>

              {railDivider}

              {/* Alerts / Notifications */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                     to="/my-dashboard#notifications"
                     className={`${cellBase} ${cellHover} px-2 relative`}
                   >
                     <Bell className={iconClass} />
                    {(alerts?.totalNotificationAlerts || 0) > 0 && (
                      <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-1">
                        {alerts!.totalNotificationAlerts > 9 ? '9+' : alerts!.totalNotificationAlerts}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
                  Notifications{totalAlerts > 0 ? ` (${totalAlerts})` : ''}
                </TooltipContent>
              </Tooltip>

              {railDivider}

              {/* Inbox */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                     to="/my-dashboard#inbox"
                     className={`${cellBase} ${cellHover} px-2`}
                   >
                     <Inbox className={iconClass} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Inbox</TooltipContent>
              </Tooltip>

              {railDivider}
            </>
          )}

          {/* Dashboard */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/my-dashboard"
                className={`${cellBase} ${cellHover} px-2`}
                aria-label="Dashboard"
              >
                <LayoutDashboard className={iconClass} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Dashboard</TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Account — opens Mode Selector via ModeSwitcher */}
          <div className={`${cellBase} ${cellHover} px-1`}>
            <ModeSwitcher variant="header" />
          </div>

          {railDivider}

          {/* Settings — with extra gap from Mode */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/profile"
                className={`${cellBase} ${cellHover} px-3`}
                aria-label="Settings"
              >
                <Settings className={iconClass} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Settings & Profile</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />

      {/* Advanced Filter Panel — same dialog used in hero/properties */}
      <AdvancedFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filterState}
        onFilterChange={handleFilterChange}
      />
    </>
  );
}
