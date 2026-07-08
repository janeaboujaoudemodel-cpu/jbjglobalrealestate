import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dumbbell, Waves, TreePine, Car, Shield, Wifi, Utensils, Baby, Dog, Sun,
  Wind, Building, Users, Heart, Coffee, ShoppingBag, Sparkles, Gamepad2,
  Film, BookOpen, Stethoscope, Bike, Sailboat
} from "lucide-react";

interface AmenitiesWithPhotosProps {
  amenities: string[];
  amenityImages?: Record<string, string> | null;
  className?: string;
  pageSize?: number;
}

const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes('gym') || lower.includes('fitness') || lower.includes('hiit')) return Dumbbell;
  if (lower.includes('pool') || lower.includes('swim') || lower.includes('hydro') || lower.includes('plunge') || lower.includes('jacuzzi')) return Waves;
  if (lower.includes('garden') || lower.includes('park') || lower.includes('green') || lower.includes('landscape') || lower.includes('buffer')) return TreePine;
  if (lower.includes('parking') || lower.includes('garage') || lower.includes('drop-off') || lower.includes('vehicular')) return Car;
  if (lower.includes('security') || lower.includes('cctv') || lower.includes('guard')) return Shield;
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('smart home') || lower.includes('iot')) return Wifi;
  if (lower.includes('restaurant') || lower.includes('dining') || lower.includes('bbq') || lower.includes('isabella') || lower.includes('hunter')) return Utensils;
  if (lower.includes('kid') || lower.includes('child') || lower.includes('play') || lower.includes('nursery') || lower.includes('trampoline')) return Baby;
  if (lower.includes('pet') || lower.includes('dog')) return Dog;
  if (lower.includes('sun') || lower.includes('terrace') || lower.includes('rooftop') || lower.includes('deck') || lower.includes('cabana')) return Sun;
  if (lower.includes('spa') || lower.includes('sauna') || lower.includes('wellness') || lower.includes('steam') || lower.includes('hammam') || lower.includes('cryo') || lower.includes('salt')) return Wind;
  if (lower.includes('lobby') || lower.includes('reception') || lower.includes('concierge')) return Building;
  if (lower.includes('community') || lower.includes('clubhouse') || lower.includes('lounge') || lower.includes('social')) return Users;
  if (lower.includes('yoga') || lower.includes('meditation') || lower.includes('reiki') || lower.includes('sound heal') || lower.includes('breath')) return Heart;
  if (lower.includes('cafe') || lower.includes('coffee') || lower.includes('café')) return Coffee;
  if (lower.includes('retail') || lower.includes('shop') || lower.includes('mall') || lower.includes('market') || lower.includes('pharmacy')) return ShoppingBag;
  if (lower.includes('game') || lower.includes('arcade') || lower.includes('billiard') || lower.includes('virtual')) return Gamepad2;
  if (lower.includes('cinema') || lower.includes('theater') || lower.includes('movie') || lower.includes('gallery') || lower.includes('art')) return Film;
  if (lower.includes('library') || lower.includes('study') || lower.includes('business') || lower.includes('conference') || lower.includes('meeting')) return BookOpen;
  if (lower.includes('clinic') || lower.includes('health') || lower.includes('medical') || lower.includes('therapy') || lower.includes('oxygen') || lower.includes('vitamin')) return Stethoscope;
  if (lower.includes('cycl') || lower.includes('bike') || lower.includes('jogging') || lower.includes('rowing') || lower.includes('parkour')) return Bike;
  if (lower.includes('beach') || lower.includes('marina') || lower.includes('yacht') || lower.includes('helipad') || lower.includes('boat') || lower.includes('sea')) return Sailboat;
  return Sparkles;
};

const findRealPhoto = (amenity: string, amenityImages?: Record<string, string> | null): string | null => {
  if (!amenityImages) return null;
  if (amenityImages[amenity]) return amenityImages[amenity];
  const lower = amenity.toLowerCase();
  for (const [key, url] of Object.entries(amenityImages)) {
    if (key.toLowerCase() === lower) return url;
  }
  for (const [key, url] of Object.entries(amenityImages)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return url;
  }
  return null;
};

