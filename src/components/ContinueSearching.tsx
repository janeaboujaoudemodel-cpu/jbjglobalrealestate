import { Link } from "react-router-dom";
import { useState } from "react";
import { History, ArrowRight, X, Building2, MapPin, Home } from "lucide-react";
import { useRecentSearches, type RecentItemType, type RecentItem } from "@/hooks/useRecentSearches";
import FavoriteButton from "@/components/FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";

interface ContinueSearchingProps {
  /** Filter to specific type, or show all */
  type?: RecentItemType;
  /** Max items to display */
  limit?: number;
  /** Section title override */
  title?: string;
  className?: string;
}

const TYPE_CONFIG: Record<RecentItemType, { icon: typeof Home; label: string; pathPrefix: string }> = {
  property: { icon: Home, label: "Properties", pathPrefix: "/project" },
  developer: { icon: Building2, label: "Developers", pathPrefix: "/developer" },
  area: { icon: MapPin, label: "Areas", pathPrefix: "/area" },
};

const ContinueSearching = ({
  type,
  limit = 6,
  title,
  className = "",
}: ContinueSearchingProps) => {
  const { t } = useLanguage();
  const { items, clearAll } = useRecentSearches(type);

  if (items.length === 0) return null;

  const validItems = items.filter((i) => i && i.type && i.slug);
  if (validItems.length === 0) return null;

  const displayItems = validItems.slice(0, limit);
  
  // Dynamic title: "Continue Searching for [most recent item name]"
  const mostRecentName = validItems[0]?.name || "";
  const sectionTitle = title || (mostRecentName
    ? `${t("home.continueSearchingFor", "Continue Searching for")} ${mostRecentName}`
    : t("home.continueSearching", "Continue Searching"));

  return (
    <section className={`py-8 md:py-12 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 flex items-center justify-center">
              <History className="w-5 h-5 text-gold" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
              {sectionTitle}
            </h2>
          </div>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {displayItems.map((item, index) => (
            <RecentCard key={`${item.type}-${item.id}`} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

function RecentCard({ item, index }: { item: RecentItem; index: number }) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.property;
  const Icon = config.icon;
  const linkTo = `${config.pathPrefix}/${item.slug}`;
  const [logoError, setLogoError] = useState(false);

  // For property cards, show developer logo instead of type badge
  const showDevLogo = item.type === "property" && item.developerLogo && !logoError;
  // For developer cards, use imageUrl as the logo
  const showDevCardLogo = item.type === "developer" && item.imageUrl && !logoError;

  return (
    <div
      className="animate-fade-in-up"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link
        to={linkTo}
        className="group relative block h-[180px] md:h-[200px] rounded-xl overflow-hidden border border-gold/20 hover:border-gold/50 transition-all duration-300 hover:shadow-[0_6px_24px_rgba(200,167,102,0.3)]"
      >
        {/* Image / fallback */}
        {item.imageUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${item.imageUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FDFBF7] via-[#E8DCC8] to-[#D4C4A8] flex items-center justify-center">
            <Icon className="w-10 h-10 text-gold/30" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top-left: Developer logo (for properties) or type badge */}
        <div className="absolute top-2 left-2">
          {showDevLogo ? (
            <div className="w-9 h-9 rounded-lg bg-white shadow-md overflow-hidden">
              <img
                src={item.developerLogo}
                alt={item.subtitle || "Developer"}
                className="w-full h-full object-contain"
                loading="lazy"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : showDevCardLogo ? (
            <div className="w-9 h-9 rounded-lg bg-white shadow-md overflow-hidden">
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

        {/* Favorite button - top right */}
        {item.type === "property" && (
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton projectId={item.id} showShortlist={false} size="sm" />
          </div>
        )}

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {item.subtitle && (
            <span className="inline-block mb-1 text-[10px] text-gold/80 font-medium truncate w-full">
              {item.subtitle}
            </span>
          )}
          <h3 className="text-white font-semibold text-xs md:text-sm leading-tight truncate group-hover:text-gold transition-colors">
            {typeof item.name === 'string' ? item.name : String(item.name || '')}
          </h3>
        </div>
      </Link>
    </div>
  );
}

export default ContinueSearching;
