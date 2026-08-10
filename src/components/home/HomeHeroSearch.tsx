/**
 * HomeHeroSearch — the ONE hero search surface.
 *
 * The duplicated emerald pill was removed: the unified `PropertySearchBar`
 * now carries the animated typewriter keyword field and the inline
 * "Free Consultation" CTA.
 *
 * Submit behaviour:
 *  - free text  → catalogue match → local intent → AI intent → chat handoff
 *  - filters only → /properties with the full selection in the URL
 *  - purpose "Sell" → instant redirect to the sell flow
 */

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PropertySearchBar from "@/components/search/PropertySearchBar";
import SearchFallbackContact from "@/components/search/SearchFallbackContact";
import { EMPTY_SEARCH, searchToParams, type PropertySearch } from "@/lib/propertySearch";
import { resolveIntentLocally, handOffToChatSupport } from "@/lib/searchIntent";
import { saveRecentSearch } from "@/lib/searchHistory";
import { toast } from "sonner";

const HERO_TYPEWRITER_PHRASES = [
  "Find me a property in Downtown",
  "I want to sell my property",
  "I want to compare my property",
  "How much is my property valued for?",
  "How much is rent in Marina?",
  "I'm looking for Golden Visa or mortgage",
];

interface HomeHeroSearchProps {
  onBookConsultation?: () => void;
}

export default function HomeHeroSearch({ onBookConsultation }: HomeHeroSearchProps) {
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<PropertySearch>(EMPTY_SEARCH);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackQuery, setFallbackQuery] = useState("");

  const resolveWithAI = useCallback(
    async (q: string): Promise<boolean> => {
      try {
        const { data, error } = await supabase.functions.invoke("ai-search-intent", {
          body: { query: q },
        });
        if (error) throw error;
        const route = (data as { route?: string | null })?.route ?? null;
        const message = (data as { message?: string })?.message ?? "";
        if (route) {
          if (message) toast.success(message);
          navigate(route);
          return true;
        }
      } catch (err) {
        console.warn("[HomeHeroSearch] AI intent resolution failed", err);
      }
      return false;
    },
    [navigate],
  );

  const runSearch = useCallback(
    async (next: PropertySearch) => {
      if (searching) return;

      if (next.purpose === "sell") {
        navigate("/sell");
        return;
      }

      const q = (next.q ?? "").trim();
      if (!q) {
        navigate(`/properties?${searchToParams(next).toString()}`);
        return;
      }

      setSearching(true);
      try {
        saveRecentSearch(q);

        const [projectRes, devRes, areaRes] = await Promise.all([
          supabase
            .from("projects")
            .select("slug,name")
            .ilike("name", q)
            .eq("status", "active")
            .limit(1)
            .maybeSingle(),
          supabase
            .from("developers" as any)
            .select("slug,name")
            .ilike("name", q)
            .limit(1)
            .maybeSingle(),
          supabase
            .from("areas")
            .select("slug,name")
            .ilike("name", q)
            .eq("is_active", true)
            .limit(1)
            .maybeSingle(),
        ]);

        const projectSlug = (projectRes?.data as { slug?: string } | null)?.slug;
        const devSlug = (devRes?.data as { slug?: string } | null)?.slug;
        const areaSlug = (areaRes?.data as { slug?: string } | null)?.slug;

        if (projectSlug) return void navigate(`/project/${projectSlug}`);
        if (devSlug) return void navigate(`/developer/${devSlug}`);
        if (areaSlug) return void navigate(`/area/${areaSlug}`);

        const local = resolveIntentLocally(q);
        if (local?.route) {
          toast.success(local.message);
          navigate(local.route);
          return;
        }

        if (await resolveWithAI(q)) return;

        // Nothing matched anywhere: hand the visitor's own sentence to live
        // chat support. The widget opens with their words already typed and the
        // advisory desk is alerted at the same time.
        toast.info("Nothing matched — our advisory desk will answer this for you.");
        handOffToChatSupport(q, { source: "hero_search", path: window.location.pathname });

      } catch (err) {
        console.warn("[HomeHeroSearch] lookup failed, falling back to /properties", err);
        navigate(`/properties?q=${encodeURIComponent(q)}`);
      } finally {
        setSearching(false);
      }
    },
    [navigate, resolveWithAI, searching],
  );

  const openBooking = () => {
    if (onBookConsultation) onBookConsultation();
    else window.dispatchEvent(new CustomEvent("jbj:open-inquiry"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="w-full max-w-6xl mx-auto"
    >
      <PropertySearchBar
        value={filters}
        onChange={setFilters}
        onSubmit={runSearch}
        dark
        typewriterPhrases={HERO_TYPEWRITER_PHRASES}
        onConsultation={openBooking}
        onSellSelected={() => navigate("/sell")}
      />
      <SearchFallbackContact open={fallbackOpen} onOpenChange={setFallbackOpen} query={fallbackQuery} />
    </motion.div>
  );
}
