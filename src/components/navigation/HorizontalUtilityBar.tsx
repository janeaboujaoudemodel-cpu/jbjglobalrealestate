import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Search, Heart, Settings, LayoutDashboard,
  Ruler, SlidersHorizontal, PanelLeftClose, PanelLeftOpen,
  Building2, Key, Tag, Bell, ClipboardList, Inbox, BarChart3,
  Shield, MapPin, Users, Sparkles, BookOpen, UserCircle,
  Crown, Headphones, FileUser, MessageSquare, SmilePlus,
  ChevronLeft, ChevronRight,
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
import FilterShortcutBar, { defaultShortcutFilters, type ShortcutFilterState } from "@/components/filters/FilterShortcutBar";


/** Encode filter state into URLSearchParams */
function encodeFiltersToURL(f: ShortcutFilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.searchQuery) p.set("q", f.searchQuery);
  if (f.priceMin) p.set("priceMin", f.priceMin);
  if (f.priceMax) p.set("priceMax", f.priceMax);
  if (f.bedrooms.length) p.set("bedrooms", f.bedrooms.join(","));
  if (f.emirates.length) p.set("emirates", f.emirates.join(","));
  if (f.areas.length) p.set("areas", f.areas.join(","));
  if (f.developers.length) p.set("developers", f.developers.join(","));
  if (f.propertyTypes.length) p.set("propertyTypes", f.propertyTypes.join(","));
  if (f.statuses.length) p.set("statuses", f.statuses.join(","));
  if (f.constructionStatuses.length) p.set("constructionStatuses", f.constructionStatuses.join(","));
  if (f.sortBy) p.set("sortBy", f.sortBy);
  if (f.hideSoldOut) p.set("hideSoldOut", "1");
  if (f.sizeMin) p.set("sizeMin", f.sizeMin);
  if (f.sizeMax) p.set("sizeMax", f.sizeMax);
  if (f.views.length) p.set("views", f.views.join(","));
  if (f.propertyCategory) p.set("category", f.propertyCategory);
  return p;
}

/** Decode URLSearchParams into ShortcutFilterState */
function decodeFiltersFromURL(p: URLSearchParams): ShortcutFilterState {
  return {
    ...defaultShortcutFilters,
    searchQuery: p.get("q") || p.get("keyword") || p.get("search") || "",
    priceMin: p.get("priceMin") || "",
    priceMax: p.get("priceMax") || "",
    bedrooms: p.get("bedrooms")?.split(",").filter(Boolean) || [],
    emirates: p.get("emirates")?.split(",").filter(Boolean) || (p.get("emirate") ? [p.get("emirate")!] : []),
    areas: p.get("areas")?.split(",").filter(Boolean) || (p.get("area") ? [p.get("area")!.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())] : []),
    developers: p.get("developers")?.split(",").filter(Boolean) || [],
    propertyTypes: p.get("propertyTypes")?.split(",").filter(Boolean) || [],
    statuses: p.get("statuses")?.split(",").filter(Boolean) || (p.get("status") ? [p.get("status")!] : []),
    constructionStatuses: p.get("constructionStatuses")?.split(",").filter(Boolean) || [],
    sortBy: (p.get("sortBy") as ShortcutFilterState["sortBy"]) || null,
    hideSoldOut: p.get("hideSoldOut") === "1",
    sizeMin: p.get("sizeMin") || "",
    sizeMax: p.get("sizeMax") || "",
    views: p.get("views")?.split(",").filter(Boolean) || [],
    propertyCategory: (p.get("category") as "residential" | "commercial") || null,
  };
}

