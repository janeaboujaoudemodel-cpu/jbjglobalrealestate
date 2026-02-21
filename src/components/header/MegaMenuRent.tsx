import React from 'react';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Key, Calendar, Shield, ClipboardCheck } from 'lucide-react';
import menuLuxuryVilla from '@/assets/menu-luxury-villa.jpg';
import dubaiRentalVideo from '@/assets/videos/dubai-rental-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

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
    { label: 'Rental Index', href: '/rental-index', icon: Key },
    { label: 'Property Management', href: '/services/property-management', icon: Shield },
    { label: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar },
    { label: 'List Your Rental', href: '/listing-portal/submit', icon: ClipboardCheck },
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

          {/* Right: Links in Premium Cards */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card 1: Properties by Type */}
              <MegaMenuCard icon={Building2} title="Properties by Type">
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
              </MegaMenuCard>

              {/* Card 2: Renter Resources */}
              <MegaMenuCard icon={FileText} title="Renter Resources">
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
              </MegaMenuCard>
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