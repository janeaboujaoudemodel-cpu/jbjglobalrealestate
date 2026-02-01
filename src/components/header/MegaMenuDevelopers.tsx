import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, ArrowRight } from 'lucide-react';
import menuDubaiSkyline from '@/assets/menu-dubai-skyline.jpg';

interface MegaMenuDevelopersProps {
  onClose: () => void;
}

const MegaMenuDevelopers: React.FC<MegaMenuDevelopersProps> = ({ onClose }) => {
  const developers = [
    { name: 'Emaar Properties', slug: 'emaar' },
    { name: 'DAMAC Properties', slug: 'damac' },
    { name: 'Sobha Realty', slug: 'sobha' },
    { name: 'Nakheel Properties', slug: 'nakheel' },
    { name: 'Binghatti', slug: 'binghatti' },
    { name: 'Meraas', slug: 'meraas' },
    { name: 'Meraki', slug: 'meraki' },
    { name: 'Aldar Properties', slug: 'aldar' },
    { name: 'Ellington Properties', slug: 'ellington' },
    { name: 'H&H Development', slug: 'hh-development' },
    { name: 'Beyond', slug: 'beyond' },
    { name: 'Leos Development', slug: 'leos' },
    { name: 'Object One', slug: 'object-one' },
    { name: 'Azizi Developments', slug: 'azizi' },
    { name: 'HRE Developments', slug: 'hre' },
    { name: 'Select Group', slug: 'select-group' },
    { name: 'Danube Properties', slug: 'danube' },
    { name: 'Dubai Properties', slug: 'dubai-properties' },
  ];

  // Split into two columns
  const half = Math.ceil(developers.length / 2);
  const firstColumn = developers.slice(0, half);
  const secondColumn = developers.slice(half);

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black border-t-2 border-gold/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Featured Developer Card - SQUARE */}
          <div className="col-span-4">
            <Link 
              to="/developers/emaar" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl aspect-square transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(200,167,102,0.3)]"
              style={{ perspective: '1000px' }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${menuDubaiSkyline})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
              <div className="absolute inset-0 border-2 border-gold/20 rounded-2xl group-hover:border-gold/50 transition-colors" />
              <div className="absolute top-4 right-4">
                <span className="bg-gradient-to-r from-gold to-gold-light text-black text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider">TOP DEVELOPER</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-gold text-xs font-bold tracking-[0.2em] uppercase mb-2">FEATURED</p>
                <h3 className="text-white text-lg font-bold mb-2">Emaar Properties</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">Dubai's most iconic developer</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  View All Projects
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Developer Lists */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Top Developers in Dubai
              </h4>
              <Link 
                to="/developers" 
                onClick={onClose}
                className="text-gold text-sm font-medium hover:text-gold-light transition-colors flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                View All Developers
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <div className="space-y-1">
                {firstColumn.map((dev) => (
                  <Link
                    key={dev.slug}
                    to={`/developers/${dev.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold/40 group-hover:bg-gold transition-colors shadow-[0_0_8px_rgba(200,167,102,0.3)]" />
                    <span className="font-medium text-sm">{dev.name}</span>
                  </Link>
                ))}
              </div>
              <div className="space-y-1">
                {secondColumn.map((dev) => (
                  <Link
                    key={dev.slug}
                    to={`/developers/${dev.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold/40 group-hover:bg-gold transition-colors shadow-[0_0_8px_rgba(200,167,102,0.3)]" />
                    <span className="font-medium text-sm">{dev.name}</span>
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

export default MegaMenuDevelopers;
