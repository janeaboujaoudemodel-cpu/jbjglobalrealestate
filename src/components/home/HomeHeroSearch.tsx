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
        className="w-full max-w-6xl mx-auto"
      >
        {/* Single continuous pill: white search field, then dark action segments */}
        <div
          data-no-contrast-guard
          className="group relative flex items-stretch h-14 sm:h-[60px] lg:h-[68px] rounded-2xl
            border border-[#B89555]/55 overflow-hidden bg-transparent
            transition-all duration-300 focus-within:border-[#B89555] hover:border-[#B89555]/80"
          style={{
            boxShadow:
              "0 18px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)",
          }}
        >

          {/* LEFT: input — full white, edge-to-edge until the Search button */}
          <form
            onSubmit={onSubmit}
            role="search"
            data-no-contrast-guard
            className="flex flex-1 items-center pl-5 sm:pl-6 lg:pl-7 pr-3 min-w-0 bg-white"
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

          {/* Gold divider between input and Search */}
          <span aria-hidden className="self-stretch w-px bg-[#B89555] flex-shrink-0" />

          {/* Search — white segment merged with input field */}
          <div className="relative flex flex-shrink-0 group/search">
            <button
              type="button"
              onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
              data-no-contrast-guard
              aria-label="Search properties now"
              disabled={searching}
              className="relative flex items-center justify-center gap-2 self-stretch h-full px-6 lg:px-8
                text-[13.5px] sm:text-sm font-semibold tracking-[-0.005em] flex-shrink-0 bg-white
                disabled:cursor-wait transition-colors duration-200 hover:bg-[#F8F8F8]"
              style={{
                color: "#1A1A1A",
              }}
            >
              <span
                style={{ color: "#B89555", WebkitTextFillColor: "#B89555" }}
                className="relative inline-block after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:bg-[#B89555] after:rounded-full after:transition-all after:duration-300 after:w-0 group-hover/search:after:w-full"
              >
                {searching ? "Searching…" : "Search"}
              </span>
              {searching && (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#1A1A1A" }} data-no-contrast-guard strokeWidth={2.4} />
              )}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 rounded-md
                bg-[#1A1A1A] text-white text-[11.5px] font-medium tracking-[-0.005em] whitespace-nowrap
                border border-[#B89555]/55 shadow-lg opacity-0 group-hover/search:opacity-100 z-50"
            >
              Search properties now
            </span>
          </div>

          {/* Gold divider */}
          <span aria-hidden className="hidden md:block self-stretch w-px bg-[#B89555]/55 flex-shrink-0" />

          {/* Free Consultation — text only, with instant hover tooltip */}
          <div className="relative hidden md:flex flex-shrink-0 group/book">
            <button
              type="button"
              onClick={openBooking}
              data-no-contrast-guard
              aria-label="Book your free consultation now"
              className="allow-white flex items-center justify-center self-stretch h-full px-5 lg:px-6
                text-[13px] lg:text-[13.5px] font-semibold tracking-[-0.005em] bg-[#1A1A1A]
                transition-colors duration-200 hover:bg-[#2A2A2A]"
              style={{
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
              }}
            >
              <span
                className="allow-white whitespace-nowrap"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              >
                Free Consultation
              </span>
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 rounded-md
                bg-[#1A1A1A] text-white text-[11.5px] font-medium tracking-[-0.005em] whitespace-nowrap
                border border-[#B89555]/55 shadow-lg opacity-0 group-hover/book:opacity-100 z-50"
            >
              Book your free consultation now
            </span>
          </div>

        </div>


        {/* Mobile-only stacked CTAs — fiberglass style (no fill), white text on dark hero */}
        <div className="mt-3 flex sm:hidden gap-2">
          <button
            type="button"
            onClick={openBooking}
            data-no-contrast-guard
            aria-label="Book your free consultation now"
            className="allow-white flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl px-3
              text-[13px] font-semibold whitespace-nowrap
              border border-[#B89555]/70 bg-transparent backdrop-blur-[2px]
              transition-colors duration-200 hover:bg-white/5"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              boxShadow: "inset 0 1px 0 rgba(255,238,200,0.15)",
            }}
          >
            <CalendarCheck className="allow-white w-4 h-4" strokeWidth={2.2} style={{ color: "#FFFFFF" }} />
            <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              Free Consultation
            </span>
          </button>
        </div>

      </motion.div>
    </>
  );
}
