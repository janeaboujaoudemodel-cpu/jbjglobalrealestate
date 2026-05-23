/**
 * HomeHeroSearch — premium crystal-glass hero search bar.
 * - Left half: input + Search submit (opens the shared GlobalSearchModal).
 * - Right half: "Ask our AI Concierge" launcher (opens AIConcierge drawer).
 * - No solid gold fills, no hard divider — a hair-thin champagne seam separates the two actions.
 */

import { useState, useCallback, lazy, Suspense } from "react";
import { Search, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const GlobalSearchModal = lazy(() => import("@/components/GlobalSearchModal"));

const openConcierge = () => window.dispatchEvent(new CustomEvent("jbj:open-concierge"));

const QUICK_QUERIES = ["Marina apartments", "Off-plan villas", "Emaar", "Golden Visa", "Palm Jumeirah"];

export default function HomeHeroSearch() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  const [draft, setDraft] = useState("");

  const launch = useCallback((q: string) => {
    setInitialQuery(q);
    setSearchOpen(true);
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    launch(draft.trim());
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Unified crystal-glass shell — input + Search + AI Concierge live together */}
        <div
          data-no-contrast-guard
          className="group relative flex items-stretch h-14 sm:h-16 lg:h-[68px] rounded-2xl
            border border-[#D4B896]/55 bg-[rgba(253,251,247,0.10)]
            backdrop-blur-[18px] saturate-[160%] overflow-hidden
            transition-all duration-300 focus-within:border-[#E2C9A0]/85 hover:border-[#E2C9A0]/75"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.18), 0 0 0 1px rgba(212,184,150,0.25), 0 14px 34px rgba(0,0,0,0.40)",
          }}
        >
          {/* LEFT: input + Search submit */}
          <form
            onSubmit={onSubmit}
            role="search"
            data-no-contrast-guard
            className="flex flex-1 items-center gap-2 pl-5 pr-2 min-w-0"
          >
            <Search className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#E2C9A0] flex-shrink-0" strokeWidth={2} />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search projects, developers, areas, tools…"
              aria-label="Search the JBJ website"
              data-no-contrast-guard
              className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[15px] sm:text-base text-[#FDFBF7] placeholder:text-[#FDFBF7]/65 placeholder:font-light"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.55)" }}
            />
            {/* Search submit — crystal glass, no yellow fill */}
            <button
              type="submit"
              data-no-contrast-guard
              className="hidden sm:inline-flex items-center gap-2 h-10 lg:h-11 px-4 lg:px-5 rounded-xl
                text-[13.5px] font-semibold text-[#FDFBF7]
                bg-[rgba(253,251,247,0.10)] hover:bg-[rgba(253,251,247,0.20)]
                border border-[#D4B896]/45 hover:border-[#E2C9A0]/80
                transition-all flex-shrink-0"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}
            >
              Search
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.2} />
            </button>
            <button
              type="submit"
              data-no-contrast-guard
              aria-label="Search"
              className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl
                text-[#FDFBF7] bg-[rgba(253,251,247,0.10)] border border-[#D4B896]/45 flex-shrink-0"
            >
              <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
            </button>
          </form>

          {/* Hair-thin champagne seam — not a hard divider */}
          <div aria-hidden className="w-px self-stretch my-2 bg-gradient-to-b from-transparent via-[#D4B896]/40 to-transparent" />

          {/* RIGHT: Ask our AI Concierge */}
          <button
            type="button"
            onClick={openConcierge}
            data-no-contrast-guard
            aria-label="Ask our AI Concierge"
            className="flex items-center gap-2 px-3 sm:px-5 flex-shrink-0
              text-[#FDFBF7] hover:bg-[rgba(253,251,247,0.10)] transition-all
              focus-visible:outline-none focus-visible:bg-[rgba(253,251,247,0.10)]"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}
          >
            <Sparkles className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-[#E2C9A0] flex-shrink-0" strokeWidth={2} />
            <span className="hidden md:inline text-[13px] font-semibold whitespace-nowrap">Ask our AI Concierge</span>
            <span className="md:hidden sm:inline hidden text-[12.5px] font-semibold whitespace-nowrap">Ask AI</span>
          </button>
        </div>

        {/* Quick keyword chips — classic premium hover */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span
            className="text-[10.5px] uppercase tracking-[0.18em] text-[#FDFBF7]/60 font-semibold mr-1"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.55)" }}
          >
            Try
          </span>
          {QUICK_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => launch(q)}
              data-no-contrast-guard
              className="hero-chip group/chip relative px-3.5 py-1.5 rounded-full text-[12px] font-medium
                text-[#FDFBF7]/85 hover:text-[#FDFBF7]
                bg-[rgba(253,251,247,0.06)] hover:bg-[rgba(253,251,247,0.12)]
                border border-[#D4B896]/35 hover:border-[#E2C9A0]/70
                transition-[color,background,border-color] duration-200 ease-out"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}
            >
              {q}
            </button>
          ))}
          <button
            type="button"
            onClick={openConcierge}
            data-no-contrast-guard
            className="group/chip inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium
              text-[#FDFBF7]/85 hover:text-[#FDFBF7]
              bg-[rgba(253,251,247,0.06)] hover:bg-[rgba(253,251,247,0.12)]
              border border-[#D4B896]/35 hover:border-[#E2C9A0]/70
              transition-[color,background,border-color] duration-200 ease-out"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.45)" }}
          >
            <Sparkles className="w-3 h-3 text-[#E2C9A0]" strokeWidth={2.2} />
            Ask the Concierge
          </button>
        </div>
      </motion.div>

      {searchOpen && (
        <Suspense fallback={null}>
          <GlobalSearchModal isOpen={searchOpen} initialQuery={initialQuery} onClose={() => setSearchOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
