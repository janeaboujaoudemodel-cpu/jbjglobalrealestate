import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import { History, X, Building2, MapPin, Home, ChevronLeft, ChevronRight, Search, Clock } from "lucide-react";
import { useRecentSearches, type RecentItemType, type RecentItem } from "@/hooks/useRecentSearches";
import FavoriteButton from "@/components/FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import LeadCaptureModal from "@/components/project-detail/LeadCaptureModal";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { getRecentSearches, clearRecentSearches } from "@/lib/searchHistory";


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

// Walking strip that uses translateX transform like book marquee.
// Only animates (and only clones the list) when the unique items overflow
// the visible viewport, so short lists never show the same card twice.
function WalkingStrip({ items, patchItem }: { items: RecentItem[]; patchItem: (id: string, type: RecentItemType, updates: Partial<RecentItem>) => void }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Deduplicate items by slug+type to prevent visual duplicates
  const seen = new Set<string>();
  const uniqueItems = items.filter(item => {
    const key = `${item.type}-${item.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Card width (200px on md+, 160px below) + gap (16px) — use the larger value
  // for overflow measurement so we err on the side of NOT animating.
  const CARD_STRIDE = 216;
  const singleSetWidth = uniqueItems.length * CARD_STRIDE;

  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => setViewportWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Only animate (and clone) when unique items would actually overflow.
  const shouldAnimate = viewportWidth > 0 && singleSetWidth > viewportWidth + 32;
  const rendered = shouldAnimate ? [...uniqueItems, ...uniqueItems] : uniqueItems;

  useEffect(() => {
    if (!shouldAnimate) {
      // Reset any previous transform so the static list renders cleanly.
      if (scrollRef.current) scrollRef.current.style.transform = 'translateX(0)';
      return;
    }
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    const speed = 0.4;
    let pos = 0;

    const tick = () => {
      pos -= speed;
      if (pos <= -singleSetWidth) pos += singleSetWidth;
      el.style.transform = `translateX(${pos}px)`;
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);

    const pause = () => cancelAnimationFrame(animId);
    const resume = () => { animId = requestAnimationFrame(tick); };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', resume);

    return () => {
      cancelAnimationFrame(animId);
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', resume);
    };
  }, [shouldAnimate, singleSetWidth]);

  return (
    <div ref={wrapperRef} className="overflow-hidden w-full">
      <div
        ref={scrollRef}
        className={`flex gap-4 py-2 ${shouldAnimate ? 'will-change-transform' : 'justify-center flex-wrap md:flex-nowrap'}`}
        style={shouldAnimate ? { width: 'max-content' } : undefined}
      >
        {rendered.map((item, i) => (
          <RecentCard3D
            key={`${item.type}-${item.id}-${i}`}
            item={item}
            index={i % Math.max(uniqueItems.length, 1)}
            patchItem={patchItem}
          />
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

  // Fetch popular projects from DB when user has no browsing history
  useEffect(() => {
    const validCount = items.filter((i) => i && i.type && i.slug).length;
    if (validCount > 0) return; // User has history, skip

    supabase
      .from("projects")
      .select("id, name, slug, cover_image_url, developer_name, location, emirate")
      .eq("is_published", true)
      .not("cover_image_url", "is", null)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
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
  }, [items]);

  const validItems = items.filter((i) => i && i.type && i.slug);

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
    ? (title || t("home.continueSearching", "Continue Searching for Your Dream Property"))
    : "Trending Projects in Dubai";

  const isEmpty = displayItems.length === 0;

  const eyebrow = hasUserHistory ? "Recently viewed" : "Editor's picks";

  return (
    <section className={`py-10 md:py-14 relative overflow-hidden ${className}`}>
      {/* Premium champagne backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7] via-[#F7F2EA] to-[#FDFBF7] z-[1]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/40 to-transparent z-[2]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#B89555]/40 to-transparent z-[2]" />
      </div>

      <div className="px-4 md:px-6 lg:px-8 relative z-20">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center shadow-sm">
              <History className="w-5 h-5 text-[#B89555]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-[#B89555]">
                {eyebrow}
              </span>
              <h2 className="text-xl md:text-2xl font-semibold text-[#1A1A1A] leading-tight">
                {sectionTitle}
              </h2>
            </div>
          </div>
          {hasUserHistory && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeadCaptureOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#1A1A1A] border border-[#1A1A1A] text-white text-xs font-semibold tracking-wide hover:bg-[#2a2a2a] transition-all duration-300"
              >
                Register Your Interest
              </button>
              <button
                onClick={clearAll}
                aria-label="Clear browsing history"
                className="px-3 h-9 rounded-lg bg-[#FDFBF7] border border-[#B89555]/40 text-[#1A1A1A] text-xs font-semibold tracking-wide flex items-center gap-1.5 hover:bg-[#EFE6D6] hover:border-[#B89555] transition-all duration-300"
              >
                <X className="w-3.5 h-3.5 text-[#B33B3B]" />
                Clear
              </button>
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#EFE6D6] to-[#F7F2EA] border border-[#B89555]/30 flex items-center justify-center mb-4">
              <Home className="w-8 h-8 text-[#B89555]" />
            </div>
            <p className="text-[#1A1A1A] text-sm font-medium mb-1">You haven't viewed any properties yet.</p>
            <p className="text-[#1A1A1A]/70 text-xs mb-5">Your recently viewed properties, developers, and areas will appear here.</p>
            <Link
              to="/properties"
              className="px-6 py-2.5 rounded-lg bg-[#B89555] border border-[#B89555] text-[#1A1A1A] text-sm font-semibold hover:bg-[#a8854a] transition-all duration-300"
            >
              Explore Now
            </Link>
          </div>
        ) : (
          <div
            className="relative"
            style={{
              WebkitMaskImage:
                "linear-gradient(to right, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%)",
              maskImage:
                "linear-gradient(to right, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%)",
            }}
          >
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const fetchAttempted = useRef(false);

  // Self-heal: fetch missing developer logo
  useEffect(() => {
    if (item.type === "property" && !item.developerLogo && item.subtitle) {
      supabase
        .from("developers")
        .select("logo_url")
        .ilike("name", `%${item.subtitle}%`)
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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      x: (y - 0.5) * -12,
      y: (x - 0.5) * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 animate-fade-in-up"
      style={{
        animationDelay: `${index * 50}ms`,
        transformStyle: "preserve-3d",
        perspective: "800px",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        to={linkTo}
        className="group relative block w-[160px] md:w-[200px] h-[220px] md:h-[260px] rounded-xl overflow-hidden transition-all duration-500"
        style={{
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x || tilt.y ? 1.05 : 1})`,
          transition: tilt.x || tilt.y ? "transform 0.1s ease-out" : "transform 0.4s ease-out",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Gold shimmer border */}
        <div className="absolute inset-0 rounded-xl border border-[#B89555]/20 group-hover:border-[#B89555]/60 transition-all duration-500 z-20 pointer-events-none" />
        <div className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"
          style={{
            background: "linear-gradient(135deg, transparent 30%, rgba(200,167,102,0.3) 50%, transparent 70%)",
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
          <div className="absolute inset-0 bg-gradient-to-br from-[#F7F2EA] via-[#EFE6D6] to-[#B89555]/40 flex items-center justify-center">
            <Icon className="w-12 h-12 text-[#B89555]" />
          </div>
        )}

        {/* Gradient overlay — stronger at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/10" />

        {/* Elevated glass reflection effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(200,167,102,0.05) 100%)",
            transform: "translateZ(20px)",
          }}
        />

        {/* Top-left: Developer logo or type badge */}
        <div className="absolute top-2 left-2 z-20" style={{ transform: "translateZ(30px)" }}>
          {showDevLogo ? (
            <DeveloperLogo
              src={item.developerLogo}
              alt={item.subtitle || "Developer"}
              className=""
              onError={() => setLogoError(true)}
            />
          ) : showDevCardLogo ? (
            <DeveloperLogo
              src={item.developerLogo}
              alt={item.name}
              className=""
              onError={() => setLogoError(true)}
            />
          ) : (
            // LOCKED: never show generic "Property" type badge. Use JBJ monogram fallback
            // when developer logo is unavailable.
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-[#FDFBF7] border border-[#B89555]/50 text-[10px] font-black tracking-tight text-[#1A1A1A] shadow-sm">
              JBJ
            </span>
          )}
        </div>

        {/* Favorite button */}
        {item.type === "property" && (
          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200" style={{ transform: "translateZ(30px)" }}>
            <FavoriteButton projectId={item.id} showShortlist={false} size="sm" />
          </div>
        )}
        {/* Bottom content - elevated */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20" style={{ transform: "translateZ(25px)" }}>
          {item.subtitle && (
            <span className="inline-flex max-w-full mb-1.5 px-2 py-0.5 rounded-md bg-[#1A1A1A]/85 backdrop-blur-sm text-[10px] text-[#E5C97A] font-semibold truncate border border-[#B89555]/40">
              {item.subtitle}
            </span>
          )}
          <h3
            className="text-white font-semibold text-xs md:text-sm leading-tight truncate group-hover:text-[#E5C97A] transition-colors duration-300"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}
          >
            {typeof item.name === 'string' ? item.name : String(item.name || '')}
          </h3>
        </div>
      </Link>
    </div>
  );
}

export default ContinueSearching;
