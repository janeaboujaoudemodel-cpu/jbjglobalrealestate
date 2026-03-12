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

  const divider = <div className="w-px h-6 bg-gold/20 flex-shrink-0" />;
  const totalAlerts = alerts?.totalAlerts || 0;

  // Determine if user has CRM access (owner or broker)
  const showCRM = !!user && isOwner;

  /* ─── Shared button classes for premium consistency ─── */
  const pillBtn = "h-8 flex items-center gap-1.5 rounded-lg border border-gold/30 hover:border-gold/50 bg-gold/5 hover:bg-gold/15 transition-all px-2.5 group whitespace-nowrap shrink-0";
  const iconBtn = "h-8 w-8 flex items-center justify-center rounded-lg border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all group shrink-0";
  const iconClass = "w-4 h-4 text-gold group-hover:scale-110 transition-transform shrink-0";
  const labelClass = "text-[11px] font-semibold text-black/55 uppercase tracking-wide hidden lg:inline whitespace-nowrap";

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 h-[48px] z-[9996] hidden lg:flex items-center gap-2.5 px-4 lg:px-5 border-b border-gold/15 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_1px_3px_hsl(var(--gold)/0.08)] overflow-x-auto overflow-y-hidden scrollbar-hide [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px]"
      >
        {/* ── Sidebar Toggle (Arrow only) — FIRST ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className={iconBtn}
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed
                ? <PanelLeftOpen className={iconClass} />
                : <PanelLeftClose className={iconClass} />
              }
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
            {sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          </TooltipContent>
        </Tooltip>

        {/* ── Back Button — SECOND ── */}
        <GlobalBackButton />

        {divider}

        {/* ── Search ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSearchOpen(true)}
              className={pillBtn}
              aria-label="Search ⌘K"
            >
              <Search className={iconClass} />
              <span className="text-[11px] text-black/40 font-medium hidden xl:inline">⌘K</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Search ⌘K</TooltipContent>
        </Tooltip>

        {divider}

        {/* ── Quick Nav: Buy / Rent / Sell ── */}
        <div className="flex items-center gap-0.5 shrink-0">
          <Link
            to="/properties?transaction=buy"
            className="h-8 flex items-center gap-1.5 rounded-lg hover:bg-gold/10 transition-all px-2.5 group whitespace-nowrap shrink-0"
          >
            <Building2 className="w-4 h-4 text-gold/70 group-hover:text-gold transition-colors shrink-0" />
            <span className="text-[11px] font-semibold text-black/60 group-hover:text-black/80 uppercase tracking-wide">Buy</span>
          </Link>
          <Link
            to="/properties?transaction=rent"
            className="h-8 flex items-center gap-1.5 rounded-lg hover:bg-gold/10 transition-all px-2.5 group whitespace-nowrap shrink-0"
          >
            <Key className="w-4 h-4 text-gold/70 group-hover:text-gold transition-colors shrink-0" />
            <span className="text-[11px] font-semibold text-black/60 group-hover:text-black/80 uppercase tracking-wide">Rent</span>
          </Link>
          <Link
            to="/listing-portal"
            className="h-8 flex items-center gap-1.5 rounded-lg border border-gold/20 hover:border-gold/40 hover:bg-gold/10 transition-all px-2.5 group whitespace-nowrap shrink-0"
          >
            <Tag className="w-4 h-4 text-gold group-hover:scale-105 transition-transform shrink-0" />
            <span className="text-[11px] font-bold text-gold uppercase tracking-wide">Sell</span>
          </Link>
        </div>

        {divider}

        {/* Favorites */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/favorites"
              className={iconBtn}
              aria-label="Favorites"
            >
              <Heart className={iconClass} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Favorites</TooltipContent>
        </Tooltip>

        {divider}

        {/* ── Area Unit Toggle — segmented block ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleAreaUnit}
              className="h-8 flex items-center rounded-lg border border-gold/30 overflow-hidden transition-all"
              aria-label="Toggle area unit"
            >
              <span className={`text-[11px] font-bold px-3 py-1.5 transition-all ${areaUnit === 'sqft' ? 'bg-gold/20 text-gold' : 'text-black/30 hover:bg-gold/5'}`}>
                ft²
              </span>
              <span className="w-px h-5 bg-gold/30" />
              <span className={`text-[11px] font-bold px-3 py-1.5 transition-all ${areaUnit === 'sqm' ? 'bg-gold/20 text-gold' : 'text-black/30 hover:bg-gold/5'}`}>
                m²
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
            {areaUnit === 'sqft' ? 'Square Feet — click to switch to m²' : 'Square Meters — click to switch to ft²'}
          </TooltipContent>
        </Tooltip>

        {divider}

        {/* ── Language ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div><LanguageSwitcher variant="icon-only" /></div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Select or change your language</TooltipContent>
        </Tooltip>

        {/* ── Currency ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div><CurrencySwitcher variant="icon-only" /></div>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Select your currency</TooltipContent>
        </Tooltip>

        {divider}

        {/* ── Advanced Filter — opens AdvancedFilterPanel dialog ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setFilterOpen(true)}
              className={pillBtn}
              aria-label="Advanced Property Filter"
            >
              <SlidersHorizontal className={iconClass} />
              <span className={labelClass}>Filter</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Open advanced filters</TooltipContent>
        </Tooltip>

        {/* ── Spacer ── */}
        <div className="flex-1" />

        {/* ── Right Side: User Shortcuts ── */}
        {user && (
          <>
            {/* CRM shortcut (owner/broker only) */}
            {showCRM && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/owner/crm"
                    className="h-8 flex items-center gap-1.5 rounded-lg hover:bg-emerald-500/10 transition-all px-2.5 group whitespace-nowrap shrink-0"
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide hidden xl:inline whitespace-nowrap">CRM</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">CRM Dashboard</TooltipContent>
              </Tooltip>
            )}

            {/* My Tasks */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                   to="/my-dashboard#tasks"
                   className="h-8 flex items-center gap-1.5 rounded-lg border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all px-2 group relative shrink-0 whitespace-nowrap"
                 >
                   <ClipboardList className={iconClass} />
                  <span className="text-[11px] font-medium text-black/50 hidden xl:inline whitespace-nowrap">Tasks</span>
                  {(alerts?.pendingTasks || 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {alerts!.pendingTasks > 9 ? '9+' : alerts!.pendingTasks}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Tasks</TooltipContent>
            </Tooltip>

            {/* Alerts / Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                   to="/my-dashboard#notifications"
                   className={`${iconBtn} relative`}
                 >
                   <Bell className={iconClass} />
                  {(alerts?.totalNotificationAlerts || 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                      {alerts!.totalNotificationAlerts > 9 ? '9+' : alerts!.totalNotificationAlerts}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
                Notifications{totalAlerts > 0 ? ` (${totalAlerts})` : ''}
              </TooltipContent>
            </Tooltip>

            {/* Inbox */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                   to="/my-dashboard#inbox"
                   className={iconBtn}
                 >
                   <Inbox className={iconClass} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Inbox</TooltipContent>
            </Tooltip>

            {divider}
          </>
        )}

        {/* Dashboard */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/my-dashboard"
              className={iconBtn}
              aria-label="Dashboard"
            >
              <LayoutDashboard className={iconClass} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Dashboard</TooltipContent>
        </Tooltip>

        {/* Account — opens Mode Selector via ModeSwitcher */}
        <ModeSwitcher variant="header" />

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              className={iconBtn}
              aria-label="Settings"
            >
              <Settings className={iconClass} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Settings & Profile</TooltipContent>
        </Tooltip>
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
