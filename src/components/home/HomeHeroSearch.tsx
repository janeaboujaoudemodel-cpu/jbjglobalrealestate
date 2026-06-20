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
import { CalendarCheck, Loader2 } from "lucide-react";
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
            the same emerald/black gradient surface with an emerald-only glow ring.
            NO gold dividers, NO light-green outline rings — only the approved emerald system. */}
        <div
          data-surface="dark"
          data-ink-emerald
          data-no-contrast-guard
          className="jj-hero-search-bar group relative flex items-stretch h-14 sm:h-[60px] lg:h-[68px] rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            backgroundImage: "var(--jj-emerald-ombre)",
            border: "1px solid rgba(52,211,153,0.55)",
            boxShadow:
              "0 0 0 1px rgba(52,211,153,0.18), 0 0 32px rgba(52,211,153,0.30), 0 18px 42px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.10)",
          }}
        >
          {/* INPUT segment — transparent on emerald, white text + animated placeholder */}
          <div role="search" className="relative flex flex-1 items-center pl-5 sm:pl-6 lg:pl-7 pr-3 min-w-0">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
              aria-label="Search the JBJ website"
              data-no-contrast-guard
              className="jj-hero-search-input flex-1 min-w-0 h-full bg-transparent text-[15px] sm:text-[15.5px] lg:text-base tracking-[-0.005em] font-normal"
              style={{
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                caretColor: "#FFFFFF",
                border: "none",
                outline: "none",
                boxShadow: "none",
                background: "transparent",
              }}
            />
            {/* Animated typewriter placeholder — only when empty, no interaction blocking */}
            {!draft && (
              <span
                aria-hidden="true"
                className="jj-hero-typewriter pointer-events-none absolute left-5 sm:left-6 lg:left-7 top-1/2 -translate-y-1/2 text-[15px] sm:text-[15.5px] lg:text-base font-normal whitespace-nowrap overflow-hidden"
                style={{
                  color: "rgba(255,255,255,0.78)",
                  WebkitTextFillColor: "rgba(255,255,255,0.78)",
                  maxWidth: "calc(100% - 16px)",
                }}
              />
            )}
          </div>

          {/* SEARCH button — slightly brighter emerald with white text */}
          <button
            type="button"
            onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            aria-label="Search properties now"
            disabled={searching}
            data-no-contrast-guard
            className="relative flex items-center justify-center gap-2 self-stretch h-full px-6 lg:px-8 text-[13.5px] sm:text-sm font-semibold tracking-[-0.005em] flex-shrink-0 disabled:cursor-wait transition-all duration-200 hover:brightness-110"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              backgroundImage: "var(--jj-emerald-light-ombre)",
              borderLeft: "1px solid rgba(52,211,153,0.45)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
          >
            <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              {searching ? "Searching…" : "Search"}
            </span>
            {searching && (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#FFFFFF" }} strokeWidth={2.4} />
            )}
          </button>

          {/* FREE CONSULTATION — same emerald system, emerald hairline (no gold) */}
          <button
            type="button"
            onClick={openBooking}
            aria-label="Book your free consultation now"
            data-no-contrast-guard
            className="hidden md:flex items-center justify-center self-stretch h-full px-5 lg:px-6 text-[13px] lg:text-[13.5px] font-semibold tracking-[-0.005em] transition-all duration-200 hover:brightness-110"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              backgroundImage: "var(--jj-emerald-ombre)",
              borderLeft: "1px solid rgba(52,211,153,0.45)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            <span className="whitespace-nowrap" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              Free Consultation
            </span>
          </button>

        </div>


        {/* Mobile-only stacked CTAs — champagne mother-of-pearl fiberglass */}
        <div className="mt-3 flex sm:hidden gap-2">
          <button
            type="button"
            onClick={openBooking}
            data-hero-consultation-lock
            aria-label="Book your free consultation now"
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl px-3
              text-[13px] font-semibold whitespace-nowrap text-[#1A1A1A]
              border border-[#B89555]/55
              transition-colors duration-200"
            style={{
              color: "#1A1A1A",
              background: "linear-gradient(180deg, rgba(247,242,234,0.82) 0%, rgba(239,230,214,0.74) 100%)",
              backdropFilter: "blur(16px) saturate(150%)",
              WebkitBackdropFilter: "blur(16px) saturate(150%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 22px rgba(26,26,26,0.18)",
            }}
          >
            <CalendarCheck className="w-4 h-4" strokeWidth={2.2} style={{ color: "#1A1A1A" }} />
            <span style={{ color: "#1A1A1A" }}>Free Consultation</span>
          </button>
        </div>


      </motion.div>
    </>
  );
}
