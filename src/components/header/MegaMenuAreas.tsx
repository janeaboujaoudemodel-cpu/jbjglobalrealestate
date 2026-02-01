import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, ArrowRight } from 'lucide-react';
import menuDowntownDubai from '@/assets/menu-downtown-dubai.jpg';

interface MegaMenuAreasProps {
  onClose: () => void;
}

const MegaMenuAreas: React.FC<MegaMenuAreasProps> = ({ onClose }) => {
  const areas = [
    { name: 'Dubai Creek Harbour', slug: 'dubai-creek-harbour' },
    { name: 'Business Bay', slug: 'business-bay' },
    { name: 'Dubai Marina', slug: 'dubai-marina' },
    { name: 'Palm Jumeirah', slug: 'palm-jumeirah' },
    { name: 'Downtown Dubai', slug: 'downtown-dubai' },
    { name: 'Jumeirah Village Circle', slug: 'jvc' },
    { name: 'Emaar Beachfront', slug: 'emaar-beachfront' },
    { name: 'Sobha Hartland', slug: 'sobha-hartland' },
    { name: 'Expo City', slug: 'expo-city' },
    { name: 'Dubai Hills Estate', slug: 'dubai-hills-estate' },
    { name: 'Dubai Islands', slug: 'dubai-islands' },
    { name: 'Palm Jebel Ali', slug: 'palm-jebel-ali' },
    { name: 'The World Islands', slug: 'the-world-islands' },
    { name: 'The Oasis', slug: 'the-oasis' },
    { name: 'MBR City', slug: 'mbr-city' },
    { name: 'Jumeirah Beach Residence', slug: 'jbr' },
  ];

  // Split into two columns
  const half = Math.ceil(areas.length / 2);
  const firstColumn = areas.slice(0, half);
  const secondColumn = areas.slice(half);

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black border-t-2 border-gold/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Featured Area Card - SQUARE */}
          <div className="col-span-4">
            <Link 
              to="/areas" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl aspect-square transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(200,167,102,0.3)]"
              style={{ perspective: '1000px' }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${menuDowntownDubai})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
              <div className="absolute inset-0 border-2 border-gold/20 rounded-2xl group-hover:border-gold/50 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-gold text-xs font-bold tracking-[0.2em] uppercase mb-2">EXPLORE</p>
                <h3 className="text-white text-lg font-bold mb-2">Dubai's Prime Locations</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">Discover the best communities in Dubai</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore Now
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Area Lists */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Top Areas in Dubai
              </h4>
              <Link 
                to="/areas" 
                onClick={onClose}
                className="text-gold text-sm font-medium hover:text-gold-light transition-colors flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View All Areas
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <div className="space-y-1">
                {firstColumn.map((area) => (
                  <Link
                    key={area.slug}
                    to={`/areas/${area.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold/40 group-hover:bg-gold transition-colors shadow-[0_0_8px_rgba(200,167,102,0.3)]" />
                    <span className="font-medium text-sm">{area.name}</span>
                  </Link>
                ))}
              </div>
              <div className="space-y-1">
                {secondColumn.map((area) => (
                  <Link
                    key={area.slug}
                    to={`/areas/${area.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold/40 group-hover:bg-gold transition-colors shadow-[0_0_8px_rgba(200,167,102,0.3)]" />
                    <span className="font-medium text-sm">{area.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent with 3D effect */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_-5px_20px_rgba(200,167,102,0.3)]" />
    </div>
  );
};

export default MegaMenuAreas;
