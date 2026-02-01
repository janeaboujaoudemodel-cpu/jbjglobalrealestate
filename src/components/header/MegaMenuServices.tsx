import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, Handshake, Coins, FileText, Key, Home, 
  Wrench, Calendar, ClipboardCheck, Award, Building2, Globe 
} from 'lucide-react';

interface MegaMenuServicesProps {
  onClose: () => void;
}

const MegaMenuServices: React.FC<MegaMenuServicesProps> = ({ onClose }) => {
  const services = [
    { name: 'Mortgages', href: '/mortgage-calculator', icon: Calculator, emoji: '🏦', description: 'Find the best rates' },
    { name: 'Golden Visa', href: '/guides/golden-visa-uae', icon: Award, emoji: '🪙', description: 'UAE residency program' },
    { name: 'Currency Exchange', href: '/services/currency-exchange', icon: Coins, emoji: '💱', description: 'Best exchange rates' },
    { name: 'Conveyancing', href: '/services/conveyancing', icon: FileText, emoji: '📜', description: 'Legal property transfer' },
    { name: 'Property Management', href: '/services/property-management', icon: Key, emoji: '🔑', description: 'Full management services' },
    { name: 'List Your Property', href: '/seller-listing', icon: Home, emoji: '🏠', description: 'Sell or rent your property' },
    { name: 'Property Snagging', href: '/services/snagging', icon: ClipboardCheck, emoji: '🔍', description: 'Quality inspections' },
    { name: 'Property Evaluation', href: '/property-evaluator', icon: Calculator, emoji: '📊', description: 'AI-powered valuation' },
    { name: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar, emoji: '📅', description: 'Holiday home management' },
    { name: 'Partner Program', href: '/partners', icon: Handshake, emoji: '🤝', description: 'Join our network' },
    { name: 'Company Setup', href: '/services/company-setup', icon: Building2, emoji: '🏢', description: 'Start your UAE business' },
    { name: 'Plots & Land', href: '/properties?type=plot', icon: Globe, emoji: '🌍', description: 'Land investments' },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-t-2 border-gold/40 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-gold font-semibold text-sm tracking-wider uppercase flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Our Services
          </h4>
          <Link 
            to="/services" 
            onClick={onClose}
            className="text-gold text-sm font-medium hover:text-gold-light transition-colors"
          >
            View All Services →
          </Link>
        </div>

        {/* Services Grid - Cards with Photos and Emojis */}
        <div className="grid grid-cols-4 gap-4">
          {services.map((service) => (
            <Link
              key={service.name}
              to={service.href}
              onClick={onClose}
              className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-gold/20 rounded-2xl p-4 hover:border-gold/50 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Emoji Badge */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                  {service.emoji}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h5 className="text-white font-semibold text-sm group-hover:text-gold transition-colors">
                    {service.name}
                  </h5>
                  <p className="text-white/50 text-xs mt-1 line-clamp-1">
                    {service.description}
                  </p>
                </div>
              </div>
              
              {/* Hover Arrow */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-gold text-sm">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    </div>
  );
};

export default MegaMenuServices;
