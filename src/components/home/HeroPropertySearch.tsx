/**
 * HeroPropertySearch — Premium glass search bar for the hero section.
 * Replaces the three pillar cards (Premium Marketplace / AI-Powered Tools /
 * Brokerage Services). Submits to /properties?q=...
 */

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const HeroPropertySearch = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    navigate(trimmed ? `/properties?q=${encodeURIComponent(trimmed)}` : "/properties");
  };

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      role="search"
      aria-label="Search properties"
      className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto"
    >
      <div
        className="relative flex items-center gap-2 sm:gap-3 rounded-2xl p-2 sm:p-2.5"
        style={{
          background: "rgba(253, 251, 247, 0.10)",
          WebkitBackdropFilter: "blur(18px) saturate(160%)",
          backdropFilter: "blur(18px) saturate(160%)",
          border: "1px solid rgba(212, 184, 150, 0.55)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.18), 0 14px 36px rgba(0,0,0,0.42), 0 0 0 1px rgba(226,201,160,0.18)",
        }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0"
          style={{
            background: "rgba(226,201,160,0.12)",
            border: "1px solid rgba(212,184,150,0.45)",
          }}
        >
          <MapPin className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#E2C9A0" }} />
        </div>

        <label htmlFor="hero-property-search" className="sr-only">
          Search properties, developers, or areas
        </label>
        <input
          id="hero-property-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects, developers, or areas in Dubai…"
          autoComplete="off"
          data-no-contrast-guard
          className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm sm:text-base font-medium tracking-tight placeholder:font-normal"
          style={{
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
            textShadow: "0 1px 3px rgba(0,0,0,0.65)",
          }}
        />

        <button
          type="submit"
          data-no-contrast-guard
          aria-label="Search"
          className="group inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-4 sm:px-6 rounded-xl text-sm font-semibold tracking-tight transition-[transform,box-shadow,border-color,background] duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2C9A0]/65"
          style={{
            background:
              "linear-gradient(180deg, rgba(226,201,160,0.95) 0%, rgba(184,149,85,0.95) 100%)",
            color: "#1A1A1A",
            border: "1px solid rgba(226,201,160,0.85)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.35), 0 8px 22px rgba(0,0,0,0.35)",
          }}
        >
          <Search className="w-4 h-4" strokeWidth={2.25} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Quick hints */}
      <div className="mt-2.5 sm:mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11px]">
        {["Downtown", "Dubai Marina", "Palm Jumeirah", "EMAAR", "DAMAC"].map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => navigate(`/properties?q=${encodeURIComponent(chip)}`)}
            data-no-contrast-guard
            className="px-2.5 py-1 rounded-full font-medium tracking-tight transition-colors"
            style={{
              background: "rgba(253, 251, 247, 0.08)",
              border: "1px solid rgba(212,184,150,0.45)",
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              textShadow: "0 1px 2px rgba(0,0,0,0.7)",
            }}
          >
            {chip}
          </button>
        ))}
      </div>
    </motion.form>
  );
};

export default HeroPropertySearch;
