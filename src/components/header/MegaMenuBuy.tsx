import React from 'react';
import { Building2, Home, Castle, Building, Briefcase, Eye, FileText, Calculator, Wrench, Star } from 'lucide-react';
import menuLuxuryPenthouse from '@/assets/menu-luxury-penthouse.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';

interface MegaMenuBuyProps {
  onClose: () => void;
}

const MegaMenuBuy: React.FC<MegaMenuBuyProps> = ({ onClose }) => {
  const propertyTypes = [
    { label: 'Apartments', icon: Building2, href: '/properties?type=apartment&transaction=buy' },
    { label: 'Villas', icon: Home, href: '/properties?type=villa&transaction=buy' },
    { label: 'Townhouses', icon: Castle, href: '/properties?type=townhouse&transaction=buy' },
    { label: 'Penthouses', icon: Building, href: '/properties?type=penthouse&transaction=buy' },
    { label: 'Commercial', icon: Briefcase, href: '/properties?type=commercial&transaction=buy' },
    { label: 'See All Properties', icon: Eye, href: '/properties?transaction=buy' },
  ];

  const buyerResources = [
    { label: "Buyer's Guide", href: '/buyer-guide', icon: FileText },
    { label: 'Mortgage Calculator', href: '/mortgage-calculator', icon: Calculator },
    { label: 'Signature by JBJ', href: '/signature-collection', icon: Star },
    { label: 'Snagging & Inspection', href: '/services/snagging', icon: Wrench },
  ];

  return (
    <MegaMenuShell>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Featured Photo (larger + rectangular) */}
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/properties?transaction=buy"
              onClick={onClose}
              image={menuLuxuryPenthouse}
              kicker="BUY"
              title="Properties for Sale"
              description="Discover luxury homes and investment opportunities in Dubai"
              cta="Explore Now"
            />
          </div>

          {/* Right: Links (with divider) */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <MegaMenuSectionTitle icon={Building2} title="Properties by Type" />
                <div className="space-y-1">
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
              </div>

              <div>
                <MegaMenuSectionTitle icon={FileText} title="Buyer Resources" />
                <div className="space-y-1">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
};

export default MegaMenuBuy;
