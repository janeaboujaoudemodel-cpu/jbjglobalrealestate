import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Building2, Sparkles, Users, FileText, LayoutDashboard, Briefcase, Scale, Palette, Calculator, Map, BookOpen, Phone, Home, Heart, Award, Newspaper, Video, HelpCircle, Key, GraduationCap, Clock, Trash2, Star, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { searchItems, nearestSearchItems } from "@/config/globalSearchIndex";
import type { SearchItem } from "@/config/globalSearchIndex";
import { SafeImage } from "@/components/SafeImage";
import { getRecentSearches, saveRecentSearch, clearRecentSearches, getSearchShortcuts, toggleSearchShortcut, isShortcutPinned, removeSearchShortcut } from "@/lib/searchHistory";

interface GlobalSearchModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  embedded?: boolean;
}

// Quick access shortcuts - always visible
const QUICK_SHORTCUTS = [
  { label: "Properties", route: "/properties", icon: Building2, color: "bg-blue-500" },
  { label: "Developers", route: "/developers", icon: Users, color: "bg-emerald-500" },
  { label: "Areas", route: "/areas", icon: Map, color: "bg-purple-500" },
  { label: "Market Report", route: "/market-report", icon: FileText, color: "bg-amber-500" },
  { label: "Mortgage", route: "/mortgage-calculator", icon: Calculator, color: "bg-pink-500" },
  { label: "AI Tools", route: "/ai-hub", icon: Sparkles, color: "bg-indigo-500" },
];

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
  { label: "AI Home Finder", route: "/quiz", icon: Sparkles },
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
  const [recentSearches, setRecentSearches] = useState<string[]>(getRecentSearches());
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();

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

  useEffect(() => {
    if (isOpen) {
      const q = (initialQuery || "").trim();
      setQuery(q);
      setRecentSearches(getRecentSearches());
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
  const DbResultItem = ({ item, route, fallbackIcon: FallbackIcon, isFirst = false }: { item: DbResult; route: string; fallbackIcon: React.ElementType; isFirst?: boolean }) => (
    <button
      onClick={() => handleSelect(route)}
      className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left ${isFirst ? 'bg-[#1A1A1A]/10 border border-[#B89555]/40' : 'hover:bg-[#1A1A1A]/5'}`}
    >
      <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#B89555]/30 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] flex items-center justify-center flex-shrink-0">
        {item.image ? (
          <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <FallbackIcon className="w-4 h-4 text-[#1A1A1A]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.name}</p>
      </div>
      <ArrowRight className="w-3 h-3 text-[#1A1A1A]/70 flex-shrink-0" />
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, developers, tools & more..."
            className="w-full h-12 pl-12 pr-4 bg-[#FDFBF7]/80 border border-[#B89555]/30 rounded-xl text-[#1A1A1A] text-base placeholder:text-[#1A1A1A]/70 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all duration-200"
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
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#F7F1E6] hover:to-[#ECE2D2] transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 text-[#1A1A1A]">
                          {item.icon && <item.icon className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.label}</p>
                          {item.category && <p className="text-xs text-[#1A1A1A]">{item.category}</p>}
                        </div>
                        <ArrowRight className="w-3 h-3 text-[#1A1A1A]/70" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {totalResults === 0 && (
                <p className="text-sm text-[#1A1A1A]/70 text-center py-4">No results found for "{query}"</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2 uppercase tracking-wider">Quick Access</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_SHORTCUTS.map((s) => (
                    <button
                      key={s.route}
                      onClick={() => handleSelect(s.route)}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg hover:bg-gradient-to-r hover:from-[#F7F1E6] hover:to-[#ECE2D2] transition-all group"
                    >
                      <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                        <s.icon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-[#1A1A1A] font-medium">{s.label}</span>
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
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#F7F1E6] hover:to-[#ECE2D2] transition-all text-left group"
                    >
                      <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/30 flex items-center justify-center text-[#1A1A1A]">
                        <page.icon className="w-3.5 h-3.5" />
                      </div>
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
                    <button onClick={handleClearRecent} className="text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors">Clear</button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => handleRecentSearchClick(search)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-gradient-to-r hover:from-[#F7F1E6] hover:to-[#ECE2D2] transition-all text-left group"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
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
            className="fixed inset-0 bg-[#1A1A1A]/80 backdrop-blur-sm z-[10000]"
            onClick={onClose}
          />

          {/* Modal - LARGE Premium Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 -translate-x-1/2 [body.jj-vertical-nav-active_&]:lg:left-[calc(50%+100px)] [body.jj-vertical-nav-collapsed_&]:lg:left-[calc(50%+24px)] w-full max-w-3xl z-[10001] px-6 sm:px-8 top-[56px] sm:top-[56px]"
            style={{ maxHeight: 'calc(100dvh - 80px)' }}
          >
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100dvh - 96px)' }}>
              {/* Search Input - Larger */}
              <div className="relative border-b border-[#B89555]/30 flex-shrink-0">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#1A1A1A]" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by keyword... Search anything"
                  className="w-full h-16 pl-14 pr-14 bg-transparent border-0 text-[#1A1A1A] text-xl placeholder:text-[#1A1A1A]/70 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-[#EFE6D6]/10 transition-colors"
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
                              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                                !hasDbResults && idx === 0
                                  ? "bg-[#1A1A1A]/10 border border-[#B89555]/40" 
                                  : "hover:bg-[#EFE6D6]/10"
                              }`}
                            >
                              <div className={`w-11 h-11 rounded-lg flex items-center justify-center border ${
                                !hasDbResults && idx === 0
                                  ? "bg-[#1A1A1A] text-[#1A1A1A] border-[#B89555]/50" 
                                  : "bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]"
                              }`}>
                                {item.icon && <item.icon className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-[#1A1A1A]">{item.label}</p>
                                <p className="text-[#1A1A1A] text-sm truncate">{item.description}</p>
                              </div>
                              <ArrowRight className="w-5 h-5 flex-shrink-0 text-[#1A1A1A]" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalResults === 0 && (
                      <div className="p-8 text-center">
                        <p className="text-[#1A1A1A]/70">No results found for "{query}"</p>
                        <p className="text-sm text-[#1A1A1A]/70 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Show shortcuts and suggestions when NOT typing */
                  <div className="space-y-6">
                    {/* Quick Access Shortcuts */}
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]/70 mb-3 px-1 uppercase tracking-wider">
                        Quick Access
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {QUICK_SHORTCUTS.map((shortcut) => (
                          <button
                            key={shortcut.route}
                            onClick={() => handleSelect(shortcut.route)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#FDFBF7] border border-[#B89555]/20 hover:border-[#B89555]/50 hover:shadow-md transition-all group"
                          >
                            <div className={`w-10 h-10 rounded-lg ${shortcut.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                              <shortcut.icon className="w-5 h-5" />
                            </div>
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
                            className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7]/50 border border-[#B89555]/10 hover:bg-[#FDFBF7] hover:border-[#B89555]/30 transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#EFE6D6]/10 flex items-center justify-center text-[#1A1A1A]">
                              <page.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-[#1A1A1A]">{page.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3 px-1">
                          <p className="text-sm font-bold text-[#1A1A1A]/70 uppercase tracking-wider">
                            Recent Searches
                          </p>
                          <button 
                            onClick={handleClearRecent}
                            className="flex items-center gap-1 text-xs text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            Clear
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recentSearches.map((search, i) => (
                            <button
                              key={i}
                              onClick={() => handleRecentSearchClick(search)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FDFBF7]/50 border border-[#B89555]/10 hover:bg-[#FDFBF7] hover:border-[#B89555]/30 transition-all"
                            >
                              <Clock className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                              <span className="text-sm font-medium text-[#1A1A1A]">{search}</span>
                            </button>
                          ))}
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
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gold/20 to-amber-100 border border-[#B89555]/30 hover:shadow-md transition-all"
                            >
                              <LayoutDashboard className="w-5 h-5 text-[#1A1A1A]" />
                              <span className="text-sm font-semibold text-[#1A1A1A]">Owner</span>
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => handleSelect('/admin')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-300 hover:shadow-md transition-all"
                            >
                              <Briefcase className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-semibold text-[#1A1A1A]">Admin</span>
                            </button>
                          )}
                          {(hasCRMAccess || isOwner) && (
                            <button
                              onClick={() => handleSelect('/crm')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-300 hover:shadow-md transition-all"
                            >
                              <Users className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-semibold text-[#1A1A1A]">CRM</span>
                            </button>
                          )}
                          {(hasListingAdminAccess || isOwner) && (
                            <button
                              onClick={() => handleSelect('/listing-admin')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-300 hover:shadow-md transition-all"
                            >
                              <Building2 className="w-5 h-5 text-emerald-600" />
                              <span className="text-sm font-semibold text-[#1A1A1A]">Listings</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Search Hint */}
                    <div className="text-center pt-2">
                      <p className="text-sm text-[#1A1A1A]">
                        Start typing to search projects, developers, tools, pages, and more...
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