function ScrollArrow({ direction, scrollRef }: { direction: 'left' | 'right'; scrollRef: React.RefObject<HTMLDivElement | null> }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      if (direction === 'left') setShow(el.scrollLeft > 4);
      else setShow(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => { el.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
  }, [scrollRef, direction]);
  if (!show) return null;
  return (
    <button
      onClick={() => scrollRef.current?.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' })}
      className={`absolute ${direction === 'left' ? 'left-0' : 'right-0'} z-10 w-7 h-7 rounded-full bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border border-[hsl(var(--gold)/0.5)] flex items-center justify-center shadow-sm hover:border-[hsl(var(--gold))] transition-all`}
      aria-label={`Scroll ${direction}`}
    >
      {direction === 'left' ? <ChevronLeft className="w-3.5 h-3.5 text-[hsl(var(--gold))]" /> : <ChevronRight className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />}
    </button>
  );
}

export default function HorizontalUtilityBar() {
  const row1ScrollRef = useRef<HTMLDivElement>(null);
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

  // When filters are applied from the panel, navigate to properties with ALL filter params
  const handleFilterChange = (newFilters: ShortcutFilterState) => {
    setFilterState(newFilters);
    const p = new URLSearchParams();
    if (newFilters.searchQuery) p.set('q', newFilters.searchQuery);
    if (newFilters.priceMin) p.set('priceMin', newFilters.priceMin);
    if (newFilters.priceMax) p.set('priceMax', newFilters.priceMax);
    if (newFilters.bedrooms.length) p.set('bedrooms', newFilters.bedrooms.join(','));
    if (newFilters.emirates.length) p.set('emirates', newFilters.emirates.join(','));
    if (newFilters.areas.length) p.set('areas', newFilters.areas.join(','));
    if (newFilters.developers.length) p.set('developers', newFilters.developers.join(','));
    if (newFilters.propertyTypes.length) p.set('propertyTypes', newFilters.propertyTypes.join(','));
    if (newFilters.statuses.length) p.set('statuses', newFilters.statuses.join(','));
    if (newFilters.constructionStatuses.length) p.set('constructionStatuses', newFilters.constructionStatuses.join(','));
    if (newFilters.sortBy) p.set('sortBy', newFilters.sortBy);
    if (newFilters.hideSoldOut) p.set('hideSoldOut', '1');
    if (newFilters.sizeMin) p.set('sizeMin', newFilters.sizeMin);
    if (newFilters.sizeMax) p.set('sizeMax', newFilters.sizeMax);
    if (newFilters.views.length) p.set('views', newFilters.views.join(','));
    if (newFilters.propertyCategory) p.set('category', newFilters.propertyCategory);
    const qs = p.toString();
    navigate(`/properties${qs ? `?${qs}` : ''}`);
  };

  

  // Show CRM shortcut only for users with relevant roles
  const showCRM = !!user && (isOwner || mode === 'broker' || mode === 'investor_broker');

  /* ─── Shared styles for connected segmented cells ─── */
  const cellBase = "h-8 flex items-center gap-1.5 transition-all px-2.5 group whitespace-nowrap shrink-0 outline-none focus:outline-none focus-visible:outline-none [&:focus]:outline-none";
  const cellHover = "hover:bg-transparent";
  const iconClass = "w-4 h-4 text-[hsl(var(--gold))] group-hover:text-[hsl(var(--gold))] group-hover:scale-110 transition-transform shrink-0";
  const labelClass = "text-[11px] font-semibold text-black/50 uppercase tracking-wide hidden xl:inline whitespace-nowrap";
  
  /* Vertical divider inside rail — full height, gold */
  const railDivider = <div className="w-px h-full bg-[hsl(var(--gold)/0.3)] shrink-0" />;

  const toggleSidebarFromHeader = () => {
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

  // ── Filter bar state (merged from GlobalFilterBar) ──
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isPropertyPage =
    location.pathname === "/properties" ||
    location.pathname === "/properties-reelly" ||
    location.pathname.startsWith("/developer/");

  const [globalFilters, setGlobalFilters] = useState<ShortcutFilterState>(() =>
    isPropertyPage ? decodeFiltersFromURL(searchParams) : defaultShortcutFilters
  );

  useEffect(() => {
    if (isPropertyPage) {
      setGlobalFilters(decodeFiltersFromURL(searchParams));
    } else {
      setGlobalFilters(defaultShortcutFilters);
    }
  }, [location.pathname]);

  const handleGlobalFilterChange = useCallback(
    (next: ShortcutFilterState) => {
      setGlobalFilters(next);
      window.dispatchEvent(new CustomEvent("globalFilterChange", { detail: next }));
      if (!isPropertyPage) {
        const p = encodeFiltersToURL(next);
        const qs = p.toString();
        navigate(`/properties${qs ? `?${qs}` : ""}`);
      }
    },
    [isPropertyPage, navigate]
  );

  return (
    <>
      <div
        className={`fixed top-0 right-0 h-[88px] z-[9998] flex flex-col border-b border-[hsl(var(--gold)/0.2)] shadow-[0_1px_3px_hsl(var(--gold)/0.12)] bg-gradient-to-r from-[#E8DCC8] via-[#DCCFB5] to-[#D4C4A8] transition-all duration-300 [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px] left-[200px]`}
      >
        {/* ── ROW 1 (48px): Navigation controls ── */}
        <div className="h-[48px] flex items-center shrink-0 relative">
          {/* Left scroll arrow */}
          <ScrollArrow direction="left" scrollRef={row1ScrollRef} />
          <div
            ref={row1ScrollRef}
            className="flex-1 min-w-0 h-full flex items-center gap-2 px-3 sm:px-5 xl:px-6 pr-2 sm:pr-3 xl:pr-4 overflow-x-auto overflow-y-visible scrollbar-hide"
            style={{ overscrollBehaviorX: 'contain', touchAction: 'pan-x' }}
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Search properties, developers, areas, and more (⌘K)</TooltipContent>
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Browse off-plan and ready properties for sale in the UAE</TooltipContent>
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Browse properties available for rent across the UAE</TooltipContent>
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">List your property for sale or rent on JBJ Global</TooltipContent>
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">View your saved and shortlisted properties</TooltipContent>
          </Tooltip>

          {railDivider}

           {/* Area Unit Toggle — connected field box, gold themed */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleAreaUnit}
                className="h-8 flex items-center transition-all shrink-0 border border-[hsl(var(--gold)/0.3)] rounded-lg overflow-hidden outline-none focus:outline-none focus-visible:outline-none"
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">
              Toggle between Square Feet and Square Meters for property sizes
            </TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Language */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${cellBase} ${cellHover} px-1.5`}><LanguageSwitcher variant="icon-only" /></div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Select your preferred language for the platform</TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Currency */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${cellBase} ${cellHover} px-1.5`}><CurrencySwitcher variant="icon-only" /></div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Select your preferred currency for property prices</TooltipContent>
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Open advanced property filters — price, bedrooms, type, handover, and more</TooltipContent>
          </Tooltip>
        </div>
        </div>
          {/* Right scroll arrow */}
          <ScrollArrow direction="right" scrollRef={row1ScrollRef} />

          {/* ── Right Side: Fixed rail for user shortcuts (always visible) ── */}
          <div className="flex items-center h-8 shrink-0 ml-auto border-l border-[hsl(var(--gold)/0.25)] pl-1 mr-2">
          {/* CRM shortcut (owner/broker only) — independent gate since showCRM already checks user */}
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
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Access your Customer Relationship Management dashboard</TooltipContent>
              </Tooltip>
              {railDivider}
            </>
          )}

          {user && (
            <>
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
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">View and manage your pending action items</TooltipContent>
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
                        {alerts!.totalNotificationAlerts}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">{`View your unread notifications and updates${(alerts?.totalNotificationAlerts || 0) > 0 ? ` (${alerts!.totalNotificationAlerts})` : ''}`}</TooltipContent>
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
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Open your direct messages and correspondence</TooltipContent>
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Access your personalized dashboard with analytics and activity</TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Account — opens Mode Selector via ModeSwitcher */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`${cellBase} ${cellHover} px-1`}>
                <ModeSwitcher variant="header" showForUnselected />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Select your mode based on your role</TooltipContent>
          </Tooltip>

          {railDivider}

          {/* Settings */}
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
            <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Manage your account, profile, and preferences</TooltipContent>
          </Tooltip>
        </div>
        </div>

        {/* ── Subtle gold divider between rows ── */}
        <div className="h-px mx-4 bg-gradient-to-r from-transparent via-gold/20 to-transparent shrink-0" />

        {/* ── ROW 2 (40px): Filter Shortcut Bar — shown on ALL pages including /map ── */}
        <div className="h-[40px] shrink-0 px-3 flex items-center">
          <FilterShortcutBar
            variant="light"
            filters={globalFilters}
            onFilterChange={handleGlobalFilterChange}
            resultsLabel="Properties"
          />
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
