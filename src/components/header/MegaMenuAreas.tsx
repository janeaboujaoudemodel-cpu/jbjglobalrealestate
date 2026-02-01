import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye } from 'lucide-react';

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
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-t-2 border-gold/40 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Area Card */}
          <div className="col-span-4">
            <Link 
              to="/areas" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl h-full min-h-[300px]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-sm font-medium tracking-wider uppercase mb-2">Explore</p>
                <h3 className="text-white text-xl font-bold mb-2">Dubai's Prime Locations</h3>
                <p className="text-white/70 text-sm mb-4">Discover the best communities in Dubai</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore Now
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Area Lists */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-gold font-semibold text-sm tracking-wider uppercase flex items-center gap-2">
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
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
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
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                    <span className="font-medium text-sm">{area.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    </div>
  );
};

export default MegaMenuAreas;
