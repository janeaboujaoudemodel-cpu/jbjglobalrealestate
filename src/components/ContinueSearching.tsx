import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { History, X, Building2, MapPin, Home, ChevronLeft, ChevronRight, Search, Clock } from "lucide-react";
import { useRecentSearches, type RecentItemType, type RecentItem } from "@/hooks/useRecentSearches";
import FavoriteButton from "@/components/FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import LeadCaptureModal from "@/components/project-detail/LeadCaptureModal";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { getRecentSearches, clearRecentSearches } from "@/lib/searchHistory";
import ContentTrack from "@/components/layout/ContentTrack";


interface ContinueSearchingProps {
  type?: RecentItemType;
  limit?: number;
  title?: string;
  className?: string;
}

const TYPE_CONFIG: Record<RecentItemType, { icon: typeof Home; label: string; pathPrefix: string }> = {
  property: { icon: Home, label: "Properties", pathPrefix: "/project" },
  developer: { icon: Building2, label: "Developers", pathPrefix: "/developer" },
  area: { icon: MapPin, label: "Areas", pathPrefix: "/area" },
};

/**
 * WalkingStrip — same CSS-keyframe rhythm as the guides/reports carousel.
 * No rAF and no drag. Track is duplicated for a seamless 0 → -50% loop.
 */
