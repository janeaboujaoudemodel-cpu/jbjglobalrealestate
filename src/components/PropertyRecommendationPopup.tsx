/**
 * PropertyRecommendationPopup — Behavior-based property advertising
 * Shows personalized property suggestions based on browsing behavior
 * Tracks areas and property types the user has viewed
 */

import { useState, useEffect, useCallback } from "react";
import { X, ArrowRight, Sparkles, MapPin, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";

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
  const [isOpen, setIsOpen] = useState(false);
  const [projects, setProjects] = useState<RecommendedProject[]>([]);
  const [topArea, setTopArea] = useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  // Track current page browsing
  useEffect(() => {
    const path = location.pathname;
    // Extract area from /area/slug or /properties?area=slug
    const areaMatch = path.match(/\/area\/([^/]+)/);
    if (areaMatch) {
      trackBrowsing(areaMatch[1].replace(/-/g, " "));
    }
    // Extract from project pages
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
    
    // Check cooldown
    if (lastShown && Date.now() - parseInt(lastShown) < COOLDOWN_MS) return;
    // Need minimum browsing
    if (history.areas.length + history.types.length < MIN_PAGES_BEFORE_SHOW) return;

    // Find the most browsed area
    const primaryArea = history.areas[history.areas.length - 1] || "";
    setTopArea(primaryArea);

    // Fetch projects matching browsing behavior
    let query = supabase
      .from("projects")
      .select("id, name, area_name, developer_name, price_from, cover_image_url, slug")
      .eq("is_published", true)
      .limit(3);
    
    if (primaryArea) {
      query = query.ilike("area_name", `%${primaryArea}%`);
    }

    const { data } = await query;
    
    if (data && data.length > 0) {
      setProjects(data as RecommendedProject[]);
      setIsOpen(true);
      localStorage.setItem(POPUP_COOLDOWN_KEY, Date.now().toString());
    } else if (primaryArea) {
      // Fallback: get any recent projects
      const { data: fallback } = await supabase
        .from("projects")
        .select("id, name, area_name, developer_name, price_from, cover_image_url, slug")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (fallback && fallback.length > 0) {
        setProjects(fallback as RecommendedProject[]);
        setIsOpen(true);
        localStorage.setItem(POPUP_COOLDOWN_KEY, Date.now().toString());
      }
    }
  }, []);

  // Trigger after browsing threshold
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRecommendations();
    }, 15000); // 15s after component mount
    return () => clearTimeout(timer);
  }, [fetchRecommendations]);

  const handleExplore = (slug: string | null) => {
    setIsOpen(false);
    if (slug) navigate(`/project/${slug}`);
  };

  const formatPrice = (price: number | null) => {
    if (!price) return "Price on request";
    const rounded = Math.round(price);
    if (rounded >= 1000000) return `AED ${(rounded / 1000000).toFixed(1)}M`;
    return `AED ${Math.round(rounded / 1000)}K`;
  };

  return (
    <AnimatePresence>
      {isOpen && projects.length > 0 && (
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
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-black transition-colors">
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
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
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
                onClick={() => { setIsOpen(false); navigate("/properties"); }}
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
