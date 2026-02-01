import React from 'react';
import { BookOpen, BarChart3 } from 'lucide-react';
import menuCorporateOffice from '@/assets/menu-corporate-office.jpg';
import {
  MegaMenuFeaturedCard,
  MegaMenuIconLink,
  MegaMenuShell,
  MegaMenuSectionTitle,
} from '@/components/header/mega-menu-primitives';

interface MegaMenuMoreProps {
  onClose: () => void;
}

const MegaMenuMore: React.FC<MegaMenuMoreProps> = ({ onClose }) => {
  // User requirement: "More" must only show hub links (no deep pages).
  const hubLinks = [
    {
      label: 'Guides',
      href: '/guides',
      icon: BookOpen,
      description: 'Browse our full guides library (books + chapters)'
    },
    {
      label: 'Market Intelligence',
      href: '/market-intelligence',
      icon: BarChart3,
      description: 'Market overview, area intelligence, and reports'
    },
  ];

  return (
    <MegaMenuShell>
      <div className="max-w-[1560px] mx-auto px-8 lg:px-12 py-10 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Featured photo (integrated) */}
          <div className="lg:col-span-6">
            <MegaMenuFeaturedCard
              to="/guides"
              onClick={onClose}
              image={menuCorporateOffice}
              kicker="MORE"
              title="Guides & Market Intelligence"
              description="Navigate our knowledge library and data-driven market insights."
              cta="Open Library"
            />
          </div>

          {/* Right: Hub links ONLY (no deep pages) */}
          <div className="lg:col-span-6 lg:border-l lg:border-gold/30 lg:pl-10">
            <MegaMenuSectionTitle icon={BookOpen} title="Library" />
            <div className="space-y-2">
              {hubLinks.map((item) => (
                <MegaMenuIconLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  icon={item.icon}
                  title={item.label}
                  description={item.description}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
};

export default MegaMenuMore;
