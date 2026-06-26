import React from 'react';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Key, Calendar, Shield, ClipboardCheck } from 'lucide-react';
import menuLuxuryVilla from '@/assets/menu-luxury-villa.jpg';
import dubaiRentalVideoAsset from '@/assets/videos/dubai-rental-hero.mp4.asset.json';
const dubaiRentalVideo = dubaiRentalVideoAsset.url;
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSection, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

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

  const rentalResources = [
    { label: "Tenant's Guide", href: '/tenant-guide', icon: FileText },
    { label: 'Rental Index', href: '/rental-index', icon: Key },
    { label: 'Property Management', href: '/services/property-management', icon: Shield },
    { label: 'Short-term Rentals', href: '/services/short-term-rentals', icon: Calendar },
    { label: 'List Your Rental', href: '/listing-portal', icon: ClipboardCheck },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          <div className="lg:col-span-6 lg:pr-8">
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

          {/* Right: Sections with dividers */}
          <div className="lg:col-span-6 lg:border-l lg:border-[#B89555]/30 lg:pl-2 border-t lg:border-t-0 border-[#B89555]/30 mt-6 lg:mt-0 pt-6 lg:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              <div className="sm:border-r sm:border-[#B89555]/30">
                <MegaMenuSection icon={Building2} title="Properties by Type">
                  {propertyTypes.map((item) => (
                    <MegaMenuIconLink key={item.label} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                  ))}
                </MegaMenuSection>
              </div>

              <div className="border-t sm:border-t-0 border-[#B89555]/30">
                <MegaMenuSection icon={FileText} title="Rental Resources">
                  {rentalResources.map((item) => (
                    <MegaMenuIconLink key={item.label} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                  ))}
                </MegaMenuSection>
              </div>
            </div>
            
            <div className="mt-4 px-2.5">
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