import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { Link } from "react-router-dom";
import { LanguageContext } from "@/contexts/LanguageContext";
import ContentTrack from "@/components/layout/ContentTrack";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";

/**
 * LOCKED (PASS 296 — EMERALD PARTNER MARQUEE):
 *  - The strip is the emerald pair gradient (#064E3B -> #042c1c -> #000), never
 *    champagne/beige.
 *  - Every partner is rendered through <DeveloperLogo>, so all 20 plates are
 *    byte-for-byte the SAME geometry and the SAME white-knockout treatment used
 *    on the property and developer cards. Per-brand widths/scales/offsets are
 *    forbidden here: that is what made the old strip visually uneven.
 *  - Heading = emerald->black shimmer over pure white ink. Divider = emerald->
 *    black gradient, no shimmer.
 *
 * Top 20 UAE developers. The original 11 are kept; the next 9 by live JBJ
 * project volume were added (Aldar, Arada, Reportage, Samana, Tiger, Azizi,
 * Omniyat, Object 1, Bloom Holding).
 */
const FEATURED_DEVELOPERS: { name: string; slug: string; logo: string }[] = [
  { name: "DAMAC", slug: "damac", logo: "/developers/logos/damac-logo.webp" },
  { name: "EMAAR", slug: "emaar", logo: "/developers/logos/emaar-logo.webp" },
  { name: "MERAAS", slug: "meraas", logo: "/developers/logos/meraas-logo.webp" },
  { name: "SOBHA REALTY", slug: "sobha", logo: "/developers/logos/sobha-logo.webp" },
  { name: "NAKHEEL", slug: "nakheel", logo: "/developers/logos/nakheel-logo.webp" },
  { name: "BINGHATTI", slug: "binghatti", logo: "/developers/logos/binghatti-logo.webp" },
  { name: "SELECT GROUP", slug: "select-group", logo: "/developers/logos/select-group-logo.webp" },
  { name: "ELLINGTON PROPERTIES", slug: "ellington", logo: "/developers/logos/ellington-logo.webp" },
  { name: "MAJID AL FUTTAIM", slug: "majid-al-futtaim", logo: "/developers/logos/majid-al-futtaim-logo.webp" },
  { name: "DANUBE PROPERTIES", slug: "danube", logo: "/developers/logos/danube-logo.webp" },
  { name: "DUBAI PROPERTIES", slug: "dubai-properties", logo: "/developers/logos/dubai-properties-logo.webp" },
  { name: "ALDAR", slug: "aldar", logo: "/developers/logos/aldar-logo.png" },
  { name: "ARADA", slug: "arada", logo: "https://aradawebcontent.blob.core.windows.net/arada-com/2022/06/arada-logo.svg" },
  { name: "REPORTAGE PROPERTIES", slug: "reportage", logo: "https://d3h330vgpwpjr8.cloudfront.net/x/118x/logo_07_79f91c58bc.webp" },
  { name: "SAMANA DEVELOPERS", slug: "samana-developers", logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/Samana_0d2d98f91c.webp" },
  { name: "TIGER PROPERTIES", slug: "tiger-properties", logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/logo_03_77b6912942.webp" },
  { name: "AZIZI DEVELOPMENTS", slug: "azizi-developments", logo: "https://d3h330vgpwpjr8.cloudfront.net/x/118x/1200px_Azizi_developments_8a7795019d.webp" },
  { name: "OMNIYAT", slug: "omniyat", logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/Omniyat_397cb50ef0.webp" },
  { name: "OBJECT 1", slug: "object-1", logo: "https://d3h330vgpwpjr8.cloudfront.net/x/296x/object_1_01_1ff86069c6.webp" },
  { name: "BLOOM HOLDING", slug: "bloom-holding", logo: "https://bloomholding.com/application/themes/bloomholding/dist/images/logo-seo.jpg" },
];

const DeveloperPartnersMarquee = () => {
  const context = useContext(LanguageContext);
  const language = context?.language ?? "en";

  const loopRef = useRef<HTMLDivElement | null>(null);
  const [loopWidth, setLoopWidth] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

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
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [measure]);

  const duration = loopWidth > 0 ? Math.max(18, loopWidth / 80) : 0;

  const renderPartner = (developer: typeof FEATURED_DEVELOPERS[number], index: number, isFirst: boolean) => (
    <Link
      key={`${isFirst ? "a" : "b"}-${developer.slug}-${index}`}
      to={`/developer/${developer.slug}`}
      className="jj-partner-mark flex-shrink-0 transition-opacity duration-300 hover:opacity-80"
      title={developer.name}
      aria-hidden={isFirst ? undefined : true}
      tabIndex={isFirst ? undefined : -1}
    >
      {/* Unified plate: identical size for every partner, no per-brand tuning. */}
      <DeveloperLogo
        src={developer.logo}
        name={developer.name}
        alt={developer.name}
        variant="bare"
        size="md"
        loading={index < 6 && isFirst ? "eager" : "lazy"}
      />
    </Link>
  );

  const marqueeStyle: React.CSSProperties = loopWidth > 0
    ? {
        display: "flex",
        animation: `marquee-scroll ${duration}s linear infinite`,
        animationPlayState: isPaused ? "paused" : "running",
      }
    : { display: "flex" };

  return (
    <section
      className="w-full overflow-hidden bg-[#042c1c] bg-[linear-gradient(160deg,#064E3B_0%,#042c1c_58%,#000000_100%)]"
      data-partners-marquee
      data-emerald-surface="true"
      data-jbj-invert="pair"
    >
      <style>{`
        @keyframes jbj-emerald-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .jbj-emerald-shimmer-bg {
          background: linear-gradient(90deg, #042c1c 0%, #064E3B 25%, #0a6b52 50%, #064E3B 75%, #000000 100%);
          background-size: 200% auto;
          animation: jbj-emerald-shimmer 10s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .jbj-emerald-shimmer-bg { animation: none; }
        }
      `}</style>
      {loopWidth > 0 && (
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-${loopWidth}px); }
          }
        `}</style>
      )}

      <div className="w-full">
        <div className="jbj-emerald-shimmer-bg py-5 md:py-6" data-jbj-invert="pair">
          <ContentTrack>
            <p className="text-center text-sm md:text-base font-semibold tracking-[0.18em] uppercase text-white [-webkit-text-fill-color:#ffffff]">
              {language === "ar" ? "شراكة مع المطورين الرائدين في دبي" : "Partners with Dubai's leading developers"}
            </p>
          </ContentTrack>
        </div>

        {/* Emerald -> black divider (no shimmer) */}
        <ContentTrack>
          <div aria-hidden className="h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </ContentTrack>

        <div
          className="relative w-full overflow-hidden py-6 md:py-8 bg-[linear-gradient(180deg,#053a29_0%,#042c1c_60%,#000000_100%)]"
          data-jbj-invert="pair"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div style={marqueeStyle} className="items-center">
            <div ref={loopRef} className="flex items-center gap-8">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, true))}
            </div>
            <div aria-hidden className="flex items-center gap-8 pl-8">
              {FEATURED_DEVELOPERS.map((d, idx) => renderPartner(d, idx, false))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperPartnersMarquee;