const paginateAmenities = (amenities: string[], pageSize: number, amenityImages?: Record<string, string> | null) => {
  const remaining = amenities.map((amenity, index) => ({ amenity, index }));
  const pages: string[][] = [];

  while (remaining.length > 0) {
    const usedPhotos = new Set<string>();
    const pageItems: string[] = [];

    while (pageItems.length < pageSize && remaining.length > 0) {
      let chosenIndex = remaining.findIndex(({ amenity }) => {
        const photo = findRealPhoto(amenity, amenityImages);
        return !photo || !usedPhotos.has(photo);
      });
      if (chosenIndex < 0) chosenIndex = 0;

      const [chosen] = remaining.splice(chosenIndex, 1);
      const photo = findRealPhoto(chosen.amenity, amenityImages);
      if (photo) usedPhotos.add(photo);
      pageItems.push(chosen.amenity);
    }

    pages.push(pageItems);
  }

  return pages.length ? pages : [[]];
};

export default function AmenitiesWithPhotos({ amenities, amenityImages, className = "", pageSize = 15 }: AmenitiesWithPhotosProps) {
  const [page, setPage] = useState(0);
  const pages = useMemo(
    () => paginateAmenities(amenities || [], pageSize, amenityImages),
    [amenities, pageSize, amenityImages],
  );
  const totalPages = Math.max(1, pages.length);
  const currentPage = Math.min(page, totalPages - 1);
  const visible = pages[currentPage] || [];

  if (!amenities || amenities.length === 0) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((amenity, idx) => {
          const Icon = getAmenityIcon(amenity);
          const photoUrl = findRealPhoto(amenity, amenityImages);
          const isCitiBuddy = /citi\s*buddy/i.test(amenity);
          return (
            <div
              key={`${currentPage}-${idx}-${amenity}`}
              className="group flex flex-col gap-0 rounded-xl border border-[#B89555]/25 bg-[#FDFBF7] hover:border-[#B89555]/55 transition-all overflow-hidden shadow-sm"
            >
              <div className={`w-full h-40 overflow-hidden relative flex items-center justify-center ${isCitiBuddy ? "bg-[#F7F2EA]" : "bg-[#F7F2EA]"}`}>
                {photoUrl ? (
                  <>
                    <img
                      src={photoUrl}
                      alt={amenity}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const iconContainer = (e.target as HTMLImageElement).parentElement?.querySelector('.amenity-icon-fallback');
                        if (iconContainer) (iconContainer as HTMLElement).style.display = 'flex';
                      }}
                    />
                    {!isCitiBuddy && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    )}
                    <div className="amenity-icon-fallback hidden w-12 h-12 rounded-full bg-[#EFE6D6]/10 items-center justify-center">
                      <Icon className="w-6 h-6 text-[#1A1A1A]" />
                    </div>
                  </>
                ) : (
                  <div className="w-12 h-12 min-w-12 min-h-12 aspect-square rounded-full bg-[#EFE6D6] flex items-center justify-center group-hover:bg-[#E8D7B8] transition-colors">
                    <Icon className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                )}
              </div>
              <div className="px-4 py-3 min-h-[64px] flex items-center">
                <span className="text-sm font-semibold text-[#1A1A1A] leading-snug">
                  {amenity}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            aria-label="Previous amenities page"
            data-emerald-action="true"
            data-no-contrast-guard
            className="jj-emerald-action allow-white inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            <ChevronLeft className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /> <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Prev</span>
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => {
              const active = i === currentPage;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPage(i)}
                  aria-label={`Amenities page ${i + 1}`}
                  aria-current={active ? "page" : undefined}
                  data-emerald-action={active ? "true" : undefined}
                  data-no-contrast-guard={active ? true : undefined}
                   className={`inline-grid place-items-center w-9 h-9 min-w-9 min-h-9 aspect-square rounded-full p-0 text-xs font-bold tabular-nums leading-none shrink-0 transition-all ${
                    active
                      ? "jj-emerald-action allow-white text-white shadow-sm"
                      : "bg-white text-[#064E3B] border border-[#B89555]/50 hover:bg-[#EFE6D6]/40"
                  }`}
                  style={active ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : { color: "#064E3B", WebkitTextFillColor: "#064E3B" }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            aria-label="Next amenities page"
            data-emerald-action="true"
            data-no-contrast-guard
            className="jj-emerald-action allow-white inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Next</span> <ChevronRight className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          </button>
        </div>
      )}
    </div>
  );
}
