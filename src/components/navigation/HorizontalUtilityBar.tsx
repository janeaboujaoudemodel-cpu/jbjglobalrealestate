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
        className="fixed top-0 right-0 h-[48px] z-[9996] hidden md:flex items-center gap-1.5 px-3 border-b border-gold/15 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] shadow-[0_1px_3px_hsl(var(--gold)/0.08)] [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px]"
      >
        {/* ── Back Button ── */}
        <GlobalBackButton />

        {divider}

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

        {/* ── Contextual Shortcuts (visible only when sidebar collapsed) ── */}
        {sidebarCollapsed && (
          <div className="flex items-center gap-0.5 border-l border-gold/20 pl-1.5 ml-0.5">
            {isOwner ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/owner/crm" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <Users className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">CRM</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">CRM Dashboard</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/owner/admin" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <Shield className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Admin</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Admin Panel</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/owner/listing-admin" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <ClipboardList className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Listings</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Listing Admin</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/founder-assistant" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <UserCircle className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Assistant</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Founder Assistant</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/owner/command-center" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <Crown className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Command</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Owner Command Center</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/owner/hr-hub" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <FileUser className="w-4 h-4 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">HR</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">HR Hub</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/owner/cv-center" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <FileUser className="w-4 h-4 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">CV</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">CV Center</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/owner/crm?tab=inquiries" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <MessageSquare className="w-4 h-4 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Inquiries</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Inquiries & Messages</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/owner/customer-happiness" className="h-8 flex items-center gap-1.5 rounded-md hover:bg-gold/10 transition-all px-2 group">
                      <SmilePlus className="w-4 h-4 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[11px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Happiness</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Customer Happiness Center</TooltipContent>
                </Tooltip>
              </>
            ) : user ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/my-dashboard" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <LayoutDashboard className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Dashboard</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">My Dashboard</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/properties" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <Building2 className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Properties</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Properties</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/areas" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <MapPin className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Areas</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Areas</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/developers" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <Sparkles className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Developers</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Developers</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/listing-portal" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <Tag className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">List</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Listing Portal</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/guides/legal" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <BookOpen className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Guides</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Guides</TooltipContent>
                </Tooltip>
              </>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/properties" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <Building2 className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Properties</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Properties</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/areas" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <MapPin className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Areas</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Areas</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/developers" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <Sparkles className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Developers</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Developers</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/guides/legal" className="h-7 flex items-center gap-1 rounded-md hover:bg-gold/10 transition-all px-1.5 group">
                      <BookOpen className="w-3.5 h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                      <span className="text-[10px] font-semibold text-black/60 uppercase tracking-wide hidden xl:inline">Guides</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Guides</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/favorites"
              className="h-7 w-7 flex items-center justify-center rounded-md border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all group"
              aria-label="Favorites"
            >
              <Heart className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
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

        {/* ── Advanced Filter — opens filter on properties page ── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate('/properties?advanced=true')}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-gold/10 transition-all group border border-gold/20"
              aria-label="Advanced Property Filter"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Advanced Property Filter</TooltipContent>
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
                   className="h-7 flex items-center gap-1 rounded-md border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all px-1.5 group relative"
                 >
                   <ClipboardList className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
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
                   className="h-7 w-7 flex items-center justify-center rounded-md border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all group relative"
                 >
                   <Bell className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
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
                   className="h-7 w-7 flex items-center justify-center rounded-md border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all group"
                 >
                   <Inbox className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Inbox</TooltipContent>
            </Tooltip>

            {divider}
          </>
        )}

        {/* Mode Selector — handled by ModeSwitcher below */}

        {/* Dashboard */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/my-dashboard"
              className="h-7 w-7 flex items-center justify-center rounded-md border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all group"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
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
              className="h-7 w-7 flex items-center justify-center rounded-md border border-gold/20 bg-gold/5 hover:bg-gold/15 hover:border-gold/40 transition-all group"
              aria-label="Settings"
            >
              <Settings className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="text-xs z-[10100]">Settings & Profile</TooltipContent>
        </Tooltip>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
    </>
  );
}