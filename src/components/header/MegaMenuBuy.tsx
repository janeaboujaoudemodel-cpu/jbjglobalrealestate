import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Calculator, Wrench, Star } from 'lucide-react';

interface MegaMenuBuyProps {
  onClose: () => void;
}

const MegaMenuBuy: React.FC<MegaMenuBuyProps> = ({ onClose }) => {
  const propertyTypes = [
    { label: 'Apartments', icon: Building2, href: '/properties?type=apartment&transaction=buy', emoji: '🏢' },
    { label: 'Villas', icon: Home, href: '/properties?type=villa&transaction=buy', emoji: '🏠' },
    { label: 'Townhouses', icon: Castle, href: '/properties?type=townhouse&transaction=buy', emoji: '🏘️' },
    { label: 'Penthouses', icon: Building, href: '/properties?type=penthouse&transaction=buy', emoji: '🌇' },
    { label: 'Commercial', icon: Briefcase, href: '/properties?type=commercial&transaction=buy', emoji: '🏛️' },
    { label: 'See All Properties', icon: Eye, href: '/properties?transaction=buy', emoji: '📋' },
  ];

  const buyerResources = [
    { label: "Buyer's Guide", href: '/buyer-guide', icon: FileText },
    { label: 'Mortgage Calculator', href: '/mortgage-calculator', icon: Calculator },
    { label: 'Signature by JBJ', href: '/signature-collection', icon: Star },
    { label: 'Snagging & Inspection', href: '/services/snagging', icon: Wrench },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-t-2 border-gold/40 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Card - Properties for Sale */}
          <div className="col-span-3">
            <Link 
              to="/properties?transaction=buy" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl h-full min-h-[280px]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-sm font-medium tracking-wider uppercase mb-2">Featured</p>
                <h3 className="text-white text-xl font-bold mb-2">Properties for Sale in Dubai</h3>
                <p className="text-white/70 text-sm mb-4">Discover luxury homes and investment opportunities</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore Now
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Signature Collection Card */}
          <div className="col-span-3">
            <Link 
              to="/signature-collection" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl h-full min-h-[280px]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className="bg-gold text-black text-xs font-bold px-3 py-1 rounded-full">EXCLUSIVE</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-sm font-medium tracking-wider uppercase mb-2">Signature Collection</p>
                <h3 className="text-white text-xl font-bold mb-2">Ultra-Premium Properties</h3>
                <p className="text-white/70 text-sm mb-4">Handpicked luxury estates by JBJ</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Explore Signature
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Properties by Type */}
          <div className="col-span-3">
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

          {/* Buyer Resources */}
          <div className="col-span-3">
            <h4 className="text-gold font-semibold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Buyer Resources
            </h4>
            <div className="space-y-1">
              {buyerResources.map((item) => (
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

export default MegaMenuBuy;
