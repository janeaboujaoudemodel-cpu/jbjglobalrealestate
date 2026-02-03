import React from 'react';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Key, Calendar, Shield } from 'lucide-react';
import menuLuxuryVilla from '@/assets/menu-luxury-villa.jpg';
import dubaiRentalVideo from '@/assets/videos/dubai-rental-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuRentProps {
  onClose: () => void;
}

const MegaMenuRent = React.forwardRef<HTMLDivElement, MegaMenuRentProps>(({ onClose }, ref) => {
  const propertyTypes = [
    { label: 'Apartments', icon: Building2, href: '/properties?type=apartment&transaction=rent' },
    { label: 'Villas', icon: Home, href: '/properties?type=villa&transaction=rent' },
    { label: 'Townhouses', icon: Castle, href: '/properties?type=townhouse&transaction=rent' },
    { label: 'Penthouses', icon: Building, href: '/properties?type=penthouse&transaction=rent' },
    { label: 'Commercial', icon: Briefcase, href: '/properties?type=commercial&transaction=rent' },
  ];

  const renterResources = [
    { label: "Tenant's Guide", href: '/tenant-guide', icon: FileText },
    { label: 'Rental Index', href: '/dubai-rental-index', icon: Key },
    { label: 'Property Management', href: '/services/property-management', icon: Shield },
    { label: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/properties?transaction=rent"
              onClick={onClose}
              image={menuLuxuryVilla}
              video={dubaiRentalVideo}
              kicker="RENT"
              title="Properties for Rent"
              description="Find your perfect rental home in Dubai's finest communities"
              cta="Explore Rentals"
            />
          </div>

          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Column 1: Properties by Type */}
              <div className="relative flex flex-col">
                <MegaMenuSectionTitle icon={Building2} title="Properties by Type" />
                <div className="space-y-1 min-h-[180px]">
                  {propertyTypes.map((item) => (
                    <MegaMenuIconLink
                      key={item.label}
                      to={item.href}
                      onClick={onClose}
                      icon={item.icon}
                      title={item.label}
                      compact
                    />
                  ))}
                </div>
                {/* Vertical divider between columns */}
                <div className="hidden sm:block absolute top-0 -right-3 h-full w-px bg-gradient-to-b from-transparent via-gold/40 to-transparent" />
              </div>

              {/* Column 2: Renter Resources */}
              <div className="flex flex-col">
                <MegaMenuSectionTitle icon={FileText} title="Renter Resources" />
                <div className="space-y-1 min-h-[180px]">
                  {renterResources.map((item) => (
                    <MegaMenuIconLink
                      key={item.label}
                      to={item.href}
                      onClick={onClose}
                      icon={item.icon}
                      title={item.label}
                      compact
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Full-width CTA Button at bottom */}
            <div className="mt-6">
              <MegaMenuCTAButton
                to="/properties?transaction=rent"
                onClick={onClose}
                icon={Eye}
                title="See All Rentals"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuRent.displayName = 'MegaMenuRent';

export default MegaMenuRent;
