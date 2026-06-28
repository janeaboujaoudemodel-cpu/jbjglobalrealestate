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
import { CalendarCheck, Loader2, Search as SearchIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTypewriter } from "@/hooks/useTypewriter";

const HERO_TYPEWRITER_PHRASES = [
  "Find me a property in Downtown",
  "I want to sell my property",
  "I want to compare my property",
  "How much is my property valued for?",
  "How much is rent in Marina?",
  "I'm looking for Golden Visa or mortgage",
];
import { saveRecentSearch } from "@/lib/searchHistory";

interface HomeHeroSearchProps {
  onBookConsultation?: () => void;
}

export default function HomeHeroSearch({ onBookConsultation }: HomeHeroSearchProps) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [searching, setSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  // Pause typewriter whenever user is focused on the field OR has typed anything.
  // Resumes automatically once the field loses focus AND is empty again.
  const animatedPlaceholder = useTypewriter(HERO_TYPEWRITER_PHRASES, {
    paused: isFocused || draft.length > 0,
  });


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
        className="w-full max-w-4xl mx-auto"
      >
        {/* Unified emerald-ombre search bar: input + Search + Free Consultation all share
            the SAME emerald/black gradient surface — NO color split between segments.
            NO gold dividers, NO gold borders. Animated emerald glow border wraps the bar. */}
        <div className="jj-emerald-glow-wrap jj-emerald-pill jj-hero-search-premium relative rounded-[28px]">
        <div
          data-surface="dark"
          data-ink-emerald
          data-no-contrast-guard
          className="allow-white jj-hero-search-bar group relative flex items-stretch h-16 sm:h-[68px] lg:h-[76px] rounded-[28px] overflow-hidden pl-1 pr-1.5 sm:pr-2 gap-1.5 sm:gap-2"
          style={{
            backgroundImage: "var(--jj-emerald-ombre)",
            border: "0",
            boxShadow:
              "0 18px 40px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.25)",
          }}
        >
          {/* INPUT segment — transparent on emerald, white text + animated placeholder */}
          <div role="search" className="relative flex flex-1 items-center pl-5 sm:pl-6 lg:pl-7 pr-3 min-w-0 cursor-text">
            <SearchIcon
              aria-hidden="true"
              className="hidden sm:block absolute left-5 sm:left-5 lg:left-6 top-1/2 -translate-y-1/2 w-[18px] h-[18px] opacity-80 pointer-events-none"
              style={{ color: "#FFFFFF" }}
              strokeWidth={2.2}
            />
            {!draft && !isFocused && (
              <span
                aria-hidden="true"
                className="allow-white pointer-events-none absolute left-5 sm:left-[52px] lg:left-[58px] top-1/2 -translate-y-1/2 text-[15px] sm:text-[15.5px] lg:text-base font-normal whitespace-nowrap overflow-hidden z-[1]"
                style={{
                  color: "rgba(255,255,255,0.78)",
                  WebkitTextFillColor: "rgba(255,255,255,0.78)",
                  maxWidth: "calc(100% - 16px)",
                }}
              >
                {animatedPlaceholder}
                <span className="jj-type-caret" aria-hidden="true">|</span>
              </span>
            )}
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
              aria-label="Search the JBJ website"
              data-no-contrast-guard
              tabIndex={0}
              className="allow-white jj-hero-search-input relative z-10 flex-1 min-w-0 h-full bg-transparent text-[15px] sm:text-[15.5px] lg:text-base tracking-[-0.005em] font-normal cursor-text sm:pl-[34px] lg:pl-[40px]"
              style={{
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                caretColor: "#FFFFFF",
                border: "none",
                outline: "none",
                boxShadow: "none",
                background: "transparent",
                pointerEvents: "auto",
              }}
            />
          </div>

          {/* SEARCH button — PRIMARY raised metallic emerald pill, white text + icon. */}
          <button
            type="button"
            onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            aria-label="Search properties now"
            data-variant="primary"
            disabled={searching}
            data-no-contrast-guard
            className="allow-white jj-hero-search-action group/sb relative my-1.5 sm:my-2 flex items-center justify-center gap-2 h-[calc(100%-12px)] sm:h-[calc(100%-16px)] rounded-full px-5 sm:px-6 lg:px-7 text-[13.5px] sm:text-sm font-semibold tracking-[-0.005em] flex-shrink-0 disabled:cursor-wait transition-all duration-200 hover:brightness-[1.08] active:scale-[0.98]"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              backgroundImage:
                "linear-gradient(180deg, #1F8A6A 0%, #16664E 55%, #0E4A38 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.30), inset 0 -1px 0 rgba(0,0,0,0.35), 0 6px 14px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.08)",
            }}
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#FFFFFF" }} strokeWidth={2.4} />
            ) : (
              <SearchIcon className="w-4 h-4" style={{ color: "#FFFFFF" }} strokeWidth={2.4} />
            )}
            <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              {searching ? "Searching…" : "Search"}
            </span>
          </button>

          {/* FREE CONSULTATION — SECONDARY champagne pill with emerald ink for clear hierarchy. */}
          <button
            type="button"
            onClick={openBooking}
            aria-label="Book your free consultation now"
            data-variant="champagne"
            data-no-contrast-guard
            className="jj-hero-search-action hidden sm:flex relative my-1.5 sm:my-2 items-center justify-center gap-1.5 h-[calc(100%-12px)] sm:h-[calc(100%-16px)] rounded-full px-4 sm:px-5 lg:px-6 text-[12.5px] sm:text-[13px] lg:text-[13.5px] font-semibold tracking-[-0.005em] flex-shrink-0 transition-all duration-200 hover:brightness-[1.03] active:scale-[0.98]"
            style={{
              color: "#0E4A38",
              WebkitTextFillColor: "#0E4A38",
              backgroundImage:
                "linear-gradient(180deg, #FDFBF7 0%, #F3EADB 100%)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(184,149,85,0.25), 0 6px 14px rgba(0,0,0,0.28), 0 0 0 1px rgba(184,149,85,0.45)",
            }}
          >
            <CalendarCheck className="w-4 h-4" strokeWidth={2.2} style={{ color: "#0E4A38" }} />
            <span className="whitespace-nowrap" style={{ color: "#0E4A38", WebkitTextFillColor: "#0E4A38" }}>
              Free Consultation
            </span>
          </button>

        </div>
        </div>

        {/* SECOND-ROW Free Consultation — compact phones only (<640px).
            Full-width emerald pill matching the bar surface for visual cohesion. */}
        <button
          type="button"
          onClick={openBooking}
          aria-label="Book your free consultation now"
          data-no-contrast-guard
          data-surface="dark"
          className="allow-white sm:hidden mt-3 w-full flex items-center justify-center gap-2 h-12 rounded-2xl text-[14px] font-semibold tracking-[-0.005em] transition-all duration-200 hover:brightness-110"
          style={{
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            backgroundImage: "var(--jj-emerald-ombre)",
            boxShadow:
              "0 10px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          <CalendarCheck className="w-4 h-4" strokeWidth={2.2} style={{ color: "#FFFFFF" }} />
          <span className="whitespace-nowrap" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
            Book a Free Consultation
          </span>
        </button>




      </motion.div>
    </>
  );
}
