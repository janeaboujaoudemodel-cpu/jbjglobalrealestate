import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Key, Calendar } from 'lucide-react';

interface MegaMenuRentProps {
  onClose: () => void;
}

const MegaMenuRent: React.FC<MegaMenuRentProps> = ({ onClose }) => {
  const propertyTypes = [
    { label: 'Apartments', icon: Building2, href: '/properties?type=apartment&transaction=rent', emoji: '🏢' },
    { label: 'Villas', icon: Home, href: '/properties?type=villa&transaction=rent', emoji: '🏠' },
    { label: 'Townhouses', icon: Castle, href: '/properties?type=townhouse&transaction=rent', emoji: '🏘️' },
    { label: 'Penthouses', icon: Building, href: '/properties?type=penthouse&transaction=rent', emoji: '🌇' },
    { label: 'Commercial', icon: Briefcase, href: '/properties?type=commercial&transaction=rent', emoji: '🏛️' },
    { label: 'See All Properties', icon: Eye, href: '/properties?transaction=rent', emoji: '📋' },
  ];

  const tenantResources = [
    { label: "Tenant's Guide", href: '/tenant-guide', icon: FileText },
    { label: 'Property Management', href: '/services/property-management', icon: Key },
    { label: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-t-2 border-gold/40 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Card - Properties for Rent */}
          <div className="col-span-4">
            <Link 
              to="/properties?transaction=rent" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl h-full min-h-[260px]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-sm font-medium tracking-wider uppercase mb-2">Rentals</p>
                <h3 className="text-white text-xl font-bold mb-2">Properties for Rent in Dubai</h3>
                <p className="text-white/70 text-sm mb-4">Find your perfect home in Dubai's finest communities</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore Rentals
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Properties by Type */}
          <div className="col-span-4">
            <h4 className="text-gold font-semibold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Properties by Type
            </h4>
            <div className="space-y-1">
              {propertyTypes.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Tenant Resources */}
          <div className="col-span-4">
            <h4 className="text-gold font-semibold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Tenant Resources
            </h4>
            <div className="space-y-1">
              {tenantResources.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <item.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    </div>
  );
};

export default MegaMenuRent;
