import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Building2, Sparkles, Users, FileText, LayoutDashboard, Briefcase, Scale, Palette, Calculator, Map, BookOpen, Phone, Home, Heart, Award, Newspaper, Video, HelpCircle, Key, GraduationCap, Clock, Trash2, Star, Pin, MessageCircle, Mail, LifeBuoy, Compass, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { searchItems, nearestSearchItems } from "@/config/globalSearchIndex";
import type { SearchItem } from "@/config/globalSearchIndex";
import { SafeImage } from "@/components/SafeImage";
import { IconTile } from "@/components/ui/icon-tile";
import { getRecentSearches, saveRecentSearch, clearRecentSearches, getSearchShortcuts, toggleSearchShortcut, isShortcutPinned, removeSearchShortcut } from "@/lib/searchHistory";

interface GlobalSearchModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  embedded?: boolean;
}

// Universal quick shortcuts — always visible (kept lean, role extras added below)
const QUICK_SHORTCUTS = [
  { label: "Properties", route: "/properties", icon: Building2 },
  { label: "Developers", route: "/developers", icon: Users },
  { label: "Areas", route: "/areas", icon: Map },
  { label: "Market Report", route: "/market-report", icon: FileText },
  { label: "Mortgage", route: "/mortgage-calculator", icon: Calculator },
  { label: "AI Tools", route: "/ai-hub", icon: Sparkles },
];

// Role-aware shortcuts surfaced when no query is typed
const MODE_SHORTCUTS: Record<'investor' | 'broker' | 'developer', { label: string; route: string; icon: any }[]> = {
  investor: [
    { label: "AI Home Finder", route: "/ai-home-finder", icon: Sparkles },
    { label: "Off-Plan", route: "/properties?status=off-plan", icon: Building2 },
    { label: "Golden Visa", route: "/guides/golden-visa-uae", icon: Award },
    { label: "Concierge", route: "/concierge", icon: Sparkles },
    { label: "Favorites", route: "/favorites", icon: Heart },
    { label: "Buyer Guide", route: "/buyer-guide", icon: BookOpen },
  ],
  broker: [
    { label: "Broker Portal", route: "/broker-dashboard", icon: LayoutDashboard },
    { label: "Broker Toolkit", route: "/broker-toolkit", icon: Briefcase },
    { label: "Resources", route: "/broker-resources", icon: BookOpen },
    { label: "Academy", route: "/broker-education", icon: GraduationCap },
    { label: "All Projects", route: "/properties", icon: Building2 },
    { label: "Market Intel", route: "/market-intelligence", icon: TrendingUp },
  ],
  developer: [
    { label: "Developer Portal", route: "/developers-portal", icon: LayoutDashboard },
    { label: "Submit Project", route: "/developers-portal/projects/new", icon: Building2 },
    { label: "Insights", route: "/market-intelligence", icon: TrendingUp },
    { label: "Reports", route: "/market-report", icon: FileText },
    { label: "Areas", route: "/areas", icon: Map },
    { label: "Contact", route: "/contact", icon: Phone },
  ],
};

// Popular pages - 9 items (3 columns × 3 rows)
const POPULAR_PAGES = [
  { label: "Home", route: "/", icon: Home },
  { label: "Favorites", route: "/favorites", icon: Heart },
  { label: "Buyer Guide", route: "/buyer-guide", icon: BookOpen },
  { label: "Golden Visa", route: "/guides/golden-visa-uae", icon: Award },
  { label: "Contact", route: "/contact", icon: Phone },
  { label: "FAQ", route: "/faq", icon: HelpCircle },
  { label: "About Us", route: "/about", icon: Building2 },
  { label: "News", route: "/news", icon: Newspaper },
  { label: "AI Home Finder", route: "/ai-home-finder", icon: Sparkles },
];

// Recent searches & pinned shortcuts now live in src/lib/searchHistory.ts (7-day TTL)

// Debounce hook
function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

interface DbResult {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
}

