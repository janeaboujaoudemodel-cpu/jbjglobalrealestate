import React from 'react';
import { 
  Calculator, Handshake, Coins, FileText, Key, Home, 
  Wrench, Calendar, ClipboardCheck, Award, Building2, Globe, Eye, TrendingUp
} from 'lucide-react';
import servicesHero from '@/assets/property-consultation.png';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSection, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

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
    { name: 'Property Valuation', href: '/sell/valuation', icon: Calculator },
    { name: 'Rental Index', href: '/rental-index', icon: TrendingUp },
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          {/* Left: Featured Photo */}
          <div className="lg:col-span-6 flex items-center justify-center lg:pr-8">
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

          {/* Right: Sections with dividers */}
          <div className="lg:col-span-6 lg:border-l lg:border-[#B89555]/30 lg:pl-2 border-t lg:border-t-0 border-[#B89555]/30 mt-6 lg:mt-0 pt-6 lg:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              <div className="sm:border-r sm:border-[#B89555]/30">
                <MegaMenuSection icon={Wrench} title="Core Services">
                  {coreServices.map((service) => (
                    <MegaMenuIconLink key={service.name} to={service.href} onClick={onClose} icon={service.icon} title={service.name} compact />
                  ))}
                </MegaMenuSection>
              </div>

              <div className="border-t sm:border-t-0 border-[#B89555]/30">
                <MegaMenuSection icon={Globe} title="More Services">
                  {additionalServices.map((service) => (
                    <MegaMenuIconLink key={service.name} to={service.href} onClick={onClose} icon={service.icon} title={service.name} compact />
                  ))}
                </MegaMenuSection>
              </div>
            </div>
            
            <div className="mt-4 px-2.5">
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