function WalkingStrip({ items, patchItem }: { items: RecentItem[]; patchItem: (id: string, type: RecentItemType, updates: Partial<RecentItem>) => void }) {
  const [paused, setPaused] = useState(false);
  // Deduplicate items by slug+type to prevent visual duplicates.
  const seen = new Set<string>();
  const uniqueItems = items.filter(item => {
    const key = `${item.type}-${item.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const trackItems = uniqueItems.length <= 1 ? uniqueItems : [...uniqueItems, ...uniqueItems];

  return (
    <div
      className="w-full overflow-hidden select-none"
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        data-marquee-track
        className="flex w-max gap-4 px-4 py-2 md:px-8 lg:px-12 will-change-transform"
        style={{
          animation: uniqueItems.length > 1 ? "jbj-book-marquee 38s linear infinite" : undefined,
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {trackItems.map((item, i) => (
          <div key={`${item.type}-${item.id}-${i}`} className="shrink-0">
            <RecentCard3D
              item={item}
              index={i % Math.max(1, uniqueItems.length)}
              patchItem={patchItem}
            />
          </div>
        ))}
      </div>
    </div>
  );
}


const ContinueSearching = ({
  type,
  limit = 12,
  title,
  className = "",
}: ContinueSearchingProps) => {
  const { t } = useLanguage();
  const { items, clearAll, patchItem } = useRecentSearches(type);
  const [leadCaptureOpen, setLeadCaptureOpen] = useState(false);
  const [popularProjects, setPopularProjects] = useState<RecentItem[]>([]);
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const validItems = useMemo(() => items.filter((i) => i && i.type && i.slug), [items]);
  useEffect(() => {
    if (historyOpen) setRecentQueries(getRecentSearches());
  }, [historyOpen]);


  // Fetch popular projects from DB when user has no browsing history
  useEffect(() => {
    if (validItems.length > 0 || popularProjects.length > 0) return; // User has history or fallback is already loaded

    let cancelled = false;

    supabase
      .from("projects")
      .select("id, name, slug, cover_image_url, developer_name, location, emirate")
      .eq("is_published", true)
      .or("listing_kind.is.null,listing_kind.neq.leasing")
      .not("cover_image_url", "is", null)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (cancelled) return;
        if (!data?.length) return;
        const mapped: RecentItem[] = data.map((p: any) => ({
          id: p.id,
          type: "property" as RecentItemType,
          name: p.name,
          slug: p.slug,
          imageUrl: p.cover_image_url,
          subtitle: [p.location, p.emirate].filter(Boolean).join(", "),
          viewedAt: Date.now(),
        }));
        setPopularProjects(mapped);
      });
    return () => {
      cancelled = true;
    };
  }, [popularProjects.length, validItems.length]);

  // Deduplicate properties by both slug AND id — each property appears only once
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();
  const uniqueItems = validItems.filter((item) => {
    const slugKey = `${item.type}-${item.slug}`;
    const idKey = `${item.type}-${item.id}`;
    if (seenSlugs.has(slugKey) || seenIds.has(idKey)) return false;
    seenSlugs.add(slugKey);
    seenIds.add(idKey);
    return true;
  });

  const hasUserHistory = uniqueItems.length > 0;
  const displayItems = hasUserHistory ? uniqueItems.slice(0, limit) : popularProjects;

  const sectionTitle = hasUserHistory
    ? (title || (type === "area" ? "Recently Viewed Areas & Communities" : t("home.continueSearching", "Continue Searching for Your Dream Property")))
    : "Trending Projects in Dubai";

  const isEmpty = displayItems.length === 0;

  const eyebrow = hasUserHistory ? "Recently viewed" : "Editor's picks";

  return (
    <section className={`jj-bleed-allow jj-fullbleed-band py-10 md:py-14 relative overflow-hidden w-full ${className}`} data-fullbleed-band>
      {/* Premium champagne backdrop — full-bleed edge to edge */}
      <div className="jj-bleed-allow absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#FDFBF7] z-[1]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#064E3B]/55 to-transparent z-[2]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#064E3B]/55 to-transparent z-[2]" />
      </div>

      <div className="jj-bleed-allow relative z-20">
        <ContentTrack>


        {/* Header */}
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <h2 data-no-contrast-guard className="text-2xl md:text-3xl font-bold text-[#1A1A1A] leading-tight">
            {sectionTitle}
          </h2>
          {hasUserHistory && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeadCaptureOpen(true)}
                data-surface="emerald"
                data-emerald-ok="button"
                className="jj-surface-emerald px-4 h-9 rounded-lg text-xs font-semibold tracking-wide transition-all duration-300 hover:-translate-y-0.5"
              >
                <span>Register Your Interest</span>
              </button>
              <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
                <PopoverTrigger asChild>
                  <button
                    aria-label="View search history"
                    data-surface="emerald"
                    data-emerald-ok="button"
                    className="jj-surface-emerald px-3 h-9 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    View Search History
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="end"
                  className="allow-white w-80 p-0 bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/24 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.55)] rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/18 bg-black/10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white" />
                      <span className="text-[12px] font-bold tracking-[0.14em] uppercase text-white">Your Searches</span>
                    </div>
                    {recentQueries.length > 0 && (
                      <button
                        onClick={() => { clearRecentSearches(); setRecentQueries([]); }}
                        className="text-[10px] font-semibold tracking-wide text-[#B33B3B] hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {recentQueries.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Search className="w-6 h-6 text-white mx-auto mb-2" />
                        <p className="text-[12px] text-white">No searches yet. Start exploring to build your history.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-white/15">
                        {recentQueries.map((q) => (
                          <li key={q}>
                            <button
                              onClick={() => {
                                setHistoryOpen(false);
                                navigate(`/properties?q=${encodeURIComponent(q)}`);
                              }}
                              className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-white/12 transition-colors group"
                            >
                              <Search className="w-3.5 h-3.5 text-white shrink-0" />
                              <span className="flex-1 text-[13px] text-white truncate">{q}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-white" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <button
                onClick={clearAll}
                aria-label="Clear browsing history"
                className="allow-white jj-pill-emerald-metallic px-3 h-9 rounded-lg border-0 text-white text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-all duration-300"
              >
                <X className="w-3.5 h-3.5 text-white" />
                Clear
              </button>
            </div>
          )}
        </div>
        {/* /header padded inner */}
        </ContentTrack>

        {isEmpty ? (
          <div className="px-4 md:px-8 lg:px-12 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EFE6D6] to-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center mb-4">
              <Home className="w-8 h-8 text-[#B89555]" />
            </div>
            <p className="text-[#1A1A1A] text-sm font-medium mb-1">You haven't viewed any properties yet.</p>
            <p className="text-[#1A1A1A]/70 text-xs mb-5">Your recently viewed properties, developers, and areas will appear here.</p>
            <Link
              to="/properties"
              className="allow-white jj-pill-emerald-metallic px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-300"
            >
              Explore Now
            </Link>
          </div>
        ) : (
          <div className="relative w-full">
            <WalkingStrip items={displayItems} patchItem={patchItem} />
          </div>
        )}
      </div>


      {/* Lead Capture Modal */}
      <LeadCaptureModal
        open={leadCaptureOpen}
        onOpenChange={setLeadCaptureOpen}
        projectId="general"
        projectName="JBJ Global Real Estate"
        documentType="brochure"
      />
    </section>
  );
};

function isUrlValid(url: string | undefined): boolean {
  if (!url) return false;
  if (url.includes("undefined") || url.includes("null")) return false;
  // Accept absolute http(s) URLs, protocol-relative URLs, and root-relative paths.
  if (url.startsWith("http://") || url.startsWith("https://")) return true;
  if (url.startsWith("//") || url.startsWith("/")) return true;
  return false;
}

function RecentCard3D({ item, index, patchItem }: { item: RecentItem; index: number; patchItem: (id: string, type: RecentItemType, updates: Partial<RecentItem>) => void }) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.property;
  const Icon = config.icon;
  const linkTo = `${config.pathPrefix}/${item.slug}`;
  const [logoError, setLogoError] = useState(false);
  const urlValid = isUrlValid(item.imageUrl);
  const [imgBroken, setImgBroken] = useState(!urlValid);
  const cardRef = useRef<HTMLDivElement>(null);
  const fetchAttempted = useRef(false);

  // Self-heal: fetch missing developer logo — ALWAYS prefer a row that has a
  // non-null logo_url (some developers like Emaar exist as multiple slugs,
  // not all of which carry the logo).
  useEffect(() => {
    if (item.type === "property" && !item.developerLogo && item.subtitle) {
      supabase
        .from("developers")
        .select("logo_url")
        .ilike("name", `%${item.subtitle}%`)
        .not("logo_url", "is", null)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.logo_url) {
            patchItem(item.id, item.type, { developerLogo: data.logo_url });
          }
        });
    }
  }, [item.id, item.type, item.developerLogo, item.subtitle, patchItem]);

  // Helper: fetch cover image from DB (once per mount)
  const fetchCoverImage = useCallback(() => {
    if (!item.slug || fetchAttempted.current) return;
    fetchAttempted.current = true;
    if (item.type === "property") {
      supabase
        .from("projects")
        .select("cover_image_url, images:project_images(image_url)")
        .eq("slug", item.slug)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          const url = data?.cover_image_url || (data?.images as any)?.[0]?.image_url;
          if (url && url !== item.imageUrl) {
            patchItem(item.id, item.type, { imageUrl: url });
            setImgBroken(false);
          }
        });
    } else if (item.type === "developer") {
      // LOCKED: developer cards must only surface brand imagery — never
      // substitute a project/feature photo for the logo. We fetch the
      // feature_image_url strictly for card background imagery, and the
      // logo_url separately for the logo overlay.
      supabase
        .from("developers")
        .select("logo_url, feature_image_url")
        .eq("slug", item.slug)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          const bgUrl = data?.feature_image_url || null;
          if (bgUrl && bgUrl !== item.imageUrl) {
            patchItem(item.id, item.type, { imageUrl: bgUrl });
            setImgBroken(false);
          }
          if (data?.logo_url && data.logo_url !== item.developerLogo) {
            patchItem(item.id, item.type, { developerLogo: data.logo_url });
          }
        });
    } else if (item.type === "area") {
      supabase
        .from("areas")
        .select("image_url, hero_image_url")
        .eq("slug", item.slug)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          const url = data?.hero_image_url || data?.image_url;
          if (url && url !== item.imageUrl) {
            patchItem(item.id, item.type, { imageUrl: url });
            setImgBroken(false);
          }
        });
    }
  }, [item.id, item.type, item.slug, item.imageUrl, patchItem]);

  // Self-heal: fetch missing cover image for any type
  useEffect(() => {
    if (!item.imageUrl && item.slug) {
      fetchCoverImage();
    }
  }, [item.id, item.type, item.imageUrl, item.slug, fetchCoverImage]);

  // Detect broken image URLs and self-heal (only for valid-looking URLs)
  useEffect(() => {
    if (!urlValid) {
      setImgBroken(true);
      fetchCoverImage();
      return;
    }
    const img = new Image();
    img.onload = () => setImgBroken(false);
    img.onerror = () => {
      setImgBroken(true);
      fetchCoverImage();
    };
    img.src = item.imageUrl!;
  }, [item.imageUrl, urlValid, fetchCoverImage]);

  const hasValidImage = item.imageUrl && !imgBroken;
  const showDevLogo = item.type === "property" && item.developerLogo && !logoError;
  // LOCKED: developer logo slot on developer cards must use the canonical
  // logo_url (via item.developerLogo), NEVER the card's background image.
  const showDevCardLogo = item.type === "developer" && item.developerLogo && !logoError;

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 animate-fade-in-up"
      style={{
        animationDelay: `${index * 50}ms`,
        transformStyle: "preserve-3d",
        perspective: "800px",
      }}
    >
      <Link
        to={linkTo}
        className="group relative block w-[160px] md:w-[200px] h-[220px] md:h-[260px] rounded-xl overflow-hidden transition-all duration-500"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-0 rounded-xl border border-[#064E3B]/35 group-hover:border-[#064E3B]/70 transition-all duration-500 z-20 pointer-events-none" />
        <div className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"
          style={{
            background: "linear-gradient(135deg, transparent 30%, rgba(6,78,59,0.32) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
            animation: "shimmer 2s ease-in-out infinite",
          }}
        />

        {/* Image / fallback */}
        {hasValidImage ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] flex items-center justify-center">
            <Icon className="w-12 h-12 text-white" />
          </div>
        )}

        {/* Gradient overlay — stronger at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" data-ink-emerald-opt-out />

        {/* Elevated glass reflection effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(6,78,59,0.16) 100%)",
            transform: "translateZ(20px)",
          }}
        />

        {/* Top-left: Developer logo, with a name-text badge fallback when no
            logo exists in the DB (e.g. Wasl). JBJ monogram is the brand mark
            and is NEVER used as a developer fallback on these cards. */}
        {(showDevLogo || showDevCardLogo) ? (
          <div className="absolute top-2 left-2 z-20" style={{ transform: "translateZ(30px)" }}>
            <DeveloperLogo
              src={item.developerLogo}
              alt={item.subtitle || item.name || "Developer"}
              className=""
              onError={() => setLogoError(true)}
            />
          </div>
        ) : (
          item.type === "property" && item.subtitle && !item.subtitle.includes(",") && (
            <div className="absolute top-2 left-2 z-20" style={{ transform: "translateZ(30px)" }}>
              <DeveloperLogo
                variant="nameplate"
                name={item.subtitle}
                alt={item.subtitle}
              />
            </div>
          )
        )}

        {/* Favorite button */}
        {item.type === "property" && (
          <div
            className="absolute top-2 right-2 z-30 overflow-visible"
            data-card-actions-overlay=""
            style={{ transform: "translateZ(30px)" }}
          >
            <FavoriteButton projectId={item.id} showShortlist={false} size="md" />
          </div>
        )}

        {/* Bottom content — heavy opaque black plate guarantees project-name
            legibility over any image (light, dark, busy, washed out). */}
        <div className="absolute inset-x-0 bottom-0 h-[62%] z-10 bg-gradient-to-t from-black via-black/95 via-40% to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[38%] z-10 bg-black/85 pointer-events-none" style={{ mixBlendMode: "normal" }} />
        <div data-ink-emerald-opt-out data-photo-copy-lock className="absolute bottom-0 left-0 right-0 px-3 pt-3 pb-3 z-20 flex min-h-[96px] flex-col justify-end gap-2" style={{ transform: "translateZ(25px)" }}>
          {item.subtitle && (
            <span
              data-no-contrast-guard
              className="allow-white block truncate text-[10.5px] font-semibold uppercase tracking-[0.16em] leading-none mb-1"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
            >
              {item.type === "property" ? (
                <>
                  <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>by </span>
                  <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{item.subtitle}</span>
                </>
              ) : (
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{item.subtitle}</span>
              )}
            </span>
          )}
          <h3
            className="allow-white font-extrabold text-[15px] md:text-base leading-tight truncate transition-colors duration-300"
            style={{
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              textShadow: "0 2px 10px rgba(0,0,0,1), 0 1px 2px rgba(0,0,0,1), 0 0 18px rgba(0,0,0,0.95)",
            }}
          >
            {typeof item.name === 'string' ? item.name : String(item.name || '')}
          </h3>
        </div>


      </Link>
    </div>
  );
}

export default ContinueSearching;
