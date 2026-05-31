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
        className="w-full max-w-4xl mx-auto"
      >
        {/* Single continuous pill: white search field, then dark action segments */}
        <div
          data-surface="dark"
          className="group relative flex items-stretch h-14 sm:h-[60px] lg:h-[68px] rounded-2xl
            overflow-hidden bg-transparent border border-[#B89555]/55
            focus-within:border-[#B89555] hover:border-[#B89555]/80
            transition-all duration-300"
          style={{
            boxShadow:
              "0 18px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10)",
          }}
        >

          {/* LEFT: input — full white, edge-to-edge until the Search button.
              NOTE: Intentionally NOT wrapped in a <form>. A global rule in
              src/styles/theme-tokens.css forces a 2px blue border on every
              input that lives inside any <form>. Using a div + Enter handler
              keeps the pill clean. */}
          <div
            role="search"
            data-surface="light"
            className="surface-light flex flex-1 items-center pl-5 sm:pl-6 lg:pl-7 pr-3 min-w-0 bg-white"
          >
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
              placeholder="Search projects, developers, areas, tools…"
              aria-label="Search the JBJ website"
              data-surface="light"
              className="flex-1 min-w-0 h-full bg-transparent text-[15px] sm:text-[15.5px] lg:text-base tracking-[-0.005em] font-normal"
              style={{
                color: "#1A1A1A",
                WebkitTextFillColor: "#1A1A1A",
                border: "none",
                outline: "none",
                boxShadow: "none",
                background: "transparent",
              }}
            />
          </div>

          {/* Classic divider between input and Search button — desktop only, full-height gold */}
          <div
            aria-hidden="true"
            className="hidden lg:flex flex-shrink-0 self-stretch w-px"
            style={{ backgroundColor: "#B89555" }}
          />

          {/* Search — white segment merged with input field */}
          <div className="relative flex flex-shrink-0 group/search">
            <button
              type="button"
              onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
              data-surface="light"
              aria-label="Search properties now"
              disabled={searching}
              className="surface-light relative flex items-center justify-center gap-2 self-stretch h-full px-6 lg:px-8
                text-[13.5px] sm:text-sm font-semibold tracking-[-0.005em] flex-shrink-0 bg-white
                disabled:cursor-wait transition-colors duration-200 hover:bg-[#F8F8F8]"
              style={{
                color: "#1A1A1A",
              }}
            >
              <span
                style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
                className="relative inline-block after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-[1.5px] after:bg-[#B89555] after:rounded-full after:transition-all after:duration-300 after:w-0 group-hover/search:after:w-full"
              >
                {searching ? "Searching…" : "Search"}
              </span>
              {searching && (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#1A1A1A" }} strokeWidth={2.4} />
              )}
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 rounded-md
                surface-dark bg-[#1A1A1A] text-white text-[11.5px] font-medium tracking-[-0.005em] whitespace-nowrap
                border border-[#B89555]/55 shadow-lg opacity-0 group-hover/search:opacity-100 z-50"
            >
              Search properties now
            </span>
          </div>

          {/* Free Consultation — fiberglass (dark translucent) with WHITE title.
              NOT navy/blue. Sits on the dark hero so opacity reads through. */}
          <div className="relative hidden md:flex flex-shrink-0 group/book">
            <button
              type="button"
              onClick={openBooking}
              data-surface="ink"
              data-no-contrast-guard
              data-allow-dark-cta
              data-hero-consultation-lock
              aria-label="Book your free consultation now"
              className="allow-white flex items-center justify-center self-stretch h-full px-5 lg:px-6
                text-[13px] lg:text-[13.5px] font-semibold tracking-[-0.005em]
                border-l border-[#B89555]/45
                transition-[background-color] duration-200"
              style={{
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                backgroundColor: "#0F0F0F",
                opacity: 1,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1A1A1A")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0F0F0F")}
            >
              <span
                className="allow-white whitespace-nowrap"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", opacity: 1 }}
              >
                Free Consultation
              </span>
            </button>
            <span
              role="tooltip"
              className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-1.5 rounded-md
                surface-dark bg-[#1A1A1A] text-white text-[11.5px] font-medium tracking-[-0.005em] whitespace-nowrap
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
            data-surface="dark"
            data-hero-consultation-lock
            aria-label="Book your free consultation now"
            className="surface-ink allow-white flex-1 inline-flex items-center justify-center gap-1.5 h-11 rounded-xl px-3
              text-[13px] font-semibold whitespace-nowrap
              border border-[#B89555]/70 bg-[#1A1A1A]/70 backdrop-blur-[2px]
              transition-colors duration-200 hover:bg-[#1A1A1A]/80"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              textShadow: "0 2px 8px rgba(0,0,0,0.72)",
              boxShadow: "inset 0 1px 0 rgba(255,238,200,0.15), 0 10px 26px rgba(0,0,0,0.32)",
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
