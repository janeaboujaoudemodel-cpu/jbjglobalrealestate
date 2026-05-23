/**
 * HomeHeroSearch — premium long-stretch search bar for the homepage hero.
 * Reuses the GlobalSearchModal so behaviour is 100% consistent with the
 * header search icon (same index, role-aware shortcuts, DB results,
 * nearest-match fallback, Contact JBJ panel).
 */

import { useState, useCallback, lazy, Suspense } from "react";
import { Search, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const GlobalSearchModal = lazy(() => import("@/components/GlobalSearchModal"));

const QUICK_QUERIES = ["Marina apartments", "Off-plan villas", "Emaar", "Golden Visa", "Palm Jumeirah"];

export default function HomeHeroSearch() {
  const [open, setOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");
  const [draft, setDraft] = useState("");

  const launch = useCallback((q: string) => {
    setInitialQuery(q);
    setOpen(true);
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
        <form
          onSubmit={onSubmit}
          role="search"
          data-no-contrast-guard
          className="group relative flex items-center gap-2 h-14 sm:h-16 lg:h-[68px] pl-5 pr-2 rounded-2xl border border-[#D4B896]/65 bg-[rgba(253,251,247,0.10)] backdrop-blur-[18px] saturate-[160%] transition-all duration-300 hover:border-[#E2C9A0] focus-within:border-[#E2C9A0]"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(212,184,150,0.30), 0 14px 34px rgba(0,0,0,0.40), 0 0 22px rgba(226,201,160,0.16)",
          }}
        >
          <Search className="w-5 h-5 sm:w-[22px] sm:h-[22px] text-[#E2C9A0] flex-shrink-0" strokeWidth={2} />
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => launch(draft)}
            placeholder="Search projects, developers, areas, tools…"
            aria-label="Search the JBJ website"
            data-no-contrast-guard
            className="flex-1 h-full bg-transparent border-0 outline-none text-[15px] sm:text-base text-[#FDFBF7] placeholder:text-[#FDFBF7]/65 placeholder:font-light"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.55)" }}
          />
          <button
            type="submit"
            data-no-contrast-guard
            className="hidden sm:inline-flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-[#1A1A1A] bg-[#E2C9A0] hover:bg-[#EBD3AA] border border-[#B89555]/80 transition-all flex-shrink-0"
          >
            Search
            <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
          <button
            type="submit"
            data-no-contrast-guard
            aria-label="Search"
            className="sm:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl text-[#1A1A1A] bg-[#E2C9A0] border border-[#B89555]/80 flex-shrink-0"
          >
            <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </form>

        {/* Quick keyword chips */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-[11px] uppercase tracking-[0.18em] text-[#FDFBF7]/65 font-semibold mr-1" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.55)" }}>
            Try
          </span>
          {QUICK_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => launch(q)}
              data-no-contrast-guard
              className="px-3 py-1 rounded-full text-[11.5px] font-medium text-[#FDFBF7] bg-[rgba(253,251,247,0.08)] border border-[#D4B896]/45 hover:border-[#E2C9A0] hover:bg-[rgba(253,251,247,0.16)] transition-all"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.45)" }}
            >
              {q}
            </button>
          ))}
        </div>
      </motion.div>

      {open && (
        <Suspense fallback={null}>
          <GlobalSearchModal isOpen={open} initialQuery={initialQuery} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
