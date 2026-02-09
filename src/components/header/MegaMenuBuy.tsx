import React from 'react';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Calculator, Wrench, Star } from 'lucide-react';
import menuLuxuryPenthouse from '@/assets/menu-luxury-penthouse.jpg';
import dubaiBuyingVideo from '@/assets/videos/dubai-buying-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuBuyProps {
  onClose: () => void;
}

const MegaMenuBuy = React.forwardRef<HTMLDivElement, MegaMenuBuyProps>(({ onClose }, ref) => {
  const propertyTypes = [
    { label: 'Apartments', icon: Building2, href: '/properties?type=apartment&transaction=buy' },
    { label: 'Villas', icon: Home, href: '/properties?type=villa&transaction=buy' },
    { label: 'Townhouses', icon: Castle, href: '/properties?type=townhouse&transaction=buy' },
    { label: 'Penthouses', icon: Building, href: '/properties?type=penthouse&transaction=buy' },
    { label: 'Commercial', icon: Briefcase, href: '/properties?type=commercial&transaction=buy' },
  ];

  const buyerResources = [
    { label: "Buyer's Guide", href: '/buyer-guide', icon: FileText },
    { label: 'Mortgage Calculator', href: '/mortgage-calculator', icon: Calculator },
    { label: 'Signature by JBJ', href: '/signature-collection', icon: Star },
    { label: 'Snagging & Inspection', href: '/services/snagging', icon: Wrench },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Featured Photo with Video on Hover */}
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/properties?transaction=buy"
              onClick={onClose}
              image={menuLuxuryPenthouse}
              video={dubaiBuyingVideo}
              kicker="BUY"
              title="Properties for Sale"
              description="Discover luxury homes and investment opportunities in Dubai"
              cta="Explore Now"
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

              {/* Card 2: Buyer Resources */}
              <MegaMenuCard icon={FileText} title="Buyer Resources">
                {buyerResources.map((item) => (
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
                to="/properties?transaction=buy"
                onClick={onClose}
                icon={Eye}
                title="See All Properties"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuBuy.displayName = 'MegaMenuBuy';

export default MegaMenuBuy;