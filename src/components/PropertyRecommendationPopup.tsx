/**
 * PropertyRecommendationPopup — Behavior-based property advertising
 * Shows personalized property suggestions based on browsing behavior.
 *
 * UX rules (per product spec):
 *  • Always SYNCS with the user's latest search / area browsed — refetches
 *    whenever the route changes or a search is dispatched.
 *  • The "X" button MINIMIZES the popup to a small floating chip (does NOT
 *    permanently dismiss it) — clicking the chip re-expands it.
 *  • A "Hide from my page" link fully hides it for the session.
 *  • Re-openable any time from the header account menu via the
 *    `jbj:open-recommendations` window event.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { X, ArrowRight, Sparkles, MapPin, Building2, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { usePopupVisibility } from "@/contexts/PopupCoordinatorContext";
import { useCurrency } from "@/hooks/useCurrency";

interface RecommendedProject {
  id: string;
  name: string;
  area_name: string | null;
  developer_name: string | null;
  price_from: number | null;
  cover_image_url: string | null;
  slug: string | null;
}

const STORAGE_KEY = "jbj_browsing_history";
const POPUP_COOLDOWN_KEY = "jbj_rec_popup_last";
const SESSION_HIDDEN_KEY = "jbj_rec_hidden_session";
const MINIMIZED_KEY = "jbj_rec_minimized";
const MIN_PAGES_BEFORE_SHOW = 3;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h between auto-shows (NOT applied to manual re-open)

function getBrowsingHistory(): { areas: string[]; types: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { areas: [], types: [] };
    return JSON.parse(raw);
  } catch {
    return { areas: [], types: [] };
  }
}

function trackBrowsing(area?: string, type?: string) {
  const history = getBrowsingHistory();
  let changed = false;
  if (area && !history.areas.includes(area)) {
    history.areas.push(area);
    changed = true;
  }
  if (type && !history.types.includes(type)) {
    history.types.push(type);
    changed = true;
  }
  if (changed) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    // Notify recommendation engine to refetch live.
    window.dispatchEvent(new Event("jbj:browsing-tracked"));
  }
}

const PropertyRecommendationPopup = () => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('property-recommendation');
  const { formatPrice } = useCurrency();
  const [projects, setProjects] = useState<RecommendedProject[]>([]);
  const [topArea, setTopArea] = useState<string>("");
  const [minimized, setMinimized] = useState<boolean>(() => sessionStorage.getItem(MINIMIZED_KEY) === "1");
  const [sessionHidden, setSessionHidden] = useState<boolean>(() => sessionStorage.getItem(SESSION_HIDDEN_KEY) === "1");
  const navigate = useNavigate();
  const location = useLocation();
  const manualOpenRef = useRef(false);

  // Track current page browsing
  useEffect(() => {
    const path = location.pathname;
    const search = location.search;
    const areaMatch = path.match(/\/area\/([^/]+)/);
    if (areaMatch) {
      trackBrowsing(areaMatch[1].replace(/-/g, " "));
    }
    if (path.match(/\/project\//)) {
      trackBrowsing(undefined, "offplan");
    }
    if (path.includes("/properties")) {
      trackBrowsing(undefined, "listing");
      // Pick up ?area= / ?location= filters from the URL so recommendations
      // follow the user's live search.
      try {
        const params = new URLSearchParams(search);
        const liveArea = params.get("area") || params.get("location") || params.get("q");
        if (liveArea) trackBrowsing(liveArea.toLowerCase());
      } catch { /* noop */ }
    }
  }, [location.pathname, location.search]);

  const fetchRecommendations = useCallback(async (opts?: { force?: boolean }) => {
    const force = !!opts?.force;
    const history = getBrowsingHistory();
    const lastShown = localStorage.getItem(POPUP_COOLDOWN_KEY);

    if (!force) {
      if (lastShown && Date.now() - parseInt(lastShown) < COOLDOWN_MS) return;
      if (history.areas.length + history.types.length < MIN_PAGES_BEFORE_SHOW) return;
    }

    const primaryArea = history.areas[history.areas.length - 1] || "";
    setTopArea(primaryArea);

    let query = supabase
      .from("projects")
      .select("id, name, area_name, developer_name, price_from, cover_image_url, slug")
      .eq("is_published", true)
      .not("sale_status", "ilike", "%sold%")
      .limit(3);

    if (primaryArea) {
      query = query.ilike("area_name", `%${primaryArea}%`);
    }

    const { data } = await query;
    let results = (data as RecommendedProject[] | null) || [];

    // Backfill to always get 3 results
    if (results.length < 3) {
      const existingIds = results.map(r => r.id);
      const needed = 3 - results.length;
      let backfillQuery = supabase
        .from("projects")
        .select("id, name, area_name, developer_name, price_from, cover_image_url, slug")
        .eq("is_published", true)
        .not("sale_status", "ilike", "%sold%")
        .order("created_at", { ascending: false })
        .limit(needed + 5);

      if (existingIds.length > 0) {
        backfillQuery = backfillQuery.not("id", "in", `(${existingIds.join(",")})`);
      }

      const { data: fallback } = await backfillQuery;
      if (fallback) {
        const extras = (fallback as RecommendedProject[]).slice(0, needed);
        results = [...results, ...extras];
      }
    }

    if (results && results.length > 0) {
      const missingIds = results.filter(p => !p.cover_image_url).map(p => p.id);
      if (missingIds.length > 0) {
        const { data: images } = await supabase
          .from("project_images")
          .select("project_id, image_url")
          .in("project_id", missingIds)
          .order("sort_order", { ascending: true });
        if (images) {
          const imageMap = new Map<string, string>();
          for (const img of images) {
            if (!imageMap.has(img.project_id)) {
              imageMap.set(img.project_id, img.image_url);
            }
          }
          results = results.map(p => ({
            ...p,
            cover_image_url: p.cover_image_url || imageMap.get(p.id) || null,
          }));
        }
      }
      setProjects(results);

      // Only auto-pop the full popup when NOT minimized and NOT hidden.
      const isHidden = sessionStorage.getItem(SESSION_HIDDEN_KEY) === "1";
      const isMin = sessionStorage.getItem(MINIMIZED_KEY) === "1";
      if (force || (!isHidden && !isMin)) {
        if (!isHidden) {
          if (force || !isMin) {
            requestToShow();
            window.dispatchEvent(new Event('recommendation-popup-opened'));
          }
        }
        localStorage.setItem(POPUP_COOLDOWN_KEY, Date.now().toString());
      }
    }
  }, [requestToShow]);

  // Initial timed surface
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 15000);
    return () => clearTimeout(timer);
  }, [fetchRecommendations]);

  // Live re-sync with route/search changes and browsing tracker
  useEffect(() => {
    // Debounced refetch when route changes (keeps recs in sync with search).
    const t = setTimeout(() => { fetchRecommendations(); }, 600);
    const onTracked = () => fetchRecommendations();
    window.addEventListener("jbj:browsing-tracked", onTracked);
    return () => {
      clearTimeout(t);
      window.removeEventListener("jbj:browsing-tracked", onTracked);
    };
  }, [location.pathname, location.search, fetchRecommendations]);

  // Manual re-open from header account menu
  useEffect(() => {
    const onOpen = () => {
      sessionStorage.removeItem(SESSION_HIDDEN_KEY);
      sessionStorage.removeItem(MINIMIZED_KEY);
      setSessionHidden(false);
      setMinimized(false);
      manualOpenRef.current = true;
      fetchRecommendations({ force: true });
    };
    window.addEventListener("jbj:open-recommendations", onOpen);
    return () => window.removeEventListener("jbj:open-recommendations", onOpen);
  }, [fetchRecommendations]);

  const handleMinimize = () => {
    sessionStorage.setItem(MINIMIZED_KEY, "1");
    setMinimized(true);
    dismiss();
  };

  const handleHideForSession = () => {
    sessionStorage.setItem(SESSION_HIDDEN_KEY, "1");
    sessionStorage.removeItem(MINIMIZED_KEY);
    setSessionHidden(true);
    setMinimized(false);
    dismiss();
  };

  const handleExpand = () => {
    sessionStorage.removeItem(MINIMIZED_KEY);
    setMinimized(false);
    requestToShow();
  };

  const handleExplore = (slug: string | null) => {
    handleMinimize();
    if (slug) navigate(`/project/${slug}`);
  };

  // Fully hidden for session — render nothing (still accessible via header).
  if (sessionHidden) return null;

  return (
    <AnimatePresence mode="wait">
      {/* Compact chip when minimized */}
      {minimized && projects.length > 0 && (
        <motion.button
          key="rec-chip"
          type="button"
          onClick={handleExpand}
          aria-label="Open recommended properties"
          className="fixed bottom-4 right-4 z-[10060] inline-flex items-center gap-2 px-3 py-2 rounded-full
            bg-[#FDFBF7] border border-[#B89555]/60 shadow-[0_10px_28px_rgba(0,0,0,0.18)]
            text-[#1A1A1A] text-xs font-semibold hover:bg-[#F7F2EA] transition-colors"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#B89555]" />
          <span>Recommended ({projects.length})</span>
        </motion.button>
      )}

      {/* Full popup */}
      {!minimized && isVisible && projects.length > 0 && (
        <motion.div
          key="rec-full"
          className="fixed bottom-4 right-4 z-[10060] max-w-sm w-full"
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/50 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.15)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
                <span className="text-[#1A1A1A] text-sm font-semibold">Recommended for You</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMinimize}
                  aria-label="Minimize"
                  title="Minimize"
                  className="text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors p-1 rounded hover:bg-[#FDFBF7]/60"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleHideForSession}
                  aria-label="Hide from my page"
                  title="Hide from my page"
                  className="text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors p-1 rounded hover:bg-[#FDFBF7]/60"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {topArea && (
              <div className="px-4 pt-3">
                <p className="text-[#1A1A1A]/70 text-xs">
                  Based on your interest in <span className="text-[#1A1A1A] font-medium capitalize">{topArea}</span>
                </p>
              </div>
            )}

            {/* Project Cards */}
            <div className="p-3 space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleExplore(project.slug)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl bg-[#FDFBF7]/70 hover:bg-[#FDFBF7] border border-[#B89555]/20 hover:border-[#B89555]/50 transition-all group text-left"
                >
                  {project.cover_image_url ? (
                    <img
                      src={project.cover_image_url}
                      alt={project.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-[#EFE6D6]/10"
                      loading="eager"
                      decoding="sync"
                      fetchPriority="high"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-[#EFE6D6]/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#1A1A1A]/70" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#1A1A1A] text-sm font-medium truncate group-hover:text-[#1A1A1A] transition-colors">{project.name}</p>
                    {project.area_name && (
                      <p className="text-[#1A1A1A]/70 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {project.area_name}
                      </p>
                    )}
                    {project.price_from ? (
                      <p className="text-xs font-semibold mt-0.5">
                        <span className="text-[#1A1A1A]">From </span>
                        <span style={{ color: "var(--price-orange)" }}>{formatPrice(project.price_from)}</span>
                      </p>
                    ) : null}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#1A1A1A]/70 group-hover:text-[#1A1A1A] transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* CTA + Hide link */}
            <div className="px-3 pb-3 space-y-2">
              <Button
                onClick={() => { handleMinimize(); navigate("/properties"); }}
                className="w-full bg-gradient-to-r from-gold/90 to-amber-600 text-[#1A1A1A] font-semibold text-sm hover:from-gold hover:to-amber-500"
                size="sm"
              >
                Explore All Properties
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <button
                type="button"
                onClick={handleHideForSession}
                className="w-full text-center text-[11px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] underline-offset-2 hover:underline transition-colors"
              >
                Hide from my page (still available in your account)
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PropertyRecommendationPopup;
