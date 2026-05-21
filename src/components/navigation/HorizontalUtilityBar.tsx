import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import {
  Search, Heart, Settings, LayoutDashboard,
  SlidersHorizontal,
  Building2, Key, Tag, Bell, ClipboardList, Inbox, BarChart3,
  ChevronLeft, ChevronRight, ChevronDown, Compass, SlidersVertical,
  Home, Castle, Building, Store, Briefcase, Trees, Sparkles, ArrowRight,
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
  const labelClass = "text-[11px] font-semibold text-[#1A1A1A]/55 uppercase tracking-wide hidden xl:inline whitespace-nowrap";

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
        className={`fixed top-0 right-0 h-[88px] z-[9998] flex items-center border-b border-[hsl(var(--gold)/0.18)] shadow-[0_1px_3px_hsl(var(--gold)/0.08)] bg-gradient-to-r from-[#FDFBF7] via-[#F7F1E6] to-[#EFE6D6] transition-all duration-300 [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px] left-[200px] px-5 xl:px-7`}
      >
        {/* ── LEFT: Back + Search ── */}
        <div className="flex items-center gap-3 shrink-0">
          <GlobalBackButton />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSearchOpen(true)}
                className="h-9 flex items-center gap-2 px-3 rounded-full hover:bg-[hsl(var(--gold)/0.06)] transition-colors group focus:outline-none"
                aria-label="Search ⌘K"
              >
                <Search className="w-[18px] h-[18px] text-[#1A1A1A]/70 group-hover:text-[#1A1A1A] transition-colors" />
                <kbd className="hidden sm:inline-flex items-center text-[10px] font-medium text-[#1A1A1A]/45 tracking-wide">⌘K</kbd>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Search (⌘K)</TooltipContent>
          </Tooltip>
        </div>

        {/* ── RIGHT: Compact utility cluster ── */}
        <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Browse */}
          <Popover>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors focus:outline-none"
                    aria-label="Browse"
                  >
                    <Compass className="w-[18px] h-[18px] text-[#1A1A1A]/75" />
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs">Browse properties</TooltipContent>
            </Tooltip>
            <PopoverContent align="end" sideOffset={10} className="w-[640px] max-w-[92vw] p-0 z-[10100] border border-[#EFE6D6] bg-[#FDFBF7] shadow-xl rounded-xl">
              <div className="px-5 pt-4 pb-3 border-b border-[#EFE6D6]">
                <div className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#1A1A1A]/55">Browse Properties</div>
                <div className="text-sm text-[#1A1A1A] mt-0.5">Pick a transaction, readiness, or category</div>
              </div>
              <div className="grid grid-cols-3 gap-0">
                <div className="p-4 border-r border-[#EFE6D6]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]/55 mb-2">Transaction</div>
                  <div className="space-y-0.5">
                    <Link to="/properties?transactionType=buy" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors"><Building2 className="w-4 h-4 text-[#1A1A1A]" /><span className="text-sm font-medium text-[#1A1A1A]">Buy</span></Link>
                    <Link to="/properties?transactionType=rent" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors"><Key className="w-4 h-4 text-[#1A1A1A]" /><span className="text-sm font-medium text-[#1A1A1A]">Rent</span></Link>
                    <Link to="/listing-portal" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors"><Tag className="w-4 h-4 text-[#1A1A1A]" /><span className="text-sm font-medium text-[#1A1A1A]">Sell / List</span></Link>
                  </div>
                </div>
                <div className="p-4 border-r border-[#EFE6D6]">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]/55 mb-2">Readiness</div>
                  <div className="space-y-0.5">
                    <Link to="/properties?completionStatus=ready" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors"><Home className="w-4 h-4 text-[#1A1A1A]" /><span className="text-sm font-medium text-[#1A1A1A]">Ready to move</span></Link>
                    <Link to="/properties?completionStatus=off-plan" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors"><Building2 className="w-4 h-4 text-[#1A1A1A]" /><span className="text-sm font-medium text-[#1A1A1A]">Off-plan</span></Link>
                    <Link to="/properties?status=new_launch" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors"><Sparkles className="w-4 h-4 text-[#1A1A1A]" /><span className="text-sm font-medium text-[#1A1A1A]">New launches</span></Link>
                    <Link to="/resale-properties" className="flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors"><ArrowRight className="w-4 h-4 text-[#1A1A1A]" /><span className="text-sm font-medium text-[#1A1A1A]">Resale deals</span></Link>
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]/55 mb-2">Category</div>
                  <div className="grid grid-cols-1 gap-0.5">
                    <Link to="/properties?type=apartment" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-[#F7F2EA] transition-colors"><Building2 className="w-3.5 h-3.5 text-[#1A1A1A]" /><span className="text-sm text-[#1A1A1A]">Apartments</span></Link>
                    <Link to="/properties?type=villa" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-[#F7F2EA] transition-colors"><Home className="w-3.5 h-3.5 text-[#1A1A1A]" /><span className="text-sm text-[#1A1A1A]">Villas</span></Link>
                    <Link to="/properties?type=townhouse" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-[#F7F2EA] transition-colors"><Castle className="w-3.5 h-3.5 text-[#1A1A1A]" /><span className="text-sm text-[#1A1A1A]">Townhouses</span></Link>
                    <Link to="/properties?type=penthouse" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-[#F7F2EA] transition-colors"><Building className="w-3.5 h-3.5 text-[#1A1A1A]" /><span className="text-sm text-[#1A1A1A]">Penthouses</span></Link>
                    <Link to="/properties?type=commercial" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-[#F7F2EA] transition-colors"><Briefcase className="w-3.5 h-3.5 text-[#1A1A1A]" /><span className="text-sm text-[#1A1A1A]">Commercial</span></Link>
                    <Link to="/properties?type=plot" className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-[#F7F2EA] transition-colors"><Trees className="w-3.5 h-3.5 text-[#1A1A1A]" /><span className="text-sm text-[#1A1A1A]">Plots / Land</span></Link>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-t border-[#EFE6D6] bg-[#F7F2EA]/60 rounded-b-xl">
                <Link to="/properties" className="text-sm font-medium text-[#1A1A1A] hover:underline inline-flex items-center gap-1.5">See all properties <ArrowRight className="w-3.5 h-3.5" /></Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Filter */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setFilterOpen(true)}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors focus:outline-none"
                aria-label="Filter"
              >
                <SlidersHorizontal className="w-[18px] h-[18px] text-[#1A1A1A]/75" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Advanced filters</TooltipContent>
          </Tooltip>

          {/* Saved */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to="/favorites" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors" aria-label="Favorites">
                <Heart className="w-[18px] h-[18px] text-[#1A1A1A]/75" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className="text-xs">Saved</TooltipContent>
          </Tooltip>

          {/* Activity (logged-in) */}
          {user && (
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors relative focus:outline-none" aria-label="Activity">
                      <Bell className="w-[18px] h-[18px] text-[#1A1A1A]/75" />
                      {activityCount > 0 && (
                        <span className="absolute top-1 right-1 min-w-[16px] h-[16px] rounded-full bg-[#1A1A1A] text-white text-[9px] font-bold flex items-center justify-center px-1">
                          {activityCount > 9 ? '9+' : activityCount}
                        </span>
                      )}
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={8} className="text-xs">Tasks · Alerts · Inbox</TooltipContent>
              </Tooltip>
              <PopoverContent align="end" sideOffset={10} className="w-72 p-2 z-[10100] bg-[#FDFBF7] border border-[#EFE6D6] rounded-xl">
                <Tabs defaultValue="tasks" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-8">
                    <TabsTrigger value="tasks" className="text-[11px]">Tasks{(alerts?.pendingTasks || 0) > 0 ? ` (${alerts!.pendingTasks})` : ''}</TabsTrigger>
                    <TabsTrigger value="alerts" className="text-[11px]">Alerts{(alerts?.totalNotificationAlerts || 0) > 0 ? ` (${alerts!.totalNotificationAlerts})` : ''}</TabsTrigger>
                    <TabsTrigger value="inbox" className="text-[11px]">Inbox</TabsTrigger>
                  </TabsList>
                  <TabsContent value="tasks" className="mt-2">
                    <Link to="/my-dashboard#tasks" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors">
                      <ClipboardList className="w-4 h-4 text-[#1A1A1A]/70" /><span className="text-sm font-medium text-[#1A1A1A]">Open task list</span>
                    </Link>
                  </TabsContent>
                  <TabsContent value="alerts" className="mt-2">
                    <Link to="/my-dashboard#notifications" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors">
                      <Bell className="w-4 h-4 text-[#1A1A1A]/70" /><span className="text-sm font-medium text-[#1A1A1A]">View notifications</span>
                    </Link>
                  </TabsContent>
                  <TabsContent value="inbox" className="mt-2">
                    <Link to="/my-dashboard#inbox" className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[#F7F2EA] transition-colors">
                      <Inbox className="w-4 h-4 text-[#1A1A1A]/70" /><span className="text-sm font-medium text-[#1A1A1A]">Open inbox</span>
                    </Link>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          )}

          {/* Currency */}
          <div className="hidden sm:flex items-center h-9 px-2 rounded-full hover:bg-[hsl(var(--gold)/0.06)] transition-colors">
            <span className="text-[12px] font-medium text-[#1A1A1A] mr-1">{currency}</span>
            <CurrencySwitcher variant="icon-only" />
          </div>

          {/* Language */}
          <div className="hidden md:flex items-center h-9 px-1 rounded-full hover:bg-[hsl(var(--gold)/0.06)] transition-colors">
            <LanguageSwitcher variant="icon-only" />
          </div>

          {/* Sq ft / Sq m segmented toggle */}
          <div className="hidden sm:inline-flex items-center h-7 rounded-full border border-[#1A1A1A]/15 overflow-hidden bg-white/40">
            <button
              onClick={() => { if (areaUnit !== 'sqft') toggleAreaUnit(); }}
              className={`px-2.5 h-full text-[10.5px] font-semibold tracking-wide transition-colors ${areaUnit === 'sqft' ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/65 hover:text-[#1A1A1A]'}`}
              aria-label="Square feet"
            >sq ft</button>
            <button
              onClick={() => { if (areaUnit !== 'sqm') toggleAreaUnit(); }}
              className={`px-2.5 h-full text-[10.5px] font-semibold tracking-wide transition-colors ${areaUnit === 'sqm' ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/65 hover:text-[#1A1A1A]'}`}
              aria-label="Square meters"
            >sq m</button>
          </div>

          {/* Divider */}
          <span className="hidden sm:block w-px h-6 bg-[#1A1A1A]/10 mx-1" />

          {/* CRM (owner/broker only) */}
          {showCRM && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/owner/crm" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors" aria-label="CRM">
                  <BarChart3 className="w-[18px] h-[18px] text-[#1A1A1A]/75" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs">CRM</TooltipContent>
            </Tooltip>
          )}

          {/* Dashboard */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/my-dashboard" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors" aria-label="Dashboard">
                  <LayoutDashboard className="w-[18px] h-[18px] text-[#1A1A1A]/75" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs">Dashboard</TooltipContent>
            </Tooltip>
          )}

          {/* Mode chip (kept as requested) */}
          <ModeSwitcher variant="header" showForUnselected />

          {/* Sign in / Profile */}
          {user ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/profile" className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--gold)/0.08)] transition-colors" aria-label="Profile">
                  <Settings className="w-[18px] h-[18px] text-[#1A1A1A]/75" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="text-xs">Account</TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/auth"
              className="h-9 inline-flex items-center gap-1.5 px-3.5 rounded-full border border-[#1A1A1A]/20 hover:border-[#1A1A1A]/45 hover:bg-[#1A1A1A]/[0.04] transition-colors text-[12px] font-semibold tracking-wide text-[#1A1A1A] uppercase"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A]/60" />
              Sign in
            </Link>
          )}
        </div>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />

      <AdvancedFilterPanel
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filterState}
        onFilterChange={handleFilterChange}
      />
    </>
  );
}
