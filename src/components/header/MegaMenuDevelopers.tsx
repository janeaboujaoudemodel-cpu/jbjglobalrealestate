import React from 'react';
import { Building2, Eye } from 'lucide-react';
import menuDubaiSkyline from '@/assets/menu-dubai-skyline.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuCard, MegaMenuCTAButton } from '@/components/header/mega-menu-primitives';

interface MegaMenuDevelopersProps {
  onClose: () => void;
}

const MegaMenuDevelopers = React.forwardRef<HTMLDivElement, MegaMenuDevelopersProps>(({ onClose }, ref) => {
  // Reduced list - top 12 developers for more compact menu
  const developers = [
    { name: 'Emaar Properties', slug: 'emaar' },
    { name: 'DAMAC Properties', slug: 'damac' },
    { name: 'Sobha Realty', slug: 'sobha' },
    { name: 'Nakheel Properties', slug: 'nakheel' },
    { name: 'Binghatti', slug: 'binghatti' },
    { name: 'Meraas', slug: 'meraas' },
    { name: 'Ellington Properties', slug: 'ellington' },
    { name: 'Azizi Developments', slug: 'azizi' },
    { name: 'Select Group', slug: 'select-group' },
    { name: 'Danube Properties', slug: 'danube' },
    { name: 'Dubai Properties', slug: 'dubai-properties' },
    { name: 'Aldar Properties', slug: 'aldar' },
  ];

  return (
    <MegaMenuShell ref={ref}>
      {/* Reduced padding for smaller menu */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Featured card - smaller height */}
          <div className="lg:col-span-5 flex">
            <MegaMenuFeaturedCard
              to="/developer/emaar"
              onClick={onClose}
              image={menuDubaiSkyline}
              kicker="DEVELOPERS"
              title="Emaar Properties"
              description="Dubai's most iconic developer"
              cta="View All Projects"
              className="flex-1 min-h-[260px] lg:min-h-[300px]"
            />
          </div>

          <div className="lg:col-span-7 lg:border-l lg:border-gold/30 lg:pl-8">
            {/* Single Premium Card for Developers */}
            <MegaMenuCard icon={Building2} title="Top Developers in Dubai">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                {developers.map((dev) => (
                  <MegaMenuIconLink
                    key={dev.slug}
                    to={`/developer/${dev.slug}`}
                    onClick={onClose}
                    icon={Building2}
                    title={dev.name}
                    compact
                  />
                ))}
              </div>
            </MegaMenuCard>
            
            {/* View All CTA */}
            <div className="mt-4">
              <MegaMenuCTAButton
                to="/developers"
                onClick={onClose}
                icon={Eye}
                title="View All Developers"
              />
            </div>
          </div>
        </div>
      </div>
    </MegaMenuShell>
  );
});

MegaMenuDevelopers.displayName = 'MegaMenuDevelopers';

export default MegaMenuDevelopers;