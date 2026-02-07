import React from 'react';
import { Building2, Home, Castle, Building, Briefcase, ArrowRight, FileText, DollarSign, TrendingUp, ClipboardCheck } from 'lucide-react';
import sellPropertyBg from '@/assets/services/sell-property-bg.jpg';
import dubaiSellingVideo from '@/assets/videos/dubai-selling-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuSellProps {
  onClose: () => void;
}

const MegaMenuSell = React.forwardRef<HTMLDivElement, MegaMenuSellProps>(({ onClose }, ref) => {
  const propertyTypes = [
    { label: 'Apartments', icon: Building2, href: '/seller-listing?type=apartment' },
    { label: 'Villas', icon: Home, href: '/seller-listing?type=villa' },
    { label: 'Townhouses', icon: Castle, href: '/seller-listing?type=townhouse' },
    { label: 'Penthouses', icon: Building, href: '/seller-listing?type=penthouse' },
    { label: 'Commercial', icon: Briefcase, href: '/seller-listing?type=commercial' },
  ];

  const sellerResources = [
    { label: "Seller's Guide", href: '/seller-guide', icon: FileText },
    { label: 'Property Valuation', href: '/sell/valuation', icon: DollarSign },
    { label: 'Selling Advisory', href: '/services/selling-advisory', icon: TrendingUp },
    { label: 'List Your Property', href: '/seller-listing', icon: ClipboardCheck },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Featured Photo with Video on Hover */}
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/seller-listing"
              onClick={onClose}
              image={sellPropertyBg}
              video={dubaiSellingVideo}
              kicker="SELL"
              title="Sell Your Property"
              description="Partner with Dubai's trusted real estate experts to sell your property at the best price"
              cta="Get Started"
            />
          </div>

          {/* Right: Links (with divider) */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Column 1: What You Can Sell */}
              <div className="relative flex flex-col">
                <MegaMenuSectionTitle icon={Building2} title="What You Can Sell" />
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

              {/* Column 2: Seller Resources */}
              <div className="flex flex-col">
                <MegaMenuSectionTitle icon={FileText} title="Seller Resources" />
                <div className="space-y-1 min-h-[180px]">
                  {sellerResources.map((item) => (
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
                to="/seller-listing"
                onClick={onClose}
                icon={ArrowRight}
                title="Start Selling Your Property"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuSell.displayName = 'MegaMenuSell';

export default MegaMenuSell;
