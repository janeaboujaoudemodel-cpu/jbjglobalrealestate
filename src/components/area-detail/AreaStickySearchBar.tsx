import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FilterShortcutBar, { type ShortcutFilterState, defaultShortcutFilters } from "@/components/filters/FilterShortcutBar";

interface AreaStickySearchBarProps {
  areaName: string;
  areaSlug: string;
}

export const AreaStickySearchBar = ({ areaName, areaSlug }: AreaStickySearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [bottomReached, setBottomReached] = useState(false);
  const [shortcutFilters, setShortcutFilters] = useState<ShortcutFilterState>(defaultShortcutFilters);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/properties?area=${areaSlug}&q=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/properties?area=${areaSlug}`);
    }
  };

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-80px 0px 0px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  // Bottom sentinel: hide when "Ready to Get Started" enters viewport
  useEffect(() => {
    const target = document.getElementById('ready-to-get-started');
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setBottomReached(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { threshold: 0.1 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const showSticky = isSticky && !bottomReached;

  // Signal GlobalHeader to hide when sticky bar is active
  useEffect(() => {
    if (showSticky) {
      document.body.classList.add('filter-bar-fixed');
    } else {
      document.body.classList.remove('filter-bar-fixed');
    }
    return () => document.body.classList.remove('filter-bar-fixed');
  }, [showSticky]);

  return (
    <>
      {/* Sentinel element - when this scrolls out of view, the bar becomes sticky */}
      <div ref={sentinelRef} className="h-0 w-full" />

      {/* Sticky search bar */}
      <div
        className={`w-full z-40 transition-all duration-300 ${
          showSticky
            ? "fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-b border-gold/20 py-3 z-[9998]"
            : ""
        }`}
      >
        <form onSubmit={handleSearch} className={`${showSticky ? "container mx-auto px-4" : ""} max-w-xl ${showSticky ? "" : "mb-8"}`}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search properties in ${areaName}...`}
              className={`pl-12 pr-32 py-6 border-0 text-base rounded-xl shadow-2xl ${
                showSticky
                  ? "bg-muted text-foreground"
                  : "bg-white/95 backdrop-blur-sm text-black"
              }`}
            />
            <Button
              type="submit"
              variant="dark"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6"
            >
              Search
            </Button>
          </div>
        </form>
        <div className={`${showSticky ? "container mx-auto px-4" : ""} max-w-xl ${showSticky ? "" : "mb-4"} mt-3`}>
          <FilterShortcutBar variant="light" filters={shortcutFilters} onFilterChange={setShortcutFilters} />
        </div>
      </div>
    </>
  );
};
