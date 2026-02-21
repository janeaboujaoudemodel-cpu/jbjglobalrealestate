import { useState } from "react";
import { 
  Dumbbell, 
  Waves, 
  TreePine, 
  Car, 
  Shield, 
  Wifi, 
  Utensils, 
  Baby, 
  Dog, 
  Sun,
  Wind,
  Building,
  Users,
  Heart,
  Coffee,
  ShoppingBag,
  Sparkles,
  Gamepad2,
  Film,
  BookOpen,
  Stethoscope,
  Bike,
  Sailboat
} from "lucide-react";

interface AmenitiesWithPhotosProps {
  amenities: string[];
  className?: string;
}

// Curated amenity photo URLs (high-quality representative images)
const AMENITY_PHOTOS: Record<string, string> = {
  pool: "https://images.unsplash.com/photo-1572331165267-854da2b021b1?w=400&h=300&fit=crop&q=80",
  swimming: "https://images.unsplash.com/photo-1572331165267-854da2b021b1?w=400&h=300&fit=crop&q=80",
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&q=80",
  fitness: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&q=80",
  exercise: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop&q=80",
  garden: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop&q=80",
  park: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop&q=80",
  landscape: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop&q=80",
  green: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400&h=300&fit=crop&q=80",
  parking: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&h=300&fit=crop&q=80",
  garage: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&h=300&fit=crop&q=80",
  security: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80",
  cctv: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80",
  guard: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop&q=80",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&q=80",
  sauna: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&q=80",
  wellness: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&q=80",
  jacuzzi: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&q=80",
  kid: "https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=400&h=300&fit=crop&q=80",
  child: "https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=400&h=300&fit=crop&q=80",
  play: "https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=400&h=300&fit=crop&q=80",
  nursery: "https://images.unsplash.com/photo-1566454544259-f4b94c3d758c?w=400&h=300&fit=crop&q=80",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80",
  dining: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop&q=80",
  terrace: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&q=80",
  rooftop: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop&q=80",
  lobby: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&q=80",
  reception: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&q=80",
  concierge: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&q=80",
  community: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&q=80",
  clubhouse: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&q=80",
  lounge: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop&q=80",
  yoga: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=300&fit=crop&q=80",
  meditation: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&h=300&fit=crop&q=80",
  beach: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&q=80",
  marina: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop&q=80",
  cinema: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop&q=80",
  theater: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop&q=80",
  movie: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=300&fit=crop&q=80",
  library: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop&q=80",
  study: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop&q=80",
  business: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop&q=80",
  conference: "https://images.unsplash.com/photo-1431540015160-0d3d4b6c8e2e?w=400&h=300&fit=crop&q=80",
  meeting: "https://images.unsplash.com/photo-1431540015160-0d3d4b6c8e2e?w=400&h=300&fit=crop&q=80",
  cycling: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&h=300&fit=crop&q=80",
  bike: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&h=300&fit=crop&q=80",
  jogging: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=400&h=300&fit=crop&q=80",
  pet: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop&q=80",
  dog: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop&q=80",
  retail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&q=80",
  shop: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&q=80",
  mall: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&q=80",
  game: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop&q=80",
  arcade: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop&q=80",
  billiard: "https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=300&fit=crop&q=80",
  cafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop&q=80",
  coffee: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop&q=80",
  clinic: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop&q=80",
  health: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop&q=80",
  medical: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop&q=80",
  wifi: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop&q=80",
  internet: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop&q=80",
  smart: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop&q=80",
};

// Get photo URL for an amenity
const getAmenityPhoto = (amenity: string): string | null => {
  const lower = amenity.toLowerCase();
  for (const [keyword, url] of Object.entries(AMENITY_PHOTOS)) {
    if (lower.includes(keyword)) return url;
  }
  return null;
};

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

export default function AmenitiesWithPhotos({ amenities, className = "" }: AmenitiesWithPhotosProps) {
  if (!amenities || amenities.length === 0) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {amenities.map((amenity, idx) => {
          const Icon = getAmenityIcon(amenity);
          const photoUrl = getAmenityPhoto(amenity);
          
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
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5 text-gold" />
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
