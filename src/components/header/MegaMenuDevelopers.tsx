import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye } from 'lucide-react';

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
    { name: 'MAG', slug: 'mag' },
    { name: 'Aldar Properties', slug: 'aldar' },
    { name: 'Ellington Properties', slug: 'ellington' },
    { name: 'H&H Development', slug: 'hh-development' },
    { name: 'Omniyat', slug: 'omniyat' },
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
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-t-2 border-gold/40 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Developer Card */}
          <div className="col-span-4">
            <Link 
              to="/developers/emaar" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl h-full min-h-[300px]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className="bg-gold text-black text-xs font-bold px-3 py-1 rounded-full">TOP DEVELOPER</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-sm font-medium tracking-wider uppercase mb-2">Featured</p>
                <h3 className="text-white text-xl font-bold mb-2">Emaar Properties</h3>
                <p className="text-white/70 text-sm mb-4">Dubai's most iconic developer</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  View All Projects
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Developer Lists */}
          <div className="col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-gold font-semibold text-sm tracking-wider uppercase flex items-center gap-2">
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
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
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
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                  >
                    <div className="w-2 h-2 rounded-full bg-gold/40 group-hover:bg-gold transition-colors" />
                    <span className="font-medium text-sm">{dev.name}</span>
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

export default MegaMenuDevelopers;
