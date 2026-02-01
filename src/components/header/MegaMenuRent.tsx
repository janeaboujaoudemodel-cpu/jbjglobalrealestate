import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Key, Calendar, ArrowRight } from 'lucide-react';
import menuLuxuryVilla from '@/assets/menu-luxury-villa.jpg';

interface MegaMenuRentProps {
  onClose: () => void;
}

const MegaMenuRent: React.FC<MegaMenuRentProps> = ({ onClose }) => {
  const propertyTypes = [
    { label: 'Apartments', icon: Building2, href: '/properties?type=apartment&transaction=rent' },
    { label: 'Villas', icon: Home, href: '/properties?type=villa&transaction=rent' },
    { label: 'Townhouses', icon: Castle, href: '/properties?type=townhouse&transaction=rent' },
    { label: 'Penthouses', icon: Building, href: '/properties?type=penthouse&transaction=rent' },
    { label: 'Commercial', icon: Briefcase, href: '/properties?type=commercial&transaction=rent' },
    { label: 'See All Properties', icon: Eye, href: '/properties?transaction=rent' },
  ];

  const tenantResources = [
    { label: "Tenant's Guide", href: '/tenant-guide', icon: FileText },
    { label: 'Property Management', href: '/services/property-management', icon: Key },
    { label: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black border-t-2 border-gold/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Featured Card - Properties for Rent - SQUARE */}
          <div className="col-span-4">
            <Link 
              to="/properties?transaction=rent" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl aspect-square transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(200,167,102,0.3)]"
              style={{ perspective: '1000px' }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${menuLuxuryVilla})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
              <div className="absolute inset-0 border-2 border-gold/20 rounded-2xl group-hover:border-gold/50 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-gold text-xs font-bold tracking-[0.2em] uppercase mb-2">RENTALS</p>
                <h3 className="text-white text-lg font-bold mb-2">Properties for Rent</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">Find your perfect home in Dubai's finest communities</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore Rentals
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Properties by Type */}
          <div className="col-span-4">
            <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Properties by Type
            </h4>
            <div className="space-y-1">
              {propertyTypes.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 group-hover:border-gold/50 transition-all shadow-lg">
                    <item.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Tenant Resources */}
          <div className="col-span-4">
            <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase mb-5 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tenant Resources
            </h4>
            <div className="space-y-1">
              {tenantResources.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 group-hover:border-gold/50 transition-all shadow-lg">
                    <item.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent with 3D effect */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_-5px_20px_rgba(200,167,102,0.3)]" />
    </div>
  );
};

export default MegaMenuRent;
