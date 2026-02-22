import { 
  Dumbbell, Waves, TreePine, Car, Shield, Wifi, Utensils, Baby, Dog, Sun,
  Wind, Building, Users, Heart, Coffee, ShoppingBag, Sparkles, Gamepad2,
  Film, BookOpen, Stethoscope, Bike, Sailboat
} from "lucide-react";

interface AmenitiesWithPhotosProps {
  amenities: string[];
  amenityImages?: Record<string, string> | null;
  className?: string;
}

// Map amenity keywords to icons
const getAmenityIcon = (amenity: string) => {
  const lower = amenity.toLowerCase();
  if (lower.includes('gym') || lower.includes('fitness') || lower.includes('exercise')) return Dumbbell;
  if (lower.includes('pool') || lower.includes('swimming')) return Waves;
  if (lower.includes('garden') || lower.includes('park') || lower.includes('green') || lower.includes('landscape')) return TreePine;
  if (lower.includes('parking') || lower.includes('garage')) return Car;
  if (lower.includes('security') || lower.includes('cctv') || lower.includes('guard')) return Shield;
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('smart')) return Wifi;
  if (lower.includes('restaurant') || lower.includes('dining') || lower.includes('kitchen')) return Utensils;
  if (lower.includes('kid') || lower.includes('child') || lower.includes('play') || lower.includes('nursery')) return Baby;
  if (lower.includes('pet') || lower.includes('dog')) return Dog;
  if (lower.includes('sun') || lower.includes('terrace') || lower.includes('rooftop') || lower.includes('deck')) return Sun;
  if (lower.includes('spa') || lower.includes('sauna') || lower.includes('wellness') || lower.includes('jacuzzi')) return Wind;
  if (lower.includes('lobby') || lower.includes('reception') || lower.includes('concierge')) return Building;
  if (lower.includes('community') || lower.includes('clubhouse') || lower.includes('lounge')) return Users;
  if (lower.includes('yoga') || lower.includes('meditation')) return Heart;
  if (lower.includes('cafe') || lower.includes('coffee')) return Coffee;
  if (lower.includes('retail') || lower.includes('shop') || lower.includes('mall')) return ShoppingBag;
  if (lower.includes('game') || lower.includes('arcade') || lower.includes('billiard')) return Gamepad2;
  if (lower.includes('cinema') || lower.includes('theater') || lower.includes('movie')) return Film;
  if (lower.includes('library') || lower.includes('study') || lower.includes('business') || lower.includes('conference') || lower.includes('meeting')) return BookOpen;
  if (lower.includes('clinic') || lower.includes('health') || lower.includes('medical')) return Stethoscope;
  if (lower.includes('cycling') || lower.includes('bike') || lower.includes('jogging')) return Bike;
  if (lower.includes('beach') || lower.includes('marina') || lower.includes('yacht')) return Sailboat;
  return Sparkles;
};

// Find the real Reelly photo for an amenity by matching name
const findRealPhoto = (amenity: string, amenityImages?: Record<string, string> | null): string | null => {
  if (!amenityImages) return null;
  // Exact match first
  if (amenityImages[amenity]) return amenityImages[amenity];
  // Case-insensitive match
  const lower = amenity.toLowerCase();
  for (const [key, url] of Object.entries(amenityImages)) {
    if (key.toLowerCase() === lower) return url;
  }
  // Partial match — amenity name contains or is contained in a key
  for (const [key, url] of Object.entries(amenityImages)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return url;
  }
  return null;
};

export default function AmenitiesWithPhotos({ amenities, amenityImages, className = "" }: AmenitiesWithPhotosProps) {
  if (!amenities || amenities.length === 0) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {amenities.map((amenity, idx) => {
          const Icon = getAmenityIcon(amenity);
          const photoUrl = findRealPhoto(amenity, amenityImages);
          
          return (
            <div
              key={idx}
              className="group flex flex-col items-center gap-0 rounded-xl border border-gold/20 bg-card hover:border-gold/40 hover:bg-gold/5 transition-all text-center overflow-hidden"
            >
              {/* Fixed-height top area for uniform alignment */}
              <div className="w-full h-24 overflow-hidden relative flex items-center justify-center">
                {photoUrl ? (
                  <>
                    <img 
                      src={photoUrl} 
                      alt={amenity}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        // If real photo fails to load, hide image and show icon
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling;
                        if (fallback) (fallback as HTMLElement).style.display = 'none';
                        const iconContainer = (e.target as HTMLImageElement).parentElement?.querySelector('.amenity-icon-fallback');
                        if (iconContainer) (iconContainer as HTMLElement).style.display = 'flex';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-gold" />
                    </div>
                    {/* Hidden fallback icon shown on image error */}
                    <div className="amenity-icon-fallback hidden w-12 h-12 rounded-full bg-gold/10 items-center justify-center">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                  </>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <Icon className="w-6 h-6 text-gold" />
                  </div>
                )}
              </div>
              <div className="px-2 py-2.5">
                <span className="text-xs text-muted-foreground leading-tight">
                  {amenity}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
