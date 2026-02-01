import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, Handshake, Coins, FileText, Key, Home, 
  Wrench, Calendar, ClipboardCheck, Award, Building2, Globe, ArrowRight
} from 'lucide-react';
import servicesHero from '@/assets/property-consultation.png';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';

interface MegaMenuServicesProps {
  onClose: () => void;
}

const MegaMenuServices = React.forwardRef<HTMLDivElement, MegaMenuServicesProps>(({ onClose }, ref) => {
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
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Featured Photo */}
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/services"
              onClick={onClose}
              image={servicesHero}
              kicker="SERVICES"
              title="Representation & Services"
              description="Mortgages, Golden Visa, conveyancing, management and more"
              cta="View All Services"
            />
          </div>

          {/* Right: Links (with divider) */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <MegaMenuSectionTitle
              icon={Wrench}
              title="Our Services"
              rightSlot={
                <Link
                  to="/services"
                  onClick={onClose}
                  className="text-black text-sm font-medium hover:text-gold transition-colors flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {services.map((service) => (
                <MegaMenuIconLink
                  key={service.name}
                  to={service.href}
                  onClick={onClose}
                  icon={service.icon}
                  title={service.name}
                  description={service.description}
                  compact
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuServices.displayName = 'MegaMenuServices';

export default MegaMenuServices;
