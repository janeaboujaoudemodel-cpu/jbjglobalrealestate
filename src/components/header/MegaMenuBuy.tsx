import React from 'react';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Calculator, Wrench, Star } from 'lucide-react';
import menuLuxuryPenthouse from '@/assets/menu-luxury-penthouse.jpg';
import dubaiBuyingVideoAsset from '@/assets/videos/dubai-buying-hero.mp4.asset.json';
const dubaiBuyingVideo = dubaiBuyingVideoAsset.url;
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSection, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left: Featured Photo with Video on Hover */}
          <div className="lg:col-span-6 lg:pr-8">
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

          {/* Right: Sections with dividers, no card borders */}
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
                <MegaMenuSection icon={FileText} title="Buyer Resources">
                  {buyerResources.map((item) => (
                    <MegaMenuIconLink key={item.label} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
                  ))}
                </MegaMenuSection>
              </div>
            </div>
            
            {/* Full-width CTA Button at bottom */}
            <div className="mt-4 px-2.5">
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