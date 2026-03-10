import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { History, X, Building2, MapPin, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { useRecentSearches, type RecentItemType, type RecentItem } from "@/hooks/useRecentSearches";
import FavoriteButton from "@/components/FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import LeadCaptureModal from "@/components/project-detail/LeadCaptureModal";

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

// Walking strip that uses translateX transform like book marquee
function WalkingStrip({ items, patchItem }: { items: RecentItem[]; patchItem: (id: string, type: RecentItemType, updates: Partial<RecentItem>) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Triplicate items for seamless loop
  const duplicated = [...items, ...items, ...items];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let animId: number;
    let pos = 0;
    const speed = 0.4;
    // Card width (200px) + gap (16px) = 216px per card
    const singleSetWidth = items.length * 216;

    const tick = () => {
      pos += speed;
      if (pos >= singleSetWidth) pos -= singleSetWidth;
      el.style.transform = `translateX(-${pos}px)`;
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
  }, [items.length]);

  return (
    <div className="overflow-hidden w-full">
      <div ref={scrollRef} className="flex gap-4 will-change-transform py-2" style={{ width: 'max-content' }}>
        {duplicated.map((item, i) => (
          <RecentCard3D key={`${item.type}-${item.id}-${i}`} item={item} index={i % items.length} patchItem={patchItem} />
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

  if (items.length === 0) return null;

  const validItems = items.filter((i) => i && i.type && i.slug);
  if (validItems.length === 0) return null;

  // Deduplicate by slug — keep only the most recently viewed instance
  const seenSlugs = new Set<string>();
  const uniqueItems = validItems.filter((item) => {
    const key = `${item.type}-${item.slug}`;
    if (seenSlugs.has(key)) return false;
    seenSlugs.add(key);
    return true;
  });

  const displayItems = uniqueItems.slice(0, limit);

  const sectionTitle = title || t("home.continueSearching", "Continue Searching for Your Dream Property");

  return (
    <section className={`py-8 md:py-12 relative overflow-hidden ${className}`}>
      {/* Premium backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-black z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(200,167,102,0.06)_0%,_transparent_60%)] z-[2]" />
      </div>

      <div className="container mx-auto px-4 relative z-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 flex items-center justify-center">
              <History className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
              {sectionTitle}
            </h2>
          </div>
          <div className="flex items-center gap-3">
              <button
                onClick={() => setLeadCaptureOpen(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 text-black text-xs font-semibold tracking-wide hover:shadow-lg hover:shadow-gold/20 transition-all duration-300"
              >
                Register Your Interest
              </button>
            <button
              onClick={clearAll}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        </div>

        {/* Walking Strip Carousel - seamless infinite loop */}
        <WalkingStrip items={displayItems} patchItem={patchItem} />
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

function RecentCard3D({ item, index, patchItem }: { item: RecentItem; index: number; patchItem: (id: string, type: RecentItemType, updates: Partial<RecentItem>) => void }) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.property;
  const Icon = config.icon;
  const linkTo = `${config.pathPrefix}/${item.slug}`;
  const [logoError, setLogoError] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

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

  const showDevLogo = item.type === "property" && item.developerLogo && !logoError;
  const showDevCardLogo = item.type === "developer" && item.imageUrl && !logoError;

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
        <div className="absolute inset-0 rounded-xl border border-gold/20 group-hover:border-gold/60 transition-all duration-500 z-20 pointer-events-none" />
        <div className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10"
          style={{
            background: "linear-gradient(135deg, transparent 30%, rgba(200,167,102,0.3) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
            animation: "shimmer 2s ease-in-out infinite",
          }}
        />

        {/* Image / fallback */}
        {item.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
            <Icon className="w-12 h-12 text-gold/20" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

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
            <div className="w-9 h-9 rounded-lg bg-white shadow-lg overflow-hidden ring-1 ring-gold/30">
              <img
                src={item.developerLogo}
                alt={item.subtitle || "Developer"}
                className="w-full h-full object-contain"
                loading="lazy"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : showDevCardLogo ? (
            <div className="w-9 h-9 rounded-lg bg-white shadow-lg overflow-hidden ring-1 ring-gold/30">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-contain"
                loading="lazy"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-[9px] font-semibold uppercase tracking-wider text-gold border border-gold/20">
              <Icon className="w-2.5 h-2.5" />
              {item.type}
            </span>
          )}
        </div>

        {/* Favorite button */}
        {item.type === "property" && (
          <div className="absolute top-2 right-2 z-20" style={{ transform: "translateZ(30px)" }}>
            <FavoriteButton projectId={item.id} showShortlist={false} size="sm" />
          </div>
        )}

        {/* Bottom content - elevated */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20" style={{ transform: "translateZ(25px)" }}>
          {item.subtitle && (
            <span className="inline-block mb-1 text-[10px] text-gold/80 font-medium truncate w-full">
              {item.subtitle}
            </span>
          )}
          <h3 className="text-white font-semibold text-xs md:text-sm leading-tight truncate group-hover:text-gold transition-colors duration-300">
            {typeof item.name === 'string' ? item.name : String(item.name || '')}
          </h3>
        </div>
      </Link>
    </div>
  );
}

export default ContinueSearching;
