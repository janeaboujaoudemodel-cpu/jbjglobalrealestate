import React from 'react';
import { ArrowRight, FileText, DollarSign, TrendingUp, ClipboardCheck } from 'lucide-react';
import sellPropertyBg from '@/assets/services/sell-property-bg.jpg';
import dubaiSellingVideoAsset from '@/assets/videos/dubai-selling-hero.mp4.asset.json';
const dubaiSellingVideo = dubaiSellingVideoAsset.url;
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSection, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Left: Featured Photo with Video on Hover */}
          <div className="lg:col-span-6 lg:pr-8">
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

          {/* Right: Section with divider */}
          <div className="lg:col-span-6 lg:border-l lg:border-[#B89555]/30 lg:pl-2 border-t lg:border-t-0 border-[#B89555]/30 mt-6 lg:mt-0 pt-6 lg:pt-0">
            <MegaMenuSection icon={FileText} title="Seller Resources">
              {sellerResources.map((item) => (
                <MegaMenuIconLink key={item.label} to={item.href} onClick={onClose} icon={item.icon} title={item.label} compact />
              ))}
            </MegaMenuSection>
            
            <div className="mt-4 px-2.5">
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