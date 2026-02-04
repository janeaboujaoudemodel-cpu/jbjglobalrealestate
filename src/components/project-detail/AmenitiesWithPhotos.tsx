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
  if (lower.includes('library') || lower.includes('study') || lower.includes('business')) return BookOpen;
  if (lower.includes('clinic') || lower.includes('health') || lower.includes('medical')) return Stethoscope;
  if (lower.includes('cycling') || lower.includes('bike') || lower.includes('jogging')) return Bike;
  if (lower.includes('beach') || lower.includes('marina') || lower.includes('yacht')) return Sailboat;
  
  return Sparkles; // Default icon
};

export default function AmenitiesWithPhotos({ amenities, className = "" }: AmenitiesWithPhotosProps) {
  if (!amenities || amenities.length === 0) return null;

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {amenities.map((amenity, idx) => {
          const Icon = getAmenityIcon(amenity);
          
          return (
            <div
              key={idx}
              className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-gold/20 bg-card hover:border-gold/40 hover:bg-gold/5 transition-all text-center"
            >
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                <Icon className="w-5 h-5 text-gold" />
              </div>
              <span className="text-xs text-muted-foreground leading-tight">
                {amenity}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
