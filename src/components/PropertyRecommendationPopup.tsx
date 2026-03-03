/**
 * PropertyRecommendationPopup — Behavior-based property advertising
 * Shows personalized property suggestions based on browsing behavior
 * Integrated with PopupCoordinator for single-popup-at-a-time enforcement
 */

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, Sparkles, MapPin, Building2 } from "lucide-react";
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
const MIN_PAGES_BEFORE_SHOW = 3;
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h between recommendation popups

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
  if (area && !history.areas.includes(area)) {
    history.areas.push(area);
  }
  if (type && !history.types.includes(type)) {
    history.types.push(type);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

const PropertyRecommendationPopup = () => {
  const { requestToShow, dismiss, isVisible } = usePopupVisibility('property-recommendation');
  const { formatPrice } = useCurrency();
  const [projects, setProjects] = useState<RecommendedProject[]>([]);
  const [topArea, setTopArea] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  // Track current page browsing
  useEffect(() => {
    const path = location.pathname;
    const areaMatch = path.match(/\/area\/([^/]+)/);
    if (areaMatch) {
      trackBrowsing(areaMatch[1].replace(/-/g, " "));
    }
    const projectMatch = path.match(/\/project\//);
    if (projectMatch) {
      trackBrowsing(undefined, "offplan");
    }
    if (path.includes("/properties")) {
      trackBrowsing(undefined, "listing");
    }
  }, [location.pathname]);

  const fetchRecommendations = useCallback(async () => {
    const history = getBrowsingHistory();
    const lastShown = localStorage.getItem(POPUP_COOLDOWN_KEY);
    
    if (lastShown && Date.now() - parseInt(lastShown) < COOLDOWN_MS) return;
    if (history.areas.length + history.types.length < MIN_PAGES_BEFORE_SHOW) return;

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
    
    let results = data as RecommendedProject[] | null;

    if (!results || results.length === 0) {
      if (primaryArea) {
        const { data: fallback } = await supabase
          .from("projects")
          .select("id, name, area_name, developer_name, price_from, cover_image_url, slug")
          .eq("is_published", true)
          .not("sale_status", "ilike", "%sold%")
          .order("created_at", { ascending: false })
          .limit(3);
        results = fallback as RecommendedProject[] | null;
      }
    }

    if (results && results.length > 0) {
      // For projects missing cover_image_url, fetch first gallery image
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
      requestToShow();
      window.dispatchEvent(new Event('recommendation-popup-opened'));
      localStorage.setItem(POPUP_COOLDOWN_KEY, Date.now().toString());
    }
  }, [requestToShow]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 15000);
    return () => clearTimeout(timer);
  }, [fetchRecommendations]);

  const handleClose = () => {
    dismiss();
  };

  const handleExplore = (slug: string | null) => {
    dismiss();
    if (slug) navigate(`/project/${slug}`);
  };

  // formatPrice is now provided by useCurrency hook

  return (
    <AnimatePresence>
      {isVisible && projects.length > 0 && (
        <motion.div
          className="fixed bottom-4 right-4 z-50 max-w-sm w-full"
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/50 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.15)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gold/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-black text-sm font-semibold">Recommended for You</span>
              </div>
              <button onClick={handleClose} className="text-zinc-400 hover:text-black transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {topArea && (
              <div className="px-4 pt-3">
                <p className="text-zinc-600 text-xs">
                  Based on your interest in <span className="text-gold font-medium capitalize">{topArea}</span>
                </p>
              </div>
            )}

            {/* Project Cards */}
            <div className="p-3 space-y-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleExplore(project.slug)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl bg-white/70 hover:bg-white border border-gold/20 hover:border-gold/50 transition-all group text-left"
                >
                  {project.cover_image_url ? (
                    <img
                      src={project.cover_image_url}
                      alt={project.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-gold/10"
                      loading="eager"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-gold/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-black text-sm font-medium truncate group-hover:text-gold transition-colors">{project.name}</p>
                    {project.area_name && (
                      <p className="text-zinc-500 text-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {project.area_name}
                      </p>
                    )}
                    <p className="text-gold text-xs font-semibold mt-0.5">{formatPrice(project.price_from)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-gold transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            {/* CTA */}
            <div className="px-3 pb-3">
              <Button
                onClick={() => { dismiss(); navigate("/properties"); }}
                className="w-full bg-gradient-to-r from-gold/90 to-amber-600 text-black font-semibold text-sm hover:from-gold hover:to-amber-500"
                size="sm"
              >
                Explore All Properties
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PropertyRecommendationPopup;
