import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, Handshake, Coins, FileText, Key, Home, 
  Wrench, Calendar, ClipboardCheck, Award, Building2, Globe, ArrowRight
} from 'lucide-react';

interface MegaMenuServicesProps {
  onClose: () => void;
}

const MegaMenuServices: React.FC<MegaMenuServicesProps> = ({ onClose }) => {
  const services = [
    { name: 'Mortgages', href: '/mortgage-calculator', icon: Calculator, description: 'Find the best rates' },
    { name: 'Golden Visa', href: '/guides/golden-visa-uae', icon: Award, description: 'UAE residency program' },
    { name: 'Currency Exchange', href: '/services/currency-exchange', icon: Coins, description: 'Best exchange rates' },
    { name: 'Conveyancing', href: '/services/conveyancing', icon: FileText, description: 'Legal property transfer' },
    { name: 'Property Management', href: '/services/property-management', icon: Key, description: 'Full management services' },
    { name: 'List Your Property', href: '/seller-listing', icon: Home, description: 'Sell or rent your property' },
    { name: 'Property Snagging', href: '/services/snagging', icon: ClipboardCheck, description: 'Quality inspections' },
    { name: 'Property Evaluation', href: '/property-evaluator', icon: Calculator, description: 'AI-powered valuation' },
    { name: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar, description: 'Holiday home management' },
    { name: 'Partner Program', href: '/partners', icon: Handshake, description: 'Join our network' },
    { name: 'Company Setup', href: '/services/company-setup', icon: Building2, description: 'Start your UAE business' },
    { name: 'Plots & Land', href: '/properties?type=plot', icon: Globe, description: 'Land investments' },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black border-t-2 border-gold/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Our Services
          </h4>
          <Link 
            to="/services" 
            onClick={onClose}
            className="text-gold text-sm font-medium hover:text-gold-light transition-colors flex items-center gap-1"
          >
            View All Services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Services Grid - Premium Cards */}
        <div className="grid grid-cols-4 gap-4">
          {services.map((service) => (
            <Link
              key={service.name}
              to={service.href}
              onClick={onClose}
              className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-gold/20 rounded-2xl p-4 hover:border-gold/50 hover:bg-gold/10 transition-all transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(200,167,102,0.2)]"
            >
              <div className="flex items-start gap-3">
                {/* Icon Badge */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center group-hover:from-gold/40 group-hover:to-gold/20 transition-all shadow-lg">
                  <service.icon className="w-5 h-5 text-gold" />
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
                <ArrowRight className="w-4 h-4 text-gold" />
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Bottom gold accent with 3D effect */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_-5px_20px_rgba(200,167,102,0.3)]" />
    </div>
  );
};

export default MegaMenuServices;
