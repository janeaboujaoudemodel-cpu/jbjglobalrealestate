import React from 'react';
import { ArrowRight, FileText, DollarSign, TrendingUp, ClipboardCheck } from 'lucide-react';
import sellPropertyBg from '@/assets/services/sell-property-bg.jpg';
import dubaiSellingVideo from '@/assets/videos/dubai-selling-hero.mp4';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuSellProps {
  onClose: () => void;
}

const MegaMenuSell = React.forwardRef<HTMLDivElement, MegaMenuSellProps>(({ onClose }, ref) => {
  const sellerResources = [
    { label: "Seller's Guide", href: '/seller-guide', icon: FileText },
    { label: 'Property Valuation', href: '/sell/valuation', icon: DollarSign },
    { label: 'Selling Advisory', href: '/services/selling-advisory', icon: TrendingUp },
    { label: 'Listing Portal', href: '/listing-portal', icon: ClipboardCheck },
  ];

  return (
    <MegaMenuShell ref={ref}>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Featured Photo with Video on Hover */}
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/listing-portal"
              onClick={onClose}
              image={sellPropertyBg}
              video={dubaiSellingVideo}
              kicker="SELL"
              title="List Your Property"
              description="List manually or use AI to create your listing — for sale or rent"
              cta="Go to Listing Portal"
            />
          </div>

          {/* Right: Links in Premium Cards */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <div className="grid grid-cols-1 gap-4">
              {/* Seller Resources */}
              <MegaMenuCard icon={FileText} title="Seller Resources">
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
              </MegaMenuCard>
            </div>
            
            {/* Full-width CTA Button at bottom */}
            <div className="mt-6">
              <MegaMenuCTAButton
                to="/listing-portal"
                onClick={onClose}
                icon={ArrowRight}
                title="Go to Listing Portal"
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