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
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-t-4 border-gold shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Developer Card */}
          <div className="col-span-4">
            <Link 
              to="/developers/emaar" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl aspect-[4/3] transform transition-all duration-500 hover:scale-[1.02]"
              style={{ 
                perspective: '1000px',
                boxShadow: '0 20px 50px -15px rgba(0,0,0,0.4), 0 0 0 2px rgba(200,167,102,0.3)'
              }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${menuDubaiSkyline})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 border-2 border-gold/40 rounded-2xl group-hover:border-gold transition-colors" />
              <div className="absolute top-4 right-4">
                <span className="bg-gradient-to-r from-gold to-gold-light text-black text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider">TOP DEVELOPER</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-xs font-bold tracking-[0.25em] uppercase mb-2">FEATURED</p>
                <h3 className="text-white text-xl font-bold mb-2">Emaar Properties</h3>
                <p className="text-white/80 text-sm mb-4">Dubai's most iconic developer</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  View All Projects
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Developer Lists */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-5 pb-2 border-b border-gold/30">
              <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                Top Developers in Dubai
              </h4>
              <Link 
                to="/developers" 
                onClick={onClose}
                className="text-black text-sm font-medium hover:text-gold transition-colors flex items-center gap-1"
              >
                <Eye className="w-4 h-4 text-gold" />
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
                    className="flex items-center gap-3 py-2 px-3 rounded-xl text-black hover:text-white hover:bg-black transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold group-hover:bg-white transition-colors shadow-lg" />
                    <span className="font-medium text-sm group-hover:text-gold">{dev.name}</span>
                  </Link>
                ))}
              </div>
              <div className="space-y-1">
                {secondColumn.map((dev) => (
                  <Link
                    key={dev.slug}
                    to={`/developers/${dev.slug}`}
                    onClick={onClose}
                    className="flex items-center gap-3 py-2 px-3 rounded-xl text-black hover:text-white hover:bg-black transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold group-hover:bg-white transition-colors shadow-lg" />
                    <span className="font-medium text-sm group-hover:text-gold">{dev.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
    </div>
  );
};

export default MegaMenuDevelopers;
