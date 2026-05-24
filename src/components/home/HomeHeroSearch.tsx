/**
 * HomeHeroSearch — minimal white pill search bar.
 * - Single shell: input on the left, full-edge "Search" submit pill on the right.
 * - Concierge launcher lives in the global header; not duplicated here.
 */

import { useState, useCallback, lazy, Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const GlobalSearchModal = lazy(() => import("@/components/GlobalSearchModal"));

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
        {/* Minimal white pill shell */}
        <div
          data-no-contrast-guard
          className="group relative flex items-stretch h-14 sm:h-16 lg:h-[68px] rounded-2xl
            border border-[#B89555]/40 bg-[rgba(253,251,247,0.92)]
            backdrop-blur-[10px] overflow-hidden
            transition-all duration-300 focus-within:border-[#B89555]/70 hover:border-[#B89555]/60"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.6), 0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          {/* LEFT: input — no magnifier icon */}
          <form
            onSubmit={onSubmit}
            role="search"
            data-no-contrast-guard
            className="flex flex-1 items-center pl-5 pr-3 min-w-0"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search projects, developers, areas, tools…"
              aria-label="Search the JBJ website"
              data-no-contrast-guard
              className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none text-[15px] sm:text-base text-[#1A1A1A] placeholder:text-[#1A1A1A]/55 placeholder:font-light"
            />
          </form>

          {/* RIGHT: full-edge Search submit pill */}
          <button
            type="button"
            onClick={onSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            data-no-contrast-guard
            aria-label="Search"
            className="cta-premium flex items-center justify-center gap-2 h-full px-5 sm:px-7 lg:px-8
              text-[13.5px] sm:text-sm font-semibold text-white bg-[#1A1A1A]
              border-l border-[#B89555]/40 rounded-r-2xl
              transition-all duration-300 flex-shrink-0 allow-white"
          >
            <span className="hidden sm:inline">Search</span>
            <ArrowRight className="w-4 h-4 text-white allow-white" data-no-contrast-guard strokeWidth={2.2} />
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
