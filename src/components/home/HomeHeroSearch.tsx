/**
 * HomeHeroSearch — single-line premium crystal pill containing:
 *   [ search input ][ Search ][ Book a Free Consultation ][ Concierge ]
 *
 * The Search button performs a real top-match lookup against projects /
 * developers / areas and redirects to that detail page, or falls back to
 * `/properties?q=<query>` for free-text searches. It does NOT open the
 * header's `GlobalSearchModal` dropdown — that remains exclusive to the
 * header search icon.
 *
 * HOVER RULE (project standard):
 *   Hover states MUST keep the title visible. Use gold (#B89555) or ink
 *   (#1A1A1A) to elevate the label — never fade or hide it.
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
        className="w-full max-w-6xl mx-auto"
      >
        {/* Frosted glass shell — single continuous pill with gold seams */}
        <div
          data-no-contrast-guard
          className="group relative flex items-stretch h-14 sm:h-[60px] lg:h-[68px] rounded-2xl
            border border-[#B89555]/55 overflow-hidden bg-[rgba(253,251,247,0.46)] backdrop-blur-xl backdrop-saturate-150
            transition-all duration-300 focus-within:border-[#B89555] hover:border-[#B89555]/80"
          style={{
            WebkitBackdropFilter: "blur(22px) saturate(170%)",
            backdropFilter: "blur(22px) saturate(170%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.58), inset 0 -1px 0 rgba(184,149,85,0.18), 0 18px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)",
          }}
        >

          {/* LEFT: input — frosted glass, ink text */}
          <form
            onSubmit={onSubmit}
            role="search"
            data-no-contrast-guard
            className="flex flex-1 items-center pl-5 sm:pl-6 lg:pl-7 pr-3 min-w-0 bg-[rgba(253,251,247,0.18)]"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search projects, developers, areas, tools…"
              aria-label="Search the JBJ website"
              data-no-contrast-guard
              className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[15px] sm:text-[15.5px] lg:text-base tracking-[-0.005em] font-normal"
              style={{
                color: "#1A1A1A",
                WebkitTextFillColor: "#1A1A1A",
              }}
            />
          </form>

          {/* Search — obsidian segment, full edge-to-edge */}
          <button
            type="button"
            onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            data-no-contrast-guard
            aria-label="Search"
            disabled={searching}
            className="cta-premium allow-white group/search relative flex items-center justify-center gap-2 self-stretch h-full px-6 lg:px-8
              text-[13.5px] sm:text-sm font-semibold tracking-[-0.005em] flex-shrink-0
              disabled:cursor-wait transition-colors duration-200 hover:bg-[#2A2A2A]"
            style={{
              color: "#FFFFFF",
              background: "#1A1A1A",
              boxShadow: "inset 1px 0 0 rgba(184,149,85,0.45)",
            }}
          >
            <span
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              className="allow-white relative inline-block after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:bg-[#B89555] after:rounded-full after:transition-all after:duration-300 after:w-0 group-hover/search:after:w-full"
            >
              {searching ? "Searching…" : "Search"}
            </span>
            {searching ? (
              <Loader2 className="w-4 h-4 allow-white animate-spin" style={{ color: "#FFFFFF" }} data-no-contrast-guard strokeWidth={2.4} />
            ) : (
              <ArrowRight
                className="w-4 h-4 allow-white transition-transform duration-200 group-hover/search:translate-x-0.5"
                style={{ color: "#FFFFFF" }}
                data-no-contrast-guard
                strokeWidth={2.4}
              />
            )}
          </button>

          {/* Free Consultation — same frosted-glass segment as search */}
          <button
            type="button"
            onClick={openBooking}
            data-no-contrast-guard
            aria-label="Book a Free Consultation"
            className="group/book hidden md:flex items-center justify-center gap-2 self-stretch h-full px-5 lg:px-6
              text-[13px] lg:text-[13.5px] font-semibold tracking-[-0.005em] bg-white bg-[rgba(253,251,247,0.18)]
              border-l border-[#B89555]/55 flex-shrink-0
              transition-colors duration-200 hover:bg-[rgba(253,251,247,0.28)]"
            style={{
              color: "#1A1A1A",
              WebkitTextFillColor: "#1A1A1A",
              backgroundColor: "rgba(253,251,247,0.18)",
              WebkitBackdropFilter: "blur(22px) saturate(170%)",
              backdropFilter: "blur(22px) saturate(170%)",
            }}
          >
            <CalendarCheck className="w-4 h-4 text-[#B89555] transition-transform duration-200 group-hover/book:scale-110" strokeWidth={2.2} />
            <span
              className="whitespace-nowrap transition-colors duration-200 group-hover/book:text-[#B89555]"
              style={{ WebkitTextFillColor: "currentColor" }}
            >
              Free Consultation
            </span>
          </button>

          {/* Concierge — same frosted-glass segment as search */}
          <button
            type="button"
            onClick={openConcierge}
            data-no-contrast-guard
            aria-label="Open the JBJ Concierge"
            title="JBJ Concierge"
            className="group/conc hidden sm:flex items-center justify-center self-stretch h-full px-4 lg:px-5 bg-white bg-[rgba(253,251,247,0.18)]
              border-l border-[#B89555]/55 rounded-r-2xl flex-shrink-0
              transition-colors duration-200 hover:bg-[rgba(253,251,247,0.28)]"
            style={{
              backgroundColor: "rgba(253,251,247,0.18)",
              WebkitBackdropFilter: "blur(22px) saturate(170%)",
              backdropFilter: "blur(22px) saturate(170%)",
            }}
          >
            <Sparkles
              className="w-[18px] h-[18px] text-[#B89555] transition-transform duration-200 group-hover/conc:scale-110 group-hover/conc:rotate-12"
              strokeWidth={2.2}
            />
          </button>
        </div>


        {/* Mobile-only stacked CTAs */}
        <div className="mt-3 flex sm:hidden gap-2">
          <button
            type="button"
            onClick={openBooking}
            data-no-contrast-guard
            className="group/bookm flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl px-3
              text-[13px] font-semibold text-[#1A1A1A] border border-[#B89555]/55 bg-[#FDFBF7]/85
              transition-colors duration-200 hover:bg-[#EFE6D6]"
          >
            <CalendarCheck className="w-4 h-4 text-[#B89555]" strokeWidth={2.2} />
            <span className="whitespace-nowrap transition-colors duration-200 group-hover/bookm:text-[#B89555]">
              Free Consultation
            </span>
          </button>
          <button
            type="button"
            onClick={openConcierge}
            data-no-contrast-guard
            aria-label="JBJ Concierge"
            title="JBJ Concierge"
            className="group/concm inline-flex items-center justify-center h-11 w-11 rounded-xl
              border border-[#B89555]/55 bg-[#EFE6D6]
              transition-colors duration-200 hover:bg-[#E7D9C1]"
          >
            <Sparkles className="w-[18px] h-[18px] text-[#B89555] transition-transform duration-200 group-hover/concm:scale-110" strokeWidth={2.2} />
          </button>
        </div>

      </motion.div>
    </>
  );
}
