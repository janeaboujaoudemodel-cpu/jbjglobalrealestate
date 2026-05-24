/**
 * HomeHeroSearch — single-line premium pill containing:
 *   [ search input ][ Search ][ Book a Free Consultation ][ Ask Concierge ]
 *
 * The Search button performs a real top-match lookup against projects /
 * developers / areas and redirects the user to that detail page, or falls back
 * to `/properties?q=<query>` for free-text searches. It does NOT open the
 * header's `GlobalSearchModal` dropdown — that remains exclusive to the header
 * search icon.
 */

import { useState, useCallback } from "react";
import { ArrowRight, CalendarCheck, Sparkles, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { saveRecentSearch } from "@/lib/searchHistory";

interface HomeHeroSearchProps {
  onBookConsultation?: () => void;
}

export default function HomeHeroSearch({ onBookConsultation }: HomeHeroSearchProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [searching, setSearching] = useState(false);

  const runSearch = useCallback(async () => {
    if (searching) return;
    const q = draft.trim();
    if (!q) {
      navigate("/properties");
      return;
    }

    setSearching(true);
    try {
      saveRecentSearch(q);

      // Top-match lookup against the same tables GlobalSearchModal queries.
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

      if (projectSlug) {
        navigate(`/project/${projectSlug}`);
      } else if (devSlug) {
        navigate(`/developer/${devSlug}`);
      } else if (areaSlug) {
        navigate(`/area/${areaSlug}`);
      } else {
        navigate(`/properties?q=${encodeURIComponent(q)}`);
      }
    } catch (err) {
      console.warn("[HomeHeroSearch] lookup failed, falling back to /properties", err);
      navigate(`/properties?q=${encodeURIComponent(q)}`);
    } finally {
      setSearching(false);
    }
  }, [draft, navigate, searching]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runSearch();
  };

  const openConcierge = () => {
    window.dispatchEvent(new CustomEvent("jbj:open-concierge"));
  };

  const openBooking = () => {
    if (onBookConsultation) onBookConsultation();
    else window.dispatchEvent(new CustomEvent("jbj:open-inquiry"));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="w-full max-w-5xl mx-auto"
      >
        {/* Premium glass shell holding input + 3 CTAs inline */}
        <div
          data-no-contrast-guard
          className="group relative flex items-stretch h-14 sm:h-[60px] lg:h-[68px] rounded-2xl
            border border-[#B89555]/45 overflow-hidden
            transition-all duration-300 focus-within:border-[#B89555]/75 hover:border-[#B89555]/65"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(247,242,234,0.92) 100%)",
            backdropFilter: "blur(14px) saturate(140%)",
            WebkitBackdropFilter: "blur(14px) saturate(140%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(184,149,85,0.12), 0 10px 28px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)",
          }}
        >

          {/* LEFT: input */}
          <form
            onSubmit={onSubmit}
            role="search"
            data-no-contrast-guard
            className="flex flex-1 items-center pl-5 sm:pl-6 lg:pl-7 pr-3 min-w-0"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search projects, developers, areas, tools…"
              aria-label="Search the JBJ website"
              data-no-contrast-guard
              className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[15px] sm:text-[15.5px] lg:text-base text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 placeholder:font-light tracking-[-0.005em]"
            />
          </form>

          {/* Search — obsidian pill */}
          <button
            type="button"
            onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            data-no-contrast-guard
            aria-label="Search"
            disabled={searching}
            className="cta-premium allow-white flex items-center justify-center gap-2 h-full px-4 sm:px-6 lg:px-7
              text-[13.5px] sm:text-sm font-semibold border-l border-[#B89555]/45 flex-shrink-0
              disabled:cursor-wait"
            style={{
              color: "#FFFFFF",
              background:
                "linear-gradient(180deg, #2A2A2A 0%, #1A1A1A 55%, #141414 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.45)",
            }}
          >
            <span style={{ color: "#FFFFFF" }} className="tracking-[-0.005em] allow-white">
              {searching ? "Searching…" : "Search"}
            </span>
            {searching ? (
              <Loader2 className="w-4 h-4 allow-white animate-spin" style={{ color: "#FFFFFF" }} data-no-contrast-guard strokeWidth={2.4} />
            ) : (
              <ArrowRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF" }} data-no-contrast-guard strokeWidth={2.4} />
            )}
          </button>


          {/* Book a Free Consultation — champagne pill */}
          <button
            type="button"
            onClick={openBooking}
            data-no-contrast-guard
            aria-label="Book a Free Consultation"
            className="hidden md:flex items-center justify-center gap-2 h-full px-4 lg:px-6
              text-[13px] lg:text-[13.5px] font-semibold tracking-[-0.005em]
              text-[#1A1A1A] border-l border-[#B89555]/45 flex-shrink-0
              transition-colors duration-200 hover:bg-[#EFE6D6]"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(239,230,214,0.85) 100%)",
            }}
          >
            <CalendarCheck className="w-4 h-4 text-[#B89555]" strokeWidth={2.2} />
            <span className="whitespace-nowrap">Book a Free Consultation</span>
          </button>

          {/* Ask Concierge — gold-tinted pill, rounded right */}
          <button
            type="button"
            onClick={openConcierge}
            data-no-contrast-guard
            aria-label="Ask the JBJ Concierge"
            className="hidden sm:flex items-center justify-center gap-2 h-full px-4 lg:px-6
              text-[13px] lg:text-[13.5px] font-semibold tracking-[-0.005em]
              text-[#1A1A1A] border-l border-[#B89555]/45 rounded-r-2xl flex-shrink-0
              transition-colors duration-200 hover:bg-[#EFE6D6]"
            style={{
              background:
                "linear-gradient(180deg, rgba(239,230,214,0.95) 0%, rgba(231,217,193,0.95) 100%)",
            }}
          >
            <Sparkles className="w-4 h-4 text-[#B89555]" strokeWidth={2.2} />
            <span className="whitespace-nowrap">Ask Concierge</span>
          </button>
        </div>

        {/* Mobile-only stacked CTAs (md and below hides Book inline; sm hides Concierge inline) */}
        <div className="mt-3 flex sm:hidden gap-2">
          <button
            type="button"
            onClick={openBooking}
            data-no-contrast-guard
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl px-3
              text-[13px] font-semibold text-[#1A1A1A] border border-[#B89555]/45 bg-[#FDFBF7] hover:bg-[#EFE6D6]"
          >
            <CalendarCheck className="w-4 h-4 text-[#B89555]" strokeWidth={2.2} />
            <span className="whitespace-nowrap">Book Consultation</span>
          </button>
          <button
            type="button"
            onClick={openConcierge}
            data-no-contrast-guard
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl px-3
              text-[13px] font-semibold text-[#1A1A1A] border border-[#B89555]/45 bg-[#EFE6D6] hover:bg-[#E7D9C1]"
          >
            <Sparkles className="w-4 h-4 text-[#B89555]" strokeWidth={2.2} />
            <span className="whitespace-nowrap">Ask Concierge</span>
          </button>
        </div>

      </motion.div>
    </>
  );
}

