import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AreaStickySearchBarProps {
  areaName: string;
  areaSlug: string;
}

export const AreaStickySearchBar = ({ areaName, areaSlug }: AreaStickySearchBarProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
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

  return (
    <>
      {/* Sentinel element - when this scrolls out of view, the bar becomes sticky */}
      <div ref={sentinelRef} className="h-0 w-full" />

      {/* Sticky search bar */}
      <div
        className={`w-full z-40 transition-all duration-300 ${
          isSticky
            ? "fixed top-24 sm:top-28 lg:top-32 left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg border-b border-gold/20 py-3 z-[9998]"
            : ""
        }`}
      >
        <form onSubmit={handleSearch} className={`${isSticky ? "container mx-auto px-4" : ""} max-w-xl ${isSticky ? "" : "mb-8"}`}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search properties in ${areaName}...`}
              className={`pl-12 pr-32 py-6 border-0 text-base rounded-xl shadow-2xl ${
                isSticky
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
      </div>
    </>
  );
};
