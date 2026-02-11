import React from 'react';
import { 
  Calculator, Handshake, Coins, FileText, Key, Home, 
  Wrench, Calendar, ClipboardCheck, Award, Building2, Globe, Eye
} from 'lucide-react';
import servicesHero from '@/assets/property-consultation.png';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuServicesProps {
  onClose: () => void;
}

const MegaMenuServices = React.forwardRef<HTMLDivElement, MegaMenuServicesProps>(({ onClose }, ref) => {
  const coreServices = [
    { name: 'Snagging & Inspection', href: '/services/snagging', icon: ClipboardCheck },
    { name: 'Property Management', href: '/services/property-management', icon: Key },
    { name: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar },
    { name: 'Currency Exchange', href: '/services/currency-exchange', icon: Coins },
    { name: 'Concierge Services', href: '/services/concierge', icon: Handshake },
    { name: 'Company Setup', href: '/services/company-setup', icon: Building2 },
  ];

  const additionalServices = [
    { name: 'Signature Collection', href: '/services/signature-collection', icon: FileText },
    { name: 'AI Tools & Calculators', href: '/services/ai-tools', icon: Calculator },
    { name: 'Broker Certification', href: '/services/broker-certification', icon: Award },
    { name: 'Complaint Procedures', href: '/services/complaint-procedures', icon: ClipboardCheck },
    { name: 'Happiness Center', href: '/services/customer-happiness-center', icon: Globe },
    { name: 'Testimonials', href: '/services/testimonials', icon: Home },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Featured Photo - vertically centered */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <MegaMenuFeaturedCard
              to="/services"
              onClick={onClose}
              image={servicesHero}
              kicker="SERVICES"
              title="Representation & Services"
              description="Mortgages, Golden Visa advisory, conveyancing, management and more"
              cta="View All Services"
              className="w-full"
            />
          </div>

          {/* Right: Links in Premium Cards */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Core Services */}
              <MegaMenuCard icon={Wrench} title="Core Services">
                {coreServices.map((service) => (
                  <MegaMenuIconLink
                    key={service.name}
                    to={service.href}
                    onClick={onClose}
                    icon={service.icon}
                    title={service.name}
                    compact
                  />
                ))}
              </MegaMenuCard>

              {/* Card 2: Additional Services */}
              <MegaMenuCard icon={Globe} title="More Services">
                {additionalServices.map((service) => (
                  <MegaMenuIconLink
                    key={service.name}
                    to={service.href}
                    onClick={onClose}
                    icon={service.icon}
                    title={service.name}
                    compact
                  />
                ))}
              </MegaMenuCard>
            </div>
            
            {/* View All CTA */}
            <div className="mt-4">
              <MegaMenuCTAButton
                to="/services"
                onClick={onClose}
                icon={Eye}
                title="View All Services"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuServices.displayName = 'MegaMenuServices';

export default MegaMenuServices;