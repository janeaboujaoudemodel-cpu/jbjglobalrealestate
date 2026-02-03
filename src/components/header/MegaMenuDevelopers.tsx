import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Eye, ArrowRight } from 'lucide-react';
import menuDubaiSkyline from '@/assets/menu-dubai-skyline.jpg';
import { MegaMenuFeaturedCard, MegaMenuIconLink, MegaMenuShell, MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';

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

  // Build links with correct route pattern: /developer/:slug (singular)

  // Split into two columns
  const half = Math.ceil(developers.length / 2);
  const firstColumn = developers.slice(0, half);
  const secondColumn = developers.slice(half);

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
            <MegaMenuSectionTitle
              icon={Building2}
              title="Top Developers in Dubai"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
              {firstColumn.map((dev) => (
                <MegaMenuIconLink
                  key={dev.slug}
                  to={`/developer/${dev.slug}`}
                  onClick={onClose}
                  icon={Building2}
                  title={dev.name}
                  compact
                />
              ))}
              {secondColumn.map((dev) => (
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
            
            {/* View All - emphasized */}
            <div className="mt-3">
              <MegaMenuIconLink
                to="/developers"
                onClick={onClose}
                icon={Eye}
                title="View All Developers"
                compact
                emphasis
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
