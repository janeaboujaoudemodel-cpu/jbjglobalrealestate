import React from 'react';
import { 
  Calculator, Handshake, Coins, FileText, Key, Home, 
  Wrench, Calendar, ClipboardCheck, Award, Building2, Globe, Eye
} from 'lucide-react';
import servicesHero from '@/assets/property-consultation.png';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';

interface MegaMenuServicesProps {
  onClose: () => void;
}

const MegaMenuServices = React.forwardRef<HTMLDivElement, MegaMenuServicesProps>(({ onClose }, ref) => {
  const services = [
    { name: 'Snagging & Inspection', href: '/services/snagging', icon: ClipboardCheck, description: 'Handover inspections' },
    { name: 'Property Management', href: '/services/property-management', icon: Key, description: 'Full management services' },
    { name: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar, description: 'Holiday home management' },
    { name: 'Currency Exchange', href: '/services/currency-exchange', icon: Coins, description: 'Best exchange rates' },
    { name: 'Concierge Services', href: '/services/concierge', icon: Handshake, description: 'Convenience coordination' },
    { name: 'Company Setup', href: '/services/company-setup', icon: Building2, description: 'Start your UAE business' },
    { name: 'Signature Collection', href: '/services/signature-collection', icon: FileText, description: 'Document signing' },
    { name: 'AI Tools & Calculators', href: '/services/ai-tools', icon: Calculator, description: 'AI-powered tools' },
    { name: 'Broker Certification', href: '/services/broker-certification', icon: Award, description: 'Internal program' },
    { name: 'Complaint Procedures', href: '/services/complaint-procedures', icon: ClipboardCheck, description: 'Raise issues' },
    { name: 'Happiness Center', href: '/services/customer-happiness-center', icon: Globe, description: 'Support center' },
    { name: 'Testimonials', href: '/services/testimonials', icon: Home, description: 'Client feedback' },
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
              description="Mortgages, Golden Visa, conveyancing, management and more"
              cta="View All Services"
              className="w-full"
            />
          </div>

          {/* Right: Links (with divider) */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <MegaMenuSectionTitle
              icon={Wrench}
              title="Our Services"
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
            
            {/* View All - emphasized */}
            <div className="mt-3">
              <MegaMenuIconLink
                to="/services"
                onClick={onClose}
                icon={Eye}
                title="View All Services"
                compact
                emphasis
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