const GlobalSearchModal = ({ isOpen, initialQuery = "", onClose, embedded = false }: GlobalSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());
  const [shortcuts, setShortcuts] = useState<string[]>(() => getSearchShortcuts());
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();
  const { mode } = useUserModeContext();
  const roleShortcuts = MODE_SHORTCUTS[mode] ?? MODE_SHORTCUTS.investor;
  const roleLabel = mode === 'broker' ? 'Broker' : mode === 'developer' ? 'Developer' : 'Investor';

  const debouncedQuery = useDebouncedValue(query.trim(), 300);

  // Check CRM access
  const { data: crmProfile } = useQuery({
    queryKey: ['crm-profile-search', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('crm_users_profile')
        .select('crm_role, is_active')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && isOpen,
    staleTime: 60000,
  });

  // Check listing admin access
  const { data: hasListingAdminAccess } = useQuery({
    queryKey: ['listing-admin-access-search', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const [ownerResult, adminResult, listingAdminResult] = await Promise.all([
        supabase.rpc("has_role", { _user_id: user.id, _role: "owner" }),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
        supabase.from("listing_admins").select("id").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
      ]);
      return ownerResult.data === true || adminResult.data === true || !!listingAdminResult.data;
    },
    enabled: !!user?.id && isOpen,
    staleTime: 60000,
  });

  // --- Live DB search queries ---
  const { data: dbDevelopers = [] } = useQuery({
    queryKey: ['search-developers', debouncedQuery],
    queryFn: async (): Promise<DbResult[]> => {
      const { data } = await supabase
        .from('developers' as any)
        .select('id, name, slug, logo_url')
        .ilike('name', `%${debouncedQuery}%`)
        .limit(5);
      return ((data as unknown as Array<{ id: string; name: string; slug: string; logo_url: string | null }>) || []).map(d => ({ id: d.id, name: d.name, slug: d.slug, image: d.logo_url }));
    },
    enabled: debouncedQuery.length >= 2 && isOpen,
    staleTime: 30000,
  });

  const { data: dbProjects = [] } = useQuery({
    queryKey: ['search-projects', debouncedQuery],
    queryFn: async (): Promise<DbResult[]> => {
      const { data } = await supabase
        .from('projects')
        .select('id, name, slug, cover_image_url, developer_name')
        .or(`name.ilike.%${debouncedQuery}%,developer_name.ilike.%${debouncedQuery}%`)
        .or('listing_kind.is.null,listing_kind.neq.leasing')
        .eq('status', 'active')
        .limit(5);
      return (data || []).map(p => ({ id: p.id, name: p.name, slug: p.slug, image: p.cover_image_url }));
    },
    enabled: debouncedQuery.length >= 2 && isOpen,
    staleTime: 30000,
  });

  const { data: dbAreas = [] } = useQuery({
    queryKey: ['search-areas', debouncedQuery],
    queryFn: async (): Promise<DbResult[]> => {
      const { data } = await supabase
        .from('areas')
        .select('id, name, slug, image_url')
        .ilike('name', `%${debouncedQuery}%`)
        .eq('is_active', true)
        .limit(5);
      return (data || []).map(a => ({ id: a.id, name: a.name, slug: a.slug, image: a.image_url }));
    },
    enabled: debouncedQuery.length >= 2 && isOpen,
    staleTime: 30000,
  });

  const hasCRMAccess = crmProfile?.is_active && 
    ['owner_admin', 'broker_member', 'sales_director', 'admin', 'founder'].includes(crmProfile?.crm_role || '');

  const isBroker = crmProfile?.crm_role === 'broker_member';

  // Get filtered results - filter out any items without valid icons
  const results = searchItems(query, {
    isOwner: isOwner,
    hasCRMAccess: hasCRMAccess || false,
    hasListingAdminAccess: hasListingAdminAccess || false,
    isBroker: isBroker,
    isAuthenticated: !!user,
    limit: 12,
  }).filter(item => item.icon && typeof item.icon === 'function');

  const hasDbResults = dbDevelopers.length > 0 || dbProjects.length > 0 || dbAreas.length > 0;
  const totalResults = results.length + dbDevelopers.length + dbProjects.length + dbAreas.length;

  // Nearest-match fallback — always returns something so the user never sees an empty screen.
  const nearest = totalResults === 0 && query.trim().length >= 2
    ? nearestSearchItems(query, {
        isOwner,
        hasCRMAccess: hasCRMAccess || false,
        hasListingAdminAccess: hasListingAdminAccess || false,
        isBroker,
        isAuthenticated: !!user,
        limit: 6,
      }).filter(item => item.icon && typeof item.icon === 'function')
    : [];

  useEffect(() => {
    if (isOpen) {
      const q = (initialQuery || "").trim();
      setQuery(q);
      setRecentSearches(getRecentSearches());
      setShortcuts(getSearchShortcuts());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialQuery]);

  const handleSelect = (route: string) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
      setRecentSearches(getRecentSearches());
    }
    navigate(route);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecentSearchClick = (search: string) => {
    setQuery(search);
  };

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const handleTogglePin = (e: React.MouseEvent, search: string) => {
    e.stopPropagation();
    toggleSearchShortcut(search);
    setShortcuts(getSearchShortcuts());
  };

  const handleRemoveShortcut = (e: React.MouseEvent, search: string) => {
    e.stopPropagation();
    removeSearchShortcut(search);
    setShortcuts(getSearchShortcuts());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      // Prioritize DB results, then static
      if (dbDevelopers.length > 0) {
        handleSelect(`/developer/${dbDevelopers[0].slug}`);
      } else if (dbProjects.length > 0) {
        handleSelect(`/project/${dbProjects[0].slug}`);
      } else if (dbAreas.length > 0) {
        handleSelect(`/area/${dbAreas[0].slug}`);
      } else if (results.length > 0) {
        handleSelect(results[0].route);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Reusable DB result row
  const DbResultItem = ({ item, route, fallbackIcon: FallbackIcon, isFirst = false }: { item: DbResult; route: string; fallbackIcon: import("lucide-react").LucideIcon; isFirst?: boolean }) => (
    <button
      onClick={() => handleSelect(route)}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left jj-hover-emerald ${isFirst ? 'bg-[#FDFBF7] border-[#B89555]/55 shadow-sm' : 'bg-[#FDFBF7]/70 border-[#B89555]/20 hover:border-[#B89555]/55'}`}
    >
      {item.image ? (
        <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#B89555]/40 bg-white flex items-center justify-center flex-shrink-0">
          <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <IconTile icon={FallbackIcon} tone="emerald" size="sm" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.name}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-[#064E3B] flex-shrink-0" />
    </button>
  );

  // DB results section
  const DbResultsSection = ({ compact = false }: { compact?: boolean }) => {
    if (!hasDbResults) return null;
    return (
      <div className="space-y-3">
        {dbDevelopers.length > 0 && (
          <div>
            <p className={`${compact ? 'text-xs' : 'text-xs'} font-semibold text-[#1A1A1A] mb-1 px-1 uppercase tracking-wider`}>Developers</p>
            <div className="space-y-0.5">
              {dbDevelopers.map((d, i) => (
                <DbResultItem key={d.id} item={d} route={`/developer/${d.slug}`} fallbackIcon={Building2} isFirst={!compact && i === 0 && dbProjects.length === 0 && dbAreas.length === 0} />
              ))}
            </div>
          </div>
        )}
        {dbProjects.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1 px-1 uppercase tracking-wider">Projects</p>
            <div className="space-y-0.5">
              {dbProjects.map(p => (
                <DbResultItem key={p.id} item={p} route={`/project/${p.slug}`} fallbackIcon={Building2} />
              ))}
            </div>
          </div>
        )}
        {dbAreas.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#1A1A1A] mb-1 px-1 uppercase tracking-wider">Areas</p>
            <div className="space-y-0.5">
              {dbAreas.map(a => (
                <DbResultItem key={a.id} item={a} route={`/area/${a.slug}`} fallbackIcon={Map} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Embedded mode - render content directly without overlay
  if (embedded) {
    return (
      <div className="flex flex-col" style={{ maxHeight: '500px' }}>
        {/* Search Input */}
        <div className="relative flex-shrink-0">
          <IconTile icon={Search} tone="emerald" size="sm" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, developers, tools & more..."
            className="w-full h-12 pl-14 pr-4 bg-[#FDFBF7]/90 border border-[#B89555]/35 rounded-xl text-[#1A1A1A] text-base placeholder:text-[#1A1A1A]/60 focus:outline-none focus:ring-2 focus:ring-[#064E3B]/30 transition-all duration-200"
          />
        </div>
        {/* Content */}
        <div className="overflow-y-auto p-3 flex-1" style={{ maxHeight: '440px' }}>
          {query.trim() ? (
            <div className="space-y-3">
              {/* DB results first */}
              <DbResultsSection compact />
              {/* Static page results */}
              {results.length > 0 && (
                <div>
                  {hasDbResults && <p className="text-xs font-semibold text-[#1A1A1A] mb-1 px-1 uppercase tracking-wider">Pages & Tools</p>}
                  <div className="space-y-0.5">
                    {results.map((item, idx) => (
                      <button
                        key={`${item.id}-${idx}`}
                        onClick={() => handleSelect(item.route)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7]/70 border border-[#B89555]/20 hover:border-[#B89555]/55 transition-all text-left group jj-hover-emerald"
                      >
                        {item.icon && <IconTile icon={item.icon} tone="emerald" size="sm" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.label}</p>
                          {item.category && <p className="text-xs text-[#1A1A1A]">{item.category}</p>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#064E3B]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {totalResults === 0 && (
                nearest.length > 0 ? (
                  <div>
                    <div className="px-1 py-2 mb-2 rounded-lg bg-[#FDFBF7] border border-[#B89555]/30">
                      <p className="text-xs font-semibold text-[#1A1A1A]">No exact match for "{query}"</p>
                      <p className="text-[11px] text-[#1A1A1A]/70 mt-0.5">Here are the closest results we could find.</p>
                    </div>
                    <div className="space-y-0.5">
                      {nearest.map((item, idx) => (
                        <button
                          key={`${item.id}-near-${idx}`}
                          onClick={() => handleSelect(item.route)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7]/70 border border-[#B89555]/20 hover:border-[#B89555]/55 transition-all text-left jj-hover-emerald"
                        >
                          {item.icon && <IconTile icon={item.icon} tone="emerald" size="sm" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.label}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#064E3B]" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#1A1A1A]/70 text-center py-4">No results found for "{query}"</p>
                )
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2 uppercase tracking-wider">Quick Access</p>
                <div className="grid grid-cols-3 gap-2">
                  {[...roleShortcuts.slice(0, 3), ...QUICK_SHORTCUTS.slice(0, 3)].map((s) => (
                    <button
                      key={s.route + s.label}
                      onClick={() => handleSelect(s.route)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/60 hover:shadow-sm transition-all group jj-hover-emerald"
                    >
                      <IconTile icon={s.icon} tone="emerald" size="md" />
                      <span className="text-[11px] text-[#1A1A1A] font-medium text-center leading-tight">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2 uppercase tracking-wider">Popular Pages</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {POPULAR_PAGES.map((page) => (
                    <button
                      key={page.route}
                      onClick={() => handleSelect(page.route)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7]/70 border border-[#B89555]/15 hover:border-[#B89555]/45 transition-all text-left group jj-hover-emerald"
                    >
                      <IconTile icon={page.icon} tone="emerald" size="sm" />
                      <span className="text-xs text-[#1A1A1A] font-medium">{page.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Recent Searches - Embedded */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">Recent Searches</p>
                    <Button onClick={handleClearRecent} variant="secondary" size="sm" className="h-8 px-3 text-xs">Clear</Button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7]/70 border border-[#B89555]/15 hover:border-[#B89555]/45 transition-all text-left group jj-hover-emerald"
                      >
                        <IconTile icon={Clock} tone="emerald" size="sm" className="!h-7 !w-7 !rounded-lg" iconClassName="!h-3.5 !w-3.5" />
                        <span className="text-xs text-[#1A1A1A] font-medium">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-[10000]"
            onClick={onClose}
          />

          {/* Modal — viewport-safe, never clipped on any device */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="fixed z-[10001] left-1/2 -translate-x-1/2 top-[12px] sm:top-[56px]"
            style={{
              width: "min(48rem, calc(100vw - 24px))",
              maxHeight: "calc(100dvh - 80px)",
            }}
          >
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100dvh - 96px)' }}>
              {/* Search Input - Larger */}
              <div className="relative border-b border-[#B89555]/30 flex-shrink-0">
                <IconTile icon={Search} tone="emerald" size="sm" className="absolute left-4 top-1/2 -translate-y-1/2" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by keyword... Search anything"
                  className="w-full h-16 pl-16 pr-14 bg-transparent border-0 text-[#1A1A1A] text-xl placeholder:text-[#1A1A1A]/60 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg border border-[#B89555]/25 bg-[#FDFBF7]/80 hover:border-[#B89555]/60 hover:bg-[#EFE6D6] transition-colors"
                >
                  <X className="w-6 h-6 text-[#1A1A1A]" />
                </button>
              </div>

              {/* Main Content - Scrollable */}
              <div className="overflow-y-auto p-4 flex-1" style={{ maxHeight: 'calc(100dvh - 12rem)' }}>
                {/* Show search results when typing */}
                {query.trim() ? (
                  <div className="space-y-4">
                    {/* DB results first */}
                    <DbResultsSection />

                    {/* Static page results */}
                    {results.length > 0 && (
                      <div>
                        {hasDbResults && (
                          <p className="text-xs font-semibold text-[#1A1A1A] mb-2 px-1 uppercase tracking-wider">Pages & Tools</p>
                        )}
                        <div className="space-y-1">
                          {results.map((item, idx) => (
                            <button
                              key={`${item.id}-${idx}`}
                              onClick={() => handleSelect(item.route)}
                              className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left jj-hover-emerald ${
 !hasDbResults && idx === 0
 ? "bg-[#FDFBF7] border-[#B89555]/55 shadow-sm" 
 : "bg-[#FDFBF7]/70 border-[#B89555]/20 hover:border-[#B89555]/55"
 }`}
                            >
                              {item.icon && <IconTile icon={item.icon} tone="emerald" size="md" />}
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-[#1A1A1A]">{item.label}</p>
                                <p className="text-[#1A1A1A] text-sm truncate">{item.description}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 flex-shrink-0 text-[#064E3B]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalResults === 0 && (
                      nearest.length > 0 ? (
                        <div>
                          <div className="p-4 rounded-xl bg-[#FDFBF7] border border-[#B89555]/40 mb-3 text-center">
                            <p className="text-sm font-semibold text-[#1A1A1A]">We couldn't find an exact match for "{query}"</p>
                            <p className="text-xs text-[#1A1A1A]/70 mt-1">
                              Here are the closest results across our website. Need help? <button onClick={() => handleSelect('/contact')} className="underline font-medium hover:text-[#B89555]">Contact support</button>.
                            </p>
                          </div>
                          <div className="space-y-1">
                            {nearest.map((item, idx) => (
                              <button
                                key={`${item.id}-near-${idx}`}
                                onClick={() => handleSelect(item.route)}
                                className="w-full flex items-center gap-4 p-3 rounded-xl border border-[#B89555]/20 bg-[#FDFBF7]/70 hover:border-[#B89555]/55 transition-all text-left jj-hover-emerald"
                              >
                                {item.icon && <IconTile icon={item.icon} tone="emerald" size="md" />}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-[#1A1A1A] truncate">{item.label}</p>
                                  <p className="text-[#1A1A1A]/70 text-sm truncate">{item.description}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-[#064E3B] flex-shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-[#1A1A1A]/70">No results found for "{query}"</p>
                          <p className="text-sm text-[#1A1A1A]/70 mt-1">
                            Try fewer words, or <button onClick={() => handleSelect('/contact')} className="underline font-medium hover:text-[#B89555]">contact support</button>.
                          </p>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  /* Show shortcuts and suggestions when NOT typing */
                  <div className="space-y-6">
                    {/* Role-aware shortcuts */}
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]/70 mb-3 px-1 uppercase tracking-wider flex items-center gap-2">
                        <IconTile icon={Compass} tone="emerald" size="sm" className="!h-7 !w-7 !rounded-lg" iconClassName="!h-3.5 !w-3.5" /> For {roleLabel}s
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {roleShortcuts.map((shortcut) => (
                          <button
                            key={shortcut.route + shortcut.label}
                            onClick={() => handleSelect(shortcut.route)}
                              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/60 hover:shadow-md transition-all group jj-hover-emerald"
                          >
                            <IconTile icon={shortcut.icon} tone="emerald" size="md" className="group-hover:scale-105 transition-transform" />
                            <span className="text-xs font-medium text-[#1A1A1A] text-center leading-tight">{shortcut.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Access */}
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]/70 mb-3 px-1 uppercase tracking-wider">
                        Quick Access
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {QUICK_SHORTCUTS.map((shortcut) => (
                          <button
                            key={shortcut.route}
                            onClick={() => handleSelect(shortcut.route)}
                              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/20 hover:border-[#B89555]/50 hover:shadow-md transition-all group jj-hover-emerald"
                          >
                            <IconTile icon={shortcut.icon} tone="emerald" size="md" className="group-hover:scale-105 transition-transform" />
                            <span className="text-xs font-medium text-[#1A1A1A] text-center">{shortcut.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Popular Pages */}
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]/70 mb-3 px-1 uppercase tracking-wider">
                        Popular Pages
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {POPULAR_PAGES.map((page) => (
                          <button
                            key={page.route}
                            onClick={() => handleSelect(page.route)}
                              className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7]/70 border border-[#B89555]/15 hover:border-[#B89555]/45 transition-all jj-hover-emerald"
                          >
                            <IconTile icon={page.icon} tone="emerald" size="sm" />
                            <span className="text-sm font-medium text-[#1A1A1A]">{page.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Your Pinned Shortcuts */}
                    {shortcuts.length > 0 && (
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]/70 mb-3 px-1 uppercase tracking-wider flex items-center gap-2">
                          <IconTile icon={Pin} tone="emerald" size="sm" className="!h-7 !w-7 !rounded-lg" iconClassName="!h-3.5 !w-3.5" /> Your Shortcuts
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {shortcuts.map((search, i) => (
                            <div
                              key={`sc-${i}`}
                              className="group/sc flex items-center gap-1 pl-3 pr-1 py-1 rounded-xl bg-[#FDFBF7] border border-[#B89555]/40 hover:border-[#B89555] transition-all jj-hover-emerald"
                            >
                              <button
                                onClick={() => handleRecentSearchClick(search)}
                                className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]"
                              >
                                <Star className="w-3.5 h-3.5 text-[#064E3B] fill-[#064E3B]" />
                                {search}
                              </button>
                              <button
                                onClick={(e) => handleRemoveShortcut(e, search)}
                                aria-label={`Remove shortcut ${search}`}
                                className="ml-1 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-[#1A1A1A]/10"
                              >
                                <X className="w-3 h-3 text-[#1A1A1A]" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Searches (auto-clears after 7 days) */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <p className="text-sm font-bold text-[#1A1A1A]/70 uppercase tracking-wider">
                            Recent Searches <span className="text-[10px] font-normal normal-case text-[#1A1A1A]/50">(saved for 7 days)</span>
                          </p>
                          <button
                            onClick={handleClearRecent}
                            className="flex items-center gap-1 text-xs text-[#064E3B] hover:text-[#042C1C] font-semibold transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, i) => {
                            const pinned = isShortcutPinned(search);
                            return (
                              <div
                                key={i}
                                className="group/r flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-xl bg-[#FDFBF7]/70 border border-[#B89555]/15 hover:border-[#B89555]/45 transition-all jj-hover-emerald"
                              >
                                <button
                                  onClick={() => handleRecentSearchClick(search)}
                                  className="flex items-center gap-2 text-sm font-medium text-[#1A1A1A]"
                                >
                                  <Clock className="w-3.5 h-3.5 text-[#064E3B]" />
                                  {search}
                                </button>
                                <button
                                  onClick={(e) => handleTogglePin(e, search)}
                                  aria-label={pinned ? "Unpin shortcut" : "Pin as shortcut"}
                                  title={pinned ? "Unpin shortcut" : "Pin as shortcut"}
                                  className="ml-1 p-1 rounded-full opacity-60 hover:opacity-100 hover:bg-[#1A1A1A]/10"
                                >
                                  <Star className={`w-3.5 h-3.5 ${pinned ? "text-[#064E3B] fill-[#064E3B]" : "text-[#064E3B]/75"}`} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Admin Shortcuts - Only for authenticated users with access */}
                    {(isOwner || hasCRMAccess || hasListingAdminAccess) && (
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]/70 mb-3 px-1 uppercase tracking-wider">
                          Admin Shortcuts
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {isOwner && (
                            <button
                              onClick={() => handleSelect('/owner')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/55 hover:shadow-md transition-all jj-hover-emerald"
                            >
                              <IconTile icon={LayoutDashboard} tone="emerald" size="sm" />
                              <span className="text-sm font-semibold text-[#1A1A1A]">Owner</span>
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => handleSelect('/admin')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/55 hover:shadow-md transition-all jj-hover-emerald"
                            >
                              <IconTile icon={Briefcase} tone="emerald" size="sm" />
                              <span className="text-sm font-semibold text-[#1A1A1A]">Admin</span>
                            </button>
                          )}
                          {(hasCRMAccess || isOwner) && (
                            <button
                              onClick={() => handleSelect('/crm')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/25 hover:border-[#B89555]/55 hover:shadow-md transition-all jj-hover-emerald"
                            >
                              <IconTile icon={Users} tone="emerald" size="sm" />
                              <span className="text-sm font-semibold text-[#1A1A1A]">CRM</span>
                            </button>
                          )}
                          {(hasListingAdminAccess || isOwner) && (
                            <button
                              onClick={() => handleSelect('/listing-admin')}
                              data-surface="emerald"
                              data-emerald-ok="button"
                              className="jj-surface-emerald flex items-center gap-3 p-3 rounded-xl hover:shadow-md transition-all"
                            >
                              <IconTile icon={Building2} tone="emerald" size="sm" />
                              <span className="text-sm font-semibold">Listings</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Always-on: Need help? — premium contact panel */}
                    <div className="rounded-2xl border border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <IconTile icon={LifeBuoy} tone="emerald" size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1A1A1A]">Can't find what you're looking for?</p>
                          <p className="text-xs text-[#1A1A1A]/70 mt-0.5">Our JBJ team is one click away — we'll guide you personally.</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button onClick={() => handleSelect('/contact')} size="sm" className="h-9 px-3 text-xs">
                              <Phone className="w-3.5 h-3.5" /> Contact JBJ Team
                            </Button>
                            <Button onClick={() => handleSelect('/book')} variant="secondary" size="sm" className="h-9 px-3 text-xs">
                              <MessageCircle className="w-3.5 h-3.5" /> Book a Call
                            </Button>
                            <Button onClick={() => handleSelect('/support')} variant="secondary" size="sm" className="h-9 px-3 text-xs">
                              <HelpCircle className="w-3.5 h-3.5" /> Support
                            </Button>
                            <Button onClick={() => handleSelect('/faq')} variant="secondary" size="sm" className="h-9 px-3 text-xs">
                              <BookOpen className="w-3.5 h-3.5" /> FAQ
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Search Hint */}
                    <div className="text-center pt-1">
                      <p className="text-xs text-[#1A1A1A]/70">
                        Start typing to search projects, developers, tools, pages, and more…
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="p-4 border-t border-[#B89555]/30 bg-[#FDFBF7]/50 flex-shrink-0">
                <p className="text-[#1A1A1A]/70 text-sm text-center">
                  <kbd className="px-2 py-1 bg-[#1A1A1A]/10 rounded text-[#1A1A1A] font-mono text-xs">Enter</kbd> to select first result 
                  <span className="mx-3">•</span>
                  <kbd className="px-2 py-1 bg-[#1A1A1A]/10 rounded text-[#1A1A1A] font-mono text-xs">Esc</kbd> to close
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearchModal;
