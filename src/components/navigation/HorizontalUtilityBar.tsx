import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Search, Heart, Settings, LayoutDashboard,
  SlidersHorizontal,
  Building2, Key, Tag, Bell, ClipboardList, Inbox, BarChart3,
  ChevronLeft, ChevronRight, ChevronDown, Compass, SlidersVertical,
} from "lucide-react";
import ModeSwitcher from "@/components/ModeSwitcher";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";

import { useUserMode } from "@/hooks/useUserMode";
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
      className={`absolute ${direction === 'left' ? 'left-0' : 'right-0'} z-10 w-7 h-7 rounded-full bg-gradient-to-br from-[#FDFBF7] to-[#EFE6D6] border border-[hsl(var(--gold)/0.5)] flex items-center justify-center shadow-sm hover:border-[hsl(var(--gold))] transition-all`}
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
  const { mode } = useUserMode();
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

  // When filters are applied from the panel, navigate to properties with ALL filter params
  const handleFilterChange = (newFilters: ShortcutFilterState) => {
    setFilterState(newFilters);
    const p = encodeFiltersToURL(newFilters);
    const qs = p.toString();
    navigate(`/properties${qs ? `?${qs}` : ''}`);
  };

  // Show CRM shortcut only for users with relevant roles
  const showCRM = !!user && (isOwner || mode === 'broker' || mode === 'investor_broker');

  // Combined activity badge
  const activityCount =
    (alerts?.pendingTasks || 0) + (alerts?.totalNotificationAlerts || 0);

  /* ─── Shared styles for clean cells ─── */
  const cellBase = "h-8 flex items-center gap-1.5 transition-all px-2 rounded-md group whitespace-nowrap shrink-0 outline-none focus:outline-none focus-visible:outline-none [&:focus]:outline-none";
  const cellHover = "hover:bg-[hsl(var(--gold)/0.08)]";
  const iconClass = "w-4 h-4 text-[hsl(var(--gold))] group-hover:text-[hsl(var(--gold))] group-hover:scale-105 transition-transform shrink-0";
  const labelClass = "text-[11px] font-semibold text-black/55 uppercase tracking-wide hidden xl:inline whitespace-nowrap";

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
        className={`fixed top-0 right-0 h-[88px] z-[9998] flex flex-col border-b border-[hsl(var(--gold)/0.2)] shadow-[0_1px_3px_hsl(var(--gold)/0.12)] bg-gradient-to-r from-[#ECE2D2] via-[#E0D3BF] to-[#D8C7A6] transition-all duration-300 [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px] left-[200px]`}
      >
        {/* ── ROW 1 (48px): Navigation controls ── */}
        <div className="h-[48px] flex items-center shrink-0 relative">
          {/* Left scroll arrow */}
          <ScrollArrow direction="left" scrollRef={row1ScrollRef} />
          <div
            ref={row1ScrollRef}
            className="flex-1 min-w-0 h-full flex items-center gap-3 xl:gap-4 px-3 sm:px-5 xl:px-6 pr-2 sm:pr-3 xl:pr-4 overflow-x-auto overflow-y-visible scrollbar-hide"
            style={{ overscrollBehaviorX: 'contain', touchAction: 'pan-x' }}
          >

            {/* ── LEFT GROUP: Primary actions ── */}
            <div className="flex items-center h-8 gap-1.5 xl:gap-2 shrink-0">

              {/* Back Button */}
              <div className={`${cellBase} ${cellHover} px-1`}>
                <GlobalBackButton />
              </div>

              {/* Search */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSearchOpen(true)}
                    className={`${cellBase} ${cellHover}`}
                    aria-label="Search ⌘K"
                  >
                    <Search className={iconClass} />
                    <span className="text-[11px] text-[hsl(var(--foreground)/0.45)] font-medium hidden xl:inline">⌘K</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Search properties, developers, areas, and more (⌘K)</TooltipContent>
              </Tooltip>

              {/* Browse popover (Buy / Rent / Sell) */}
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button className={`${cellBase} ${cellHover}`} aria-label="Browse">
                        <Compass className={iconClass} />
                        <span className={labelClass}>Browse</span>
                        <ChevronDown className="w-3 h-3 text-[hsl(var(--gold)/0.6)] hidden xl:inline" />
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="max-w-[220px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Buy, rent, or sell properties</TooltipContent>
                </Tooltip>
                <PopoverContent align="start" sideOffset={10} className="w-56 p-1 z-[10100]">
                  <Link to="/properties?transaction=buy" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[hsl(var(--gold)/0.1)] transition-colors">
                    <Building2 className="w-4 h-4 text-[hsl(var(--gold))]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Buy</span>
                      <span className="text-[10px] text-muted-foreground">Off-plan & ready properties</span>
                    </div>
                  </Link>
                  <Link to="/properties?transaction=rent" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[hsl(var(--gold)/0.1)] transition-colors">
                    <Key className="w-4 h-4 text-[hsl(var(--gold))]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Rent</span>
                      <span className="text-[10px] text-muted-foreground">Properties to rent in UAE</span>
                    </div>
                  </Link>
                  <Link to="/listing-portal" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[hsl(var(--gold)/0.1)] transition-colors">
                    <Tag className="w-4 h-4 text-[hsl(var(--gold))]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">Sell</span>
                      <span className="text-[10px] text-muted-foreground">List your property</span>
                    </div>
                  </Link>
                </PopoverContent>
              </Popover>

              {/* Favorites */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/favorites"
                    className={`${cellBase} ${cellHover}`}
                    aria-label="Favorites"
                  >
                    <Heart className="w-4 h-4 text-red-500 group-hover:text-red-600 group-hover:scale-105 transition-transform shrink-0" />
                    <span className={labelClass}>Saved</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">View your saved and shortlisted properties</TooltipContent>
              </Tooltip>

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
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[220px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Open advanced property filters</TooltipContent>
              </Tooltip>
            </div>
          </div>
          {/* Right scroll arrow */}
          <ScrollArrow direction="right" scrollRef={row1ScrollRef} />

          {/* ── RIGHT GROUP: User shortcuts (always visible) ── */}
          <div className="flex items-center h-8 gap-1.5 xl:gap-2 shrink-0 ml-auto border-l border-[hsl(var(--gold)/0.25)] pl-3 mr-3">
            {/* CRM shortcut (owner/broker only) */}
            {showCRM && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/owner/crm"
                    className={`${cellBase} hover:bg-emerald-500/10`}
                  >
                    <BarChart3 className="w-4 h-4 text-emerald-600 group-hover:scale-105 transition-transform shrink-0" />
                    <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide hidden xl:inline whitespace-nowrap">CRM</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Customer Relationship Management dashboard</TooltipContent>
              </Tooltip>
            )}

            {/* Activity popover (Tasks / Alerts / Inbox) */}
            {user && (
              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <button className={`${cellBase} ${cellHover} relative`} aria-label="Activity">
                        <Bell className={iconClass} />
                        <span className={labelClass}>Activity</span>
                        {activityCount > 0 && (
                          <span className="absolute -top-1.5 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-1">
                            {activityCount > 9 ? '9+' : activityCount}
                          </span>
                        )}
                      </button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" sideOffset={8} className="max-w-[220px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Tasks, notifications & inbox</TooltipContent>
                </Tooltip>
                <PopoverContent align="end" sideOffset={10} className="w-72 p-2 z-[10100]">
                  <Tabs defaultValue="tasks" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 h-8">
                      <TabsTrigger value="tasks" className="text-[11px]">
                        Tasks{(alerts?.pendingTasks || 0) > 0 ? ` (${alerts!.pendingTasks})` : ''}
                      </TabsTrigger>
                      <TabsTrigger value="alerts" className="text-[11px]">
                        Alerts{(alerts?.totalNotificationAlerts || 0) > 0 ? ` (${alerts!.totalNotificationAlerts})` : ''}
                      </TabsTrigger>
                      <TabsTrigger value="inbox" className="text-[11px]">Inbox</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tasks" className="mt-2">
                      <Link to="/my-dashboard#tasks" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[hsl(var(--gold)/0.1)] transition-colors">
                        <ClipboardList className="w-4 h-4 text-[hsl(var(--gold))]" />
                        <span className="text-sm font-medium">Open task list</span>
                      </Link>
                    </TabsContent>
                    <TabsContent value="alerts" className="mt-2">
                      <Link to="/my-dashboard#notifications" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[hsl(var(--gold)/0.1)] transition-colors">
                        <Bell className="w-4 h-4 text-[hsl(var(--gold))]" />
                        <span className="text-sm font-medium">View notifications</span>
                      </Link>
                    </TabsContent>
                    <TabsContent value="inbox" className="mt-2">
                      <Link to="/my-dashboard#inbox" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[hsl(var(--gold)/0.1)] transition-colors">
                        <Inbox className="w-4 h-4 text-[hsl(var(--gold))]" />
                        <span className="text-sm font-medium">Open inbox</span>
                      </Link>
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>
            )}

            {/* Display popover (Area Unit / Language / Currency) */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button className={`${cellBase} ${cellHover}`} aria-label="Display preferences">
                      <SlidersVertical className={iconClass} />
                      <span className={labelClass}>Display</span>
                      <ChevronDown className="w-3 h-3 text-[hsl(var(--gold)/0.6)] hidden xl:inline" />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="max-w-[220px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Area unit, language & currency</TooltipContent>
              </Tooltip>
              <PopoverContent align="end" sideOffset={10} className="w-64 p-3 z-[10100] space-y-3">
                {/* Area Unit Toggle */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Area Unit</p>
                  <button
                    onClick={toggleAreaUnit}
                    className="w-full h-8 flex items-center transition-all border border-[hsl(var(--gold)/0.3)] rounded-lg overflow-hidden"
                    aria-label="Toggle area unit"
                  >
                    <span className={`flex-1 text-[11px] font-bold py-1.5 transition-all ${areaUnit === 'sqft' ? 'bg-[hsl(var(--gold)/0.18)] text-[hsl(var(--gold))]' : 'text-black/30 hover:text-black/50'}`}>
                      ft²
                    </span>
                    <span className="w-px h-full bg-[hsl(var(--gold)/0.3)]" />
                    <span className={`flex-1 text-[11px] font-bold py-1.5 transition-all ${areaUnit === 'sqm' ? 'bg-[hsl(var(--gold)/0.18)] text-[hsl(var(--gold))]' : 'text-black/30 hover:text-black/50'}`}>
                      m²
                    </span>
                  </button>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Language</p>
                  <div className="flex items-center justify-between px-2 py-1 border border-[hsl(var(--gold)/0.3)] rounded-lg">
                    <span className="text-xs text-foreground">{currentLang.flag} {currentLang.nativeName}</span>
                    <LanguageSwitcher variant="icon-only" />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Currency</p>
                  <div className="flex items-center justify-between px-2 py-1 border border-[hsl(var(--gold)/0.3)] rounded-lg">
                    <span className="text-xs text-foreground">{currency}</span>
                    <CurrencySwitcher variant="icon-only" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Dashboard */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/my-dashboard"
                  className={`${cellBase} ${cellHover}`}
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className={iconClass} />
                  <span className={labelClass}>Dashboard</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Your personalized dashboard</TooltipContent>
            </Tooltip>

            {/* Mode Switcher */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`${cellBase} px-1`}>
                  <ModeSwitcher variant="header" showForUnselected />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Select your mode based on your role</TooltipContent>
            </Tooltip>

            {/* Settings */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/profile"
                  className={`${cellBase} ${cellHover}`}
                  aria-label="Settings"
                >
                  <Settings className={iconClass} />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="max-w-[200px] whitespace-normal text-center text-[hsl(var(--gold))] text-xs z-[10100]">Manage your account, profile, and preferences</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ── ROW 2 (40px): Filter Shortcut Bar — shown on ALL pages including /map ── */}
        <div className="h-[40px] shrink-0 px-3 flex items-center py-0.5">
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
