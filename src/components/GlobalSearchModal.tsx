import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
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
}

const GlobalSearchModal = ({ isOpen, initialQuery = "", onClose }: GlobalSearchModalProps) => {
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

  // Default results when no query
  const defaultResults = searchItems("", {
    isOwner: isOwner,
    hasCRMAccess: hasCRMAccess || false,
    hasListingAdminAccess: hasListingAdminAccess || false,
    isBroker: isBroker,
    isAuthenticated: !!user,
    limit: 8,
  }).filter(item => item.icon && typeof item.icon === 'function');

  const displayResults = query.trim() ? results : defaultResults;

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
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && displayResults.length > 0) {
      handleSelect(displayResults[0].route);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

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

          {/* Modal - Responsive positioning */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 -translate-x-1/2 w-full max-w-xl z-50 px-4 top-4 sm:top-16 md:top-20"
            style={{ maxHeight: 'calc(100dvh - 2rem)' }}
          >
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100dvh - 3rem)' }}>
              {/* Search Input */}
              <div className="relative border-b border-gold/30 flex-shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, tools, guides..."
                  className="w-full h-14 pl-12 pr-12 bg-transparent border-0 text-black text-lg placeholder:text-gold/70 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gold/10 transition-colors"
                >
                  <X className="w-5 h-5 text-black" />
                </button>
              </div>

              {/* Results - Scrollable */}
              <div className="overflow-y-auto p-2 flex-1" style={{ maxHeight: 'calc(100dvh - 10rem)' }}>
                {displayResults.length > 0 ? (
                  displayResults.map((item, idx) => (
                    <button
                      key={`${item.id}-${idx}`}
                      onClick={() => handleSelect(item.route)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all ${
                        idx === 0 && query.trim() 
                          ? "bg-black/10 border border-gold/40" 
                          : "hover:bg-gold/10"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                        idx === 0 && query.trim() 
                          ? "bg-black text-gold border-gold/50" 
                          : "bg-white border-gold/30 text-gold"
                      }`}>
                        {item.icon && <item.icon className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className={`font-medium ${idx === 0 && query.trim() ? "text-black" : "text-black"}`}>
                          {item.label}
                        </p>
                        <p className="text-gold text-sm truncate">{item.description}</p>
                      </div>
                      <ArrowRight className={`w-4 h-4 flex-shrink-0 ${idx === 0 && query.trim() ? "text-black" : "text-gold"}`} />
                    </button>
                  ))
                ) : query.trim() ? (
                  <div className="p-8 text-center">
                    <p className="text-zinc-500">No results found for "{query}"</p>
                    <p className="text-sm text-zinc-400 mt-1">Try a different search term</p>
                  </div>
                ) : null}
              </div>

              {/* Footer hint */}
              <div className="p-3 border-t border-gold/30 bg-white/50 flex-shrink-0">
                <p className="text-zinc-600 text-xs text-center">
                  Press <kbd className="px-1.5 py-0.5 bg-black/10 rounded text-black">Enter</kbd> to go • <kbd className="px-1.5 py-0.5 bg-black/10 rounded text-black">Esc</kbd> to close
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
