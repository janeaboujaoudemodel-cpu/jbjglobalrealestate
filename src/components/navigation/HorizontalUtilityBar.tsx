import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search, Heart, Settings, User, LayoutDashboard,
  Ruler, SlidersHorizontal, PanelLeftClose, PanelLeftOpen,
  Building2, Key, Tag, Bell, ClipboardList, Inbox, BarChart3,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { DisplayModeIconToggle } from "@/components/filters/DisplayModeToggle";
import { useUserMode, type UserMode } from "@/hooks/useUserMode";
import { useLanguage, getLanguageInfo } from "@/contexts/LanguageContext";
import { useCurrency } from "@/hooks/useCurrency";
import { useAuth } from "@/contexts/AuthContext";
import { useUserAlerts } from "@/hooks/useUserAlerts";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import type { DisplayMode } from "@/constants/filterConfig";

export default function HorizontalUtilityBar() {
  const [searchOpen, setSearchOpen] = useState(false);
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

  const handleModeChange = (newMode: DisplayMode) => {
    setMode(newMode as UserMode);
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

  const divider = <div className="w-px h-5 bg-gold/20 flex-shrink-0" />;
  const totalAlerts = alerts?.totalAlerts || 0;

  // Determine if user has CRM access (owner or broker)
  const showCRM = !!user && isOwner;

  return (
    <>
      <div
        className="fixed top-0 right-0 h-[40px] z-[9996] hidden lg:flex items-center gap-1 px-2 border-b border-gold/15 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_1px_3px_hsl(var(--gold)/0.08)] [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px]"
      >
        {/* ── Sidebar Toggle — flush left, premium gold pill ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleSidebar}
              className="h-7 flex items-center gap-1.5 rounded-md border border-gold/30 hover:border-gold/60 bg-gold/5 hover:bg-gold/15 transition-all px-2 group mr-1"
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed
                ? <PanelLeftOpen className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                : <PanelLeftClose className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
              }
              <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wider hidden xl:inline">
                {sidebarCollapsed ? 'Expand' : 'Minimize'}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
            {sidebarCollapsed ? 'Expand sidebar' : 'Minimize sidebar'}
          </TooltipContent>
        </Tooltip>

        {divider}

        {/* ── Search ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSearchOpen(true)}
              className="h-7 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group"
              aria-label="Search ⌘K"
            >
              <Search className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-black/40 font-medium hidden xl:inline">⌘K</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Search ⌘K</TooltipContent>
        </Tooltip>

        {divider}

        {/* ── Quick Nav: Buy / Rent / Sell ── */}
        <div className="flex items-center gap-0.5">
          <Link
            to="/properties?transaction=buy"
            className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-2 group"
          >
            <Building2 className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
            <span className="text-[11px] font-semibold text-black/60 group-hover:text-black/80 uppercase tracking-wide">Buy</span>
          </Link>
          <Link
            to="/properties?transaction=rent"
            className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-2 group"
          >
            <Key className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
            <span className="text-[11px] font-semibold text-black/60 group-hover:text-black/80 uppercase tracking-wide">Rent</span>
          </Link>
          <Link
            to="/listing-portal"
            className="h-7 flex items-center gap-1 rounded-md border border-gold/20 hover:border-gold/40 hover:bg-gold/10 transition-all px-2 group"
          >
            <Tag className="w-3.5 h-3.5 text-gold group-hover:scale-105 transition-transform" />
            <span className="text-[11px] font-bold text-gold uppercase tracking-wide">Sell</span>
          </Link>
        </div>

        {divider}

        {/* ── Favorites ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/favorites"
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gold/10 transition-all group"
              aria-label="Favorites"
            >
              <Heart className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Favorites</TooltipContent>
        </Tooltip>

        {divider}

        {/* ── Area Unit Toggle ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleAreaUnit}
              className="h-7 flex items-center rounded-md hover:bg-gold/10 transition-all px-1.5 gap-0.5"
              aria-label="Toggle area unit"
            >
              <Ruler className="w-3.5 h-3.5 text-gold/50" />
              <span className={`text-[10px] font-bold px-1 py-0.5 rounded transition-all ${areaUnit === 'sqft' ? 'bg-gold/20 text-gold' : 'text-black/30'}`}>
                ft²
              </span>
              <span className={`text-[10px] font-bold px-1 py-0.5 rounded transition-all ${areaUnit === 'sqm' ? 'bg-gold/20 text-gold' : 'text-black/30'}`}>
                m²
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">
            {areaUnit === 'sqft' ? 'Square Feet — click to switch' : 'Square Meters — click to switch'}
          </TooltipContent>
        </Tooltip>

        {divider}

        {/* ── Language ── */}
        <LanguageSwitcher variant="icon-only" />

        {/* ── Currency ── */}
        <CurrencySwitcher variant="icon-only" />

        {divider}

        {/* ── Advanced Filter ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/properties?advanced=true"
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gold/10 transition-all group border border-gold/20"
              aria-label="Advanced Filter"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Advanced Filter</TooltipContent>
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
                    className="h-7 flex items-center gap-1 rounded-md hover:bg-emerald-500/10 transition-all px-2 group"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide hidden xl:inline">CRM</span>
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
                  className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group relative"
                >
                  <ClipboardList className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                  <span className="text-[10px] font-medium text-black/50 hidden xl:inline">Tasks</span>
                  {(alerts?.pendingTasks || 0) > 0 && (
                    <span className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
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
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gold/10 transition-all group relative"
                >
                  <Bell className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                  {(alerts?.totalNotificationAlerts || 0) > 0 && (
                    <span className="absolute -top-1 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
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
                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gold/10 transition-all group"
                >
                  <Inbox className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Inbox</TooltipContent>
            </Tooltip>

            {divider}
          </>
        )}

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
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gold/10 transition-all group"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Dashboard</TooltipContent>
        </Tooltip>

        {/* Account */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              className="h-7 flex items-center gap-1.5 rounded-md border border-gold/20 hover:border-gold/40 hover:bg-gold/10 transition-all px-2 group"
              aria-label="My Account"
            >
              <User className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-semibold text-black/60 hidden xl:inline">Account</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Account</TooltipContent>
        </Tooltip>

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/profile"
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gold/10 transition-all group"
              aria-label="Settings"
            >
              <Settings className="w-3.5 h-3.5 text-gold/60 group-hover:text-gold transition-colors" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Settings & Profile</TooltipContent>
        </Tooltip>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
    </>
  );
}