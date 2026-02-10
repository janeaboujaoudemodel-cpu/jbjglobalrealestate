import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, Building2, Sparkles, Users, FileText, LayoutDashboard, Briefcase, Scale, Palette, Calculator, Map, BookOpen, Phone, Home, Heart, Award, Newspaper, Video, HelpCircle, Key, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { searchItems } from "@/config/globalSearchIndex";
import type { SearchItem } from "@/config/globalSearchIndex";

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
  { label: "AI Tools", route: "/toolkit", icon: Sparkles, color: "bg-indigo-500" },
];

// Popular pages
const POPULAR_PAGES = [
  { label: "Home", route: "/", icon: Home },
  { label: "Favorites", route: "/favorites", icon: Heart },
  { label: "Buyer Guide", route: "/buyer-guide", icon: BookOpen },
  { label: "Golden Visa", route: "/guides/golden-visa-uae", icon: Award },
  { label: "Contact", route: "/contact", icon: Phone },
  { label: "FAQ", route: "/faq", icon: HelpCircle },
];

const GlobalSearchModal = ({ isOpen, initialQuery = "", onClose, embedded = false }: GlobalSearchModalProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();

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

  useEffect(() => {
    if (isOpen) {
      const q = (initialQuery || "").trim();
      setQuery(q);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialQuery]);

  const handleSelect = (route: string) => {
    navigate(route);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && results.length > 0 && query.trim()) {
      handleSelect(results[0].route);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  // Embedded mode - render content directly without overlay
  if (embedded) {
    return (
      <div className="flex flex-col" style={{ maxHeight: '500px' }}>
        {/* Search Input */}
        <div className="relative border-b border-gold/30 flex-shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search anything..."
            className="w-full h-12 pl-12 pr-4 bg-transparent border-0 text-white text-base placeholder:text-gold/60 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        {/* Content */}
        <div className="overflow-y-auto p-3 flex-1" style={{ maxHeight: '440px' }}>
          {query.trim() ? (
            <div>
              <p className="text-sm font-semibold text-gold mb-2 px-1">
                {results.length > 0 ? `${results.length} results` : 'No results'}
              </p>
              {results.length > 0 && (
                <div className="space-y-1">
                  {results.map((item, idx) => (
                    <button
                      key={`${item.id}-${idx}`}
                      onClick={() => handleSelect(item.route)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 border border-gold/30 text-gold">
                        {item.icon && <item.icon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{item.label}</p>
                        {item.category && <p className="text-xs text-zinc-400">{item.category}</p>}
                      </div>
                      <ArrowRight className="w-3 h-3 text-zinc-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-gold/80 mb-2 uppercase tracking-wider">Quick Links</p>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_SHORTCUTS.map((s) => (
                  <button
                    key={s.route}
                    onClick={() => handleSelect(s.route)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-white/10 transition-all"
                  >
                    <div className={`w-8 h-8 rounded-lg ${s.color} flex items-center justify-center`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-zinc-300">{s.label}</span>
                  </button>
                ))}
              </div>
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal - LARGE Premium Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-3xl z-50 px-4 top-4 sm:top-12 md:top-16"
            style={{ maxHeight: 'calc(100dvh - 2rem)' }}
          >
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100dvh - 3rem)' }}>
              {/* Search Input - Larger */}
              <div className="relative border-b border-gold/30 flex-shrink-0">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gold" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by keyword... Search anything"
                  className="w-full h-16 pl-14 pr-14 bg-transparent border-0 text-black text-xl placeholder:text-gold/60 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gold/10 transition-colors"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              </div>

              {/* Main Content - Scrollable */}
              <div className="overflow-y-auto p-4 flex-1" style={{ maxHeight: 'calc(100dvh - 12rem)' }}>
                {/* Show search results when typing */}
                {query.trim() ? (
                  <div>
                    <p className="text-sm font-semibold text-gold mb-3 px-1">
                      {results.length > 0 ? `${results.length} results found` : 'No results found'}
                    </p>
                    {results.length > 0 ? (
                      <div className="space-y-1">
                        {results.map((item, idx) => (
                          <button
                            key={`${item.id}-${idx}`}
                            onClick={() => handleSelect(item.route)}
                            className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                              idx === 0
                                ? "bg-black/10 border border-gold/40" 
                                : "hover:bg-gold/10"
                            }`}
                          >
                            <div className={`w-11 h-11 rounded-lg flex items-center justify-center border ${
                              idx === 0
                                ? "bg-black text-gold border-gold/50" 
                                : "bg-white border-gold/30 text-gold"
                            }`}>
                              {item.icon && <item.icon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-semibold text-black">{item.label}</p>
                              <p className="text-gold text-sm truncate">{item.description}</p>
                            </div>
                            <ArrowRight className="w-5 h-5 flex-shrink-0 text-gold" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-zinc-500">No results found for "{query}"</p>
                        <p className="text-sm text-zinc-400 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Show shortcuts and suggestions when NOT typing */
                  <div className="space-y-6">
                    {/* Quick Access Shortcuts */}
                    <div>
                      <p className="text-sm font-bold text-black/70 mb-3 px-1 uppercase tracking-wider">
                        Quick Access
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {QUICK_SHORTCUTS.map((shortcut) => (
                          <button
                            key={shortcut.route}
                            onClick={() => handleSelect(shortcut.route)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-gold/20 hover:border-gold/50 hover:shadow-md transition-all group"
                          >
                            <div className={`w-10 h-10 rounded-lg ${shortcut.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                              <shortcut.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium text-black text-center">{shortcut.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Popular Pages */}
                    <div>
                      <p className="text-sm font-bold text-black/70 mb-3 px-1 uppercase tracking-wider">
                        Popular Pages
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {POPULAR_PAGES.map((page) => (
                          <button
                            key={page.route}
                            onClick={() => handleSelect(page.route)}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-gold/10 hover:bg-white hover:border-gold/30 transition-all"
                          >
                            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center text-gold">
                              <page.icon className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-black">{page.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin Shortcuts - Only for authenticated users with access */}
                    {(isOwner || hasCRMAccess || hasListingAdminAccess) && (
                      <div>
                        <p className="text-sm font-bold text-black/70 mb-3 px-1 uppercase tracking-wider">
                          Admin Shortcuts
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {isOwner && (
                            <button
                              onClick={() => handleSelect('/owner')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-gold/20 to-amber-100 border border-gold/30 hover:shadow-md transition-all"
                            >
                              <LayoutDashboard className="w-5 h-5 text-gold" />
                              <span className="text-sm font-semibold text-black">Owner</span>
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => handleSelect('/admin')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-100 to-purple-50 border border-purple-300 hover:shadow-md transition-all"
                            >
                              <Briefcase className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-semibold text-black">Admin</span>
                            </button>
                          )}
                          {(hasCRMAccess || isOwner) && (
                            <button
                              onClick={() => handleSelect('/crm')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-100 to-blue-50 border border-blue-300 hover:shadow-md transition-all"
                            >
                              <Users className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-semibold text-black">CRM</span>
                            </button>
                          )}
                          {(hasListingAdminAccess || isOwner) && (
                            <button
                              onClick={() => handleSelect('/listing-admin')}
                              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-100 to-emerald-50 border border-emerald-300 hover:shadow-md transition-all"
                            >
                              <Building2 className="w-5 h-5 text-emerald-600" />
                              <span className="text-sm font-semibold text-black">Listings</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Search Hint */}
                    <div className="text-center pt-2">
                      <p className="text-sm text-gold/80">
                        Start typing to search projects, developers, tools, pages, and more...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="p-4 border-t border-gold/30 bg-white/50 flex-shrink-0">
                <p className="text-zinc-600 text-sm text-center">
                  <kbd className="px-2 py-1 bg-black/10 rounded text-black font-mono text-xs">Enter</kbd> to select first result 
                  <span className="mx-3">•</span>
                  <kbd className="px-2 py-1 bg-black/10 rounded text-black font-mono text-xs">Esc</kbd> to close
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