import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { isValidDeveloperLogoUrl } from "@/utils/developerLogo";

interface MarketDeveloper {
  name: string;
  slug: string;
  logo_url: string;
}

const MIN_LOGOS_TO_RENDER = 6;
const MAX_LOGOS = 40;

const DeveloperPartnersMarquee = () => {
  const context = useContext(LanguageContext);
  const language = context?.language ?? "en";

  const [developers, setDevelopers] = useState<MarketDeveloper[]>([]);
  const loopRef = useRef<HTMLDivElement | null>(null);
  const [loopWidth, setLoopWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch real developers from the live market — only those with a real logo_url.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("name, slug, logo_url")
        .not("logo_url", "is", null)
        .neq("logo_url", "")
        .order("name", { ascending: true })
        .limit(120);

      if (cancelled || error || !data) return;

      const valid = data
        .filter(
          (d): d is MarketDeveloper =>
            !!d.name &&
            !!d.slug &&
            typeof d.logo_url === "string" &&
            isValidDeveloperLogoUrl(d.logo_url),
        )
        .slice(0, MAX_LOGOS);

      setDevelopers(valid);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const measure = useCallback(() => {
    const el = loopRef.current;
    if (!el) return;
    const w = el.scrollWidth;
    if (Number.isFinite(w) && w > 0) setLoopWidth(w);
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (loopRef.current) ro.observe(loopRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure, developers.length]);

  // If an individual logo fails to load, drop it from the list (no fallback initials).
  const handleImageError = useCallback((slug: string) => {
    setDevelopers((prev) => prev.filter((d) => d.slug !== slug));
  }, []);

  // Don't render the section until we have a meaningful number of real logos.
  if (developers.length < MIN_LOGOS_TO_RENDER) return null;

  const duration = loopWidth > 0 ? Math.max(12, loopWidth / 80) : 0;

  const renderPartner = (
    developer: MarketDeveloper,
    index: number,
    isFirst: boolean,
  ) => (
    <Link
      key={`${isFirst ? "a" : "b"}-${developer.slug}-${index}`}
      to={`/developer/${developer.slug}`}
      className="flex-shrink-0 flex items-center justify-center transition-opacity duration-300 hover:opacity-70"
      title={developer.name}
    >
      <div
        className="h-[36px] md:h-[42px] lg:h-[48px] flex items-center justify-center overflow-hidden"
        style={{ width: "140px" }}
      >
        <img
          src={developer.logo_url}
          alt={developer.name}
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
          onLoad={isFirst ? measure : undefined}
          onError={() => handleImageError(developer.slug)}
        />
      </div>
    </Link>
  );

  const marqueeStyleFinal: React.CSSProperties =
    loopWidth > 0
      ? {
          display: "flex",
          animation: `marquee-scroll ${duration}s linear infinite`,
          animationPlayState: isPaused ? "paused" : "running",
        }
      : { display: "flex" };

  return (
    <section className="w-full overflow-hidden bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6]">
      {loopWidth > 0 && (
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${loopWidth}px); }
          }
        `}</style>
      )}

      <div className="w-full">
        <div className="py-5 md:py-6 px-4 mb-2 md:mb-3">
          <p className="text-center text-[#1A1A1A] text-sm md:text-base font-light tracking-wide">
            {language === "ar"
              ? "شراكة مع المطورين الرائدين في دبي"
              : "Partners with Dubai's leading developers"}
          </p>
        </div>

        <div
          className="relative w-full overflow-hidden py-6 md:py-8 bg-gradient-to-r from-[#EFE6D6] via-[#F7F1E6] to-[#EFE6D6] border-t border-b border-gold/30"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div style={marqueeStyleFinal} className="items-center">
            <div ref={loopRef} className="flex items-center gap-10">
              {developers.map((d, idx) => renderPartner(d, idx, true))}
            </div>
            <div aria-hidden className="flex items-center gap-10">
              {developers.map((d, idx) => renderPartner(d, idx, false))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPartnersMarquee;
